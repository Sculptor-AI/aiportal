import React, { useEffect, useState } from 'react';
import styled, { withTheme } from 'styled-components';
import { useTranslation } from '../../contexts/TranslationContext';
import ModelIcon from '../ModelIcon';

const SidebarOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, ${props => props.$isOpen ? '0.35' : '0'});
  backdrop-filter: ${props => props.$isOpen ? 'blur(4px)' : 'none'};
  -webkit-backdrop-filter: ${props => props.$isOpen ? 'blur(4px)' : 'none'};
  z-index: 1000;
  pointer-events: ${props => props.$isOpen ? 'auto' : 'none'};
  transition: all 0.4s cubic-bezier(0.32, 0.72, 0, 1);
  touch-action: none;
`;

const SidebarContainer = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  width: min(310px, 82vw);
  background: ${props => props.theme.sidebar || props.theme.background};
  backdrop-filter: blur(40px) saturate(180%);
  -webkit-backdrop-filter: blur(40px) saturate(180%);
  border-right: 0.5px solid ${props => props.theme.border};
  z-index: 1001;
  transform: translateX(${props => props.$isOpen ? '0' : '-100%'});
  transition: transform 0.4s cubic-bezier(0.32, 0.72, 0, 1);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding-top: env(safe-area-inset-top);
  box-shadow: ${props => props.$isOpen ? `8px 0 40px rgba(0,0,0,${props.theme.isDark ? '0.5' : '0.1'})` : 'none'};
`;

const SidebarHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 18px;
  border-bottom: 0.5px solid ${props => props.theme.border};
`;

const SidebarTitleContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const SidebarLogo = styled.img`
  width: 30px;
  height: 30px;
  object-fit: contain;
`;

const SidebarTitle = styled.h2`
  margin: 0;
  font-size: 17px;
  font-weight: 600;
  color: ${props => props.theme.text};
  letter-spacing: -0.02em;
`;

const CloseButton = styled.button`
  background: ${props => props.theme.isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.04)'};
  border: none;
  color: ${props => props.theme.textSecondary || (props.theme.text + 'aa')};
  padding: 6px;
  border-radius: 50%;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  touch-action: manipulation;
  transition: all 0.2s cubic-bezier(0.25, 1, 0.5, 1);
  
  &:active {
    transform: scale(0.88);
    background: ${props => props.theme.isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)'};
  }
  
  svg {
    width: 16px;
    height: 16px;
    stroke-width: 2.2;
  }
`;

const SidebarContent = styled.div`
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  display: flex;
  flex-direction: column;
  
  &::-webkit-scrollbar { display: none; }
  scrollbar-width: none;
`;

const SectionHeader = styled.div`
  padding: 18px 20px 8px 20px;
  font-size: 12px;
  font-weight: 600;
  color: ${props => props.theme.textSecondary || (props.theme.text + '77')};
  text-transform: uppercase;
  letter-spacing: 0.06em;
`;

const ChatList = styled.div`
  padding: 0 10px;
  flex: 1;
`;

const ChatItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 11px 14px;
  margin: 1px 0;
  border-radius: 10px;
  cursor: pointer;
  touch-action: manipulation;
  background: ${props => props.$active 
    ? (props.theme.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)') 
    : 'transparent'};
  transition: all 0.2s cubic-bezier(0.25, 1, 0.5, 1);
  position: relative;
  
  &:active {
    transform: scale(0.97);
    background: ${props => props.theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'};
  }
`;

const ChatItemContent = styled.div`
  flex: 1;
  min-width: 0;
`;

const ChatTitle = styled.div`
  font-size: 15px;
  font-weight: ${props => props.$active ? '600' : '400'};
  color: ${props => props.theme.text};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 2px;
  letter-spacing: -0.01em;
`;

const ChatPreview = styled.div`
  font-size: 13px;
  color: ${props => props.theme.textSecondary || (props.theme.text + '66')};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.3;
`;

const ChatActions = styled.div`
  display: flex;
  align-items: center;
  gap: 2px;
  margin-left: 8px;
  opacity: 0.6;
`;

