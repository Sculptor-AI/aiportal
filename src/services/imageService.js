const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'https://aiapi.kaileh.dev/api';

const buildUrl = (path) => {
  const cleanPath = path.startsWith('/api/') ? path.substring(4) : 
    path.startsWith('/') ? path.substring(1) : path;
  return `${BACKEND_URL}/${cleanPath}`;
};

export const generateImage = async (prompt) => {
  try {
    const response = await fetch(buildUrl('image/generate'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error)
  {
    console.error('Error generating image:', error);
    throw error;
  }
};

export const generateImageApi = async (prompt) => {
  try {
    const response = await fetch(buildUrl('image/generate'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt }),
    });
    if (!response.ok) {
      const errorBody = await response.text();
      console.error('API Error Response:', errorBody);
      throw new Error(`Network response was not ok: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Failed to generate image:', error);
    throw error;
  }
}; 