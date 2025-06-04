import { fetchEventSource } from '@microsoft/fetch-event-source'; // Use a robust SSE client library
import axios from 'axios';

// Get API keys from environment variables (fallback)
const GEMINI_API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;
const CLAUDE_API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY;
const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;
const NVIDIA_API_KEY = import.meta.env.VITE_NVIDIA_API_KEY;

// Add debug logging to check what we're receiving from environment
console.log("Loaded API keys from environment:", {
  gemini: GEMINI_API_KEY ? "Present (value hidden)" : "Missing",
  claude: CLAUDE_API_KEY ? "Present (value hidden)" : "Missing",
  openai: OPENAI_API_KEY ? "Present (value hidden)" : "Missing",
  nvidia: NVIDIA_API_KEY ? "Present (value hidden)" : "Missing"
});

// Map updated model IDs to their respective API endpoints and formats
const MODEL_CONFIGS = {
  'gemini-2-flash': {
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent',
    prepareRequest: (message, history, imageData, fileTextContent = null) => { 
      const formattedMessages = history.map(msg => {
        if (msg.image) {
          const base64Data = msg.image.split(',')[1];
          const mimeType = 'image/jpeg';
          return {
            role: msg.role === 'user' ? 'user' : 'model',
            parts: [
              { text: msg.content },
              { inline_data: { mime_type: mimeType, data: base64Data } }
            ]
          };
        } else {
          return {
            role: msg.role === 'user' ? 'user' : 'model',
            parts: [{ text: msg.content }]
          };
        }
      });
      
      // Prepend file text content if available
      let currentMessageText = message;
      if (fileTextContent) {
        currentMessageText = `File Content:\n---\n${fileTextContent}\n---\n\nUser Message:\n${message}`;
      }
      
      // Construct parts using potentially modified text
      let currentMessageParts = [{ text: currentMessageText }]; 
      if (imageData) {
        currentMessageParts.push({
          inline_data: {
            mime_type: imageData.match(/data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+).*,.*/)?.[1] || 'image/jpeg', 
            data: imageData.split(',')[1] 
          }
        });
      }
      
      const currentMessage = {
        role: 'user',
        parts: currentMessageParts
      };
      
      return {
        contents: [
          ...formattedMessages,
          currentMessage
        ]
      };
    }
  },

  'gemini-2.5-pro': {
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro-latest:generateContent',
    prepareRequest: (message, history, imageData, fileTextContent = null) => { 
      const formattedMessages = history.map(msg => {
        if (msg.image) {
          const base64Data = msg.image.split(',')[1];
          const mimeType = 'image/jpeg';
          return {
            role: msg.role === 'user' ? 'user' : 'model',
            parts: [
              { text: msg.content },
              { inline_data: { mime_type: mimeType, data: base64Data } }
            ]
          };
        } else {
          return {
            role: msg.role === 'user' ? 'user' : 'model',
            parts: [{ text: msg.content }]
          };
        }
      });
      
      // Prepend file text content if available
      let currentMessageText = message;
      if (fileTextContent) {
        currentMessageText = `File Content:\n---\n${fileTextContent}\n---\n\nUser Message:\n${message}`;
      }
      
      // Construct parts using potentially modified text
      let currentMessageParts = [{ text: currentMessageText }]; 
      if (imageData) {
        currentMessageParts.push({
          inline_data: {
            mime_type: imageData.match(/data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+).*,.*/)?.[1] || 'image/jpeg', 
            data: imageData.split(',')[1] 
          }
        });
      }
      
      const currentMessage = {
        role: 'user',
        parts: currentMessageParts
      };
      
      return {
        contents: [
          ...formattedMessages,
          currentMessage
        ]
      };
    }
  },

  'claude-3.7-sonnet': {
    baseUrl: 'https://api.anthropic.com/v1/messages',
    prepareRequest: (message, history, imageData, fileTextContent = null) => { 
      const messages = history.map(msg => {
        if (msg.image) { 
          return {
            role: msg.role,
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: 'image/jpeg',
                  data: msg.image.split(',')[1]
                }
              },
              { type: 'text', text: msg.content }
            ]
          };
        } else {
          return {
            role: msg.role,
            content: msg.content
          };
        }
      });

      // Prepend file text content if available
      let currentMessageText = message;
      if (fileTextContent) {
        currentMessageText = `File Content:\n---\n${fileTextContent}\n---\n\nUser Message:\n${message}`;
      }

      // Construct content using potentially modified text
      let currentMessageContent = [];
      if (imageData) {
        currentMessageContent = [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: imageData.match(/data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+).*,.*/)?.[1] || 'image/jpeg', 
              data: imageData.split(',')[1]
            }
          },
          { type: 'text', text: currentMessageText } // Use potentially modified text
        ];
      } else {
        currentMessageContent = [{ type: 'text', text: currentMessageText }]; // Use potentially modified text
      }
      
      messages.push({ role: 'user', content: currentMessageContent });

      return {
        model: 'claude-3-sonnet-20240229',
        max_tokens: 4000,
        messages: messages
      };
    }
  },

  'chatgpt-4o': {
    baseUrl: 'https://api.openai.com/v1/chat/completions',
    prepareRequest: (message, history, imageData, fileTextContent = null) => {
      const formattedMessages = history.map(msg => {
        if (msg.image) {
          return {
            role: msg.role,
            content: [
              {
                type: 'text',
                text: msg.content
              },
              {
                type: 'image_url',
                image_url: {
                  url: msg.image,
                  detail: 'auto'
                }
              }
            ]
          };
        } else {
          return {
            role: msg.role,
            content: msg.content
          };
        }
      });
      
      // Prepend file text content if available
      let currentMessageText = message;
      if (fileTextContent) {
        currentMessageText = `File Content:\n---\n${fileTextContent}\n---\n\nUser Message:\n${message}`;
      }

      // Construct content using potentially modified text
      let currentMessageContent = [];
      if (imageData) {
         currentMessageContent = [
           { type: 'text', text: currentMessageText }, // Use potentially modified text
           { type: 'image_url', image_url: { url: imageData, detail: 'auto' } }
         ];
      } else {
         currentMessageContent = currentMessageText; // Use potentially modified text (OpenAI accepts string directly)
      }
      
      const currentMessage = {
        role: 'user',
        content: currentMessageContent
      };
      
      return {
        model: 'gpt-4o',
        messages: [
          ...formattedMessages,
          currentMessage
        ]
      };
    }
  },
  
  'custom-gguf': {
    baseUrl: '',
    prepareRequest: (message, history, imageData, fileTextContent = null) => { 
      let messageText = message;
      // Prepend file text content if available
      if (fileTextContent) {
        messageText = `File Content:\n---\n${fileTextContent}\n---\n\nUser Message:\n${message}`;
      }
      // Note about image is separate
      if (imageData) {
        // Prepend image note AFTER potential file content
        messageText = `[Note: Image was uploaded with this message]\n\n${messageText}`;
      }
      
      const processedHistory = history.map(msg => {
        let originalContent = msg.content; 
        let processedContent = originalContent; 
        if (msg.image) { 
          processedContent = `[Note: Previous message included an image]\n\n${originalContent}`;
        } 
        return {
          role: msg.role,
          content: processedContent 
        };
      });

      return {
        messages: [
          ...processedHistory, 
          { role: 'user', content: messageText } // Use potentially modified message text
        ],
        max_tokens: 1024,
        temperature: 0.7,
        top_p: 0.95
      };
    }
  },

  'nemotron-super-49b': {
    baseUrl: 'https://integrate.api.nvidia.com/v1/chat/completions',
    prepareRequest: (message, history, imageData, fileTextContent = null) => { 
      const formattedMessages = history.map(msg => {
        if (msg.image) { 
          return {
            role: msg.role,
            content: [
              {
                type: 'text',
                text: msg.content
              },
              {
                type: 'image_url',
                image_url: {
                  url: msg.image,
                  detail: 'auto'
                }
              }
            ]
          };
        } else {
          return {
            role: msg.role,
            content: msg.content
          };
        }
      });
      
      // Prepend file text content if available
      let currentMessageText = message;
      if (fileTextContent) {
        currentMessageText = `File Content:\n---\n${fileTextContent}\n---\n\nUser Message:\n${message}`;
      }

      // Construct content using potentially modified text
      let currentMessageContent = [];
      if (imageData) {
         currentMessageContent = [
           { type: 'text', text: currentMessageText }, // Use potentially modified text
           { type: 'image_url', image_url: { url: imageData, detail: 'auto' } } // Nvidia uses image_url like OpenAI
         ];
      } else {
         currentMessageContent = currentMessageText; // Use potentially modified text (Nvidia likely accepts string directly)
      }

      const currentMessage = {
        role: 'user',
        content: currentMessageContent
      };
      
      return {
        model: "nvidia/llama-3.3-nemotron-super-49b-v1",
        messages: [
          { role: "system", content: "detailed thinking off" },
          ...formattedMessages,
          currentMessage
        ],
        temperature: 0.6,
        top_p: 0.95,
        max_tokens: 4096,
        frequency_penalty: 0,
        presence_penalty: 0
      };
    }
  },
  // Add Ursa Minor config if it differs from custom-gguf, otherwise it uses custom-gguf logic
  'ursa-minor': {
      baseUrl: '', // Base URL handled dynamically like custom-gguf
      prepareRequest: (message, history, imageData, fileTextContent = null) => { 
          // Share the same preparation logic as custom-gguf or define specific logic
          let messageText = message;
          if (fileTextContent) {
              messageText = `File Content:\n---\n${fileTextContent}\n---\n\nUser Message:\n${message}`;
          }
          if (imageData) {
              messageText = `[Note: Image was uploaded with this message]\n\n${messageText}`;
          }
          const processedHistory = history.map(msg => ({
              role: msg.role,
              content: msg.image ? `[Note: Previous message included an image]\n\n${msg.content}` : msg.content
          }));
          return {
              messages: [...processedHistory, { role: 'user', content: messageText }],
              // Example parameters, adjust if needed for Ursa Minor
              max_tokens: 1024, 
              temperature: 0.7,
          };
      },
  }
};

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

