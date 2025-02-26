import React, { useState } from 'react';
import styled from 'styled-components';
import ModelIcon from './ModelIcon';

const SidebarContainer = styled.div`
  width: ${props => props.collapsed ? '60px' : '260px'};
  background: ${props => props.theme.sidebar};
  backdrop-filter: ${props => props.theme.glassEffect};
  -webkit-backdrop-filter: ${props => props.theme.glassEffect};
  border-right: 1px solid ${props => props.theme.border};
  display: flex;
  flex-direction: column;
  height: 100%;
  transition: width 0.3s ease-in-out;
  box-shadow: 0 0 15px rgba(0, 0, 0, 0.05);
  position: relative;
  z-index: 10;
  
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
  justify-content: ${props => props.collapsed ? 'center' : 'flex-start'};
  padding: 18px 15px 10px;
  
  img {
    height: 36px;
    width: auto;
    margin-right: ${props => props.collapsed ? '0' : '8px'};
    transition: margin 0.3s ease;
  }
  
  @media (max-width: 768px) {
    display: none;
  }
`;

const LogoText = styled.span`
  font-family: 'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif;
  font-weight: 600;
  font-size: 20px;
  letter-spacing: 0.5px;
  color: ${props => props.theme.text};
  display: ${props => props.collapsed ? 'none' : 'block'};
  transition: display 0.3s ease;
`;

const CollapseButton = styled.button`
  position: absolute;
  right: -12px;
  top: 20px;
  width: 24px;
  height: 24px;
  background: ${props => props.theme.buttonGradient};
  border: none;
  border-radius: 50%;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 20;
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
  transition: all 0.2s ease;
  
  &:hover {
    background: ${props => props.theme.buttonHoverGradient};
    transform: scale(1.1);
    box-shadow: 0 4px 10px rgba(0,0,0,0.2);
  }
  
  @media (max-width: 768px) {
    display: none;
  }
`;

const TopBarContainer = styled.div`
  display: flex;
  align-items: center;
  padding: ${props => props.collapsed ? '10px 5px' : '10px 15px'};
  
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
  font-family: 'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif;
  font-weight: 600;
  font-size: 16px;
  letter-spacing: 0.5px;
  color: ${props => props.theme.text};
`;

const NewChatButton = styled.button`
  background: ${props => props.theme.buttonGradient};
  color: white;
  border: none;
  padding: ${props => props.collapsed ? '8px' : '10px 15px'};
  border-radius: 12px;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  flex: 1;
  box-shadow: 0 2px 5px rgba(0,0,0,0.1);

  &:hover {
    background: ${props => props.theme.buttonHoverGradient};
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(0,0,0,0.15);
  }

  svg {
    margin-right: ${props => props.collapsed ? '0' : '8px'};
  }
  
  span {
    display: ${props => props.collapsed ? 'none' : 'inline-block'};
  }
  
  @media (max-width: 768px) {
    margin-right: 10px;
    
    span {
      display: inline-block;
    }
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
  padding: 0 ${props => props.collapsed ? '5px' : '10px'};
  
  @media (max-width: 768px) {
    max-height: none;
  }
  
  /* Stylish scrollbar */
  &::-webkit-scrollbar {
    width: 5px;
  }
  
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  
  &::-webkit-scrollbar-thumb {
    background: ${props => props.theme.border};
    border-radius: 10px;
  }
`;

const ChatItem = styled.div`
  padding: 10px;
  margin: 5px 0;
  border-radius: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: ${props => props.active 
    ? `linear-gradient(145deg, ${props.theme.hover}, rgba(255,255,255,0.1))` 
    : 'transparent'};
  backdrop-filter: ${props => props.active ? props.theme.glassEffect : 'none'};
  -webkit-backdrop-filter: ${props => props.active ? props.theme.glassEffect : 'none'};
  box-shadow: ${props => props.active ? '0 2px 8px rgba(0,0,0,0.06)' : 'none'};
  transition: all 0.2s ease;
  
  /* Special styling for bisexual theme active items */
  ${props => props.theme.name === 'bisexual' && props.active && `
    position: relative;
    
    &::before {
      content: '';
      position: absolute;
      left: 0;
      top: 0;
      bottom: 0;
      width: 3px;
      background: ${props.theme.accentGradient};
      border-top-left-radius: 12px;
      border-bottom-left-radius: 12px;
    }
  `}

  &:hover {
    background: ${props => !props.active && `linear-gradient(145deg, ${props.theme.hover}, rgba(255,255,255,0.05))`};
    transform: translateY(-1px);
  }
`;

