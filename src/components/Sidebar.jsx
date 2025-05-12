import React, { useState } from 'react';
import styled from 'styled-components';
import ModelIcon from './ModelIcon'; // Assuming ModelIcon is correctly imported

// Styled Components (Keep all your existing styled components definitions)
const SidebarContainer = styled.div`
  display: ${props => props.collapsed ? 'none !important' : 'flex'};
  flex-direction: column;
  width: ${props => props.collapsed ? '0 !important' : '280px'};
  height: 100%;
  background: ${props => props.theme.sidebar};
  color: ${props => props.theme.text};
  border-right: 1px solid ${props => props.theme.border};
  overflow: hidden;
  transition: width 0.3s ease;
  position: relative;
  z-index: 20;
  
  @media (max-width: 768px) {
    position: fixed;
    left: ${props => (props.collapsed ? '-100%' : '0')};
    top: 0;
    width: 100%; /* Ensure full width when shown */
    z-index: 100;
    border-right: none;
    display: flex; /* Keep display flex for layout when visible */
    transition: left 0.3s ease-in-out, width 0.3s ease; /* Animate left and width */
  }
`;

const LogoContainer = styled.div`
  display: flex;
  align-items: center;

  img {
    height: 26px;
    width: auto;
    margin-right: 8px;
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
`;

const CollapseButton = styled.button`
  width: 32px;
  height: 32px;
  background: transparent;
  border: none;
  color: ${props => props.theme.text};
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  position: ${props => props.collapsed ? 'fixed' : 'relative'};
  top: ${props => props.collapsed ? '14px' : '0'}; /* Changed from 15px to 40px */
  left: ${props => props.collapsed ? '18px' : '0'};
  z-index: 30;

  svg {
    width: 18px;
    height: 18px;
    stroke-width: 1.5px;
  }

  &:hover {
    background: ${props => props.collapsed ? 'transparent' : 'rgba(255,255,255,0.05)'};
    border-radius: ${props => props.collapsed ? '0' : '4px'};
  }

  @media (max-width: 768px) {
    display: none;
  }
`;

const TopBarContainer = styled.div`
  display: flex;
  align-items: center;
  padding: 10px 10px 10px 15px;
  width: 100%;
  justify-content: space-between;
  flex-shrink: 0; /* Prevent shrinking */

  /* Apply specific styles for mobile view */
  @media (max-width: 768px) {
    &.mobile-top-bar {
        display: flex !important; /* Override inline style */
        padding: 10px;
        width: 100%;
        justify-content: space-between;
    }
    /* Hide desktop version on mobile */
    &.desktop-top-bar {
        display: none;
    }
  }
`;


const MobileLogoContainer = styled.div`
  display: none; // Hidden by default
  align-items: center;
  margin-right: 10px; // Spacing between logo and toggle button

  img {
    height: 30px;
    margin-right: 5px;
  }

  @media (max-width: 768px) {
    display: flex; // Shown only on mobile
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
  background: transparent;
  color: ${props => props.theme.text};
  border: 1px solid ${props => props.theme.border};
  padding: 12px 15px;
  border-radius: 8px;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: center; /* Center content */
  gap: 8px;
  transition: all 0.2s ease;
  box-shadow: none;
  margin: 10px 15px;
  width: calc(100% - 30px); /* Adjust width based on margin */
  flex-shrink: 0; /* Prevent shrinking */

  &:hover {
    background: rgba(255,255,255,0.05);
    transform: translateY(-1px);
  }

  svg {
    transition: margin-right 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    margin-right: ${props => props.collapsed ? '0' : '8px'};
  }

  span {
    opacity: ${props => props.collapsed ? '0' : '1'};
    transform: translateX(${props => props.collapsed ? '-10px' : '0'});
    visibility: ${props => props.collapsed ? 'hidden' : 'visible'};
    white-space: nowrap; /* Prevent text wrapping */
    transition: opacity 0.2s ease, transform 0.25s cubic-bezier(0.4, 0, 0.2, 1), visibility 0.2s;
    transition-delay: ${props => props.collapsed ? '0s' : '0.05s'};
  }

  @media (max-width: 768px) {
    width: auto; /* Let button size naturally */
    margin: 0 10px 10px auto; /* Align right, add bottom margin */
    padding: 8px 12px; /* Slightly smaller padding */
    span { // Ensure text is visible on mobile even if screen width collapses it
        opacity: 1;
        transform: translateX(0);
        visibility: visible;
        display: inline-block;
    }
    svg {
        margin-right: 8px; /* Keep space on mobile */
    }
  }
`;

