import React, { useState } from 'react';
import styled from 'styled-components';
import ModelIcon from './ModelIcon';

const SidebarContainer = styled.div`
  width: 260px;
  background-color: ${props => props.theme.sidebar};
  border-right: 1px solid ${props => props.theme.border};
  display: flex;
  flex-direction: column;
  height: 100%;
  
  @media (max-width: 768px) {
    width: 100%;
    height: auto;
    min-height: 60px;
    border-right: none;
    border-bottom: 1px solid ${props => props.theme.border};
    max-height: ${props => props.isExpanded ? '40vh' : '60px'};
    overflow: hidden;
    transition: max-height 0.3s ease-in-out;
    display: flex;
    flex-direction: column;
  }
`;

const LogoContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 15px 10px 5px;
  
  img {
    height: 40px;
    width: auto;
    margin-right: 8px;
  }
  
  @media (max-width: 768px) {
    display: none;
  }
`;

const LogoText = styled.span`
  font-family: 'Poppins', 'Segoe UI', sans-serif;
  font-weight: 600;
  font-size: 20px;
  letter-spacing: 0.5px;
  color: ${props => props.theme.text};
`;

const TopBarContainer = styled.div`
  display: flex;
  align-items: center;
  padding: 10px 15px;
  
  @media (max-width: 768px) {
    padding: 10px;
    width: 100%;
    justify-content: space-between;
  }
`;

const MobileLogoContainer = styled.div`
  display: none;
  align-items: center;
  margin-right: 10px;
  
  img {
    height: 30px;
    margin-right: 5px;
  }
  
  @media (max-width: 768px) {
    display: flex;
  }
`;

const MobileLogoText = styled.span`
  font-family: 'Poppins', 'Segoe UI', sans-serif;
  font-weight: 600;
  font-size: 16px;
  letter-spacing: 0.5px;
  color: ${props => props.theme.text};
`;

const NewChatButton = styled.button`
  background-color: ${props => props.theme.primary};
  color: white;
  border: none;
  padding: 10px 15px;
  border-radius: 5px;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s;
  flex: 1;

  &:hover {
    background-color: ${props => props.theme.secondary};
  }

  svg {
    margin-right: 8px;
  }
  
  @media (max-width: 768px) {
    margin-right: 10px;
  }
`;

const ScrollableContent = styled.div`
  @media (max-width: 768px) {
    display: ${props => props.isExpanded ? 'flex' : 'none'};
    flex-direction: column;
    overflow-y: auto;
    max-height: calc(40vh - 60px);
  }
  
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const ChatList = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 0 10px;
  
  @media (max-width: 768px) {
    max-height: none;
  }
`;

const ChatItem = styled.div`
  padding: 10px;
  margin: 5px 0;
  border-radius: 5px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: ${props => props.active ? props.theme.hover : 'transparent'};

  &:hover {
    background-color: ${props => props.theme.hover};
  }
`;

const ChatTitle = styled.div`
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
`;

const DeleteButton = styled.button`
  background: none;
  border: none;
  color: #888;
  cursor: pointer;
  padding: 5px;
  visibility: hidden;
  
  ${ChatItem}:hover & {
    visibility: visible;
  }

  &:hover {
    color: #d32f2f;
  }
`;

const BottomSection = styled.div`
  padding: 15px;
  border-top: 1px solid ${props => props.theme.border};
  
  @media (max-width: 768px) {
    border-top: none;
    padding-top: 5px;
  }
`;

const Select = styled.select`
  width: 100%;
  padding: 8px;
  border-radius: 5px;
  border: 1px solid ${props => props.theme.border};
  background-color: ${props => props.theme.background};
  color: ${props => props.theme.text};
  margin-bottom: 10px;
`;

const ModelOptionContainer = styled.div`
  margin-bottom: 10px;
`;

const ModelOption = styled.div`
  display: flex;
  align-items: center;
  padding: 8px;
  margin-bottom: 8px;
  border-radius: 5px;
  cursor: pointer;
  background-color: ${props => props.isSelected ? 
    props.theme.primary + '20' : props.theme.background};
  border: 1px solid ${props => props.isSelected ? 
    props.theme.primary : props.theme.border};
  
  &:hover {
    background-color: ${props => props.theme.hover};
  }
