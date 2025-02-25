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

const AppContainer = styled.div`
  display: flex;
  height: 100vh;
  overflow: hidden;
  background-color: ${props => props.theme.background};
  color: ${props => props.theme.text};
  
  @media (max-width: 768px) {
    flex-direction: column;
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
  const { user, updateSettings: updateUserSettings, loading } = useAuth();
  
  // Show loading state while checking authentication
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  
  // Show login modal if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      setIsLoginOpen(true);
    }
  }, [loading, user]);
  
  // Chat state
  const [chats, setChats] = useState(() => {
    // If not logged in, return empty state that will be replaced when logged in
    if (!user) {
      const defaultChat = { id: uuidv4(), title: 'New Chat', messages: [] };
      return [defaultChat];
    }
    
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
    { id: 'chatgpt-4o', name: 'ChatGPT 4o' }
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
      sendWithEnter: true,
      showTimestamps: true,
      showModelIcons: true,
      messageAlignment: 'left',
      codeHighlighting: true,
      openaiApiKey: '',
      anthropicApiKey: '',
      googleApiKey: ''
    };
  });
  
  // Modal states
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  // isLoginOpen is already defined above
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // Update settings when user changes
  useEffect(() => {
    if (user && user.settings) {
      setSettings(user.settings);
    }
  }, [user]);

  // Load chats from server when user logs in
  useEffect(() => {
    if (user) {
      // Try to load chats from server
      const loadChatsFromServer = async () => {
        try {
          const { getUserChats } = await import('./services/authService');
          const serverChats = await getUserChats();
          
          if (serverChats && Array.isArray(serverChats) && serverChats.length > 0) {
            console.log("Loaded chats from server:", serverChats);
            setChats(serverChats);
            setActiveChat(serverChats[0].id);
          }
        } catch (err) {
          console.error("Error loading chats from server:", err);
          // If there's an error, we'll just use what's in state already
        }
      };
      
      loadChatsFromServer();
    }
  }, [user]);
  
  // Save chats to server when they change and user is logged in
  useEffect(() => {
    if (user && chats.length > 0) {
      console.log("Saving chats to server:", chats);
      
      const saveChatsToServer = async () => {
        try {
          const { saveUserChats } = await import('./services/authService');
          await saveUserChats(chats);
        } catch (err) {
          console.error("Error saving chats to server:", err);
          // Continue without showing error to user
        }
      };
      
      // Use a debounce to avoid too many API calls
      const timeoutId = setTimeout(() => {
        saveChatsToServer();
      }, 1000);
      
      return () => clearTimeout(timeoutId);
    }
  }, [chats, user]);

  // Still save some basic preferences in localStorage for convenience
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
    setChats(updatedChats);
    
    // If the deleted chat was the active one, set a new active chat
    if (chatId === activeChat) {
      setActiveChat(updatedChats.length > 0 ? updatedChats[0].id : null);
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
    // If user is not authenticated, don't allow closing the login modal
    if (!user && isLoginOpen) {
      return;
    }
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
  
  return (
    <ThemeProvider theme={getTheme(settings.theme)}>
      <GlobalStyles />
      <AppContainer>
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
        />
        <ChatWindow 
          chat={getCurrentChat()}
          addMessage={addMessage}
          selectedModel={selectedModel}
          updateChatTitle={updateChatTitle}
          settings={settings}
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
    </ThemeProvider>
  );
};

export default AppWithAuth;