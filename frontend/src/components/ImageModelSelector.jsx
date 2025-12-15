import React, { useState, useRef, useEffect } from 'react';
import styled, { css } from 'styled-components';

const SelectorContainer = styled.div`
  position: relative;
  z-index: 105;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const ImageLabel = styled.span`
  font-size: ${props => props.theme.name === 'retro' ? '11px' : '12px'};
  color: ${props => props.theme.name === 'retro' ? props.theme.buttonText : props.theme.textSecondary || props.theme.text};
  font-family: ${props => props.theme.name === 'retro' ? 'MSW98UI, MS Sans Serif, Tahoma, sans-serif' : 'inherit'};
  opacity: 0.8;
  white-space: nowrap;
`;

const SelectorButton = styled.button`
  display: flex;
  align-items: center;
  padding: ${props => props.theme.name === 'retro' ? '4px 8px' : '6px 10px'};
  background: ${props => props.theme.name === 'retro' ? props.theme.buttonFace : 'rgba(99, 102, 241, 0.1)'};
  border: ${props => props.theme.name === 'retro'
    ? `1px solid ${props.theme.buttonHighlightLight}`
    : `1px solid ${props.theme.accent || '#6366f1'}40`};
  border-radius: ${props => props.theme.name === 'retro' ? '0' : '8px'};
  color: ${props => props.theme.name === 'retro' ? props.theme.buttonText : props.theme.accent || '#6366f1'};
  font-family: ${props => props.theme.name === 'retro' ? 'MSW98UI, MS Sans Serif, Tahoma, sans-serif' : 'inherit'};
  font-weight: ${props => props.theme.name === 'retro' ? 'normal' : '500'};
  font-size: ${props => props.theme.name === 'retro' ? '11px' : '12px'};
  cursor: pointer;
  transition: ${props => props.theme.name === 'retro' ? 'none' : 'all 0.2s ease'};
  box-shadow: ${props => props.theme.name === 'retro' ?
    `1px 1px 0 0 ${props.theme.buttonHighlightSoft} inset, -1px -1px 0 0 ${props.theme.buttonShadowSoft} inset` :
    'none'};
  min-width: 100px;
  justify-content: space-between;
  gap: 6px;

  &:hover {
    background: ${props => props.theme.name === 'retro'
      ? props.theme.buttonFace
      : 'rgba(99, 102, 241, 0.15)'};
  }

  ${props => props.theme.name === 'retro' && css`
    &:active {
      box-shadow: -1px -1px 0 0 ${props.theme.buttonHighlightSoft} inset, 1px 1px 0 0 ${props.theme.buttonShadowSoft} inset;
    }
  `}

  .dropdown-arrow {
    width: ${props => props.theme.name === 'retro' ? '10px' : '12px'};
    height: ${props => props.theme.name === 'retro' ? '10px' : '12px'};
    transition: ${props => props.theme.name === 'retro' ? 'none' : 'transform 0.2s ease'};
    transform: ${props => props.$isOpen ? 'rotate(180deg)' : 'rotate(0)'};
    ${props => props.theme.name === 'retro' && css`
      border-style: solid;
      border-width: 0 1px 1px 0;
      display: inline-block;
      padding: 2px;
      border-color: ${props.theme.buttonText};
      transform: ${props.$isOpen ? 'translateY(-1px) rotate(225deg)' : 'translateY(-2px) rotate(45deg)' };
    `}
  }
