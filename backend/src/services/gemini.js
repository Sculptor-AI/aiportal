/**
 * Gemini API Service
 */

// Model mapping for Gemini API
const MODEL_MAP = {
  // Gemini 3.x
  'gemini-3-pro-preview': 'gemini-3-pro-preview',
  'gemini-3-pro-image-preview': 'gemini-3-pro-image-preview',
  // Gemini 2.5
  'gemini-2.5-flash': 'gemini-2.5-flash',
  'gemini-2.5-flash-lite': 'gemini-2.5-flash-lite',
  'gemini-2.5-pro': 'gemini-2.5-pro',
  // Gemini 2.0
  'gemini-2.0-flash': 'gemini-2.0-flash',
  'gemini-2.0-flash-lite': 'gemini-2.0-flash-lite',
  // Legacy support
  'gemini-2.0-flash-exp': 'gemini-2.0-flash',
  'gemini-1.5-pro': 'gemini-2.5-pro',
  'gemini-1.5-flash': 'gemini-2.5-flash',
  // Fallback
  'default': 'gemini-2.5-flash'
};

/**
 * Handle Gemini chat completion
 */
export async function handleGeminiChat(c, body, apiKey) {
  const targetModel = MODEL_MAP[body.model] || MODEL_MAP['default'];
  console.log(`Routing model ${body.model} to Google API (target: ${targetModel})`);
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${targetModel}:streamGenerateContent?key=${apiKey}`;

  // Convert OpenAI messages to Gemini format
  const contents = [];
  let systemInstruction = null;

  // Handle system prompt if present in body or messages
  if (body.system) {
    systemInstruction = { parts: [{ text: body.system }] };
  }

  for (const msg of body.messages) {
    if (msg.role === 'system') {
      systemInstruction = { parts: [{ text: msg.content }] };
      continue;
    }

    const parts = [];
    if (typeof msg.content === 'string') {
      parts.push({ text: msg.content });
    } else if (Array.isArray(msg.content)) {
      for (const part of msg.content) {
        if (part.type === 'text') {
          parts.push({ text: part.text });
        } else if (part.type === 'image_url') {
          // Extract base64 from data URL
          const matches = part.image_url.url.match(/^data:([^;]+);base64,(.+)$/);
          if (matches) {
            parts.push({
              inlineData: {
                mimeType: matches[1],
                data: matches[2]
              }
            });
          }
        }
      }
    }

    contents.push({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: parts
    });
  }

  const geminiBody = {
    contents,
    generationConfig: {
      temperature: body.temperature || 0.7,
      maxOutputTokens: body.max_tokens || 8192
    }
  };

  if (systemInstruction) {
    geminiBody.systemInstruction = systemInstruction;
  }

  // Add search grounding if requested
  if (body.web_search) {
    geminiBody.tools = [{
      googleSearch: {}
    }];
  }

  console.log('Sending request to Gemini:', JSON.stringify(geminiBody, null, 2));

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(geminiBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API Error:', errorText);
      return c.json({ error: `Gemini API Error: ${errorText}` }, response.status);
    }

    // Set up streaming response compatible with OpenAI client
    const encoder = new TextEncoder();
    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    const stream = new ReadableStream({
      async start(controller) {
        let buffer = '';

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });

            // Parse JSON objects from the buffer
            let bracketLevel = 0;
            let inString = false;
            let start = 0;

            for (let i = 0; i < buffer.length; i++) {
              const char = buffer[i];

              if (char === '"' && buffer[i - 1] !== '\\') {
                inString = !inString;
              }

              if (!inString) {
                if (char === '{') {
                  if (bracketLevel === 0) start = i;
                  bracketLevel++;
                } else if (char === '}') {
                  bracketLevel--;
                  if (bracketLevel === 0) {
                    const jsonStr = buffer.substring(start, i + 1);
                    try {
                      const data = JSON.parse(jsonStr);
                      // Process Gemini chunk to OpenAI format
                      const chunkText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
                      const groundingMetadata = data.candidates?.[0]?.groundingMetadata;

                      // Send text content
                      if (chunkText) {
                        const openAIChunk = {
                          choices: [{
                            delta: { content: chunkText },
                            finish_reason: null
                          }]
                        };
                        controller.enqueue(encoder.encode(`data: ${JSON.stringify(openAIChunk)}\n\n`));
                      }

                      // Handle grounding sources
                      if (groundingMetadata?.groundingChunks) {
                        const sources = groundingMetadata.groundingChunks
                          .map((chunk, idx) => chunk.web ? {
                            title: chunk.web.title || `Source ${idx + 1}`,
                            url: chunk.web.uri
                          } : null)
                          .filter(Boolean);

                        if (sources.length > 0) {
                          const sourceEvent = {
                            type: 'sources',
                            sources: sources
                          };
                          controller.enqueue(encoder.encode(`data: ${JSON.stringify(sourceEvent)}\n\n`));
                        }
                      }

                    } catch (e) {
                      // Ignore parse errors for partial chunks
                    }
                    // Advance buffer
                    buffer = buffer.substring(i + 1);
                    i = -1;
                    start = 0;
                  }
                }
              }
            }
          }
        } catch (err) {
          console.error('Stream processing error:', err);
          const errorChunk = { error: { message: 'Stream processing failed' } };
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(errorChunk)}\n\n`));
        } finally {
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        }
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      }
    });

  } catch (error) {
    console.error('Gemini handler error:', error);
    return c.json({ error: error.message }, 500);
  }
}

