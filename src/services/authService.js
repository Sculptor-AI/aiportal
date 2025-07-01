// authService.js
// Backend authentication service for AI Portal

// Build backend base URL robustly (exactly one /api suffix, no duplicate slashes)
const rawBaseUrl = import.meta.env.VITE_BACKEND_API_URL || 'http://73.118.140.130:3000';

// Remove any trailing slashes
let cleanedBase = rawBaseUrl.replace(/\/+$/, '');

// If the cleaned base already ends with /api, remove it
if (cleanedBase.endsWith('/api')) {
  cleanedBase = cleanedBase.slice(0, -4); // remove '/api'
}

const BACKEND_API_BASE = `${cleanedBase}/api`;

console.log('[authService] Computed BACKEND_API_BASE:', BACKEND_API_BASE);

// Helper function to build API URLs
const buildApiUrl = (endpoint) => {
  console.log('[authService] buildApiUrl called with endpoint:', endpoint);
  console.log('[authService] BACKEND_API_BASE:', BACKEND_API_BASE);
  
  if (!endpoint) return BACKEND_API_BASE;

  // Normalize endpoint to remove a leading slash if it exists
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint.substring(1) : endpoint;

  // Prevent double "api" segment
  if (normalizedEndpoint.startsWith('api/')) {
    const result = `${BACKEND_API_BASE}/${normalizedEndpoint.substring(4)}`;
    console.log('[authService] Detected api/ prefix, returning:', result);
    return result;
  }

  const result = `${BACKEND_API_BASE}/${normalizedEndpoint}`;
  console.log('[authService] Normal endpoint, returning:', result);
  return result;
};

// Google login (placeholder - can be implemented later if needed)
export const loginWithGoogle = () => {
  return Promise.reject(new Error('Google login not implemented in backend yet'));
};

// Register a new user
export const registerUser = async (username, password, email) => {
  try {
    const response = await fetch(buildApiUrl('/auth/register'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username,
        password,
        email
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Registration failed');
    }

    return {
      success: true,
      message: data.message,
      userId: data.userId
    };
  } catch (error) {
    console.error('Registration error:', error);
    throw error;
  }
};

// Login user
export const loginUser = async (username, password) => {
  try {
    const loginUrl = buildApiUrl('/auth/login');
    console.log('[authService] Login URL being used:', loginUrl);
    
    const response = await fetch(loginUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username,
        password
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Login failed');
    }

    if (data.success && data.data) {
      // Store user data and tokens
      const user = {
        ...data.data.user,
        accessToken: data.data.accessToken,
        refreshToken: data.data.refreshToken
      };

      // Store in session storage
      sessionStorage.setItem('ai_portal_current_user', JSON.stringify(user));
      
      return user;
    } else {
      throw new Error('Invalid response format');
    }
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

// Logout user
export const logoutUser = () => {
  return new Promise((resolve) => {
    sessionStorage.removeItem('ai_portal_current_user');
    resolve(true);
  });
};

// Check if user is logged in
export const getCurrentUser = () => {
  const userJSON = sessionStorage.getItem('ai_portal_current_user');
  return userJSON ? JSON.parse(userJSON) : null;
};

// Get authentication headers for API requests
export const getAuthHeaders = () => {
  const user = getCurrentUser();
  if (user && user.accessToken) {
    return {
      'Authorization': `Bearer ${user.accessToken}`
    };
  }
  return {};
};

// Generate API Key
export const generateApiKey = async (keyName) => {
  try {
    const user = getCurrentUser();
    if (!user || !user.accessToken) {
      throw new Error('User not authenticated');
    }

    const response = await fetch(buildApiUrl('/auth/api-keys'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${user.accessToken}`
      },
      body: JSON.stringify({
        keyName
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to generate API key');
    }

    return data.data;
  } catch (error) {
    console.error('API key generation error:', error);
    throw error;
  }
};

// List API Keys
export const listApiKeys = async () => {
  try {
    const user = getCurrentUser();
    if (!user || !user.accessToken) {
      throw new Error('User not authenticated');
    }

    const response = await fetch(buildApiUrl('/auth/api-keys'), {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${user.accessToken}`
      }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch API keys');
    }

    return data.data;
  } catch (error) {
    console.error('API keys fetch error:', error);
    throw error;
  }
};

// Update user settings (for backward compatibility)
export const updateUserSettings = (username, newSettings) => {
  // For now, just update local session storage
  // In future, this could sync with backend user preferences
  return new Promise((resolve) => {
    const currentUser = getCurrentUser();
    if (currentUser && currentUser.username === username) {
      currentUser.settings = { ...currentUser.settings, ...newSettings };
      sessionStorage.setItem('ai_portal_current_user', JSON.stringify(currentUser));
      resolve(currentUser.settings);
    } else {
      resolve(newSettings);
    }
  });
};