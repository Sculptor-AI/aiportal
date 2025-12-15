/**
 * Chat Completion Routes
 * 
 * Unified chat endpoint that routes to the appropriate provider:
 * - OpenRouter (default for most models)
 * - Gemini (direct Google API)
 * - Anthropic (direct Claude API)
 * - OpenAI (direct API)
 */

import { Hono } from 'hono';
import { handleOpenRouterChat } from '../services/openrouter.js';
import { handleGeminiChat, handleGeminiChatNonStreaming } from '../services/gemini.js';
import { handleAnthropicChat } from '../services/anthropic.js';
import { handleOpenAIChat } from '../services/openai.js';
import { validateToolsForProvider } from '../config/index.js';

const chat = new Hono();

/**
 * Determine which provider to use based on model ID
 */
function getProvider(modelId, body) {
  if (!modelId) return 'openrouter';

  // Explicit provider prefix
  if (modelId.startsWith('gemini') || modelId.startsWith('google/')) {
    return 'gemini';
  }
  if (modelId.startsWith('claude') || modelId.startsWith('anthropic/')) {
    return 'anthropic';
  }
  if (modelId.startsWith('gpt') || modelId.startsWith('o1') || modelId.startsWith('o3') || modelId.startsWith('o4') || modelId.startsWith('openai/')) {
    // Check if we should use direct OpenAI or OpenRouter
    if (body.use_direct_api || body.provider === 'openai') {
      return 'openai';
    }
    return 'openrouter';
  }

  // Provider hint in body
  if (body.provider === 'gemini' || body.provider === 'google') return 'gemini';
  if (body.provider === 'anthropic' || body.provider === 'claude') return 'anthropic';
  if (body.provider === 'openai') return 'openai';

  // Default to OpenRouter for unknown models
  return 'openrouter';
}

/**
 * Validate requested tools against provider capabilities
 * Returns null if valid, or an error response if invalid
 */
function validateToolRequest(provider, body, c) {
  const requestedTools = {
    web_search: body.web_search === true,
    code_execution: body.code_execution === true,
    url_context: body.url_context === true
  };
  
  // Check if any tools are requested
  const hasRequestedTools = Object.values(requestedTools).some(v => v);
  if (!hasRequestedTools) {
    return null; // No tools requested, valid
  }
  
  const validation = validateToolsForProvider(provider, requestedTools);
  
  if (!validation.valid) {
    return c.json({
      error: validation.errors.join(' '),
      supported_features: validation.supported,
      requested_features: validation.requested,
      provider: provider
    }, 400);
  }
  
  return null; // Valid
}

/**
 * Chat completions endpoint (OpenAI compatible)
 * 
 * Supports all features across providers:
 * - Streaming (stream: true/false)
 * - Vision/multimodal (images, audio, video, PDFs)
 * - Tool/function calling (tools array)
 * - Web search (web_search: true)
 * - Code execution (code_execution: true, Gemini and Anthropic)
 * - JSON mode (response_format: { type: 'json_object' })
 * - Structured outputs (response_format: { json_schema: {...} })
 * - Thinking/reasoning (thinking: true, reasoning: true)
 * - Provider routing (provider: 'gemini'|'anthropic'|'openai'|'openrouter')
 */
chat.post('/chat/completions', async (c) => {
  const env = c.env;

  try {
    const body = await c.req.json();
    const modelId = body.model;
    const provider = getProvider(modelId, body);

    console.log(`Chat request: model=${modelId}, provider=${provider}, web_search=${body.web_search}, code_execution=${body.code_execution}`);

    // Validate tool requests against provider capabilities
    const validationError = validateToolRequest(provider, body, c);
    if (validationError) {
      return validationError;
    }

    // Auto-enable url_context when web_search is enabled for providers that support it
    if ((provider === 'gemini' || provider === 'anthropic') && body.web_search && body.url_context === undefined) {
      body.url_context = true;
    }

    switch (provider) {
      case 'gemini': {
        const apiKey = env.GEMINI_API_KEY;
        if (!apiKey) {
          return c.json({ error: 'GEMINI_API_KEY is not configured.' }, 500);
        }
        if (body.stream === false) {
          return handleGeminiChatNonStreaming(c, body, apiKey);
        }
        return handleGeminiChat(c, body, apiKey);
      }

      case 'anthropic': {
        const apiKey = env.ANTHROPIC_API_KEY;
        if (!apiKey) {
          return c.json({ error: 'ANTHROPIC_API_KEY is not configured.' }, 500);
        }
        return handleAnthropicChat(c, body, apiKey);
      }

      case 'openai': {
        const apiKey = env.OPENAI_API_KEY;
        if (!apiKey) {
          return c.json({ error: 'OPENAI_API_KEY is not configured.' }, 500);
        }
        return handleOpenAIChat(c, body, apiKey);
      }

      case 'openrouter':
      default: {
        const apiKey = env.OPENROUTER_API_KEY;
        if (!apiKey) {
          // Demo fallback
          const encoder = new TextEncoder();
          const demoStream = new ReadableStream({
            start(controller) {
              const send = (payload) => controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
              send({ choices: [{ delta: { content: 'API keys are not configured. ' } }] });
              send({ choices: [{ delta: { content: 'Add OPENROUTER_API_KEY, GEMINI_API_KEY, ANTHROPIC_API_KEY, or OPENAI_API_KEY in .dev.vars to enable live responses.' } }] });
              controller.enqueue(encoder.encode('data: [DONE]\n\n'));
              controller.close();
            }
          });

          return new Response(demoStream, {
            headers: {
              'Content-Type': 'text/event-stream',
              'Cache-Control': 'no-cache',
              'Connection': 'keep-alive'
            }
          });
        }
        return handleOpenRouterChat(c, body, apiKey);
      }
    }
  } catch (error) {
    console.error('Chat completion error:', error);
    return c.json({ error: error.message || 'Internal server error' }, 500);
  }
});

/**
 * Token counting endpoint
 */
chat.post('/tokens/count', async (c) => {
  const env = c.env;
  const body = await c.req.json();

  // Simple estimation (actual counting would require tiktoken or API call)
  const text = JSON.stringify(body.messages);
  const estimatedTokens = Math.ceil(text.length / 4);

  return c.json({
    tokens: estimatedTokens,
    note: 'Estimated token count (actual may vary by model)'
  });
});

export default chat;