// Refactored sendMessage as an async generator
export async function* sendMessage(message, modelId, history, imageData = null, fileTextContent = null, search = false, deepResearch = false, imageGen = false, systemPrompt = null) { 
  console.log(`sendMessage (streaming) called with model: ${modelId}, message: "${message.substring(0, 30)}..."`, 
    `history length: ${history?.length || 0}`, 
    imageData ? `imageData: Present` : '',
    fileTextContent ? `fileTextContent: Present` : '',
    `search: ${search}`,
    `deepResearch: ${deepResearch}`,
    `imageGen: ${imageGen}`,
    systemPrompt ? `systemPrompt: Present` : ''
  );

  // Validate inputs
  if (!message && !imageData && !fileTextContent) { // Allow empty text message if file/image provided
      console.error("Missing message, image, or file content.");
      throw new Error("No content provided to send.");
  }
  if (!modelId) {
    console.error("Missing required parameter: modelId");
    throw new Error("Missing required parameter: modelId");
  }
  
  // Get model config
  const modelConfig = MODEL_CONFIGS[modelId];
  if (!modelConfig) {
    console.error(`Unsupported model: ${modelId}`);
    throw new Error(`Unsupported model: ${modelId}`);
  }

  // --- Start API Key Retrieval --- 
  let userSettings = {};
  let settingsSource = 'none'; 
  try {
    const userJSON = sessionStorage.getItem('ai_portal_current_user');
    if (userJSON) {
      const user = JSON.parse(userJSON);
      userSettings = user.settings || {};
      settingsSource = 'sessionStorage';
    } else {
      const settingsJSON = localStorage.getItem('settings');
      if (settingsJSON) {
        userSettings = JSON.parse(settingsJSON);
        settingsSource = 'localStorage';
      }
    }
  } catch (e) {
    console.error('Error getting user settings:', e);
    settingsSource = 'error';
  }
  
  console.log(`[sendMessage] Retrieved user settings from ${settingsSource}:`, userSettings);

  const apiKeys = {
    openai: userSettings.openaiApiKey || OPENAI_API_KEY,
    anthropic: userSettings.anthropicApiKey || CLAUDE_API_KEY,
    google: (userSettings.googleApiKey && userSettings.googleApiKey.trim() !== '') ? userSettings.googleApiKey : GEMINI_API_KEY,
    nvidia: userSettings.nvidiaApiKey || NVIDIA_API_KEY,
    customGguf: userSettings.customGgufApiKey || '',
    customGgufUrl: userSettings?.customGgufApiUrl || 'http://localhost:8000' 
  };
  
  console.log("[sendMessage] API keys being used:", {
      openai: apiKeys.openai ? 'Present' : 'Missing',
      anthropic: apiKeys.anthropic ? 'Present' : 'Missing',
      google: apiKeys.google ? 'Present' : 'Missing',
      nvidia: apiKeys.nvidia ? 'Present' : 'Missing',
  });
  // --- End API Key Retrieval ---

  let apiKey;
  let url = modelConfig.baseUrl;
  let headers = { 'Content-Type': 'application/json', 'Accept': 'text/event-stream' }; 
  
  // Prepare model-specific details
  if (modelId.startsWith('gemini')) {
    apiKey = apiKeys.google;
    if (!apiKey) throw new Error('Google API Key is missing.');
    url = url.replace(':generateContent', ':streamGenerateContent') + `?key=${apiKey}&alt=sse`; 
    headers = { 'Content-Type': 'application/json' }; // Reset headers for Gemini SSE
  } else if (modelId.startsWith('claude')) {
    apiKey = apiKeys.anthropic;
    if (!apiKey) throw new Error('Anthropic API Key is missing.');
    headers['x-api-key'] = apiKey;
    headers['anthropic-version'] = '2023-06-01';
    // headers['anthropic-beta'] = 'messages-streaming-2024-07-15'; // Usually not needed now
  } else if (modelId.startsWith('chatgpt')) {
    apiKey = apiKeys.openai;
    if (!apiKey) throw new Error('OpenAI API Key is missing.');
    headers['Authorization'] = `Bearer ${apiKey}`;
  } else if (modelId.startsWith('nemotron')) {
     apiKey = apiKeys.nvidia;
     if (!apiKey) throw new Error('NVIDIA API Key is missing.');
     headers['Authorization'] = `Bearer ${apiKey}`;
  } else if (modelId === 'ursa-minor' || modelId === 'custom-gguf') {
     url = apiKeys.customGgufUrl;
     if (!url) throw new Error("Custom GGUF/Ursa Minor API URL is not configured.");
     // Ensure the URL points to the correct streaming endpoint if different from non-streaming
     // Assuming OpenAI compatible /v1/chat/completions endpoint supports streaming
     url = url.endsWith('/') ? `${url}v1/chat/completions` : `${url}/v1/chat/completions`; 
     if (apiKeys.customGguf) {
       headers['Authorization'] = `Bearer ${apiKeys.customGguf}`;
     }
     console.log(`Using Custom/Local API at ${url}`);
  } else {
     throw new Error(`API Key or configuration missing for model: ${modelId}`);
  }

  // Prepare payload - ensure stream: true is set for models that need it
  const basePayload = modelConfig.prepareRequest(message || "", history, imageData, fileTextContent);
  const requestPayload = {
     ...basePayload,
     // Only add stream: true for non-Gemini models
     ...(modelId.startsWith('gemini') ? {} : { stream: true })
  };
  
  // Add system prompt if provided
  if (systemPrompt) {
    // Add system message based on model type
    if (modelId.startsWith('gemini')) {
      // For Gemini models
      if (requestPayload.contents && Array.isArray(requestPayload.contents)) {
        requestPayload.contents.unshift({
          role: 'user',
          parts: [{ text: `System: ${systemPrompt}` }]
        });
        console.log("Added system prompt to Gemini model as user message");
      }
    } else if (modelId.startsWith('claude')) {
      // For Claude models
      if (requestPayload.messages && Array.isArray(requestPayload.messages)) {
        requestPayload.messages.unshift({
          role: 'system',
          content: systemPrompt
        });
        console.log("Added system prompt to Claude model as system message");
      }
    } else if (modelId.startsWith('chatgpt')) {
      // For ChatGPT models
      if (requestPayload.messages && Array.isArray(requestPayload.messages)) {
        requestPayload.messages.unshift({
          role: 'system',
          content: systemPrompt
        });
        console.log("Added system prompt to ChatGPT model as system message");
      }
    }
    console.log(`System prompt first 50 chars: ${systemPrompt.substring(0, 50)}...`);
  }
  
  console.log("Final Streaming Request URL:", url);
  console.log("Final Streaming Request Headers:", headers);
  console.log("Final Streaming Request Payload:", JSON.stringify(requestPayload, null, 2));

  // We need a way to communicate between the fetch callbacks and our generator
  // Create a simple message queue system
  const messageQueue = [];
  let resolveNextMessage = null;
  let streamError = null;
  let streamDone = false;

  // Function to add a message to the queue
  function enqueueMessage(message) {
    if (resolveNextMessage) {
      // If someone is waiting for a message, resolve their promise
      const resolve = resolveNextMessage;
      resolveNextMessage = null;
      resolve(message);
    } else {
      // Otherwise add to the queue
      messageQueue.push(message);
    }
  }

  // Function to get the next message from the queue
  function getNextMessage() {
    return new Promise((resolve, reject) => {
      if (streamError) {
        reject(streamError);
        return;
      }
      
      if (messageQueue.length > 0) {
        // If there's a message in the queue, return it
        resolve(messageQueue.shift());
      } else if (streamDone) {
        // If the stream is done and no messages left, signal completion
        resolve(null);
      } else {
        // Otherwise, wait for the next message
        resolveNextMessage = resolve;
      }
    });
  }

  try {
    const ctrl = new AbortController();

    // Start the fetch in the background
    const fetchPromise = fetchEventSource(url, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(requestPayload),
      signal: ctrl.signal,
      openWhenHidden: true,

      async onopen(response) {
        console.log("SSE Connection opened with status:", response.status);
        if (!response.ok) {
          // Try reading the error body for more details
          let errorBody = 'Unknown error';
          try {
            errorBody = await response.text();
          } catch (e) { /* Ignore reading error */ }
          
          const error = new Error(`Failed to connect: ${response.status} ${response.statusText}. Body: ${errorBody}`);
          streamError = error;
          ctrl.abort();
        }
      },

      onmessage(event) {
        if (event.event === 'ping' || !event.data) {
          return;
        }
        
        if (event.data === '[DONE]') {
          console.log("SSE stream finished [DONE]");
          streamDone = true;
          enqueueMessage(null); // Signal end of stream
          ctrl.abort();
          return;
        }
        
        try {
          const parsedData = JSON.parse(event.data);
          let textChunk = '';

          // Extract text chunk based on model type
          if (modelId.startsWith('gemini')) {
            textChunk = parsedData?.candidates?.[0]?.content?.parts?.[0]?.text || '';
          } else if (modelId.startsWith('claude')) {
            if (parsedData.type === 'content_block_delta' && parsedData.delta?.type === 'text_delta') {
              textChunk = parsedData.delta.text || '';
            }
            if (parsedData.type === 'message_stop') {
              console.log("Claude streaming complete");
              streamDone = true;
              enqueueMessage(null); // Signal end of stream
              ctrl.abort();
              return;
            }
          } else if (modelId.startsWith('chatgpt') || modelId === 'custom-gguf' || modelId === 'ursa-minor') {
            textChunk = parsedData?.choices?.[0]?.delta?.content || '';
            if (parsedData?.choices?.[0]?.finish_reason) {
              console.log("OpenAI/NVIDIA/Local finish reason:", parsedData.choices[0].finish_reason);
              streamDone = true;
              enqueueMessage(null); // Signal end of stream
              ctrl.abort();
              return;
            }
          }
          
          if (textChunk) {
            enqueueMessage(textChunk);
          }
        } catch (e) {
          console.error("Error parsing SSE data chunk:", event.data, e);
          // Don't abort immediately, maybe the next chunk is fine
          // FIX: Properly handle the error to terminate the stream processing
          streamError = e; // Signal error to the generator
          ctrl.abort();    // Stop the event source
          enqueueMessage(null); // Ensure any pending getNextMessage resolves to end the loop
        }
      },

      onclose() {
        console.log("SSE Connection closed.");
        // If we haven't already signaled completion
        if (!streamDone && !streamError) {
          streamDone = true;
          enqueueMessage(null); // Signal end of stream
        }
      },

      onerror(err) {
        console.error("SSE Error:", err);
        streamError = err;
        ctrl.abort();
      }
    });

    // Now use a loop to yield chunks as they come in
    while (true) {
      try {
        const chunk = await getNextMessage();
        
        if (chunk === null) {
          // End of stream
          break;
        }
        
        // We can safely yield here because we're in the generator function
        yield chunk;
      } catch (error) {
        console.error("Error in stream processing:", error);
        yield `\n[Error during streaming: ${error.message}]\n`;
        break;
      }
    }

  } catch (error) {
    console.error(`Error during streaming fetch for ${modelId}:`, error);
    yield `\n[Error communicating with ${modelId}: ${error.message}]\n`;
  }
}

