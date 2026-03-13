import React, { useState, useEffect, useRef, useMemo } from 'react';
import styled, { ThemeProvider } from 'styled-components';
import { v4 as uuidv4 } from 'uuid';
import { getTheme } from '../../styles/themes';
import { AuthProvider, useAuth } from '../../contexts/AuthContext';
import { ToastProvider } from '../../contexts/ToastContext';
import { fetchModelsFromBackend } from '../../services/aiService';
import MobileChatWindow from './MobileChatWindow';
import MobileSidebar from './MobileSidebar';
import MobileSettingsPanel from './MobileSettingsPanel';
import LoginModal from '../LoginModal';
import ProfileModal from '../ProfileModal';
import ModelIcon from '../ModelIcon';
import OnboardingFlow from '../OnboardingFlow';
import { getDefaultChatTitle, isDefaultChatTitle } from '../../utils/chatLocalization';
import { useTranslation } from '../../contexts/TranslationContext';
import { appendDeepResearchModel, getPreferredModelId } from '../../config/modelConfig';
import { setBackendMode, shouldUseRealBackend } from '../../services/backendConfig';
import {
  readLocalStorageItem,
  readLocalStorageJSON,
  removeLocalStorageItem,
  writeLocalStorageItem
} from '../../utils/storage';

const MobileAppContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  height: 100dvh;
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
  padding: 10px 16px;
  background: ${props => {
    const bg = props.theme.sidebar || props.theme.background;
    if (bg.includes('gradient') || bg.includes('url(')) return bg;
    return bg.replace(/,\s*[\d.]+\)$/, ', 0.72)').replace(/rgb\(/, 'rgba(');
  }};
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border-bottom: 0.5px solid ${props => props.theme.border};
  min-height: 56px;
  flex-shrink: 0;
  z-index: 10;
  padding-top: max(10px, env(safe-area-inset-top));
  transition: background 0.3s ease;
`;

const MobileHeaderLeft = styled.div`
  display: flex;
  align-items: center;
  flex-shrink: 0;
`;

const MobileHeaderCenter = styled.div`
  flex: 1;
  display: flex;
  justify-content: center;
  min-width: 0;
`;

const MobileHeaderRight = styled.div`
  display: flex;
  align-items: center;
  flex-shrink: 0;
`;

const MenuButton = styled.button`
  background: none;
  border: none;
  color: ${props => props.theme.text};
  padding: 8px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  touch-action: manipulation;
  transition: all 0.2s cubic-bezier(0.25, 1, 0.5, 1);
  
  &:active {
    transform: scale(0.88);
    background: ${props => props.theme.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)'};
  }
  
  svg {
    width: 22px;
    height: 22px;
    stroke-width: 1.8;
  }
`;

const NewChatButton = styled.button`
  background: none;
  border: none;
  color: ${props => props.theme.primary || props.theme.text};
  padding: 8px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  touch-action: manipulation;
  transition: all 0.2s cubic-bezier(0.25, 1, 0.5, 1);
  
  &:active {
    transform: scale(0.88);
    background: ${props => props.theme.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)'};
  }
  
  svg {
    width: 22px;
    height: 22px;
    stroke-width: 1.8;
  }
`;

const AppTitle = styled.h1`
  font-size: 17px;
  font-weight: 600;
  margin: 0;
  color: ${props => props.theme.text};
  letter-spacing: -0.02em;
`;

const MobileContent = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
`;

const ModelSelectorStyled = styled.div``;

const ModelButton = styled.button`
  display: flex;
  align-items: center;
  padding: 7px 14px;
  background: ${props => props.theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'};
  border: 0.5px solid ${props => props.theme.border};
  border-radius: 20px;
  color: ${props => props.theme.text};
  cursor: pointer;
  touch-action: manipulation;
  gap: 7px;
  font-size: 15px;
  font-weight: 500;
  letter-spacing: -0.01em;
  transition: all 0.2s cubic-bezier(0.25, 1, 0.5, 1);
  max-width: 220px;
  
  &:active {
    transform: scale(0.96);
    background: ${props => props.theme.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)'};
  }

  span {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  svg:last-child {
    width: 14px;
    height: 14px;
    color: ${props => props.theme.text}66;
    flex-shrink: 0;
    transition: transform 0.2s ease;
  }
`;

const ModelMenuOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, ${props => props.$isOpen ? '0.4' : '0'});
  backdrop-filter: ${props => props.$isOpen ? 'blur(2px)' : 'none'};
  -webkit-backdrop-filter: ${props => props.$isOpen ? 'blur(2px)' : 'none'};
  z-index: 1002;
  pointer-events: ${props => props.$isOpen ? 'auto' : 'none'};
  transition: all 0.35s cubic-bezier(0.32, 0.72, 0, 1);
