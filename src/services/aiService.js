import axios from 'axios';

// Get API base URL
const getApiBaseUrl = () => {
  return window.location.origin;
};

// Get auth token from session storage
const getAuthToken = () => {
  return sessionStorage.getItem('ai_portal_auth_token');
};

/**
 * Send a message to the AI model through the server-side proxy
 * This keeps API keys secure on the server and prevents CORS issues
 * @param {string} message - The user message to send
 * @param {string} modelId - The ID of the model to use
 * @param {Array} history - Previous conversation history
 * @returns {Promise<string>} - The AI's response
 */
export const sendMessage = async (message, modelId, history) => {
  console.log(`sendMessage called with model: ${modelId}, message: "${message.substring(0, 30)}..."`, 
    `history length: ${history?.length || 0}`);
  
  // Validate inputs
  if (!message || !modelId) {
    console.error("Missing required parameters:", { message, modelId });
    throw new Error("Missing required parameters for sendMessage");
  }
  
  // Get authentication token
  const token = getAuthToken();
  
  // If not authenticated, return an error message
  if (!token) {
    console.log(`Not authenticated, returning error message`);
    return "You need to be logged in to use the AI models. Please log in or create an account.";
  }
  
  try {
    // Send request to our server-side proxy API
    const response = await axios.post(`${getApiBaseUrl()}/api/ai/message`, {
      message,
      modelId,
      history
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    // The server response should contain either a message or an error
    if (response.data.message) {
      return response.data.message;
    } else {
      throw new Error(response.data.error || 'Unknown error from AI API');
    }
    
  } catch (error) {
    console.error('Error calling AI API proxy:', error);
    
    // If we have a response with error details from our server
    if (error.response && error.response.data) {
      if (error.response.data.message) {
        // If the server provided a user-friendly error message, use it
        return error.response.data.message;
      } else {
        return `Error from the ${modelId} API: ${error.response.status} ${error.response.statusText}
        
Details: ${JSON.stringify(error.response.data)}

Please check your API key in Settings -> API Tokens and ensure it has the correct permissions.
        
\n\n- Error from ${modelId}`;
      }
    } else if (error.request) {
      return `Network error connecting to the server. No response was received.
      
This may be due to:
- Network connectivity issues
- Server being temporarily unavailable

Please try again later or check your network connection.
      
\n\n- Error from server`;
    } else {
      return `Error setting up request: ${error.message}
      
Please try again later.
      
\n\n- Error from client`;
    }
  }
};