const ScrollableContent = styled.div`
  flex: 1; /* Take remaining space */
  display: flex;
  flex-direction: column;
  overflow: hidden; /* Hide overflow initially */
  margin-top: 5px;

  /* Only apply mobile specific overflow/display when expanded */
  @media (max-width: 768px) {
    display: ${props => props.isExpanded ? 'flex' : 'none'};
    overflow-y: auto; /* Allow scrolling only when expanded */
    max-height: calc(40vh - 60px); /* Adjust based on top bar height */
  }
`;

const ChatList = styled.div`
  flex-grow: 1; /* Allow chat list to grow */
  overflow-y: auto;
  padding: 0 ${props => props.collapsed ? '8px' : '10px'};
  /* Center chat items in collapsed state */
  display: flex;
  flex-direction: column;
  align-items: ${props => props.collapsed ? 'center' : 'stretch'};
  margin-bottom: 10px; /* Add space before bottom section */

  @media (max-width: 768px) {
     max-height: none; /* Remove max-height on mobile as ScrollableContent handles it */
     padding: 0 10px; /* Consistent padding */
     align-items: stretch; /* Don't center items on mobile */
     flex-grow: 0; /* Don't let it grow excessively on mobile */
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
  padding: 8px 10px;
  margin: 2px 0;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: ${props => props.collapsed ? 'center' : 'space-between'}; /* Center icon when collapsed */
  background: ${props => props.active ? `rgba(255,255,255,0.1)` : 'transparent'};
  transition: all 0.1s ease;
  width: 100%;
  height: auto;
  position: relative; /* Needed for absolute positioning of delete button */

  /* Special styling for specific theme active items */
  ${props => props.theme.name === 'bisexual' && props.active && `
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
    background: ${props => !props.active && `rgba(255,255,255,0.05)`};
  }

  @media (max-width: 768px) {
      justify-content: space-between; /* Always space-between on mobile */
  }
`;

const ChatTitle = styled.div`
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1; /* Take available space */
  margin-right: 5px; /* Space before delete button */
  opacity: ${props => props.collapsed ? '0' : '1'};
  /* We hide text using opacity/visibility, not transform, to allow hover effects */
  visibility: ${props => props.collapsed ? 'hidden' : 'visible'};
  transition: opacity 0.2s ease, visibility 0.2s;
  transition-delay: ${props => props.collapsed ? '0s' : '0.05s'};

  @media (max-width: 768px) {
      opacity: 1; /* Always visible on mobile */
      visibility: visible;
  }
`;

// New Share Button styled component
const ShareButton = styled.button`
  background: none;
  border: none;
  color: #888;
  cursor: pointer;
  padding: 5px;
  display: flex; /* Align icon nicely */
  align-items: center;
  justify-content: center;
  border-radius: 4px; /* Add slight rounding */
  opacity: 0; /* Hidden by default */
  visibility: hidden;
  transition: opacity 0.2s ease, visibility 0.2s ease, background-color 0.2s ease;
  flex-shrink: 0; /* Prevent shrinking */

  /* Show on ChatItem hover only when not collapsed */
  ${ChatItem}:hover & {
      opacity: ${props => props.collapsed ? '0' : '1'};
      visibility: ${props => props.collapsed ? 'hidden' : 'visible'};
  }

  &:hover {
    color: #1e88e5; // Different hover color (e.g., blue)
    background-color: rgba(255, 255, 255, 0.08);
  }

  /* Ensure it's always visible & hoverable on mobile */
  @media (max-width: 768px) {
      opacity: 1;
      visibility: visible;
      ${ChatItem}:hover & { /* Keep styles consistent */
          opacity: 1;
          visibility: visible;
      }
  }
