import React, { createContext, useState, useEffect, useContext } from 'react';
import { getCurrentUser, loginUser, logoutUser, registerUser, updateUserSettings, loginWithGoogle, adminLogin, adminLogout, getCurrentAdminUser } from '../services/authService';

// Create the Auth Context
const AuthContext = createContext();

// Custom hook to use the auth context
export const useAuth = () => {
  return useContext(AuthContext);
};

// Provider component to wrap the app
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [adminUser, setAdminUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check if user is already logged in
  useEffect(() => {
    const checkUser = async () => {
      try {
        const currentUser = getCurrentUser();
        const currentAdminUser = getCurrentAdminUser();
        setUser(currentUser);
        setAdminUser(currentAdminUser);
      } catch (err) {
        console.error('Authentication error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    checkUser();
  }, []);

  // Login function
  const login = async (username, password) => {
    setLoading(true);
    setError(null);
    try {
      const loggedInUser = await loginUser(username, password);
      setUser(loggedInUser);
      return loggedInUser;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Google login function
  const loginWithGoogleAuth = async () => {
    setLoading(true);
    setError(null);
    try {
      const loggedInUser = await loginWithGoogle();
      setUser(loggedInUser);
      return loggedInUser;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Register function
  const register = async (username, password, email) => {
    setLoading(true);
    setError(null);
    try {
      const result = await registerUser(username, password, email);
      // Registration with backend doesn't automatically log in, return success
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    setLoading(true);
    try {
      await logoutUser();
      setUser(null);
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Update user settings
  const updateSettings = async (newSettings) => {
    if (!user) return;
    
    setLoading(true);
    try {
      const updatedSettings = await updateUserSettings(user.username, newSettings);
      setUser(prev => ({
        ...prev,
        settings: updatedSettings
      }));
      return updatedSettings;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Admin login function
  const adminLoginAuth = async (username, password) => {
    setLoading(true);
    setError(null);
    try {
      const loggedInAdmin = await adminLogin(username, password);
      setAdminUser(loggedInAdmin);
      return loggedInAdmin;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Admin logout function
  const adminLogoutAuth = async () => {
    setLoading(true);
    try {
      await adminLogout();
      setAdminUser(null);
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Value to be provided to consumers
  const value = {
    user,
    adminUser,
    loading,
    error,
    login,
    register,
    logout,
    updateSettings,
    loginWithGoogle: loginWithGoogleAuth,
    adminLogin: adminLoginAuth,
    adminLogout: adminLogoutAuth
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;