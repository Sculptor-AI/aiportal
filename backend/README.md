# AI Portal Backend

This is the backend server for the AI Portal application. It provides an API that interfaces with OpenRouter to access various AI language models in a secure and standardized way.

## Features

a
- Unified API for accessing multiple LLMs (GPT-4o, Claude, Llama, etc.)
- Request validation and sanitization
- Public/private key (asymmetric) encryption for secure communication
- Model allowlisting to prevent abuse
- Clean error handling

## Setup

1. Install dependencies:
   ```
   npm install
   ```

2. Create a `.env` file based on the `.env.example` with the following variables:
   ```
   PORT=3000
   OPENROUTER_API_KEY=your_openrouter_api_key
   PUBLIC_KEY=your_public_key
   PRIVATE_KEY=your_private_key
   ALLOWED_MODELS=openai/gpt-4o,anthropic/claude-3-haiku,anthropic/claude-3-opus,anthropic/claude-3-sonnet,meta-llama/llama-2-70b-chat,google/gemini-pro
   ```

3. Start the server:
   ```
   npm start
   ```

   For development with auto-reload:
   ```
   npm run dev
   ```

## API Endpoints

### GET /api/models
Returns a list of available AI models from OpenRouter filtered by the allowed models in the environment variable.

### POST /api/chat
Processes a chat completion request.

**Request Body:**
```json
{
  "modelType": "openai/gpt-4o",
  "prompt": "What color is the sky?",
  "search": false,
  "deepResearch": false,
  "imageGen": false
}
```

**Response:**
```json
{
  "data": "encrypted_response_string"
}
```

The response is encrypted with the public key and must be decrypted with the private key. When decrypted, it has the following format:

```json
{
  "response": "The sky is generally blue during the day...",
  "metadata": {
    "modelType": "openai/gpt-4o",
    "prompt": "What color is the sky?",
    "timestamp": "2023-06-01T12:34:56.789Z"
  }
}
```

## Security

- All API responses are encrypted with public key cryptography (RSA)
- Environment variables are used to store sensitive information
- Requests are validated before processing
- Only allowed models can be used

## Error Handling

The API returns appropriate error codes and messages for various error scenarios:

- 400: Bad Request (missing required fields, invalid model)
- 401: Unauthorized (invalid API key)
- 500: Internal Server Error (server-side issues)

Each error response includes an error message and, in development mode, additional details. 