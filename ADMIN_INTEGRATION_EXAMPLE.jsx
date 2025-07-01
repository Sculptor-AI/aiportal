// ADMIN_INTEGRATION_EXAMPLE.jsx
// This file shows how to integrate the AdminPanel into your main App.jsx

import React, { useState } from 'react';
import AdminPanel from './components/AdminPanel';
import { useAuth } from './contexts/AuthContext';

// Example of how to add admin panel to your existing App.jsx
const AppWithAdminPanel = () => {
  const { user } = useAuth();
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
  
  // Check if current user has admin privileges
  const isAdmin = user?.role === 'admin';
  
  return (
    <div>
      {/* Your existing app content */}
      
      {/* Admin Panel Trigger - Add this to your sidebar, settings, or header */}
      {isAdmin && (
        <button 
          onClick={() => setIsAdminPanelOpen(true)}
          style={{
            padding: '10px 20px',
            background: '#007AFF',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer'
          }}
        >
          Admin Panel
        </button>
      )}
      
      {/* Admin Panel Modal */}
      {isAdminPanelOpen && (
        <AdminPanel closeModal={() => setIsAdminPanelOpen(false)} />
      )}
    </div>
  );
};

// Alternative: Add to existing settings panel
const SettingsPanelWithAdmin = ({ settings, updateSettings, closeModal }) => {
  const { user } = useAuth();
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
  const isAdmin = user?.role === 'admin';
  
  return (
    <div>
      {/* Your existing settings content */}
      
      {/* Add admin section to settings */}
      {isAdmin && (
        <div style={{ marginTop: '30px', paddingTop: '20px', borderTop: '1px solid #ddd' }}>
          <h3>Administration</h3>
          <button 
            onClick={() => setIsAdminPanelOpen(true)}
            style={{
              padding: '12px 24px',
              background: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '500'
            }}
          >
            Manage Users
          </button>
          <p style={{ fontSize: '0.9rem', color: '#666', marginTop: '8px' }}>
            Access user management, view statistics, and perform admin actions.
          </p>
        </div>
      )}
      
      {/* Admin Panel Modal */}
      {isAdminPanelOpen && (
        <AdminPanel closeModal={() => setIsAdminPanelOpen(false)} />
      )}
    </div>
  );
};

// Example: Add to sidebar navigation
const SidebarWithAdmin = () => {
  const { user } = useAuth();
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
  const isAdmin = user?.role === 'admin';
  
  return (
    <div className="sidebar">
      {/* Your existing sidebar content */}
      
      {/* Admin section at bottom of sidebar */}
      {isAdmin && (
        <div style={{ 
          marginTop: 'auto', 
          padding: '20px', 
          borderTop: '1px solid rgba(255,255,255,0.1)' 
        }}>
          <button 
            onClick={() => setIsAdminPanelOpen(true)}
            style={{
              width: '100%',
              padding: '12px',
              background: 'rgba(220, 53, 69, 0.1)',
              color: '#dc3545',
              border: '1px solid rgba(220, 53, 69, 0.3)',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '0.9rem',
              fontWeight: '500'
            }}
          >
            👨‍💼 Admin Panel
          </button>
        </div>
      )}
      
      {/* Admin Panel Modal */}
      {isAdminPanelOpen && (
        <AdminPanel closeModal={() => setIsAdminPanelOpen(false)} />
      )}
    </div>
  );
};

// Example: Keyboard shortcut activation
const useAdminShortcut = () => {
  const { user } = useAuth();
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
  const isAdmin = user?.role === 'admin';
  
  React.useEffect(() => {
    const handleKeyDown = (event) => {
      // Ctrl/Cmd + Shift + A to open admin panel
      if (isAdmin && event.ctrlKey && event.shiftKey && event.key === 'A') {
        event.preventDefault();
        setIsAdminPanelOpen(true);
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isAdmin]);
  
  return { isAdminPanelOpen, setIsAdminPanelOpen };
};

// Example: Context menu integration
const ContextMenuWithAdmin = ({ x, y, onClose }) => {
  const { user } = useAuth();
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
  const isAdmin = user?.role === 'admin';
  
  const handleAdminClick = () => {
    setIsAdminPanelOpen(true);
    onClose(); // Close context menu
  };
  
  return (
    <>
      <div 
        style={{
          position: 'fixed',
          top: y,
          left: x,
          background: 'white',
          border: '1px solid #ddd',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          zIndex: 1000
        }}
      >
        {/* Your existing context menu items */}
        
        {isAdmin && (
          <>
            <hr style={{ margin: '8px 0', border: 'none', borderTop: '1px solid #eee' }} />
            <button
              onClick={handleAdminClick}
              style={{
                width: '100%',
                padding: '8px 16px',
                background: 'none',
                border: 'none',
                textAlign: 'left',
                cursor: 'pointer',
                color: '#dc3545'
              }}
            >
              👨‍💼 Admin Panel
            </button>
          </>
        )}
      </div>
      
      {isAdminPanelOpen && (
        <AdminPanel closeModal={() => setIsAdminPanelOpen(false)} />
      )}
    </>
  );
};

export {
  AppWithAdminPanel,
  SettingsPanelWithAdmin,
  SidebarWithAdmin,
  useAdminShortcut,
  ContextMenuWithAdmin
};