import * as cron from 'node-cron';
import { NewsGenerationService } from './newsGenerationService';
import { ConfigService } from './configService';
import logger from '../utils/logger';

export class SchedulerService {
  private static instance: SchedulerService;
  private scheduledTask: cron.ScheduledTask | null = null;
  private configService: ConfigService;
  private generationService: NewsGenerationService;

  private constructor() {
    this.configService = ConfigService.getInstance();
    this.generationService = NewsGenerationService.getInstance();
  }

  static getInstance(): SchedulerService {
    if (!SchedulerService.instance) {
      SchedulerService.instance = new SchedulerService();
    }
    return SchedulerService.instance;
  }

  start(): void {
    const config = this.configService.getConfig();
    
    if (this.scheduledTask) {
      this.stop();
    }

    // Validate cron expression
    if (!cron.validate(config.newsGenerationSchedule)) {
      logger.error('Invalid cron expression', { schedule: config.newsGenerationSchedule });
      return;
    }

    // Schedule the task
    this.scheduledTask = cron.schedule(config.newsGenerationSchedule, async () => {
      logger.info('Starting scheduled news generation');
      
      try {
        await this.generationService.generateNewsCycle();
      } catch (error) {
        logger.error('Scheduled news generation failed', { error });
      }
    });

    logger.info('News generation scheduler started', { 
      schedule: config.newsGenerationSchedule 
    });

    // Run immediately if configured
    if (config.autoStartGeneration) {
      logger.info('Running initial news generation');
      this.generationService.generateNewsCycle().catch(error => {
        logger.error('Initial news generation failed', { error });
      });
    }
  }

  stop(): void {
    if (this.scheduledTask) {
      this.scheduledTask.stop();
      this.scheduledTask = null;
      logger.info('News generation scheduler stopped');
    }
  }

  getNextScheduledTime(): Date | null {
    const config = this.configService.getConfig();
    
    try {
      // Parse cron expression to determine next run time
      // This is a simplified implementation
      const parts = config.newsGenerationSchedule.split(' ');
      const now = new Date();
      
      // For hourly schedules (0 * * * *)
      if (parts[0] === '0' && parts[1] === '*') {
        const next = new Date(now);
        next.setHours(now.getHours() + 1);
        next.setMinutes(0);
        next.setSeconds(0);
        return next;
      }
      
      // For every N hours (0 */N * * *)
      if (parts[0] === '0' && parts[1].startsWith('*/')) {
        const hours = parseInt(parts[1].substring(2));
        const next = new Date(now);
        const currentHour = now.getHours();
        const nextHour = Math.ceil(currentHour / hours) * hours;
        next.setHours(nextHour);
        next.setMinutes(0);
        next.setSeconds(0);
        return next;
      }
      
      // For specific times (0 H * * *)
      if (parts[0] === '0' && !parts[1].includes('*')) {
        const hours = parts[1].split(',').map(h => parseInt(h));
        const next = new Date(now);
        
        // Find next scheduled hour
        const currentHour = now.getHours();
        let nextHour = hours.find(h => h > currentHour);
        
        if (nextHour === undefined) {
          // Next run is tomorrow
          next.setDate(next.getDate() + 1);
          nextHour = hours[0];
        }
        
        next.setHours(nextHour);
        next.setMinutes(0);
        next.setSeconds(0);
        return next;
      }
      
      // Default: return null for complex expressions
      return null;
      
    } catch (error) {
      logger.error('Error calculating next scheduled time', { error });
      return null;
    }
  }

  isRunning(): boolean {
    return this.scheduledTask !== null;
  }
} 