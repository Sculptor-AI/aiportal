import React, { createContext, useState, useEffect, useContext } from 'react';
import { getCurrentUser, loginUser, logoutUser, registerUser, updateUserSettings, loginWithGoogle, adminLogin, adminLogout, getCurrentAdminUser, validateSession } from '../services/authService';

const SESSION_REVALIDATE_INTERVAL_MS = 60_000;

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

  // Check if user is already logged in, then verify the token with the backend
  // so an expired session redirects to the login screen before any user action.
  useEffect(() => {
    let cancelled = false;

    const checkUser = async () => {
      try {
        const currentUser = getCurrentUser();
        const currentAdminUser = getCurrentAdminUser();
        if (!cancelled) {
          setUser(currentUser);
          setAdminUser(currentAdminUser);
        }

        if (currentUser?.accessToken) {
          const validated = await validateSession();
          if (!cancelled && !validated) {
            setUser(null);
          }
        }
      } catch (err) {
        console.error('Authentication error:', err);
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    checkUser();
    return () => { cancelled = true; };
  }, []);

  // Listen for session expiry events dispatched by API services
  useEffect(() => {
    const handleSessionExpired = () => {
      console.warn('[AuthContext] Session expired, clearing auth state');
      setUser(null);
    };

    window.addEventListener('auth:session-expired', handleSessionExpired);
    return () => window.removeEventListener('auth:session-expired', handleSessionExpired);
  }, []);

  // Keep the session check warm: revalidate on tab focus and on a periodic
  // timer, so an expired token is detected without waiting for the user to
  // send a message.
  useEffect(() => {
    if (!user?.accessToken) return undefined;

    let cancelled = false;

    const revalidate = async () => {
      const validated = await validateSession();
      if (!cancelled && !validated) {
        setUser(null);
      }
    };

    const handleFocus = () => { revalidate(); };

    window.addEventListener('focus', handleFocus);
    const intervalId = setInterval(revalidate, SESSION_REVALIDATE_INTERVAL_MS);

    return () => {
      cancelled = true;
      window.removeEventListener('focus', handleFocus);
      clearInterval(intervalId);
    };
  }, [user?.accessToken]);

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