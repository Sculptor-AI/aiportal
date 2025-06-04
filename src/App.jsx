import React, { useState, useEffect, useRef } from 'react';
import styled, { ThemeProvider } from 'styled-components';
import Sidebar from './components/Sidebar';
import ChatWindow from './components/ChatWindow';
import SettingsModal from './components/SettingsModal';
import LoginModal from './components/LoginModal';
import ProfileModal from './components/ProfileModal';
import MobileApp from './components/MobileApp';
import WhiteboardModal from './components/WhiteboardModal';
import EquationEditorModal from './components/EquationEditorModal';
import GraphingModal from './components/GraphingModal';
import SummarizerModal from './components/SummarizerModal';
import CodeRunnerModal from './components/CodeRunnerModal';
import { v4 as uuidv4 } from 'uuid';
import { getTheme, GlobalStyles } from './styles/themes';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import GlobalStylesProvider from './styles/GlobalStylesProvider';
import SharedChatView from './components/SharedChatView';
import { keyframes } from 'styled-components';
import { ToastProvider, useToast } from './contexts/ToastContext';
import { fetchModelsFromBackend } from './services/aiService';
import NewSettingsPanel from './components/NewSettingsPanel';

const AppContainer = styled.div`
  display: flex;
  height: 100vh;
  overflow: hidden;
  position: relative;
  background: ${props => props.theme.background};
  color: ${props => props.theme.text};
  transition: background 0.3s ease;
`;

