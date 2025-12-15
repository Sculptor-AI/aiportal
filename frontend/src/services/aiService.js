import { fetchEventSource } from '@microsoft/fetch-event-source'; // Use a robust SSE client library
import axios from 'axios';

// All models now go through backend API - no direct API keys needed

// All models now go through backend API - no direct API configurations needed

// Helper function to parse SSE data chunks
// This needs to handle different formats potentially sent by APIs
const parseSSEChunk = (chunk) => {
  if (chunk.startsWith('data:')) {
    const jsonString = chunk.substring(5).trim();
    if (jsonString === '[DONE]') {
      return { done: true };
    }
    try {
      return { data: JSON.parse(jsonString) };
    } catch (e) {
      console.error("Failed to parse SSE JSON:", jsonString, e);
      return { error: "Failed to parse stream data" };
    }
  }
  return {}; // Ignore non-data lines like comments or empty lines
};

// All models are now backend models
const isBackendModel = (modelId, availableModels = []) => {
  return true; // All models go through backend
};

// New backend streaming function
export async function* sendMessageToBackendStream(message, modelId, history, imageData = null, fileTextContent = null, search = false, codeExecution = false, imageGen = false, systemPrompt = null) {
  // Get user's assigned backend API key from session
  let apiKey = null;
  let user = null;
  let isLoggedIn = false;
  
  try {
    const userJSON = sessionStorage.getItem('ai_portal_current_user');
    if (userJSON) {
      user = JSON.parse(userJSON);
      isLoggedIn = true;
      console.log('[aiService] User found in session:', user.username);
      
      // User's assigned backend API key should be stored as their accessToken
      if (user.accessToken && user.accessToken.startsWith('ak_')) {
        apiKey = user.accessToken;
        console.log('[aiService] Using user API key');
      } else if (user.accessToken) {
        // Use JWT token if available
        apiKey = user.accessToken;
        console.log('[aiService] Using user JWT token');
      }
    } else {
      console.log('[aiService] No user session found');
    }
  } catch (e) {
    console.error('Error getting user session:', e);
  }

  // Fallback API key for development/testing - but warn about it
  if (!apiKey) {
    console.warn('[aiService] No user authentication found, using fallback API key');
    apiKey = 'ak_2156e9306161e1c00b64688d4736bf00aecddd486f2a838c44a6e40144b52c19';
  }

  if (!apiKey) {
    throw new Error('Backend API key is required. Please log in to use AI features.');
  }

  try {
    // Validate and filter history messages
    const validHistory = (history || []).filter(msg => {
      // Filter out system messages as Claude API expects them as top-level parameter
      return msg && msg.role && msg.role !== 'system' && msg.content && typeof msg.content === 'string';
    }).map(msg => ({
      role: msg.role,
      content: msg.content
    }));

    // Prepare messages array
    let messages = [...validHistory];

    // Prepare user message content
    let userContent = message || '';
    
    // Add file content if provided
    if (fileTextContent) {
      userContent = `File Content:\n---\n${fileTextContent}\n---\n\nUser Message:\n${userContent}`;
    }

    // Handle image data
    if (imageData) {
      const base64Data = imageData.split(',')[1];
      const mediaType = imageData.match(/data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+).*,.*/)?.[1] || 'image/jpeg';
      
      messages.push({
        role: 'user',
        content: [
          { type: 'text', text: userContent },
          {
            type: 'image_url',
            image_url: {
              url: imageData
            }
          }
        ]
      });
    } else {
      messages.push({
        role: 'user',
        content: userContent
      });
    }

    // Add file content if provided
    if (fileTextContent) {
      const lastMessage = messages[messages.length - 1];
      const currentContent = typeof lastMessage.content === 'string' ? lastMessage.content : lastMessage.content[0]?.text || '';
      const enhancedContent = `File Content:\n---\n${fileTextContent}\n---\n\nUser Message:\n${currentContent}`;
      
      if (typeof lastMessage.content === 'string') {
        lastMessage.content = enhancedContent;
      } else if (Array.isArray(lastMessage.content)) {
        lastMessage.content[0].text = enhancedContent;
      }
    }

    // Prepare request payload
    const requestPayload = {
      model: modelId,
      messages: messages,
      stream: true
    };

    // Add system prompt as top-level parameter if provided
    if (systemPrompt) {
      requestPayload.system = systemPrompt;
      console.log('[aiService] Sending system prompt to backend:', systemPrompt.substring(0, 100) + '...');
    }

    // Add web search if requested
    if (search) {
      requestPayload.web_search = true;
    }

    // Add code execution if requested (Gemini only - backend will validate)
    if (codeExecution) {
      requestPayload.code_execution = true;
    }

    // Log the model and system prompt for debugging custom models
    if (systemPrompt) {
      console.log('[sendMessageToBackendStream] Using custom model with system prompt');
    }

    // Prepare headers based on token type
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'text/event-stream'
    };
    
    // Use appropriate auth header based on token type
    if (apiKey.startsWith('ak_')) {
      headers['X-API-Key'] = apiKey;
    } else {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }

    const url = buildApiUrl('/v1/chat/completions');

    // Use fetch with streaming
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestPayload)
    });

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch (e) {
        errorData = { error: { message: `HTTP ${response.status}: ${response.statusText}` } };
      }
      
      // Provide specific error messages for common issues
      let errorMessage = errorData.error?.message || 'Backend request failed';
      if (response.status === 401 && modelId.includes('gemini')) {
        errorMessage = 'Google API authentication failed on the backend. The Gemini models are currently unavailable.';
      } else if (response.status === 401) {
        errorMessage = 'API authentication failed. This model may not be properly configured on the backend.';
      }
      
      throw new Error(errorMessage);
    }

    // Get the reader from the response body stream
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let sourcesReceived = false;
    let hasReceivedContent = false;
    let fullContent = ''; // Track full content for link parsing
    let collectedSources = []; // Collect sources to send at the end

    // Process the stream
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        // If we collected sources, yield them at the end
        if (collectedSources.length > 0 && !sourcesReceived) {
          yield { type: 'sources', sources: collectedSources };
        }
        
        break;
      }

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.trim() === '') continue;
        
        if (line.startsWith('data: ')) {
          const data = line.substring(6).trim();
          
          if (data === '[DONE]') {
            // If we collected sources, yield them before ending
            if (collectedSources.length > 0 && !sourcesReceived) {
              yield { type: 'sources', sources: collectedSources };
            }
            
            return;
          }
          
          try {
            const parsed = JSON.parse(data);
            
            // Handle sources for web search (old format)
            if (parsed.type === 'sources' && parsed.sources) {
              sourcesReceived = true;
              
              // Yield sources as a special object
              yield { type: 'sources', sources: parsed.sources };
              continue;
            }
            
            // Handle tool call events
            if (parsed.type === 'tool_call_start') {
              yield { type: 'tool_event', tool_data: parsed };
              continue;
            }
            
            if (parsed.type === 'tool_call_completed') {
              yield { type: 'tool_event', tool_data: parsed };
              continue;
            }
            
            if (parsed.type === 'tool_call_error') {
              yield { type: 'tool_event', tool_data: parsed };
              continue;
            }
            
            // Handle tool calls summary
            if (parsed.type === 'tool_calls_summary') {
              yield { type: 'tool_calls_summary', summary: parsed };
              continue;
            }
            
            // Handle tools available event
            if (parsed.type === 'tools_available') {
              yield { type: 'tools_available', tools: parsed.tools };
              continue;
            }
            
            // Handle tool system errors
            if (parsed.type === 'tool_system_error') {
              yield { type: 'tool_system_error', error: parsed.error };
              continue;
            }
            
            // Handle code execution events (from Gemini)
            if (parsed.type === 'code_execution') {
              yield { 
                type: 'code_execution', 
                language: parsed.language,
                code: parsed.code 
              };
              continue;
            }
            
            if (parsed.type === 'code_execution_result') {
              yield { 
                type: 'code_execution_result', 
                outcome: parsed.outcome,
                output: parsed.output 
              };
              continue;
            }
            
            // Handle content chunks
            if (parsed.choices?.[0]?.delta?.content) {
              hasReceivedContent = true;
              const chunk = parsed.choices[0].delta.content;
              
              // Check if this entire chunk is just the links section
              // According to docs, links come as a single chunk at the end
              if (chunk.trim().startsWith('<links>') && chunk.trim().endsWith('</links>')) {
                // Parse and format the links
                const { parseLinksFromResponse } = await import('../utils/sourceExtractor.js');
                const { sources } = parseLinksFromResponse(chunk);
                
                if (sources.length > 0) {
                  sourcesReceived = true;
                  collectedSources = sources;
                  // Don't yield the links as content - they'll be sent as sources at the end
                }
              } else {
                // Normal content chunk - yield it
                fullContent += chunk;
                yield chunk; // Yield just the content chunk
              }
            } else if (parsed.error) {
              // Handle error in the stream
              console.error('[sendMessageToBackendStream] Error in stream:', parsed.error);
              throw new Error(parsed.error.message || parsed.error);
            } else if (parsed.choices?.[0]?.finish_reason === 'error') {
              // Handle finish reason error
              console.error('[sendMessageToBackendStream] Finish reason error');
              throw new Error('Model returned an error finish reason');
            }
          } catch (e) {
            console.error('Failed to parse SSE chunk:', e, 'Raw data:', data);
          }
        }
      }
    }

    // Process any remaining buffer
    if (buffer.trim()) {
      const lines = buffer.split('\n');
      for (const line of lines) {
        if (line.startsWith('data: ') && line.length > 6) {
          const data = line.substring(6).trim();
          if (data !== '[DONE]') {
            try {
              const parsed = JSON.parse(data);
              if (parsed.choices?.[0]?.delta?.content) {
                yield parsed.choices[0].delta.content;
              }
            } catch (e) {
              console.error('Failed to parse final SSE chunk:', e);
            }
          }
        }
      }
    }
    
    // If no content was received, log a warning
    if (!hasReceivedContent) {
      console.warn('[sendMessageToBackendStream] No content received from backend');
    }

  } catch (error) {
    console.error('Backend streaming error:', error);
    
    // If it's a certificate/CORS issue, provide helpful guidance
    if (error.message.includes('Failed to fetch') || error.message.includes('fetch')) {
      yield `\n🔒 **Backend Connection Issue**\n\nYour backend server is running on HTTPS with a self-signed certificate.\n\n**To fix this:**\n1. Open [${rawBaseUrl}](${rawBaseUrl}) in a new browser tab\n2. Accept the security warning/certificate\n3. Return here and try again\n\nThis only needs to be done once per browser session.\n`;
    } else {
      yield `\n[Error: ${error.message}]\n`;
    }
  }
}

