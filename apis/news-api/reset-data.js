// Script to reset all data in the News API
const fs = require('fs');
const path = require('path');

console.log('🗑️  News API Data Reset Tool\n');

// Default data path (same as in config)
const dataPath = path.join(__dirname, 'data', 'articles.json');

console.log(`📍 Data file location: ${dataPath}`);

if (!fs.existsSync(dataPath)) {
    console.log('❌ No data file found. Nothing to reset.');
    process.exit(0);
}

// Read current data to show stats
try {
    const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
    const articlesCount = data.articles ? data.articles.length : 0;
    const cyclesCount = data.generationCycles ? data.generationCycles.length : 0;
    
    console.log(`\n📊 Current data:`);
    console.log(`   - Articles: ${articlesCount}`);
    console.log(`   - Generation cycles: ${cyclesCount}`);
    
    // Create backup
    const backupPath = dataPath.replace('.json', `-backup-${Date.now()}.json`);
    fs.copyFileSync(dataPath, backupPath);
    console.log(`\n💾 Backup created: ${path.basename(backupPath)}`);
    
    // Reset data
    const emptyData = {
        articles: [],
        generationCycles: []
    };
    
    fs.writeFileSync(dataPath, JSON.stringify(emptyData, null, 2));
    console.log('\n✅ Data reset successfully!');
    console.log('\n🚀 You can now start the API with: npm run dev');
    
} catch (error) {
    console.error('❌ Error resetting data:', error.message);
    process.exit(1);
} 