// authService.js
// Implements authentication using server API endpoints with JWT tokens

// API base URL - dynamically determined based on the current URL
const getApiBaseUrl = () => {
  return window.location.origin;
};

// Save auth token to session storage
const saveAuthToken = (token) => {
  sessionStorage.setItem('ai_portal_auth_token', token);
};

// Get auth token from session storage
const getAuthToken = () => {
  return sessionStorage.getItem('ai_portal_auth_token');
};

// Remove auth token from session storage
const removeAuthToken = () => {
  sessionStorage.removeItem('ai_portal_auth_token');
};

// Save current user to session storage
const saveCurrentUser = (user) => {
  sessionStorage.setItem('ai_portal_current_user', JSON.stringify(user));
};

// Remove current user from session storage
const removeCurrentUser = () => {
  sessionStorage.removeItem('ai_portal_current_user');
};

// Register a new user
export const registerUser = async (username, password) => {
  try {
    const response = await fetch(`${getApiBaseUrl()}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username, password })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Registration failed');
    }
    
    // Save auth token and user data
    saveAuthToken(data.token);
    saveCurrentUser(data.user);
    
    return data.user;
  } catch (error) {
    console.error('Registration error:', error);
    throw error;
  }
};

// Login user
export const loginUser = async (username, password) => {
  try {
    const response = await fetch(`${getApiBaseUrl()}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username, password })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Login failed');
    }
    
    // Save auth token and user data
    saveAuthToken(data.token);
    saveCurrentUser(data.user);
    
    return data.user;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

// Logout user
export const logoutUser = async () => {
  // No server-side logout needed with JWT (stateless authentication)
  // Just remove the token and user data from client storage
  removeAuthToken();
  removeCurrentUser();
  return true;
};

// Check if user is already logged in by verifying token with the server
export const getCurrentUser = () => {
  // First check if we have a user in session storage
  const userJSON = sessionStorage.getItem('ai_portal_current_user');
  
  // No need to call the API if we don't have a token
  if (!getAuthToken()) {
    return null;
  }
  
  // If we have a token, verify it with the server asynchronously
  // This is done in the background, and the AuthContext will handle updating the user state
  // when the verification is complete
  verifyToken();
  
  // Return the user from session storage (may be null)
  return userJSON ? JSON.parse(userJSON) : null;
};

// Verify token with the server
export const verifyToken = async () => {
  try {
    const token = getAuthToken();
    
    if (!token) {
      return { valid: false };
    }
    
    const response = await fetch(`${getApiBaseUrl()}/api/auth/verify`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const data = await response.json();
    
    if (data.valid && data.user) {
      // Update stored user data with the latest from the server
      saveCurrentUser(data.user);
      return { valid: true, user: data.user };
    } else {
      // If token is invalid, clear stored data
      removeAuthToken();
      removeCurrentUser();
      return { valid: false };
    }
  } catch (error) {
    console.error('Token verification error:', error);
    return { valid: false, error };
  }
};

// Update user settings
export const updateUserSettings = async (username, newSettings) => {
  try {
    const token = getAuthToken();
    
    if (!token) {
      throw new Error('Not authenticated');
    }
    
    const response = await fetch(`${getApiBaseUrl()}/api/user/settings`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(newSettings)
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to update settings');
    }
    
    // Update current user in session storage
    const currentUser = getCurrentUser();
    if (currentUser && currentUser.username === username) {
      currentUser.settings = data;
      saveCurrentUser(currentUser);
    }
    
    return data;
  } catch (error) {
    console.error('Update settings error:', error);
    throw error;
  }
};

// Get user chats from server
export const getUserChats = async () => {
  try {
    const token = getAuthToken();
    
    if (!token) {
      throw new Error('Not authenticated');
    }
    
    const response = await fetch(`${getApiBaseUrl()}/api/chats`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Failed to get chats');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Get chats error:', error);
    throw error;
  }
};

// Save user chats to server
export const saveUserChats = async (chats) => {
  try {
    const token = getAuthToken();
    
    if (!token) {
      throw new Error('Not authenticated');
    }
    
    const response = await fetch(`${getApiBaseUrl()}/api/chats`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(chats)
    });
    
    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Failed to save chats');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Save chats error:', error);
    throw error;
  }
};