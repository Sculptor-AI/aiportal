import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import styled, { ThemeProvider } from 'styled-components';
import Sidebar from './components/Sidebar';
import ChatWindow from './components/ChatWindow';
import SettingsModal from './components/SettingsModal';
import LoginModal from './components/LoginModal';
import ProfileModal from './components/ProfileModal';
import MobileApp from './components/mobile/MobileApp';
import OnboardingFlow from './components/OnboardingFlow';
import { v4 as uuidv4 } from 'uuid';
import { getTheme, GlobalStyles } from './styles/themes';
import { getAccentStyles } from './styles/accentColors';
import { getFontFamilyValue } from './styles/fontUtils';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import GlobalStylesProvider from './styles/GlobalStylesProvider';
import SharedChatView from './components/SharedChatView';
import { keyframes } from 'styled-components';
import { ToastProvider, useToast } from './contexts/ToastContext';
import { TranslationProvider } from './contexts/TranslationContext';
import { getDefaultChatTitle, isDefaultChatTitle } from './utils/chatLocalization';
import { fetchModelsFromBackend } from './services/aiService';
import NewSettingsPanel from './components/NewSettingsPanel';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import MediaPage from './pages/MediaPage';
import NewsPage from './pages/NewsPage';
import AdminPage from './pages/AdminPage';
import ProjectsPage from './pages/ProjectsPage';
import ProjectDetailPage from './pages/ProjectDetailPage';
import WorkspacePage from './pages/WorkspacePage';
import ForcedLoginScreen from './components/ForcedLoginScreen';
import MobileForcedLoginScreen from './components/mobile/MobileForcedLoginScreen';
import OAuthCallbackPage from './components/OAuthCallbackPage';

import ConfettiExplosion from './components/ConfettiExplosion';
import MatrixRain from './components/MatrixRain';
import useEasterEggs from './hooks/useEasterEggs';
import {
  DEFAULT_CUSTOM_BASE_MODEL_ID,
  getPreferredModelId
} from './config/modelConfig';
import { setBackendMode, shouldUseRealBackend } from './services/backendConfig';
import {
  readLocalStorageItem,
  readLocalStorageJSON,
  removeLocalStorageItem,
  writeLocalStorageItem
} from './utils/storage';

const WhiteboardModal = React.lazy(() => import('./components/WhiteboardModal'));
const EquationEditorModal = React.lazy(() => import('./components/EquationEditorModal'));
const GraphingModal = React.lazy(() => import('./components/GraphingModal'));
const FlowchartModal = React.lazy(() => import('./components/FlowchartModal'));
const Sandbox3DModal = React.lazy(() => import('./components/Sandbox3DModal'));
const DinosaurRunGame = React.lazy(() => import('./components/DinosaurRunGame'));

const AppContainer = styled.div`
  display: flex;
  height: 100vh;
  overflow: hidden;
  position: relative;
  color: ${props => props.theme.text};
  transition: background 0.3s ease;
`;

const MainContentArea = styled.div`
  flex: 1;
  display: flex;
  height: 100%;
  margin-left: 0;
  margin-right: 0;
  transition: margin-left 0.3s cubic-bezier(0.25, 1, 0.5, 1), margin-right 0.3s cubic-bezier(0.25, 1, 0.5, 1);
  
  @media (max-width: 768px) {
    margin-left: 0;
  }
`;

// Add back the floating hamburger button
const FloatingMenuButton = styled.button`
  position: absolute;
  left: 20px;
  top: 12px; // Align with the model selector row when the sidebar is collapsed
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
  top: ${props => props.$toolbarOpen ? '25%' : '28%'};
  left: ${props => {
    const sidebarOffset = props.$sidebarCollapsed ? 0 : 160;
    return `calc(50% + ${sidebarOffset}px)`;
  }};
  transform: translateX(-50%);
  max-width: 800px;
  width: 90%;
  text-align: center;
  z-index: 102;
  pointer-events: none;
  padding: 0 20px;
  box-sizing: border-box;
  transition: all 0.3s ease-out;
  
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  
  .logo {
    width: 44px;
    height: 44px;
    flex-shrink: 0;
    pointer-events: auto;
    cursor: pointer;
    opacity: 0.7;
    transition: opacity 0.2s ease, transform 0.2s ease;
    
    &:hover {
      opacity: 0.9;
      transform: scale(1.05);
    }
  }
  
  h1 {
    font-size: min(2.4rem, 7vw);
    font-weight: 550;
    color: ${props => props.theme.text};
    margin: 0;
    padding: 0;
    line-height: 1.15;
    letter-spacing: -0.03em;
    word-wrap: break-word;
    overflow-wrap: break-word;
    pointer-events: auto;
    cursor: pointer;
    transition: opacity 0.2s ease;
    opacity: 0.88;
    
    &:hover {
      opacity: 1;
    }
  }

  @media (max-width: 768px) {
    left: 50% !important;
    top: ${props => props.$toolbarOpen ? '22%' : '25%'};
    max-width: 90%;
    padding: 0 15px; 
    gap: 10px;
    
    .logo {
      width: 38px;
      height: 38px;
    }
    
    h1 {
      font-size: min(2rem, 6vw);
    }
  }

  @media (max-width: 480px) {
    left: 50% !important;
    top: ${props => props.$toolbarOpen ? '22%' : '25%'};
    max-width: 95%;
    padding: 0 10px; 
    gap: 8px;
    
    .logo {
      width: 34px;
      height: 34px;
    }
    
    h1 {
      font-size: min(1.75rem, 5.5vw);
    }
  }
`;