`;

const DeleteButton = styled.button`
  background: none;
  border: none;
  color: #888;
  cursor: pointer;
  padding: 5px;
  display: flex; /* Align icon nicely */
  align-items: center;
  justify-content: center;
  border-radius: 4px; /* Add slight rounding */
  opacity: 0; /* Hidden by default */
  visibility: hidden;
  transition: opacity 0.2s ease, visibility 0.2s ease, background-color 0.2s ease;
  flex-shrink: 0; /* Prevent shrinking */

  /* Show on ChatItem hover only when not collapsed */
  ${ChatItem}:hover & {
      opacity: ${props => props.collapsed ? '0' : '1'};
      visibility: ${props => props.collapsed ? 'hidden' : 'visible'};
  }

  &:hover {
    color: #d32f2f;
    background-color: rgba(255, 255, 255, 0.08); /* Slight background on hover */
  }

  /* Ensure it's always visible & hoverable on mobile */
  @media (max-width: 768px) {
      opacity: 1;
      visibility: visible;
      ${ChatItem}:hover & { /* Keep styles consistent */
          opacity: 1;
          visibility: visible;
      }
  }
`;

const ButtonContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 4px; /* Space between buttons */
  flex-shrink: 0;

  /* Control visibility based on parent hover */
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.2s ease, visibility 0.2s ease;

  ${ChatItem}:hover & {
      opacity: ${props => props.collapsed ? '0' : '1'};
      visibility: ${props => props.collapsed ? 'hidden' : 'visible'};
  }

  /* Ensure buttons are always visible on mobile */
  @media (max-width: 768px) {
      opacity: 1;
      visibility: visible;
      ${ChatItem}:hover & {
          opacity: 1;
          visibility: visible;
      }
  }
`;

const BottomSection = styled.div`
  padding: ${props => props.collapsed ? '10px 5px' : '15px'};
  border-top: 1px solid ${props => props.theme.border};
  margin-top: auto; /* Push to bottom */
  flex-shrink: 0; /* Prevent shrinking */

  /* Remove border and adjust padding for mobile view within ScrollableContent */
  @media (max-width: 768px) {
      border-top: none;
      padding: 10px 15px; /* Consistent padding */
  }
`;

const SectionHeader = styled.div`
  padding: 0 15px;
  margin-top: 15px;
  margin-bottom: 5px;
  font-size: 11px;
  text-transform: uppercase;
  color: #888;
  font-weight: 500;
  letter-spacing: 0.5px;
  opacity: ${props => props.collapsed ? '0' : '1'};
  visibility: ${props => props.collapsed ? 'hidden' : 'visible'};
  transition: opacity 0.2s ease, visibility 0.2s;
  transition-delay: ${props => props.collapsed ? '0s' : '0.05s'};

  @media (max-width: 768px) {
      opacity: 1; /* Always visible on mobile */
      visibility: visible;
      margin-top: 10px; /* Adjust spacing */
  }
`;


const ModelDropdownContainer = styled.div`
  position: relative;
  width: 100%;
  padding: 5px 15px; /* Match button horizontal padding */

  @media (max-width: 768px) {
    padding: 0 10px 10px; /* Adjust padding */
  }
`;

const ModelDropdownButton = styled.button`
  width: 100%;
  background: ${props => props.theme.inputBackground};
  border: 1px solid ${props => props.theme.border};
  border-radius: 12px;
  padding: ${props => props.collapsed ? '8px' : '10px 12px'}; /* Adjust padding */
  display: flex;
  align-items: center;
  justify-content: ${props => props.collapsed ? 'center' : 'space-between'};
  cursor: pointer;
  transition: all 0.2s ease;
  backdrop-filter: blur(5px);
  /* margin-bottom: 10px; Removed margin, handled by container */
  min-height: 38px; /* Ensure consistent height */

  &:hover {
    box-shadow: 0 2px 5px rgba(0,0,0,0.1);
  }

  /* Icon and text container */
  > div {
      display: flex;
      align-items: center;
      gap: 8px; /* Space between icon and text */
      overflow: hidden; /* Prevent text overflow issues */
  }

  /* Dropdown arrow */
  > svg:last-child {
      transition: transform 0.2s;
      transform: ${props => props.isOpen ? 'rotate(180deg)' : 'rotate(0deg)'};
      flex-shrink: 0; /* Prevent arrow shrinking */
      opacity: ${props => props.collapsed ? '0' : '1'};
      visibility: ${props => props.collapsed ? 'hidden' : 'visible'};
  }

  @media (max-width: 768px) {
      justify-content: space-between; /* Always space-between */
      padding: 10px 12px; /* Consistent padding */
       > svg:last-child { /* Ensure arrow is always visible */
           opacity: 1;
           visibility: visible;
       }
  }
`;