// --- Keep or update MODEL_CONFIGS prepareRequest functions ---
// Ensure they DO NOT include stream: true, as it's added in sendMessage
// Remove extractResponse functions as they are not used for streaming

// Example modification for MODEL_CONFIGS['chatgpt-4o'].prepareRequest
/*
'chatgpt-4o': {
  baseUrl: 'https://api.openai.com/v1/chat/completions',
  prepareRequest: (message, history, imageData, fileTextContent = null) => {
    // ... (existing logic to format messages) ...
    
    const currentMessage = {
      role: 'user',
      content: currentMessageContent
    };
    
    return { // DO NOT add stream: true here
      model: 'gpt-4o',
      messages: [
        ...formattedMessages,
        currentMessage
      ]
    };
  },
  // extractResponse: REMOVED
},
*/

// TODO: 
// 1. Change `export const sendMessage = ...` to `export async function* sendMessage(...)`
// 2. Replace the temporary simulation block with `yield textChunk;` inside the `onmessage` handler where commented.
// 3. Remove `extractResponse` from all MODEL_CONFIGS.
// 4. Verify/update `prepareRequest` for all models to ensure they don't add `stream: true`.

// Add backend API base URL - ensure this matches your backend server address
const BACKEND_API_BASE = import.meta.env.VITE_BACKEND_API_URL ? 
  (import.meta.env.VITE_BACKEND_API_URL.endsWith('/api') ? 
    import.meta.env.VITE_BACKEND_API_URL : 
    `${import.meta.env.VITE_BACKEND_API_URL}/api`) : 
  'https://aiportal-backend.vercel.app/api';