`;

const ModelInfo = styled.div`
  display: flex;
  flex-direction: column;
`;

const ModelName = styled.span`
  font-weight: ${props => props.isSelected ? 'bold' : 'normal'};
  color: ${props => props.theme.text};
`;

const ModelDescription = styled.span`
  font-size: 0.8rem;
  color: ${props => props.theme.text}80;
`;

const SidebarButton = styled.button`
  width: 100%;
  padding: 8px;
  background-color: transparent;
  border: 1px solid ${props => props.theme.border};
  border-radius: 5px;
  color: ${props => props.theme.text};
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background-color 0.2s;
  margin-bottom: ${props => props.marginBottom ? '8px' : '0'};
  
  &:hover {
    background-color: ${props => props.theme.hover};
  }
  
  svg {
    margin-right: 8px;
  }
`;

const ProfileButton = styled(SidebarButton)`
  background-color: ${props => props.isLoggedIn ? 'transparent' : props.theme.primary};
  color: ${props => props.isLoggedIn ? props.theme.text : 'white'};
  
  &:hover {
    background-color: ${props => props.isLoggedIn ? props.theme.hover : props.theme.secondary};
  }
`;

// Mobile dropdown toggle button
const MobileToggleButton = styled.button`
  display: none;
  background-color: transparent;
  border: none;
  color: ${props => props.theme.text};
  padding: 5px;
  margin-left: 5px;
  cursor: pointer;
  
  @media (max-width: 768px) {
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  svg {
    transition: transform 0.3s ease;
    transform: ${props => props.isExpanded ? 'rotate(180deg)' : 'rotate(0deg)'};
  }
`;

// Removed unused MobileButtonsContainer

const Sidebar = ({ 
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
  username
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };
  
  return (
    <SidebarContainer isExpanded={isExpanded}>
      <LogoContainer>
        <img src="/images/sculptor.svg" alt="Sculptor AI" />
        <LogoText>Sculptor</LogoText>
      </LogoContainer>
      <TopBarContainer>
        <MobileLogoContainer>
          <img src="/images/sculptor.svg" alt="Sculptor AI" />
          <MobileLogoText>Sculptor</MobileLogoText>
        </MobileLogoContainer>
        <NewChatButton onClick={createNewChat}>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          New Chat
        </NewChatButton>
        
        <MobileToggleButton onClick={toggleExpanded} isExpanded={isExpanded}>
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
        </MobileToggleButton>
      </TopBarContainer>
      
      <ScrollableContent isExpanded={isExpanded}>
        <ChatList>
          {chats.map(chat => (
            <ChatItem 
              key={chat.id} 
              active={activeChat === chat.id}
              onClick={() => setActiveChat(chat.id)}
            >
              <ChatTitle>{chat.title}</ChatTitle>
              <DeleteButton 
                onClick={(e) => {
                  e.stopPropagation();
                  deleteChat(chat.id);
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
              </DeleteButton>
            </ChatItem>
          ))}
        </ChatList>
        
        <BottomSection>
          {/* Model selection options */}
          <ModelOptionContainer>
            {availableModels.map(model => (
              <ModelOption 
                key={model.id} 
                isSelected={selectedModel === model.id}
                onClick={() => setSelectedModel(model.id)}
              >
                <ModelIcon modelId={model.id} size="small" />
                <ModelInfo>
                  <ModelName isSelected={selectedModel === model.id}>
                    {model.name}
                  </ModelName>
                  <ModelDescription>
                    {model.id === 'gemini-2-flash' ? 'Google AI' : 
                     model.id === 'claude-3.7-sonnet' ? 'Anthropic' : 
                     'OpenAI'}
                  </ModelDescription>
                </ModelInfo>
              </ModelOption>
            ))}
          </ModelOptionContainer>
          
          {/* Profile and settings buttons */}
          <ProfileButton 
            onClick={toggleProfile} 
            isLoggedIn={isLoggedIn}
            marginBottom
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
            {isLoggedIn ? username : 'Sign In'}
          </ProfileButton>
          
          <SidebarButton onClick={toggleSettings}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3"></circle>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
            </svg>
            Settings
          </SidebarButton>
        </BottomSection>
      </ScrollableContent>
    </SidebarContainer>
  );
};

export default Sidebar;