const ModelDropdownText = styled.span`
  opacity: ${props => props.collapsed ? '0' : '1'};
  visibility: ${props => props.collapsed ? 'hidden' : 'visible'};
  transition: opacity 0.2s ease, visibility 0.2s;
  transition-delay: ${props => props.collapsed ? '0s' : '0.05s'};
  color: ${props => props.theme.text};
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;

  @media (max-width: 768px) {
      opacity: 1; /* Always visible on mobile */
      visibility: visible;
  }
`;

const ModelDropdownContent = styled.div`
  position: absolute;
  bottom: calc(100% + 5px); /* Position above the button with gap */
  left: 15px; /* Align with container padding */
  right: 15px; /* Align with container padding */
  background: ${props => props.theme.inputBackground};
  backdrop-filter: ${props => props.theme.glassEffect};
  -webkit-backdrop-filter: ${props => props.theme.glassEffect};
  border-radius: 12px;
  border: 1px solid ${props => props.theme.border}; /* Add border */
  box-shadow: 0 5px 15px rgba(0,0,0,0.1);
  z-index: 30;
  overflow: hidden;
  max-height: 200px; /* Limit height */
  overflow-y: auto; /* Allow scrolling if needed */
  display: ${props => props.isOpen ? 'block' : 'none'};
  animation: fadeIn 0.2s ease;

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }

  @media (max-width: 768px) {
      left: 10px;
      right: 10px;
      /* Consider positioning below on mobile if space is limited */
      /* bottom: auto; top: calc(100% + 5px); */
  }
`;

const ModelOption = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  margin: 4px; /* Add margin around options */
  cursor: pointer;
  transition: background 0.2s ease;
  background: ${props => props.isSelected ? 'rgba(255,255,255,0.1)' : 'transparent'};
  border-radius: 8px; /* Match dropdown button */

  &:hover {
    background: rgba(255,255,255,0.05);
  }
`;

const ModelInfo = styled.div`
  display: flex;
  flex-direction: column;
  overflow: hidden; /* Prevent text overflow */
  opacity: ${props => props.collapsed ? '0' : '1'};
  visibility: ${props => props.collapsed ? 'hidden' : 'visible'};
  transition: opacity 0.2s ease, visibility 0.2s;
  transition-delay: ${props => props.collapsed ? '0s' : '0.05s'};

  @media (max-width: 768px) {
      opacity: 1; /* Always visible on mobile */
      visibility: visible;
  }
`;

const ModelName = styled.span`
  font-weight: ${props => props.isSelected ? 'bold' : '500'};
  color: ${props => props.theme.text};
  font-size: 0.9rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const ModelDescription = styled.span`
  font-size: 0.8rem;
  color: ${props => props.theme.text}80;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const SidebarButton = styled.button`
  width: 100%;
  padding: 10px;
  background: transparent;
  border: 1px solid ${props => props.theme.border};
  border-radius: 8px;
  color: ${props => props.theme.text};
  display: flex;
  align-items: center;
  justify-content: ${props => props.collapsed ? 'center' : 'flex-start'}; /* Center icon when collapsed */
  gap: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-bottom: ${props => props.marginBottom ? '8px' : '0'};
  min-height: 40px; /* Ensure consistent height */

  span {
    opacity: ${props => props.collapsed ? '0' : '1'};
    visibility: ${props => props.collapsed ? 'hidden' : 'visible'};
    white-space: nowrap;
    transition: opacity 0.2s ease, visibility 0.2s;
    transition-delay: ${props => props.collapsed ? '0s' : '0.05s'};
  }

  svg {
    flex-shrink: 0; /* Prevent icon shrinking */
  }

  &:hover {
    background: rgba(255,255,255,0.05);
  }

  @media (max-width: 768px) {
      justify-content: flex-start; /* Always left-align on mobile */
      span { /* Always visible */
          opacity: 1;
          visibility: visible;
      }
  }
`;

const ProfileButton = styled(SidebarButton)`
 /* Inherits styles from SidebarButton */
 /* No specific overrides needed based on current styles */
