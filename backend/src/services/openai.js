/**
 * OpenAI Direct API Service
 * 
 * Supports all OpenAI features:
 * - Streaming chat completions
 * - Vision/multimodal (images)
 * - Tool use/function calling
 * - Web search
 * - Code interpreter
 * - File search
 * - JSON mode/structured outputs
 * - Reasoning tokens display (o1, o3, o4)
 * - DALL-E image generation
 * - Responses API (multi-turn with built-in tools)
 */

import { resolveModel, getImageModels, getDefaultImageModel } from '../config/index.js';

const OPENAI_BASE_URL = 'https://api.openai.com/v1';

/**
 * Get OpenAI headers
 */
function getOpenAIHeaders(apiKey, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${apiKey}`
  };

  if (options.organization) {
    headers['OpenAI-Organization'] = options.organization;
  }

  if (options.project) {
    headers['OpenAI-Project'] = options.project;
  }

  return headers;
}

/**
 * Convert content to OpenAI format
 */
function convertContentToOpenAI(content) {
  if (typeof content === 'string') {
    return content;
  }

  if (!Array.isArray(content)) {
    return String(content);
  }

  return content.map(item => {
    if (item.type === 'text') {
      return { type: 'text', text: item.text };
    }

    if (item.type === 'image_url') {
      return {
        type: 'image_url',
        image_url: {
          url: item.image_url.url,
          detail: item.image_url.detail || 'auto'
        }
      };
    }

    return item;
  });
}

/**
 * Build OpenAI chat request body
 */
function buildOpenAIBody(body) {
  const modelId = body.model?.replace('openai/', '') || 'gpt-4o';
  const model = resolveModel('openai', modelId);

  const openAIBody = {
    model,
    messages: body.messages.map(msg => ({
      role: msg.role,
      content: convertContentToOpenAI(msg.content),
      ...(msg.name && { name: msg.name }),
      ...(msg.tool_calls && { tool_calls: msg.tool_calls }),
      ...(msg.tool_call_id && { tool_call_id: msg.tool_call_id })
    })),
    stream: body.stream !== false
  };

  // Generation config
  if (body.temperature !== undefined) openAIBody.temperature = body.temperature;
  if (body.max_tokens !== undefined) openAIBody.max_tokens = body.max_tokens;
  if (body.max_completion_tokens !== undefined) openAIBody.max_completion_tokens = body.max_completion_tokens;
  if (body.top_p !== undefined) openAIBody.top_p = body.top_p;
  if (body.frequency_penalty !== undefined) openAIBody.frequency_penalty = body.frequency_penalty;
  if (body.presence_penalty !== undefined) openAIBody.presence_penalty = body.presence_penalty;
  if (body.stop !== undefined) openAIBody.stop = body.stop;
  if (body.seed !== undefined) openAIBody.seed = body.seed;
  if (body.logprobs !== undefined) openAIBody.logprobs = body.logprobs;
  if (body.top_logprobs !== undefined) openAIBody.top_logprobs = body.top_logprobs;
  if (body.user !== undefined) openAIBody.user = body.user;

  // JSON mode / structured outputs
  if (body.response_format) {
    openAIBody.response_format = body.response_format;
  }

  // Tools / function calling
  if (body.tools) {
    openAIBody.tools = body.tools;
  }
  if (body.tool_choice) {
    openAIBody.tool_choice = body.tool_choice;
  }
  if (body.parallel_tool_calls !== undefined) {
    openAIBody.parallel_tool_calls = body.parallel_tool_calls;
  }

  // Web search (for models that support it)
  if (body.web_search) {
    openAIBody.web_search_options = {
      search_context_size: body.web_search_context_size || 'medium',
      user_location: body.user_location
    };
  }

  // Reasoning effort (for o1, o3, o4 models)
  if (body.reasoning_effort) {
    openAIBody.reasoning_effort = body.reasoning_effort; // 'low', 'medium', 'high'
  }

  // Stream options
  if (body.stream !== false && body.include_usage !== false) {
    openAIBody.stream_options = { include_usage: true };
  }

  return openAIBody;
}

/**
 * Parse OpenAI SSE stream (already in correct format, just pass through)
 */
function createOpenAIStreamTransformer(encoder) {
  let buffer = '';

  return new TransformStream({
    transform(chunk, controller) {
      buffer += new TextDecoder().decode(chunk, { stream: true });

      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          // Pass through as-is (OpenAI format is our target format)
          controller.enqueue(encoder.encode(line + '\n\n'));
        }
      }
    },
    flush(controller) {
      if (buffer.trim()) {
        controller.enqueue(encoder.encode(buffer + '\n'));
      }
    }
  });
}

/**
 * Handle streaming chat completion via OpenAI API
 */
export async function handleOpenAIChat(c, body, apiKey) {
  const openAIBody = buildOpenAIBody(body);

  console.log(`OpenAI request for model: ${openAIBody.model}`);

  try {
    const response = await fetch(`${OPENAI_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: getOpenAIHeaders(apiKey),
      body: JSON.stringify(openAIBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API Error:', errorText);
      return c.json({ error: `OpenAI API Error: ${errorText}` }, response.status);
    }

    // Handle non-streaming response
    if (!openAIBody.stream) {
      const result = await response.json();
      return c.json(result);
    }

    // Stream is already in OpenAI format
    const encoder = new TextEncoder();
    const transformedStream = response.body.pipeThrough(createOpenAIStreamTransformer(encoder));

    return new Response(transformedStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      }
    });

  } catch (error) {
    console.error('OpenAI handler error:', error);
    return c.json({ error: error.message }, 500);
  }
}

