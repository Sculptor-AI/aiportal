# RSS Feed System with Automatic Image Fetching

This backend includes a sophisticated RSS feed aggregation system with automatic image fetching capabilities.

## Features

### 1. **RSS Feed Aggregation**
- Fetches articles from multiple RSS sources per category
- Supports categories: Tech, Sports, Finance, Art, TV, Politics
- Caches results for 2 minutes to reduce API calls

### 2. **Smart Image Extraction**
The system tries multiple methods to find images for articles:

1. **RSS Feed Images**: Extracts from various RSS formats (media:content, media:thumbnail, enclosure)
2. **Article Scraping**: If no RSS image, scrapes the article page for Open Graph or Twitter Card images
3. **Automatic Image Search**: If still no image, searches for related images online

### 3. **Automatic Image Search**
When articles don't have images, the system automatically:
- Extracts keywords from article titles
- Searches for relevant images based on title and category
- Uses a curated collection of high-quality stock photos
- Tracks recently used images to ensure variety

## Configuration

### Environment Variables

```bash
# Optional - Enables Unsplash API for better image results
UNSPLASH_ACCESS_KEY=your_unsplash_key_here

# Control automatic image fetching (default: true)
AUTO_FETCH_IMAGES=true
```

### Without Unsplash API Key
The system uses a curated collection of high-quality stock photos for each category, ensuring:
- Professional, relevant images
- Visual variety (tracks recently used images)
- Fast performance (no external API calls)

### With Unsplash API Key
- Searches Unsplash for images matching article keywords
- Provides more specific, contextual images
- Free tier allows 50 requests per hour

## How It Works

1. **Article Import**: RSS feeds are parsed and articles extracted
2. **Image Search Priority**:
   - Check RSS feed for embedded images
   - Scrape article URL for Open Graph/meta images
   - Search online for related images based on title
3. **Image Variety**: System tracks recently used images to avoid repetition
4. **Caching**: Results cached for 2 minutes to balance freshness and performance

## API Endpoints

- `GET /api/rss/articles/:category` - Get articles by category
- `GET /api/rss/articles` - Get all articles
- `GET /api/rss/article-content?url=` - Get full article content
- `DELETE /api/rss/cache` - Clear cache (for testing)

## Testing

To see the automatic image fetching in action:

1. Refresh your news page
2. Articles without RSS images will automatically get relevant images
3. Images will vary even for similar articles

## Image Sources

The curated image collection includes professional photos from Unsplash photographers, properly attributed and used according to the Unsplash license. 