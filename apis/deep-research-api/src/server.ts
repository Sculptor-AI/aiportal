import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import * as dotenv from 'dotenv';

import { initializeGeminiService } from './services/geminiService';
import researchRoutes from './routes/research';
import { 
  DEFAULT_PORT, 
  DEFAULT_RATE_LIMIT_WINDOW_MS, 
  DEFAULT_RATE_LIMIT_MAX_REQUESTS 
} from './constants';

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || DEFAULT_PORT;

// Initialize Gemini Service
const apiKey = process.env.API_KEY;
if (!apiKey) {
  console.error('ERROR: API_KEY environment variable is not set.');
  console.error('Please set your Google Gemini API key in the API_KEY environment variable.');
  process.exit(1);
}

try {
  initializeGeminiService(apiKey);
  console.log('✅ Gemini service initialized successfully');
} catch (error) {
  console.error('❌ Failed to initialize Gemini service:', error);
  process.exit(1);
}

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disable for Swagger UI
}));

// CORS configuration
const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS ? 
    process.env.ALLOWED_ORIGINS.split(',') : 
    ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || DEFAULT_RATE_LIMIT_WINDOW_MS.toString()),
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || DEFAULT_RATE_LIMIT_MAX_REQUESTS.toString()),
  message: {
    error: 'Too many requests',
    message: 'Rate limit exceeded. Please try again later.',
    statusCode: 429,
    timestamp: new Date().toISOString()
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Deep Research AI API',
      version: '1.0.0',
      description: `
        A powerful AI-driven research API that uses multiple specialized agents to conduct comprehensive research on any topic.
        
        ## Features
        - **Multi-Agent Research**: Deploy multiple AI agents with different perspectives and specializations
        - **Auto-Configuration**: Automatically configure optimal agents based on your research topic
        - **Multiple Output Formats**: Generate reports, articles, or research papers
        - **Real-time Progress**: Track research progress with detailed agent status updates
        - **Citation Management**: Automatic source citation with customizable limits
        - **Go Deeper Mode**: Creative deep research with up to 100 agents for maximum coverage
        
        ## How to Use
        1. **Start Research**: POST to \`/api/research\` with your topic and preferences
        2. **Monitor Progress**: GET \`/api/research/{taskId}\` to check status and progress
        3. **Retrieve Results**: The final report will be included in the response when status is 'completed'
        
        ## Agent Types
        - **Analyst Agent**: Factual overviews and statistics
        - **Critical Agent**: Counterarguments and limitations
        - **Innovator Agent**: Future implications and trends
        - **Historical Agent**: Background and evolution
        - **Ethics Agent**: Moral and societal considerations
        - And more specialized agents...
      `,
      contact: {
        name: 'Deep Research AI Support',
        email: 'support@deepresearch.ai'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: `http://localhost:${port}`,
        description: 'Development server'
      }
    ],
    tags: [
      {
        name: 'Research',
        description: 'Research task management and execution'
      },
      {
        name: 'Configuration',
        description: 'Agent configuration and setup'
      }
    ]
  },
  apis: ['./src/routes/*.ts'], // Path to the API files
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Swagger UI setup
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customSiteTitle: 'Deep Research AI API Documentation',
  customCss: `
    .swagger-ui .topbar { display: none; }
    .swagger-ui .info .title { color: #4f46e5; }
    .swagger-ui .scheme-container { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
  `,
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    docExpansion: 'none',
    filter: true,
    showExtensions: true,
    tryItOutEnabled: true,
  }
}));

// API routes
app.use('/api', researchRoutes);

