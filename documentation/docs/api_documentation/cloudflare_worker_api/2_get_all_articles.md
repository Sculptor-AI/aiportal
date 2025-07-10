# Get All Articles

This endpoint allows you to retrieve a list of news articles from all available categories. It is part of the Cloudflare Worker API, which is the active backend for the AI Portal's News & Media Hub.

## Endpoint Details

*   **HTTP Method**: `GET`
*   **Path**: `/api/rss/articles`
*   **Description**: Fetches a consolidated list of articles from all configured RSS feeds, regardless of category.

## Query Parameters

*   `limit` (number, *optional*)
    *   **Description**: The maximum number of articles to return in the response. This parameter helps in controlling the volume of data retrieved.
    *   **Default Value**: `50`
    *   **Example**: To get 25 articles from all categories, the URL would be `/api/rss/articles?limit=25`.

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
curl -X GET "http://localhost:8787/api/rss/articles?limit=10"
```

## Example Success Response

```json
{
  "articles": [
    {
      "id": "general-news-456",
      "title": "Global Markets React to New Economic Data",
      "description": "Stock markets show volatility as new inflation figures are released.",
      "url": "https://example.com/finance/market-reaction",
      "pubDate": "2025-07-09T11:00:00Z",
      "source": "Financial Times",
      "image": null,
      "size": "normal"
    },
    {
      "id": "sports-update-789",
      "title": "Team A Wins Championship",
      "description": "In a thrilling final, Team A secures the championship title.",
      "url": "https://example.com/sports/championship-win",
      "pubDate": "2025-07-09T09:30:00Z",
      "source": "SportsDaily",
      "image": "https://example.com/images/team-a-win.jpg",
      "size": "normal"
    }
  ]
}
```

## Error Handling

*   **500 Internal Server Error**: If there is an issue fetching or parsing the RSS feeds from the configured sources.