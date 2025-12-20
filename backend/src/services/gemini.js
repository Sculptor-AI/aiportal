/**
 * Gemini API Service
 * 
 * Supports all Gemini features:
 * - Streaming chat completions
 * - Vision/multimodal (images, PDFs)
 * - Web search/grounding (Google Search)
 * - Code execution
 * - Function calling/tools
 * - JSON mode/structured outputs
 * - Thinking/reasoning display
 * - URL-based media fetching
 * - System instructions
 * - Safety settings
 * - Video generation (Veo)
 */

import { resolveModel, getImageModelFallbacks } from '../config/index.js';

const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta';

/**
 * Convert OpenAI-style message content to Gemini parts
 */
function convertContentToParts(content) {
  const parts = [];

  if (typeof content === 'string') {
    parts.push({ text: content });
  } else if (Array.isArray(content)) {
    for (const item of content) {
      if (item.type === 'text') {
        parts.push({ text: item.text });
      } else if (item.type === 'image_url') {
        // Handle base64 data URLs
        const matches = item.image_url.url.match(/^data:([^;]+);base64,(.+)$/);
        if (matches) {
          parts.push({
            inlineData: {
              mimeType: matches[1],
              data: matches[2]
            }
          });
        } else {
          // Handle URL-based images (Gemini can fetch these)
          parts.push({
            fileData: {
              fileUri: item.image_url.url,
              mimeType: 'image/jpeg' // Default, Gemini will auto-detect
            }
          });
        }
      } else if (item.type === 'file') {
        // Generic file support (PDFs, etc.)
        const fileMatches = item.file.data?.match(/^data:([^;]+);base64,(.+)$/);
        if (fileMatches) {
          parts.push({
            inlineData: {
              mimeType: fileMatches[1],
              data: fileMatches[2]
            }
          });
        } else if (item.file.url) {
          parts.push({
            fileData: {
              fileUri: item.file.url,
              mimeType: item.file.mimeType || 'application/octet-stream'
            }
          });
        }
      }
    }
  }

  return parts;
}

/**
 * Convert OpenAI tools format to Gemini format
 */
function convertToolsToGemini(tools) {
  if (!tools || tools.length === 0) return null;

  const functionDeclarations = tools
    .filter(tool => tool.type === 'function')
    .map(tool => ({
      name: tool.function.name,
      description: tool.function.description,
      parameters: tool.function.parameters
    }));

  return functionDeclarations.length > 0 ? [{ functionDeclarations }] : null;
}

/**
 * Build Gemini request body with all supported features
 */
function buildGeminiBody(body) {
  // Convert messages to Gemini format
  const contents = [];
  let systemInstruction = null;

  // Handle system prompt
  if (body.system) {
    systemInstruction = { parts: [{ text: body.system }] };
  }

  for (const msg of body.messages || []) {
    if (msg.role === 'system') {
      systemInstruction = { parts: [{ text: typeof msg.content === 'string' ? msg.content : msg.content[0]?.text || '' }] };
      continue;
    }

    const parts = convertContentToParts(msg.content);

    // Handle tool calls in assistant messages
    if (msg.tool_calls) {
      for (const toolCall of msg.tool_calls) {
        parts.push({
          functionCall: {
            name: toolCall.function.name,
            args: JSON.parse(toolCall.function.arguments || '{}')
          }
        });
      }
    }

    // Handle tool responses
    if (msg.role === 'tool') {
      contents.push({
        role: 'user',
        parts: [{
          functionResponse: {
            name: msg.name || msg.tool_call_id,
            response: { result: msg.content }
          }
        }]
      });
      continue;
    }

    if (parts.length > 0) {
      contents.push({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts
      });
    }
  }

  const geminiBody = {
    contents,
    generationConfig: {}
  };

  // Generation config
  if (body.temperature !== undefined) geminiBody.generationConfig.temperature = body.temperature;
  if (body.max_tokens !== undefined) geminiBody.generationConfig.maxOutputTokens = body.max_tokens;
  if (body.top_p !== undefined) geminiBody.generationConfig.topP = body.top_p;
  if (body.top_k !== undefined) geminiBody.generationConfig.topK = body.top_k;
  if (body.stop !== undefined) geminiBody.generationConfig.stopSequences = Array.isArray(body.stop) ? body.stop : [body.stop];

  // JSON mode / structured outputs
  if (body.response_format?.type === 'json_object') {
    geminiBody.generationConfig.responseMimeType = 'application/json';
  }
  if (body.response_format?.json_schema) {
    geminiBody.generationConfig.responseMimeType = 'application/json';
    geminiBody.generationConfig.responseSchema = body.response_format.json_schema.schema;
  }

  // System instruction
  if (systemInstruction) {
    geminiBody.systemInstruction = systemInstruction;
  }

  // Build tools array
  const tools = [];

  // Function calling / tools
  const functionTools = convertToolsToGemini(body.tools);
  if (functionTools) {
    tools.push(...functionTools);
  }

  // Web search / Google Search grounding
  if (body.web_search) {
    tools.push({ googleSearch: {} });
  }

  // Code execution
  if (body.code_execution) {
    tools.push({ codeExecution: {} });
  }

  // URL context (fetch and include web page content)
  if (body.url_context) {
    tools.push({ urlContext: {} });
  }

  if (tools.length > 0) {
    geminiBody.tools = tools;
  }

  // Tool config (auto, any, none)
  if (body.tool_choice) {
    if (body.tool_choice === 'auto') {
      geminiBody.toolConfig = { functionCallingConfig: { mode: 'AUTO' } };
    } else if (body.tool_choice === 'none') {
      geminiBody.toolConfig = { functionCallingConfig: { mode: 'NONE' } };
    } else if (body.tool_choice === 'required' || body.tool_choice === 'any') {
      geminiBody.toolConfig = { functionCallingConfig: { mode: 'ANY' } };
    } else if (typeof body.tool_choice === 'object' && body.tool_choice.function) {
      geminiBody.toolConfig = {
        functionCallingConfig: {
          mode: 'ANY',
          allowedFunctionNames: [body.tool_choice.function.name]
        }
      };
    }
  }

  // Thinking / reasoning budget
  if (body.thinking || body.reasoning) {
    geminiBody.generationConfig.thinkingConfig = {
      thinkingBudget: body.thinking_budget || body.reasoning_budget || 8192
    };
  }

  // Safety settings (optional relaxation)
  if (body.safety_settings) {
    geminiBody.safetySettings = body.safety_settings;
  }

  return geminiBody;
}

