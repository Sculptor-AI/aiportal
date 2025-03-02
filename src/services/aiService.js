import axios from 'axios';

// Get API keys from environment variables (fallback)
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const CLAUDE_API_KEY = import.meta.env.VITE_CLAUDE_API_KEY;
const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

// Map updated model IDs to their respective API endpoints and formats
const MODEL_CONFIGS = {
  'gemini-2-flash': {
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai/',
    prepareRequest: (message, history) => {
      // Format request for Gemini API - ensure we're using gemini-2-flash model
      const formattedMessages = history.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }]
      }));
      
      return {
        contents: [
          ...formattedMessages,
          {
            role: 'user',
            parts: [{ text: message }]
          }
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
    prepareRequest: (message, history) => {
      // Format properly for Claude API
      return {
        model: 'claude-3-sonnet-20240229',
        max_tokens: 4000,
        messages: [
          ...history.map(msg => ({
            role: msg.role,
            content: msg.content
          })),
          { role: 'user', content: message }
        ]
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
    prepareRequest: (message, history) => {
      // Format properly for OpenAI API
      return {
        model: 'gpt-4o',
        messages: [
          ...history.map(msg => ({
            role: msg.role,
            content: msg.content
          })),
          { role: 'user', content: message }
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
  
  // Add custom GGUF model
  'custom-gguf': {
    baseUrl: 'https://api.explodingcb.com/chat',  // Your Cloudflare tunnel URL
    prepareRequest: (message, history) => {
      // Format properly for your GGUF API
      return {
        messages: [
          ...history.map(msg => ({
            role: msg.role,
            content: msg.content
          })),
          { role: 'user', content: message }
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

  'ursa-minor': {
    name: 'Ursa Minor',
    baseUrl: '', // Will be set dynamically from user settings
    prepareRequest: (message, history) => {
      // Format messages for the Ursa Minor API
      const messages = [
        ...history.map(msg => ({ role: msg.role, content: msg.content })),
        { role: 'user', content: message }
      ];
      
      return {
        messages,
        max_tokens: 512,
        temperature: 0.7
      };
    },
    extractResponse: (data) => {
      // Extract response text from API result
      return data.content;
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
    google: userSettings.googleApiKey || GEMINI_API_KEY,
    customGguf: userSettings.customGgufApiKey || '', // Add custom GGUF API key
    customGgufUrl: userSettings?.customGgufApiUrl || 'http://localhost:8000'
  };
};

// Updated createUrsaMinorRequest to include max_tokens similar to the CURL example.
const createUrsaMinorRequest = async (message, history, apiUrl) => {
  const formattedMessages = [
    ...history.map(msg => ({ role: msg.role, content: msg.content })),
    { role: 'user', content: message }
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

export const sendMessage = async (message, modelId, history) => {
  console.log(`sendMessage called with model: ${modelId}, message: "${message.substring(0, 30)}..."`, 
    `history length: ${history?.length || 0}`);
  
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
  }
  
  // Only use simulation if no API key is available
  if (!hasApiKey) {
    // ...existing simulation code...
  }
  
  // Use real API when we have keys
  try {
    console.log(`Using real API for ${modelId} (source: ${apiKeySource})`);
    
    // Special case for Ursa Minor API
    if (modelId === 'ursa-minor') {
      const apiUrl = apiKeys.customGgufUrl;
      console.log(`Using Ursa Minor API at ${apiUrl}`);
      
      try {
        return await createUrsaMinorRequest(message, history, apiUrl);
      } catch (error) {
        console.error("Error calling Ursa Minor API:", error);
        throw new Error(`Error setting up request to ursa-minor API: ${error.message}\n\nPlease check your API configuration and try again.`);
      }
    }
    
    // Prepare the request based on the selected model
    const requestData = modelConfig.prepareRequest(message, history);
  
    // Set up headers and URL based on model type
    let headers = { 'Content-Type': 'application/json' };
    let url = modelConfig.baseUrl;

    if (modelId === 'gemini-2-flash') {
      // Ensure we're explicitly using the correct model
      url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent' + `?key=${apiKeys.google}`;
    } else if (modelId === 'claude-3.7-sonnet') {
      headers['x-api-key'] = apiKeys.anthropic;
      headers['anthropic-version'] = '2023-06-01';
      // Required for CORS in browser environment
      headers['Content-Type'] = 'application/json';
    } else if (modelId === 'chatgpt-4o') {
      headers['Authorization'] = `Bearer ${apiKeys.openai}`;
    } else if (modelId === 'custom-gguf') {
      // No special headers needed for custom API, use default headers
      url = modelConfig.baseUrl;
      
      // Optionally add API key if your custom implementation requires it
      if (apiKeys.customGguf) {
        headers['Authorization'] = `Bearer ${apiKeys.customGguf}`;
      }
    }

    const response = await axios.post(url, requestData, { headers });
    return modelConfig.extractResponse(response);
  } catch (error) {
    console.error('Error calling AI API:', error);
    throw error;
  }
};