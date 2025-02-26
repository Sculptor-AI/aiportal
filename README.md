# AI Portal

A multi-model AI chat interface that connects to multiple LLM APIs including OpenAI, Anthropic, and Google's Gemini.

## Features

- Connect to ChatGPT, Claude, and Gemini APIs
- User account system with secure authentication
- Persistent chat history
- Multiple theme options including light, dark, and bisexual themes
- Code syntax highlighting
- Personal API key management
- Responsive design

## Setup

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/aiportal.git
cd aiportal

# Install dependencies
npm install
```

### Configuration

Create a `.env` file with your API keys (optional, as users can add their own in settings):

```bash
cp .env.example .env
```

Edit the `.env` file to add your API keys:

```
VITE_OPENAI_API_KEY=your_openai_key_here
VITE_CLAUDE_API_KEY=your_anthropic_key_here
VITE_GEMINI_API_KEY=your_google_key_here
```

## Development

Start the development server:

```bash
npm run dev
```

This will start the app on [http://localhost:3009](http://localhost:3009).

## Building for Production

Build a production version:

```bash
npm run build
```

This creates a `dist` directory with the production build.

Preview the production build locally:

```bash
npm run preview
```

## Deployment to Cloudflare

This project is configured for deployment to Cloudflare Pages and Workers.

### Deploy to Cloudflare

Make sure you have authenticated with Cloudflare first:

```bash
npx wrangler login
```

Then deploy:

```bash
npm run deploy
```

Or run:

```bash
npx wrangler deploy
```

### Testing Cloudflare Workers locally

```bash
npm run wrangler:dev
```

## API Keys

Users can provide their own API keys in the application's Settings → API Tokens section. These keys will be stored in their account and will be used instead of any environment variables.

## License

ISC License