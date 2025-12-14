/**
 * Anthropic Claude API Service
 * 
 * Supports all Claude features:
 * - Streaming chat completions
 * - Vision/multimodal (images, PDFs)
 * - Tool use/function calling
 * - Web search (web_search_20250305)
 * - Web fetch/URL context (web_fetch_20250910)
 * - Code execution (code_execution_20250825)
 * - Computer use
 * - JSON mode/structured outputs
 * - Extended thinking
 * - Citations
 * - System prompts
 */

import { resolveModel, getDefaultModel } from '../config/index.js';

const ANTHROPIC_BASE_URL = 'https://api.anthropic.com/v1';
const ANTHROPIC_VERSION = '2023-06-01';

/**
 * Get Anthropic headers with appropriate beta flags
 */
function getAnthropicHeaders(apiKey, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    'x-api-key': apiKey,
    'anthropic-version': options.version || ANTHROPIC_VERSION
  };

  // Enable beta features - each requires its own beta header
  const betas = [];
  
  if (options.computer_use) {
    betas.push('computer-use-2025-01-24');
  }
  if (options.citations) {
    betas.push('citations-2024-11-04');
  }
  if (options.extended_thinking) {
    betas.push('interleaved-thinking-2025-05-14');
  }
  if (options.token_efficient_tools) {
    betas.push('token-efficient-tools-2025-02-19');
  }
  if (options.pdf_support) {
    betas.push('pdfs-2024-09-25');
  }
  // Web search beta header
  if (options.web_search) {
    betas.push('web-search-2025-03-05');
  }
  // Web fetch (URL context) beta header
  if (options.url_context || options.web_fetch) {
    betas.push('web-fetch-2025-09-10');
  }
  // Code execution beta header
  if (options.code_execution) {
    betas.push('code-execution-2025-08-25');
  }
  if (options.mcp) {
    betas.push('mcp-client-2025-04-04');
  }

  if (betas.length > 0) {
    headers['anthropic-beta'] = betas.join(',');
  }

  return headers;
}

/**
 * Convert OpenAI-style content to Anthropic format
 */
function convertContentToAnthropic(content) {
  if (typeof content === 'string') {
    return [{ type: 'text', text: content }];
  }

  if (!Array.isArray(content)) {
    return [{ type: 'text', text: String(content) }];
  }

  return content.map(item => {
    if (item.type === 'text') {
      return { type: 'text', text: item.text };
    }
    
    if (item.type === 'image_url') {
      // Handle base64 data URLs
      const matches = item.image_url.url.match(/^data:([^;]+);base64,(.+)$/);
      if (matches) {
        return {
          type: 'image',
          source: {
            type: 'base64',
            media_type: matches[1],
            data: matches[2]
          }
        };
      }
      // Handle URL-based images
      return {
        type: 'image',
        source: {
          type: 'url',
          url: item.image_url.url
        }
      };
    }

    if (item.type === 'document' || item.type === 'file') {
      // PDF support
      const file = item.document || item.file;
      const matches = file.data?.match(/^data:([^;]+);base64,(.+)$/);
      if (matches) {
        return {
          type: 'document',
          source: {
            type: 'base64',
            media_type: matches[1],
            data: matches[2]
          },
          ...(item.citations !== false && { citations: { enabled: true } })
        };
      }
      if (file.url) {
        return {
          type: 'document',
          source: {
            type: 'url',
            url: file.url
          },
          ...(item.citations !== false && { citations: { enabled: true } })
        };
      }
    }

    return item;
  }).filter(Boolean);
}

/**
 * Convert OpenAI tools format to Anthropic format
 * Includes support for web_search, web_fetch, and code_execution tools
 */
