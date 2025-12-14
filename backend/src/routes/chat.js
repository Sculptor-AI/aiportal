/**
 * Chat Completion Routes
 */

import { Hono } from 'hono';
import { handleGeminiChat } from '../services/gemini.js';

const chat = new Hono();

/**
 * Chat completions endpoint (OpenAI compatible)
 */
chat.post('/chat/completions', async (c) => {
  const env = c.env;
  const apiKey = env.OPENROUTER_API_KEY;
  const geminiKey = env.GEMINI_API_KEY;

  try {
    const body = await c.req.json();
    const modelId = body.model;

    // Route Gemini models to Google's API directly
    if (modelId && (modelId.includes('gemini') || modelId.includes('google/'))) {
      if (!geminiKey) {
        return c.json({ error: 'GEMINI_API_KEY is not configured in the backend.' }, 500);
      }
      return handleGeminiChat(c, body, geminiKey);
    }

    // Default to OpenRouter for other models
    if (!apiKey) {
      const encoder = new TextEncoder();
      const demoStream = new ReadableStream({
        start(controller) {
          const send = (payload) => controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
          send({ choices: [{ delta: { content: 'OpenRouter API key is not configured. ' } }] });
          send({ choices: [{ delta: { content: 'Add OPENROUTER_API_KEY in wrangler.toml to enable live responses. ' } }] });
          send({ choices: [{ delta: { content: 'This is a demo fallback response from the worker.' } }] });
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

    const payload = { ...body, stream: true };

    const upstreamResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://sculptorai.org',
        'X-Title': 'Sculptor AI'
      },
      body: JSON.stringify(payload)
    });

    if (!upstreamResponse.ok) {
      const errorText = await upstreamResponse.text();
      return c.json({ error: `Upstream error: ${errorText}` }, upstreamResponse.status);
    }

    // Stream the response back to the client
    return new Response(upstreamResponse.body, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      }
    });
  } catch (error) {
    console.error('Chat completion error:', error);
    return c.json({ error: error.message || 'Internal server error' }, 500);
  }
});

export default chat;