// Updated main sendMessage function that routes everything to backend
export async function* sendMessage(message, modelId, history, imageData = null, fileTextContent = null, search = false, codeExecution = false, imageGen = false, systemPrompt = null) { 
  console.log(`sendMessage (streaming) called with model: ${modelId}, message: "${message.substring(0, 30)}..."`, 
    `history length: ${history?.length || 0}`, 
    imageData ? `imageData: Present` : '',
    fileTextContent ? `fileTextContent: Present` : '',
    `search: ${search}`,
    `codeExecution: ${codeExecution}`,
    `imageGen: ${imageGen}`,
    systemPrompt ? `systemPrompt: Present` : ''
  );

  // All models now route to backend (backend acts as unified gateway)
  console.log(`Routing to backend for model: ${modelId}`);
  yield* sendMessageToBackendStream(message, modelId, history, imageData, fileTextContent, search, codeExecution, imageGen, systemPrompt);
}

// Legacy code removed - all models now go through backend API

// Prefer environment variable, otherwise check if we're in dev mode
// In dev mode (Vite dev server), use empty string to leverage Vite's proxy
// In production, default to the production backend API
const isDev = import.meta.env.DEV;
const rawBaseUrl = import.meta.env.VITE_BACKEND_API_URL || '';

// Remove trailing slashes
let cleanedBase = rawBaseUrl.replace(/\/+$/, '');

