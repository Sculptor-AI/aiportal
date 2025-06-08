import { v4 as uuidv4 } from 'uuid';
import { 
  ResearchTask, 
  ResearchRequest, 
  AgentStatus, 
  Source, 
  DynamicAgentConfig,
  ResponseType
} from '../types';
import { 
  runResearchAgent, 
  synthesizeReport, 
  determineAgentConfiguration 
} from './geminiService';
import { 
  AGENT_PROFILES, 
  MAX_AGENTS_MANUAL, 
  MAX_AGENTS_GO_DEEPER, 
  DEFAULT_AUTO_AGENTS_FALLBACK, 
  GO_DEEPER_AGENT_TEMPERATURE, 
  GO_DEEPER_AGENT_FOCUS_PROMPT,
  MAX_CONCURRENT_RESEARCH_TASKS,
  TASK_CLEANUP_INTERVAL_MS,
  COMPLETED_TASK_RETENTION_MS
} from '../constants';

class TaskManager {
  private tasks: Map<string, ResearchTask> = new Map();
  private activeTasks: Set<string> = new Set();

  constructor() {
    // Clean up old tasks periodically
    setInterval(() => {
      this.cleanupOldTasks();
    }, TASK_CLEANUP_INTERVAL_MS);
  }

  public createTask(request: ResearchRequest): string {
    if (this.activeTasks.size >= MAX_CONCURRENT_RESEARCH_TASKS) {
      throw new Error(`Maximum number of concurrent tasks (${MAX_CONCURRENT_RESEARCH_TASKS}) reached. Please try again later.`);
    }

    const taskId = uuidv4();
    const task: ResearchTask = {
      id: taskId,
      request,
      status: 'started',
      progress: 0,
      agentStatuses: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.tasks.set(taskId, task);
    this.activeTasks.add(taskId);

    // Start processing the task asynchronously
    this.processTask(taskId).catch(error => {
      console.error(`Error processing task ${taskId}:`, error);
      this.updateTaskWithError(taskId, error instanceof Error ? error.message : "Unknown error occurred");
    });

    return taskId;
  }

  public getTask(taskId: string): ResearchTask | undefined {
    return this.tasks.get(taskId);
  }

  public getAllActiveTasks(): ResearchTask[] {
    return Array.from(this.activeTasks).map(id => this.tasks.get(id)!).filter(Boolean);
  }

  private async processTask(taskId: string): Promise<void> {
    const task = this.tasks.get(taskId);
    if (!task) {
      throw new Error(`Task ${taskId} not found`);
    }

    try {
      const { request } = task;
      
      // Validate request
      if (!request.researchTopic.trim()) {
        throw new Error("Research topic is required and cannot be empty");
      }

      let dynamicAgentConfigs: DynamicAgentConfig[] = [];
      let currentAgentCount = 0;

      // Determine agent configuration based on request
      if (request.goDeeper) {
        currentAgentCount = MAX_AGENTS_GO_DEEPER;
        for (let i = 0; i < currentAgentCount; i++) {
          dynamicAgentConfigs.push({
            name: `Creative Agent #${i + 1}`,
            focus: GO_DEEPER_AGENT_FOCUS_PROMPT(request.researchTopic),
            temperature: GO_DEEPER_AGENT_TEMPERATURE,
          });
        }
      } else if (request.autoAgents) {
        this.updateTaskStatus(taskId, 'configuring', 5);
        this.updateAgentStatuses(taskId, [{ 
          id: 'configurator', 
          name: 'AI Configurator', 
          status: 'configuring', 
          message: 'Determining optimal agent setup...' 
        }]);

        try {
          const autoSetup = await determineAgentConfiguration(request.researchTopic);
          currentAgentCount = autoSetup.agentCount;
          dynamicAgentConfigs = autoSetup.agents;
          
          this.updateAgentStatuses(taskId, [{ 
            id: 'configurator', 
            name: 'AI Configurator', 
            status: 'completed', 
            message: `Configured ${currentAgentCount} agents.` 
          }]);
        } catch (e) {
          console.error("Failed to automatically configure agents:", e);
          currentAgentCount = DEFAULT_AUTO_AGENTS_FALLBACK;
          dynamicAgentConfigs = AGENT_PROFILES.slice(0, currentAgentCount).map(p => ({
            name: p.name,
            focus: p.focus,
            temperature: p.temperature
          }));
        }
      } else { // Manual mode
        currentAgentCount = request.numAgents || DEFAULT_AUTO_AGENTS_FALLBACK;
        currentAgentCount = Math.min(currentAgentCount, MAX_AGENTS_MANUAL);
        
        for (let i = 0; i < currentAgentCount; i++) {
          const profile = AGENT_PROFILES[i % AGENT_PROFILES.length];
          dynamicAgentConfigs.push({
            name: profile.name,
            focus: profile.focus,
            temperature: profile.temperature,
          });
        }
      }

      // Initialize agent statuses
      const initialAgentStatuses: AgentStatus[] = dynamicAgentConfigs.map((agent, index) => ({
        id: `${agent.name.replace(/\s+/g, '-')}-${index}`,
        name: agent.name,
        status: 'pending',
      }));

      // Preserve configurator status if it exists
      const currentTask = this.tasks.get(taskId)!;
      const configuratorStatus = currentTask.agentStatuses.find(s => s.id === 'configurator' && s.status === 'completed');
      const allAgentStatuses = configuratorStatus ? [configuratorStatus, ...initialAgentStatuses] : initialAgentStatuses;
      
      this.updateAgentStatuses(taskId, allAgentStatuses);
      this.updateTaskStatus(taskId, 'researching', 10);

      // Run research agents in parallel
      const totalSteps = currentAgentCount + 1; // N agents + 1 synthesis step
      let completedSteps = request.autoAgents && !request.goDeeper ? 1 : 0; // Count config step if auto mode

      const agentPromises = dynamicAgentConfigs.map(async (agentConfig, index) => {
        const agentInternalId = `${agentConfig.name.replace(/\s+/g, '-')}-${index}`;
        
        // Update agent status to researching
        this.updateSingleAgentStatus(taskId, agentInternalId, 'researching', 'Starting investigation...');
        
        try {
          const result = await runResearchAgent(request.researchTopic, agentConfig);
          
          completedSteps++;
          const progress = 10 + ((completedSteps / totalSteps) * 80); // Leave 10% for synthesis
          this.updateTaskProgress(taskId, progress);
          
          const status = result.researchSummary.startsWith('Error:') ? 'error' : 'completed';
          const message = result.researchSummary.startsWith('Error:') 
            ? result.researchSummary.substring(0, 100) + '...'
            : `Found ${result.sources.length} potential sources.`;
          
          this.updateSingleAgentStatus(taskId, agentInternalId, status, message, result.researchSummary, result.sources);
          
          return { ...result, agentName: agentConfig.name, agentInternalId };
        } catch (error) {
          completedSteps++;
          const progress = 10 + ((completedSteps / totalSteps) * 80);
          this.updateTaskProgress(taskId, progress);
          
          const errorMessage = error instanceof Error ? error.message : "Unknown error";
          this.updateSingleAgentStatus(taskId, agentInternalId, 'error', errorMessage);
          
          return {
            researchSummary: `Error: Could not complete research for ${agentConfig.name}. ${errorMessage}`,
            sources: [],
            agentName: agentConfig.name,
            agentInternalId
          };
        }
      });

      const agentResults = await Promise.all(agentPromises);

      // Filter successful results for synthesis
      const successfulResults = agentResults.filter(result => !result.researchSummary.startsWith('Error:'));
      const allSources: Source[] = [];
      
      agentResults.forEach(result => {
        if (!result.researchSummary.startsWith('Error:')) {
          allSources.push(...result.sources);
        }
      });

      // Create unique sources map
      const uniqueSourceMap = new Map<string, Source>();
      let sourceIdCounter = 1;
      allSources.forEach(src => {
        if (src.uri && !uniqueSourceMap.has(src.uri)) {
          uniqueSourceMap.set(src.uri, { ...src, id: sourceIdCounter++ });
        }
      });
      const finalUniqueSources = Array.from(uniqueSourceMap.values());

      // Synthesis phase
      this.updateTaskStatus(taskId, 'synthesizing', 90);
      const synthesisAgentId = 'synthesis-engine';
      this.addAgentStatus(taskId, {
        id: synthesisAgentId,
        name: 'Synthesis Engine',
        status: 'synthesizing',
        message: 'Compiling final report...'
      });

      const report = await synthesizeReport(
        request.researchTopic,
        successfulResults.map(r => ({ agentName: r.agentName, researchSummary: r.researchSummary })),
        finalUniqueSources,
        request.responseType || ResponseType.Report,
        request.includeCitations ?? true,
        request.limitCitationsToThree ?? true
      );

      // Process citations if needed
      let processedReport = report;
      if ((request.includeCitations ?? true) && finalUniqueSources.length > 0) {
        processedReport = report.replace(/\[(\d+)\](?:[^\S\r\n]*\([^)]*\))?/g, (originalMatch, citationNumberStr) => {
          const sourceNum = parseInt(citationNumberStr, 10);
          const source = finalUniqueSources.find(s => s.id === sourceNum);
          if (source && source.uri) {
            return `[${sourceNum}](${source.uri})`;
          }
          return originalMatch;
        });
      }

      // Complete the task
      this.updateSingleAgentStatus(taskId, synthesisAgentId, 'completed', 'Report generated.');
      this.completeTask(taskId, processedReport, finalUniqueSources);

    } catch (error) {
      console.error(`Error in task ${taskId}:`, error);
      this.updateTaskWithError(taskId, error instanceof Error ? error.message : "Unknown error occurred");
    } finally {
      this.activeTasks.delete(taskId);
    }
  }

