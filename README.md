<div align="center">
  <img src="https://ai.explodingcb.com/images/sculptor.svg" width="120" height="120" alt="Sculptor AI Logo" />
  <h1>Sculptor AI</h1>
  <p><strong>Your All in One AI Portal</strong></p>
  <p>A powerful, feature-rich interface for interacting with multiple AI models, creating content, and exploring ideas.</p>

  <p>
    <a href="https://reactjs.org/"><img src="https://img.shields.io/badge/React-20232A?style=flat-square&logo=react&logoColor=61DAFB" alt="React" /></a>
    <a href="https://pages.cloudflare.com/"><img src="https://img.shields.io/badge/Cloudflare_Pages-F38020?style=flat-square&logo=cloudflare&logoColor=white" alt="Cloudflare Pages" /></a>
    <a href="https://styled-components.com/"><img src="https://img.shields.io/badge/Styled_Components-DB7093?style=flat-square&logo=styled-components&logoColor=white" alt="Styled Components" /></a>
    <img src="https://img.shields.io/badge/PWA-Ready-success?style=flat-square" alt="PWA Ready" />
    <img src="https://img.shields.io/badge/License-MIT-blue?style=flat-square" alt="License" />
  </p>
</div>

<br />

## ✨ Features Overview

<table>
  <tr>
    <td width="50%" valign="top">
      <h3>🤖 AI Models & Capabilities</h3>
      <ul>
        <li><strong>Multiple AI Models</strong>: Access cutting-edge models from Anthropic (Claude), OpenAI (ChatGPT), Google (Gemini), Meta, NVIDIA, and custom backend models.</li>
        <li><strong>Thinking Mode</strong>: Deep analysis mode with chain-of-thought reasoning for complex problem solving.</li>
        <li><strong>Web Search</strong>: Real-time web search integration powered by Brave Search API.</li>
        <li><strong>Deep Research</strong>: Enhanced research mode combining multiple sources for comprehensive answers.</li>
      </ul>
    </td>
    <td width="50%" valign="top">
      <h3>🎨 Creative Tools</h3>
      <ul>
        <li><strong>AI Image Generation</strong>: Create stunning images from text prompts.</li>
        <li><strong>Whiteboard</strong>: Digital drawing canvas for sketching ideas.</li>
        <li><strong>Graphing Calculator</strong>: Advanced mathematical graphing and visualization.</li>
        <li><strong>Equation Editor</strong>: LaTeX-based equation editor.</li>
        <li><strong>Flowchart Builder</strong>: Interactive diagram creation tool.</li>
        <li><strong>3D Sandbox</strong>: 3D visualization environment powered by Three.js.</li>
      </ul>
    </td>
  </tr>
  <tr>
    <td width="50%" valign="top">
      <h3>📱 Platform Features</h3>
      <ul>
        <li><strong>Progressive Web App</strong>: Install as a native app on any device with offline support.</li>
        <li><strong>File Support</strong>: Process images, PDFs, and text files directly in chat.</li>
        <li><strong>News & Media Hub</strong>: Built-in RSS reader with AI-powered summaries.</li>
        <li><strong>Privacy First</strong>: Optional login, encrypted local storage by default.</li>
      </ul>
    </td>
    <td width="50%" valign="top">
      <h3>🛠 Customization</h3>
      <ul>
        <li><strong>15+ Beautiful Themes</strong>: Including Light, Dark, OLED, Ocean, Cyberpunk, and more.</li>
        <li><strong>Chat Sharing</strong>: Share conversations via secure links.</li>
        <li><strong>Mobile Experience</strong>: Touch-optimized interface for iOS/Android.</li>
      </ul>
    </td>
  </tr>
</table>

<br />

## 🚀 Getting Started

### Prerequisites

*   Node.js (v16+)
*   npm or yarn

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/yourusername/sculptor-ai.git
    cd sculptor-ai
    ```

2.  **Install dependencies**
    ```bash
    npm install
    # or
    yarn install
    ```

3.  **Configure Environment** (Optional)
    ```bash
    cp .env.example .env
    ```

4.  **Start Development Server**
    ```bash
    npm run dev
    ```

5.  **Access the App**
    *   Local: `http://localhost:3009`
    *   Production: `https://ai.explodingcb.com`

---

## ☁️ Deployment

### Cloudflare Pages

This application is optimized for **Cloudflare Pages**, offering edge deployment, automatic HTTPS, and zero-configuration builds.

<details>
<summary><strong>Click to view Deployment Steps</strong></summary>

1.  Fork this repository to your GitHub account.
2.  Log in to [Cloudflare Pages](https://pages.cloudflare.com).
3.  Create a new project and connect your GitHub repository.
4.  Configure build settings:
    *   **Build command:** `npm run build`
    *   **Build output directory:** `dist`
5.  Deploy!
</details>

<details>
<summary><strong>Environment Variables</strong></summary>

Set these in your Cloudflare Pages dashboard or `.env` file:

```bash
VITE_BACKEND_API_URL=https://your-backend-api.com
VITE_OPENAI_API_KEY=sk-...
VITE_ANTHROPIC_API_KEY=sk-ant-...
VITE_GOOGLE_API_KEY=AIzaSy...
VITE_CUSTOM_GGUF_API_URL=http://localhost:8000
```
</details>

### Backend Setup

The backend handles unified API requests, web search, and custom models.

1.  Navigate to `aiportal/backend`
2.  Install dependencies: `npm install`
3.  Configure `.env` (see `backend/.env.example`)
4.  Start server: `npm start`

---

## 📚 Documentation

Detailed documentation is available in the `documentation/docs` directory:

*   [📖 API Documentation](documentation/docs/API_DOCUMENTATION.md)
*   [💻 Development Guide](documentation/docs/DEVELOPMENT_GUIDE.md)
*   [🏗 Backend Architecture](documentation/docs/BACKEND_ARCHITECTURE.md)

---

## 🤝 Contributing & License

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

This project is licensed under the **MIT License**.

<div align="center">
  <br />
  <p>Made with ❤️ by Team Sculptor</p>
  <p>
    <a href="https://ai.explodingcb.com">Live Demo</a> •
    <a href="https://github.com/yourusername/sculptor-ai">GitHub</a> •
    <a href="https://discord.gg/sculptor">Discord</a>
  </p>
</div>
