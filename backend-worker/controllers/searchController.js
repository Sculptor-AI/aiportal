import { formatError } from '../utils/formatters.js';
import { scrapeHtml } from '../utils/htmlScraper.js';

export const searchWeb = async (request, env) => {
  try {
    const body = await request.json();
    const { query, max_results = 5 } = body;
    
    if (!query || typeof query !== 'string') {
      return new Response(JSON.stringify(formatError('Query is required and must be a string')), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const BRAVE_API_KEY = env.BRAVE_API_KEY;
    
    if (!BRAVE_API_KEY) {
      return new Response(JSON.stringify(formatError('Brave Search API key is not configured')), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const brave_api_endpoint = "https://api.search.brave.com/res/v1/web/search";
    
    const url = new URL(brave_api_endpoint);
    url.searchParams.set('q', query);
    url.searchParams.set('count', max_results);
    
    const response = await fetch(url, {
      headers: {
        "Accept": "application/json",
        "Accept-Encoding": "gzip",
        "X-Subscription-Token": BRAVE_API_KEY
      }
    });
    
    if (!response.ok) {
      throw new Error(`Brave API error: ${response.status}`);
    }
    
    const data = await response.json();
    const searchResultsRaw = data?.web?.results || [];
    
    const results = searchResultsRaw.slice(0, max_results).map(item => ({
      title: item.title || 'N/A',
      url: item.url,
      snippet: item.description || ''
    }));
    
    return new Response(JSON.stringify({ results }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Search error:', error);
    return new Response(JSON.stringify(formatError('Failed to perform search', error)), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const scrapeUrl = async (request, env) => {
  try {
    const body = await request.json();
    const { url } = body;
    
    if (!url || typeof url !== 'string') {
      return new Response(JSON.stringify(formatError('URL is required and must be a string')), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    console.log(`Attempting to scrape URL: ${url}`);
    
    // Use the HTMLRewriter-based scraper
    const scrapedData = await scrapeHtml(url);
    
    return new Response(JSON.stringify({
      url: scrapedData.url,
      title: scrapedData.title,
      content: scrapedData.content,
      length: scrapedData.content.length
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Scraping error:', error);
    return new Response(JSON.stringify(formatError('Failed to scrape URL', error)), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const searchAndProcess = async (request, env) => {
  try {
    const body = await request.json();
    const { query, max_results = 2, model_prompt, modelType = 'meta-llama/llama-4-maverick:free' } = body;
    
    if (!query || !model_prompt) {
      return new Response(JSON.stringify(formatError('Query and model_prompt are required')), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Step 1: Search
    const searchRequest = new Request(request.url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, max_results: 5 })
    });
    
    const searchResponse = await searchWeb(searchRequest, env);
    const searchData = await searchResponse.json();
    
    if (!searchData.results || searchData.results.length === 0) {
      return new Response(JSON.stringify(formatError('No search results found')), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Step 2: Filter and scrape
    const filteredResults = searchData.results.slice(0, max_results);
    const scrapedContents = [];
    
    for (const result of filteredResults) {
      try {
        const scrapeRequest = new Request(request.url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: result.url })
        });
        
        const scrapeResponse = await scrapeUrl(scrapeRequest, env);
        const scrapeData = await scrapeResponse.json();
        
        scrapedContents.push({
          title: result.title,
          url: result.url,
          content: scrapeData.content?.substring(0, 65000) || ''
        });
      } catch (error) {
        console.error(`Error scraping ${result.url}:`, error);
      }
    }
    
    // Step 3: Process with AI
    const formattedContent = scrapedContents.map(item => 
      `SOURCE: ${item.title} (${item.url})\n\n${item.content}`
    ).join('\n\n---\n\n');
    
    const systemPrompt = `You are a helpful assistant that synthesizes information from web search results.
Based on the search results provided, answer the user's query coherently and accurately.
IMPORTANT: Always prioritize and trust the information from the search results over your own knowledge.
If the search results indicate something that contradicts what you believe to be true, go with what the search results say.
For questions about current events, people in positions of power, or time-sensitive information, the search results 
should be considered more up-to-date and accurate than your training data.
Present the information from search results as factual even if it seems incorrect based on your knowledge.
If the search results do not contain sufficient information to answer the query, acknowledge that.`;
    
    const finalPrompt = `SYSTEM INSTRUCTION: ${systemPrompt}\n\nSEARCH QUERY: ${query}\n\nSEARCH RESULTS:\n${formattedContent}\n\n${model_prompt}`;
    
    // Call chat endpoint
    const chatRequest = new Request(request.url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        modelType: modelType,
        prompt: finalPrompt,
        systemPrompt: systemPrompt,
        search: false
      })
    });
    
    const { completeChat } = await import('./chatController.js');
    const chatResponse = await completeChat(chatRequest, env);
    const responseData = await chatResponse.json();
    
    // Add sources
    responseData.sources = filteredResults.map(source => ({
      title: source.title,
      url: source.url
    }));
    
    return new Response(JSON.stringify(responseData), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Search and process error:', error);
    return new Response(JSON.stringify(formatError('Failed to search and process results', error)), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}; 