  private updateTaskStatus(taskId: string, status: ResearchTask['status'], progress?: number): void {
    const task = this.tasks.get(taskId);
    if (task) {
      task.status = status;
      if (progress !== undefined) {
        task.progress = Math.min(100, Math.max(0, progress));
      }
      task.updatedAt = new Date();
    }
  }

  private updateTaskProgress(taskId: string, progress: number): void {
    const task = this.tasks.get(taskId);
    if (task) {
      task.progress = Math.min(100, Math.max(0, progress));
      task.updatedAt = new Date();
    }
  }

  private updateAgentStatuses(taskId: string, statuses: AgentStatus[]): void {
    const task = this.tasks.get(taskId);
    if (task) {
      task.agentStatuses = statuses;
      task.updatedAt = new Date();
    }
  }

  private updateSingleAgentStatus(
    taskId: string, 
    agentId: string, 
    status: AgentStatus['status'], 
    message?: string,
    research?: string,
    sources?: Source[]
  ): void {
    const task = this.tasks.get(taskId);
    if (task) {
      const agentIndex = task.agentStatuses.findIndex(s => s.id === agentId);
      if (agentIndex !== -1) {
        task.agentStatuses[agentIndex] = {
          ...task.agentStatuses[agentIndex],
          status,
          message,
          research,
          sources
        };
        task.updatedAt = new Date();
      }
    }
  }

