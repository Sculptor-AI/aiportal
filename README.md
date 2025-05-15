# <img src="https://ai.explodingcb.com/images/sculptor.svg" width="32" height="32" alt="Sculptor Logo" style="vertical-align: middle; margin-right: 10px;"> Sculptor AI

<div align="center">
  <img src="https://ai.explodingcb.com/images/sculptor.svg" width="120" height="120" alt="Sculptor Logo">
  <h3>Your AI Conversation Portal</h3>
  <p>A sleek, modern interface for interacting with multiple AI models</p>

  <div style="display: flex; justify-content: center; gap: 10px; flex-wrap: wrap; margin: 20px 0;">
    <span style="background: #f0f2f5; padding: 6px 12px; border-radius: 20px; font-size: 14px; font-weight: 500;">#ReactJS</span>
    <span style="background: #f0f2f5; padding: 6px 12px; border-radius: 20px; font-size: 14px; font-weight: 500;">#AI</span>
    <span style="background: #f0f2f5; padding: 6px 12px; border-radius: 20px; font-size: 14px; font-weight: 500;">#StyledComponents</span>
    <span style="background: #f0f2f5; padding: 6px 12px; border-radius: 20px; font-size: 14px; font-weight: 500;">#ViteJS</span>
  </div>
</div>

## ✨ Features

<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 20px; margin: 20px 0;">
  <div style="background: #f8f9fa; padding: 20px; border-radius: 10px;">
    <h3>🌈 Multiple Themes</h3>
    <p>Choose from 8 beautiful themes including Light, Dark, OLED, Ocean, Forest, Pride, Bisexual, and Trans themes</p>
  </div>
  <div style="background: #f8f9fa; padding: 20px; border-radius: 10px;">
    <h3>🤖 Multiple AI Models</h3>
    <p>Seamlessly switch between Gemini, Claude, ChatGPT, and locally hosted models</p>
  </div>
  <div style="background: #f8f9fa; padding: 20px; border-radius: 10px;">
    <h3>🔒 Local First</h3>
    <p>All data stored locally in your browser with optional login for syncing settings</p>
  </div>
  <div style="background: #f8f9fa; padding: 20px; border-radius: 10px;">
    <h3>📱 Responsive Design</h3>
    <p>Works beautifully on desktop, tablet, and mobile devices</p>
  </div>
</div>

## 🚀 Getting Started

### Prerequisites

- Node.js (v16+)
- npm or yarn

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/sculptor-ai.git
cd sculptor-ai
```

2. Install dependencies
```bash
npm install
# or
yarn install
```

3. Create a `.env` file with your API keys (optional)
```bash
cp .env.example .env
```

4. Start the development server
```bash
npm run dev
# or
yarn dev
```

5. Open your browser and navigate to:
   - Local development: `http://localhost:3009`
   - Production deployment: `https://ai.explodingcb.com`

## 🚀 Deployment

### Vercel Deployment

The application is deployed on the following URLs:

- Frontend: https://ai.explodingcb.com
- Backend: https://aiportal-backend.vercel.app

Environment variables are configured in the deployment dashboard for both the frontend and backend projects. The frontend is set to use the backend URL via the `VITE_BACKEND_API_URL` environment variable.

### Custom Deployment

You can deploy this application to your own infrastructure. Make sure to set the appropriate environment variables as described in the Configuration section.

## 🔧 Configuration

### API Keys

Sculptor supports the following AI providers:

<div style="display: flex; flex-wrap: wrap; gap: 10px; margin: 20px 0;">
  <span style="background: linear-gradient(135deg, #1B72E8, #EA4335); color: white; padding: 8px 15px; border-radius: 20px; font-size: 14px; font-weight: 500;">Gemini AI</span>
  <span style="background: linear-gradient(135deg, #732BEB, #A480EB); color: white; padding: 8px 15px; border-radius: 20px; font-size: 14px; font-weight: 500;">Claude</span>
  <span style="background: linear-gradient(135deg, #10A37F, #1A7F64); color: white; padding: 8px 15px; border-radius: 20px; font-size: 14px; font-weight: 500;">ChatGPT</span>
  <span style="background: linear-gradient(135deg, #FF5722, #FF9800); color: white; padding: 8px 15px; border-radius: 20px; font-size: 14px; font-weight: 500;">Ursa Minor (Local)</span>
</div>

Add your API keys to the `.env` file or enter them in the settings panel within the app:

```
VITE_OPENAI_API_KEY=sk-...
VITE_ANTHROPIC_API_KEY=sk-ant-...
VITE_GOOGLE_API_KEY=AIzaSy...
VITE_CUSTOM_GGUF_API_URL=http://localhost:8000
```

## 🎨 Customization

Sculptor offers extensive customization options:

### Themes
- 🌞 Light
- 🌙 Dark
- ⚫ OLED
- 🌊 Ocean
- 🌲 Forest
- 🌈 Pride
- 💖 Bisexual
- 💙 Trans

### Accessibility Features
- High contrast mode
- Reduced motion
- Adjustable font sizes
- Customizable line spacing
- Multiple font families

### Chat Experience
- Adjustable message bubbles
- Custom message spacing
- Message alignment options
- Timestamp toggle
- Code syntax highlighting

## 🖥️ Using with Local Models

Sculptor supports connecting to locally hosted models through the Ursa Minor API:

1. Set up your local model server
2. Configure the API URL in settings
3. Select "Ursa Minor" as your model

## 🧩 Architecture

Sculptor is built with modern React best practices:

- **React 18** with functional components and hooks
- **Styled Components** for theme-aware styling
- **Context API** for state management
- **Vite** for lightning-fast builds
- **LocalStorage/SessionStorage** for persistence

## 🌟 Acknowledgments

- UI design inspired by modern messaging applications
- SVG icons from [Lucide React](https://lucide.dev/)
- Background images from [Unsplash](https://unsplash.com/)

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## Backend Integration

This application now includes a backend server that integrates with the frontend to provide:

1. Secure API access to multiple AI models
2. Unified model selection in the frontend
3. Secure communication with encryption
4. Model allowlisting to prevent abuse

For detailed setup and usage instructions, see [BACKEND_INTEGRATION.md](BACKEND_INTEGRATION.md).

### Quick Setup for Backend

1. Navigate to the backend directory:
   ```
   cd backend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file based on the example in the backend documentation
   
4. Start the backend server:
   ```
   npm start
   ```

The frontend will automatically connect to the backend if the proper environment variable (`VITE_BACKEND_API_URL`) is set.

---

<div align="center">
  <p>Made with ❤️ by Chase & Kellen</p>
  <p>
    <span style="background: #f0f2f5; padding: 6px 12px; border-radius: 20px; font-size: 14px; font-weight: 500;">v0.1.0</span>
  </p>
</div>