// Debug the actual URL being used
console.log('Backend API URL being used:', BACKEND_API_BASE);

// Remove duplicated /api in endpoint paths
const buildApiUrl = (endpoint) => {
  if (!endpoint) return BACKEND_API_BASE;
  
  // If the endpoint already starts with /api, remove it to prevent duplication
  const cleanEndpoint = endpoint.startsWith('/api/') ? endpoint.substring(4) : 
                         (endpoint.startsWith('/api') ? endpoint.substring(4) : endpoint);
  
  // Ensure endpoint has a leading slash if it doesn't already
  const formattedEndpoint = cleanEndpoint.startsWith('/') ? cleanEndpoint : `/${cleanEndpoint}`;
  
  return `${BACKEND_API_BASE}${formattedEndpoint}`;
};

/**
 * Fetch available models from the backend
 * @returns {Promise<Array>} Array of model objects
 */
export const fetchModelsFromBackend = async () => {
  try {
    const endpointUrl = buildApiUrl('/models');
    console.log('Fetching models from:', endpointUrl);
    const response = await fetch(endpointUrl);
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Error response from models endpoint:', errorData);
      throw new Error(errorData.error || 'Failed to fetch models from backend');
    }
    
    const data = await response.json();
    console.log('Successfully fetched models from backend:', data);
    return data.models.map(model => ({
      id: model.id,
      name: model.name || `${model.provider}: ${model.id.split('/').pop()}`,
      provider: model.provider,
      capabilities: model.capabilities || [],
      isBackendModel: true  // Explicitly mark as backend model
    }));
  } catch (error) {
    console.error('Error fetching models from backend:', error);
    return []; // Return empty array on error
  }
};

