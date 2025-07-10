# Get Article Content

This endpoint is used to fetch the full content of a specific news article given its URL. It is part of the Cloudflare Worker API, which is the active backend for the AI Portal's News & Media Hub.

## Endpoint Details

*   **HTTP Method**: `GET`
*   **Path**: `/api/rss/article-content`
*   **Description**: Retrieves the full textual content of a news article from its provided URL. This is useful for displaying the complete article within the application or for further processing.

## Query Parameters

*   `url` (string, **required**)
    *   **Description**: The absolute URL of the article whose content you wish to retrieve. This URL should typically be obtained from the `url` field returned by the `/api/rss/articles` or `/api/rss/articles/:category` endpoints.
    *   **Example**: `http://localhost:8787/api/rss/article-content?url=https://example.com/news/article-title`

## Success Response

*   **HTTP Status Code**: `200 OK`
*   **Content Type**: `application/json`
*   **Body Structure**:

    ```json
    {
      "content": "string",
      "extracted": boolean,
      "title": "string" | null,
      "image": "string" | null
    }
    ```

*   **Field Descriptions**:
    *   `content`: The extracted textual content of the article. This will be a string containing the main body of the article.
    *   `extracted`: A boolean indicating whether the content was successfully extracted from the provided URL (`true`) or if there were issues (`false`).
    *   `title`: The title of the article, if successfully extracted. Can be `null`.
    *   `image`: The URL of the main image associated with the article, if successfully extracted. Can be `null`.

## Example Request

```bash
curl -X GET "http://localhost:8787/api/rss/article-content?url=https://example.com/tech/ai-chips-breakthrough"
```

## Example Success Response

```json
{
  "content": "This is the full content of the article about the new breakthrough in AI chips...",
  "extracted": true,
  "title": "New Breakthrough in AI Chips",
  "image": "https://example.com/images/ai-chip-full.jpg"
}
```

## Error Handling

*   **400 Bad Request**: If the `url` query parameter is missing or is not a valid URL.
*   **500 Internal Server Error**: If there is an issue fetching the article content from the provided URL, or if the content extraction fails.