// Remove a trailing /api if present
if (cleanedBase.endsWith('/api')) {
  cleanedBase = cleanedBase.slice(0, -4);
}

const BACKEND_API_BASE = `${cleanedBase}/api`;

console.log('[aiService] Computed BACKEND_API_BASE:', BACKEND_API_BASE);

// Remove duplicated /api in endpoint paths
const buildApiUrl = (endpoint) => {
  if (!endpoint) return BACKEND_API_BASE;

  // Normalize endpoint to remove a leading slash if it exists
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint.substring(1) : endpoint;

  // Prevent double "api" segment
  if (normalizedEndpoint.startsWith('api/')) {
    return `${BACKEND_API_BASE}/${normalizedEndpoint.substring(4)}`;
  }

  return `${BACKEND_API_BASE}/${normalizedEndpoint}`;
};

/**
 * Fetch available models from the backend
 * @returns {Promise<Array>} Array of model objects
 */
export const fetchModelsFromBackend = async () => {
  try {
    // Get user's assigned backend API key from session
    let apiKey = null;
    let user = null;
    try {
      const userJSON = sessionStorage.getItem('ai_portal_current_user');
      if (userJSON) {
        user = JSON.parse(userJSON);
        // User's assigned backend API key should be stored as their accessToken
        if (user.accessToken && user.accessToken.startsWith('ak_')) {
          apiKey = user.accessToken;
        }
      }
    } catch (e) {
      console.error('Error getting user session:', e);
    }

    // Fallback API key for development/testing
    if (!apiKey) {
      apiKey = 'ak_2156e9306161e1c00b64688d4736bf00aecddd486f2a838c44a6e40144b52c19';
    }

    // if (!apiKey) {
    //   console.log('No backend API key available, skipping backend models');
    //   return [];
    // }

    // Use the main models endpoint that returns all available models
    const endpointUrl = buildApiUrl('/models');
    console.log('Fetching models from:', endpointUrl);
    
    try {
      // This endpoint requires authentication, so only try if user is logged in
      let response;
      if (user && user.accessToken) {
        const headers = {};
        
        // Check if the access token is an API key (starts with ak_) or a JWT token
        if (user.accessToken.startsWith('ak_')) {
          // Use API key authentication
          headers['X-API-Key'] = user.accessToken;
        } else {
          // Use JWT Bearer authentication
          headers['Authorization'] = `Bearer ${user.accessToken}`;
        }
        
        response = await fetch(endpointUrl, { headers });
      } else {
        // If no user is logged in, use the fallback API key
        console.log('No user authentication available, using fallback API key');
        const headers = { 'X-API-Key': apiKey };
        response = await fetch(endpointUrl, { headers });
      }
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('Error response from models endpoint:', errorData);
        throw new Error(errorData.error || 'Failed to fetch models from backend');
      }
      
      const data = await response.json();
      console.log('Successfully fetched models from backend:', data);
      
      // Handle the main models endpoint response format
      if (Array.isArray(data.models)) {
        return data.models.map(model => ({
          id: model.id,
          name: model.name || model.id.split('/').pop(),
          provider: model.provider,
          description: model.description,
          capabilities: model.capabilities || [],
          isBackendModel: true,
          source: model.source,
          context_length: model.context_length,
          pricing: model.pricing
        }));
      }
      
      // Fallback for OpenAI-compatible response format (if needed)
      if (data.object === 'list' && Array.isArray(data.data)) {
        return data.data.map(model => ({
          id: model.id,
          name: model.name || model.id.split('/').pop(),
          provider: model.owned_by,
          description: model.description,
          capabilities: model.capabilities || [],
          isBackendModel: true
        }));
      }
      
      return [];
    } catch (fetchError) {
      console.error('Network error fetching models:', fetchError);
      
      // If it's a certificate/CORS issue, show helpful message
      if (fetchError.message.includes('Failed to fetch')) {
        console.warn(`
🔒 Backend Connection Issue:
Your backend server is running on HTTPS with a self-signed certificate.
To fix this:
1. Open ${rawBaseUrl} in a new browser tab
2. Accept the security warning/certificate
3. Refresh this page

This only needs to be done once per browser session.
        `);
      }
      
      return []; // Return empty array on network error
    }    
  } catch (error) {
    console.error('Error fetching models from backend:', error);
    return []; // Return empty array on error
  }
};

