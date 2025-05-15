# Search Feature Documentation

This document explains how to use the search feature in the backend API.

## Overview

The search feature allows you to:

1. Perform web searches using Brave Search API
2. Scrape content from web pages
3. Process search results and scrape content to feed into an AI model

## Setup

### 1. Environment Variables

You need to set up the Brave Search API key in your `.env` file:

```
BRAVE_API_KEY=your_brave_search_api_key
```

You can get an API key from the [Brave Search API website](https://brave.com/search/api/).

### 2. Installing Dependencies

Make sure you have the required dependencies installed:

```bash
npm install
```

## API Endpoints

### 1. Search Web

**Endpoint:** `POST /api/search`

**Request Body:**
```json
{
  "query": "Your search query",
  "max_results": 5  // Optional, defaults to 5
}
```

**Response:**
```json
{
  "results": [
    {
      "title": "Result title",
      "url": "https://example.com",
      "snippet": "Result description or snippet"
    },
    // More results...
  ]
}
```

### 2. Scrape URL

**Endpoint:** `POST /api/scrape`

**Request Body:**
```json
{
  "url": "https://example.com"
}
```

**Response:**
```json
{
  "url": "https://example.com",  // May be different if redirected
  "title": "Page title",
  "content": "Extracted text content from the page",
  "length": 12345  // Length of the content in characters
}
```

### 3. Search and Process

This endpoint combines search, scraping, and AI processing in one call.

**Endpoint:** `POST /api/search-process`

**Request Body:**
```json
{
  "query": "Your search query",
  "max_results": 3,  // Optional, defaults to 3
  "model_prompt": "Based on the above search results, please summarize what we know about..."
}
```

**Response:**
```json
{
  "query": "Your search query",
  "sources": [
    {
      "title": "Source title",
      "url": "https://example.com"
    },
    // More sources...
  ],
  "result": {
    // The AI model's response
  }
}
```

## How It Works

1. **Search**: The system uses Brave Search API to find relevant web pages based on your query.
2. **Scraping**: For each relevant result, it extracts the main content from the web page.
3. **Processing**: It formats the scraped content and sends it to your AI model with your prompt.

## Error Handling

All endpoints return appropriate error messages in case of failure, with HTTP status codes:

- `400` for invalid requests
- `404` for not found resources or empty results
- `500` for server errors

## Examples

### Example 1: Simple Search

```javascript
const response = await fetch('/api/search', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    query: 'How does photosynthesis work',
    max_results: 3
  })
});
const data = await response.json();
console.log(data.results);
```

### Example 2: Search and Process

```javascript
const response = await fetch('/api/search-process', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    query: 'How does photosynthesis work',
    max_results: 3,
    model_prompt: 'Explain photosynthesis in simple terms, using the search results as reference.'
  })
});
const data = await response.json();
console.log(data.result);
``` 