`;

const ModelMenuContainer = styled.div`
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: ${props => {
    const bg = props.theme.sidebar || props.theme.background;
    if (bg.includes('gradient') || bg.includes('url(')) return bg;
    return bg;
  }};
  backdrop-filter: blur(40px) saturate(180%);
  -webkit-backdrop-filter: blur(40px) saturate(180%);
  border-top-left-radius: 14px;
  border-top-right-radius: 14px;
  z-index: 1003;
  padding: 8px 16px 16px;
  padding-bottom: max(16px, env(safe-area-inset-bottom));
  box-shadow: 0 -8px 40px rgba(0,0,0,${props => props.theme.isDark ? '0.4' : '0.12'});
  max-height: 55vh;
  overflow-y: auto;
  transform: translateY(${props => props.$isOpen ? '0%' : '100%'});
  transition: transform 0.4s cubic-bezier(0.32, 0.72, 0, 1);
  
  &::-webkit-scrollbar { display: none; }
  scrollbar-width: none;

  &::before {
    content: '';
    display: block;
    width: 36px;
    height: 5px;
    background: ${props => props.theme.isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)'};
    border-radius: 3px;
    margin: 4px auto 14px;
  }
`;

const ModelMenuItem = styled.div`
  display: flex;
  align-items: center;
  padding: 11px 12px;
  border-radius: 12px;
  cursor: pointer;
  gap: 12px;
  transition: all 0.15s ease;
  
  &:active {
    transform: scale(0.98);
    background: ${props => props.theme.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)'};
  }
  
  &.selected {
    background: ${props => {
      const p = props.theme.primary;
      if (typeof p === 'string' && !p.includes('gradient')) return p + '18';
      return props.theme.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)';
    }};
  }
`;

const ModelMenuItemName = styled.span`
  font-size: 16px;
  font-weight: 400;
  color: ${props => props.theme.text};
  letter-spacing: -0.01em;
  
  .selected & {
    font-weight: 600;
  }
`;

const SectionHeaderStyled = styled.div`
  padding: 0 0 8px 0;
  text-align: center;
  font-size: 13px;
  font-weight: 600;
  color: ${props => props.theme.textSecondary || (props.theme.text + '88')};
  text-transform: uppercase;
  letter-spacing: 0.06em;
