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
import { keyframes } from 'styled-components';
import { ToastProvider, useToast } from './contexts/ToastContext';

const AppContainer = styled.div`
  display: flex;
  height: 100vh;
  overflow: hidden;
  position: relative;
  background: ${props => props.theme.background};
  color: ${props => props.theme.text};
  transition: background 0.3s ease;
  
  ${props => props.sidebarCollapsed && `
    @media (min-width: 769px) {
      padding-left: 0;
    }
  `}
`;

// Add back the floating hamburger button
const FloatingMenuButton = styled.button`
  position: absolute;
  left: 20px;
  top: 9px; // Adjusted to vertically align with chat title
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

// Main Greeting Component
const MainGreeting = styled.div`
  position: fixed;
  top: 35%; /* Adjusted lower: Default for larger screens */
  left: ${props => props.sidebarCollapsed ? '50%' : 'calc(50% + 140px)'}; /* 140px is half of sidebar width 280px */
  transform: translateX(-50%);
  max-width: 800px; 
  text-align: center;
  z-index: 4;
  pointer-events: none;
  padding: 0 20px; /* Horizontal padding */
  transition: left 0.3s ease-out, top 0.3s ease-out; /* Added top to transition */
  
  h1 {
    font-size: min(2.4rem, 7vw); /* Responsive font size */
    font-weight: 500;
    color: ${props => props.theme.text};
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column; /* Allow text to wrap */
    align-items: center;
    justify-content: center;
    gap: 0px; 
    line-height: 1.2; 
  }

  /* Adjustments for medium to small screens */
  @media (max-width: 768px) {
    left: 50%; /* Override: Always viewport center on smaller screens */
    top: 30%; /* Adjusted lower: For tablets and smaller */
    padding: 0 15px; 
    h1 {
      font-size: min(2rem, 6.5vw); 
      gap: 4px; 
    }
  }

  /* Adjustments for very small screens */
  @media (max-width: 480px) {
    left: 50%; /* Override: Always viewport center on very small screens */
    top: 28%; /* Adjusted lower: For very small screens */
    padding: 0 10px; 
    h1 {
      font-size: min(1.8rem, 6vw); 
    }
  }
`;

// App wrapper with authentication context
const AppWithAuth = () => {
  return (
    <AuthProvider>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </AuthProvider>
  );
};

// Main app component
const AppContent = () => {
  const { user, updateSettings: updateUserSettings } = useAuth();
  const toast = useToast();
  
  // Greeting messages
  const greetingMessages = [
    "Look who decided to show up",
    "Back for more AI wisdom",
    "Oh great, it's you again",
    "Lemme guess, essay due in an hour",
    "You again? Don't you sleep",
    "You treat me like Google with trauma",
    "I was just about to take a nap, but okay"
  ];
  
  // Get random greeting message
  const getRandomGreeting = () => {
    const randomIndex = Math.floor(Math.random() * greetingMessages.length);
    return greetingMessages[randomIndex];
  };
  
  // State for greeting message
  const [greeting, setGreeting] = useState(getRandomGreeting());
  const [hasAttachment, setHasAttachment] = useState(false);
  
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
      lineSpacing: 'normal'
    };
  });
  
  // Modal states
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(true);

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
            title: chat.title === 'New Chat' && message.role === 'user' 
              ? message.content.slice(0, 30) + (message.content.length > 30 ? '...' : '')
              : chat.title
          };
          console.log('Adding message to chat:', updatedChat);
          return updatedChat;
        }
        return chat;
      });
      localStorage.setItem('chats', JSON.stringify(updatedChats));
      return updatedChats;
    });
  };

  // New function to update a specific message within a chat
  const updateMessage = (chatId, messageId, updates) => {
    setChats(prevChats => {
      return prevChats.map(chat => {
        if (chat.id === chatId) {
          return {
            ...chat,
            messages: chat.messages.map(msg => 
              msg.id === messageId ? { ...msg, ...updates } : msg
            )
          };
        }
        return chat;
      });
      // Note: No need to save to localStorage here, as `chats` useEffect will handle it
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
  
  // Firefox Demo Toast
  const showFirefoxToast = () => {
    // Detect if the user is using Firefox
    const isFirefox = navigator.userAgent.toLowerCase().indexOf('firefox') > -1;
    
    if (isFirefox) {
      // User is already using Firefox - show the success toast
      toast.showCustomToast(
        "Nice!", 
        "", 
        { 
          customImage: '/images/firefox-logo.png',
          duration: 5000,
          bottom: '20px',
          left: '20px',
          type: 'success',
          successOverride: true
        }
      );
    } else {
      // User is not using Firefox - show the prompt toast with redirection
      toast.showCustomToast(
        "Firefox preferred", 
        "This website works best with Firefox", 
        { 
          customImage: '/images/firefox-logo.png',
          duration: 10000, // Longer duration to give user time to click
          bottom: '20px',
          left: '20px',
          useTheme: true,
          onClick: () => {
            window.open('https://www.mozilla.org/en-US/firefox/new/?xv=refresh-new&v=a', '_blank');
          }
        }
      );
    }
  };

  // Show Firefox toast on component mount or page refresh
  useEffect(() => {
    // Show Firefox toast after a short delay
    const timer = setTimeout(() => {
      showFirefoxToast();
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);

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
        <AppContainer sidebarCollapsed={collapsed} className={`bubble-style-${settings.bubbleStyle || 'modern'} message-spacing-${settings.messageSpacing || 'comfortable'}`}>
          {collapsed && (
            <FloatingMenuButton onClick={() => setCollapsed(false)}>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </svg>
            </FloatingMenuButton>
          )}
          
          {/* Main greeting that appears at the top of the page */}
          {getCurrentChat()?.messages?.length === 0 && !hasAttachment && (
            <MainGreeting sidebarCollapsed={collapsed}>
              <h1>
                {greeting}{user ? `, ${user.username}` : ''} 
              </h1>
            </MainGreeting>
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
            collapsed={collapsed} 
            setCollapsed={setCollapsed} 
          />
          <ChatWindow 
            chat={currentChat}
            addMessage={addMessage}
            updateMessage={updateMessage}
            updateChatTitle={updateChatTitle}
            selectedModel={selectedModel}
            settings={settings}
            focusMode={settings.focusMode}
            onAttachmentChange={setHasAttachment}
          />
        
          {isSettingsOpen && (
            <SettingsModal 
              settings={settings}
              updateSettings={updateSettings}
              closeModal={() => setIsSettingsOpen(false)}
            />
          )}
          
          {isLoginOpen && (
            <LoginModal closeModal={() => setIsLoginOpen(false)} />
          )}
          
          {isProfileOpen && (
            <ProfileModal closeModal={() => setIsProfileOpen(false)} />
          )}
        </AppContainer>
      </GlobalStylesProvider>
    </ThemeProvider>
  );
};

export default AppWithAuth;