import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import ModelIcon from './ModelIcon';

const SidebarOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1000;
  opacity: ${props => props.isOpen ? 1 : 0};
  visibility: ${props => props.isOpen ? 'visible' : 'hidden'};
  transition: opacity 0.3s ease, visibility 0.3s ease;
  touch-action: none;
`;

const SidebarContainer = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  width: 280px;
  background: ${props => props.theme.sidebar || props.theme.background};
  border-right: 1px solid ${props => props.theme.border};
  z-index: 1001;
  transform: translateX(${props => props.isOpen ? '0' : '-100%'});
  transition: transform 0.3s ease;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding-top: env(safe-area-inset-top);
`;

const SidebarHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid ${props => props.theme.border};
  background: ${props => props.theme.background};
`;

const SidebarTitle = styled.h2`
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: ${props => props.theme.text};
`;

const CloseButton = styled.button`
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

const SidebarContent = styled.div`
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  display: flex;
  flex-direction: column;
`;

const SectionHeader = styled.div`
  padding: 16px 20px 8px 20px;
  font-size: 14px;
  font-weight: 600;
  color: ${props => props.theme.text}88;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const ChatList = styled.div`
  padding: 0 12px;
  flex: 1;
`;

const ChatItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  margin: 2px 0;
  border-radius: 12px;
  cursor: pointer;
  touch-action: manipulation;
  background: ${props => props.active ? (props.theme.primary + '20') : 'transparent'};
  transition: background 0.2s ease;
  
  &:active {
    background: ${props => props.active ? (props.theme.primary + '30') : props.theme.border};
  }
`;

const ChatItemContent = styled.div`
  flex: 1;
  min-width: 0;
`;

const ChatTitle = styled.div`
  font-size: 16px;
  font-weight: 500;
  color: ${props => props.active ? props.theme.primary : props.theme.text};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 2px;
`;

const ChatPreview = styled.div`
  font-size: 14px;
  color: ${props => props.theme.text}66;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const ChatActions = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  margin-left: 8px;
`;

const ActionButton = styled.button`
  background: none;
  border: none;
  color: ${props => props.theme.text}66;
  padding: 6px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  touch-action: manipulation;
  
  &:active {
    background: ${props => props.theme.border};
  }
  
  svg {
    width: 16px;
    height: 16px;
  }
`;

const ModelSelector = styled.div`
  padding: 16px 20px;
  border-top: 1px solid ${props => props.theme.border};
`;

const ModelButton = styled.button`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: ${props => props.theme.inputBackground};
  border: 1px solid ${props => props.theme.border};
  border-radius: 12px;
  color: ${props => props.theme.text};
  cursor: pointer;
  touch-action: manipulation;
  gap: 10px;
  
  &:active {
    background: ${props => props.theme.border};
  }
`;

const ModelInfo = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  text-align: left;
`;

const ModelName = styled.div`
  font-size: 16px;
  font-weight: 500;
  color: ${props => props.theme.text};
`;

const ModelProvider = styled.div`
  font-size: 14px;
  color: ${props => props.theme.text}66;
`;

const SidebarFooter = styled.div`
  padding: 16px 20px;
  border-top: 1px solid ${props => props.theme.border};
  background: ${props => props.theme.background};
  padding-bottom: max(16px, env(safe-area-inset-bottom));
`;

const FooterButton = styled.button`
  width: 100%;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: transparent;
  border: none;
  border-radius: 12px;
  color: ${props => props.theme.text};
  font-size: 16px;
  cursor: pointer;
  touch-action: manipulation;
  margin-bottom: 8px;
  
  &:last-child {
    margin-bottom: 0;
  }
  
  &:active {
    background: ${props => props.theme.border};
  }
  
  svg {
    width: 20px;
    height: 20px;
    color: ${props => props.theme.text}88;
  }
`;

// NEW: Styled components for the model selection menu
const ModelMenuOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.3);
  z-index: 1002; // Higher than sidebar
  display: ${props => props.isOpen ? 'block' : 'none'};
`;

const ModelMenuContainer = styled.div`
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: ${props => props.theme.backgroundSecondary || props.theme.background };
  border-top-left-radius: 16px;
  border-top-right-radius: 16px;
  z-index: 1003; // Higher than overlay
  padding: 16px;
  padding-bottom: max(16px, env(safe-area-inset-bottom));
  box-shadow: 0 -2px 10px rgba(0,0,0,0.1);
  max-height: 50vh;
  overflow-y: auto;
  transform: translateY(${props => props.isOpen ? '0%' : '100%'});
  transition: transform 0.3s ease-out;
`;

const ModelMenuItem = styled.div`
  display: flex;
  align-items: center;
  padding: 12px 8px;
  border-radius: 8px;
  cursor: pointer;
  gap: 12px;
  
  &:hover {
    background: ${props => props.theme.name === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'};
  }
  
  &.selected {
    background: ${props => props.theme.primary + '20'};
    font-weight: bold;
  }
`;

const ModelMenuItemName = styled.span`
  font-size: 16px;
  color: ${props => props.theme.text};
`;

