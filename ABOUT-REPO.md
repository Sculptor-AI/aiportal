
# About This Repository: AI Portal Backend

This repository contains the backend for the **AI Portal**, a robust and feature-rich application that acts as a "Routerbox" for various AI services. It provides a unified, OpenAI-compatible API endpoint that can route requests to multiple AI providers, including Anthropic, Google Gemini, OpenAI, and any provider supported by OpenRouter.

## Core Functionality

The primary purpose of this backend is to serve as a central hub for interacting with different AI models. It abstracts away the complexity of dealing with multiple provider-specific APIs, offering a single, consistent interface for developers.

### Key Features:

*   **OpenAI-Compatible API:** The `/api/v1/chat/completions` endpoint is designed to be a drop-in replacement for the OpenAI API, making it easy to integrate with existing tools and applications.
*   **Multi-Provider Routing:** The system intelligently routes requests to the appropriate AI provider based on the requested model ID. It supports:
    *   **Anthropic (Claude)**
    *   **Google (Gemini)**
    *   **OpenAI (GPT models)**
    *   **OpenRouter** (as a fallback for a wide range of other models)
*   **Custom Models:** Users can define their own "custom models" in JSON files. These custom models specify a base model, a system prompt, and other configurations, allowing for the creation of specialized AI assistants (e.g., `custom/coding-assistant`, `custom/creative-writer`).
*   **Authentication and Security:**
    *   **JWT and API Key Authentication:** Secure access is provided through both JSON Web Tokens (for user sessions) and persistent API keys (for applications).
    *   **Rate Limiting:** The system includes per-user, per-model rate limiting to prevent abuse and manage costs.
    *   **Secure Password Handling:** User passwords are not stored directly; instead, they are hashed using `bcrypt`.
*   **Streaming Support:** The backend supports real-time, streaming responses from AI models, providing a more interactive user experience.
*   **Web Search and Scraping:** The application can perform web searches using the Brave Search API and scrape content from URLs to provide more up-to-date and contextually relevant answers.
*   **Image Generation:** It includes an endpoint for generating images using Google's Gemini model.
*   **RSS Feed Aggregation:** The backend can fetch and parse RSS feeds from various sources, categorizing them for easy consumption.
*   **Database Integration:** A SQLite database is used to store user information, API keys, refresh tokens, and rate limiting data.

## Project Structure

The codebase is organized into the following key directories:

*   `controllers/`: Contains the logic for handling incoming requests and generating responses. Each controller corresponds to a specific feature area (e.g., `chatController.js`, `imageGenerationController.js`).
*   `services/`: Holds the business logic for interacting with external APIs (e.g., `geminiService.js`, `openaiService.js`) and internal services (e.g., `customModelService.js`).
*   `routes/`: Defines the API endpoints and maps them to the appropriate controllers.
*   `middleware/`: Contains Express middleware for tasks like authentication (`authMiddleware.js`), rate limiting (`rateLimitMiddleware.js`), and request validation (`validation.js`).
*   `database/`: Includes the database connection logic (`connection.js`) and the SQL schema (`schema.sql`).
*   `utils/`: A collection of utility modules for authentication (`auth.js`), encryption (`encryption.js`), and data formatting (`formatters.js`).
*   `custom-models/`: Stores the JSON definitions for custom models.

## How It Works

1.  A user or application sends a request to one of the API endpoints (e.g., `/api/v1/chat/completions`).
2.  The request is first processed by the relevant middleware for authentication, rate limiting, and validation.
3.  The request is then passed to the appropriate controller.
4.  The controller calls a service (e.g., `RouterboxService`) to handle the request.
5.  The `RouterboxService` determines the correct AI provider based on the requested model and routes the request to the corresponding service (e.g., `geminiService.js`).
6.  The provider-specific service formats the request for that provider's API, sends it, and receives the response.
7.  The response is normalized to a consistent format and sent back to the user.

## Getting Started

To run this backend, you will need to:

1.  Install the dependencies with `npm install`.
2.  Create a `.env` file with the necessary API keys for the AI providers you want to use.
3.  Start the server with `npm start`.

For more detailed instructions, refer to the `README.md` and `API_DOCS.md` files.