function convertToolsToAnthropic(tools, options = {}) {
  if (!tools || tools.length === 0) return null;

  const anthropicTools = [];

  for (const tool of tools) {
    if (tool.type === 'function') {
      anthropicTools.push({
        name: tool.function.name,
        description: tool.function.description,
        input_schema: tool.function.parameters || { type: 'object', properties: {} }
      });
    } else if (tool.type === 'computer_20241022' || tool.type === 'computer') {
      // Computer use tool
      anthropicTools.push({
        type: 'computer_20241022',
        name: 'computer',
        display_width_px: tool.display_width_px || 1024,
        display_height_px: tool.display_height_px || 768,
        display_number: tool.display_number || 1
      });
    } else if (tool.type === 'text_editor_20241022' || tool.type === 'text_editor') {
      anthropicTools.push({
        type: 'text_editor_20241022',
        name: 'str_replace_editor'
      });
    } else if (tool.type === 'bash_20241022' || tool.type === 'bash') {
      anthropicTools.push({
        type: 'bash_20241022',
        name: 'bash'
      });
    } else if (tool.type === 'web_search' || tool.name === 'web_search') {
      // Web search tool - per docs: https://platform.claude.com/docs/en/agents-and-tools/tool-use/web-search
      anthropicTools.push({
        type: 'web_search_20250305',
        name: 'web_search',
        ...(tool.max_uses && { max_uses: tool.max_uses }),
        ...(tool.allowed_domains && { allowed_domains: tool.allowed_domains }),
        ...(tool.blocked_domains && { blocked_domains: tool.blocked_domains }),
        ...(tool.user_location && { user_location: tool.user_location })
      });
    } else if (tool.type === 'web_fetch' || tool.name === 'web_fetch') {
      // Web fetch (URL context) tool - per docs: https://platform.claude.com/docs/en/agents-and-tools/tool-use/web-fetch-tool
      anthropicTools.push({
        type: 'web_fetch_20250910',
        name: 'web_fetch',
        ...(tool.max_uses && { max_uses: tool.max_uses }),
        ...(tool.allowed_domains && { allowed_domains: tool.allowed_domains }),
        ...(tool.blocked_domains && { blocked_domains: tool.blocked_domains }),
        ...(tool.citations && { citations: tool.citations }),
        ...(tool.max_content_tokens && { max_content_tokens: tool.max_content_tokens })
      });
    } else if (tool.type === 'code_execution' || tool.name === 'code_execution') {
      // Code execution tool - per docs: https://platform.claude.com/docs/en/agents-and-tools/tool-use/code-execution-tool
      anthropicTools.push({
        type: 'code_execution_20250825',
        name: 'code_execution'
      });
    }
  }

  return anthropicTools.length > 0 ? anthropicTools : null;
}

/**
 * Build Anthropic request body with all supported features
 */
function buildAnthropicBody(body) {
  const modelId = body.model?.replace('anthropic/', '') || 'claude-sonnet-4';
  const model = resolveModel('anthropic', modelId);

  // Convert messages
  const messages = [];
  let system = null;

  for (const msg of body.messages || []) {
    if (msg.role === 'system') {
      // Anthropic uses a separate system field
      system = typeof msg.content === 'string' ? msg.content : msg.content[0]?.text || '';
      continue;
    }

    if (msg.role === 'tool') {
      // Tool results
      messages.push({
        role: 'user',
        content: [{
          type: 'tool_result',
          tool_use_id: msg.tool_call_id,
          content: msg.content,
          ...(msg.is_error && { is_error: true })
        }]
      });
      continue;
    }

    const content = convertContentToAnthropic(msg.content);

    // Handle assistant tool calls
    if (msg.role === 'assistant' && msg.tool_calls) {
      const toolUses = msg.tool_calls.map(tc => ({
        type: 'tool_use',
        id: tc.id,
        name: tc.function.name,
        input: JSON.parse(tc.function.arguments || '{}')
      }));
      content.push(...toolUses);
    }

    messages.push({
      role: msg.role,
      content
    });
  }

  // Handle system from body
  if (body.system) {
    system = body.system;
  }

  const anthropicBody = {
    model,
    messages,
    max_tokens: body.max_tokens || 8192
  };

  // System prompt
  if (system) {
    anthropicBody.system = system;
  }

  // Generation config
  if (body.temperature !== undefined) anthropicBody.temperature = body.temperature;
  if (body.top_p !== undefined) anthropicBody.top_p = body.top_p;
  if (body.top_k !== undefined) anthropicBody.top_k = body.top_k;
  if (body.stop !== undefined) {
    anthropicBody.stop_sequences = Array.isArray(body.stop) ? body.stop : [body.stop];
  }

  // Streaming
  anthropicBody.stream = body.stream !== false;

  // Build options for headers (beta flags)
  const options = {
    computer_use: body.computer_use,
    web_search: body.web_search,
    url_context: body.url_context,
    code_execution: body.code_execution,
    citations: body.citations,
    pdf_support: body.messages?.some(m => 
      Array.isArray(m.content) && m.content.some(c => c.type === 'document' || c.type === 'file')
    )
  };

  // Build tools array
  let tools = body.tools ? [...body.tools] : [];
  
  // Add web search tool if requested
  if (body.web_search && !tools.some(t => t.type === 'web_search' || t.name === 'web_search')) {
    tools.push({
      type: 'web_search',
      max_uses: body.web_search_max_uses || 5
    });
  }
  
  // Add web fetch (URL context) tool if requested
  if (body.url_context && !tools.some(t => t.type === 'web_fetch' || t.name === 'web_fetch')) {
    tools.push({
      type: 'web_fetch',
      max_uses: body.url_context_max_uses || 5,
      citations: { enabled: true }
    });
  }
  
  // Add code execution tool if requested
  if (body.code_execution && !tools.some(t => t.type === 'code_execution' || t.name === 'code_execution')) {
    tools.push({
      type: 'code_execution'
    });
  }

  const anthropicTools = convertToolsToAnthropic(tools, options);
  if (anthropicTools) {
    anthropicBody.tools = anthropicTools;
  }

  // Tool choice
  if (body.tool_choice) {
    if (body.tool_choice === 'auto') {
      anthropicBody.tool_choice = { type: 'auto' };
    } else if (body.tool_choice === 'none') {
      // Don't include tools if none
    } else if (body.tool_choice === 'required' || body.tool_choice === 'any') {
      anthropicBody.tool_choice = { type: 'any' };
    } else if (typeof body.tool_choice === 'object' && body.tool_choice.function) {
      anthropicBody.tool_choice = {
        type: 'tool',
        name: body.tool_choice.function.name
      };
    }
  }

  // Extended thinking
  if (body.thinking || body.extended_thinking) {
    anthropicBody.thinking = {
      type: 'enabled',
      budget_tokens: body.thinking_budget || body.reasoning_budget || 10000
    };
    options.extended_thinking = true;
  }

  return { anthropicBody, options };
}

