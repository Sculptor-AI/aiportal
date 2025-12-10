import React, { useState, useEffect, useRef } from 'react';
import styled, { ThemeProvider } from 'styled-components';
import Sidebar from './components/Sidebar';
import ChatWindow from './components/ChatWindow';
import SettingsModal from './components/SettingsModal';
import LoginModal from './components/LoginModal';
import ProfileModal from './components/ProfileModal';
import MobileApp from './components/mobile/MobileApp';
import WhiteboardModal from './components/WhiteboardModal';
import EquationEditorModal from './components/EquationEditorModal';
import GraphingModal from './components/GraphingModal';
import FlowchartModal from './components/FlowchartModal';
import Sandbox3DModal from './components/Sandbox3DModal';
import OnboardingFlow from './components/OnboardingFlow';
import { v4 as uuidv4 } from 'uuid';
import { getTheme, GlobalStyles } from './styles/themes';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import GlobalStylesProvider from './styles/GlobalStylesProvider';
import SharedChatView from './components/SharedChatView';
import { keyframes } from 'styled-components';
import { ToastProvider, useToast } from './contexts/ToastContext';
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
import DinosaurRunGame from './components/DinosaurRunGame';

const AppContainer = styled.div`
  display: flex;
  height: 100vh;
  overflow: hidden;
  position: relative;
  background: ${props => props.theme.sidebar};
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
  top: ${props => props.$toolbarOpen ? '25%' : '28%'}; /* Moved up from 32%/35% */
  left: ${props => {
    const sidebarOffset = props.$sidebarCollapsed ? 0 : 160; // Increased from 140px to 160px to account for sidebar's 20px left margin
    return `calc(50% + ${sidebarOffset}px)`;
  }};
  transform: translateX(-50%);
  max-width: 800px; /* Keep a max width */
  width: 90%; /* Use percentage width for better flexibility */
  text-align: center;
  z-index: 102;
  pointer-events: none;
  padding: 0 20px; /* Horizontal padding */
  box-sizing: border-box; /* Include padding in width calculation */
  transition: all 0.3s ease-out; /* Transition all properties including left */
  
  /* Flexbox container for logo and text */
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px; /* Increased gap for bigger look */
  
  .logo {
    width: 64px; /* Increased from 48px */
    height: 64px; /* Increased from 48px */
    flex-shrink: 0; /* Prevent logo from shrinking */
    pointer-events: auto;
    cursor: pointer;
    transition: transform 0.2s ease;
    
    &:hover {
      transform: scale(1.05);
    }
  }
  
  h1 {
    font-size: min(3.2rem, 8vw); /* Increased from 2.2rem, 6vw */
    font-weight: 500;
    color: ${props => props.theme.text};
    margin: 0;
    padding: 0;
    line-height: 1.2; 
    word-wrap: break-word; /* Ensure long words break if needed */
    overflow-wrap: break-word; /* More modern property for word breaking */
    pointer-events: auto;
    cursor: pointer;
    transition: transform 0.2s ease;
    
    &:hover {
      transform: scale(1.02);
    }
  }

  /* Adjustments for medium to small screens */
  @media (max-width: 768px) {
    left: 50% !important; /* Always center on mobile */
    top: ${props => props.$toolbarOpen ? '22%' : '25%'}; /* Moved up from 27%/30% */
    max-width: 90%; /* Reduce max-width on smaller screens */
    padding: 0 15px; 
    gap: 16px; /* Increased gap on mobile */
    
    .logo {
      width: 56px; /* Increased from 40px */
      height: 56px; /* Increased from 40px */
    }
    
    h1 {
      font-size: min(2.8rem, 7vw); /* Increased from 2rem, 5.5vw */
    }
  }

  /* Adjustments for very small screens */
  @media (max-width: 480px) {
    left: 50% !important; /* Always center on mobile */
    top: ${props => props.$toolbarOpen ? '22%' : '25%'}; /* Moved up from 27%/30% */
    max-width: 95%; /* Allow slightly more width on very small screens */
    padding: 0 10px; 
    gap: 14px; /* Increased gap on very small screens */
    
    .logo {
      width: 48px; /* Increased from 36px */
      height: 48px; /* Increased from 36px */
    }
    
    h1 {
      font-size: min(2.2rem, 6vw); /* Increased from 1.7rem, 5vw */
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
const AppContent = () => {
  const { user, adminUser, updateSettings: updateUserSettings, loading } = useAuth();
  const toast = useToast();
  const isMobile = useIsMobile();
  const location = useLocation();
  const navigate = useNavigate();

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
    const defaultChat = { id: uuidv4(), title: 'New Chat', messages: [] };
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
    try {
      const savedProjects = localStorage.getItem('projects');
      return savedProjects ? JSON.parse(savedProjects) : [];
    } catch (err) {
      console.error("Error loading projects from localStorage:", err);
      return [];
    }
  });

  const [activeProject, setActiveProject] = useState(() => {
    const savedActiveProject = localStorage.getItem('activeProject');
    return savedActiveProject ? JSON.parse(savedActiveProject) : null;
  });

  // Models will be loaded exclusively from the backend.
  const [availableModels, setAvailableModels] = useState([]);

  const [selectedModel, setSelectedModel] = useState(() => {
    const savedModel = localStorage.getItem('selectedModel');
    return savedModel || null; // Will be set when models are loaded
  });

  // Fetch models from backend (now the ONLY source) and refresh periodically
  useEffect(() => {
    const getBackendModels = async () => {
      try {
        console.log('Fetching models from backend...');
        const backendModels = await fetchModelsFromBackend();

        // Get enabled custom models from localStorage
        const customModelsJson = localStorage.getItem('customModels');
        let enabledCustomModels = [];
        if (customModelsJson) {
          try {
            const customModels = JSON.parse(customModelsJson);
            // Filter only enabled custom models and format them
            enabledCustomModels = customModels
              .filter(model => model.enabled)
              .map(model => ({
                id: `custom-${model.id}`, // Prefix with 'custom-' to avoid ID conflicts
                name: model.name,
                description: model.description,
                isCustomModel: true,
                systemPrompt: model.systemPrompt,
                avatar: model.avatar,
                provider: 'Custom Model',
                isBackendModel: false, // Custom models are frontend models
                baseModel: model.baseModel || 'gpt-3.5-turbo' // More common fallback
              }));
          } catch (err) {
            console.error('Error parsing custom models:', err);
          }
        }

        // Combine backend models with enabled custom models
        const allModels = [...(backendModels || []), ...enabledCustomModels];

        if (allModels.length > 0) {
          setAvailableModels(allModels);
          console.log(`Loaded ${allModels.length} models (${backendModels?.length || 0} backend, ${enabledCustomModels.length} custom):`, allModels.map(m => m.id));

          // Set default model if none is selected or the selected one is no longer available
          const currentSelectedModelIsValid = allModels.some(m => m.id === selectedModel);
          if (!currentSelectedModelIsValid && allModels.length > 0) {
            const defaultModel = allModels[0].id;
            setSelectedModel(defaultModel);
            localStorage.setItem('selectedModel', defaultModel);
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

        // Even if backend fails, still try to load custom models
        const customModelsJson = localStorage.getItem('customModels');
        let enabledCustomModels = [];
        if (customModelsJson) {
          try {
            const customModels = JSON.parse(customModelsJson);
            enabledCustomModels = customModels
              .filter(model => model.enabled)
              .map(model => ({
                id: `custom-${model.id}`,
                name: model.name,
                description: model.description,
                isCustomModel: true,
                systemPrompt: model.systemPrompt,
                avatar: model.avatar,
                provider: 'Custom Model',
                isBackendModel: false,
                baseModel: model.baseModel || 'gpt-3.5-turbo' // More common fallback
              }));
          } catch (err) {
            console.error('Error parsing custom models:', err);
          }
        }

        setAvailableModels(enabledCustomModels);
        if (enabledCustomModels.length > 0 && !enabledCustomModels.some(m => m.id === selectedModel)) {
          setSelectedModel(enabledCustomModels[0].id);
          localStorage.setItem('selectedModel', enabledCustomModels[0].id);
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
      showGreeting: true
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

  // Update settings when user changes
  useEffect(() => {
    if (user && user.settings) {
      setSettings(user.settings);
    }
  }, [user]);

  // Check if onboarding is needed for new users
  useEffect(() => {
    if (user && !loading) {
      // Check if user has completed onboarding
      const hasCompletedOnboarding = localStorage.getItem(`onboarding_completed_${user.id}`);

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
      const newChat = { id: uuidv4(), title: 'New Chat', messages: [] };
      setChats([newChat]);
      setActiveChat(newChat.id);
    }
  }, [chats, activeChat]);

  useEffect(() => {
    localStorage.setItem('activeChat', JSON.stringify(activeChat));
  }, [activeChat]);

  useEffect(() => {
    localStorage.setItem('projects', JSON.stringify(projects));
  }, [projects]);

  useEffect(() => {
    localStorage.setItem('activeProject', JSON.stringify(activeProject));
  }, [activeProject]);

  useEffect(() => {
    localStorage.setItem('selectedModel', selectedModel);
  }, [selectedModel]);

  // Only save settings to localStorage if not logged in
  useEffect(() => {
    if (!user) {
      localStorage.setItem('settings', JSON.stringify(settings));
    }
  }, [settings, user]);

  const createNewChat = (projectId = null) => {
    const newChat = {
      id: uuidv4(),
      title: 'New Chat',
      messages: [],
      projectId: projectId,
    };
    setChats(prevChats => {
      const updatedChats = [newChat, ...prevChats];
      try {
        localStorage.setItem('chats', safeStringify(updatedChats));
      } catch (error) {
        console.error("Error saving chats to localStorage:", error);
      }
      return updatedChats;
    });
    setActiveChat(newChat.id);

    // Navigate to chat tab if not already there
    if (location.pathname !== '/') {
      navigate('/');
    }

    return newChat;
  };

  const createNewProject = (projectData) => {
    const newProject = {
      id: uuidv4(),
      ...projectData,
      createdAt: new Date().toISOString(),
    };
    setProjects(prevProjects => [...prevProjects, newProject]);
    setActiveProject(newProject.id);
  };

  const addKnowledgeToProject = (projectId, file) => {
    setProjects(prevProjects => prevProjects.map(p => {
      if (p.id === projectId) {
        const newKnowledge = { id: uuidv4(), ...file };
        return { ...p, knowledge: [...(p.knowledge || []), newKnowledge] };
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
        title: 'New Chat',
        messages: []
      };
      setChats([newChat]);
      setActiveChat(newChat.id);
      try {
        localStorage.setItem('chats', safeStringify([newChat]));
      } catch (error) {
        console.error("Error saving chats to localStorage:", error);
      }
    } else {
      setChats(updatedChats);
      try {
        localStorage.setItem('chats', safeStringify(updatedChats));
      } catch (error) {
        console.error("Error saving chats to localStorage:", error);
      }

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
      try {
        localStorage.setItem('chats', safeStringify(updatedChats));
      } catch (error) {
        console.error("Error saving chats to localStorage:", error);
      }
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
            title: chat.title === 'New Chat' && message.role === 'user'
              ? message.content.slice(0, 30) + (message.content.length > 30 ? '...' : '')
              : chat.title
          };
          console.log('Adding message to chat:', updatedChat);
          return updatedChat;
        }
        return chat;
      });
      localStorage.setItem('chats', safeStringify(updatedChats));
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

  // Update settings
  const updateSettings = (newSettings) => {
    setSettings(newSettings);

    // If logged in, also update user settings
    if (user) {
      updateUserSettings(newSettings);
    }
  };

  // Handle onboarding completion
  const handleOnboardingComplete = (onboardingSettings) => {
    if (user) {
      // Mark onboarding as completed
      localStorage.setItem(`onboarding_completed_${user.id}`, 'true');

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
      localStorage.removeItem(`onboarding_completed_${user.id}`);

      // Show onboarding again
      setShowOnboarding(true);
    }
  };

  const handleModelChange = (modelId) => {
    setSelectedModel(modelId);
    // Any other actions needed when model changes, like saving to storage
  };

  // Function to reset chats and start fresh
  const resetChats = () => {
    const newChat = { id: uuidv4(), title: 'New Chat', messages: [] };
    setChats([newChat]);
    setActiveChat(newChat.id);
    // Clear localStorage to start fresh
    localStorage.removeItem('chats');
    localStorage.removeItem('activeChat');
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
            window.open('https://www.google.com/chrome/', '_blank');
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
  const currentTheme = getTheme(settings.theme);

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
    return isMobile ? <MobileForcedLoginScreen /> : <ForcedLoginScreen />;
  }

  // Check if we should render the shared view
  if (window.location.pathname === '/share-view') {
    return (
      <ThemeProvider theme={currentTheme}>
        <GlobalStylesProvider />
        <SharedChatView />
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
        <AppContainer className={`bubble-style-${settings.bubbleStyle || 'modern'} message-spacing-${settings.messageSpacing || 'comfortable'}`}>
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
            />
            {console.log('Available models for ChatWindow:', availableModels)}
            <Routes>
              <Route path="/" element={
                <ChatWindow
                  ref={chatWindowRef}
                  chat={currentChat}
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
                />
              } />
              <Route path="/media" element={<MediaPage />} />
              <Route path="/news" element={<NewsPage collapsed={collapsed} />} />
              <Route path="/admin" element={<AdminPage collapsed={collapsed} />} />
              <Route path="/projects" element={<ProjectsPage projects={projects} createNewProject={createNewProject} deleteProject={deleteProject} collapsed={collapsed} />} />
              <Route path="/workspace" element={<WorkspacePage collapsed={collapsed} />} />
              <Route path="/projects/:projectId" element={
                <ProjectDetailPage
                  projects={projects}
                  chats={chats}
                  addMessage={addMessage}
                  updateMessage={updateMessage}
                  createNewChat={createNewChat}
                  setActiveChat={setActiveChat}
                  activeChat={activeChat}
                  addKnowledgeToProject={addKnowledgeToProject}
                  // Pass down all the props ChatInputArea needs
                  settings={settings}
                  availableModels={availableModels}
                  isWhiteboardOpen={isWhiteboardOpen}
                  onToggleWhiteboard={() => setIsWhiteboardOpen(p => !p)}
                  isEquationEditorOpen={isEquationEditorOpen}
                  onToggleEquationEditor={() => setIsEquationEditorOpen(p => !p)}
                  isGraphingOpen={isGraphingOpen}
                  onToggleGraphing={() => setIsGraphingOpen(p => !p)}
                  isFlowchartOpen={isFlowchartOpen}
                  onToggleFlowchart={() => setIsFlowchartOpen(p => !p)}
                  isSandbox3DOpen={isSandbox3DOpen}
                  onToggleSandbox3D={() => setIsSandbox3DOpen(p => !p)}
                  onToolbarToggle={setIsToolbarOpen}
                />
              } />
            </Routes>
          </MainContentArea>

          {/* Render panels in order: whiteboard, equation editor, graphing */}
          <WhiteboardModal
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
          />

          <EquationEditorModal
            isOpen={isEquationEditorOpen}
            onClose={() => setIsEquationEditorOpen(false)}
            onSubmit={(latex) => {
              // Handle equation submission - add to chat input
              if (chatWindowRef.current && chatWindowRef.current.appendToInput) {
                chatWindowRef.current.appendToInput(`$${latex}$$ `);
              }
              setIsEquationEditorOpen(false);
            }}
            theme={currentTheme}
            otherPanelsOpen={(isWhiteboardOpen ? 1 : 0) + (isGraphingOpen ? 1 : 0) + (isFlowchartOpen ? 1 : 0) + (isSandbox3DOpen ? 1 : 0)}
          />

          <GraphingModal
            isOpen={isGraphingOpen}
            onClose={() => setIsGraphingOpen(false)}
            theme={currentTheme}
            otherPanelsOpen={(isWhiteboardOpen ? 1 : 0) + (isEquationEditorOpen ? 1 : 0) + (isFlowchartOpen ? 1 : 0) + (isSandbox3DOpen ? 1 : 0)}
          />

          <FlowchartModal
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
          />

          <Sandbox3DModal
            isOpen={isSandbox3DOpen}
            onClose={() => setIsSandbox3DOpen(false)}
            onSend={(objects) => {
              if (chatWindowRef.current && chatWindowRef.current.appendToInput) {
                chatWindowRef.current.appendToInput(`\`\`\`json
${JSON.stringify(objects, null, 2)}
\`\`\``);
              }
            }}
            theme={currentTheme}
            otherPanelsOpen={(isWhiteboardOpen ? 1 : 0) + (isEquationEditorOpen ? 1 : 0) + (isGraphingOpen ? 1 : 0) + (isFlowchartOpen ? 1 : 0)}
            initialScene={pendingScene}
          />

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
          )}
        </AppContainer>
      </GlobalStylesProvider>
    </ThemeProvider>
  );
};

export default AppWithAuth;