/**
 * Send a message to the backend
 * @param {string} modelId - The model ID to use
 * @param {string} message - The message content
 * @param {boolean} search - Whether to use search feature
 * @param {boolean} deepResearch - Whether to use deep research
 * @param {boolean} imageGen - Whether to generate images
 * @param {string} imageData - Optional base64 image data
 * @param {string} fileTextContent - Optional text content from PDF or text file
 * @param {string} systemPrompt - Optional system prompt for thinking mode
 * @param {string} mode - Optional mode for the request
 * @returns {Promise<Object>} The response
 */
export const sendMessageToBackend = async (modelId, message, search = false, deepResearch = false, imageGen = false, imageData = null, fileTextContent = null, systemPrompt = null, mode = null) => {
  try {
    // Build the API endpoint URL based on the action requested
    let endpoint = '/chat';
    let body = {
      modelType: modelId,
      prompt: message,
      search: search,
      deepResearch: deepResearch,
      imageGen: imageGen,
      mode: mode
    };
    
    console.log("sendMessageToBackend called with:", { 
      modelId, 
      mode,
      messageLength: message?.length,
      hasImage: !!imageData,
      hasFileText: !!fileTextContent,
      hasSystemPrompt: !!systemPrompt,
      fileTextLength: fileTextContent?.length
    });
    
    // Add system prompt if provided
    if (systemPrompt) {
      body.systemPrompt = systemPrompt;
      console.log("Added system prompt to backend request");
      console.log(`System prompt first 50 chars: ${systemPrompt.substring(0, 50)}...`);
    }
    
    // Add image data if provided
    if (imageData) {
      // Extract the base64 data from the data URL by removing the prefix
      // Format is usually: data:image/jpeg;base64,/9j/4AAQSkZJRg...
      const base64Data = imageData.split(',')[1];
      const mediaType = imageData.match(/data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+).*,.*/)?.[1] || 'image/jpeg';
      
      body.imageData = {
        data: base64Data,
        mediaType: mediaType
      };
      console.log("Added image data to request");
    }
    
    // Add file text content if provided (for PDF or TXT files)
    if (fileTextContent) {
      body.fileTextContent = fileTextContent;
      console.log(`Added ${fileTextContent.length} characters of file text to request`);
    }
    
    // For image generation, use a different endpoint
    if (imageGen) {
      endpoint = '/image-generation';
      body = {
        prompt: message,
        modelType: modelId
      };
    }
    
    const apiUrl = buildApiUrl(endpoint);
    console.log(`Sending request to ${apiUrl}`, body);
    const response = await axios.post(apiUrl, body);
    
    // For image generation, handle the image URL response
    if (imageGen && response.data.imageUrl) {
      return {
        response: `![Generated Image](${response.data.imageUrl})`,
        image: response.data.imageUrl
      };
    }
    
    // For regular responses, return the text content
    // For search responses, also include the sources if available
    return {
      response: response.data.choices?.[0]?.message?.content || response.data.content || response.data,
      sources: response.data.sources || null  // Include sources if they exist
    };
  } catch (error) {
    console.error('Error sending message to backend:', error);
    throw new Error(error.response?.data?.error || error.message);
  }
};