/**
 * Parse Gemini streaming response and convert to OpenAI SSE format
 */
function createGeminiStreamTransformer(encoder) {
  let buffer = '';

  return new TransformStream({
    transform(chunk, controller) {
      buffer += new TextDecoder().decode(chunk, { stream: true });

      // Parse JSON objects from buffer
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
                const candidate = data.candidates?.[0];

                if (candidate) {
                  // Extract text content
                  const textParts = candidate.content?.parts?.filter(p => p.text) || [];
                  const text = textParts.map(p => p.text).join('');

                  // Extract thinking/reasoning
                  const thoughtParts = candidate.content?.parts?.filter(p => p.thought) || [];
                  const thinking = thoughtParts.map(p => p.thought).join('');

                  // Extract function calls
                  const functionCalls = candidate.content?.parts?.filter(p => p.functionCall) || [];

                  // Extract executable code results
                  const codeResults = candidate.content?.parts?.filter(p => p.executableCode || p.codeExecutionResult) || [];

                  // Send thinking if present
                  if (thinking) {
                    const thinkingChunk = {
                      choices: [{
                        delta: { reasoning_content: thinking },
                        finish_reason: null
                      }]
                    };
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify(thinkingChunk)}\n\n`));
                  }

                  // Send text content
                  if (text) {
                    const textChunk = {
                      choices: [{
                        delta: { content: text },
                        finish_reason: null
                      }]
                    };
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify(textChunk)}\n\n`));
                  }

                  // Send function calls
                  for (const fc of functionCalls) {
                    const toolCallChunk = {
                      choices: [{
                        delta: {
                          tool_calls: [{
                            id: `call_${Date.now()}`,
                            type: 'function',
                            function: {
                              name: fc.functionCall.name,
                              arguments: JSON.stringify(fc.functionCall.args || {})
                            }
                          }]
                        },
                        finish_reason: null
                      }]
                    };
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify(toolCallChunk)}\n\n`));
                  }

                  // Send code execution results
                  for (const cr of codeResults) {
                    if (cr.executableCode) {
                      const codeChunk = {
                        type: 'code_execution',
                        language: cr.executableCode.language,
                        code: cr.executableCode.code
                      };
                      controller.enqueue(encoder.encode(`data: ${JSON.stringify(codeChunk)}\n\n`));
                    }
                    if (cr.codeExecutionResult) {
                      const resultChunk = {
                        type: 'code_execution_result',
                        outcome: cr.codeExecutionResult.outcome,
                        output: cr.codeExecutionResult.output
                      };
                      controller.enqueue(encoder.encode(`data: ${JSON.stringify(resultChunk)}\n\n`));
                    }
                  }

                  // Handle grounding metadata (search sources)
                  const grounding = candidate.groundingMetadata;
                  if (grounding?.groundingChunks) {
                    const sources = grounding.groundingChunks
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
                }

                // Check for inline image generation
                const inlineImages = data.candidates?.[0]?.content?.parts?.filter(p => p.inlineData?.mimeType?.startsWith('image/')) || [];
                for (const img of inlineImages) {
                  const imageChunk = {
                    type: 'generated_image',
                    mimeType: img.inlineData.mimeType,
                    data: img.inlineData.data
                  };
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify(imageChunk)}\n\n`));
                }

              } catch (e) {
                // Ignore parse errors for partial chunks
              }
              buffer = buffer.substring(i + 1);
              i = -1;
              start = 0;
            }
          }
        }
      }
    },
    flush(controller) {
      controller.enqueue(encoder.encode('data: [DONE]\n\n'));
    }
  });
}

