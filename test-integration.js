#!/usr/bin/env node

console.log('🧪 Testing Gemini Live API Integration...\n');

// Check if required dependencies are installed
const requiredPackages = ['ws', 'express', 'cors', 'dotenv'];
const missingPackages = [];

for (const pkg of requiredPackages) {
  try {
    require.resolve(pkg);
    console.log(`✅ ${pkg} - installed`);
  } catch (error) {
    missingPackages.push(pkg);
    console.log(`❌ ${pkg} - missing`);
  }
}

if (missingPackages.length > 0) {
  console.log('\n⚠️  Missing packages detected. Please install them:');
  console.log(`npm install ${missingPackages.join(' ')}`);
  process.exit(1);
}

// Check if required files exist
const fs = require('fs');
const path = require('path');

const requiredFiles = [
  'server.js',
  'src/services/geminiLiveService.js',
  'src/hooks/useGeminiLive.js',
  'src/components/LiveModeUI.jsx'
];

console.log('\n📁 Checking required files...');
for (const file of requiredFiles) {
  if (fs.existsSync(path.join(__dirname, file))) {
    console.log(`✅ ${file} - exists`);
  } else {
    console.log(`❌ ${file} - missing`);
  }
}

// Test WebSocket connection
console.log('\n🔌 Testing WebSocket connection...');

const WebSocket = require('ws');

const testWebSocket = () => {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket('ws://localhost:3000/ws/live-audio');
    
    const timeout = setTimeout(() => {
      ws.close();
      reject(new Error('Connection timeout'));
    }, 5000);
    
    ws.on('open', () => {
      clearTimeout(timeout);
      console.log('✅ WebSocket connection successful');
      
      // Test session start
      ws.send(JSON.stringify({
        type: 'start_session',
        session_id: 'test_session',
        model: 'gemini-live-2.5-flash-preview',
        response_modality: 'text'
      }));
      
      ws.on('message', (data) => {
        const message = JSON.parse(data);
        console.log(`📨 Received message: ${message.type}`);
        
        if (message.type === 'session_started') {
          console.log('✅ Session started successfully');
          ws.close();
          resolve();
        }
      });
    });
    
    ws.on('error', (error) => {
      clearTimeout(timeout);
      reject(error);
    });
  });
};

// Check if server is running
console.log('🚀 Checking if server is running...');

const http = require('http');
const checkServer = () => {
  return new Promise((resolve, reject) => {
    const req = http.get('http://localhost:3000/api/v1/live-audio/sessions', (res) => {
      if (res.statusCode === 200) {
        console.log('✅ Server is running');
        resolve();
      } else {
        reject(new Error(`Server returned status ${res.statusCode}`));
      }
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.setTimeout(5000, () => {
      req.destroy();
      reject(new Error('Server request timeout'));
    });
  });
};

// Run tests
async function runTests() {
  try {
    await checkServer();
    await testWebSocket();
    
    console.log('\n🎉 All tests passed! Gemini Live API integration is working correctly.\n');
    console.log('📝 Next steps:');
    console.log('1. Install dependencies: npm install');
    console.log('2. Build the frontend: npm run build');
    console.log('3. Start the server: npm run server');
    console.log('4. Open your browser and test the live chat feature');
    
  } catch (error) {
    console.log('\n❌ Test failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Make sure the server is running: npm run server');
    console.log('2. Check if port 3000 is available');
    console.log('3. Verify all dependencies are installed');
    console.log('4. Check server logs for errors');
  }
}

runTests();