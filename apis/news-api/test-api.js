// Simple test script to verify API endpoints
const API_BASE = 'http://localhost:3001/api';

async function testAPI() {
    console.log('🧪 Testing News API Endpoints...\n');

    // Test 1: Health Check
    console.log('1️⃣ Testing Health Check...');
    try {
        const response = await fetch(`${API_BASE}/health`);
        const data = await response.json();
        console.log('✅ Health Check:', data.data.status);
    } catch (error) {
        console.error('❌ Health Check failed:', error.message);
    }

    // Test 2: Progress Endpoint
    console.log('\n2️⃣ Testing Progress Endpoint...');
    try {
        const response = await fetch(`${API_BASE}/generation/progress`);
        const data = await response.json();
        console.log('✅ Progress Endpoint:', data.data.currentGeneration ? 'Generation in progress' : 'No active generation');
    } catch (error) {
        console.error('❌ Progress Endpoint failed:', error.message);
    }

    // Test 3: Debug Info
    console.log('\n3️⃣ Testing Debug Info...');
    try {
        const response = await fetch(`${API_BASE}/debug/info`);
        const data = await response.json();
        console.log('✅ Debug Info:', 'System uptime:', data.data.debugInfo.systemStatus.uptime + 's');
    } catch (error) {
        console.error('❌ Debug Info failed:', error.message);
    }

    // Test 4: Get Articles
    console.log('\n4️⃣ Testing Get Articles...');
    try {
        const response = await fetch(`${API_BASE}/news?limit=5`);
        const data = await response.json();
        console.log('✅ Articles:', data.data.articles.length, 'articles found');
    } catch (error) {
        console.error('❌ Get Articles failed:', error.message);
    }

    // Test 5: SSE Stream (brief test)
    console.log('\n5️⃣ Testing SSE Stream...');
    try {
        const eventSource = new EventSource(`${API_BASE}/generation/stream`);
        
        return new Promise((resolve) => {
            eventSource.onmessage = (event) => {
                const data = JSON.parse(event.data);
                if (data.type === 'connected') {
                    console.log('✅ SSE Stream:', data.message);
                    eventSource.close();
                    resolve();
                }
            };
            
            eventSource.onerror = (error) => {
                console.error('❌ SSE Stream failed:', error);
                eventSource.close();
                resolve();
            };
            
            // Timeout after 5 seconds
            setTimeout(() => {
                eventSource.close();
                resolve();
            }, 5000);
        });
    } catch (error) {
        console.error('❌ SSE Stream failed:', error.message);
    }

    console.log('\n✨ API tests completed!');
}

// Run tests
testAPI().then(() => {
    console.log('\nℹ️  Open http://localhost:3001/test-page.html in your browser to see the full UI');
    process.exit(0);
}); 