const ChatTitle = styled.div`
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
  display: ${props => props.collapsed ? 'none' : 'block'};
`;

const DeleteButton = styled.button`
  background: none;
  border: none;
  color: #888;
  cursor: pointer;
  padding: 5px;
  visibility: hidden;
  display: ${props => props.collapsed ? 'none' : 'flex'};
  
  ${ChatItem}:hover & {
    visibility: visible;
  }

  &:hover {
    color: #d32f2f;
  }
`;

const BottomSection = styled.div`
  padding: ${props => props.collapsed ? '10px 5px' : '15px'};
  border-top: 1px solid ${props => props.theme.border};
  
  @media (max-width: 768px) {
    border-top: none;
    padding-top: 5px;
  }
`;

const ModelDropdownContainer = styled.div`
  position: relative;
  width: 100%;
`;

const ModelDropdownButton = styled.button`
  width: 100%;
  background: ${props => props.theme.inputBackground};
  border: 1px solid ${props => props.theme.border};
  border-radius: 12px;
  padding: ${props => props.collapsed ? '8px' : '10px'};
  display: flex;
  align-items: center;
  justify-content: ${props => props.collapsed ? 'center' : 'space-between'};
  cursor: pointer;
  transition: all 0.2s ease;
  backdrop-filter: blur(5px);
  margin-bottom: 10px;
  
  &:hover {
    box-shadow: 0 2px 5px rgba(0,0,0,0.1);
  }
`;

const ModelDropdownText = styled.span`
  display: ${props => props.collapsed ? 'none' : 'inline-block'};
  color: ${props => props.theme.text};
  font-weight: 500;
`;

const ModelDropdownContent = styled.div`
  position: absolute;
  bottom: 100%;
  left: 0;
  right: 0;
  margin-bottom: 5px;
  background: ${props => props.theme.inputBackground};
  backdrop-filter: ${props => props.theme.glassEffect};
  -webkit-backdrop-filter: ${props => props.theme.glassEffect};
  border-radius: 12px;
  box-shadow: 0 5px 15px rgba(0,0,0,0.1);
  z-index: 30;
  overflow: hidden;
  display: ${props => props.isOpen ? 'block' : 'none'};
  animation: fadeIn 0.2s ease;
  
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
`;

const ModelOption = styled.div`
  display: flex;
  align-items: center;
  padding: 8px;
  cursor: pointer;
  transition: background 0.2s ease;
  background: ${props => props.isSelected ? 'rgba(0,0,0,0.05)' : 'transparent'};
  
  &:hover {
    background: rgba(0,0,0,0.05);
  }
`;

const ModelInfo = styled.div`
  display: ${props => props.collapsed ? 'none' : 'flex'};
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
  padding: ${props => props.collapsed ? '8px' : '10px'};
  background: transparent;
  border: 1px solid ${props => props.theme.border};
  border-radius: 12px;
  color: ${props => props.theme.text};
  display: flex;
  align-items: center;
  justify-content: ${props => props.collapsed ? 'center' : 'flex-start'};
  cursor: pointer;
  transition: all 0.2s ease;
  margin-bottom: ${props => props.marginBottom ? '8px' : '0'};
  
  &:hover {
    background: rgba(0,0,0,0.05);
    box-shadow: 0 2px 5px rgba(0,0,0,0.05);
  }
  
  svg {
    margin-right: ${props => props.collapsed ? '0' : '8px'};
  }
  
  span {
    display: ${props => props.collapsed ? 'none' : 'inline-block'};
  }
`;

const ProfileButton = styled(SidebarButton)`
  background: ${props => props.isLoggedIn 
    ? 'transparent' 
    : props.theme.buttonGradient};
  color: ${props => props.isLoggedIn ? props.theme.text : 'white'};
  
  &:hover {
    background: ${props => props.isLoggedIn 
      ? 'rgba(0,0,0,0.05)' 
      : props.theme.buttonHoverGradient};
  }
`;

