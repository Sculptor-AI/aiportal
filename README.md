# AI Portal

A multi-model AI chat interface that connects to multiple LLM APIs including OpenAI, Anthropic, and Google's Gemini.

## Features

- Connect to ChatGPT, Claude, and Gemini APIs
- **Required user account system with secure server-side authentication**
- **Secure server-side storage of user API tokens**
- **Server-side AI API proxy to keep API keys secure**
- Persistent chat history saved to server
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

### Cloudflare Configuration

This application requires Cloudflare KV namespaces and environment variables for secure authentication and data storage.

#### Step 1: Create KV Namespaces

Create two KV namespaces in the Cloudflare dashboard:

1. `USERS` - For storing user account data
2. `USER_CHATS` - For storing user chat history

#### Step 2: Configure Environment Variables

Edit the `wrangler.toml` file and add secure values for:

1. `JWT_SECRET` - A secure random string for JWT token signing (must be at least 32 characters)
2. `ENCRYPTION_KEY` - A secure random string for encrypting API keys (must be 32 bytes / 64 hex characters)

Example:
```toml
[vars]
JWT_SECRET = "your-very-long-secure-random-string-here"
ENCRYPTION_KEY = "your-32-byte-hex-key-for-encryption"
```

#### Step 3: Update KV Namespace IDs

After creating your KV namespaces, update the IDs in `wrangler.toml`:

```toml
[[kv_namespaces]]
binding = "USERS"
id = "your-users-namespace-id"
preview_id = "your-users-preview-namespace-id"

[[kv_namespaces]]
binding = "USER_CHATS"
id = "your-chats-namespace-id"
preview_id = "your-chats-preview-namespace-id"
```

## Development

Start the development server:

```bash
# Start local development with Cloudflare Worker support
npm run wrangler:dev
```

This will start the app with Cloudflare Worker support for server-side functionality.

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

## User Authentication and API Keys

This app requires users to create an account to use the service. API keys are securely stored on the server (encrypted in Cloudflare KV) and are never exposed on the client. The server acts as a proxy for all AI API requests, keeping API keys secure.

## Security Features

- JWT-based authentication with token expiration
- Server-side AES-GCM encryption of API keys
- Password hashing using SHA-256
- API tokens are never sent to the client
- All API requests are authenticated
- CORS protection for API endpoints

## License

ISC License