  private addAgentStatus(taskId: string, status: AgentStatus): void {
    const task = this.tasks.get(taskId);
    if (task) {
      task.agentStatuses.push(status);
      task.updatedAt = new Date();
    }
  }

  private completeTask(taskId: string, finalReport: string, sources: Source[]): void {
    const task = this.tasks.get(taskId);
    if (task) {
      task.status = 'completed';
      task.progress = 100;
      task.finalReport = finalReport;
      task.sources = sources;
      task.updatedAt = new Date();
    }
  }

  private updateTaskWithError(taskId: string, error: string): void {
    const task = this.tasks.get(taskId);
    if (task) {
      task.status = 'error';
      task.error = error;
      task.updatedAt = new Date();
      
      // Update any pending/researching agents to error state
      task.agentStatuses = task.agentStatuses.map(s => 
        (s.status === 'researching' || s.status === 'synthesizing' || s.status === 'pending') 
          ? { ...s, status: 'error', message: s.status === 'pending' ? "Process halted." : error.substring(0, 100) + '...' }
          : s
      );
    }
  }

  private cleanupOldTasks(): void {
    const now = new Date();
    const tasksToDelete: string[] = [];

    for (const [taskId, task] of this.tasks.entries()) {
      if (task.status === 'completed' || task.status === 'error') {
        const ageMs = now.getTime() - task.updatedAt.getTime();
        if (ageMs > COMPLETED_TASK_RETENTION_MS) {
          tasksToDelete.push(taskId);
        }
      }
    }

    tasksToDelete.forEach(taskId => {
      this.tasks.delete(taskId);
      this.activeTasks.delete(taskId);
    });

    if (tasksToDelete.length > 0) {
      console.log(`Cleaned up ${tasksToDelete.length} old tasks`);
    }
  }

  public getStats() {
    return {
      totalTasks: this.tasks.size,
      activeTasks: this.activeTasks.size,
      maxConcurrentTasks: MAX_CONCURRENT_RESEARCH_TASKS
    };
  }
}

export const taskManager = new TaskManager(); 