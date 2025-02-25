import React, { useState, useEffect } from 'react';
import styled, { ThemeProvider } from 'styled-components';
import Sidebar from './components/Sidebar';
import ChatWindow from './components/ChatWindow';
import SettingsModal from './components/SettingsModal';
import { v4 as uuidv4 } from 'uuid';
import { getTheme, GlobalStyles } from './styles/themes';

const AppContainer = styled.div`
  display: flex;
  height: 100vh;
  overflow: hidden;
  background-color: ${props => props.theme.background};
  color: ${props => props.theme.text};
`;

const App = () => {
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

  const [availableModels, setAvailableModels] = useState([
    { id: 'gemini-2-flash', name: 'Gemini 2 Flash' },
    { id: 'claude-3.7-sonnet', name: 'Claude 3.7 Sonnet' },
    { id: 'chatgpt-4o', name: 'ChatGPT 4o' }
  ]);
  
  const [selectedModel, setSelectedModel] = useState(() => {
    const savedModel = localStorage.getItem('selectedModel');
    return savedModel || 'gemini-2-flash';
  });
  
  const [settings, setSettings] = useState(() => {
    const savedSettings = localStorage.getItem('settings');
    return savedSettings ? JSON.parse(savedSettings) : {
      theme: 'light',
      fontSize: 'medium',
      sendWithEnter: true,
      showTimestamps: true,
      showModelIcons: true,
      messageAlignment: 'left',
      codeHighlighting: true
    };
  });
  
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

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
  
  useEffect(() => {
    localStorage.setItem('settings', JSON.stringify(settings));
  }, [settings]);

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
    
    if (activeChat === chatId) {
      setActiveChat(updatedChats[0]?.id || null);
    }
  };

  const updateChatTitle = (chatId, newTitle) => {
    const updatedChats = chats.map(chat => 
      chat.id === chatId ? { ...chat, title: newTitle } : chat
    );
    setChats(updatedChats);
  };

  const addMessage = (chatId, message) => {
    // First ensure we work with the latest state
    setChats(currentChats => {
      // Find the current chat to update
      const updatedChats = currentChats.map(chat => {
        if (chat.id === chatId) {
          // Make a deep copy to ensure React detects the change
          const updatedChat = {
            ...chat,
            messages: [...chat.messages, message]
          };
          
          // Update title only for the first user message
          if (chat.messages.length === 0 && message.role === 'user') {
            updatedChat.title = message.content.substring(0, 30) + (message.content.length > 30 ? '...' : '');
          }
          
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

  const toggleSettings = () => {
    setIsSettingsOpen(!isSettingsOpen);
  };
  
  const updateSettings = (newSettings) => {
    setSettings(newSettings);
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
        />
        <ChatWindow 
          chat={getCurrentChat()}
          addMessage={addMessage}
          selectedModel={selectedModel}
          updateChatTitle={updateChatTitle}
          settings={settings}
        />
        {isSettingsOpen && (
          <SettingsModal 
            settings={settings}
            updateSettings={updateSettings}
            closeModal={toggleSettings}
          />
        )}
      </AppContainer>
    </ThemeProvider>
  );
};

export default App;