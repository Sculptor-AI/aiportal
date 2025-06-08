import { Router, Request, Response } from 'express';
import { 
  ResearchRequest, 
  ResearchResponse, 
  AgentConfigurationRequest, 
  AgentConfigurationResponse,
  ResponseType 
} from '../types';
import { taskManager } from '../services/taskManager';
import { determineAgentConfiguration } from '../services/geminiService';

const router = Router();

/**
 * @swagger
 * /api/research:
 *   post:
 *     summary: Start a new research task
 *     tags: [Research]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - researchTopic
 *             properties:
 *               researchTopic:
 *                 type: string
 *                 description: The topic to research
 *               numAgents:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 10
 *                 description: Number of agents (manual mode only)
 *               autoAgents:
 *                 type: boolean
 *                 description: Use automatic agent configuration
 *               responseType:
 *                 type: string
 *                 enum: [Report, Article, Research Paper]
 *                 description: Type of response to generate
 *               includeCitations:
 *                 type: boolean
 *                 description: Include citations in the response
 *               limitCitationsToThree:
 *                 type: boolean
 *                 description: Limit citations to three per claim
 *               goDeeper:
 *                 type: boolean
 *                 description: Use creative deep research mode
 *     responses:
 *       200:
 *         description: Research task started successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 taskId:
 *                   type: string
 *                   description: Unique task identifier
 *                 status:
 *                   type: string
 *                   description: Initial task status
 */
router.post('/research', async (req: Request, res: Response) => {
  try {
    const requestBody = req.body as ResearchRequest;

    // Validate required fields
    if (!requestBody.researchTopic || typeof requestBody.researchTopic !== 'string') {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'researchTopic is required and must be a string',
        statusCode: 400,
        timestamp: new Date().toISOString()
      });
    }

    if (requestBody.researchTopic.trim().length === 0) {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'researchTopic cannot be empty',
        statusCode: 400,
        timestamp: new Date().toISOString()
      });
    }

    // Validate optional fields
    if (requestBody.numAgents !== undefined && (
      typeof requestBody.numAgents !== 'number' || 
      requestBody.numAgents < 1 || 
      requestBody.numAgents > 10
    )) {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'numAgents must be a number between 1 and 10',
        statusCode: 400,
        timestamp: new Date().toISOString()
      });
    }

    if (requestBody.responseType !== undefined && 
        !Object.values(ResponseType).includes(requestBody.responseType)) {
      return res.status(400).json({
        error: 'Invalid request',
        message: `responseType must be one of: ${Object.values(ResponseType).join(', ')}`,
        statusCode: 400,
        timestamp: new Date().toISOString()
      });
    }

    // Set defaults
    const researchRequest: ResearchRequest = {
      researchTopic: requestBody.researchTopic.trim(),
      numAgents: requestBody.numAgents || 3,
      autoAgents: requestBody.autoAgents ?? true,
      responseType: requestBody.responseType || ResponseType.Report,
      includeCitations: requestBody.includeCitations ?? true,
      limitCitationsToThree: requestBody.limitCitationsToThree ?? true,
      goDeeper: requestBody.goDeeper ?? false
    };

    const taskId = taskManager.createTask(researchRequest);

    const response: { taskId: string; status: string } = {
      taskId,
      status: 'started'
    };

    res.json(response);

  } catch (error) {
    console.error('Error starting research task:', error);
    
    if (error instanceof Error && error.message.includes('Maximum number of concurrent tasks')) {
      return res.status(429).json({
        error: 'Too many requests',
        message: error.message,
        statusCode: 429,
        timestamp: new Date().toISOString()
      });
    }

    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to start research task',
      statusCode: 500,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * @swagger
 * /api/research/{taskId}:
 *   get:
 *     summary: Get research task status and results
 *     tags: [Research]
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema:
 *           type: string
 *         description: Task ID returned from POST /api/research
 *     responses:
 *       200:
 *         description: Task status and results
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 taskId:
 *                   type: string
 *                 status:
 *                   type: string
 *                   enum: [started, configuring, researching, synthesizing, completed, error]
 *                 progress:
 *                   type: number
 *                   minimum: 0
 *                   maximum: 100
 *                 agentStatuses:
 *                   type: array
 *                   items:
 *                     type: object
 *                 finalReport:
 *                   type: string
 *                 sources:
 *                   type: array
 *                   items:
 *                     type: object
 *                 error:
 *                   type: string
 */
router.get('/research/:taskId', (req: Request, res: Response) => {
  try {
    const { taskId } = req.params;

    if (!taskId || typeof taskId !== 'string') {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'taskId is required',
        statusCode: 400,
        timestamp: new Date().toISOString()
      });
    }

    const task = taskManager.getTask(taskId);

    if (!task) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Task not found',
        statusCode: 404,
        timestamp: new Date().toISOString()
      });
    }

    const response: ResearchResponse = {
      taskId: task.id,
      status: task.status,
      progress: task.progress,
      agentStatuses: task.agentStatuses,
      finalReport: task.finalReport,
      sources: task.sources,
      error: task.error
    };

    res.json(response);

  } catch (error) {
    console.error('Error getting research task:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to get research task',
      statusCode: 500,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * @swagger
 * /api/configure-agents:
 *   post:
 *     summary: Auto-configure agents for a research topic
 *     tags: [Configuration]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - researchTopic
 *             properties:
 *               researchTopic:
 *                 type: string
 *                 description: The topic to configure agents for
 *     responses:
 *       200:
 *         description: Agent configuration generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 agentSetup:
 *                   type: object
 *                   properties:
 *                     agentCount:
 *                       type: number
 *                     agents:
 *                       type: array
 *                       items:
 *                         type: object
 */
router.post('/configure-agents', async (req: Request, res: Response) => {
  try {
    const requestBody = req.body as AgentConfigurationRequest;

    if (!requestBody.researchTopic || typeof requestBody.researchTopic !== 'string') {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'researchTopic is required and must be a string',
        statusCode: 400,
        timestamp: new Date().toISOString()
      });
    }

    if (requestBody.researchTopic.trim().length === 0) {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'researchTopic cannot be empty',
        statusCode: 400,
        timestamp: new Date().toISOString()
      });
    }

    const agentSetup = await determineAgentConfiguration(requestBody.researchTopic.trim());

    const response: AgentConfigurationResponse = {
      success: true,
      agentSetup
    };

    res.json(response);

  } catch (error) {
    console.error('Error configuring agents:', error);
    
    const response: AgentConfigurationResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to configure agents'
    };

    res.status(500).json(response);
  }
});

/**
 * @swagger
 * /api/tasks:
 *   get:
 *     summary: Get all active research tasks
 *     tags: [Research]
 *     responses:
 *       200:
 *         description: List of active research tasks
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 tasks:
 *                   type: array
 *                   items:
 *                     type: object
 *                 stats:
 *                   type: object
 */
router.get('/tasks', (req: Request, res: Response) => {
  try {
    const activeTasks = taskManager.getAllActiveTasks();
    const stats = taskManager.getStats();

    res.json({
      tasks: activeTasks.map(task => ({
        taskId: task.id,
        status: task.status,
        progress: task.progress,
        researchTopic: task.request.researchTopic,
        createdAt: task.createdAt,
        updatedAt: task.updatedAt
      })),
      stats
    });

  } catch (error) {
    console.error('Error getting active tasks:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to get active tasks',
      statusCode: 500,
      timestamp: new Date().toISOString()
    });
  }
});

export default router; 