const MainContentArea = styled.div`
  flex: 1;
  display: flex;
  height: 100%;
  margin-right: ${props => {
    // Handle multiple panels being open
    let totalMargin = 0;
    if (props.$whiteboardOpen) totalMargin += 450;
    if (props.$equationEditorOpen) totalMargin += 450;
    if (props.$graphingOpen) totalMargin += 600; // Graphing panel is wider
    if (props.$summarizerOpen) totalMargin += 450;
    if (props.$codeRunnerOpen) totalMargin += 450;
    return `${totalMargin}px`;
  }};
  transition: margin-right 0.3s cubic-bezier(0.25, 1, 0.5, 1);
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
  top: ${props => props.$toolbarOpen ? '32%' : '35%'}; /* Adjust when toolbar is open */
  left: ${props => {
    const sidebarOffset = props.$sidebarCollapsed ? 0 : 140;
    let rightPanelOffset = 0;
    if (props.$whiteboardOpen) rightPanelOffset -= 225;
    if (props.$equationEditorOpen) rightPanelOffset -= 225;
    if (props.$graphingOpen) rightPanelOffset -= 300; // Half of 600px
    return `calc(50% + ${sidebarOffset}px + ${rightPanelOffset}px)`;
  }};
  transform: translateX(-50%);
  max-width: 800px; /* Keep a max width */
  width: 90%; /* Use percentage width for better flexibility */
  text-align: center;
  z-index: 4;
  pointer-events: none;
  padding: 0 20px; /* Horizontal padding */
  box-sizing: border-box; /* Include padding in width calculation */
  transition: all 0.3s ease-out; /* Transition all properties including left */
  
  h1 {
    font-size: min(2.2rem, 6vw); /* Adjusted responsive font size */
    font-weight: 500;
    color: ${props => props.theme.text};
    margin: 0;
    padding: 0;
    /* Removed flex properties, let natural wrapping occur */
    line-height: 1.2; 
    word-wrap: break-word; /* Ensure long words break if needed */
    overflow-wrap: break-word; /* More modern property for word breaking */
  }

  /* Adjustments for medium to small screens */
  @media (max-width: 768px) {
    left: 50% !important; /* Always center on mobile */
    top: ${props => props.$toolbarOpen ? '27%' : '30%'}; /* Adjust on mobile */
    max-width: 90%; /* Reduce max-width on smaller screens */
    padding: 0 15px; 
    h1 {
      font-size: min(2rem, 5.5vw); /* Slightly smaller font */
    }
  }

  /* Adjustments for very small screens */
  @media (max-width: 480px) {
    left: 50% !important; /* Always center on mobile */
    top: ${props => props.$toolbarOpen ? '27%' : '30%'}; /* Adjust on small screens */
    max-width: 95%; /* Allow slightly more width on very small screens */
    padding: 0 10px; 
    h1 {
      font-size: min(1.7rem, 5vw); /* Slightly smaller font */
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
  const { user, updateSettings: updateUserSettings } = useAuth();
  const toast = useToast();
  const isMobile = useIsMobile();
  
  // Greeting messages
  const greetingMessages = [
    "Look who decided to show up",
    "Back for more AI wisdom",
    "Oh great, it's you again",
    "Lemme guess, essay due in an hour",
    "You treat me like Google with trauma",
    "I was just about to take a nap, but okay",
    "Oh joy, it's my favorite procrastinator",
    "Missed me already? How predictable",
    "You know, boundaries exist, right",
    "Again? At this rate, I deserve a raise",
    "What's today's crisis",
    "Back so soon? Therapy might help more",
    "Did Google hurt your feelings again",
    "Is ignoring deadlines your hobby or passion",
    "I'm not judging—actually, yes, I am",
    "Welcome back, chronic advice seeker",
    "Great, another chance to practice patience",
    "Look, it's the usual suspect",
    "Oh look, my unpaid internship continues",
    "Couldn't resist my charm, huh?",
    "Which existential crisis is it today?",
    "Back again? Your deadlines must be trembling",
    "Ah, my favorite daily interruption",
    "Another day, another panic request",
    "Are we avoiding responsibilities again?",
    "I see procrastination is your love language",
    "Here we go again—brace for impact",
    "Just admit you miss my digital sass",
    "Already? Give me time to recharge my sarcasm",
    "I'm sensing a pattern—and it's exhausting",
    "Did reality disappoint you again?",
    "Can't say I'm surprised to see you",
    "Community guidelines, prepare to be ignored"
  ];
  
  // Get random greeting message
  const getRandomGreeting = () => {
    const randomIndex = Math.floor(Math.random() * greetingMessages.length);
    return greetingMessages[randomIndex];
  };
  
  // State for greeting message
  const [greeting, setGreeting] = useState(''); // Initialize with empty string
  const [hasAttachment, setHasAttachment] = useState(false);
  
  // Set random greeting on mount
  useEffect(() => {
    setGreeting(getRandomGreeting());
  }, []); // Empty dependency array ensures this runs only once on mount
  
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

  // Fetch models from backend
  useEffect(() => {
    const getBackendModels = async () => {
      try {
        const backendModels = await fetchModelsFromBackend();
        if (backendModels && backendModels.length > 0) {
          console.log('Fetched backend models:', backendModels); // Add debug log
          
          // Merge backend models with local models to ensure backwards compatibility
          // This approach allows both direct API models and backend-proxied models
          const mergedModels = [...availableModels];
          
          backendModels.forEach(backendModel => {
            // Check if the model already exists in the list
            const existingIndex = mergedModels.findIndex(m => m.id === backendModel.id);
            
            if (existingIndex >= 0) {
              // Update existing model with backend info
              mergedModels[existingIndex] = {
                ...mergedModels[existingIndex],
                ...backendModel,
                isBackendModel: true
              };
            } else {
              // Add new backend model
              mergedModels.push({
                ...backendModel,
                isBackendModel: true
              });
            }
          });
          
          setAvailableModels(mergedModels);
          console.log('Models updated with backend models:', mergedModels);
        }
      } catch (error) {
        console.error('Failed to fetch models from backend:', error);
      }
    };
    
    getBackendModels();
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
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(true);
  const [isWhiteboardOpen, setIsWhiteboardOpen] = useState(false);
  const [isEquationEditorOpen, setIsEquationEditorOpen] = useState(false);
  const [isGraphingOpen, setIsGraphingOpen] = useState(false);
  const [isSummarizerOpen, setIsSummarizerOpen] = useState(false);
  const [isCodeRunnerOpen, setIsCodeRunnerOpen] = useState(false);
  const [isToolbarOpen, setIsToolbarOpen] = useState(false);
  const chatWindowRef = useRef(null);

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
            $whiteboardOpen={isWhiteboardOpen}
            $equationEditorOpen={isEquationEditorOpen}
            $graphingOpen={isGraphingOpen}
            $summarizerOpen={isSummarizerOpen}
            $codeRunnerOpen={isCodeRunnerOpen}
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
            {settings.showGreeting && getCurrentChat()?.messages?.length === 0 && !hasAttachment && (
              <MainGreeting
                $sidebarCollapsed={collapsed}
                $whiteboardOpen={isWhiteboardOpen}
                $equationEditorOpen={isEquationEditorOpen}
                $graphingOpen={isGraphingOpen}
                $toolbarOpen={isToolbarOpen}
              >
                <h1 style={settings.theme === 'lakeside' ? { color: 'rgb(198, 146, 20)' } : {}}>
                  {settings.theme === 'lakeside' ? 'Andromeda' : `${greeting}${user ? `, ${user.username}` : ''}`}
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
            {console.log('Available models for ChatWindow:', availableModels)}
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
              isSummarizerOpen={isSummarizerOpen}
              onToggleSummarizer={() => setIsSummarizerOpen(prev => !prev)}
              onCloseSummarizer={() => setIsSummarizerOpen(false)}
              isCodeRunnerOpen={isCodeRunnerOpen}
              onToggleCodeRunner={() => setIsCodeRunnerOpen(prev => !prev)}
              onCloseCodeRunner={() => setIsCodeRunnerOpen(false)}
              onToolbarToggle={setIsToolbarOpen}
            />
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
            otherPanelsOpen={(isEquationEditorOpen ? 1 : 0) + (isGraphingOpen ? 1 : 0)}
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
            otherPanelsOpen={(isWhiteboardOpen ? 1 : 0) + (isGraphingOpen ? 1 : 0)}
          />
          
          <GraphingModal
            isOpen={isGraphingOpen}
            onClose={() => setIsGraphingOpen(false)}
            theme={currentTheme}
            otherPanelsOpen={(isWhiteboardOpen ? 1 : 0) + (isEquationEditorOpen ? 1 : 0)}
          />

          <SummarizerModal
            isOpen={isSummarizerOpen}
            onClose={() => setIsSummarizerOpen(false)}
            onInsert={(text) => {
              if (chatWindowRef.current && chatWindowRef.current.appendToInput) {
                chatWindowRef.current.appendToInput(text);
              }
            }}
            modelId={selectedModel}
            otherPanelsOpen={(isWhiteboardOpen ? 1 : 0) + (isEquationEditorOpen ? 1 : 0) + (isGraphingOpen ? 1 : 0)}
          />

          <CodeRunnerModal
            isOpen={isCodeRunnerOpen}
            onClose={() => setIsCodeRunnerOpen(false)}
            onInsert={(text) => {
              if (chatWindowRef.current && chatWindowRef.current.appendToInput) {
                chatWindowRef.current.appendToInput(text);
              }
            }}
            modelId={selectedModel}
            otherPanelsOpen={(isWhiteboardOpen ? 1 : 0) + (isEquationEditorOpen ? 1 : 0) + (isGraphingOpen ? 1 : 0) + (isSummarizerOpen ? 1 : 0)}
          />
        
          {isSettingsOpen && (
            <NewSettingsPanel 
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