// App wrapper with authentication context
const AppWithAuth = () => {
  const [settingsLanguage, setSettingsLanguage] = useState('en-US');

  return (
    <AuthProvider>
      <ToastProvider>
        <TranslationProvider settingsLanguage={settingsLanguage}>
          <AppContent onSettingsLanguageChange={setSettingsLanguage} />
        </TranslationProvider>
      </ToastProvider>
    </AuthProvider>
  );
};

// Mobile detection hook
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      try {
        const userAgent = navigator.userAgent;
        const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
        const isMobileUA = mobileRegex.test(userAgent);
        const isSmallScreen = window.innerWidth <= 768;
        const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

        const shouldUseMobile = isMobileUA || (isSmallScreen && isTouchDevice);
        console.log('Mobile detection:', { userAgent, isMobileUA, isSmallScreen, isTouchDevice, shouldUseMobile });
        setIsMobile(shouldUseMobile);
      } catch (error) {
        console.error('Mobile detection error:', error);
        // Fallback to small screen detection
        setIsMobile(window.innerWidth <= 768);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return isMobile;
};

// Main app component
const AppContent = ({ onSettingsLanguageChange }) => {
  const { user, adminUser, updateSettings: updateUserSettings, loading, logout } = useAuth();
  const toast = useToast();
  const isMobile = useIsMobile();
  const location = useLocation();
  const navigate = useNavigate();

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

  const getEnabledCustomModels = () => {
    const customModels = readLocalStorageJSON('customModels', []);

    if (!Array.isArray(customModels)) {
      return [];
    }

    return customModels
      .filter(model => model.enabled)
      .map(model => ({
        id: `custom-${model.id}`,
        name: model.name,
        description: model.description,
        isCustomModel: true,
        systemPrompt: model.systemPrompt,
        avatar: model.avatar,
        avatarImage: model.avatarImage || null,
        avatarColor: model.avatarColor || null,
        provider: 'Custom Model',
        isBackendModel: false,
        baseModel: model.baseModel || DEFAULT_CUSTOM_BASE_MODEL_ID
      }));
  };

  // ALL HOOKS MUST BE DECLARED BEFORE ANY CONDITIONAL RETURNS
  const [hasAttachment, setHasAttachment] = useState(false);

  // Chat state
  const [chats, setChats] = useState(() => {
    try {
      const savedChats = localStorage.getItem('chats');
      if (savedChats) {
        const parsed = JSON.parse(savedChats);
        // Validate the parsed data is an array and has valid chat objects
        if (Array.isArray(parsed) && parsed.length > 0 && parsed.every(chat => chat.id && chat.title)) {
          console.log("Loaded chats from localStorage:", parsed);
          return parsed;
        }
      }
    } catch (err) {
      console.error("Error loading chats from localStorage:", err);
    }
    // Default chat if nothing valid in localStorage
    const defaultChat = { id: uuidv4(), title: getDefaultChatTitle(getLanguagePreference()), messages: [] };
    console.log("Using default chat:", defaultChat);
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

  // Project state
  const [projects, setProjects] = useState(() => {
    return readLocalStorageJSON('projects', []);
  });

  const [activeProject, setActiveProject] = useState(() => {
    return readLocalStorageJSON('activeProject', null);
  });

  const [pendingMessage, setPendingMessage] = useState(null);

  const [availableModels, setAvailableModels] = useState([]);

  const [selectedModel, setSelectedModel] = useState(() => {
    return readLocalStorageItem('selectedModel') || null;
  });

  // Fetch models from backend (now the ONLY source) and refresh periodically
  useEffect(() => {
    removeLocalStorageItem('cachedModels');

    const getBackendModels = async () => {
      const enabledCustomModels = getEnabledCustomModels();

      try {
        console.log('Fetching models from backend...');
        const backendModels = await fetchModelsFromBackend();

        // Combine backend models with enabled custom models
        const allModels = [
          ...(backendModels || []),
          ...enabledCustomModels
        ];

        if (allModels.length > 0) {
          setAvailableModels(allModels);
          console.log(`Loaded ${allModels.length} models (${backendModels?.length || 0} backend, ${enabledCustomModels.length} custom):`, allModels.map(m => m.id));

          // Set default model if none is selected or the selected one is no longer available
          const currentSelectedModelIsValid = allModels.some(m => m.id === selectedModel);
          if (!currentSelectedModelIsValid && allModels.length > 0) {
            const defaultModel = getPreferredModelId(allModels);
            setSelectedModel(defaultModel);
            console.log(`Set default model to: ${defaultModel}`);
          }
        } else {
          // If no models available
          console.warn('No models available');
          setAvailableModels([]);
          setSelectedModel(null);
        }
      } catch (error) {
        console.error('Failed to fetch models from backend:', error);

        setAvailableModels(enabledCustomModels);
        if (enabledCustomModels.length > 0 && !enabledCustomModels.some(m => m.id === selectedModel)) {
          const defaultModel = getPreferredModelId(enabledCustomModels);
          setSelectedModel(defaultModel);
        }
      }
    };

    // Initial load
    getBackendModels();

    // Refresh models every 5 minutes to catch newly added models
    const refreshInterval = setInterval(getBackendModels, 5 * 60 * 1000);

    // Also refresh when custom models change (listen for storage events)
    const handleStorageChange = (e) => {
      if (e.key === 'customModels') {
        getBackendModels();
      }
    };
    window.addEventListener('storage', handleStorageChange);

    return () => {
      clearInterval(refreshInterval);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Settings - from user account or localStorage
  const [settings, setSettings] = useState(() => {
    // If logged in, use user settings
    if (user && user.settings) {
      return {
        ...user.settings,
        useRealBackend: user.settings.useRealBackend ?? shouldUseRealBackend()
      };
    }

    // Otherwise, use localStorage
    const savedSettings = readLocalStorageJSON('settings');
    return savedSettings || {
      theme: 'light',
      accentColor: 'theme',
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
      showGreeting: true,
      useRealBackend: shouldUseRealBackend(),
      language: 'en-US'
    };
  });

  // Modal states
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(true);
  const [isWhiteboardOpen, setIsWhiteboardOpen] = useState(false);
  const [isEquationEditorOpen, setIsEquationEditorOpen] = useState(false);
  const [isGraphingOpen, setIsGraphingOpen] = useState(false);
  const [isFlowchartOpen, setIsFlowchartOpen] = useState(false);
  const [isSandbox3DOpen, setIsSandbox3DOpen] = useState(false);
  const [pendingScene, setPendingScene] = useState(null);
  const [isToolbarOpen, setIsToolbarOpen] = useState(false);
  const [flowchartData, setFlowchartData] = useState(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showDinosaurGame, setShowDinosaurGame] = useState(false);
  const chatWindowRef = useRef(null);
  const [isFocusModeActive, setIsFocusModeActive] = useState(false);
  const focusModeDefaultedRef = useRef(false);

  // Easter eggs hook
  const {
    showConfetti,
    showMatrix,
    closeConfetti,
    closeMatrix,
  } = useEasterEggs();

  // Lazy mount tracking for modals
  const [hasOpenedWhiteboard, setHasOpenedWhiteboard] = useState(false);
  const [hasOpenedEquationEditor, setHasOpenedEquationEditor] = useState(false);
  const [hasOpenedGraphing, setHasOpenedGraphing] = useState(false);
  const [hasOpenedFlowchart, setHasOpenedFlowchart] = useState(false);
  const [hasOpenedSandbox3D, setHasOpenedSandbox3D] = useState(false);

  useEffect(() => { if (isWhiteboardOpen) setHasOpenedWhiteboard(true); }, [isWhiteboardOpen]);
  useEffect(() => { if (isEquationEditorOpen) setHasOpenedEquationEditor(true); }, [isEquationEditorOpen]);
  useEffect(() => { if (isGraphingOpen) setHasOpenedGraphing(true); }, [isGraphingOpen]);
  useEffect(() => { if (isFlowchartOpen) setHasOpenedFlowchart(true); }, [isFlowchartOpen]);
  useEffect(() => { if (isSandbox3DOpen) setHasOpenedSandbox3D(true); }, [isSandbox3DOpen]);

  // Update settings when user changes
  useEffect(() => {
    if (user && user.settings) {
      setSettings({
        ...user.settings,
        useRealBackend: user.settings.useRealBackend ?? shouldUseRealBackend()
      });
    }
  }, [user]);

  useEffect(() => {
    if (onSettingsLanguageChange) {
      onSettingsLanguageChange(settings.language || 'en-US');
    }
  }, [settings.language, onSettingsLanguageChange]);

  useEffect(() => {
    setBackendMode(settings.useRealBackend !== false);
  }, [settings.useRealBackend]);

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

  // Handle custom event to open flowchart modal with AI-generated data
  useEffect(() => {
    const handleOpenFlowchartModal = (event) => {
      const { flowchartData } = event.detail;
      setFlowchartData(flowchartData);
      setIsFlowchartOpen(true);
    };

    window.addEventListener('openFlowchartModal', handleOpenFlowchartModal);

    return () => {
      window.removeEventListener('openFlowchartModal', handleOpenFlowchartModal);
    };
  }, []);

  useEffect(() => {
    const handleLoad3DScene = (event) => {
      setPendingScene(event.detail.objects);
      setIsSandbox3DOpen(true);
    };

    window.addEventListener('load3DScene', handleLoad3DScene);

    return () => {
      window.removeEventListener('load3DScene', handleLoad3DScene);
    };
  }, []);

  // Save chats to localStorage whenever they change
  // Note: Individual functions handle localStorage saving to avoid cyclic references

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
    writeLocalStorageItem('activeChat', JSON.stringify(activeChat));
  }, [activeChat]);

  useEffect(() => {
    writeLocalStorageItem('projects', JSON.stringify(projects));
  }, [projects]);

  useEffect(() => {
    writeLocalStorageItem('activeProject', JSON.stringify(activeProject));
  }, [activeProject]);

  useEffect(() => {
    writeLocalStorageItem('selectedModel', selectedModel);
  }, [selectedModel]);

  // Only save settings to localStorage if not logged in
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

  const createNewChat = (projectId = null, options = {}) => {
    const currentLanguage = settings?.language || getLanguagePreference();
    const newChat = {
      id: uuidv4(),
      title: getDefaultChatTitle(currentLanguage),
      messages: [],
      projectId: projectId,
    };
    setChats(prevChats => {
      const updatedChats = [newChat, ...prevChats];
      writeLocalStorageItem('chats', safeStringify(updatedChats));
      return updatedChats;
    });
    setActiveChat(newChat.id);

    if (options.initialMessage) {
      setPendingMessage(options.initialMessage);
    }

    // Navigate to chat tab unless caller explicitly keeps the current view.
    if (!options.stayOnCurrentRoute && location.pathname !== '/') {
      navigate('/');
    }

    return newChat;
  };

  const createNewProject = (projectData) => {
    const newProject = {
      id: uuidv4(),
      ...projectData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      starred: false,
      knowledge: [],
    };
    setProjects(prevProjects => [...prevProjects, newProject]);
    setActiveProject(newProject.id);
  };

  const addKnowledgeToProject = (projectId, file) => {
    setProjects(prevProjects => prevProjects.map(p => {
      if (p.id === projectId) {
        const newKnowledge = { id: uuidv4(), ...file };
        return { 
          ...p, 
          knowledge: [...(p.knowledge || []), newKnowledge],
          updatedAt: new Date().toISOString()
        };
      }
      return p;
    }));
  };

  const removeKnowledgeFromProject = (projectId, knowledgeId) => {
    setProjects(prevProjects => prevProjects.map(p => {
      if (p.id === projectId) {
        return {
          ...p,
          knowledge: (p.knowledge || []).filter(k => k.id !== knowledgeId),
          updatedAt: new Date().toISOString()
        };
      }
      return p;
    }));
  };

  const updateProjectInstructions = (projectId, instructions) => {
    setProjects(prevProjects => prevProjects.map(p => {
      if (p.id === projectId) {
        return {
          ...p,
          projectInstructions: instructions,
          updatedAt: new Date().toISOString()
        };
      }
      return p;
    }));
  };

  const updateProjectDescription = (projectId, description) => {
    setProjects(prevProjects => prevProjects.map(p => {
      if (p.id === projectId) {
        return {
          ...p,
          projectDescription: description,
          updatedAt: new Date().toISOString()
        };
      }
      return p;
    }));
  };

  const toggleProjectStar = (projectId) => {
    setProjects(prevProjects => prevProjects.map(p => {
      if (p.id === projectId) {
        return {
          ...p,
          starred: !p.starred,
          updatedAt: new Date().toISOString()
        };
      }
      return p;
    }));
  };

  const deleteChat = (chatId) => {
    const updatedChats = chats.filter(chat => chat.id !== chatId);

    // If this would delete the last chat, create a new one first
    if (updatedChats.length === 0) {
      const newChat = {
        id: uuidv4(),
        title: getDefaultChatTitle(settings?.language || getLanguagePreference()),
        messages: []
      };
      setChats([newChat]);
      setActiveChat(newChat.id);
      writeLocalStorageItem('chats', safeStringify([newChat]));
    } else {
      setChats(updatedChats);
      writeLocalStorageItem('chats', safeStringify(updatedChats));

      // If the deleted chat was the active one, set a new active chat
      if (chatId === activeChat) {
        setActiveChat(updatedChats.length > 0 ? updatedChats[0].id : null);
      }
    }
  };

  const deleteProject = (projectId) => {
    const updatedProjects = projects.filter(project => project.id !== projectId);
    setProjects(updatedProjects);
  };

  const updateChatTitle = (chatId, newTitle) => {
    setChats(prevChats => {
      const updatedChats = prevChats.map(chat => {
        if (chat.id === chatId) {
          return { ...chat, title: newTitle };
        }
        return chat;
      });
      writeLocalStorageItem('chats', safeStringify(updatedChats));
      return updatedChats;
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
          console.log('Adding message to chat:', updatedChat);
          return updatedChat;
        }
        return chat;
      });
      writeLocalStorageItem('chats', safeStringify(updatedChats));
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

  const toggleProfile = () => {
    setIsProfileOpen(!isProfileOpen);
  };

  useEffect(() => {
    if (!settings.focusMode && isFocusModeActive) {
      setIsFocusModeActive(false);
    }
  }, [settings.focusMode, isFocusModeActive]);

  // Update settings
  const updateSettings = (newSettings) => {
    setSettings(newSettings);

    // If logged in, also update user settings
    if (user) {
      updateUserSettings(newSettings);
    }
    setBackendMode(newSettings.useRealBackend !== false);
  };

  useEffect(() => {
    if (!focusModeDefaultedRef.current) {
      focusModeDefaultedRef.current = true;
      if (settings.focusMode) {
        updateSettings({ ...settings, focusMode: false });
      }
    }
  }, [settings.focusMode]);

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

  // Handle onboarding restart (for admin users)
  const handleRestartOnboarding = () => {
    if (user) {
      // Remove the onboarding completion marker
      removeLocalStorageItem(`onboarding_completed_${user.id}`);

      // Show onboarding again
      setShowOnboarding(true);
    }
  };

  const handleModelChange = (modelId) => {
    setSelectedModel(modelId);
    // Any other actions needed when model changes, like saving to storage
  };

  const handleUserTyping = useCallback(() => {
    if (settings.sidebarAutoCollapse && !collapsed) {
      setCollapsed(true);
    }
    if (settings.focusMode && !isFocusModeActive) {
      setIsFocusModeActive(true);
    }
  }, [settings.sidebarAutoCollapse, settings.focusMode, collapsed, isFocusModeActive]);

  const handleMessageSent = useCallback(() => {
    if (isFocusModeActive) {
      setIsFocusModeActive(false);
    }
  }, [isFocusModeActive]);

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

  // Double-click handler for the sculptor logo/text to activate the game
  const handleSculptorDoubleClick = () => {
    setShowDinosaurGame(true);
  };

  // Function to exit the game
  const handleExitGame = () => {
    setShowDinosaurGame(false);
  };

  // Chrome Demo Toast
  const showChromeToast = () => {
    // Detect if the user is using Chrome (and not Edge)
    const ua = navigator.userAgent.toLowerCase();
    const isChrome = ua.indexOf('chrome') > -1 && ua.indexOf('edg/') === -1 && ua.indexOf('opr/') === -1;

    if (isChrome) {
      // User is already using Chrome - show the success toast
      toast.showCustomToast(
        "Nice!",
        "",
        {
          customImage: '/images/firefox-logo.png', // Reverted to firefox logo path
          duration: 5000,
          bottom: '20px',
          left: '20px',
          type: 'success',
          successOverride: true
        }
      );
    } else {
      // User is not using Chrome - show the prompt toast with redirection
      toast.showCustomToast(
        "Chrome preferred",
        "This website works best with Chrome",
        {
          customImage: '/images/firefox-logo.png', // Reverted to firefox logo path
          duration: 10000, // Longer duration to give user time to click
          bottom: '20px',
          left: '20px',
          useTheme: true,
          onClick: () => {
            window.open('https://www.google.com/chrome/', '_blank', 'noopener,noreferrer');
          }
        }
      );
    }
  };

  // Show Chrome toast on component mount or page refresh
  useEffect(() => {
    // Show Chrome toast after a short delay
    const timer = setTimeout(() => {
      // showChromeToast(); // Commented out to remove the toast
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  // Helper function to safely serialize objects for localStorage
  const safeStringify = (obj) => {
    const seen = new WeakSet();
    return JSON.stringify(obj, (key, value) => {
      // Handle circular references
      if (typeof value === 'object' && value !== null) {
        if (seen.has(value)) {
          return undefined; // Remove circular reference
        }
        seen.add(value);
      }

      // Remove non-serializable values
      if (typeof value === 'function') {
        return undefined;
      }
      if (value instanceof Window) {
        return undefined;
      }
      if (value instanceof Document) {
        return undefined;
      }
      if (value instanceof HTMLElement) {
        return undefined;
      }

      return value;
    });
  };

  // Render logic
  const currentChat = getCurrentChat();
  const currentTheme = useMemo(() => {
    const buildCustomTheme = () => {
      if (settings.theme !== 'custom') return null;
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
    };

    const baseTheme = buildCustomTheme() || getTheme(settings.theme);
    const resolvedFontFamily = baseTheme.name === 'retro'
      ? baseTheme.fontFamily
      : getFontFamilyValue(settings.fontFamily || 'system');
    const accentStyles = getAccentStyles(baseTheme, settings.accentColor || 'theme');
    return { ...baseTheme, ...accentStyles, fontFamily: resolvedFontFamily };
  }, [settings.theme, settings.customTheme, settings.fontFamily, settings.accentColor]);

  // AUTHENTICATION CHECKS - After all hooks are declared
  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: '#f8f9fa'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '4px solid #e3e3e3',
          borderTop: '4px solid #007bff',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
      </div>
    );
  }

  // Force login if user is not authenticated
  if (!user) {
    if (location.pathname === '/auth/callback') {
      return <OAuthCallbackPage />;
    }

    return isMobile ? <MobileForcedLoginScreen /> : <ForcedLoginScreen />;
  }

  // Check if we should render the shared view
  if (window.location.pathname === '/share-view') {
    return (
      <ThemeProvider theme={currentTheme}>
        <GlobalStylesProvider settings={settings}>
          <SharedChatView />
        </GlobalStylesProvider>
      </ThemeProvider>
    );
  }

  // Debug info
  console.log('App render:', { isMobile, windowWidth: window.innerWidth });

  // Render mobile app for mobile devices
  if (isMobile) {
    return <MobileApp />;
  }

  // Otherwise, render the desktop app layout
  return (
    <ThemeProvider theme={currentTheme}>
      <GlobalStylesProvider settings={settings}>
        <GlobalStyles />
        <AppContainer className={`bubble-style-${settings.bubbleStyle || 'minimal'} message-spacing-${settings.messageSpacing || 'comfortable'} message-align-${settings.messageAlignment || 'default'}`}>
          <MainContentArea
            $equationEditorOpen={isEquationEditorOpen}
            $graphingOpen={isGraphingOpen}
            $flowchartOpen={isFlowchartOpen}
            $sandbox3DOpen={isSandbox3DOpen}
            $sidebarStyle={settings.sidebarStyle || 'floating'}
            $sidebarCollapsed={collapsed}
          >
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
            {getCurrentChat()?.messages.length === 0 && settings.showGreeting && !isMobile && location.pathname === '/' && !showDinosaurGame && (
              <MainGreeting
                $toolbarOpen={isToolbarOpen}
                $equationEditorOpen={isEquationEditorOpen}
                $graphingOpen={isGraphingOpen}
                $flowchartOpen={isFlowchartOpen}
                $sandbox3DOpen={isSandbox3DOpen}
                $sidebarCollapsed={collapsed}
              >
                <img src="/sculptor.svg" alt="Sculptor Logo" className="logo" onDoubleClick={handleSculptorDoubleClick} />
                <h1 onDoubleClick={handleSculptorDoubleClick}>Sculptor</h1>
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
              isAdmin={!!adminUser}
              onModelChange={handleModelChange}
              collapsed={collapsed}
              setCollapsed={setCollapsed}
              settings={settings}
              onSignOut={logout}
              focusModeActive={isFocusModeActive}
            />
            {console.log('Available models for ChatWindow:', availableModels)}
            <Routes>
              <Route path="/" element={
                <ChatWindow
                  ref={chatWindowRef}
                  chat={currentChat}
                  projects={projects}
                  pendingMessage={pendingMessage}
                  onPendingMessageConsumed={() => setPendingMessage(null)}
                  addMessage={addMessage}
                  updateMessage={updateMessage}
                  updateChatTitle={updateChatTitle}
                  selectedModel={selectedModel}
                  settings={settings}
                  $sidebarCollapsed={collapsed}
                  availableModels={availableModels}
                  onAttachmentChange={setHasAttachment}
                  onModelChange={handleModelChange}
                  showGreeting={settings.showGreeting}
                  isWhiteboardOpen={isWhiteboardOpen}
                  onToggleWhiteboard={() => setIsWhiteboardOpen(prev => !prev)}
                  onCloseWhiteboard={() => setIsWhiteboardOpen(false)}
                  isEquationEditorOpen={isEquationEditorOpen}
                  onToggleEquationEditor={() => setIsEquationEditorOpen(prev => !prev)}
                  onCloseEquationEditor={() => setIsEquationEditorOpen(false)}
                  isGraphingOpen={isGraphingOpen}
                  onToggleGraphing={() => setIsGraphingOpen(prev => !prev)}
                  onCloseGraphing={() => setIsGraphingOpen(false)}
                  isFlowchartOpen={isFlowchartOpen}
                  onToggleFlowchart={() => setIsFlowchartOpen(prev => !prev)}
                  onCloseFlowchart={() => setIsFlowchartOpen(false)}
                  isSandbox3DOpen={isSandbox3DOpen}
                  onToggleSandbox3D={() => setIsSandbox3DOpen(prev => !prev)}
                  onCloseSandbox3D={() => setIsSandbox3DOpen(false)}
                  onToolbarToggle={setIsToolbarOpen}
                  onUserTyping={handleUserTyping}
                  focusModeActive={isFocusModeActive}
                  onMessageSent={handleMessageSent}
                />
              } />
              <Route path="/auth/callback" element={<OAuthCallbackPage />} />
              <Route path="/media" element={<MediaPage collapsed={collapsed} />} />
              <Route path="/news" element={<NewsPage collapsed={collapsed} />} />
              <Route path="/admin" element={<AdminPage collapsed={collapsed} />} />
              <Route path="/projects" element={<ProjectsPage projects={projects} createNewProject={createNewProject} deleteProject={deleteProject} toggleProjectStar={toggleProjectStar} collapsed={collapsed} chats={chats} />} />
              <Route path="/workspace" element={<WorkspacePage collapsed={collapsed} />} />
              <Route path="/projects/:projectId" element={
                <ProjectDetailPage
                  projects={projects}
                  chats={chats}
                  createNewChat={createNewChat}
                  collapsed={collapsed}
                  setActiveChat={setActiveChat}
                  activeChat={activeChat}
                  addKnowledgeToProject={addKnowledgeToProject}
                  removeKnowledgeFromProject={removeKnowledgeFromProject}
                  updateProjectInstructions={updateProjectInstructions}
                  updateProjectDescription={updateProjectDescription}
                  toggleProjectStar={toggleProjectStar}
                  settings={settings}
                  availableModels={availableModels}
                  selectedModel={selectedModel}
                  onModelChange={handleModelChange}
                />
              } />
            </Routes>
          </MainContentArea>

          {/* Render panels in order: whiteboard, equation editor, graphing */}
          <React.Suspense fallback={null}>
            {hasOpenedWhiteboard && <WhiteboardModal
              isOpen={isWhiteboardOpen}
              onClose={() => setIsWhiteboardOpen(false)}
              onSubmit={(file) => {
                // Handle whiteboard submission through ChatWindow's file handler
                if (chatWindowRef.current && chatWindowRef.current.handleFileSelected) {
                  chatWindowRef.current.handleFileSelected(file);
                }
                setIsWhiteboardOpen(false);
              }}
              theme={currentTheme}
            />}

            {hasOpenedEquationEditor && <EquationEditorModal
              isOpen={isEquationEditorOpen}
              onClose={() => setIsEquationEditorOpen(false)}
              onSubmit={(latex) => {
                // Handle equation submission - add to chat input
                if (chatWindowRef.current && chatWindowRef.current.appendToInput) {
                  chatWindowRef.current.appendToInput(`$$\n${latex}\n$$ `);
                }
                setIsEquationEditorOpen(false);
              }}
              theme={currentTheme}
              otherPanelsOpen={(isWhiteboardOpen ? 1 : 0) + (isGraphingOpen ? 1 : 0) + (isFlowchartOpen ? 1 : 0) + (isSandbox3DOpen ? 1 : 0)}
            />}

            {hasOpenedGraphing && <GraphingModal
              isOpen={isGraphingOpen}
              onClose={() => setIsGraphingOpen(false)}
              onSubmit={(file) => {
                if (chatWindowRef.current && chatWindowRef.current.handleFileSelected) {
                  chatWindowRef.current.handleFileSelected(file);
                }
                setIsGraphingOpen(false);
              }}
              theme={currentTheme}
              otherPanelsOpen={(isWhiteboardOpen ? 1 : 0) + (isEquationEditorOpen ? 1 : 0) + (isFlowchartOpen ? 1 : 0) + (isSandbox3DOpen ? 1 : 0)}
            />}

            {hasOpenedFlowchart && <FlowchartModal
              isOpen={isFlowchartOpen}
              onClose={() => {
                setIsFlowchartOpen(false);
                setFlowchartData(null); // Clear flowchart data when closing
              }}
              onSubmit={(file) => {
                // Handle flowchart submission through ChatWindow's file handler
                if (chatWindowRef.current && chatWindowRef.current.handleFileSelected) {
                  chatWindowRef.current.handleFileSelected(file);
                }
                setIsFlowchartOpen(false);
                setFlowchartData(null); // Clear flowchart data after submission
              }}
              theme={currentTheme}
              otherPanelsOpen={(isWhiteboardOpen ? 1 : 0) + (isEquationEditorOpen ? 1 : 0) + (isGraphingOpen ? 1 : 0) + (isSandbox3DOpen ? 1 : 0)}
              aiFlowchartData={flowchartData}
            />}

            {hasOpenedSandbox3D && <Sandbox3DModal
              isOpen={isSandbox3DOpen}
              onClose={() => setIsSandbox3DOpen(false)}
              onSend={(objects) => {
                if (chatWindowRef.current && chatWindowRef.current.appendToInput) {
                  chatWindowRef.current.appendToInput(`\`\`\`json\n${JSON.stringify(objects, null, 2)}\n\`\`\``);
                }
              }}
              theme={currentTheme}
              otherPanelsOpen={(isWhiteboardOpen ? 1 : 0) + (isEquationEditorOpen ? 1 : 0) + (isGraphingOpen ? 1 : 0) + (isFlowchartOpen ? 1 : 0)}
              initialScene={pendingScene}
            />}
          </React.Suspense>

          {isSettingsOpen && (
            <NewSettingsPanel
              settings={settings}
              updateSettings={updateSettings}
              closeModal={() => setIsSettingsOpen(false)}
              onRestartOnboarding={handleRestartOnboarding}
            />
          )}

          {isProfileOpen && (
            <ProfileModal closeModal={() => setIsProfileOpen(false)} />
          )}

          {showOnboarding && (
            <OnboardingFlow onComplete={handleOnboardingComplete} />
          )}

          {showDinosaurGame && (
            <React.Suspense fallback={null}>
              <DinosaurRunGame
                onExit={handleExitGame}
                $toolbarOpen={isToolbarOpen}
                $sidebarCollapsed={collapsed}
                $whiteboardOpen={isWhiteboardOpen}
                $equationEditorOpen={isEquationEditorOpen}
                $graphingOpen={isGraphingOpen}
                $flowchartOpen={isFlowchartOpen}
                $sandbox3DOpen={isSandbox3DOpen}
              />
            </React.Suspense>
          )}

          {/* Easter Eggs */}
          {showConfetti && (
            <ConfettiExplosion onComplete={closeConfetti} />
          )}

          {showMatrix && (
            <MatrixRain onExit={closeMatrix} duration={15000} />
          )}
        </AppContainer>
      </GlobalStylesProvider>
    </ThemeProvider>
  );
};

export default AppWithAuth;
