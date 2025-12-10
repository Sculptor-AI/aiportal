# API Documentation

This document provides details on the available API endpoints in the AI Portal application.

**Important Note:** The project currently contains two separate backend implementations, each with its own set of APIs. The active backend is a Cloudflare Worker, while the other is an Express.js application that is not currently in use.

---

## API 1: Cloudflare Worker (Active)

This API is implemented in `worker.js` and is the one that is currently active. It primarily handles fetching data from RSS feeds.

### Get Articles by Category

-   **Endpoint**: `GET /api/rss/articles/:category`
-   **Description**: Fetches a list of articles for a given category.
-   **URL Parameters**:
    -   `category` (string, required): The category of articles to fetch (e.g., `tech`, `sports`, `finance`).
-   **Query Parameters**:
    -   `limit` (number, optional, default: `20`): The maximum number of articles to return.
-   **Success Response**:
    -   **Code**: `200 OK`
    -   **Content**: `{ "articles": [...] }`
    -   **Example**:
        ```json
        {
          "articles": [
            {
              "id": "...",
              "title": "...",
              "description": "...",
              "url": "...",
              "pubDate": "...",
              "source": "...",
              "image": null,
              "size": "wide"
            }
          ]
        }
        ```

### Get All Articles

-   **Endpoint**: `GET /api/rss/articles`
-   **Description**: Fetches a list of articles from all available categories.
-   **Query Parameters**:
    -   `limit` (number, optional, default: `50`): The maximum number of articles to return.
-   **Success Response**:
    -   **Code**: `200 OK`
    -   **Content**: `{ "articles": [...] }` (Same format as above)

### Get Article Content

-   **Endpoint**: `GET /api/rss/article-content`
-   **Description**: Fetches the content of a specific article.
-   **Query Parameters**:
    -   `url` (string, required): The URL of the article to fetch.
-   **Success Response**:
    -   **Code**: `200 OK`
    -   **Content**: `{ "content": "...", "extracted": true, "title": null, "image": null }`

---

## API 2: Express.js Application (Unused)

This API is defined in the `aiportal/backend/` directory but is not currently active. It is intended to handle the core AI functionalities.

### Chat Completions (Streaming)

-   **Endpoint**: `POST /api/chat/completions`
-   **Description**: Proxies a request to the OpenRouter API to get chat completions. The response is streamed back to the client using Server-Sent Events (SSE).
-   **Request Body**: A JSON object that conforms to the OpenRouter API for chat completions. The `stream` property will be automatically set to `true`.
    -   **Example**:
        ```json
        {
          "model": "google/gemini-pro",
          "messages": [
            { "role": "user", "content": "Hello, world!" }
          ]
        }
        ```
-   **Success Response**:
    -   **Code**: `200 OK`
    -   **Content-Type**: `text/event-stream`
    -   **Content**: A stream of SSE events from the OpenRouter API.

### Image Generation

-   **Endpoint**: `POST /api/image/generate`
-   **Description**: Generates an image using the Google Generative AI API.
-   **Request Body**:
    -   `prompt` (string, required): The text prompt to generate the image from.
    -   **Example**:
        ```json
        {
          "prompt": "A futuristic city skyline at sunset"
        }
        ```
-   **Success Response**:
    -   **Code**: `200 OK`
    -   **Content**: `{ "imageData": "data:image/png;base64,..." }`
        -   `imageData`: A base64-encoded data URI for the generated image.
-   **Error Response**:
    -   **Code**: `400 Bad Request` if the prompt is missing.
    -   **Code**: `500 Internal Server Error` for other errors. 