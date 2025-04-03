import React, { useState, useEffect } from 'react';
import styled, { ThemeProvider } from 'styled-components';
import Sidebar from './components/Sidebar';
import ChatWindow from './components/ChatWindow';
import SettingsModal from './components/SettingsModal';
import LoginModal from './components/LoginModal';
import ProfileModal from './components/ProfileModal';
import { v4 as uuidv4 } from 'uuid';
import { getTheme, GlobalStyles } from './styles/themes';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import GlobalStylesProvider from './styles/GlobalStylesProvider';
import SharedChatView from './components/SharedChatView';

const AppContainer = styled.div`
  display: flex;
  height: 100vh;
  overflow: hidden;
  background: ${props => props.theme.background};
  color: ${props => props.theme.text};
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: radial-gradient(circle at 30% 40%, rgba(255, 255, 255, 0.08) 0%, transparent 70%),
                radial-gradient(circle at 70% 60%, rgba(255, 255, 255, 0.06) 0%, transparent 60%);
    z-index: 0;
    pointer-events: none;
  }
  
  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

// Add this styled component for the floating hamburger button
const FloatingMenuButton = styled.button`
  position: absolute;
  left: 20px;
  top: 20px; // Aligned with chat title height
  z-index: 100;
  background: transparent;
  border: none;
  color: ${props => props.theme.text};
  cursor: pointer;
  width: 40px;
  height: 40px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s ease;
  
  &:hover {
    background: rgba(0, 0, 0, 0.05);
  }

  @media (max-width: 768px) {
    display: none;
  }
