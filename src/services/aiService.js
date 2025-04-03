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
    },
    extractResponse: (response) => {
      if (!response.data.candidates || !response.data.candidates[0] || 
          !response.data.candidates[0].content || !response.data.candidates[0].content.parts) {
        throw new Error("Unexpected response format from Gemini API");
      }
      return response.data.candidates[0].content.parts[0].text;
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
    },
    extractResponse: (response) => {
      if (!response.data || !response.data.content || !response.data.content[0] || !response.data.content[0].text) {
        throw new Error("Unexpected response format from Claude API");
      }
      return response.data.content[0].text;
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
    },
    extractResponse: (response) => {
      if (!response.data || !response.data.choices || !response.data.choices[0] || !response.data.choices[0].message) {
        throw new Error("Unexpected response format from OpenAI API");
      }
      return response.data.choices[0].message.content;
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
    },
    extractResponse: (response) => {
      if (!response.data || !response.data.content) {
        throw new Error("Unexpected response format from custom GGUF API");
      }
      return response.data.content;
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
    },
    extractResponse: (response) => {
      if (!response.data || !response.data.choices || !response.data.choices[0] || !response.data.choices[0].message) {
        throw new Error("Unexpected response format from Nemotron API");
      }
      return response.data.choices[0].message.content;
    }
  }
};

// Helper to get API keys, prioritizing user-provided keys
const getApiKeys = () => {
  // Try to get user's API keys from settings in localStorage
  let userSettings = {};
  try {
    // Check if user is logged in
    const userJSON = sessionStorage.getItem('ai_portal_current_user');
    if (userJSON) {
      const user = JSON.parse(userJSON);
      userSettings = user.settings || {};
    } else {
      // If not logged in, try to get settings from localStorage
      const settingsJSON = localStorage.getItem('settings');
      if (settingsJSON) {
        userSettings = JSON.parse(settingsJSON);
      }
    }
  } catch (e) {
    console.error('Error getting user settings:', e);
  }

  return {
    openai: userSettings.openaiApiKey || OPENAI_API_KEY,
    anthropic: userSettings.anthropicApiKey || CLAUDE_API_KEY,
    // Use user setting only if it's a non-empty string, otherwise fallback to env variable
    google: (userSettings.googleApiKey && userSettings.googleApiKey.trim() !== '') 
            ? userSettings.googleApiKey 
            : GEMINI_API_KEY,
    nvidia: userSettings.nvidiaApiKey || NVIDIA_API_KEY,
    customGguf: userSettings.customGgufApiKey || '', // Add custom GGUF API key
    customGgufUrl: userSettings?.customGgufApiUrl || 'http://localhost:8000'
  };
};