/**
 * Stream a message from the backend
 * @param {string} modelType - The model to use
 * @param {string} prompt - The user's message
 * @param {Function} onChunk - Callback for receiving chunks of the response
 * @param {boolean} search - Whether to use search
 * @param {boolean} deepResearch - Whether to use deep research
 * @param {boolean} imageGen - Whether to generate images
 * @param {string} imageData - Optional base64 image data
 * @param {string} fileTextContent - Optional text content from PDF or text file
 * @param {string} systemPrompt - Optional system prompt for thinking mode
 * @param {string} mode - Optional mode for the request
 * @returns {Promise<void>} A promise that resolves when streaming is complete
 */
export const streamMessageFromBackend = async (
  modelType, 
  prompt, 
  onChunk, 
  search = false, 
  deepResearch = false, 
  imageGen = false, 
  imageData = null,
  fileTextContent = null,
  systemPrompt = null,
  mode = null
) => {
  try {
    // Create the request packet
    const requestPacket = {
      modelType,
      prompt,
      search,
      deepResearch,
      imageGen,
      mode: mode
    };
    
    console.log("streamMessageFromBackend called with:", { 
      modelType, 
      mode,
      promptLength: prompt?.length,
      hasImage: !!imageData,
      hasFileText: !!fileTextContent,
      hasSystemPrompt: !!systemPrompt,
      fileTextLength: fileTextContent?.length
    });
    
    // Add system prompt if provided
    if (systemPrompt) {
      requestPacket.systemPrompt = systemPrompt;
      console.log("Added system prompt to streaming request");
      console.log(`System prompt first 50 chars: ${systemPrompt.substring(0, 50)}...`);
    }
    
    // Add image data if provided
    if (imageData) {
      // Extract the base64 data from the data URL
      const base64Data = imageData.split(',')[1];
      const mediaType = imageData.match(/data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+).*,.*/)?.[1] || 'image/jpeg';
      
      requestPacket.imageData = {
        data: base64Data,
        mediaType: mediaType
      };
      console.log("Added image data to streaming request");
    }
    
    // Add file text content if provided (for PDF or TXT files)
    if (fileTextContent) {
      requestPacket.fileTextContent = fileTextContent;
      console.log(`Added ${fileTextContent.length} characters of file text to streaming request`);
    }
    
    console.log('Sending streaming request to backend:', requestPacket);
    
    // Use fetch with streaming enabled
    const streamUrl = buildApiUrl('/chat/stream');
    const response = await fetch(streamUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestPacket)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to process streaming message');
    }
    
    // Get the reader from the response body stream
    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    let buffer = '';

    // Process the stream chunks
    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        break;
      }

      // Decode the chunk and accumulate it
      buffer += decoder.decode(value, { stream: true });

      // Handle SSE format: each message starts with "data: "
      const lines = buffer.split('\n');
      buffer = lines.pop();

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.substring(6); // Remove "data: " prefix
          
          // SSE can send a special [DONE] message to indicate completion
          if (data === '[DONE]') {
            return;
          }
          
          try {
            const parsed = JSON.parse(data);
            
            // Handle sources special event type
            if (parsed.type === 'sources' && Array.isArray(parsed.sources)) {
              console.log('Received sources data:', parsed.sources);
              // Store the sources data to be attached to the message
              // We need a way to communicate this back to the ChatWindow component
              // Don't add sources text to the content anymore
              // const sourcesMessage = `\n\nSources: ${parsed.sources.map(s => s.title).join(', ')}`;
              // onChunk(sourcesMessage);
              
              // Store the sources globally to be picked up by the ChatWindow component
              window.__lastSearchSources = parsed.sources;
              continue; // If it's a source event, skip further content processing for this data line
            }
            
            const content = parsed.choices?.[0]?.delta?.content || 
                           parsed.content || 
                           '';
            
            if (content) {
              onChunk(content);
            }
          } catch (e) {
            // If JSON.parse fails or another error occurs in the try block
            console.error('Error processing SSE data line or in onChunk. Raw data:', data, 'Error:', e);
            // Do NOT pass raw 'data' to onChunk if it couldn't be processed as expected.
            // The previous logic incorrectly passed raw data on parse failure.
            // Re-throw the error to ensure it's not silently caught and the stream processing stops.
            throw e;
          }
        }
      }
    }

    // Process any remaining buffered data
    if (buffer) {
      const remainingLines = buffer.split('\n');
      for (const line of remainingLines) {
        if (line.startsWith('data: ')) {
          const data = line.substring(6);
          if (data !== '') {
            if (data === '[DONE]') {
              return;
            }
            try {
              const parsed = JSON.parse(data);
              if (parsed.type === 'sources' && Array.isArray(parsed.sources)) {
                console.log('Received sources data:', parsed.sources);
                window.__lastSearchSources = parsed.sources;
                continue;
              }
              const content = parsed.choices?.[0]?.delta?.content || parsed.content || '';
              if (content) {
                onChunk(content);
              }
            } catch (e) {
              console.error('Error processing SSE data line or in onChunk. Raw data:', data, 'Error:', e);
              throw e;
            }
          }
        }
      }
    }
  } catch (error) {
    console.error('Error in streaming from backend:', error);
    throw error;
  }
};
