

# Sculptor AI

**Your All in One AI Portal**

A powerful, feature-rich interface for interacting with multiple AI models, creating content, and exploring ideas.



  


## ✨ Features Overview


|                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |                                                                                                                                                                                                                                                                                                                                                                                                                  |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 🤖 AI Models & Capabilities- **Multiple AI Models**: Access cutting-edge models from Anthropic (Claude), OpenAI (ChatGPT), Google (Gemini), Meta, NVIDIA, and custom backend models.- **Thinking Mode**: Deep analysis mode with chain-of-thought reasoning for complex problem solving.- **Web Search**: Real-time web search integration powered by Brave Search API.- **Deep Research**: Enhanced research mode combining multiple sources for comprehensive answers. | 🎨 Creative Tools- **AI Image Generation**: Create stunning images from text prompts.- **Whiteboard**: Digital drawing canvas for sketching ideas.- **Graphing Calculator**: Advanced mathematical graphing and visualization.- **Equation Editor**: LaTeX-based equation editor.- **Flowchart Builder**: Interactive diagram creation tool.- **3D Sandbox**: 3D visualization environment powered by Three.js. |
| 📱 Platform Features- **Progressive Web App**: Install as a native app on any device with offline support.- **File Support**: Process images, PDFs, and text files directly in chat.- **News & Media Hub**: Built-in RSS reader with AI-powered summaries.- **Privacy First**: Optional login, encrypted local storage by default.                                                                                                                                       | 🛠 Customization- **15+ Beautiful Themes**: Including Light, Dark, OLED, Ocean, Cyberpunk, and more.- **Chat Sharing**: Share conversations via secure links.- **Mobile Experience**: Touch-optimized interface for iOS/Android.                                                                                                                                                                                |


  


## 🚀 Getting Started

### Prerequisites

- Node.js (v16+)
- npm or yarn

### Installation

1. **Clone the repository**
  ```bash
    git clone https://github.com/yourusername/sculptor-ai.git
    cd sculptor-ai
  ```
2. **Install dependencies**
  ```bash
    npm install
    # or
    yarn install
  ```
3. **Configure Environment** (Optional)
  ```bash
    cp .env.example .env
  ```
4. **Start Development Server**
  ```bash
    npm run dev
  ```
5. **Access the App**
  - Local: `http://localhost:3009`
  - Production: `https://ai.explodingcb.com`

---

## ☁️ Deployment

### Cloudflare Pages

This application is optimized for **Cloudflare Pages**, offering edge deployment, automatic HTTPS, and zero-configuration builds.

**Click to view Deployment Steps**

1. Fork this repository to your GitHub account.
2. Log in to [Cloudflare Pages](https://pages.cloudflare.com).
3. Create a new project and connect your GitHub repository.
4. Configure build settings:
  - **Build command:** `npm run build`
  - **Build output directory:** `dist`
5. Deploy!



**Environment Variables**

Set these in your Cloudflare Pages dashboard or `.env` file:

```bash
VITE_REMOTE_BACKEND_URL=https://your-backend-api.com
VITE_LOCAL_BACKEND_PROXY_TARGET=http://localhost:8787
# Frontend should NOT include provider API keys.
# Configure provider keys on the backend (Worker secrets/.dev.vars) only:
OPENROUTER_API_KEY=...
GEMINI_API_KEY=...
ANTHROPIC_API_KEY=...
OPENAI_API_KEY=...
CORS_ALLOWED_ORIGINS=https://sculptorai.org,http://localhost:3009

# Optional deep research overrides
DEEP_RESEARCH_PLANNER_MODEL=gemini-3.1-pro
DEEP_RESEARCH_RESEARCHER_MODEL=gemini-3-flash
DEEP_RESEARCH_WRITER_MODEL=claude-sonnet-4.6
DEEP_RESEARCH_MAX_AGENTS=12
```



### Backend Setup

The backend handles unified API requests, web search, and custom models.

1. Navigate to `aiportal/backend`
2. Install dependencies: `npm install`
3. Configure `.env` (see `backend/.env.example`)
4. Start server: `npm start`

### Account Setup

Newly registered users are assigned `pending` status and cannot log in until an administrator activates their account. On a fresh local deployment, create the first administrator directly in Workers KV.

1. Determine the KV namespace ID used by your local or preview worker:
  ```bash
    cd backend
    npx wrangler kv namespace list
  ```
    Confirm that `backend/wrangler.toml` references the namespace you intend to use.
2. Generate the admin record:
  ```bash
    cd backend
    KV_NAMESPACE_ID=<kv-id> node scripts/create-admin.js admin admin@example.org "use-a-strong-password"
  ```
    The script prints a user ID and writes a temporary file named `admin-user-<id>.json`.
3. Import the admin into KV with Wrangler v4:
  ```bash
    npx wrangler kv key put --namespace-id=<kv-id> "user:<user-id>" --path "/absolute/path/to/admin-user-<id>.json"
    npx wrangler kv key put --namespace-id=<kv-id> "username:admin" "<user-id>"
    npx wrangler kv key put --namespace-id=<kv-id> "email:admin@example.org" "<user-id>"
  ```
    If you are targeting the deployed worker rather than local KV, add `--remote` to each command.
4. Delete the temporary JSON file after the import completes.
5. Sign in through `POST /api/admin/auth/login`, then approve normal users with:
  ```http
    PUT /api/admin/users/:userId/status
    Content-Type: application/json

    {"status":"active"}
  ```

---

## 📚 Documentation

Detailed documentation is available in the `documentation/docs` directory:

- [📖 API Documentation](documentation/docs/API_DOCUMENTATION.md)
- [💻 Development Guide](documentation/docs/DEVELOPMENT_GUIDE.md)
- [🏗 Backend Architecture](documentation/docs/BACKEND_ARCHITECTURE.md)

---

## 🤝 Contributing & License

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

This project is licensed under the **MIT License**.

  


Made with ❤️ by Team Sculptor

[Live Demo](https://ai.explodingcb.com) • [GitHub](https://github.com/yourusername/sculptor-ai) • [Discord](https://discord.gg/sculptor)