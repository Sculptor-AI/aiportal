import { EventEmitter } from 'events';
import {
  GenerationProgress,
  GenerationDebugEntry,
  LogEntry,
  DebugInfo,
  PhaseDebugInfo,
  ProgressEvent,
  NewsGenerationCycle
} from '../types';
import logger from '../utils/logger';

export class ProgressTrackingService extends EventEmitter {
  private static instance: ProgressTrackingService;
  private currentProgress: GenerationProgress | null = null;
  private generationHistory: GenerationDebugEntry[] = [];
  private recentLogs: LogEntry[] = [];
  private maxLogEntries = 500;
  private maxHistoryEntries = 50;
  private errorCount = 0;
  private phaseTimings: Map<string, PhaseDebugInfo> = new Map();

  private constructor() {
    super();
    this.setupLogInterceptor();
  }

  static getInstance(): ProgressTrackingService {
    if (!ProgressTrackingService.instance) {
      ProgressTrackingService.instance = new ProgressTrackingService();
    }
    return ProgressTrackingService.instance;
  }

  // Initialize a new generation cycle
  startGeneration(cycle: NewsGenerationCycle, totalArticles: number): void {
    this.currentProgress = {
      cycleId: cycle.id,
      overallProgress: 0,
      phase: 'initializing',
      phaseDescription: 'Starting news generation cycle...',
      startTime: new Date(),
      articlesCompleted: 0,
      articlesTotal: totalArticles,
      errors: []
    };

    this.phaseTimings.clear();
    this.recordPhaseStart('initialization');
    
    this.emit('progress', this.createProgressEvent('progress'));
    this.addLog('info', `Started generation cycle ${cycle.id}`, { totalArticles });
  }

  // Update generation phase
  updatePhase(
    phase: GenerationProgress['phase'],
    description: string,
    additionalData?: any
  ): void {
    if (!this.currentProgress) return;

    // End previous phase
    const previousPhase = this.currentProgress.phase;
    this.recordPhaseEnd(previousPhase);

    // Start new phase
    this.currentProgress.phase = phase;
    this.currentProgress.phaseDescription = description;
    this.recordPhaseStart(phase, additionalData);

    // Calculate overall progress based on phase
    this.currentProgress.overallProgress = this.calculateOverallProgress();
    
    this.emit('progress', this.createProgressEvent('progress'));
    this.addLog('info', `Entered phase: ${phase}`, { description, ...additionalData });
  }

  // Update article progress
  updateArticleProgress(
    taskId: string,
    topicId: string,
    topicName: string,
    progress: number,
    phase: string,
    headline?: string
  ): void {
    if (!this.currentProgress) return;

    this.currentProgress.currentArticle = {
      taskId,
      topicId,
      topicName,
      headline,
      progress,
      phase
    };

    this.emit('progress', this.createProgressEvent('progress'));
    this.addLog('debug', `Article progress: ${topicName}`, { progress, phase });
  }

  // Complete an article
  completeArticle(taskId: string, success: boolean, error?: string): void {
    if (!this.currentProgress) return;

    if (success) {
      this.currentProgress.articlesCompleted++;
    } else if (error) {
      this.currentProgress.errors.push(`Article ${taskId}: ${error}`);
      this.errorCount++;
    }

    // Clear current article if it matches
    if (this.currentProgress.currentArticle?.taskId === taskId) {
      this.currentProgress.currentArticle = undefined;
    }

    this.currentProgress.overallProgress = this.calculateOverallProgress();
    
    this.emit('progress', this.createProgressEvent('article_completed'));
    this.addLog(success ? 'info' : 'error', `Article ${taskId} ${success ? 'completed' : 'failed'}`, { error });
  }

  // Complete generation cycle
  completeGeneration(cycle: NewsGenerationCycle): void {
    if (!this.currentProgress) return;

    this.recordPhaseEnd(this.currentProgress.phase);

    // Create history entry
    const historyEntry: GenerationDebugEntry = {
      cycleId: cycle.id,
      startedAt: cycle.startedAt,
      completedAt: cycle.completedAt,
      duration: cycle.completedAt ? 
        new Date(cycle.completedAt).getTime() - new Date(cycle.startedAt).getTime() : 
        undefined,
      success: cycle.status === 'completed',
      articlesGenerated: cycle.articlesGenerated,
      errors: this.currentProgress.errors,
      phases: Array.from(this.phaseTimings.values())
    };

    this.generationHistory.unshift(historyEntry);
    if (this.generationHistory.length > this.maxHistoryEntries) {
      this.generationHistory.pop();
    }

    this.currentProgress = null;
    this.emit('progress', this.createProgressEvent('cycle_completed'));
    this.addLog('info', `Generation cycle ${cycle.id} completed`, { 
      duration: historyEntry.duration,
      articlesGenerated: cycle.articlesGenerated 
    });
  }

