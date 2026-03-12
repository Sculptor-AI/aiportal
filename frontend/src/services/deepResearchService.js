import { useState } from 'react';
import { getBackendApiBase } from './backendConfig';

const getApiBaseUrl = () => getBackendApiBase();

const toDeepResearchErrorMessage = (error) => {
  const message = String(error?.message || error || 'Deep research failed');
  if (/operation was aborted|aborterror/i.test(message)) {
    return 'Deep research connection was interrupted before completion. Please retry.';
  }
  if (/timed out|timeout/i.test(message)) {
    return 'Deep research timed out while waiting for upstream models. Please retry.';
  }
  return message;
};

// Helper function to get authentication headers
const getAuthHeaders = () => {
  let accessToken = null;
  
  try {
    const userJSON = localStorage.getItem('ai_portal_current_user');
    if (userJSON) {
      const user = JSON.parse(userJSON);
      accessToken = user?.accessToken || null;
    }
  } catch (e) {
    console.error('Error getting user session:', e);
  }

  if (!accessToken) {
    throw new Error('Authentication required. Please log in to use deep research.');
  }

  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'text/event-stream'
  };

  if (accessToken.startsWith('ak_')) {
    headers['x-api-key'] = accessToken;
  } else {
    headers['Authorization'] = `Bearer ${accessToken}`;
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
      body: JSON.stringify(requestBody),
      cache: 'no-store'
    });

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch (e) {
        errorData = { error: `HTTP ${response.status}: ${response.statusText}` };
      }
      
      throw new Error(errorData.error || `Request failed with status ${response.status}`);
    }

    if (!response.body) {
      throw new Error('Deep research endpoint did not return a stream.');
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
                onError(toDeepResearchErrorMessage(event.message));
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
    const friendlyMessage = toDeepResearchErrorMessage(error);
    console.error('Deep research error:', error);
    if (onError) {
      onError(friendlyMessage);
    }
    throw new Error(friendlyMessage);
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
