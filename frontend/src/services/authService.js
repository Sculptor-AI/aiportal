// authService.js
// Backend authentication service for AI Portal

import { getBackendApiBase } from './backendConfig';

const SAME_ORIGIN_API_BASE = '/api';
const LEGACY_CLIENT_STORAGE_KEYS = ['generated_videos'];

// Helper function to build API URLs
const buildApiUrlWithBase = (base, endpoint) => {
  if (!endpoint) return base;

  // Normalize endpoint to remove a leading slash if it exists
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint.substring(1) : endpoint;

  // Prevent double "api" segment
  if (normalizedEndpoint.startsWith('api/')) {
    return `${base}/${normalizedEndpoint.substring(4)}`;
  }

  return `${base}/${normalizedEndpoint}`;
};

const buildApiUrl = (endpoint) => buildApiUrlWithBase(getBackendApiBase(), endpoint);

const clearLegacyClientStorage = () => {
  if (typeof localStorage === 'undefined') {
    return;
  }

  for (const storageKey of LEGACY_CLIENT_STORAGE_KEYS) {
    try {
      localStorage.removeItem(storageKey);
    } catch (error) {
      console.warn(`[authService] Failed to remove legacy storage key "${storageKey}":`, error);
    }
  }
};

const fetchWithFallback = async (endpoint, options) => {
  const backendBase = getBackendApiBase();
  const primaryUrl = buildApiUrl(endpoint);

  try {
    return await fetch(primaryUrl, options);
  } catch (error) {
    if (backendBase === SAME_ORIGIN_API_BASE) {
      throw error;
    }

    const fallbackUrl = buildApiUrlWithBase(SAME_ORIGIN_API_BASE, endpoint);
    console.warn(`[authService] Primary API request failed (${primaryUrl}). Retrying same-origin at ${fallbackUrl}`);
    return fetch(fallbackUrl, options);
  }
};

const persistCurrentUser = (sessionData) => {
  const user = {
    ...sessionData.user,
    accessToken: sessionData.accessToken,
    refreshToken: sessionData.refreshToken
  };

  localStorage.setItem('ai_portal_current_user', JSON.stringify(user));
  return user;
};

// Google login via backend OAuth redirect
export const loginWithGoogle = () => {
  const currentLocation = typeof window !== 'undefined' ? window.location : null;
  const returnTo = currentLocation && currentLocation.pathname !== '/auth/callback'
    ? `${currentLocation.pathname}${currentLocation.search}${currentLocation.hash}`
    : '/';
  const oauthUrl = new URL(buildApiUrl('/auth/oauth/google/start'), currentLocation?.origin || 'http://localhost');
  oauthUrl.searchParams.set('app_origin', currentLocation?.origin || oauthUrl.origin);
  oauthUrl.searchParams.set('return_to', returnTo);
  window.location.assign(oauthUrl.toString());
  return Promise.resolve();
};