// Mobile dropdown toggle button
const MobileToggleButton = styled.button`
  display: none;
  background: ${props => props.theme.buttonGradient};
  border: none;
  color: white;
  border-radius: 50%;
  width: 36px;
  height: 36px;
  margin-left: 8px;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  transition: all 0.2s ease;
  
  @media (max-width: 768px) {
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  &:hover {
    background: ${props => props.theme.buttonHoverGradient};
    transform: scale(1.05);
    box-shadow: 0 4px 10px rgba(0,0,0,0.15);
  }
  
  svg {
    transition: transform 0.3s ease;
    transform: ${props => props.isExpanded ? 'rotate(180deg)' : 'rotate(0deg)'};
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
  const [isExpanded, setIsExpanded] = useState(false);
  const [modelDropdownOpen, setModelDropdownOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  
  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };
  
  const toggleCollapsed = () => {
    setCollapsed(!collapsed);
  };
  
  const toggleModelDropdown = () => {
    setModelDropdownOpen(!modelDropdownOpen);
  };
  
  const selectModel = (modelId) => {
    setSelectedModel(modelId);
    setModelDropdownOpen(false);
  };
  
  // Get current model display name
  const currentModel = availableModels.find(model => model.id === selectedModel);
  
  return (
    <SidebarContainer isExpanded={isExpanded} collapsed={collapsed}>
      <CollapseButton onClick={toggleCollapsed}>
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          {collapsed 
            ? <polyline points="13 17 18 12 13 7"></polyline> 
            : <polyline points="11 17 6 12 11 7"></polyline>}
        </svg>
      </CollapseButton>
      
      <LogoContainer collapsed={collapsed}>
        <img src="/images/sculptor.svg" alt="Sculptor AI" />
        <LogoText collapsed={collapsed}>Sculptor</LogoText>
      </LogoContainer>
      
      <TopBarContainer collapsed={collapsed}>
        <MobileLogoContainer>
          <img src="/images/sculptor.svg" alt="Sculptor AI" />
          <MobileLogoText>Sculptor</MobileLogoText>
        </MobileLogoContainer>
        
        <NewChatButton onClick={createNewChat} collapsed={collapsed}>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          <span>New Chat</span>
        </NewChatButton>
        
        <MobileToggleButton onClick={toggleExpanded} isExpanded={isExpanded}>
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            {isExpanded 
              ? <polyline points="18 15 12 9 6 15"></polyline>
              : <polyline points="6 9 12 15 18 9"></polyline>
            }
          </svg>
        </MobileToggleButton>
      </TopBarContainer>
      
      <ScrollableContent isExpanded={isExpanded}>
        <ChatList collapsed={collapsed}>
          {chats.map(chat => (
            <ChatItem 
              key={chat.id} 
              active={activeChat === chat.id}
              onClick={() => setActiveChat(chat.id)}
            >
              <ChatTitle collapsed={collapsed}>{chat.title}</ChatTitle>
              <DeleteButton 
                collapsed={collapsed}
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
        
        <BottomSection collapsed={collapsed}>
          {/* Remove the model dropdown selection section - start */}
          {/* 
          <ModelDropdownContainer>
            <ModelDropdownButton onClick={toggleModelDropdown} collapsed={collapsed}>
              <ModelIcon modelId={selectedModel} size="small" />
              <ModelDropdownText collapsed={collapsed}>
                {currentModel?.name || "Select Model"}
              </ModelDropdownText>
              {!collapsed && (
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              )}
            </ModelDropdownButton>
            
            <ModelDropdownContent isOpen={modelDropdownOpen}>
              {availableModels.map(model => (
                <ModelOption 
                  key={model.id} 
                  isSelected={selectedModel === model.id}
                  onClick={() => selectModel(model.id)}
                >
                  <ModelIcon modelId={model.id} size="small" />
                  <ModelInfo collapsed={collapsed}>
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
            </ModelDropdownContent>
          </ModelDropdownContainer>
          */}
          {/* Remove the model dropdown selection section - end */}
          
          {/* Profile and settings buttons */}
          <ProfileButton 
            onClick={toggleProfile} 
            isLoggedIn={isLoggedIn}
            marginBottom
            collapsed={collapsed}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
            <span>{isLoggedIn ? username : 'Sign In'}</span>
          </ProfileButton>
          
          <SidebarButton onClick={toggleSettings} collapsed={collapsed}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3"></circle>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
            </svg>
            <span>Settings</span>
          </SidebarButton>
        </BottomSection>
      </ScrollableContent>
    </SidebarContainer>
  );
};

export default Sidebar;