const ActionButton = styled.button`
  background: none;
  border: none;
  color: ${props => props.theme.textSecondary || (props.theme.text + '77')};
  padding: 6px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  touch-action: manipulation;
  transition: all 0.15s ease;
  
  &:active {
    transform: scale(0.88);
    background: ${props => props.theme.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)'};
  }
  
  svg {
    width: 16px;
    height: 16px;
  }
`;

const SidebarFooter = styled.div`
  padding: 12px 14px;
  border-top: 0.5px solid ${props => props.theme.border};
  padding-bottom: max(14px, env(safe-area-inset-bottom));
`;

const FooterButton = styled.button`
  width: 100%;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 11px 14px;
  background: transparent;
  border: none;
  border-radius: 10px;
  color: ${props => props.theme.text};
  font-size: 15px;
  font-weight: 400;
  letter-spacing: -0.01em;
  cursor: pointer;
  touch-action: manipulation;
  margin-bottom: 4px;
  transition: all 0.2s cubic-bezier(0.25, 1, 0.5, 1);
  
  &:last-child {
    margin-bottom: 0;
  }
  
  &:active {
    transform: scale(0.97);
    background: ${props => props.theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'};
  }
  
  svg {
    width: 20px;
    height: 20px;
    color: ${props => props.theme.textSecondary || (props.theme.text + '88')};
    flex-shrink: 0;
  }
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
  onModelChange,
  theme
}) => {
  const { t } = useTranslation();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [showShareModal, setShowShareModal] = useState(null);
  const [shareLink, setShareLink] = useState('');

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
      alert(t('sidebar.copySuccess'));
    } catch (err) {
      console.error('Failed to copy share link: ', err);
      alert(t('sidebar.copyFailure'));
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
      return t('chat.history.noMessages');
    }
    
    const lastMessage = chat.messages[chat.messages.length - 1];
    const content = lastMessage.content;
    
    if (content.length > 50) {
      return content.substring(0, 50) + '...';
    }
    
    return content || t('chat.history.noContent');
  };

  const handleModelSelect = (modelId) => {
    setSelectedModel(modelId);
    if (onModelChange) {
      onModelChange(modelId);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <SidebarOverlay $isOpen={isOpen} onClick={onClose} />
      <SidebarContainer $isOpen={isOpen}>
        <SidebarHeader>
          <SidebarTitleContainer>
            <SidebarLogo
              src={theme && theme.name === 'lakeside' ? '/images/themes/lakeside-flower.png' : '/images/sculptor.svg'}
              alt={theme && theme.name === 'lakeside' ? 'Lakeside' : 'Sculptor Logo'}
            />
          </SidebarTitleContainer>
          <CloseButton onClick={onClose}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </CloseButton>
        </SidebarHeader>
        
        <SidebarContent>
          <SectionHeader>{t('sidebar.section.chats')}</SectionHeader>
          <ChatList>
            {chats.map(chat => (
              <ChatItem 
                key={chat.id} 
                $active={chat.id === activeChat} 
                onClick={() => handleChatSelect(chat.id)}
              >
                <ChatItemContent>
                  <ChatTitle $active={chat.id === activeChat}>{chat.title}</ChatTitle>
                  <ChatPreview>{getLastMessage(chat)}</ChatPreview>
                </ChatItemContent>
                <ChatActions>
                  <ActionButton onClick={(e) => handleShareChat(e, chat.id)}>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
                  </ActionButton>
                  <ActionButton onClick={(e) => handleDeleteChat(e, chat.id)}>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                  </ActionButton>
                </ChatActions>
              </ChatItem>
            ))}
          </ChatList>
        </SidebarContent>
        
        <SidebarFooter>
          <FooterButton onClick={createNewChat}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
            {isLoggedIn ? username : t('sidebar.profile.signIn')}
          </FooterButton>

          <FooterButton onClick={toggleSettings}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3"></circle>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
            </svg>
            {t('sidebar.profile.settings')}
          </FooterButton>
        </SidebarFooter>
      </SidebarContainer>
    </>
  );
};

export default withTheme(MobileSidebar);