// Reverted: Removed textContent and fileName parameters
const createUrsaMinorRequest = async (message, history, apiUrl, imageData = null) => {
  let messageText = message;
  if (imageData) {
    // Reverted: Simplified image note
    messageText = `[Note: Image was uploaded with this message]\n\n${message}`; 
  }
  // Reverted: Removed textContent handling logic
  
  const formattedMessages = [
    ...history.map(msg => {
       let content = msg.content;
       if (msg.image) { 
         content = `[Note: Previous message included an image]\n\n${content}`;
       } 
       // Reverted: Removed file handling in history
       return { role: msg.role, content: content };
    }),
    { role: 'user', content: messageText }
  ];

  try {
    console.log(`Sending request to Ursa Minor API: ${apiUrl}/chat`);
    console.log('Request body:', JSON.stringify({ messages: formattedMessages, max_tokens: 100 }));
    
    const response = await fetch(`${apiUrl}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: formattedMessages,
        max_tokens: 100
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();
    console.log('Received response from Ursa Minor API:', data);
    return data.content;
  } catch (error) {
    console.error("Error with Ursa Minor API:", error);
    throw error;
  }
};

// Updated sendMessage signature to accept fileTextContent
export const sendMessage = async (message, modelId, history, imageData = null, fileTextContent = null) => { 
  console.log(`sendMessage called with model: ${modelId}, message: "${message.substring(0, 30)}..."`, 
    `history length: ${history?.length || 0}`, 
    imageData ? `imageData: [${imageData.substring(0,30)}...]` : '',
    fileTextContent ? `fileTextContent: [${fileTextContent.substring(0,30)}...]` : '' // Log file text
  );
  
  // Validate inputs
  if (!message || !modelId) {
    console.error("Missing required parameters:", { message, modelId });
    throw new Error("Missing required parameters for sendMessage");
  }
  
  // Get model config
  const modelConfig = MODEL_CONFIGS[modelId];
  if (!modelConfig) {
    console.error(`Unsupported model: ${modelId}`);
    throw new Error(`Unsupported model: ${modelId}`);
  }

  // Get API keys, prioritizing user-provided keys
  const apiKeys = getApiKeys();
  
  // Check if we have the required API key for the selected model
  let hasApiKey = false;
  let apiKeySource = '';
  
  if (modelId === 'gemini-2-flash' && apiKeys.google) {
    hasApiKey = true;
    apiKeySource = apiKeys.google === GEMINI_API_KEY ? '.env file' : 'user settings';
  } else if (modelId === 'claude-3.7-sonnet' && apiKeys.anthropic) {
    hasApiKey = true;
    apiKeySource = apiKeys.anthropic === CLAUDE_API_KEY ? '.env file' : 'user settings';
  } else if (modelId === 'chatgpt-4o' && apiKeys.openai) {
    hasApiKey = true;
    apiKeySource = apiKeys.openai === OPENAI_API_KEY ? '.env file' : 'user settings';
  } else if (modelId === 'custom-gguf') {
    // Always allow access to custom model
    hasApiKey = true;
    apiKeySource = 'local API';
  } else if (modelId === 'ursa-minor') {
    hasApiKey = true;
    apiKeySource = 'local API';
  } else if (modelId === 'nemotron-super-49b' && apiKeys.nvidia) {
    hasApiKey = true;
    apiKeySource = apiKeys.nvidia === NVIDIA_API_KEY ? '.env file' : 'user settings';
  }
  
  // Only use simulation if no API key is available
  if (!hasApiKey) {
    // TODO: Add simulation logic if needed
  }
  
  // Use real API when we have keys
  try {
    console.log(`Using real API for ${modelId} (source: ${apiKeySource})`);
    
    // Special case for Ursa Minor API (local GGUF)
    if (modelId === 'ursa-minor') {
      const apiUrl = apiKeys.customGgufUrl || 'http://localhost:8000'; // Default if not set
      console.log(`Using Ursa Minor API at ${apiUrl}`);
      try {
        // TODO: Update createUrsaMinorRequest if it needs to handle fileTextContent
        // For now, it will ignore fileTextContent
        return await createUrsaMinorRequest(message, history, apiUrl, imageData); 
      } catch (error) {
        console.error("Error calling Ursa Minor API:", error);
        throw new Error(`Error setting up request to Ursa Minor API: ${error.message}\n\nPlease check your API configuration and try again.`);
      }
    }
    
    // Prepare the request based on the selected model, passing all relevant data
    const requestData = modelConfig.prepareRequest(message, history, imageData, fileTextContent);
  
    // Set up headers and URL based on model type
    let headers = { 'Content-Type': 'application/json' };
    let url = modelConfig.baseUrl;

    // Set model-specific headers (Claude, OpenAI, NVIDIA)
    if (modelId.startsWith('claude')) { // Use startsWith for flexibility
      headers['x-api-key'] = apiKeys.anthropic;
      headers['anthropic-version'] = '2023-06-01';
      // The Content-Type header is already set initially
    } else if (modelId.startsWith('chatgpt') || modelId === 'dall-e-3') { // Use startsWith for flexibility
      headers['Authorization'] = `Bearer ${apiKeys.openai}`;
    } else if (modelId === 'custom-gguf') { 
      // Use the URL from settings for the generic custom GGUF model
      url = apiKeys.customGgufUrl || modelConfig.baseUrl; // Fallback if needed
      if (!url) {
         throw new Error("Custom GGUF API URL is not configured in settings.");
      }
      console.log(`Using Custom GGUF API at ${url}`);
      // Optionally add API key if your custom implementation requires it
      if (apiKeys.customGguf) {
        headers['Authorization'] = `Bearer ${apiKeys.customGguf}`;
      }
    } else if (modelId.startsWith('nemotron')) { // Use startsWith for flexibility
      headers['Authorization'] = `Bearer ${apiKeys.nvidia}`;
    }

    // Append Google API key as query param if it's a Gemini model
    if (modelId.startsWith('gemini')) {
        if (!apiKeys.google) throw new Error('Google API Key is missing.');
        url += `?key=${apiKeys.google}`; // Append key correctly
    }

    console.log("Final Request URL:", url);
    console.log("Final Request Headers:", headers);
    console.log("Final Request Data:", JSON.stringify(requestData, null, 2));

    const response = await axios.post(url, requestData, { headers });
    console.log("API Response:", response);
    return modelConfig.extractResponse(response);
  } catch (error) {
    console.error('Error calling AI API:', error);
    throw error;
  }
};
