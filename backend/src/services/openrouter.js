/**
 * OpenRouter API Service
 * 
 * Supports all OpenRouter features:
 * - Streaming chat completions
 * - Vision/image input
 * - Tool/function calling
 * - Web search (via plugins)
 * - Provider routing preferences
 * - Fallback models
 * - Reasoning tokens (for o1, o3, etc.)
 * - JSON mode/structured outputs
 * - Model-specific parameters
 */

const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';

/**
 * OpenRouter-specific headers
 */
function getOpenRouterHeaders(apiKey, options = {}) {
  return {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
    'HTTP-Referer': options.referer || 'https://sculptorai.org',
    'X-Title': options.title || 'Sculptor AI'
  };
}

/**
 * Build OpenRouter request body with all supported features
 */
function buildOpenRouterBody(body) {
  const payload = {
    model: body.model,
    messages: body.messages,
    stream: body.stream !== false, // Default to streaming
  };

  // Basic generation config
  if (body.temperature !== undefined) payload.temperature = body.temperature;
  if (body.max_tokens !== undefined) payload.max_tokens = body.max_tokens;
  if (body.top_p !== undefined) payload.top_p = body.top_p;
  if (body.top_k !== undefined) payload.top_k = body.top_k;
  if (body.frequency_penalty !== undefined) payload.frequency_penalty = body.frequency_penalty;
  if (body.presence_penalty !== undefined) payload.presence_penalty = body.presence_penalty;
  if (body.repetition_penalty !== undefined) payload.repetition_penalty = body.repetition_penalty;
  if (body.stop !== undefined) payload.stop = body.stop;
  if (body.seed !== undefined) payload.seed = body.seed;

  // JSON mode / structured outputs
  if (body.response_format) {
    payload.response_format = body.response_format;
  }

  // Tool/function calling
  if (body.tools) {
    payload.tools = body.tools;
  }
  if (body.tool_choice) {
    payload.tool_choice = body.tool_choice;
  }

  // OpenRouter-specific features
  
  // Provider preferences (order, allow/deny lists)
  if (body.provider) {
    payload.provider = body.provider;
  }

  // Fallback models
  if (body.route) {
    payload.route = body.route; // 'fallback' to use fallback models
  }
  if (body.models) {
    payload.models = body.models; // Array of fallback models
  }

  // Reasoning/thinking display
  if (body.include_reasoning !== undefined) {
    payload.include_reasoning = body.include_reasoning;
  }

  // Transforms (e.g., middle-out for long contexts)
  if (body.transforms) {
    payload.transforms = body.transforms;
  }

  // Plugins (web search, etc.)
  if (body.plugins) {
    payload.plugins = body.plugins;
  }

  // Web search via plugin
  if (body.web_search) {
    payload.plugins = payload.plugins || [];
    if (!payload.plugins.includes('web-search')) {
      payload.plugins.push('web-search');
    }
  }

  return payload;
}

/**
 * Handle streaming chat completion via OpenRouter
 */
export async function handleOpenRouterChat(c, body, apiKey) {
  const payload = buildOpenRouterBody(body);
  
  console.log(`OpenRouter request for model: ${body.model}`);

  try {
    const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: getOpenRouterHeaders(apiKey),
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenRouter API Error:', errorText);
      return c.json({ error: `OpenRouter API Error: ${errorText}` }, response.status);
    }

    // For non-streaming, return JSON directly
    if (!payload.stream) {
      const result = await response.json();
      return c.json(result);
    }

    // Stream the response back (already in SSE format)
    return new Response(response.body, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      }
    });
  } catch (error) {
    console.error('OpenRouter handler error:', error);
    return c.json({ error: error.message }, 500);
  }
}

/**
 * Get available models from OpenRouter
 */
export async function getOpenRouterModels(apiKey) {
  try {
    const response = await fetch(`${OPENROUTER_BASE_URL}/models`, {
      headers: getOpenRouterHeaders(apiKey)
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch models: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch OpenRouter models:', error);
    return { data: [] };
  }
}

/**
 * Get generation stats/limits
 */
export async function getOpenRouterLimits(apiKey) {
  try {
    const response = await fetch(`${OPENROUTER_BASE_URL}/auth/key`, {
      headers: getOpenRouterHeaders(apiKey)
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch limits: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch OpenRouter limits:', error);
    return null;
  }
}

