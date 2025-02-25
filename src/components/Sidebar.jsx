import React from 'react';
import styled from 'styled-components';
import ModelIcon from './ModelIcon';

const SidebarContainer = styled.div`
  width: 260px;
  background-color: ${props => props.theme.sidebar};
  border-right: 1px solid ${props => props.theme.border};
  display: flex;
  flex-direction: column;
  height: 100%;
`;

const NewChatButton = styled.button`
  background-color: ${props => props.theme.primary};
  color: white;
  border: none;
  padding: 10px 15px;
  border-radius: 5px;
  margin: 15px;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s;

  &:hover {
    background-color: ${props => props.theme.secondary};
  }

  svg {
    margin-right: 8px;
  }
`;

const ChatList = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 0 10px;
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
  return (
    <SidebarContainer>
      <NewChatButton onClick={createNewChat}>
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
        New Chat
      </NewChatButton>
      
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
    </SidebarContainer>
  );
};

export default Sidebar;