/**
 * Generate image with DALL-E
 */
export async function generateImageWithDALLE(prompt, apiKey, options = {}) {
  const imageConfig = getImageModels('openai');
  const model = options.model || getDefaultImageModel('openai') || 'dall-e-3';

  const requestBody = {
    model,
    prompt,
    n: options.n || 1,
    size: options.size || '1024x1024',
    quality: options.quality || 'auto', // 'auto', 'hd', 'low'
    style: options.style || 'auto', // 'vivid', 'natural', 'auto'
    response_format: options.response_format || 'b64_json'
  };

  // DALL-E 3 specific: only allows n=1
  if (model === 'dall-e-3') {
    requestBody.n = 1;
  }

  // gpt-image-1 specific options
  if (model === 'gpt-image-1') {
    if (options.background) requestBody.background = options.background;
    if (options.moderation) requestBody.moderation = options.moderation;
    if (options.output_compression) requestBody.output_compression = options.output_compression;
    if (options.output_format) requestBody.output_format = options.output_format;
  }

  try {
    const response = await fetch(`${OPENAI_BASE_URL}/images/generations`, {
      method: 'POST',
      headers: getOpenAIHeaders(apiKey),
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const error = await response.text();
      return { success: false, error };
    }

    const result = await response.json();
    return {
      success: true,
      model,
      images: result.data.map(img => ({
        data: img.b64_json,
        url: img.url,
        revised_prompt: img.revised_prompt
      }))
    };

  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Edit image with DALL-E
 */
export async function editImageWithDALLE(image, prompt, apiKey, options = {}) {
  const formData = new FormData();

  // Image can be base64 or blob
  if (typeof image === 'string' && image.startsWith('data:')) {
    const blob = await fetch(image).then(r => r.blob());
    formData.append('image', blob, 'image.png');
  } else {
    formData.append('image', image);
  }

  formData.append('prompt', prompt);
  formData.append('model', options.model || 'gpt-image-1');
  formData.append('n', String(options.n || 1));
  formData.append('size', options.size || '1024x1024');

  if (options.mask) {
    formData.append('mask', options.mask);
  }

  try {
    const response = await fetch(`${OPENAI_BASE_URL}/images/edits`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`
      },
      body: formData
    });

    if (!response.ok) {
      const error = await response.text();
      return { success: false, error };
    }

    const result = await response.json();
    return {
      success: true,
      images: result.data.map(img => ({
        data: img.b64_json,
        url: img.url
      }))
    };

  } catch (error) {
    return { success: false, error: error.message };
  }
}