/**
 * Handle streaming chat completion via Gemini API
 */
export async function handleGeminiChat(c, body, apiKey) {
  const modelId = body.model?.replace('google/', '') || 'gemini-3-pro';
  const targetModel = resolveModel('gemini', modelId);

  console.log(`Gemini request: ${body.model} -> ${targetModel}`);

  const geminiBody = buildGeminiBody(body);
  const url = `${GEMINI_BASE_URL}/models/${targetModel}:streamGenerateContent?alt=sse&key=${apiKey}`;

  console.log('Gemini request body:', JSON.stringify(geminiBody, null, 2));

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

    // Transform Gemini stream to OpenAI-compatible SSE
    const encoder = new TextEncoder();
    const transformedStream = response.body.pipeThrough(createGeminiStreamTransformer(encoder));

    return new Response(transformedStream, {
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

/**
 * Handle non-streaming chat completion via Gemini API
 */
export async function handleGeminiChatNonStreaming(c, body, apiKey) {
  const modelId = body.model?.replace('google/', '') || 'gemini-3-pro';
  const targetModel = resolveModel('gemini', modelId);

  const geminiBody = buildGeminiBody(body);
  const url = `${GEMINI_BASE_URL}/models/${targetModel}:generateContent?key=${apiKey}`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(geminiBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      return c.json({ error: `Gemini API Error: ${errorText}` }, response.status);
    }

    const result = await response.json();

    // Convert to OpenAI format
    const candidate = result.candidates?.[0];
    const textContent = candidate?.content?.parts?.map(p => p.text || '').join('') || '';

    return c.json({
      id: `chatcmpl-${Date.now()}`,
      object: 'chat.completion',
      model: targetModel,
      choices: [{
        index: 0,
        message: {
          role: 'assistant',
          content: textContent
        },
        finish_reason: candidate?.finishReason?.toLowerCase() || 'stop'
      }],
      usage: result.usageMetadata ? {
        prompt_tokens: result.usageMetadata.promptTokenCount,
        completion_tokens: result.usageMetadata.candidatesTokenCount,
        total_tokens: result.usageMetadata.totalTokenCount
      } : null
    });

  } catch (error) {
    console.error('Gemini handler error:', error);
    return c.json({ error: error.message }, 500);
  }
}

/**
 * Check if a model is a Gemini native image model (uses generateContent)
 * vs an Imagen model (uses predict)
 */
function isGeminiImageModel(modelId) {
  return modelId && modelId.startsWith('gemini-');
}

/**
 * Build contents array for Gemini image generation with optional history
 */
function buildGeminiImageContents(prompt, history = []) {
  const contents = [];

  // Add conversation history if provided
  if (history && history.length > 0) {
    for (const item of history) {
      if (item.role === 'user' && item.text) {
        contents.push({
          role: 'user',
          parts: [{ text: item.text }]
        });
      } else if (item.role === 'assistant' && item.imageUrl) {
        // Extract base64 data from data URL
        let imageData = item.imageUrl;
        let mimeType = 'image/png';

        if (imageData.startsWith('data:')) {
          const match = imageData.match(/^data:([^;]+);base64,(.+)$/);
          if (match) {
            mimeType = match[1];
            imageData = match[2];
          }
        }

        contents.push({
          role: 'model',
          parts: [{
            inlineData: {
              mimeType: mimeType,
              data: imageData
            }
          }]
        });
      }
    }
  }

  // Add the current prompt
  contents.push({
    role: 'user',
    parts: [{ text: prompt }]
  });

  return contents;
}

/**
 * Generate image using Gemini native image generation (generateContent endpoint)
 */
async function generateWithGeminiNative(prompt, apiKey, model, options = {}) {
  const hasHistory = options.history && options.history.length > 0;
  console.log(`[Gemini Image] Generating with model: ${model}, history: ${hasHistory ? options.history.length + ' items' : 'none'}`);

  // Build contents with conversation history for multi-turn editing
  const contents = buildGeminiImageContents(prompt, options.history);

  const requestBody = {
    contents: contents,
    generationConfig: {
      responseModalities: ["TEXT", "IMAGE"]
    }
  };

  try {
    const response = await fetch(
      `${GEMINI_BASE_URL}/models/${model}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      }
    );

    if (response.ok) {
      const result = await response.json();
      console.log(`[Gemini Image] Response received`);

      // Extract images from the response
      const images = [];
      const candidates = result.candidates || [];

      for (const candidate of candidates) {
        const parts = candidate.content?.parts || [];
        for (const part of parts) {
          if (part.inlineData?.mimeType?.startsWith('image/')) {
            images.push({
              data: part.inlineData.data,
              mimeType: part.inlineData.mimeType
            });
          }
        }
      }

      if (images.length > 0) {
        console.log(`[Gemini Image] Success with model: ${model}, got ${images.length} image(s)`);
        return {
          success: true,
          model,
          images
        };
      } else {
        console.log(`[Gemini Image] No images in response from ${model}`);
      }
    } else {
      const errorText = await response.text();
      console.log(`[Gemini Image] Model ${model} returned status: ${response.status}`, errorText);
      return { success: false, error: `Status ${response.status}: ${errorText}` };
    }
  } catch (e) {
    console.error(`[Gemini Image] Model ${model} failed:`, e.message);
    return { success: false, error: e.message };
  }

  return { success: false, error: 'Unknown error' };
}

/**
 * Generate image using Imagen models (predict endpoint)
 */
async function generateWithImagen(prompt, apiKey, model, options = {}) {
  console.log(`[Imagen] Generating with model: ${model}`);

  const requestBody = {
    instances: [{ prompt }],
    parameters: {
      sampleCount: options.count || 1,
      aspectRatio: options.aspectRatio || '1:1',
      ...(options.imageSize && { imageSize: options.imageSize }),
      ...(options.negativePrompt && { negativePrompt: options.negativePrompt }),
      ...(options.seed && { seed: options.seed })
    }
  };

  try {
    const response = await fetch(
      `${GEMINI_BASE_URL}/models/${model}:predict?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      }
    );

    if (response.ok) {
      const result = await response.json();
      if (result.predictions?.[0]?.bytesBase64Encoded) {
        console.log(`[Imagen] Success with model: ${model}`);
        return {
          success: true,
          model,
          images: result.predictions.map(p => ({
            data: p.bytesBase64Encoded,
            mimeType: p.mimeType || 'image/png'
          }))
        };
      }
    } else {
      console.log(`[Imagen] Model ${model} returned status: ${response.status}`);
      const errorText = await response.text();
      return { success: false, error: `Status ${response.status}: ${errorText}` };
    }
  } catch (e) {
    console.error(`[Imagen] Model ${model} failed:`, e.message);
    return { success: false, error: e.message };
  }

  return { success: false, error: 'Unknown error' };
}

/**
 * Generate image using Google's image models (Gemini native or Imagen)
 */
export async function generateImageWithImagen(prompt, apiKey, options = {}) {
  // If a specific API ID is provided, use it directly; otherwise use fallbacks
  let models;
  if (options.apiId) {
    // Use the specific API ID first, then fallbacks
    const fallbacks = getImageModelFallbacks('google', options.model);
    models = [options.apiId, ...fallbacks.filter(m => m !== options.apiId)];
  } else {
    models = getImageModelFallbacks('google', options.model);
  }

  const errors = [];
  console.log(`[Image Gen] Trying models in order:`, models);

  for (const model of models) {
    let result;

    if (isGeminiImageModel(model)) {
      // Use Gemini native image generation (generateContent endpoint)
      result = await generateWithGeminiNative(prompt, apiKey, model, options);
    } else {
      // Use Imagen (predict endpoint)
      result = await generateWithImagen(prompt, apiKey, model, options);
    }

    if (result?.success) {
      return result;
    } else if (result?.error) {
      errors.push(`${model}: ${result.error}`);
    }
  }

  return { success: false, error: `All image models failed. Details: ${errors.join('; ')}` };
}

/**
 * Generate video using Veo 2 (Gemini API)
 * 
 * Uses the long-running predictLongRunning endpoint
 * Note: Veo 2 requires specific API access and may not be available to all users
 */
export async function generateVideoWithVeo(prompt, apiKey, options = {}) {
  // Use the specific model ID for Veo 2
  const model = 'veo-2.0-generate-001';
  
  console.log(`[Veo Video] Generating with model: ${model}`);
  console.log(`[Veo Video] Prompt: "${prompt.substring(0, 100)}..."`);
  console.log(`[Veo Video] Options:`, options);

  const requestBody = {
    instances: [{ 
      prompt: prompt 
    }],
    parameters: {
      aspectRatio: options.aspectRatio || '16:9',
      ...(options.negativePrompt && { negativePrompt: options.negativePrompt })
    }
  };

  console.log(`[Veo Video] Request body:`, JSON.stringify(requestBody, null, 2));

  try {
    const url = `${GEMINI_BASE_URL}/models/${model}:predictLongRunning?key=${apiKey}`;
    console.log(`[Veo Video] URL: ${url.replace(apiKey, 'API_KEY_HIDDEN')}`);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });

    const result = await response.json();
    
    if (!response.ok) {
      console.error(`[Veo Video] API Error (${response.status}):`, JSON.stringify(result, null, 2));
      
      // Provide more helpful error messages
      let errorMessage = result.error?.message || `API returned status ${response.status}`;
      
      if (response.status === 403) {
        errorMessage = 'Access denied. Veo 2 video generation requires specific API access. Please check your API key permissions.';
      } else if (response.status === 404) {
        errorMessage = 'Veo 2 model not found. This model may not be available in your region or requires special access.';
      } else if (response.status === 429) {
        errorMessage = 'Rate limit exceeded. Please wait a moment and try again.';
      }
      
      return { 
        success: false, 
        error: errorMessage
      };
    }
    
    // Returns an operation name for polling
    if (result.name) {
      console.log(`[Veo Video] Operation started successfully: ${result.name}`);
      return {
        success: true,
        operationName: result.name,
        model
      };
    } else {
      console.error(`[Veo Video] Unexpected response structure:`, JSON.stringify(result, null, 2));
      return { success: false, error: 'Unexpected API response - no operation name returned' };
    }
  } catch (e) {
    console.error(`[Veo Video] Exception:`, e);
    return { success: false, error: `Network error: ${e.message}` };
  }
}