// Helper function to get current user (import from authService)
const getCurrentUser = () => {
  const userJSON = sessionStorage.getItem('ai_portal_current_user');
  return userJSON ? JSON.parse(userJSON) : null;
};

/**
 * Send a message to the backend
 * @param {string} modelId - The model ID to use
 * @param {string} message - The message content
 * @param {boolean} search - Whether to use search feature
 * @param {boolean} codeExecution - Whether to use code execution (Gemini only)
 * @param {boolean} imageGen - Whether to generate images
 * @param {string} imageData - Optional base64 image data
 * @param {string} fileTextContent - Optional text content from PDF or text file
 * @param {string} systemPrompt - Optional system prompt for thinking mode
 * @param {string} mode - Optional mode for the request
 * @returns {Promise<Object>} The response
 */
export const sendMessageToBackend = async (modelId, message, search = false, codeExecution = false, imageGen = false, imageData = null, fileTextContent = null, systemPrompt = null, mode = null, conversationHistory = []) => {
  const chunks = [];
  try {
    for await (const chunk of sendMessageToBackendStream(message, modelId, conversationHistory, imageData, fileTextContent, search, codeExecution, imageGen, systemPrompt)) {
      chunks.push(chunk);
    }
    return { response: chunks.join('') };
  } catch (error) {
    throw error;
  }
};