`;

// App wrapper with authentication context
const AppWithAuth = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

// Main app component
const AppContent = () => {
  const { user, updateSettings: updateUserSettings } = useAuth();
  
  // Chat state
  const [chats, setChats] = useState(() => {
    try {
      const savedChats = localStorage.getItem('chats');
      if (savedChats) {
        const parsed = JSON.parse(savedChats);
        // Validate the parsed data is an array
        if (Array.isArray(parsed) && parsed.length > 0) {
          console.log("Loaded chats from localStorage:", parsed);
          return parsed;
        }
      }
    } catch (err) {
      console.error("Error loading chats from localStorage:", err);
    }
    // Default chat if nothing valid in localStorage
    const defaultChat = { id: uuidv4(), title: 'New Chat', messages: [] };
    console.log("Using default chat:", defaultChat);
    return [defaultChat];
  });
  
  const [activeChat, setActiveChat] = useState(() => {
    const savedActiveChat = localStorage.getItem('activeChat');
    return savedActiveChat ? JSON.parse(savedActiveChat) : chats[0]?.id;
  });

  // Models
  const [availableModels, setAvailableModels] = useState([
    { id: 'gemini-2-flash', name: 'Gemini 2 Flash' },
    { id: 'claude-3.7-sonnet', name: 'Claude 3.7 Sonnet' },
    { id: 'chatgpt-4o', name: 'ChatGPT 4o' },
    { id: 'nemotron-super-49b', name: 'Nemotron 49B' },
    { id: 'ursa-minor', name: 'Ursa Minor' }
  ]);
  
  const [selectedModel, setSelectedModel] = useState(() => {
    const savedModel = localStorage.getItem('selectedModel');
    return savedModel || 'gemini-2-flash';
  });
  
  // Settings - from user account or localStorage
  const [settings, setSettings] = useState(() => {
    // If logged in, use user settings
    if (user && user.settings) {
      return user.settings;
    }
    
    // Otherwise, use localStorage
    const savedSettings = localStorage.getItem('settings');
    return savedSettings ? JSON.parse(savedSettings) : {
      theme: 'light',
      fontSize: 'medium',
      fontFamily: 'system',
      sendWithEnter: true,
      showTimestamps: true,
      showModelIcons: true,
      messageAlignment: 'left',
      codeHighlighting: true,
      bubbleStyle: 'modern',
      messageSpacing: 'comfortable',
      sidebarAutoCollapse: false,
      focusMode: false,
      highContrast: false,
      reducedMotion: false,
      lineSpacing: 'normal',
      openaiApiKey: '',
      anthropicApiKey: '',
      googleApiKey: ''
    };
  });
  
  // Modal states
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  // Update settings when user changes
  useEffect(() => {
    if (user && user.settings) {
      setSettings(user.settings);
    }
  }, [user]);

  // Save chats to localStorage whenever they change
  useEffect(() => {
    console.log("Saving chats to localStorage:", chats);
    localStorage.setItem('chats', JSON.stringify(chats));
  }, [chats]);

  useEffect(() => {
    localStorage.setItem('activeChat', JSON.stringify(activeChat));
  }, [activeChat]);

  useEffect(() => {
    localStorage.setItem('selectedModel', selectedModel);
  }, [selectedModel]);
  
  // Only save settings to localStorage if not logged in
  useEffect(() => {
    if (!user) {
      localStorage.setItem('settings', JSON.stringify(settings));
    }
  }, [settings, user]);

  const createNewChat = () => {
    const newChat = {
      id: uuidv4(),
      title: 'New Chat',
      messages: []
    };
    setChats([...chats, newChat]);
    setActiveChat(newChat.id);
  };

  const deleteChat = (chatId) => {
    const updatedChats = chats.filter(chat => chat.id !== chatId);
    
    // If this would delete the last chat, create a new one first
    if (updatedChats.length === 0) {
      const newChat = {
        id: uuidv4(),
        title: 'New Chat',
        messages: []
      };
      setChats([newChat]);
      setActiveChat(newChat.id);
    } else {
      setChats(updatedChats);
      
      // If the deleted chat was the active one, set a new active chat
      if (chatId === activeChat) {
        setActiveChat(updatedChats.length > 0 ? updatedChats[0].id : null);
      }
    }
  };
  
  const updateChatTitle = (chatId, newTitle) => {
    setChats(prevChats => {
      return prevChats.map(chat => {
        if (chat.id === chatId) {
          return { ...chat, title: newTitle };
        }
        return chat;
      });
    });
  };
  
  const addMessage = (chatId, message) => {
    setChats(prevChats => {
      const updatedChats = prevChats.map(chat => {
        if (chat.id === chatId) {
          const updatedChat = {
            ...chat,
            messages: [...chat.messages, message],
            // If this is the first user message, set the chat title to the first few words
            title: chat.title === 'New Chat' && message.role === 'user' 
              ? message.content.slice(0, 30) + (message.content.length > 30 ? '...' : '')
              : chat.title
          };
          console.log('Adding message to chat:', updatedChat);
          return updatedChat;
        }
        return chat;
      });
      
      // Save to localStorage for persistence
      localStorage.setItem('chats', JSON.stringify(updatedChats));
      
      return updatedChats;
    });
  };

  const getCurrentChat = () => {
    return chats.find(chat => chat.id === activeChat) || null;
  };

  // Modal toggles
  const toggleSettings = () => {
    setIsSettingsOpen(!isSettingsOpen);
  };
  
  const toggleLogin = () => {
    setIsLoginOpen(!isLoginOpen);
  };
  
  const toggleProfile = () => {
    if (user) {
      setIsProfileOpen(!isProfileOpen);
    } else {
      setIsLoginOpen(true);
    }
  };
  
  // Update settings
  const updateSettings = (newSettings) => {
    setSettings(newSettings);
    
    // If logged in, also update user settings
    if (user) {
      updateUserSettings(newSettings);
    }
  };

  const handleModelChange = (modelId) => {
    setSelectedModel(modelId);
    // Any other actions needed when model changes, like saving to storage
  };
  
  // Render logic
  const currentChat = getCurrentChat();
  const currentTheme = getTheme(settings.theme);

  // Check if we should render the shared view
  if (window.location.pathname === '/share-view') {
    return (
      <ThemeProvider theme={currentTheme}>
        <GlobalStylesProvider />
        <SharedChatView />
      </ThemeProvider>
    );
  }

  // Otherwise, render the main app layout
  return (
    <ThemeProvider theme={currentTheme}>
      <GlobalStylesProvider settings={settings}>
        <GlobalStyles />
        <AppContainer className={`bubble-style-${settings.bubbleStyle || 'modern'} message-spacing-${settings.messageSpacing || 'comfortable'}`}>
          {collapsed && (
            <FloatingMenuButton onClick={() => setCollapsed(false)}>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </svg>
            </FloatingMenuButton>
          )}
          <Sidebar 
            chats={chats}
            activeChat={activeChat}
            setActiveChat={setActiveChat}
            createNewChat={createNewChat}
            deleteChat={deleteChat}
            availableModels={availableModels}
            selectedModel={selectedModel}
            setSelectedModel={setSelectedModel}
            toggleSettings={toggleSettings}
            toggleProfile={toggleProfile}
            isLoggedIn={!!user}
            username={user?.username}
            onModelChange={handleModelChange}
            collapsed={collapsed || (settings.sidebarAutoCollapse && getCurrentChat()?.messages?.length > 0)}
            setCollapsed={setCollapsed}
          />
          <ChatWindow 
            chat={getCurrentChat()}
            addMessage={addMessage}
            selectedModel={selectedModel}
            updateChatTitle={updateChatTitle}
            settings={settings}
            onModelChange={handleModelChange}
            focusMode={settings.focusMode}
          />
        
          {/* Modals */}
          {isSettingsOpen && (
            <SettingsModal 
              settings={settings}
              updateSettings={updateSettings}
              closeModal={() => setIsSettingsOpen(false)}
            />
          )}
          
          {isLoginOpen && (
            <LoginModal 
              closeModal={() => setIsLoginOpen(false)}
            />
          )}
          
          {isProfileOpen && (
            <ProfileModal 
              closeModal={() => setIsProfileOpen(false)}
            />
          )}
        </AppContainer>
      </GlobalStylesProvider>
    </ThemeProvider>
  );
};

export default AppWithAuth;