/**
 * Parse Anthropic SSE stream and convert to OpenAI format
 * Handles text, tool calls, code execution results, and web fetch results
 */
function createAnthropicStreamTransformer(encoder) {
  let buffer = '';
  let currentToolCall = null;
  let currentThinking = '';
  let currentServerToolUse = null;

  return new TransformStream({
    transform(chunk, controller) {
      buffer += new TextDecoder().decode(chunk, { stream: true });

      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') {
            controller.enqueue(encoder.encode('data: [DONE]\n\n'));
            continue;
          }

          try {
            const event = JSON.parse(data);

            // Handle different event types
            switch (event.type) {
              case 'content_block_start':
                if (event.content_block?.type === 'tool_use') {
                  currentToolCall = {
                    id: event.content_block.id,
                    name: event.content_block.name,
                    arguments: ''
                  };
                }
                if (event.content_block?.type === 'server_tool_use') {
                  // Server-side tools like code_execution
                  currentServerToolUse = {
                    id: event.content_block.id,
                    name: event.content_block.name,
                    input: ''
                  };
                }
                if (event.content_block?.type === 'thinking') {
                  currentThinking = '';
                }
                break;

              case 'content_block_delta':
                if (event.delta?.type === 'text_delta') {
                  const chunk = {
                    choices: [{
                      delta: { content: event.delta.text },
                      finish_reason: null
                    }]
                  };
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`));
                }
                if (event.delta?.type === 'thinking_delta') {
                  currentThinking += event.delta.thinking || '';
                  const chunk = {
                    choices: [{
                      delta: { reasoning_content: event.delta.thinking },
                      finish_reason: null
                    }]
                  };
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`));
                }
                if (event.delta?.type === 'input_json_delta') {
                  if (currentToolCall) {
                    currentToolCall.arguments += event.delta.partial_json || '';
                  }
                  if (currentServerToolUse) {
                    currentServerToolUse.input += event.delta.partial_json || '';
                  }
                }
                break;

              case 'content_block_stop':
                if (currentToolCall) {
                  const toolChunk = {
                    choices: [{
                      delta: {
                        tool_calls: [{
                          id: currentToolCall.id,
                          type: 'function',
                          function: {
                            name: currentToolCall.name,
                            arguments: currentToolCall.arguments
                          }
                        }]
                      },
                      finish_reason: null
                    }]
                  };
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify(toolChunk)}\n\n`));
                  currentToolCall = null;
                }
                if (currentServerToolUse) {
                  // Emit code execution event for frontend
                  if (currentServerToolUse.name === 'code_execution') {
                    try {
                      const input = JSON.parse(currentServerToolUse.input || '{}');
                      const codeChunk = {
                        type: 'code_execution',
                        language: 'bash', // Anthropic uses bash
                        code: input.code || input.command || ''
                      };
                      controller.enqueue(encoder.encode(`data: ${JSON.stringify(codeChunk)}\n\n`));
                    } catch (e) {
                      // Ignore parse errors
                    }
                  }
                  currentServerToolUse = null;
                }
                break;

              // Handle code execution results
              case 'code_execution_tool_result':
                const codeResult = {
                  type: 'code_execution_result',
                  outcome: event.content?.stdout ? 'OUTCOME_OK' : 'OUTCOME_ERROR',
                  output: event.content?.stdout || event.content?.stderr || ''
                };
                controller.enqueue(encoder.encode(`data: ${JSON.stringify(codeResult)}\n\n`));
                break;

              // Handle bash/text editor code execution results (new format)
              case 'bash_code_execution_result':
              case 'text_editor_code_execution_result':
                const bashResult = {
                  type: 'code_execution_result',
                  outcome: event.content?.exit_code === 0 ? 'OUTCOME_OK' : 'OUTCOME_ERROR',
                  output: event.content?.stdout || event.content?.stderr || event.content?.output || ''
                };
                controller.enqueue(encoder.encode(`data: ${JSON.stringify(bashResult)}\n\n`));
                break;

              // Handle web fetch results
              case 'web_fetch_tool_result':
                if (event.content?.type === 'web_fetch_result') {
                  // Extract sources from web fetch for citation
                  const sourceEvent = {
                    type: 'sources',
                    sources: [{
                      title: event.content.url,
                      url: event.content.url
                    }]
                  };
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify(sourceEvent)}\n\n`));
                }
                break;

              case 'message_delta':
                if (event.delta?.stop_reason) {
                  const finishChunk = {
                    choices: [{
                      delta: {},
                      finish_reason: event.delta.stop_reason === 'end_turn' ? 'stop' : event.delta.stop_reason
                    }]
                  };
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify(finishChunk)}\n\n`));
                }

                // Include usage if available
                if (event.usage) {
                  const usageChunk = {
                    usage: {
                      prompt_tokens: event.usage.input_tokens,
                      completion_tokens: event.usage.output_tokens,
                      total_tokens: (event.usage.input_tokens || 0) + (event.usage.output_tokens || 0)
                    }
                  };
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify(usageChunk)}\n\n`));
                }
                break;

              case 'error':
                const errorChunk = {
                  error: {
                    message: event.error?.message || 'Unknown error',
                    type: event.error?.type
                  }
                };
                controller.enqueue(encoder.encode(`data: ${JSON.stringify(errorChunk)}\n\n`));
                break;
            }
          } catch (e) {
            // Ignore parse errors
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
 * Handle streaming chat completion via Anthropic API
 */
export async function handleAnthropicChat(c, body, apiKey) {
  const { anthropicBody, options } = buildAnthropicBody(body);

  console.log(`Anthropic request for model: ${anthropicBody.model}, web_search: ${options.web_search}, code_execution: ${options.code_execution}, url_context: ${options.url_context}`);

  try {
    const response = await fetch(`${ANTHROPIC_BASE_URL}/messages`, {
      method: 'POST',
      headers: getAnthropicHeaders(apiKey, options),
      body: JSON.stringify(anthropicBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Anthropic API Error:', errorText);
      return c.json({ error: `Anthropic API Error: ${errorText}` }, response.status);
    }

    // Handle non-streaming response
    if (!anthropicBody.stream) {
      const result = await response.json();
      
      // Convert to OpenAI format
      const textContent = result.content
        ?.filter(c => c.type === 'text')
        .map(c => c.text)
        .join('') || '';

      const toolCalls = result.content
        ?.filter(c => c.type === 'tool_use')
        .map(tc => ({
          id: tc.id,
          type: 'function',
          function: {
            name: tc.name,
            arguments: JSON.stringify(tc.input || {})
          }
        })) || [];

      return c.json({
        id: result.id,
        object: 'chat.completion',
        model: result.model,
        choices: [{
          index: 0,
          message: {
            role: 'assistant',
            content: textContent,
            ...(toolCalls.length > 0 && { tool_calls: toolCalls })
          },
          finish_reason: result.stop_reason === 'end_turn' ? 'stop' : result.stop_reason
        }],
        usage: {
          prompt_tokens: result.usage?.input_tokens,
          completion_tokens: result.usage?.output_tokens,
          total_tokens: (result.usage?.input_tokens || 0) + (result.usage?.output_tokens || 0)
        }
      });
    }

    // Transform stream to OpenAI-compatible format
    const encoder = new TextEncoder();
    const transformedStream = response.body.pipeThrough(createAnthropicStreamTransformer(encoder));

    return new Response(transformedStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      }
    });

  } catch (error) {
    console.error('Anthropic handler error:', error);
    return c.json({ error: error.message }, 500);
  }
}

/**
 * Count tokens using Anthropic's token counting endpoint
 */
export async function countTokens(messages, model, apiKey) {
  try {
    const targetModel = resolveModel('anthropic', model);
    const response = await fetch(`${ANTHROPIC_BASE_URL}/messages/count_tokens`, {
      method: 'POST',
      headers: getAnthropicHeaders(apiKey),
      body: JSON.stringify({
        model: targetModel,
        messages: messages.map(m => ({
          role: m.role,
          content: typeof m.content === 'string' ? m.content : m.content
        }))
      })
    });

    if (response.ok) {
      return await response.json();
    }
  } catch (e) {
    console.error('Token counting failed:', e);
  }
  return null;
}
