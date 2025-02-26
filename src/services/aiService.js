import axios from 'axios';

// Get API keys from environment variables (fallback)
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const CLAUDE_API_KEY = import.meta.env.VITE_CLAUDE_API_KEY;
const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

// Map updated model IDs to their respective API endpoints and formats
const MODEL_CONFIGS = {
  'gemini-2-flash': {
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2-flash:generateContent',
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
    google: userSettings.googleApiKey || GEMINI_API_KEY
  };
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
  }
  
  // Only use simulation if no API key is available
  if (!hasApiKey) {
    console.log(`No API key available for ${modelId}, using simulation`);
    return new Promise(resolve => {
      setTimeout(() => {
        const response = `I need a valid API key to connect to the ${modelId} service. You can add your API key in Settings -> API Tokens.
        
For ${modelId === 'gemini-2-flash' ? 'Gemini' : modelId === 'claude-3.7-sonnet' ? 'Claude' : 'ChatGPT'}, you'll need to provide ${
          modelId === 'gemini-2-flash' ? 'a Google AI API key' : 
          modelId === 'claude-3.7-sonnet' ? 'an Anthropic API key' : 
          'an OpenAI API key'
        }.

Without a valid API key, I cannot connect to the actual AI service.

\n\n- ${modelId}`;
        resolve(response);
      }, 500);
    });
  }
  
  // Use real API when we have keys
  try {
    console.log(`Using real API for ${modelId} (source: ${apiKeySource})`);
    // Prepare the request based on the selected model
    const requestData = modelConfig.prepareRequest(message, history);
  
    // Set up headers and URL based on model type
    let headers = { 'Content-Type': 'application/json' };
    let url = modelConfig.baseUrl;

    if (modelId === 'gemini-2-flash') {
      // Ensure we're explicitly using the correct model
      url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2-flash:generateContent' + `?key=${apiKeys.google}`;
    } else if (modelId === 'claude-3.7-sonnet') {
      headers['x-api-key'] = apiKeys.anthropic;
      headers['anthropic-version'] = '2023-06-01';
      // Required for CORS in browser environment
      headers['Content-Type'] = 'application/json';
    } else if (modelId === 'chatgpt-4o') {
      headers['Authorization'] = `Bearer ${apiKeys.openai}`;
    }

    const response = await axios.post(url, requestData, { headers });
    return modelConfig.extractResponse(response);
  } catch (error) {
    console.error('Error calling AI API:', error);
    
    // Provide a helpful error message
    if (error.response) {
      let errorMsg = `Error from the ${modelId} API: ${error.response.status} ${error.response.statusText}
      
Details: ${JSON.stringify(error.response.data)}

Please check your API key and ensure it has the correct permissions.`;

      // Add specific information for Gemini model errors
      if (modelId === 'gemini-2-flash' && error.response.data?.error?.message?.includes('gemini-pro')) {
        errorMsg += `\n\nImportant: The error mentions 'gemini-pro' but you're using the 'gemini-2-flash' model. Make sure your Google AI API key has access to the latest Gemini models.`;
      }
      
      return errorMsg + `\n\n- Error from ${modelId}`;
    } else if (error.request) {
      return `Network error connecting to the ${modelId} API. No response was received.
      
This may be due to:
- Network connectivity issues
- API service being temporarily unavailable
- CORS restrictions in your browser

Please try again later or check your network connection.
      
\n\n- Error from ${modelId}`;
    } else {
      return `Error setting up request to ${modelId} API: ${error.message}
      
Please check your API configuration and try again.
      
\n\n- Error from ${modelId}`;
    }
  }
};