// Generate chat title function
export const generateChatTitle = async (userPrompt, assistantResponse) => {
  // Get user's assigned backend API key from session
  let apiKey = null;
  try {
    const userJSON = sessionStorage.getItem('ai_portal_current_user');
    if (userJSON) {
      const user = JSON.parse(userJSON);
      // User's assigned backend API key should be stored as their accessToken
      if (user.accessToken && user.accessToken.startsWith('ak_')) {
        apiKey = user.accessToken;
      }
    }
  } catch (e) {
    console.error('Error getting user session:', e);
  }

  // Fallback API key for development/testing
  if (!apiKey) {
    apiKey = 'ak_2156e9306161e1c00b64688d4736bf00aecddd486f2a838c44a6e40144b52c19';
  }

  if (!apiKey) {
    console.log('Skipping chat title generation - no backend API key');
    return null;
  }
  
  const titlePrompt = `Summarize the following conversation in 3-4 words for a chat title.\n` +
    `USER: ${userPrompt}\nASSISTANT: ${assistantResponse}\nTitle:`;
  try {
    const result = await sendMessageToBackend(
      'gemini-2.5-flash', // Use available model from config
      titlePrompt
    );
    if (result && result.response) {
      // Clean up the response - remove quotes, extra whitespace, and limit length
      let title = result.response.trim()
        .replace(/^["']|["']$/g, '')  // Remove surrounding quotes
        .replace(/\n/g, ' ')           // Replace newlines with spaces
        .trim();

      // Limit to reasonable length for a title
      if (title.length > 50) {
        title = title.substring(0, 47) + '...';
      }

      return title;
    }
  } catch (err) {
    console.error('Error generating chat title:', err);
  }
  return null;
};

// Alias for backward compatibility
export const streamMessageFromBackend = sendMessageToBackendStream;
