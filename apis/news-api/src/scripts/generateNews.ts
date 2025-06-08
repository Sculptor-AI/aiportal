import { config } from 'dotenv';
import { ConfigService } from '../services/configService';
import { initializeGeminiService } from '../services/geminiService';
import { NewsGenerationService } from '../services/newsGenerationService';
import logger from '../utils/logger';

// Load environment variables
config();

async function generateNews() {
  try {
    // Initialize services
    const configService = ConfigService.getInstance();
    const appConfig = configService.getConfig();
    
    // Validate configuration
    const validation = configService.validateConfig();
    if (!validation.valid) {
      logger.error('Invalid configuration', { errors: validation.errors });
      process.exit(1);
    }
    
    // Initialize Gemini
    initializeGeminiService(appConfig.apiKey);
    
    // Get generation service
    const generationService = NewsGenerationService.getInstance();
    
    logger.info('Starting manual news generation cycle...');
    
    // Run generation cycle
    const cycle = await generationService.generateNewsCycle(true);
    
    logger.info('News generation completed!', {
      cycleId: cycle.id,
      articlesGenerated: cycle.articlesGenerated,
      articlesDeleted: cycle.articlesDeleted,
      duration: cycle.completedAt ? 
        (cycle.completedAt.getTime() - cycle.startedAt.getTime()) / 1000 : 0
    });
    
    // Show task results
    const completedTasks = cycle.tasks.filter(t => t.status === 'completed');
    const failedTasks = cycle.tasks.filter(t => t.status === 'failed');
    
    if (completedTasks.length > 0) {
      logger.info('Completed tasks:', {
        count: completedTasks.length,
        articles: completedTasks.map(t => ({
          topic: t.topicName,
          articleId: t.articleId
        }))
      });
    }
    
    if (failedTasks.length > 0) {
      logger.warn('Failed tasks:', {
        count: failedTasks.length,
        tasks: failedTasks.map(t => ({
          topic: t.topicName,
          error: t.error
        }))
      });
    }
    
  } catch (error) {
    logger.error('News generation failed', { error });
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  generateNews().then(() => {
    logger.info('Script completed');
    process.exit(0);
  }).catch(error => {
    logger.error('Script failed', { error });
    process.exit(1);
  });
} 