/**
 * Check status of a long-running operation (Veo video generation)
 */
export async function checkOperationStatus(operationName, apiKey) {
  try {
    // Operation name usually looks like "operations/..."
    const url = `${GEMINI_BASE_URL}/${operationName}?key=${apiKey}`;
    console.log(`[Veo Status] Checking: ${operationName}`);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    const result = await response.json();
    
    if (!response.ok) {
      console.error(`[Veo Status] Error (${response.status}):`, JSON.stringify(result, null, 2));
      return { 
        success: false, 
        error: result.error?.message || `Status ${response.status}: Unknown error` 
      };
    }

    console.log(`[Veo Status] Response done=${result.done}:`, JSON.stringify(result, null, 2).substring(0, 500));

    // Check if done
    if (result.done) {
      if (result.error) {
        console.error(`[Veo Status] Operation failed:`, result.error);
        return { success: false, done: true, error: result.error.message || 'Video generation failed' };
      }
      
      // Extract video URI - try multiple possible response structures
      // Based on REST API docs: response.generateVideoResponse.generatedSamples[0].video.uri
      let videoUri = null;
      
      // Try different response structures (API may vary)
      const possiblePaths = [
        result.response?.generateVideoResponse?.generatedSamples?.[0]?.video?.uri,
        result.response?.result?.videos?.[0]?.video?.uri,
        result.response?.videos?.[0]?.uri,
        result.response?.generatedSamples?.[0]?.video?.uri,
        result.result?.generatedSamples?.[0]?.video?.uri,
      ];
      
      for (const path of possiblePaths) {
        if (path) {
          videoUri = path;
          break;
        }
      }
      
      if (!videoUri) {
        console.log('[Veo Status] Completed but could not find video URI. Full response:', JSON.stringify(result, null, 2));
      } else {
        console.log(`[Veo Status] Video ready at: ${videoUri}`);
      }
      
      return {
        success: true,
        done: true,
        videoUri
      };
    }
    
    // Still running
    return {
      success: true,
      done: false,
      metadata: result.metadata
    };
    
  } catch (e) {
    console.error(`[Veo Status] Exception:`, e);
    return { success: false, error: `Network error: ${e.message}` };
  }
}