  // Add error
  addError(error: string, context?: any): void {
    this.errorCount++;
    if (this.currentProgress) {
      this.currentProgress.errors.push(error);
    }
    this.emit('progress', this.createProgressEvent('error'));
    this.addLog('error', error, context);
  }

  // Get current progress
  getCurrentProgress(): GenerationProgress | null {
    if (this.currentProgress) {
      // Calculate estimated time remaining
      const elapsed = Date.now() - this.currentProgress.startTime.getTime();
      const progressRate = this.currentProgress.overallProgress / elapsed;
      const remaining = progressRate > 0 ? 
        Math.round((100 - this.currentProgress.overallProgress) / progressRate / 1000) : 
        undefined;
      
      return {
        ...this.currentProgress,
        estimatedTimeRemaining: remaining
      };
    }
    return null;
  }

  // Get debug information
  getDebugInfo(): DebugInfo {
    return {
      systemStatus: {
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
        activeGeneration: this.currentProgress !== null,
        lastError: this.recentLogs.find(log => log.level === 'error')?.message,
        errorCount: this.errorCount
      },
      generationHistory: this.generationHistory,
      currentLogs: this.recentLogs
    };
  }

  // Get recent logs
  getRecentLogs(count: number = 100): LogEntry[] {
    return this.recentLogs.slice(0, count);
  }

  // Private methods
  private calculateOverallProgress(): number {
    if (!this.currentProgress) return 0;

    const phaseWeights = {
      initializing: 5,
      discovery: 15,
      selection: 10,
      researching: 40,
      writing: 25,
      publishing: 5,
      completed: 100,
      failed: 100
    };

    const baseProgress = phaseWeights[this.currentProgress.phase] || 0;
    
    // Add article progress if in research/writing phase
    if (this.currentProgress.phase === 'researching' || this.currentProgress.phase === 'writing') {
      const articleProgress = (this.currentProgress.articlesCompleted / this.currentProgress.articlesTotal) * 100;
      return Math.min(100, baseProgress + (articleProgress * 0.7));
    }

    return Math.min(100, baseProgress);
  }

  private recordPhaseStart(phase: string, details?: any): void {
    this.phaseTimings.set(phase, {
      name: phase,
      startTime: new Date(),
      details: details || {}
    });
  }

  private recordPhaseEnd(phase: string): void {
    const phaseInfo = this.phaseTimings.get(phase);
    if (phaseInfo && !phaseInfo.endTime) {
      phaseInfo.endTime = new Date();
      phaseInfo.duration = phaseInfo.endTime.getTime() - phaseInfo.startTime.getTime();
    }
  }

  private createProgressEvent(type: ProgressEvent['type']): ProgressEvent {
    return {
      type,
      timestamp: new Date(),
      data: type === 'progress' ? this.currentProgress : 
            type === 'error' ? this.currentProgress?.errors : 
            this.currentProgress
    };
  }

  private addLog(level: LogEntry['level'], message: string, context?: any): void {
    const entry: LogEntry = {
      timestamp: new Date(),
      level,
      message,
      context
    };

    this.recentLogs.unshift(entry);
    if (this.recentLogs.length > this.maxLogEntries) {
      this.recentLogs.pop();
    }

    this.emit('log', entry);
  }

  private setupLogInterceptor(): void {
    // Intercept logger methods to capture logs
    const levels: Array<'info' | 'error' | 'warn' | 'debug'> = ['info', 'error', 'warn', 'debug'];
    
    levels.forEach(level => {
      const originalMethod = logger[level].bind(logger);
      logger[level] = (message: string, meta?: any) => {
        // Call original logger
        const result = originalMethod(message, meta);
        
        // Capture for our tracking
        this.addLog(level, message, meta);
        
        return result;
      };
    });
  }
} 