import React, { useState, useRef, useEffect } from 'react';
import styled, { css } from 'styled-components';
import ModelIcon from './ModelIcon';
import { useTranslation } from '../contexts/TranslationContext';

const SelectorContainer = styled.div`
  position: relative;
  z-index: 105;
`;

const SelectorButton = styled.button`
  display: flex;
  align-items: center;
  padding: ${props => props.theme.name === 'retro' ? '5px 8px' : '8px 12px'};
  background: transparent;
  border: none;
  border-radius: ${props => props.theme.name === 'retro' ? '0' : '8px'};
  color: ${props => props.theme.name === 'retro' ? props.theme.buttonText : props.theme.text};
  font-family: ${props => props.theme.name === 'retro' ? 'MSW98UI, MS Sans Serif, Tahoma, sans-serif' : 'inherit'};
  font-weight: ${props => props.theme.name === 'retro' ? 'normal' : '600'};
  font-size: ${props => props.theme.name === 'retro' ? '11px' : '13px'};
  cursor: pointer;
  transition: ${props => props.theme.name === 'retro' ? 'none' : 'all 0.2s ease'};
  box-shadow: ${props => props.theme.name === 'retro' ?
    `1px 1px 0 0 ${props.theme.buttonHighlightSoft} inset, -1px -1px 0 0 ${props.theme.buttonShadowSoft} inset` :
    'none'};
  min-width: 180px;
  justify-content: space-between;
  gap: 10px;

  &:hover {
    background: rgba(0, 0, 0, 0.05);
  }

  ${props => props.theme.name === 'retro' && css`
    &:active {
      border-color: ${props.theme.buttonShadowDark} ${props.theme.buttonHighlightLight} ${props.theme.buttonHighlightLight} ${props.theme.buttonShadowDark};
      box-shadow: -1px -1px 0 0 ${props.theme.buttonHighlightSoft} inset, 1px 1px 0 0 ${props.theme.buttonShadowSoft} inset;
      padding: ${props.$isOpen ? '5px 10px' : '6px 9px 4px 11px'};
    }
  `}

  .model-info {
    display: flex;
    align-items: center;
    min-width: 0;
    flex: 1;
  }

  .model-copy {
    display: flex;
    flex-direction: column;
    min-width: 0;
    margin-left: ${props => props.theme.name === 'retro' ? '8px' : '12px'};
    text-align: left;
  }

  .model-name {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .model-provider {
    margin-top: 2px;
    font-size: ${props => props.theme.name === 'retro' ? '11px' : '0.78rem'};
    font-weight: 400;
    opacity: 0.7;
  }

  .dropdown-arrow {
    width: ${props => props.theme.name === 'retro' ? '12px' : '14px'};
    height: ${props => props.theme.name === 'retro' ? '12px' : '14px'};
    transition: ${props => props.theme.name === 'retro' ? 'none' : 'transform 0.2s ease'};
    transform: ${props => props.$isOpen ? 'rotate(180deg)' : 'rotate(0)'};
    ${props => props.theme.name === 'retro' && css`
      border-style: solid;
      border-width: 0 1px 1px 0;
      display: inline-block;
      padding: 3px;
      border-color: ${props.theme.buttonText};
      transform: ${props.$isOpen ? 'translateY(-2px) rotate(225deg)' : 'translateY(-3px) rotate(45deg)' };
    `}
  }
`;

