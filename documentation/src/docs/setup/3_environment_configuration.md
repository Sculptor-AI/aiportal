# Environment Configuration

The AI Portal application requires a set of environment variables to function correctly. These variables are used to store sensitive information like API keys and to configure application settings without hardcoding them into the source code.

## 1. Create the `.env` File

Environment variables are loaded from a `.env` file located in the root of the project directory. You will need to create this file yourself.

In your terminal, from the root of the project, run the following command:

```bash
touch .env
```

This will create an empty `.env` file.

## 2. Add Environment Variables

Open the newly created `.env` file in a text editor and add the following variables. These variables are essential for both the frontend and backend to work correctly.

### Frontend Variables

These variables are used by the React frontend application.

```
VITE_BACKEND_API_URL=http://localhost:8787
VITE_OPENAI_API_KEY=sk-...
VITE_ANTHROPIC_API_KEY=sk-ant-...
VITE_GOOGLE_API_KEY=AIzaSy...
VITE_CUSTOM_GGUF_API_URL=http://localhost:8000
VITE_BRAVE_API_KEY=...
```

*   `VITE_BACKEND_API_URL`: The URL where the backend server is running. The default is `http://localhost:8787`.
*   `VITE_OPENAI_API_KEY`: Your API key for OpenAI services.
*   `VITE_ANTHROPIC_API_KEY`: Your API key for Anthropic services.
*   `VITE_GOOGLE_API_KEY`: Your API key for Google AI services.
*   `VITE_CUSTOM_GGUF_API_URL`: The URL for a custom GGUF model endpoint, if you are using one.
*   `VITE_BRAVE_API_KEY`: Your API key for the Brave Search API.

### Backend Variables

These variables are used by the Cloudflare Worker backend.

```
PORT=8787
NODE_ENV=development
JWT_SECRET=your-super-secret-jwt-key
DATABASE_PATH=./database/aiportal.db
OPENROUTER_API_KEY=sk-or-v1-your-key
```

*   `PORT`: The port on which the backend server will run. This should match the port in `VITE_BACKEND_API_URL`.
*   `NODE_ENV`: The application environment. Set to `development` for local development.
*   `JWT_SECRET`: A secret key used for signing JSON Web Tokens (JWTs) for authentication. You should use a long, random string for this.
*   `DATABASE_PATH`: The path to the SQLite database file.
*   `OPENROUTER_API_KEY`: Your API key for OpenRouter services.

**Important:** Remember to replace the placeholder values (`sk-...`, `your-super-secret-jwt-key`, etc.) with your actual keys and secrets. Never commit your `.env` file to version control.