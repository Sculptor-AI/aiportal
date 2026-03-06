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
 * - Reasoning effort controls (for reasoning-capable models)
 * - DALL-E image generation
 * - Responses API (multi-turn with built-in tools)
 */

import { resolveModel, getImageModels, getDefaultImageModel } from '../config/index.js';

const OPENAI_BASE_URL = 'https://api.openai.com/v1';
const OPENAI_VIDEO_DEFAULT_MODEL = 'sora-2';
const SORA_SIZE_BY_ASPECT_RATIO = Object.freeze({
  '16:9': '1280x720',
  '9:16': '720x1280',
});

async function extractOpenAIError(response) {
  try {
    const payload = await response.json();
    return payload?.error?.message || payload?.message || `OpenAI API returned status ${response.status}`;
  } catch {
    try {
      const text = await response.text();
      return text || `OpenAI API returned status ${response.status}`;
    } catch {
      return `OpenAI API returned status ${response.status}`;
    }
  }
}

function mapAspectRatioToSoraSize(aspectRatio = '16:9') {
  return SORA_SIZE_BY_ASPECT_RATIO[aspectRatio] || null;
}

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
  const modelId = body.model?.replace('openai/', '') || 'chatgpt-5.4-thinking';
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

  // Reasoning effort (for reasoning-capable models, e.g. GPT-5.4)
  if (body.reasoning_effort) {
    openAIBody.reasoning_effort = body.reasoning_effort; // model-dependent: e.g. 'minimal'|'low'|'medium'|'high'
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
      console.error('OpenAI API Error:', response.status, errorText.slice(0, 500));
      return c.json({ error: 'Upstream AI provider request failed' }, response.status);
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
    return c.json({ error: 'Internal server error' }, 500);
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

  // GPT Image family specific options
  if (model === 'gpt-image-1' || model === 'gpt-image-1.5' || model === 'chatgpt-image-latest') {
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

/**
 * Generate a video with OpenAI Sora.
 */
export async function generateVideoWithSora(prompt, apiKey, options = {}) {
  const model = options.model || OPENAI_VIDEO_DEFAULT_MODEL;
  const size = mapAspectRatioToSoraSize(options.aspectRatio);

  if (!size) {
    return {
      success: false,
      error: 'Unsupported aspect ratio. Sora currently supports 16:9 and 9:16.'
    };
  }

  const formData = new FormData();
  formData.append('model', model);
  formData.append('prompt', prompt);
  formData.append('size', size);
  formData.append('seconds', String(options.seconds || 8));

  try {
    const response = await fetch(`${OPENAI_BASE_URL}/videos`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`
      },
      body: formData
    });

    if (!response.ok) {
      return {
        success: false,
        error: await extractOpenAIError(response)
      };
    }

    const result = await response.json();
    const videoId = result?.id;

    if (!videoId) {
      return {
        success: false,
        error: 'Unexpected OpenAI response: missing video ID.'
      };
    }

    return {
      success: true,
      videoId,
      model: result?.model || model,
      status: result?.status || 'queued'
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Check the status of a Sora video generation job.
 */
export async function getSoraVideoStatus(videoId, apiKey) {
  try {
    const response = await fetch(`${OPENAI_BASE_URL}/videos/${encodeURIComponent(videoId)}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${apiKey}`
      }
    });

    if (!response.ok) {
      return {
        success: false,
        error: await extractOpenAIError(response)
      };
    }

    const result = await response.json();
    const status = result?.status || 'unknown';
    const done = ['completed', 'failed', 'cancelled', 'canceled'].includes(status);
    const errorMessage =
      result?.error?.message ||
      result?.last_error?.message ||
      result?.failure_reason ||
      null;

    return {
      success: true,
      done,
      status,
      videoId: result?.id || videoId,
      model: result?.model || OPENAI_VIDEO_DEFAULT_MODEL,
      error: errorMessage
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