const DropdownMenu = styled.div`
  position: absolute;
  top: calc(100% + ${props => props.theme.name === 'retro' ? '1px' : '5px'});
  left: 0;
  background: ${props => props.theme.name === 'retro' ? props.theme.buttonFace : props.theme.inputBackground || props.theme.surface || '#fff'};
  min-width: 240px;
  border-radius: ${props => props.theme.name === 'retro' ? '0' : '12px'};
  overflow-y: auto;
  overflow-x: hidden;
  max-height: 320px;
  box-shadow: ${props => props.theme.name === 'retro' ?
    `1px 1px 0 0 ${props.theme.buttonHighlightLight}, -1px -1px 0 0 ${props.theme.buttonShadowDark}, 1px 1px 0 0 ${props.theme.buttonHighlightSoft} inset, -1px -1px 0 0 ${props.theme.buttonShadowSoft} inset` :
    '0 5px 20px rgba(0,0,0,0.15)'};
  border: ${props => props.theme.name === 'retro' ?
    `1px solid ${props.theme.buttonShadowDark}` :
    'none'};
  z-index: 1000;
  backdrop-filter: ${props => props.theme.name === 'retro' ? 'none' : props.theme.glassEffect};
  -webkit-backdrop-filter: ${props => props.theme.name === 'retro' ? 'none' : props.theme.glassEffect};

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
  padding: ${props => props.theme.name === 'retro' ? '6px 10px' : '12px 15px'};
  cursor: pointer;
  transition: ${props => props.theme.name === 'retro' ? 'none' : 'background 0.15s ease'};
  color: ${props => props.theme.name === 'retro' ? props.theme.buttonText : props.theme.text};
  font-family: ${props => props.theme.name === 'retro' ? 'MSW98UI, MS Sans Serif, Tahoma, sans-serif' : 'inherit'};
  font-size: ${props => props.theme.name === 'retro' ? '12px' : '13px'};
  background: ${props => props.$isSelected
    ? (props.theme.name === 'retro' ? props.theme.highlightBackground : 'rgba(0, 0, 0, 0.08)')
    : 'transparent'};
  color: ${props => props.$isSelected && props.theme.name === 'retro' ? props.theme.highlightText : 'inherit'};
  border-left: ${props => props.theme.name === 'retro' ? 'none' : '3px solid transparent'};

  ${props => props.$isSelected && props.theme.name !== 'retro' && css`
    border-left-color: ${typeof props.theme.primary === 'string'
      ? props.theme.primary.split(',')[0].replace('linear-gradient(145deg', '').trim()
      : '#000'};
  `}
  
  &:hover {
    background: ${props => props.theme.name === 'retro' ? props.theme.highlightBackground : 'rgba(0,0,0,0.1)'};
    color: ${props => props.theme.name === 'retro' ? props.theme.highlightText : 'inherit'};
  }
`;

const ModelDetails = styled.div`
  margin-left: ${props => props.theme.name === 'retro' ? '8px' : '12px'};
  min-width: 0;
`;

const ModelName = styled.div`
  font-weight: ${props => props.theme.name === 'retro' ? 'normal' : '500'};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const ModelProvider = styled.div`
  font-size: ${props => props.theme.name === 'retro' ? '11px' : '0.8rem'};
  opacity: 0.7;
  margin-top: 2px;
  text-transform: none;
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
  const { t } = useTranslation();

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

  if (!isVisible) {
    return null;
  }

  const handleSelect = (model) => {
    onSelectModel(model);
    setIsOpen(false);
  };

  const getDisplayName = (model) => model?.id || t('imageSelector.placeholder');
  const getProviderName = (provider) => {
    switch ((provider || '').toLowerCase()) {
      case 'google':
        return 'Google';
      case 'openai':
        return 'OpenAI';
      case 'anthropic':
        return 'Anthropic';
      case 'meta':
        return 'Meta';
      case 'deepseek':
        return 'DeepSeek';
      case 'grok':
      case 'x-ai':
      case 'xai':
        return 'xAI';
      default:
        return provider ? provider.charAt(0).toUpperCase() + provider.slice(1) : '';
    }
  };
  const hasModels = availableModels.length > 0;
  const currentModel = selectedModel || availableModels.find((model) => model.isDefault) || availableModels[0] || null;
  const currentModelId = currentModel?.id || currentModel?.apiId || null;

  return (
    <SelectorContainer ref={containerRef} theme={theme}>
      <SelectorButton
        onClick={() => {
          if (hasModels) {
            setIsOpen(!isOpen);
          }
        }}
        $isOpen={isOpen}
        theme={theme}
        title={currentModelId || t('models.noModels')}
      >
        <div className="model-info">
          {currentModel ? (
            <ModelIcon
              modelId={currentModel.apiId || currentModel.id}
              provider={currentModel.provider}
              size="medium"
            />
          ) : (
            <ModelIcon modelId={t('imageSelector.placeholder')} size="medium" />
          )}
          <div className="model-copy">
            <div className="model-name">{getDisplayName(currentModel)}</div>
            {currentModel && (
              <div className="model-provider">{getProviderName(currentModel.provider)}</div>
            )}
          </div>
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

      {isOpen && hasModels && (
        <DropdownMenu theme={theme}>
          {availableModels.map((model) => (
            <ModelOption
              key={model.id || model.apiId}
              $isSelected={currentModelId === (model.id || model.apiId)}
              onClick={() => handleSelect(model)}
              theme={theme}
            >
              <ModelIcon
                modelId={model.apiId || model.id}
                provider={model.provider}
                size="medium"
              />
              <ModelDetails theme={theme}>
                <ModelName theme={theme}>{getDisplayName(model)}</ModelName>
                <ModelProvider theme={theme}>{getProviderName(model.provider)}</ModelProvider>
              </ModelDetails>
            </ModelOption>
          ))}
        </DropdownMenu>
      )}
    </SelectorContainer>
  );
};

export default ImageModelSelector;
