import React from 'react';
import styled from 'styled-components';

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
  pointer-events: auto;
`;

const ModalContent = styled.div`
  background-color: ${props => props.theme.sidebar};
  color: ${props => props.theme.text};
  border-radius: ${props => props.theme.name === 'retro' ? '0' : '12px'};
  width: 350px;
  max-width: 90%;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  border: ${props => props.theme.name === 'retro' ? 
    `2px solid ${props.theme.buttonHighlightLight}` : 
    'none'};
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid ${props => props.theme.border};
  background: ${props => props.theme.name === 'retro' ? props.theme.buttonFace : 'transparent'};
`;

const ModalTitle = styled.h2`
  margin: 0;
  font-size: 1.3rem;
  font-weight: 600;
  font-family: ${props => props.theme.name === 'retro' ? 'MS Sans Serif, sans-serif' : 'inherit'};
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1.5rem;
  color: ${props => props.theme.text};
  opacity: 0.7;
  transition: opacity 0.2s, transform 0.2s;
  
  &:hover {
    opacity: 1;
    transform: scale(1.1);
  }
  
  ${props => props.theme.name === 'retro' && `
    font-family: MS Sans Serif, sans-serif;
    font-size: 1.2rem;
  `}
`;

const ModalBody = styled.div`
  padding: 16px 0;
`;

const MenuItem = styled.button`
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 12px 24px;
  background: ${props => props.$active ? 
    (props.theme.name === 'retro' ? props.theme.buttonFace : 'rgba(0, 0, 0, 0.05)') : 
    'transparent'
  };
  border: none;
  text-align: left;
  font-size: 14px;
  cursor: pointer;
  color: ${props => props.theme.text};
  transition: background 0.2s ease;
  font-family: ${props => props.theme.name === 'retro' ? 'MS Sans Serif, sans-serif' : 'inherit'};
  
  &:hover {
    background: ${props => props.theme.name === 'retro' ? 
      props.theme.buttonFace : 
      'rgba(0, 0, 0, 0.05)'
    };
  }
  
  ${props => props.theme.name === 'retro' && props.$active && `
    box-shadow: -1px -1px 0 0 ${props.theme.buttonHighlightSoft} inset, 
                1px 1px 0 0 ${props.theme.buttonShadowSoft} inset;
    border: 1px solid ${props.theme.buttonShadowDark};
  `}
  
  svg {
    width: 18px;
    height: 18px;
    opacity: 0.8;
  }
`;

const MenuSection = styled.div`
  padding: 8px 0;
  border-bottom: 1px solid ${props => props.theme.border};
  
  &:last-child {
    border-bottom: none;
  }
`;

const SectionTitle = styled.div`
  padding: 8px 24px;
  font-size: 12px;
  font-weight: 600;
  color: ${props => props.theme.text}88;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const ToolMenuModal = ({ 
  isOpen, 
  onClose, 
  menuType, 
  currentValue, 
  onSelect,
  theme 
}) => {
  if (!isOpen) return null;

  const handleOutsideClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleSelect = (value) => {
    onSelect(value);
    onClose();
  };

  const renderMenuContent = () => {
    switch (menuType) {
      case 'mode':
        return (
          <MenuSection>
            <SectionTitle>Select Mode</SectionTitle>
            <MenuItem 
              $active={currentValue === null} 
              onClick={() => handleSelect(null)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="4" y="4" width="16" height="16" rx="2" ry="2"></rect>
                <rect x="9" y="9" width="6" height="6"></rect>
                <line x1="9" y1="2" x2="9" y2="4"></line>
                <line x1="15" y1="2" x2="15" y2="4"></line>
                <line x1="9" y1="20" x2="9" y2="22"></line>
                <line x1="15" y1="20" x2="15" y2="22"></line>
                <line x1="20" y1="9" x2="22" y2="9"></line>
                <line x1="20" y1="14" x2="22" y2="14"></line>
                <line x1="2" y1="9" x2="4" y2="9"></line>
                <line x1="2" y1="14" x2="4" y2="14"></line>
              </svg>
              Default
            </MenuItem>
            <MenuItem 
              $active={currentValue === 'thinking'} 
              onClick={() => handleSelect('thinking')}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z"></path>
                <line x1="16" y1="8" x2="2" y2="22"></line>
                <line x1="17.5" y1="15" x2="9" y2="15"></line>
              </svg>
              Thinking
            </MenuItem>
            <MenuItem 
              $active={currentValue === 'instant'} 
              onClick={() => handleSelect('instant')}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"></path>
              </svg>
              Instant
            </MenuItem>
          </MenuSection>
        );
      
      case 'create':
        return (
          <MenuSection>
            <SectionTitle>Create Content</SectionTitle>
            <MenuItem 
              $active={currentValue === null} 
              onClick={() => handleSelect(null)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="16"></line>
                <line x1="8" y1="12" x2="16" y2="12"></line>
              </svg>
              Default
            </MenuItem>
            <MenuItem 
              $active={currentValue === 'image'} 
              onClick={() => handleSelect('image')}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <circle cx="8.5" cy="8.5" r="1.5"></circle>
                <polyline points="21 15 16 10 5 21"></polyline>
              </svg>
              Image
            </MenuItem>
            <MenuItem 
              $active={currentValue === 'video'} 
              onClick={() => handleSelect('video')}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"></rect>
                <line x1="7" y1="2" x2="7" y2="22"></line>
                <line x1="17" y1="2" x2="17" y2="22"></line>
              </svg>
              Video
            </MenuItem>
          </MenuSection>
        );
      
      default:
        return null;
    }
  };

  return (
    <ModalOverlay onClick={handleOutsideClick}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <ModalTitle>
            {menuType === 'mode' ? 'Select Mode' : 'Create Content'}
          </ModalTitle>
          <CloseButton onClick={onClose}>
            {theme?.name === 'retro' ? '✕' : '×'}
          </CloseButton>
        </ModalHeader>
        <ModalBody>
          {renderMenuContent()}
        </ModalBody>
      </ModalContent>
    </ModalOverlay>
  );
};

export default ToolMenuModal; 