// Documentation page
app.get('/docs', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Deep Research AI API - Documentation</title>
        <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
        <link href="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/themes/prism.min.css" rel="stylesheet">
        <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-core.min.js"></script>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/plugins/autoloader/prism-autoloader.min.js"></script>
    </head>
    <body class="bg-gray-900 text-gray-100">
        <div class="min-h-screen">
            <!-- Header -->
            <header class="bg-gradient-to-r from-blue-600 to-purple-700 shadow-lg">
                <div class="max-w-7xl mx-auto px-4 py-6">
                    <h1 class="text-4xl font-bold text-white">Deep Research AI API</h1>
                    <p class="text-blue-100 mt-2">Multi-agent research synthesis with Gemini AI</p>
                </div>
            </header>

            <!-- Navigation -->
            <nav class="bg-gray-800 border-b border-gray-700">
                <div class="max-w-7xl mx-auto px-4">
                    <div class="flex space-x-8">
                        <a href="#overview" class="py-4 px-2 border-b-2 border-blue-500 text-blue-400 font-medium">Overview</a>
                        <a href="#quickstart" class="py-4 px-2 text-gray-300 hover:text-white">Quick Start</a>
                        <a href="#examples" class="py-4 px-2 text-gray-300 hover:text-white">Examples</a>
                        <a href="/api-docs" class="py-4 px-2 text-gray-300 hover:text-white">API Reference</a>
                        <a href="#try-it" class="py-4 px-2 text-gray-300 hover:text-white">Try It Out</a>
                    </div>
                </div>
            </nav>

            <!-- Content -->
            <main class="max-w-7xl mx-auto px-4 py-8">
                <!-- Overview Section -->
                <section id="overview" class="mb-12">
                    <h2 class="text-3xl font-bold mb-6">Overview</h2>
                    <div class="bg-gray-800 rounded-lg p-6 mb-6">
                        <p class="text-lg mb-4">
                            The Deep Research AI API enables you to conduct comprehensive research on any topic using multiple specialized AI agents. Each agent approaches the topic from a different perspective, ensuring thorough coverage and diverse insights.
                        </p>
                        <div class="grid md:grid-cols-2 gap-6 mt-6">
                            <div>
                                <h3 class="text-xl font-semibold mb-3 text-blue-400">Key Features</h3>
                                <ul class="space-y-2">
                                    <li class="flex items-center"><span class="text-green-400 mr-2">✓</span> Multi-agent research system</li>
                                    <li class="flex items-center"><span class="text-green-400 mr-2">✓</span> Auto-configuration of agents</li>
                                    <li class="flex items-center"><span class="text-green-400 mr-2">✓</span> Real-time progress tracking</li>
                                    <li class="flex items-center"><span class="text-green-400 mr-2">✓</span> Multiple output formats</li>
                                    <li class="flex items-center"><span class="text-green-400 mr-2">✓</span> Automatic citation management</li>
                                    <li class="flex items-center"><span class="text-green-400 mr-2">✓</span> Creative "Go Deeper" mode</li>
                                </ul>
                            </div>
                            <div>
                                <h3 class="text-xl font-semibold mb-3 text-purple-400">Agent Types</h3>
                                <ul class="space-y-2 text-sm">
                                    <li><strong>Analyst:</strong> Factual data and statistics</li>
                                    <li><strong>Critical:</strong> Counterarguments and limitations</li>
                                    <li><strong>Innovator:</strong> Future trends and implications</li>
                                    <li><strong>Historical:</strong> Background and evolution</li>
                                    <li><strong>Ethics:</strong> Moral considerations</li>
                                    <li><strong>Comparative:</strong> Comparisons and contrasts</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </section>

                <!-- Quick Start Section -->
                <section id="quickstart" class="mb-12">
                    <h2 class="text-3xl font-bold mb-6">Quick Start</h2>
                    <div class="space-y-6">
                        <div class="bg-gray-800 rounded-lg p-6">
                            <h3 class="text-xl font-semibold mb-4">1. Start a Research Task</h3>
                            <pre class="bg-gray-900 rounded p-4 overflow-x-auto"><code class="language-bash">curl -X POST http://localhost:${port}/api/research \\
  -H "Content-Type: application/json" \\
  -d '{
    "researchTopic": "The impact of artificial intelligence on healthcare",
    "responseType": "Report",
    "autoAgents": true,
    "includeCitations": true
  }'</code></pre>
                        </div>

                        <div class="bg-gray-800 rounded-lg p-6">
                            <h3 class="text-xl font-semibold mb-4">2. Check Progress</h3>
                            <pre class="bg-gray-900 rounded p-4 overflow-x-auto"><code class="language-bash">curl http://localhost:${port}/api/research/{taskId}</code></pre>
                        </div>

                        <div class="bg-gray-800 rounded-lg p-6">
                            <h3 class="text-xl font-semibold mb-4">3. Get Results</h3>
                            <p class="mb-4">When the status is 'completed', the response will include the final report and sources:</p>
                            <pre class="bg-gray-900 rounded p-4 overflow-x-auto"><code class="language-json">{
  "taskId": "uuid-here",
  "status": "completed",
  "progress": 100,
  "finalReport": "# Research Report...",
  "sources": [
    {
      "id": 1,
      "uri": "https://example.com/article",
      "title": "Article Title"
    }
  ]
}</code></pre>
                        </div>
                    </div>
                </section>

                <!-- Examples Section -->
                <section id="examples" class="mb-12">
                    <h2 class="text-3xl font-bold mb-6">Request Examples</h2>
                    <div class="space-y-6">
                        <div class="bg-gray-800 rounded-lg p-6">
                            <h3 class="text-xl font-semibold mb-4">Basic Research (Auto-configured agents)</h3>
                            <pre class="bg-gray-900 rounded p-4 overflow-x-auto"><code class="language-json">{
  "researchTopic": "Climate change adaptation strategies",
  "autoAgents": true,
  "responseType": "Report",
  "includeCitations": true
}</code></pre>
                        </div>

                        <div class="bg-gray-800 rounded-lg p-6">
                            <h3 class="text-xl font-semibold mb-4">Manual Agent Configuration</h3>
                            <pre class="bg-gray-900 rounded p-4 overflow-x-auto"><code class="language-json">{
  "researchTopic": "Quantum computing applications",
  "autoAgents": false,
  "numAgents": 5,
  "responseType": "Research Paper",
  "includeCitations": true,
  "limitCitationsToThree": false
}</code></pre>
                        </div>

                        <div class="bg-gray-800 rounded-lg p-6">
                            <h3 class="text-xl font-semibold mb-4">Deep Creative Research</h3>
                            <pre class="bg-gray-900 rounded p-4 overflow-x-auto"><code class="language-json">{
  "researchTopic": "Future of space exploration",
  "goDeeper": true,
  "responseType": "Article",
  "includeCitations": true
}</code></pre>
                        </div>
                    </div>
                </section>

                <!-- Try It Out Section -->
                <section id="try-it" class="mb-12">
                    <h2 class="text-3xl font-bold mb-6">Try It Out</h2>
                    <div class="bg-gray-800 rounded-lg p-6">
                        <form id="researchForm" class="space-y-4">
                            <div>
                                <label class="block text-sm font-medium mb-2">Research Topic *</label>
                                <input type="text" id="researchTopic" class="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white" 
                                       placeholder="Enter your research topic..." required>
                            </div>
                            
                            <div class="grid md:grid-cols-2 gap-4">
                                <div>
                                    <label class="block text-sm font-medium mb-2">Response Type</label>
                                    <select id="responseType" class="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white">
                                        <option value="Report">Report</option>
                                        <option value="Article">Article</option>
                                        <option value="Research Paper">Research Paper</option>
                                    </select>
                                </div>
                                
                                <div>
                                    <label class="block text-sm font-medium mb-2">Number of Agents</label>
                                    <input type="number" id="numAgents" min="1" max="10" value="3" 
                                           class="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white">
                                </div>
                            </div>
                            
                            <div class="flex flex-wrap gap-4">
                                <label class="flex items-center">
                                    <input type="checkbox" id="autoAgents" checked class="mr-2">
                                    Auto-configure agents
                                </label>
                                <label class="flex items-center">
                                    <input type="checkbox" id="includeCitations" checked class="mr-2">
                                    Include citations
                                </label>
                                <label class="flex items-center">
                                    <input type="checkbox" id="goDeeper" class="mr-2">
                                    Go Deeper mode
                                </label>
                            </div>
                            
                            <button type="submit" class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg">
                                Start Research
                            </button>
                        </form>
                        
                        <div id="results" class="mt-6 hidden">
                            <h3 class="text-xl font-semibold mb-4">Results</h3>
                            <div id="resultsContent" class="bg-gray-900 p-4 rounded-lg overflow-x-auto">
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            <!-- Footer -->
            <footer class="bg-gray-800 border-t border-gray-700 mt-12">
                <div class="max-w-7xl mx-auto px-4 py-6 text-center text-gray-400">
                    <p>&copy; 2024 Deep Research AI. Powered by Google Gemini.</p>
                    <p class="text-sm mt-2">
                        <a href="/api-docs" class="text-blue-400 hover:text-blue-300">API Documentation</a> | 
                        <a href="https://github.com" class="text-blue-400 hover:text-blue-300 ml-2">GitHub</a>
                    </p>
                </div>
            </footer>
        </div>

        <script>
            document.getElementById('researchForm').addEventListener('submit', async (e) => {
                e.preventDefault();
                
                const formData = {
                    researchTopic: document.getElementById('researchTopic').value,
                    responseType: document.getElementById('responseType').value,
                    numAgents: parseInt(document.getElementById('numAgents').value),
                    autoAgents: document.getElementById('autoAgents').checked,
                    includeCitations: document.getElementById('includeCitations').checked,
                    goDeeper: document.getElementById('goDeeper').checked
                };
                
                try {
                    const response = await fetch('/api/research', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(formData)
                    });
                    
                    const result = await response.json();
                    
                    document.getElementById('results').classList.remove('hidden');
                    document.getElementById('resultsContent').innerHTML = 
                        '<pre><code class="language-json">' + 
                        JSON.stringify(result, null, 2) + 
                        '</code></pre>';
                    
                    if (result.taskId) {
                        pollTaskStatus(result.taskId);
                    }
                } catch (error) {
                    document.getElementById('results').classList.remove('hidden');
                    document.getElementById('resultsContent').innerHTML = 
                        '<div class="text-red-400">Error: ' + error.message + '</div>';
                }
            });
            
            async function pollTaskStatus(taskId) {
                const interval = setInterval(async () => {
                    try {
                        const response = await fetch('/api/research/' + taskId);
                        const result = await response.json();
                        
                        document.getElementById('resultsContent').innerHTML = 
                            '<pre><code class="language-json">' + 
                            JSON.stringify(result, null, 2) + 
                            '</code></pre>';
                        
                        if (result.status === 'completed' || result.status === 'error') {
                            clearInterval(interval);
                        }
                    } catch (error) {
                        clearInterval(interval);
                    }
                }, 2000);
            }
        </script>
    </body>
    </html>
  `);
});

// API info endpoint
app.get('/api', (req, res) => {
  res.json({
    name: 'Deep Research AI API',
    version: '1.0.0',
    description: 'Multi-agent research synthesis with Gemini AI',
    endpoints: {
      'POST /api/research': {
        method: 'POST',
        description: 'Start a new research task',
        parameters: ['researchTopic', 'numAgents?', 'autoAgents?', 'responseType?', 'includeCitations?', 'goDeeper?']
      },
      'GET /api/research/:taskId': {
        method: 'GET',
        description: 'Get research task status and results',
        parameters: ['taskId']
      },
      'POST /api/configure-agents': {
        method: 'POST',
        description: 'Auto-configure agents for a research topic',
        parameters: ['researchTopic']
      },
      'GET /api/tasks': {
        method: 'GET',
        description: 'Get all active research tasks',
        parameters: []
      }
    },
    documentation: {
      interactive: '/api-docs',
      static: '/docs'
    }
  });
});

// Root redirect
app.get('/', (req, res) => {
  res.redirect('/docs');
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not found',
    message: 'The requested resource was not found',
    statusCode: 404,
    timestamp: new Date().toISOString()
  });
});

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
    statusCode: 500,
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(port, () => {
  console.log(`
🚀 Deep Research AI API Server Started!

📍 Server: http://localhost:${port}
📚 Documentation: http://localhost:${port}/docs  
🔧 API Reference: http://localhost:${port}/api-docs
🧪 Try API: http://localhost:${port}/api

Environment: ${process.env.NODE_ENV || 'development'}
Rate Limit: ${process.env.RATE_LIMIT_MAX_REQUESTS || DEFAULT_RATE_LIMIT_MAX_REQUESTS} requests per ${Math.floor((parseInt(process.env.RATE_LIMIT_WINDOW_MS || DEFAULT_RATE_LIMIT_WINDOW_MS.toString())) / 60000)} minutes

Make sure to set your API_KEY environment variable!
`);
}); 