`;

const DropdownMenu = styled.div`
  position: absolute;
  top: calc(100% + ${props => props.theme.name === 'retro' ? '1px' : '4px'});
  left: 0;
  background: ${props => props.theme.name === 'retro' ? props.theme.buttonFace : props.theme.inputBackground || props.theme.surface || '#fff'};
  min-width: 180px;
  border-radius: ${props => props.theme.name === 'retro' ? '0' : '10px'};
  overflow: hidden;
  max-height: 250px;
  overflow-y: auto;
  box-shadow: ${props => props.theme.name === 'retro' ?
    `1px 1px 0 0 ${props.theme.buttonHighlightLight}, -1px -1px 0 0 ${props.theme.buttonShadowDark}` :
    '0 4px 20px rgba(0,0,0,0.15)'};
  border: ${props => props.theme.name === 'retro' ?
    `1px solid ${props.theme.buttonShadowDark}` :
    `1px solid ${props.theme.border || 'rgba(0,0,0,0.1)'}`};
  z-index: 1000;

  animation: ${props => props.theme.name === 'retro' ? 'none' : css`dropdownFade 0.15s ease`};

  @keyframes dropdownFade {
    from {
      opacity: 0;
      transform: translateY(-8px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

const ModelOption = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${props => props.theme.name === 'retro' ? '6px 10px' : '10px 12px'};
  cursor: pointer;
  transition: ${props => props.theme.name === 'retro' ? 'none' : 'background 0.15s ease'};
  color: ${props => props.theme.name === 'retro' ? props.theme.buttonText : props.theme.text};
  font-family: ${props => props.theme.name === 'retro' ? 'MSW98UI, MS Sans Serif, Tahoma, sans-serif' : 'inherit'};
  font-size: ${props => props.theme.name === 'retro' ? '11px' : '13px'};
  background: ${props => props.$isSelected
    ? (props.theme.name === 'retro' ? props.theme.highlightBackground : 'rgba(99, 102, 241, 0.12)')
    : 'transparent'};
  color: ${props => props.$isSelected && props.theme.name === 'retro' ? props.theme.highlightText : 'inherit'};
  border-bottom: 1px solid ${props => props.theme.border || 'rgba(0,0,0,0.06)'};

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background: ${props => {
      if (props.theme.name === 'retro') {
        return props.$isSelected ? props.theme.highlightBackground : props.theme.highlightBackground;
      }
      return props.$isSelected ? 'rgba(99, 102, 241, 0.15)' : 'rgba(0,0,0,0.05)';
    }};
    color: ${props => props.theme.name === 'retro' ? props.theme.highlightText : 'inherit'};
  }
`;

const ModelName = styled.span`
  font-weight: ${props => props.$isSelected ? '600' : '400'};
`;

const ModelProvider = styled.span`
  font-size: ${props => props.theme.name === 'retro' ? '10px' : '11px'};
  opacity: 0.6;
  text-transform: capitalize;
`;

const ImageIcon = styled.svg`
  width: 14px;
  height: 14px;
  opacity: 0.9;
`;

const ImageModelSelector = ({
  availableModels = [],
  selectedModel,
  onSelectModel,
  isVisible = false,
  theme
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close dropdown when visibility changes
  useEffect(() => {
    if (!isVisible) {
      setIsOpen(false);
    }
  }, [isVisible]);

  if (!isVisible || availableModels.length === 0) {
    return null;
  }

  const handleSelect = (model) => {
    onSelectModel(model);
    setIsOpen(false);
  };

  return (
    <SelectorContainer ref={containerRef} theme={theme}>
      <ImageLabel theme={theme}>Image:</ImageLabel>
      <div style={{ position: 'relative' }}>
        <SelectorButton
          onClick={() => setIsOpen(!isOpen)}
          $isOpen={isOpen}
          theme={theme}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <ImageIcon
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
              <circle cx="8.5" cy="8.5" r="1.5"/>
              <polyline points="21 15 16 10 5 21"/>
            </ImageIcon>
            <span>{selectedModel?.id || 'Select model'}</span>
          </div>
          {theme.name === 'retro' ? (
            <div className="dropdown-arrow"></div>
          ) : (
            <svg
              className="dropdown-arrow"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          )}
        </SelectorButton>

        {isOpen && (
          <DropdownMenu theme={theme}>
            {availableModels.map((model) => (
              <ModelOption
                key={model.id || model.apiId}
                $isSelected={selectedModel?.id === model.id}
                onClick={() => handleSelect(model)}
                theme={theme}
              >
                <ModelName $isSelected={selectedModel?.id === model.id}>
                  {model.id}
                </ModelName>
                <ModelProvider theme={theme}>
                  {model.provider}
                </ModelProvider>
              </ModelOption>
            ))}
          </DropdownMenu>
        )}
      </div>
    </SelectorContainer>
  );
};

export default ImageModelSelector;
