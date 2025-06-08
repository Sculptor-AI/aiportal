import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import path from 'path';
import { newsGenerationService } from '../services/news/newsGenerationService.js';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

console.log('🚀 Force News Generation Script');
console.log('================================');

async function forceNewsGeneration() {
  try {
    console.log('Starting forced news generation...');
    console.log(`Target article count: ${process.env.NEWS_TARGET_ARTICLE_COUNT || '25'}`);
    console.log('');
    
    const startTime = Date.now();
    const articles = await newsGenerationService.generateNewsCycle(true);
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    
    console.log('');
    console.log('✅ Generation completed!');
    console.log(`Generated ${articles.length} articles in ${duration} seconds`);
    console.log('');
    console.log('Articles by category:');
    
    const categoryCounts = {};
    articles.forEach(article => {
      categoryCounts[article.category] = (categoryCounts[article.category] || 0) + 1;
    });
    
    Object.entries(categoryCounts).forEach(([category, count]) => {
      console.log(`  - ${category}: ${count} articles`);
    });
    
  } catch (error) {
    console.error('❌ Error during news generation:', error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  forceNewsGeneration()
    .then(() => {
      console.log('✅ Script completed');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
}

export { forceNewsGeneration }; 