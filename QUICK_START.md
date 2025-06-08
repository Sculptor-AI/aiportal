# Quick Start Guide 🚀

Get AI Portal running in under 5 minutes!

## 1. Backend Setup (Terminal 1)

```bash
# Navigate to backend
cd C:\Users\kelle\OneDrive\Documents\GitHub\aiportal\backend

# Create .env file (if not exists)
Copy-Item config.example.txt .env

# Edit .env and add your GEMINI_API_KEY
# Then start the backend:
npm start
```

## 2. Frontend Setup (Terminal 2)

```bash
# Navigate to PROJECT ROOT (not backend!)
cd C:\Users\kelle\OneDrive\Documents\GitHub\aiportal

# Start frontend
npm run dev
```

## 3. Open Browser

Visit: http://localhost:5173

## 4. Try These Features

- **Research**: http://localhost:5173/research
- **News**: http://localhost:5173/news
- **Chat**: http://localhost:5173

## ⚠️ Common Mistake

**Wrong**: `npm start` in root directory  
**Right**: `npm run dev` in root directory

## 📝 Required: Add Your API Key

Edit `backend/.env` and replace:
```
GEMINI_API_KEY=your_google_gemini_api_key_here
```
With your actual Gemini API key from https://makersuite.google.com/app/apikey

## 🆘 Quick Troubleshooting

**Backend not starting?**
- Check if you added GEMINI_API_KEY to .env
- Make sure port 3000 is free

**Frontend not starting?**
- Make sure you're in the root directory, NOT backend/
- Run `npm install` if you haven't already

**No news articles?**
```bash
cd backend
node scripts/force-news-generation.js
```

That's it! For detailed setup, see SETUP_GUIDE.md 