// adminService.js
// Backend admin service for user management

import { getAuthHeaders } from './authService';

// Backend API base URL
const BACKEND_API_BASE = import.meta.env.VITE_BACKEND_API_URL ? 
  (import.meta.env.VITE_BACKEND_API_URL.endsWith('/api') ? 
    import.meta.env.VITE_BACKEND_API_URL : 
    `${import.meta.env.VITE_BACKEND_API_URL}/api`) : 
  'http://73.118.140.130:3000/api';

// Helper function to build API URLs
const buildApiUrl = (endpoint) => {
  if (!endpoint) return BACKEND_API_BASE;
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${BACKEND_API_BASE}${cleanEndpoint}`;
};

// Get all users (admin only)
export const getAllUsers = async (page = 1, limit = 50, search = '', status = '', role = '') => {
  try {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(search && { search }),
      ...(status && { status }),
      ...(role && { role })
    });

    const response = await fetch(buildApiUrl(`/admin/users?${params}`), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch users');
    }

    return data.data;
  } catch (error) {
    console.error('Get users error:', error);
    throw error;
  }
};

// Get user by ID (admin only)
export const getUserById = async (userId) => {
  try {
    const response = await fetch(buildApiUrl(`/admin/users/${userId}`), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch user');
    }

    return data.data;
  } catch (error) {
    console.error('Get user error:', error);
    throw error;
  }
};

// Update user (admin only)
export const updateUser = async (userId, updates) => {
  try {
    const response = await fetch(buildApiUrl(`/admin/users/${userId}`), {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify(updates)
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to update user');
    }

    return data.data;
  } catch (error) {
    console.error('Update user error:', error);
    throw error;
  }
};

// Suspend user (admin only)
export const suspendUser = async (userId, reason = '') => {
  try {
    const response = await fetch(buildApiUrl(`/admin/users/${userId}/suspend`), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify({ reason })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to suspend user');
    }

    return data.data;
  } catch (error) {
    console.error('Suspend user error:', error);
    throw error;
  }
};

// Activate user (admin only)
export const activateUser = async (userId) => {
  try {
    const response = await fetch(buildApiUrl(`/admin/users/${userId}/activate`), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to activate user');
    }

    return data.data;
  } catch (error) {
    console.error('Activate user error:', error);
    throw error;
  }
};

// Delete user (admin only)
export const deleteUser = async (userId) => {
  try {
    const response = await fetch(buildApiUrl(`/admin/users/${userId}`), {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to delete user');
    }

    return data.data;
  } catch (error) {
    console.error('Delete user error:', error);
    throw error;
  }
};

// Bulk user operations (admin only)
export const bulkUserAction = async (action, userIds, options = {}) => {
  try {
    const response = await fetch(buildApiUrl('/admin/users/bulk'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify({
        action,
        userIds,
        options
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to perform bulk action');
    }

    return data.data;
  } catch (error) {
    console.error('Bulk action error:', error);
    throw error;
  }
};

// Get user statistics (admin only)
export const getUserStats = async () => {
  try {
    const response = await fetch(buildApiUrl('/admin/stats/users'), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch user statistics');
    }

    return data.data;
  } catch (error) {
    console.error('Get user stats error:', error);
    throw error;
  }
};

// Get user activity logs (admin only)
export const getUserActivityLogs = async (userId, page = 1, limit = 50) => {
  try {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString()
    });

    const response = await fetch(buildApiUrl(`/admin/users/${userId}/activity?${params}`), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch user activity logs');
    }

    return data.data;
  } catch (error) {
    console.error('Get user activity logs error:', error);
    throw error;
  }
};

// Reset user password (admin only)
export const resetUserPassword = async (userId) => {
  try {
    const response = await fetch(buildApiUrl(`/admin/users/${userId}/reset-password`), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to reset user password');
    }

    return data.data;
  } catch (error) {
    console.error('Reset password error:', error);
    throw error;
  }
};

// Export user data (admin only)
export const exportUserData = async (format = 'csv', filters = {}) => {
  try {
    const response = await fetch(buildApiUrl('/admin/users/export'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify({
        format,
        filters
      })
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Failed to export user data');
    }

    // Handle file download
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `users_export_${new Date().toISOString().split('T')[0]}.${format}`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);

    return { success: true };
  } catch (error) {
    console.error('Export user data error:', error);
    throw error;
  }
};

// Check if current user has admin privileges
export const checkAdminPrivileges = async () => {
  try {
    const response = await fetch(buildApiUrl('/admin/check'), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to check admin privileges');
    }

    return data.data.isAdmin;
  } catch (error) {
    console.error('Check admin privileges error:', error);
    return false;
  }
};