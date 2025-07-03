import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom'; // Import ReactDOM for createPortal
import styled from 'styled-components';

const DropdownBackdrop = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: transparent; /* No visible backdrop, just for click detection */
  z-index: 999; /* Lower than menu, but enough to catch clicks */
  pointer-events: auto;
`;

const MenuContainer = styled.div`
  position: fixed; /* Changed from absolute to fixed for more reliable positioning */
  background-color: ${props => props.theme.sidebar};
  color: ${props => props.theme.text};
  border-radius: ${props => props.theme.name === 'retro' ? '0' : '8px'};
  min-width: 220px; /* Adjusted typical dropdown width */
  max-width: 300px;
  box-shadow: ${props => props.theme.name === 'retro' ? 
    `2px 2px 0 0 ${props.theme.buttonShadowDark}, -1px -1px 0 0 ${props.theme.buttonHighlightLight}` : 
    '0 5px 15px rgba(0,0,0,0.15)'};
  overflow: hidden;
  border: ${props => props.theme.name === 'retro' ? 
    `1px solid ${props.theme.buttonShadowDark}` : 
    `1px solid ${props.theme.border}`};
  z-index: 1001; /* Increased z-index to be higher than sidebar (101) */
  /* Positioning will be handled via style prop or dedicated props */
  visibility: ${props => props.$visible ? 'visible' : 'hidden'}; /* Control visibility */
  opacity: ${props => props.$visible ? 1 : 0};
  transition: opacity 0.1s ease-in-out, visibility 0.1s ease-in-out;
`;

const ModalBody = styled.div`
  padding: ${props => props.theme.name === 'retro' ? '4px' : '8px 0'};
`;

const MenuItem = styled.button`
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: ${props => props.theme.name === 'retro' ? '6px 12px' : '10px 16px'};
  background: ${props => props.$active ? 
    (props.theme.name === 'retro' ? props.theme.highlightBackground : 'rgba(0, 0, 0, 0.05)') : 
    'transparent'
  };
  border: none;
  text-align: left;
  font-size: ${props => props.theme.name === 'retro' ? '11px' : '14px'};
  cursor: pointer;
  color: ${props => props.$active && props.theme.name === 'retro' ? props.theme.highlightText : props.theme.text};
  transition: background 0.2s ease;
  font-family: ${props => props.theme.name === 'retro' ? 'MS Sans Serif, MSW98UI, Tahoma, sans-serif' : 'inherit'};
  
  &:hover {
    background: ${props => props.theme.name === 'retro' ? 
      (props.$active ? props.theme.highlightBackground : props.theme.buttonFaceHover) : // Assuming buttonFaceHover or similar
      'rgba(0, 0, 0, 0.08)' // Darker hover for non-retro
    };
    color: ${props => props.theme.name === 'retro' ? 
      (props.$active ? props.theme.highlightText : props.theme.text) : // Keep text color for retro active, otherwise default
      props.theme.text
    };
  }
  
  ${props => props.theme.name === 'retro' && props.$active && `
    // For retro, active state might not need additional box shadow if background is highlight
    // box-shadow: -1px -1px 0 0 ${props.theme.buttonHighlightSoft} inset, 
    //             1px 1px 0 0 ${props.theme.buttonShadowSoft} inset;
    // border: 1px solid ${props.theme.buttonShadowDark}; // Border might be too much with highlight bg
  `}
  
  svg {
    width: 18px;
    height: 18px;
    opacity: 0.8;
  }
`;

const MenuSection = styled.div`
  padding: 0; /* Adjusted for compact menu */
  /* border-bottom: 1px solid ${props => props.theme.border}; Remove border between sections for a unified menu */
  
  &:last-child {
    border-bottom: none;
  }
`;

const SectionTitle = styled.div`
  padding: 8px 16px 4px 16px; /* Adjusted padding */
  font-size: ${props => props.theme.name === 'retro' ? '10px' : '11px'};
  font-weight: 600;
  color: ${props => props.theme.text}aa; /* Slightly more subtle */
  text-transform: uppercase;
  letter-spacing: 0.5px;
  display: ${props => props.theme.name === 'retro' ? 'none' : 'block'}; /* Hide section titles for retro by default to mimic native menus */
