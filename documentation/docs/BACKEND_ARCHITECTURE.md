# Backend Architecture

This document provides an overview of the backend architecture of the AI Portal application.

**Important Note:** The project currently contains two separate backend implementations. The active backend is a Cloudflare Worker, while the other is an Express.js application that appears to be unused or under development. This document will describe both.

---

## Backend 1: Cloudflare Worker (Active)

The currently active backend is implemented as a Cloudflare Worker, defined in the `worker.js` file in the root directory. This worker is configured via `wrangler.toml` and is the backend that runs when you use `yarn wrangler:dev`.

### Responsibilities

The Cloudflare Worker has two main responsibilities:

1.  **Serving the Frontend**: It serves the static assets of the React single-page application (SPA) from the `/dist` directory. It correctly handles client-side routing by serving `index.html` for any non-asset request.
2.  **RSS Feed API**: It provides a set of API endpoints for fetching and parsing RSS feeds.

### API Endpoints

The worker exposes the following API endpoints:

-   `GET /api/rss/articles/:category`: Fetches a list of articles for a given category (e.g., `tech`, `sports`).
-   `GET /api/rss/articles`: Fetches a list of articles from all available categories.
-   `GET /api/rss/article-content?url=...`: Fetches the content of a specific article.

All API endpoints are implemented directly in `worker.js`.

---

## Backend 2: Express.js Application (Unused)

The project also contains a separate backend application within the `aiportal/backend/` directory. This backend is built with **Node.js** and the **Express.js** framework.

**Note:** This Express.js application is not currently integrated with the rest of the project. The main `worker.js` does not use any of its modules, and there is no entry point file to start this server. The setup instructions in the `README.md` appear to be based on this backend, but they do not align with the current project configuration.

### Structure

The Express.js application follows a standard structure:

-   `controllers/`: Contains the business logic for handling API requests.
    -   `chatCompletionController.js`: Logic for handling chat completions with AI models.
    -   `imageGenerationController.js`: Logic for generating images from text prompts.
-   `routes/`: Defines the API routes using `express.Router`.
    -   `chatRoutes.js`: Defines the `/completions` endpoint for chat.
    -   `imageGenerationRoutes.js`: Defines endpoints for image generation.

### Intended API Endpoints

Based on the route definitions, this backend is intended to provide the core AI functionalities of the application:

-   `POST /api/chat/completions`: To get chat completions from an AI model.
-   `POST /api/image/generate`: To generate an image.

This backend seems to be where the main AI features described in the `README.md` are meant to be implemented, but it is not currently wired up to the frontend or the deployment configuration. 