`;

const MobileAppContent = () => {
  const { user, updateSettings: updateUserSettings, loading } = useAuth();
  const { t } = useTranslation();
  
  const getLanguagePreference = () => {
    if (user?.settings?.language) {
      return user.settings.language;
    }

    const savedSettings = readLocalStorageJSON('settings');
    if (savedSettings?.language) {
      return savedSettings.language;
    }

    return 'en-US';
  };
  
  // State management
  const [chats, setChats] = useState(() => {
    try {
      const savedChats = localStorage.getItem('chats');
      if (savedChats) {
        const parsed = JSON.parse(savedChats);
        if (Array.isArray(parsed) && parsed.length > 0 && parsed.every(chat => chat.id && chat.title)) {
          return parsed;
        }
      }
    } catch (err) {
      console.error("Error loading chats from localStorage:", err);
    }
    const defaultChat = { id: uuidv4(), title: getDefaultChatTitle(getLanguagePreference()), messages: [] };
    return [defaultChat];
  });
  
  const [activeChat, setActiveChat] = useState(() => {
    try {
      const savedActiveChat = localStorage.getItem('activeChat');
      if (savedActiveChat) {
        const parsedActiveChat = JSON.parse(savedActiveChat);
        // Validate that the saved activeChat exists in the loaded chats
        const chatExists = chats.some(chat => chat.id === parsedActiveChat);
        if (chatExists) {
          return parsedActiveChat;
        }
      }
    } catch (err) {
      console.error("Error loading activeChat from localStorage:", err);
    }
    // Default to first chat if no valid activeChat
    return chats[0]?.id || null;
  });

  const [availableModels, setAvailableModels] = useState([]);
  
  const [selectedModel, setSelectedModel] = useState(() => {
    return readLocalStorageItem('selectedModel') || null;
  });

  const [settings, setSettings] = useState(() => {
    if (user && user.settings) {
      return {
        ...user.settings,
        useRealBackend: user.settings.useRealBackend ?? shouldUseRealBackend()
      };
    }
    
    const savedSettings = readLocalStorageJSON('settings');
    return savedSettings || {
      theme: 'light',
      fontSize: 'medium',
      fontFamily: 'system',
      sendWithEnter: true,
      showTimestamps: true,
      showModelIcons: true,
      showProfilePicture: true,
      messageAlignment: 'default',
      codeHighlighting: true,
      bubbleStyle: 'minimal',
      messageSpacing: 'comfortable',
      sidebarAutoCollapse: false,
      focusMode: false,
      highContrast: false,
      reducedMotion: false,
      lineSpacing: 'normal',
      useRealBackend: shouldUseRealBackend(),
      language: 'en-US'
    };
  });

  useEffect(() => {
    setBackendMode(settings.useRealBackend !== false);
  }, [settings.useRealBackend]);
  
  // UI state
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isModelMenuOpen, setIsModelMenuOpen] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Fetch models from backend
  useEffect(() => {
    const getBackendModels = async () => {
      try {
        const backendModels = await fetchModelsFromBackend();
        if (backendModels && backendModels.length > 0) {
          const allModels = appendDeepResearchModel(backendModels);
          setAvailableModels(allModels);

          const currentSelectedModelIsValid = allModels.some(m => m.id === selectedModel);
          if (!currentSelectedModelIsValid && allModels.length > 0) {
            setSelectedModel(getPreferredModelId(allModels));
          }
        } else {
          setAvailableModels([]);
          setSelectedModel(null);
        }
      } catch (error) {
        console.error('Failed to fetch models from backend:', error);
        setAvailableModels([]);
        setSelectedModel(null);
      }
    };
    
    getBackendModels();
  }, []);

  // Save to localStorage
  
  // Validate activeChat and ensure we always have a valid chat
  useEffect(() => {
    const currentChat = chats.find(chat => chat.id === activeChat);
    if (!currentChat && chats.length > 0) {
      // If activeChat doesn't exist but we have chats, set to first chat
      setActiveChat(chats[0].id);
    } else if (!currentChat && chats.length === 0) {
      // If no chats exist, create a new one
      const newChat = { id: uuidv4(), title: getDefaultChatTitle(getLanguagePreference()), messages: [] };
      setChats([newChat]);
      setActiveChat(newChat.id);
    }
  }, [chats, activeChat]);

  useEffect(() => {
    writeLocalStorageItem('chats', JSON.stringify(chats));
  }, [chats]);

  useEffect(() => {
    writeLocalStorageItem('activeChat', JSON.stringify(activeChat));
  }, [activeChat]);

  useEffect(() => {
    writeLocalStorageItem('selectedModel', selectedModel);
  }, [selectedModel]);
  
  useEffect(() => {
    if (!user) {
      writeLocalStorageItem('settings', JSON.stringify(settings));
    }
  }, [settings, user]);

  useEffect(() => {
    if (!settings?.language) return;
    const desiredTitle = getDefaultChatTitle(settings.language);
    setChats(prevChats => {
      let changed = false;
      const updatedChats = prevChats.map(chat => {
        const hasMessages = chat.messages && chat.messages.length > 0;
        if (!hasMessages && isDefaultChatTitle(chat.title) && chat.title !== desiredTitle) {
          changed = true;
          return { ...chat, title: desiredTitle };
        }
        return chat;
      });
      return changed ? updatedChats : prevChats;
    });
  }, [settings?.language]);

  // Check if onboarding is needed for new users
  useEffect(() => {
    if (user && !loading) {
      // Check if user has completed onboarding
      const hasCompletedOnboarding = readLocalStorageItem(`onboarding_completed_${user.id}`);
      
      // Show onboarding if:
      // 1. User hasn't completed onboarding AND
      // 2. User is not pending (they've been activated) AND
      // 3. User is not an admin (to avoid disrupting admin workflow)
      if (!hasCompletedOnboarding && user.status !== 'pending' && user.status !== 'admin') {
        setShowOnboarding(true);
      }
    }
  }, [user, loading]);

  // Functions for model selector (moved from MobileChatWindow.jsx)
  const getModelDisplay = (modelId) => {
    const model = availableModels.find(m => m.id === modelId);
    if (!model) return { name: t('models.selectPlaceholder'), provider: '' };
    let provider = model.isBackendModel ? t('models.provider.backend') : t('models.provider.local');
    if (model.id.includes('gemini')) provider = t('models.provider.google');
    if (model.id.includes('claude')) provider = t('models.provider.anthropic');
    if (model.id.includes('chatgpt')) provider = t('models.provider.openai');
    if (model.id.includes('nemotron')) provider = t('models.provider.nvidia');

    return {
      name: model.name || model.id,
      provider
    };
  };

  const handleModelSelect = (modelId) => {
    setSelectedModel(modelId); // Directly set selectedModel here
    setIsModelMenuOpen(false);
  };

  const currentModelDisplay = getModelDisplay(selectedModel);

  // Helper function to clean up model names for display
  const getCleanModelName = (modelName) => {
    if (!modelName) return '';
    
    // Remove provider prefix (everything before the colon)
    let cleanName = modelName;
    if (cleanName.includes(':')) {
      cleanName = cleanName.split(':')[1].trim();
    }
    
    // Remove "(free)" text
    cleanName = cleanName.replace(/\s*\(free\)\s*$/i, '');
    
    return cleanName;
  };

  // Chat management functions
  const createNewChat = () => {
    const currentLanguage = settings?.language || getLanguagePreference();
    const newChat = {
      id: uuidv4(),
      title: getDefaultChatTitle(currentLanguage),
      messages: []
    };
    setChats([newChat, ...chats]);
    setActiveChat(newChat.id);
    setIsSidebarOpen(false); // Close sidebar after creating new chat
  };

  const deleteChat = (chatId) => {
    const updatedChats = chats.filter(chat => chat.id !== chatId);
    
    if (updatedChats.length === 0) {
      const currentLanguage = settings?.language || getLanguagePreference();
      const newChat = {
        id: uuidv4(),
        title: getDefaultChatTitle(currentLanguage),
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
            title: isDefaultChatTitle(chat.title) && message.role === 'user' 
              ? message.content.slice(0, 30) + (message.content.length > 30 ? '...' : '')
              : chat.title
          };
          return updatedChat;
        }
        return chat;
      });
      writeLocalStorageItem('chats', JSON.stringify(updatedChats));
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
    setBackendMode(newSettings.useRealBackend !== false);
  };

  const handleModelChange = (modelId) => {
    setSelectedModel(modelId);
  };

  // Function to reset chats and start fresh
  const resetChats = () => {
    const newChat = { id: uuidv4(), title: getDefaultChatTitle(settings?.language || getLanguagePreference()), messages: [] };
    setChats([newChat]);
    setActiveChat(newChat.id);
    // Clear localStorage to start fresh
    removeLocalStorageItem('chats');
    removeLocalStorageItem('activeChat');
    console.log('Chats reset to fresh state');
  };

  // Handle onboarding completion
  const handleOnboardingComplete = (onboardingSettings) => {
    if (user) {
      // Mark onboarding as completed
      writeLocalStorageItem(`onboarding_completed_${user.id}`, 'true');
      
      // Apply the selected settings
      const newSettings = { ...settings, ...onboardingSettings };
      updateSettings(newSettings);
      
      // Hide onboarding
      setShowOnboarding(false);
    }
  };

  const currentChat = getCurrentChat();
  const currentTheme = useMemo(() => {
    if (settings.theme === 'custom') {
      const base = getTheme('light');
      const overrides = settings.customTheme || {};
      return {
        ...base,
        name: 'custom',
        background: overrides.background || base.background,
        sidebar: overrides.background || base.sidebar,
        chat: overrides.background || base.chat,
        text: overrides.text || base.text,
        border: overrides.border || base.border,
        primary: overrides.border || base.primary,
        inputBackground: overrides.background || base.inputBackground
      };
    }
    return getTheme(settings.theme);
  }, [settings.theme, settings.customTheme]);

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
          </MobileHeaderLeft>
          
          <MobileHeaderCenter>
            <ModelSelectorStyled>
              <ModelButton onClick={() => setIsModelMenuOpen(true)}>
                {currentModelDisplay && (
                  <ModelIcon modelId={selectedModel} size="small" />
                )}
                <span>{getCleanModelName(currentModelDisplay.name)}</span>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </ModelButton>
            </ModelSelectorStyled>
          </MobileHeaderCenter>
          
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

        {/* Model Selection Menu */}
        <ModelMenuOverlay $isOpen={isModelMenuOpen} onClick={() => setIsModelMenuOpen(false)} />
        <ModelMenuContainer $isOpen={isModelMenuOpen}>
          <SectionHeaderStyled>{t('models.sectionHeader')}</SectionHeaderStyled>
          {availableModels && availableModels.map(model => (
            <ModelMenuItem 
              key={model.id} 
              onClick={() => handleModelSelect(model.id)}
              className={selectedModel === model.id ? 'selected' : ''}
            >
              <ModelIcon modelId={model.id} size="medium" />
              <ModelMenuItemName>{getCleanModelName(model.name || model.id)}</ModelMenuItemName>
            </ModelMenuItem>
          ))}
        </ModelMenuContainer>
        
        {showOnboarding && (
          <OnboardingFlow onComplete={handleOnboardingComplete} />
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