`;

const ToolMenuModal = ({ 
  isOpen, 
  onClose, 
  menuType, 
  currentValue, 
  onSelect,
  theme,
  rect
}) => {
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0, visibility: 'hidden' });
  const [portalNode, setPortalNode] = useState(null);

  useEffect(() => {
    // Ensure portal root exists, or create it
    let node = document.getElementById('portal-root');
    if (!node) {
      node = document.createElement('div');
      node.id = 'portal-root';
      document.body.appendChild(node);
    }
    setPortalNode(node);

    // Cleanup portal root if this component unmounts and it created it (optional)
    // return () => {
    //   if (node && node.id === 'portal-root' && node.childNodes.length === 0) {
    //     document.body.removeChild(node);
    //   }
    // };
  }, []);

  useEffect(() => {
    if (isOpen && rect) { 
      const menuHeight = 200; // Estimated menu height
      const viewportHeight = window.innerHeight;
      const spaceBelow = viewportHeight - rect.bottom;
      const spaceAbove = rect.top;
      
      let newPosition;
      
      // If there's not enough space below and there's more space above, flip upward
      if (spaceBelow < menuHeight && spaceAbove > spaceBelow) {
        console.log('Flipping menu upward - spaceBelow:', spaceBelow, 'spaceAbove:', spaceAbove);
        newPosition = {
          top: rect.top - menuHeight - 5, // Position above the trigger
          left: rect.left,
          visibility: 'visible'
        };
      } else {
        console.log('Positioning menu below - spaceBelow:', spaceBelow, 'spaceAbove:', spaceAbove);
        newPosition = {
          top: rect.bottom + 5, // rect.bottom from getBoundingClientRect is viewport-relative
          left: rect.left,      // rect.left from getBoundingClientRect is viewport-relative
          visibility: 'visible'
        };
      }
      
      setMenuPosition(newPosition);
    } else {
      setMenuPosition(prev => ({ ...prev, visibility: 'hidden' }));
    }
  }, [isOpen, rect, theme]); 

  if (!portalNode || (!isOpen && menuPosition.visibility === 'hidden')) { 
    return null;
  }

  const handleSelect = (value) => {
    onSelect(value);
    onClose();
  };

  const renderMenuContent = () => {
    switch (menuType) {
      case 'mode':
        return (
          <MenuSection theme={theme}>
            <SectionTitle theme={theme}>Select Mode</SectionTitle>
            <MenuItem 
              $active={currentValue === null} 
              onClick={() => handleSelect(null)}
              theme={theme}
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
              theme={theme}
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
              theme={theme}
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
          <MenuSection theme={theme}>
            <SectionTitle theme={theme}>Create Content</SectionTitle>
            <MenuItem 
              $active={currentValue === null} 
              onClick={() => handleSelect(null)}
              theme={theme}
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
              theme={theme}
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
              theme={theme}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"></rect>
                <line x1="7" y1="2" x2="7" y2="22"></line>
                <line x1="17" y1="2" x2="17" y2="22"></line>
              </svg>
              Video
            </MenuItem>
            <MenuItem
              $active={currentValue === 'flowchart'}
              onClick={() => handleSelect('flowchart')}
              theme={theme}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="18" r="3"></circle>
                <circle cx="6" cy="6" r="3"></circle>
                <circle cx="18" cy="6" r="3"></circle>
                <path d="M18 9v1a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V9"></path>
                <path d="M12 12v3"></path>
              </svg>
              Flowchart
            </MenuItem>
            <MenuItem
              $active={currentValue === 'sandbox3d'}
              onClick={() => handleSelect('sandbox3d')}
              theme={theme}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                <line x1="12" y1="22.08" x2="12" y2="12"></line>
              </svg>
              3D Sandbox
            </MenuItem>
          </MenuSection>
        );
      default:
        return null;
    }
  };

  return ReactDOM.createPortal(
    <>
      {isOpen && <DropdownBackdrop onClick={onClose} />}
      <MenuContainer 
        theme={theme} 
        style={{ 
          top: `${menuPosition.top}px`, 
          left: `${menuPosition.left}px`,
          // border: '2px dashed blue', // Debug border removed
        }}
        $visible={menuPosition.visibility === 'visible' && isOpen}
      >
        <ModalBody theme={theme}>
          {renderMenuContent()}
        </ModalBody>
      </MenuContainer>
    </>,
    portalNode
  );
};

export default ToolMenuModal; 