const MobileSidebar = ({
  isOpen,
  onClose,
  chats,
  activeChat,
  setActiveChat,
  createNewChat,
  deleteChat,
  availableModels,
  selectedModel,
  setSelectedModel,
  toggleSettings,
  toggleProfile,
  isLoggedIn,
  username,
  onModelChange
}) => {
  const [isModelMenuOpen, setIsModelMenuOpen] = useState(false);

  // Prevent body scroll when sidebar is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleChatSelect = (chatId) => {
    setActiveChat(chatId);
    onClose();
  };

  const handleDeleteChat = (e, chatId) => {
    e.stopPropagation();
    deleteChat(chatId);
  };

  const handleShareChat = async (e, chatId) => {
    e.stopPropagation();
    const shareUrl = `${window.location.origin}/share-view?id=${chatId}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      alert('Share link copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy share link: ', err);
      alert('Could not copy share link.');
    }
  };

  const getModelDisplay = (modelId) => {
    const model = availableModels.find(m => m.id === modelId);
    if (model) {
      return {
        name: model.name,
        provider: model.provider || 'AI'
      };
    }
    
    // Fallback display: just use the modelId if not found in availableModels
    // This makes it consistent with desktop if data is still loading.
    return { name: modelId, provider: 'AI' };
  };

  const currentModelDisplay = getModelDisplay(selectedModel);

  const getLastMessage = (chat) => {
    if (!chat.messages || chat.messages.length === 0) {
      return 'No messages yet';
    }
    
    const lastMessage = chat.messages[chat.messages.length - 1];
    const content = lastMessage.content;
    
    if (content.length > 50) {
      return content.substring(0, 50) + '...';
    }
    
    return content || 'No content';
  };

  const handleModelSelect = (modelId) => {
    setSelectedModel(modelId);
    if (onModelChange) {
      onModelChange(modelId);
    }
    setIsModelMenuOpen(false);
  };

  if (!isOpen) return null;

  return (
    <>
      <SidebarOverlay isOpen={isOpen} onClick={onClose} />
      <SidebarContainer isOpen={isOpen}>
        <SidebarHeader>
          <SidebarTitle>Sculptor</SidebarTitle>
          <CloseButton onClick={onClose}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </CloseButton>
        </SidebarHeader>
        
        <SidebarContent>
          <SectionHeader>Conversations</SectionHeader>
          <ChatList>
            {chats.map(chat => (
              <ChatItem
                key={chat.id}
                active={activeChat === chat.id}
                onClick={() => handleChatSelect(chat.id)}
              >
                <ChatItemContent>
                  <ChatTitle active={activeChat === chat.id}>
                    {chat.title || `Chat ${chat.id.substring(0, 4)}`}
                  </ChatTitle>
                  <ChatPreview>
                    {getLastMessage(chat)}
                  </ChatPreview>
                </ChatItemContent>
                
                <ChatActions>
                  <ActionButton onClick={(e) => handleShareChat(e, chat.id)}>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path>
                      <polyline points="16 6 12 2 8 6"></polyline>
                      <line x1="12" y1="2" x2="12" y2="15"></line>
                    </svg>
                  </ActionButton>
                  
                  <ActionButton onClick={(e) => handleDeleteChat(e, chat.id)}>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6"></polyline>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2-2v2"></path>
                      <line x1="10" y1="11" x2="10" y2="17"></line>
                      <line x1="14" y1="11" x2="14" y2="17"></line>
                    </svg>
                  </ActionButton>
                </ChatActions>
              </ChatItem>
            ))}
          </ChatList>
          
          <ModelSelector>
            <SectionHeader style={{ padding: '0 0 8px 0' }}>AI Model</SectionHeader>
            <ModelButton onClick={() => setIsModelMenuOpen(true)}>
              {currentModelDisplay && <ModelIcon modelId={selectedModel} size="small" />}
              <ModelInfo>
                <ModelName>{currentModelDisplay.name}</ModelName>
                <ModelProvider>{currentModelDisplay.provider}</ModelProvider>
              </ModelInfo>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </ModelButton>
          </ModelSelector>
        </SidebarContent>
        
        <SidebarFooter>
          <FooterButton onClick={toggleProfile}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
            {isLoggedIn ? username : 'Sign In'}
          </FooterButton>
          
          <FooterButton onClick={toggleSettings}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3"></circle>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
            </svg>
            Settings
          </FooterButton>
        </SidebarFooter>
      </SidebarContainer>

      {/* ADD MODEL SELECTION MENU */}
      <ModelMenuOverlay isOpen={isModelMenuOpen} onClick={() => setIsModelMenuOpen(false)} />
      <ModelMenuContainer isOpen={isModelMenuOpen}>
        <SectionHeader style={{padding: '0 0 10px 0', textAlign: 'center'}}>Select AI Model</SectionHeader>
        {availableModels && availableModels.map(model => (
          <ModelMenuItem 
            key={model.id} 
            onClick={() => handleModelSelect(model.id)}
            className={selectedModel === model.id ? 'selected' : ''}
          >
            <ModelIcon modelId={model.id} size="medium" />
            <ModelMenuItemName>{model.name || model.id}</ModelMenuItemName>
          </ModelMenuItem>
        ))}
      </ModelMenuContainer>
    </>
  );
};

export default MobileSidebar;