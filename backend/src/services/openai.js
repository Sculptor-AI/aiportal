/**
 * OpenAI Direct API Service
 *
 * Uses the Responses API for direct OpenAI chat so built-in tools like web
 * search and code interpreter can be exposed through the existing frontend SSE
 * contract without requiring a frontend protocol rewrite.
 */

import { resolveModel, getDefaultImageModel } from '../config/index.js';

const OPENAI_BASE_URL = 'https://api.openai.com/v1';
const OPENAI_DEFAULT_CHAT_MODEL = 'gpt-5.1';
const OPENAI_VIDEO_DEFAULT_MODEL = 'sora-2';
const OPENAI_RESPONSE_INCLUDE = [
  'web_search_call.action.sources',
  'code_interpreter_call.outputs'
];
const SORA_SIZE_BY_ASPECT_RATIO = Object.freeze({
  '16:9': '1280x720',
  '9:16': '720x1280',
});

function getOpenAIHeaders(apiKey, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${apiKey}`
  };

  if (options.organization) {
    headers['OpenAI-Organization'] = options.organization;
  }

  if (options.project) {
    headers['OpenAI-Project'] = options.project;
  }

  return headers;
}

function getOpenAIChatModel(body) {
  const modelId = body.model?.replace('openai/', '') || 'chatgpt-5.4-thinking';
  return resolveModel('openai', modelId) || OPENAI_DEFAULT_CHAT_MODEL;
}

function getOpenAIInstructions(body) {
  if (typeof body.system === 'string' && body.system.trim()) {
    return body.system.trim();
  }

  const systemMessage = (body.messages || []).find((message) => message?.role === 'system');
  if (!systemMessage) {
    return null;
  }

  if (typeof systemMessage.content === 'string') {
    return systemMessage.content;
  }

  if (Array.isArray(systemMessage.content)) {
    return systemMessage.content
      .filter((item) => item?.type === 'text' && typeof item.text === 'string')
      .map((item) => item.text)
      .join('\n')
      .trim() || null;
  }

  return null;
}

function getResponsesTextItemType(role) {
  return role === 'assistant' ? 'output_text' : 'input_text';
}

function convertContentToResponsesInput(content, role = 'user') {
  const textItemType = getResponsesTextItemType(role);

  if (typeof content === 'string') {
    return [{ type: textItemType, text: content }];
  }

  if (!Array.isArray(content)) {
    return [{ type: textItemType, text: String(content) }];
  }

  return content
    .map((item) => {
      if (item?.type === 'text') {
        return { type: textItemType, text: item.text };
      }

      if (item?.type === 'image_url') {
        return {
          type: 'input_image',
          image_url: item.image_url?.url,
          detail: item.image_url?.detail || 'auto'
        };
      }

      return null;
    })
    .filter(Boolean);
}

function normalizeToolChoice(toolChoice) {
  if (!toolChoice) return null;

  if (typeof toolChoice === 'string') {
    if (['auto', 'none', 'required'].includes(toolChoice)) {
      return toolChoice;
    }
    return null;
  }

  if (typeof toolChoice === 'object' && toolChoice.function?.name) {
    return {
      type: 'function',
      name: toolChoice.function.name
    };
  }

  return null;
}

function normalizeReasoningEffort(reasoningEffort) {
  if (typeof reasoningEffort !== 'string') return null;

  switch (reasoningEffort.trim().toLowerCase()) {
    case 'minimal':
      return 'minimal';
    case 'low':
      return 'low';
    case 'medium':
      return 'medium';
    case 'high':
    case 'xhigh':
    case 'max':
      return 'high';
    default:
      return null;
  }
}

function convertFunctionToolsToOpenAI(tools) {
  if (!Array.isArray(tools) || tools.length === 0) {
    return [];
  }

  return tools
    .filter((tool) => tool?.type === 'function' && tool.function?.name)
    .map((tool) => ({
      type: 'function',
      name: tool.function.name,
      description: tool.function.description,
      parameters: tool.function.parameters || { type: 'object', properties: {} },
      ...(tool.function.strict !== undefined && { strict: tool.function.strict })
    }));
}

function buildOpenAIResponsesBody(body) {
  const model = getOpenAIChatModel(body);
  const instructions = getOpenAIInstructions(body);
  const input = (body.messages || [])
    .filter((message) => message && message.role && message.role !== 'system')
    .map((message) => ({
      role: message.role,
      content: convertContentToResponsesInput(message.content, message.role)
    }))
    .filter((message) => Array.isArray(message.content) && message.content.length > 0);

  const tools = [
    ...convertFunctionToolsToOpenAI(body.tools)
  ];

  if (body.web_search) {
    tools.push({ type: 'web_search' });
  }

  if (body.code_execution) {
    tools.push({
      type: 'code_interpreter',
      container: { type: 'auto' }
    });
  }

  const requestBody = {
    model,
    input,
    include: OPENAI_RESPONSE_INCLUDE
  };

  if (instructions) requestBody.instructions = instructions;
  if (tools.length > 0) requestBody.tools = tools;

  const toolChoice = normalizeToolChoice(body.tool_choice);
  if (toolChoice) requestBody.tool_choice = toolChoice;
  if (body.parallel_tool_calls !== undefined) requestBody.parallel_tool_calls = body.parallel_tool_calls;

  const normalizedReasoningEffort = normalizeReasoningEffort(body.reasoning_effort);
  if (normalizedReasoningEffort) {
    requestBody.reasoning = { effort: normalizedReasoningEffort };
  }

  if (body.temperature !== undefined) requestBody.temperature = body.temperature;
  if (body.top_p !== undefined) requestBody.top_p = body.top_p;
  if (body.max_completion_tokens !== undefined) {
    requestBody.max_output_tokens = body.max_completion_tokens;
  } else if (body.max_tokens !== undefined) {
    requestBody.max_output_tokens = body.max_tokens;
  }
  if (body.user !== undefined) requestBody.user = body.user;

  if (body.response_format?.type === 'json_object') {
    requestBody.text = {
      format: { type: 'json_object' }
    };
  } else if (body.response_format?.json_schema?.schema) {
    requestBody.text = {
      format: {
        type: 'json_schema',
        name: body.response_format.json_schema.name || 'structured_output',
        schema: body.response_format.json_schema.schema,
        strict: body.response_format.json_schema.strict ?? false
      }
    };
  }

  return requestBody;
}

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

function collectSource(targetMap, source) {
  if (!source) return;

  const url = source.url || source.uri;
  if (!url) return;

  if (!targetMap.has(url)) {
    targetMap.set(url, {
      title: source.title || source.display_text || url,
      url
    });
  }
}

function collectSourcesFromAnnotations(targetMap, annotations = []) {
  if (!Array.isArray(annotations)) return;

  for (const annotation of annotations) {
    if (!annotation) continue;

    if (annotation.type === 'url_citation') {
      collectSource(targetMap, annotation);
      continue;
    }

    if (annotation.url) {
      collectSource(targetMap, annotation);
    }
  }
}

function extractReasoningText(item) {
  if (!item) return '';

  if (typeof item.summary === 'string') {
    return item.summary;
  }

  if (Array.isArray(item.summary)) {
    return item.summary
      .map((entry) => {
        if (typeof entry === 'string') return entry;
        if (typeof entry?.text === 'string') return entry.text;
        return '';
      })
      .filter(Boolean)
      .join('\n');
  }

  if (typeof item.text === 'string') {
    return item.text;
  }

  return '';
}

function normalizeCodeInterpreterOutput(outputs = []) {
  if (!Array.isArray(outputs) || outputs.length === 0) {
    return '';
  }

  return outputs
    .map((output) => {
      if (typeof output === 'string') {
        return output;
      }

      if (typeof output?.logs === 'string') {
        return output.logs;
      }

      if (typeof output?.text === 'string') {
        return output.text;
      }

      if (typeof output?.content === 'string') {
        return output.content;
      }

      if (output?.type === 'image' && output.file_id) {
        return `[image output: ${output.file_id}]`;
      }

      if (output?.type === 'file' && output.file_id) {
        return `[file output: ${output.file_id}]`;
      }

      try {
        return JSON.stringify(output);
      } catch {
        return '';
      }
    })
    .filter(Boolean)
    .join('\n\n');
}

function parseOpenAIResponse(result) {
  const texts = [];
  const reasoning = [];
  const sources = new Map();
  const codeExecutions = [];

  if (typeof result?.output_text === 'string' && result.output_text.trim()) {
    texts.push(result.output_text);
  }

  for (const item of result?.output || []) {
    if (!item) continue;

    if (item.type === 'message') {
      for (const contentPart of item.content || []) {
        if (contentPart?.type === 'output_text') {
          if (typeof contentPart.text === 'string' && contentPart.text.trim()) {
            texts.push(contentPart.text);
          }
          collectSourcesFromAnnotations(sources, contentPart.annotations);
        }
      }
      continue;
    }

    if (item.type === 'reasoning') {
      const reasoningText = extractReasoningText(item);
      if (reasoningText) {
        reasoning.push(reasoningText);
      }
      continue;
    }

    if (item.type === 'web_search_call') {
      const searchSources = item.action?.sources || item.sources || [];
      for (const source of searchSources) {
        collectSource(sources, source);
      }
      continue;
    }

    if (item.type === 'code_interpreter_call') {
      codeExecutions.push({
        language: item.language || 'python',
        code: item.code || '',
        output: normalizeCodeInterpreterOutput(item.outputs)
      });
    }
  }

  return {
    text: texts.join(''),
    reasoning: reasoning.join('\n\n'),
    sources: Array.from(sources.values()),
    codeExecutions
  };
}

function chunkText(text, chunkSize = 700) {
  const value = typeof text === 'string' ? text : '';
  if (!value) return [];

  const chunks = [];
  for (let index = 0; index < value.length; index += chunkSize) {
    chunks.push(value.slice(index, index + chunkSize));
  }
  return chunks;
}

function createSyntheticOpenAIStream(parsed, usage = null) {
  const encoder = new TextEncoder();

  return new ReadableStream({
    start(controller) {
      const send = (payload) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
      };

      if (parsed.reasoning) {
        send({
          choices: [{
            delta: { reasoning_content: parsed.reasoning },
            finish_reason: null
          }]
        });
      }

      for (const execution of parsed.codeExecutions) {
        if (execution.code) {
          send({
            type: 'code_execution',
            language: execution.language,
            code: execution.code
          });
        }

        if (execution.output) {
          send({
            type: 'code_execution_result',
            outcome: 'OUTCOME_OK',
            output: execution.output
          });
        }
      }

      for (const textChunk of chunkText(parsed.text)) {
        send({
          choices: [{
            delta: { content: textChunk },
            finish_reason: null
          }]
        });
      }

      if (parsed.sources.length > 0) {
        send({
          type: 'sources',
          sources: parsed.sources
        });
      }

      if (usage) {
        send({ usage });
      }

      controller.enqueue(encoder.encode('data: [DONE]\n\n'));
      controller.close();
    }
  });
}

function formatOpenAINonStreamingResponse(model, parsed, usage = null) {
  return {
    id: `chatcmpl-${Date.now()}`,
    object: 'chat.completion',
    model,
    choices: [{
      index: 0,
      message: {
        role: 'assistant',
        content: parsed.text || ''
      },
      finish_reason: 'stop'
    }],
    ...(usage ? { usage } : {})
  };
}

function mapAspectRatioToSoraSize(aspectRatio = '16:9') {
  return SORA_SIZE_BY_ASPECT_RATIO[aspectRatio] || null;
}

export async function handleOpenAIChat(c, body, apiKey) {
  const openAIBody = buildOpenAIResponsesBody(body);

  console.log(
    `OpenAI Responses request for model: ${openAIBody.model}, web_search=${body.web_search === true}, code_execution=${body.code_execution === true}`
  );

  try {
    const response = await fetch(`${OPENAI_BASE_URL}/responses`, {
      method: 'POST',
      headers: getOpenAIHeaders(apiKey),
      body: JSON.stringify(openAIBody)
    });

    if (!response.ok) {
      const errorMessage = await extractOpenAIError(response);
      console.error('OpenAI API Error:', response.status, errorMessage);
      if (response.status === 401 || response.status === 403) {
        return c.json({ error: 'OpenAI API key is invalid or lacks permissions. Check OPENAI_API_KEY configuration.', upstream_status: response.status }, 502);
      }
      return c.json({ error: errorMessage }, response.status);
    }

    const result = await response.json();
    const parsed = parseOpenAIResponse(result);
    const usage = result?.usage
      ? {
          prompt_tokens: result.usage.input_tokens,
          completion_tokens: result.usage.output_tokens,
          total_tokens: result.usage.total_tokens
        }
      : null;

    if (body.stream === false) {
      return c.json(formatOpenAINonStreamingResponse(openAIBody.model, parsed, usage));
    }

    return new Response(createSyntheticOpenAIStream(parsed, usage), {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive'
      }
    });
  } catch (error) {
    console.error('OpenAI handler error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
}

export async function generateImageWithDALLE(prompt, apiKey, options = {}) {
  const model = options.model || getDefaultImageModel('openai') || 'gpt-image-1';

  const requestBody = {
    model,
    prompt,
    n: options.n || 1,
    size: options.size || '1024x1024',
    quality: options.quality || 'auto',
    style: options.style || 'auto',
    response_format: options.response_format || 'b64_json'
  };

  if (model === 'dall-e-3') {
    requestBody.n = 1;
  }

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
      return { success: false, error: await extractOpenAIError(response) };
    }

    const result = await response.json();
    return {
      success: true,
      model,
      images: result.data.map((img) => ({
        data: img.b64_json,
        url: img.url,
        revised_prompt: img.revised_prompt
      }))
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function editImageWithDALLE(image, prompt, apiKey, options = {}) {
  const formData = new FormData();

  if (typeof image === 'string' && image.startsWith('data:')) {
    const blob = await fetch(image).then((r) => r.blob());
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
        Authorization: `Bearer ${apiKey}`
      },
      body: formData
    });

    if (!response.ok) {
      return { success: false, error: await extractOpenAIError(response) };
    }

    const result = await response.json();
    return {
      success: true,
      images: result.data.map((img) => ({
        data: img.b64_json,
        url: img.url
      }))
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

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
