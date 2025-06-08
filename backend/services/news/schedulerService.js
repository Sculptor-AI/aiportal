import cron from 'node-cron';
import { newsGenerationService } from './newsGenerationService.js';

export class SchedulerService {
  constructor() {
    this.scheduledTask = null;
  }

  /**
   * Start the news generation scheduler
   */
  start() {
    const schedule = process.env.NEWS_GENERATION_SCHEDULE || '0 */4 * * *';
    
    console.log(`Starting news generation scheduler with schedule: ${schedule}`);
    
    this.scheduledTask = cron.schedule(schedule, async () => {
      console.log('Scheduled news generation starting...');
      try {
        await newsGenerationService.generateNewsCycle();
      } catch (error) {
        console.error('Scheduled news generation failed:', error);
      }
    });
  }

  /**
   * Stop the scheduler
   */
  stop() {
    if (this.scheduledTask) {
      this.scheduledTask.stop();
      console.log('News generation scheduler stopped');
    }
  }

  /**
   * Check if scheduler is running
   * @returns {boolean}
   */
  isRunning() {
    return this.scheduledTask !== null;
  }
}

// Create singleton instance
export const schedulerService = new SchedulerService(); 