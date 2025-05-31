import React, { useState, useEffect, useRef } from 'react';
import styled, { ThemeProvider } from 'styled-components';
import { v4 as uuidv4 } from 'uuid';
import { getTheme } from '../styles/themes';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { ToastProvider } from '../contexts/ToastContext';
import { fetchModelsFromBackend } from '../services/aiService';
import MobileChatWindow from './MobileChatWindow';
import MobileSidebar from './MobileSidebar';
import MobileSettingsPanel from './MobileSettingsPanel';
import LoginModal from './LoginModal';
import ProfileModal from './ProfileModal';

const MobileAppContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  height: 100dvh; /* Dynamic viewport height for mobile */
  width: 100vw;
  background: ${props => props.theme.background};
  color: ${props => props.theme.text};
  overflow: hidden;
  position: relative;
  -webkit-overflow-scrolling: touch;
  touch-action: manipulation;
`;

const MobileHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: ${props => props.theme.background};
  border-bottom: 1px solid ${props => props.theme.border};
  height: 60px;
  flex-shrink: 0;
  z-index: 10;
  
  /* Safe area for notched phones */
  padding-top: max(12px, env(safe-area-inset-top));
`;

const MobileHeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const MobileHeaderRight = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const MenuButton = styled.button`
  background: none;
  border: none;
  color: ${props => props.theme.text};
  padding: 8px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  touch-action: manipulation;
  
  &:active {
    background: ${props => props.theme.border};
  }
  
  svg {
    width: 20px;
    height: 20px;
  }
`;

const NewChatButton = styled.button`
  background: none;
  border: none;
  color: ${props => props.theme.text};
  padding: 8px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  touch-action: manipulation;
  
  &:active {
    background: ${props => props.theme.border};
  }
  
  svg {
    width: 20px;
    height: 20px;
  }
`;

const AppTitle = styled.h1`
  font-size: 18px;
  font-weight: 600;
  margin: 0;
  color: ${props => props.theme.text};
`;

const MobileContent = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
`;

const MobileAppContent = () => {
  const { user, updateSettings: updateUserSettings } = useAuth();
  
  // State management
  const [chats, setChats] = useState(() => {
    try {
      const savedChats = localStorage.getItem('chats');
      if (savedChats) {
        const parsed = JSON.parse(savedChats);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (err) {
      console.error("Error loading chats from localStorage:", err);
    }
    const defaultChat = { id: uuidv4(), title: 'New Chat', messages: [] };
    return [defaultChat];
  });
  
  const [activeChat, setActiveChat] = useState(() => {
    const savedActiveChat = localStorage.getItem('activeChat');
    return savedActiveChat ? JSON.parse(savedActiveChat) : chats[0]?.id;
  });

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

  const [settings, setSettings] = useState(() => {
    if (user && user.settings) {
      return user.settings;
    }
    
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
  
  // UI state
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // Fetch models from backend
  useEffect(() => {
    const getBackendModels = async () => {
      try {
        const backendModels = await fetchModelsFromBackend();
        if (backendModels && backendModels.length > 0) {
          const mergedModels = [...availableModels];
          
          backendModels.forEach(backendModel => {
            const existingIndex = mergedModels.findIndex(m => m.id === backendModel.id);
            
            if (existingIndex >= 0) {
              mergedModels[existingIndex] = {
                ...mergedModels[existingIndex],
                ...backendModel,
                isBackendModel: true
              };
            } else {
              mergedModels.push({
                ...backendModel,
                isBackendModel: true
              });
            }
          });
          
          setAvailableModels(mergedModels);
        }
      } catch (error) {
        console.error('Failed to fetch models from backend:', error);
      }
    };
    
    getBackendModels();
  }, []);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem('chats', JSON.stringify(chats));
  }, [chats]);

  useEffect(() => {
    localStorage.setItem('activeChat', JSON.stringify(activeChat));
  }, [activeChat]);

  useEffect(() => {
    localStorage.setItem('selectedModel', selectedModel);
  }, [selectedModel]);
  
  useEffect(() => {
    if (!user) {
      localStorage.setItem('settings', JSON.stringify(settings));
    }
  }, [settings, user]);

  // Chat management functions
  const createNewChat = () => {
    const newChat = {
      id: uuidv4(),
      title: 'New Chat',
      messages: []
    };
    setChats([...chats, newChat]);
    setActiveChat(newChat.id);
    setIsSidebarOpen(false); // Close sidebar after creating new chat
  };

  const deleteChat = (chatId) => {
    const updatedChats = chats.filter(chat => chat.id !== chatId);
    
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
          return updatedChat;
        }
        return chat;
      });
      localStorage.setItem('chats', JSON.stringify(updatedChats));
      return updatedChats;
    });
  };

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
    });
  };

  const getCurrentChat = () => {
    return chats.find(chat => chat.id === activeChat) || null;
  };

  // Modal toggles
  const toggleSettings = () => {
    setIsSettingsOpen(!isSettingsOpen);
    setIsSidebarOpen(false);
  };
  
  const toggleLogin = () => {
    setIsLoginOpen(!isLoginOpen);
    setIsSidebarOpen(false);
  };
  
  const toggleProfile = () => {
    if (user) {
      setIsProfileOpen(!isProfileOpen);
    } else {
      setIsLoginOpen(true);
    }
    setIsSidebarOpen(false);
  };
  
  const updateSettings = (newSettings) => {
    setSettings(newSettings);
    
    if (user) {
      updateUserSettings(newSettings);
    }
  };

  const handleModelChange = (modelId) => {
    setSelectedModel(modelId);
  };

  const currentChat = getCurrentChat();
  const currentTheme = getTheme(settings.theme);

  return (
    <ThemeProvider theme={currentTheme}>
      <MobileAppContainer>
        <MobileHeader>
          <MobileHeaderLeft>
            <MenuButton onClick={() => setIsSidebarOpen(true)}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </svg>
            </MenuButton>
            <AppTitle>Sculptor</AppTitle>
          </MobileHeaderLeft>
          
          <MobileHeaderRight>
            <NewChatButton onClick={createNewChat}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
            </NewChatButton>
          </MobileHeaderRight>
        </MobileHeader>
        
        <MobileContent>
          <MobileChatWindow 
            chat={currentChat}
            addMessage={addMessage}
            updateMessage={updateMessage}
            updateChatTitle={updateChatTitle}
            selectedModel={selectedModel}
            settings={settings}
            availableModels={availableModels}
            onModelChange={handleModelChange}
          />
        </MobileContent>
        
        <MobileSidebar 
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
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
        />
        
        {isSettingsOpen && (
          <MobileSettingsPanel 
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
      </MobileAppContainer>
    </ThemeProvider>
  );
};

// Main app wrapper with providers
const MobileApp = () => {
  return (
    <AuthProvider>
      <ToastProvider>
        <MobileAppContent />
      </ToastProvider>
    </AuthProvider>
  );
};

export default MobileApp;