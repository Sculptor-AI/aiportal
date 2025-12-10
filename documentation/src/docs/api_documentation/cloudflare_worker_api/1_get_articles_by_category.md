# Get Articles by Category

This endpoint allows you to retrieve a list of news articles filtered by a specific category. It is part of the Cloudflare Worker API, which is the active backend for the AI Portal's News & Media Hub.

## Endpoint Details

*   **HTTP Method**: `GET`
*   **Path**: `/api/rss/articles/:category`
*   **Description**: Fetches a list of articles for a given category from the configured RSS feeds.

## URL Parameters

*   `category` (string, **required**)
    *   **Description**: The specific category of articles you wish to retrieve. Examples include `tech`, `sports`, `finance`, `science`, etc. The available categories are determined by the RSS feeds configured in the Cloudflare Worker.
    *   **Example**: To get tech articles, the URL would be `/api/rss/articles/tech`.

## Query Parameters

*   `limit` (number, *optional*)
    *   **Description**: The maximum number of articles to return in the response. This parameter allows you to control the size of the result set.
    *   **Default Value**: `20`
    *   **Example**: To get 10 articles from the 'tech' category, the URL would be `/api/rss/articles/tech?limit=10`.

## Success Response

*   **HTTP Status Code**: `200 OK`
*   **Content Type**: `application/json`
*   **Body Structure**:

    ```json
    {
      "articles": [
        {
          "id": "string",
          "title": "string",
          "description": "string",
          "url": "string",
          "pubDate": "string" (ISO 8601 format),
          "source": "string",
          "image": "string" | null,
          "size": "string" (e.g., "wide", "normal")
        }
      ]
    }
    ```

*   **Field Descriptions**:
    *   `id`: A unique identifier for the article.
    *   `title`: The title of the article.
    *   `description`: A brief summary or snippet of the article content.
    *   `url`: The URL to the original article.
    *   `pubDate`: The publication date of the article in ISO 8601 format.
    *   `source`: The name of the news source (e.g., "BBC News", "TechCrunch").
    *   `image`: The URL of a relevant image for the article, or `null` if no image is available.
    *   `size`: A string indicating the preferred display size for the article card in the UI (e.g., "wide" for a larger card).

## Example Request

```bash
curl -X GET "http://localhost:8787/api/rss/articles/tech?limit=5"
```

## Example Success Response

```json
{
  "articles": [
    {
      "id": "tech-article-123",
      "title": "New Breakthrough in AI Chips",
      "description": "Researchers announce a significant advancement in AI chip technology, promising faster processing.",
      "url": "https://example.com/tech/ai-chips-breakthrough",
      "pubDate": "2025-07-09T10:00:00Z",
      "source": "TechDaily",
      "image": "https://example.com/images/ai-chip.jpg",
      "size": "normal"
    },
    {
      "id": "tech-article-124",
      "title": "The Future of Quantum Computing",
      "description": "An in-depth look at the challenges and opportunities in quantum computing.",
      "url": "https://example.com/tech/quantum-computing-future",
      "pubDate": "2025-07-08T15:30:00Z",
      "source": "ScienceToday",
      "image": null,
      "size": "wide"
    }
  ]
}
```

## Error Handling

*   **400 Bad Request**: If the `category` parameter is missing or invalid.
*   **500 Internal Server Error**: If there is an issue fetching or parsing the RSS feeds.