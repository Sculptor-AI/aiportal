import React, { createContext, useContext, useState, useCallback } from 'react';
import Toast from '../components/Toast';
import { v4 as uuidv4 } from 'uuid';

// Create context
const ToastContext = createContext();

// Toast provider component
export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  // Add a new toast
  const addToast = useCallback((toast) => {
    const id = uuidv4();
    const newToast = { id, ...toast };
    
    setToasts(prevToasts => [...prevToasts, newToast]);
    
    return id;
  }, []);

  // Remove a toast by ID
  const removeToast = useCallback((id) => {
    setToasts(prevToasts => prevToasts.filter(toast => toast.id !== id));
  }, []);

  // Helper methods for common toast types
  const showSuccessToast = useCallback((title, message, options = {}) => {
    return addToast({ type: 'success', title, message, ...options });
  }, [addToast]);

  const showErrorToast = useCallback((title, message, options = {}) => {
    return addToast({ type: 'error', title, message, ...options });
  }, [addToast]);

  const showWarningToast = useCallback((title, message, options = {}) => {
    return addToast({ type: 'warning', title, message, ...options });
  }, [addToast]);

  const showInfoToast = useCallback((title, message, options = {}) => {
    return addToast({ type: 'info', title, message, ...options });
  }, [addToast]);

  const showCustomToast = useCallback((title, message, options = {}) => {
    return addToast({ title, message, ...options });
  }, [addToast]);

  // Render toasts
  return (
    <ToastContext.Provider
      value={{
        addToast,
        removeToast,
        showSuccessToast,
        showErrorToast,
        showWarningToast,
        showInfoToast,
        showCustomToast
      }}
    >
      {children}
      {toasts.map(toast => (
        <Toast
          key={toast.id}
          type={toast.type}
          title={toast.title}
          message={toast.message}
          duration={toast.duration || 5000}
          bottom={toast.bottom}
          left={toast.left}
          customImage={toast.customImage}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </ToastContext.Provider>
  );
};

// Custom hook to use the toast context
export const useToast = () => {
  const context = useContext(ToastContext);
  
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  
  return context;
};

export default ToastContext; 