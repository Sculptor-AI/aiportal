import { useState } from 'react';
import axios from 'axios';

// Helper function to get API base URL
const getApiBaseUrl = () => {
  const rawBaseUrl = import.meta.env.VITE_BACKEND_API_URL || 'https://api.sculptorai.org';
  let cleanedBase = rawBaseUrl.replace(/\/+$/, '');
  
  if (cleanedBase.endsWith('/api')) {
    cleanedBase = cleanedBase.slice(0, -4);
  }
  
  return `${cleanedBase}/api`;
};

// Helper function to get authentication headers
const getAuthHeaders = () => {
  let apiKey = null;
  let user = null;
  
  try {
    const userJSON = sessionStorage.getItem('ai_portal_current_user');
    if (userJSON) {
      user = JSON.parse(userJSON);
      if (user.accessToken && user.accessToken.startsWith('ak_')) {
        apiKey = user.accessToken;
      } else if (user.accessToken) {
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

  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'text/event-stream'
  };

  if (apiKey.startsWith('ak_')) {
    headers['x-api-key'] = apiKey;
  } else {
    headers['Authorization'] = `Bearer ${apiKey}`;
  }

  return headers;
};

/**
 * Performs deep research using the backend API with Server-Sent Events
 * @param {string} query - The research question
 * @param {string} model - The model to use for research
 * @param {number} maxAgents - Maximum number of agents to use (2-12)
 * @param {function} onProgress - Callback for progress updates
 * @param {function} onComplete - Callback for completion
 * @param {function} onError - Callback for errors
 * @returns {Promise<void>}
 */
export const performDeepResearch = async (query, model, maxAgents = 8, onProgress, onComplete, onError) => {
  if (!query || !model) {
    throw new Error('Query and model are required');
  }

  if (maxAgents < 2 || maxAgents > 12) {
    throw new Error('maxAgents must be between 2 and 12');
  }

  const url = `${getApiBaseUrl()}/deep-research`;
  const headers = getAuthHeaders();

  const requestBody = {
    query,
    model,
    maxAgents
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch (e) {
        errorData = { error: `HTTP ${response.status}: ${response.statusText}` };
      }
      
      const errorMessage = errorData.error || `Request failed with status ${response.status}`;
      if (onError) onError(errorMessage);
      throw new Error(errorMessage);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.trim() === '') continue;
        
        if (line.startsWith('data: ')) {
          const data = line.substring(6).trim();
          
          if (data === '[DONE]') {
            return;
          }

          try {
            const event = JSON.parse(data);
            
            if (event.type === 'progress') {
              if (onProgress) {
                onProgress(event.progress, event.message);
              }
            } else if (event.type === 'completion') {
              if (onComplete) {
                onComplete(event);
              }
            } else if (event.type === 'error') {
              if (onError) {
                onError(event.message);
              }
            }
          } catch (e) {
            console.error('Failed to parse SSE event:', e, 'Raw data:', data);
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
              const event = JSON.parse(data);
              if (event.type === 'completion' && onComplete) {
                onComplete(event);
              }
            } catch (e) {
              console.error('Failed to parse final SSE event:', e);
            }
          }
        }
      }
    }
  } catch (error) {
    console.error('Deep research error:', error);
    if (onError) {
      onError(error.message);
    }
    throw error;
  }
};

/**
 * React hook for deep research functionality
 * @returns {Object} Hook with state and performResearch function
 */
export const useDeepResearch = () => {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const performResearch = async (query, model, maxAgents = 8) => {
    setIsLoading(true);
    setError(null);
    setProgress(0);
    setStatus('');
    setResult(null);

    try {
      await performDeepResearch(
        query,
        model,
        maxAgents,
        // onProgress
        (progress, message) => {
          setProgress(progress);
          setStatus(message);
        },
        // onComplete
        (result) => {
          setResult(result);
          setProgress(100);
          setStatus('Research completed successfully!');
          setIsLoading(false);
        },
        // onError
        (errorMessage) => {
          setError(errorMessage);
          setIsLoading(false);
        }
      );
    } catch (err) {
      setError(err.message);
      setIsLoading(false);
    }
  };

  return { 
    performResearch, 
    progress, 
    status, 
    result, 
    error, 
    isLoading 
  };
};