// Register a new user
export const registerUser = async (username, password, email) => {
  try {
    const response = await fetchWithFallback('/auth/register', {
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
    const response = await fetchWithFallback('/auth/login', {
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
      return persistCurrentUser(data.data);
    } else {
      throw new Error('Invalid response format');
    }
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

const buildAuthHeaders = (token) => {
  if (!token) return {};
  if (token.startsWith('ak_')) {
    return { 'X-API-Key': token };
  }
  return { 'Authorization': `Bearer ${token}` };
};

// Logout user and revoke server-side session/token
export const logoutUser = async () => {
  try {
    const user = getCurrentUser();
    if (user?.accessToken) {
      await fetchWithFallback('/auth/logout', {
        method: 'POST',
        headers: buildAuthHeaders(user.accessToken)
      });
    }
  } catch (error) {
    console.error('Logout error:', error);
  } finally {
    localStorage.removeItem('ai_portal_current_user');
    clearLegacyClientStorage();
  }
  return true;
};

// Check if user is logged in
export const getCurrentUser = () => {
  const userJSON = localStorage.getItem('ai_portal_current_user');
  return userJSON ? JSON.parse(userJSON) : null;
};

export const completeOAuthLogin = async (resultToken) => {
  try {
    const response = await fetchWithFallback('/auth/oauth/complete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ resultToken })
    });

    const data = await response.json().catch(() => ({}));

    if (response.ok && data.success && data.data) {
      return {
        status: 'authenticated',
        user: persistCurrentUser(data.data),
        returnTo: data.data.returnTo || '/'
      };
    }

    if (data.status === 'pending') {
      return {
        status: 'pending',
        message: data.message || 'Your account is awaiting admin approval.',
        returnTo: data.returnTo || '/'
      };
    }

    throw new Error(data.error || data.message || 'Google login failed');
  } catch (error) {
    console.error('OAuth completion error:', error);
    throw error;
  }
};

// Get authentication headers for API requests
export const getAuthHeaders = () => {
  const user = getCurrentUser();
  if (user && user.accessToken) {
    return buildAuthHeaders(user.accessToken);
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

    const response = await fetchWithFallback('/auth/api-keys', {
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

    const response = await fetchWithFallback('/auth/api-keys', {
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
      localStorage.setItem('ai_portal_current_user', JSON.stringify(currentUser));
      resolve(currentUser.settings);
    } else {
      resolve(newSettings);
    }
  });
};

// Admin Authentication Functions

// Admin login
export const adminLogin = async (username, password) => {
  try {
    const response = await fetchWithFallback('/admin/auth/login', {
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
      throw new Error(data.error || 'Admin login failed');
    }

    if (data.success && data.data) {
      const adminUser = {
        ...data.data.user,
        adminToken: data.data.adminToken
      };

      // Store admin session
      localStorage.setItem('ai_portal_admin_user', JSON.stringify(adminUser));
      
      return adminUser;
    } else {
      throw new Error('Invalid admin login response format');
    }
  } catch (error) {
    console.error('Admin login error:', error);
    throw error;
  }
};

// Admin logout
export const adminLogout = async () => {
  try {
    const adminUser = getCurrentAdminUser();
    if (adminUser && adminUser.adminToken) {
      await fetchWithFallback('/admin/auth/logout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${adminUser.adminToken}`
        }
      });
    }
  } catch (error) {
    console.error('Admin logout error:', error);
  } finally {
    localStorage.removeItem('ai_portal_admin_user');
    clearLegacyClientStorage();
  }
};

// Get current admin user
export const getCurrentAdminUser = () => {
  const adminUserJSON = localStorage.getItem('ai_portal_admin_user');
  return adminUserJSON ? JSON.parse(adminUserJSON) : null;
};

// Get admin authentication headers
export const getAdminAuthHeaders = () => {
  const adminUser = getCurrentAdminUser();
  if (adminUser && adminUser.adminToken) {
    return {
      'Authorization': `Bearer ${adminUser.adminToken}`
    };
  }
  return {};
};

// Admin User Management Functions

// Get all users
export const getAllUsers = async () => {
  try {
    const response = await fetchWithFallback('/admin/users', {
      method: 'GET',
      headers: getAdminAuthHeaders()
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch users');
    }

    return data.data.users;
  } catch (error) {
    console.error('Get users error:', error);
    throw error;
  }
};

// Get user by ID
export const getUserById = async (userId) => {
  try {
    const response = await fetchWithFallback(`/admin/users/${userId}`, {
      method: 'GET',
      headers: getAdminAuthHeaders()
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch user');
    }

    return data.data.user;
  } catch (error) {
    console.error('Get user error:', error);
    throw error;
  }
};

// Update user status
export const updateUserStatus = async (userId, status) => {
  try {
    const response = await fetchWithFallback(`/admin/users/${userId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAdminAuthHeaders()
      },
      body: JSON.stringify({ status })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to update user status');
    }

    return data;
  } catch (error) {
    console.error('Update user status error:', error);
    throw error;
  }
};

// Update user details
export const updateUserDetails = async (userId, updates) => {
  try {
    const response = await fetchWithFallback(`/admin/users/${userId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAdminAuthHeaders()
      },
      body: JSON.stringify(updates)
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to update user details');
    }

    return data;
  } catch (error) {
    console.error('Update user details error:', error);
    throw error;
  }
};

// Delete user
export const deleteUserById = async (userId) => {
  try {
    const response = await fetchWithFallback(`/admin/users/${userId}`, {
      method: 'DELETE',
      headers: getAdminAuthHeaders()
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to delete user');
    }

    return data;
  } catch (error) {
    console.error('Delete user error:', error);
    throw error;
  }
};

// Get dashboard stats
export const getDashboardStats = async () => {
  try {
    const response = await fetchWithFallback('/admin/dashboard/stats', {
      method: 'GET',
      headers: getAdminAuthHeaders()
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch dashboard stats');
    }

    return data.data.stats;
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    throw error;
  }
};