`;

// Mobile dropdown toggle button
const MobileToggleButton = styled.button`
  display: none; // Hidden by default
  background: transparent;
  border: none;
  color: ${props => props.theme.text};
  border-radius: 4px;
  width: 36px;
  height: 36px;
  cursor: pointer;
  transition: all 0.2s ease;
  align-items: center;
  justify-content: center;

  @media (max-width: 768px) {
    display: flex; // Shown only on mobile
    /* Removed position fixed/absolute logic - handled by TopBarContainer */
    margin-left: 8px; /* Add space from logo */
  }

  &:hover {
    background: rgba(255,255,255,0.05);
  }

  svg {
    transition: transform 0.3s ease;
    transform: ${props => props.isExpanded ? 'rotate(180deg)' : 'rotate(0deg)'};
  }
`;


// --- React Component ---

const Sidebar = ({
  chats = [], // Default to empty array
  activeChat,
  setActiveChat,
  createNewChat,
  deleteChat,
  availableModels = [], // Default to empty array
  selectedModel,
  setSelectedModel,
  toggleSettings,
  toggleProfile,
  isLoggedIn,
  username,
  collapsed,
  setCollapsed
}) => {
  const [isMobileExpanded, setIsMobileExpanded] = useState(false);
  const [showHamburger, setShowHamburger] = useState(true); // Show hamburger
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const [copyStatus, setCopyStatus] = useState('');

  // Toggle mobile content visibility
  const toggleMobileExpanded = () => {
    setIsMobileExpanded(!isMobileExpanded);
  };

  // Toggle desktop sidebar collapsed state
  const toggleCollapsed = () => {
    const newState = !collapsed;
    setCollapsed(newState);
    setIsModelDropdownOpen(false); // Close dropdown when collapsing/expanding

    // Hamburger visibility logic for transition
    if (!newState) { // If expanding
      // No special logic needed on expand
    } else { // If collapsing
      setShowHamburger(false);
      setTimeout(() => setShowHamburger(true), 300); // Show after transition duration
    }
  };

  // Handle model selection from dropdown
  const handleSelectModel = (modelId) => {
    setSelectedModel(modelId);
    setIsModelDropdownOpen(false); // Close dropdown after selection
  };

  // Find the currently selected model object for display
  const currentModel = availableModels.find(m => m.id === selectedModel);

  // Handle sharing a chat
  const handleShareChat = async (chatId) => {
    // Updated share functionality: copy a static link to the clipboard
    const shareUrl = `${window.location.origin}/share-view?id=${chatId}`; // Use query param for ID
    try {
      await navigator.clipboard.writeText(shareUrl);
      alert('Static share link copied to clipboard! You need to implement the /share-view route.');
    } catch (err) {
      console.error('Failed to copy share link: ', err);
      alert('Could not copy share link.');
    }
  };

  return (
    <>
      {/* Main Sidebar container */}
      <SidebarContainer isExpanded={isMobileExpanded} collapsed={collapsed}>
        {/* Top Bar for Desktop */}
        <TopBarContainer className="desktop-top-bar" style={{ padding: '20px 15px 10px 15px', alignItems: 'center' }}>
           <LogoContainer>
             <img src="/images/sculptor.svg" alt="Sculptor AI" />
             <LogoText>Sculptor</LogoText>
           </LogoContainer>
           
           {/* Left Collapse Button (now on the right) */}
           {!collapsed && (
             <CollapseButton 
               onClick={toggleCollapsed} 
               collapsed={collapsed} 
               title="Collapse Sidebar"
               style={{ marginLeft: 'auto' }}>
               <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                 <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="9" y1="3" x2="9" y2="21"></line>
               </svg>
             </CollapseButton>
           )}
        </TopBarContainer>
        
        {/* New Chat Button as a standalone component below the logo */}
        {!collapsed && (
          <NewChatButton 
            onClick={createNewChat} 
            collapsed={collapsed} 
            style={{ 
              background: 'transparent', 
              margin: '5px 15px 15px 15px',
              width: 'calc(100% - 30px)',
              justifyContent: 'center',
              padding: '10px 12px'
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            <span>New Chat</span>
          </NewChatButton>
        )}

        {/* Top Bar for Mobile (Logo + Expander + New Chat) */}
        <TopBarContainer className="mobile-top-bar" style={{ display: 'none' }}> {/* Managed by CSS */}
          <MobileLogoContainer>
            <img src="/images/sculptor.svg" alt="Sculptor AI" />
            <MobileLogoText>Sculptor</MobileLogoText>
          </MobileLogoContainer>
          {/* Group New Chat and Toggle Button */}
          <div style={{ display: 'flex', alignItems: 'center', marginLeft: 'auto' }}>
             <NewChatButton onClick={createNewChat} collapsed={collapsed}>
                 <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                     <line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line>
                 </svg>
                 <span>New Chat</span>
             </NewChatButton>
             <MobileToggleButton
                 onClick={toggleMobileExpanded}
                 isExpanded={isMobileExpanded}
                 title={isMobileExpanded ? "Collapse Menu" : "Expand Menu"}
             >
                 <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    {isMobileExpanded
                      ? <polyline points="18 15 12 9 6 15"></polyline> // Up arrow
                      : <polyline points="6 9 12 15 18 9"></polyline> // Down arrow
                    }
                 </svg>
             </MobileToggleButton>
           </div>
        </TopBarContainer>


        {/* --- START: Main content area (Scrollable + Bottom fixed) --- */}
        {/* This fragment wrapper is crucial for the original error fix */}
        {!collapsed && (
          <>
            {/* Scrollable Area (Models, Chats) */}
            <ScrollableContent isExpanded={isMobileExpanded}>

              {/* Models Section removed as requested */}


              {/* --- Chats Section --- */}
              <SectionHeader collapsed={collapsed}>Chats</SectionHeader>
              <ChatList collapsed={collapsed}>
                {(chats || []).map(chat => (
                  <ChatItem
                    key={chat.id}
                    active={activeChat === chat.id}
                    onClick={() => setActiveChat(chat.id)}
                    collapsed={collapsed}
                    title={chat.title || `Chat ${chat.id.substring(0, 4)}`}
                  >
                    {/* TODO: Add chat icon if desired */}
                    <ChatTitle collapsed={collapsed}>{chat.title || `Chat ${chat.id.substring(0, 4)}`}</ChatTitle>
                    {/* Container for action buttons */}
                    <ButtonContainer collapsed={collapsed}>
                      <ShareButton
                        title="Share Chat"
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent chat selection
                          handleShareChat(chat.id);
                        }}
                      >
                        {/* Share Icon (Feather Icons) */}
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path>
                          <polyline points="16 6 12 2 8 6"></polyline>
                          <line x1="12" y1="2" x2="12" y2="15"></line>
                        </svg>
                      </ShareButton>
                      <DeleteButton
                        title="Delete Chat"
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent chat selection
                          deleteChat(chat.id);
                        }}
                      >
                        {/* Trash Icon (Feather Icons) */}
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6"></polyline>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1-2-2h4a2 2 0 0 1-2 2v2"></path>
                          <line x1="10" y1="11" x2="10" y2="17"></line>
                          <line x1="14" y1="11" x2="14" y2="17"></line>
                        </svg>
                      </DeleteButton>
                    </ButtonContainer>
                  </ChatItem>
                ))}
              </ChatList>
              {/* Display copy status message */}
              {copyStatus && <div style={{ padding: '5px 10px', fontSize: '11px', color: '#aaa', textAlign: 'center' }}>{copyStatus}</div>}
            </ScrollableContent>

            {/* --- Bottom Buttons Section (Profile, Settings) --- */}
            {/* Rendered outside ScrollableContent to stick to bottom */}
            <BottomSection collapsed={collapsed}>
                {/* Profile / Sign In Button */}
                <ProfileButton
                  onClick={toggleProfile}
                  isLoggedIn={isLoggedIn}
                  marginBottom
                  collapsed={collapsed}
                  title={isLoggedIn ? `View profile: ${username}` : "Sign In"}
                >
                   <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                     <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle>
                   </svg>
                   <span collapsed={collapsed}>{isLoggedIn ? username : 'Sign In'}</span>
                </ProfileButton>

                {/* Settings Button */}
                <SidebarButton onClick={toggleSettings} collapsed={collapsed} title="Open Settings">
                   <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                     <circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                   </svg>
                   <span collapsed={collapsed}>Settings</span>
                </SidebarButton>
              </BottomSection>
          </>
        )}
        {/* --- END: Main content area --- */}

      </SidebarContainer>
    </>
  );
};

export default Sidebar;
