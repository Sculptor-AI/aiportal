# 🗑️ Data Reset & Progress Bar Testing Guide

## Quick Reset Options

### Option 1: Using the UI (Recommended)
1. Open `http://localhost:3001/test-page.html`
2. Click the **"Reset All Data"** button (red button)
3. Confirm the warning dialog
4. All data will be cleared and the page will refresh

### Option 2: Using the Command Line
```bash
node reset-data.js
```
This will:
- Show current data statistics
- Create a backup of your data
- Clear all articles and generation cycles
- Prepare the system for fresh use

### Option 3: Manual Reset
Delete the data file directly:
```bash
rm data/articles.json
```

## 🧪 Testing the Progress Bar

### 1. Start Fresh
After resetting, you should see:
- 0 Total Articles
- System Status: healthy
- No articles displayed

### 2. Generate News
1. Click **"Generate News Cycle"** or **"Force Generate News Cycle"**
2. The progress bar should appear immediately showing:
   - Blue border around the progress container
   - Progress percentage
   - Current phase description
   - Article counters
   - Time elapsed

### 3. Debug Information
Open the browser console (F12) to see:
- 🔌 SSE connection status
- 📊 Progress updates
- 📨 Event messages
- Any errors or issues

### 4. Monitor Progress
The progress bar will show:
- **Initializing** - Cleaning up old articles
- **Discovery** - Finding news events
- **Selection** - AI choosing articles
- **Researching** - Agents gathering information
- **Writing** - Creating articles
- **Publishing** - Finalizing

## 🐛 Troubleshooting

### Progress Bar Not Showing?
1. **Check Console**: Look for errors in browser console
2. **Check Network**: Ensure SSE connection is established (Network tab → EventStream)
3. **Force Refresh**: Ctrl+F5 to clear cache
4. **Toggle Debug**: Click "Toggle Debug" to see real-time logs

### SSE Connection Issues?
- The system will auto-reconnect every 5 seconds
- Check if the API is running on port 3001
- Look for CORS or connection errors in console

### Generation Not Starting?
1. Ensure API is running: `npm run dev`
2. Check API health: `http://localhost:3001/api/health`
3. Try "Force Generate" instead of regular generate
4. Check debug logs for errors

## 📝 Additional Commands

### Test API Endpoints
```bash
node test-api.js
```

### Check API Status
```bash
curl http://localhost:3001/api/health
```

### View Current Progress
```bash
curl http://localhost:3001/api/generation/progress
```

### View Debug Info
```bash
curl http://localhost:3001/api/debug/info
```

## 🎯 Expected Behavior

When everything works correctly:
1. Progress bar appears immediately after clicking generate
2. Real-time updates show phase changes
3. Article counter increments as articles complete
4. Progress bar fills from 0% to 100%
5. Success message appears when complete
6. Articles appear in the main view

## 💡 Pro Tips

- Keep the debug panel open during generation to see detailed logs
- The progress bar will persist even if you refresh the page during generation
- Use "Force Generate" to bypass the normal article limits
- Check generation history to see past performance 