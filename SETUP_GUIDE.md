# AI Portal Setup Guide

This guide will help you set up and run the AI Portal application with integrated Deep Research and News Generation features.

## Prerequisites

Before starting, ensure you have:
- **Node.js** (v18 or higher) - [Download here](https://nodejs.org/)
- **npm** (comes with Node.js)
- **Git** (for cloning the repository)
- **Google Gemini API Key** - [Get one here](https://makersuite.google.com/app/apikey)

## Step-by-Step Setup

### Step 1: Clone or Navigate to the Repository

If you haven't cloned the repository yet:
```bash
git clone [your-repository-url]
cd aiportal
```

If you already have it, navigate to the project root:
```bash
cd C:\Users\kelle\OneDrive\Documents\GitHub\aiportal
```

### Step 2: Set Up the Backend

1. **Navigate to the backend directory**:
   ```bash
   cd backend
   ```

2. **Install backend dependencies**:
   ```bash
   npm install
   ```

3. **Create your environment configuration**:
   ```bash
   # Windows PowerShell
   Copy-Item config.example.txt .env
   
   # Or on Mac/Linux
   cp config.example.txt .env
   ```

4. **Edit the .env file**:
   Open `backend/.env` in your text editor and add your API keys:
   ```env
   # IMPORTANT: Replace with your actual Gemini API key
   GEMINI_API_KEY=your_actual_gemini_api_key_here
   
   # Optional: Add other API keys if you have them
   OPENROUTER_API_KEY=your_openrouter_api_key_here
   BRAVE_API_KEY=your_brave_api_key_here
   ```

5. **Start the backend server**:
   ```bash
   npm start
   ```
   
   You should see:
   ```
   ✅ Deep Research service initialized
   ✅ News generation scheduler started
   ✅ News service ready
   Server running on port 3000
   ```

### Step 3: Set Up the Frontend (New Terminal)

1. **Open a new terminal/PowerShell window**

2. **Navigate to the project root** (NOT the backend folder):
   ```bash
   cd C:\Users\kelle\OneDrive\Documents\GitHub\aiportal
   ```

3. **Install frontend dependencies**:
   ```bash
   npm install
   ```

4. **Start the frontend development server**:
   ```bash
   npm run dev
   ```
   
   You should see:
   ```
   VITE v[version] ready in [time] ms
   
   ➜  Local:   http://localhost:5173/
   ➜  Network: use --host to expose
   ```

### Step 4: Access the Application

Open your web browser and navigate to:
- **Frontend**: http://localhost:5173
- **Backend Health Check**: http://localhost:3000/health

## Features Available

### 1. Deep Research (`/research`)
- Navigate to http://localhost:5173/research
- Enter any research topic
- Click "Research" to start
- Watch real-time progress
- View and download generated reports

### 2. AI News (`/news`)
- Navigate to http://localhost:5173/news
- View AI-generated news articles
- Filter by category
- Save articles for later

### 3. Chat Interface (`/`)
- The main chat interface at http://localhost:5173
- Supports multiple AI models
- File attachments and image generation

## Common Issues & Solutions

### Issue: "npm start" not found in root directory
**Solution**: The frontend uses `npm run dev`, not `npm start`. Make sure you're in the root directory (not backend/).

### Issue: Cannot connect to backend
**Solution**: 
1. Ensure the backend is running on port 3000
2. Check if another process is using port 3000:
   ```bash
   # Windows
   netstat -ano | findstr :3000
   
   # Mac/Linux
   lsof -i :3000
   ```

### Issue: GEMINI_API_KEY not working
**Solution**:
1. Verify your API key is correct
2. Ensure you saved the .env file after editing
3. Restart the backend server after changing .env

### Issue: No news articles showing
**Solution**: Generate news articles manually:
```bash
cd backend
node scripts/force-news-generation.js
```

## Quick Commands Reference

### Backend (from `backend/` directory)
```bash
npm install          # Install dependencies
npm start           # Start backend server
npm run dev         # Start with auto-reload (if configured)
```

### Frontend (from root directory)
```bash
npm install         # Install dependencies  
npm run dev         # Start development server
npm run build       # Build for production
npm run preview     # Preview production build
```

### Generate News Manually
```bash
cd backend
node scripts/force-news-generation.js
```

## Testing the APIs

### Test Deep Research
```bash
# PowerShell
$body = @{researchTopic = "Future of AI"} | ConvertTo-Json
Invoke-WebRequest -Uri http://localhost:3000/api/research/start -Method POST -Body $body -ContentType "application/json"

# Bash/curl
curl -X POST http://localhost:3000/api/research/start \
  -H "Content-Type: application/json" \
  -d '{"researchTopic": "Future of AI"}'
```

### Test News Feed
```bash
# PowerShell
Invoke-WebRequest -Uri http://localhost:3000/api/news/feed

# Bash/curl
curl http://localhost:3000/api/news/feed
```

## Project Structure Overview

```
aiportal/
├── backend/               # Backend server
│   ├── .env              # Environment variables (create this)
│   ├── server.js         # Main server file
│   ├── package.json      # Backend dependencies
│   └── services/         # AI services
├── src/                  # Frontend source
│   ├── pages/           # Page components
│   └── App.jsx          # Main app component
├── package.json         # Frontend dependencies
└── vite.config.js       # Frontend build config
```

## Next Steps

1. **Explore the Research Feature**: Try researching different topics
2. **Generate News**: Run the news generation script
3. **Customize**: Edit topics.json to change news categories
4. **Deploy**: See IMPLEMENTATION_COMPLETE.md for production tips

## Need Help?

- Check backend logs in the terminal running `npm start`
- Check browser console for frontend errors (F12)
- Verify all services are running: http://localhost:3000/health
- Review documentation in AIPORTAL_INTEGRATION.md

Happy coding! 🚀 