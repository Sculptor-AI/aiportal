import axios from 'axios';

// Get API keys from environment variables
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const CLAUDE_API_KEY = import.meta.env.VITE_CLAUDE_API_KEY;
const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

// Map updated model IDs to their respective API endpoints and formats
const MODEL_CONFIGS = {
  'gemini-2-flash': {
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent',
    prepareRequest: (message, history) => {
      // Format request for Gemini API
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

  // Check if we have the required API key for the selected model
  const useRealAPI = (modelId === 'gemini-2-flash' && GEMINI_API_KEY) || 
                    (modelId === 'claude-3.7-sonnet' && CLAUDE_API_KEY) ||
                    (modelId === 'chatgpt-4o' && OPENAI_API_KEY);
  
  // Only use simulation if no API key is available
  if (!useRealAPI) {
    console.log(`No API key available for ${modelId}, using simulation`);
    return new Promise(resolve => {
      setTimeout(() => {
        const response = `I need a valid API key to connect to the ${modelId} service. Please add your API key to the .env file as follows:
        
For ${modelId === 'gemini-2-flash' ? 'Gemini' : modelId === 'claude-3.7-sonnet' ? 'Claude' : 'ChatGPT'}, add:
${modelId === 'gemini-2-flash' ? 'VITE_GEMINI_API_KEY=your_api_key_here' : 
  modelId === 'claude-3.7-sonnet' ? 'VITE_CLAUDE_API_KEY=your_api_key_here' : 
  'VITE_OPENAI_API_KEY=your_api_key_here'}

Without a valid API key, I cannot connect to the actual AI service.

\n\n- ${modelId}`;
        resolve(response);
      }, 500);
    });
  }
  
  // Use real API when we have keys
  try {
    console.log(`Using real API for ${modelId}`);
    // Prepare the request based on the selected model
    const requestData = modelConfig.prepareRequest(message, history);
  
    // Set up headers and URL based on model type
    let headers = { 'Content-Type': 'application/json' };
    let url = modelConfig.baseUrl;

    if (modelId === 'gemini-2-flash') {
      url = `${modelConfig.baseUrl}?key=${GEMINI_API_KEY}`;
    } else if (modelId === 'claude-3.7-sonnet') {
      headers['x-api-key'] = CLAUDE_API_KEY;
      headers['anthropic-version'] = '2023-06-01';
      // Required for CORS in browser environment
      headers['Content-Type'] = 'application/json';
    } else if (modelId === 'chatgpt-4o') {
      headers['Authorization'] = `Bearer ${OPENAI_API_KEY}`;
    }

    const response = await axios.post(url, requestData, { headers });
    return modelConfig.extractResponse(response);
  } catch (error) {
    console.error('Error calling AI API:', error);
    
    // Provide a helpful error message
    if (error.response) {
      return `Error from the ${modelId} API: ${error.response.status} ${error.response.statusText}
      
Details: ${JSON.stringify(error.response.data)}

Please check your API key and ensure it has the correct permissions.
      
\n\n- Error from ${modelId}`;
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
