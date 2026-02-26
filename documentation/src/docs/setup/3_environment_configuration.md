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

These variables are used by the React frontend application. Keep frontend variables non-sensitive.

```
VITE_BACKEND_API_URL=http://localhost:8787
```

*   `VITE_BACKEND_API_URL`: The URL where the backend server is running. The default is `http://localhost:8787`.
*   Do **not** store provider API keys in `VITE_*` variables. They are exposed to all users.

### Backend Variables

These variables are used by the Cloudflare Worker backend.

```
PORT=8787
NODE_ENV=development
JWT_SECRET=your-super-secret-jwt-key
DATABASE_PATH=./database/aiportal.db
OPENROUTER_API_KEY=sk-or-v1-your-key
GEMINI_API_KEY=your-gemini-key
ANTHROPIC_API_KEY=sk-ant-your-key
OPENAI_API_KEY=sk-your-openai-key
```

*   `PORT`: The port on which the backend server will run. This should match the port in `VITE_BACKEND_API_URL`.
*   `NODE_ENV`: The application environment. Set to `development` for local development.
*   `JWT_SECRET`: A secret key used for signing JSON Web Tokens (JWTs) for authentication. You should use a long, random string for this.
*   `DATABASE_PATH`: The path to the SQLite database file.
*   `OPENROUTER_API_KEY`: Your API key for OpenRouter services.
*   `GEMINI_API_KEY`: Your API key for Google Gemini services.
*   `ANTHROPIC_API_KEY`: Your API key for Anthropic services.
*   `OPENAI_API_KEY`: Your API key for OpenAI services.

**Important:** Remember to replace the placeholder values (`sk-...`, `your-super-secret-jwt-key`, etc.) with your actual keys and secrets. Never commit your `.env` file to version control.
