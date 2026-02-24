// authService.js
// Backend authentication service for AI Portal

// Prefer environment variable, otherwise default to same-origin (empty string)
const rawBaseUrl = import.meta.env.VITE_BACKEND_API_URL || '';

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

// Handle Google OAuth callback — if this page loaded with an id_token in the hash
// (i.e. we are the popup that Google redirected back to), send the token to the
// parent window via postMessage and close ourselves.
(function handleGoogleCallback() {
  const hash = window.location.hash;
  if (hash && hash.includes('id_token=') && window.opener) {
    const params = new URLSearchParams(hash.substring(1));
    const idToken = params.get('id_token');
    if (idToken) {
      window.opener.postMessage({ type: 'google-auth', idToken }, window.location.origin);
      window.close();
    }
  }
})();

// Google login using a direct OAuth popup
export const loginWithGoogle = () => {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  if (!clientId) {
    return Promise.reject(new Error('Google Client ID is not configured'));
  }

  return new Promise((resolve, reject) => {
    const redirectUri = window.location.origin;
    const nonce = Math.random().toString(36).substring(2);
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${encodeURIComponent(clientId)}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&response_type=id_token` +
      `&scope=openid email profile` +
      `&nonce=${nonce}` +
      `&prompt=select_account`;

    // Open popup
    const width = 500;
    const height = 600;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;
    const popup = window.open(
      authUrl,
      'google-login',
      `width=${width},height=${height},left=${left},top=${top},scrollbars=yes`
    );

    if (!popup) {
      reject(new Error('Popup was blocked. Please allow popups for this site and try again.'));
      return;
    }

    // Listen for the token from the popup via postMessage
    const onMessage = async (event) => {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type !== 'google-auth') return;

      window.removeEventListener('message', onMessage);
      clearInterval(closedCheck);
      clearTimeout(timeout);

      const { idToken } = event.data;
      if (!idToken) {
        reject(new Error('No ID token received from Google'));
        return;
      }

      try {
        const res = await fetch(buildApiUrl('/auth/google'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ idToken })
        });

        const data = await res.json();

        if (!res.ok) {
          reject(new Error(data.error || 'Google login failed'));
          return;
        }

        if (data.success && data.data) {
          const user = {
            ...data.data.user,
            accessToken: data.data.accessToken,
            refreshToken: data.data.refreshToken
          };
          sessionStorage.setItem('ai_portal_current_user', JSON.stringify(user));
          resolve(user);
        } else {
          reject(new Error('Invalid response format'));
        }
      } catch (err) {
        reject(err);
      }
    };

    window.addEventListener('message', onMessage);

    // Check if popup was closed manually
    const closedCheck = setInterval(() => {
      if (popup.closed) {
        clearInterval(closedCheck);
        window.removeEventListener('message', onMessage);
        clearTimeout(timeout);
        reject(new Error('Google sign-in was cancelled.'));
      }
    }, 1000);

    // Timeout after 2 minutes
    const timeout = setTimeout(() => {
      clearInterval(closedCheck);
      window.removeEventListener('message', onMessage);
      if (!popup.closed) popup.close();
      reject(new Error('Google sign-in timed out.'));
    }, 120000);
  });
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

// Admin Authentication Functions

// Admin login
export const adminLogin = async (username, password) => {
  try {
    const response = await fetch(buildApiUrl('/admin/auth/login'), {
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
      sessionStorage.setItem('ai_portal_admin_user', JSON.stringify(adminUser));
      
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
      await fetch(buildApiUrl('/admin/auth/logout'), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${adminUser.adminToken}`
        }
      });
    }
  } catch (error) {
    console.error('Admin logout error:', error);
  } finally {
    sessionStorage.removeItem('ai_portal_admin_user');
  }
};

// Get current admin user
export const getCurrentAdminUser = () => {
  const adminUserJSON = sessionStorage.getItem('ai_portal_admin_user');
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
    const response = await fetch(buildApiUrl('/admin/users'), {
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
    const response = await fetch(buildApiUrl(`/admin/users/${userId}`), {
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
    const response = await fetch(buildApiUrl(`/admin/users/${userId}/status`), {
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
    const response = await fetch(buildApiUrl(`/admin/users/${userId}`), {
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

// Get dashboard stats
export const getDashboardStats = async () => {
  try {
    const response = await fetch(buildApiUrl('/admin/dashboard/stats'), {
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