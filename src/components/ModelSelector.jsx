import React, { useState, useRef, useEffect } from 'react';
import styled, { css } from 'styled-components';
import ModelIcon from './ModelIcon';

// Remove environment variable imports for UI filtering
// const GEMINI_API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;
// const CLAUDE_API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY;
// const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;
// const NVIDIA_API_KEY = import.meta.env.VITE_NVIDIA_API_KEY;

const ModelSelectorContainer = styled.div`
  position: relative;
  z-index: 10;
`;

const ModelButton = styled.button`
  display: flex;
  align-items: center;
  padding: ${props => props.theme.name === 'retro' ? '5px 10px' : '8px 12px'};
  background: ${props => {
    if (props.theme.name === 'retro') return props.theme.buttonFace;
    if (props.theme.name === 'bisexual') return props.theme.modelSelectorBackground;
    return props.theme.inputBackground;
  }};
  border: ${props => props.theme.name === 'retro' ? 
    `1px solid ${props.theme.buttonHighlightLight} ${props.theme.buttonShadowDark} ${props.theme.buttonShadowDark} ${props.theme.buttonHighlightLight}` : 
    'none'};
  border-radius: ${props => props.theme.name === 'retro' ? '0' : '20px'};
  color: ${props => props.theme.name === 'retro' ? props.theme.buttonText : props.theme.text};
  font-family: ${props => props.theme.name === 'retro' ? 'MSW98UI, MS Sans Serif, Tahoma, sans-serif' : 'inherit'};
  font-weight: ${props => props.theme.name === 'retro' ? 'normal' : '500'};
  font-size: ${props => props.theme.name === 'retro' ? '12px' : '0.9rem'};
  cursor: pointer;
  transition: ${props => props.theme.name === 'retro' ? 'none' : 'all 0.2s ease'};
  box-shadow: ${props => props.theme.name === 'retro' ? 
    `1px 1px 0 0 ${props.theme.buttonHighlightSoft} inset, -1px -1px 0 0 ${props.theme.buttonShadowSoft} inset` : 
    '0 2px 8px rgba(0,0,0,0.1)'};
  
  &:hover {
    transform: ${props => props.theme.name === 'retro' ? 'none' : 'translateY(-1px)'};
    box-shadow: ${props => {
      if (props.theme.name === 'retro') return `1px 1px 0 0 ${props.theme.buttonHighlightSoft} inset, -1px -1px 0 0 ${props.theme.buttonShadowSoft} inset`;
      return '0 4px 12px rgba(0,0,0,0.15)';
    }};
    background: ${props => {
      if (props.theme.name === 'retro') return props.theme.buttonFace;
      if (props.theme.name === 'bisexual') return 'linear-gradient(145deg, rgba(40, 40, 60, 0.7), rgba(25, 25, 35, 0.9))';
      return props.theme.inputBackground;
    }};
  }

  ${props => props.theme.name === 'retro' && css`
    &:active {
      border-color: ${props.theme.buttonShadowDark} ${props.theme.buttonHighlightLight} ${props.theme.buttonHighlightLight} ${props.theme.buttonShadowDark};
      box-shadow: -1px -1px 0 0 ${props.theme.buttonHighlightSoft} inset, 1px 1px 0 0 ${props.theme.buttonShadowSoft} inset;
      padding: ${props.isOpen ? '5px 10px' : '6px 9px 4px 11px'}; /* Adjust padding for pressed state */
    }
  `}
  
  span {
    margin-left: ${props => props.theme.name === 'retro' ? '6px' : '8px'};
    margin-right: ${props => props.theme.name === 'retro' ? '6px' : '0'};
  }
  
  svg {
    margin-left: 6px;
    width: ${props => props.theme.name === 'retro' ? '16px' : '10px'};
    height: ${props => props.theme.name === 'retro' ? '16px' : '10px'};
    transition: ${props => props.theme.name === 'retro' ? 'none' : 'transform 0.2s ease'};
    transform: ${props => props.isOpen ? 'rotate(180deg)' : 'rotate(0)'};
    ${props => props.theme.name === 'retro' && css`
      border-style: solid;
      border-width: 0 1px 1px 0;
      display: inline-block;
      padding: 3px;
      border-color: ${props.theme.buttonText};
      transform: ${props.isOpen ? 'translateY(-2px) rotate(225deg)' : 'translateY(-3px) rotate(45deg)' };
      margin-bottom: ${props.isOpen ? '0px' : '1px' };
    `}
  }
  
  opacity: 1;
  pointer-events: auto;
`;

const DropdownMenu = styled.div`
  position: absolute;
  top: calc(100% + ${props => props.theme.name === 'retro' ? '1px' : '5px'});
  right: 0;
  background: ${props => props.theme.name === 'retro' ? props.theme.buttonFace : props.theme.inputBackground};
  min-width: 200px;
  border-radius: ${props => props.theme.name === 'retro' ? '0' : '12px'};
  overflow: hidden;
  box-shadow: ${props => props.theme.name === 'retro' ? 
    `1px 1px 0 0 ${props.theme.buttonHighlightLight}, -1px -1px 0 0 ${props.theme.buttonShadowDark}, 1px 1px 0 0 ${props.theme.buttonHighlightSoft} inset, -1px -1px 0 0 ${props.theme.buttonShadowSoft} inset` :
    '0 5px 20px rgba(0,0,0,0.15)'};
  border: ${props => props.theme.name === 'retro' ? 
    `1px solid ${props.theme.buttonHighlightLight} ${props.theme.buttonShadowDark} ${props.theme.buttonShadowDark} ${props.theme.buttonHighlightLight}` : 
    'none'};
  z-index: 1000;
  backdrop-filter: ${props => props.theme.name === 'retro' ? 'none' : props.theme.glassEffect};
  -webkit-backdrop-filter: ${props => props.theme.name === 'retro' ? 'none' : props.theme.glassEffect};
  
  ${props => props.theme.name === 'bisexual' && `
    position: relative;
    
    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 2px;
      background: ${props.theme.accentGradient};
      z-index: 1;
    }
  `}
  
  transform-origin: top right;
  animation: ${props => props.theme.name === 'retro' ? 'none' : css`dropdown 0.2s ease`};
  
  @keyframes dropdown {
    from {
      opacity: 0;
      transform: translateY(-10px) scale(0.95);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }
`;

const ModelOption = styled.div`
  display: flex;
  align-items: center;
  padding: ${props => props.theme.name === 'retro' ? '6px 10px' : '12px 15px'};
  cursor: pointer;
  transition: ${props => props.theme.name === 'retro' ? 'none' : 'background 0.2s ease'};
  border-left: ${props => props.theme.name === 'retro' ? 'none' : '3px solid transparent'};
  color: ${props => props.theme.name === 'retro' ? props.theme.buttonText : 'inherit' };
  font-family: ${props => props.theme.name === 'retro' ? 'MSW98UI, MS Sans Serif, Tahoma, sans-serif' : 'inherit'};
  font-size: ${props => props.theme.name === 'retro' ? '12px' : 'inherit'};

  ${props => props.isSelected && props.theme.name !== 'retro' && `
    background: rgba(0,0,0,0.1);
    border-left-color: ${props.theme.name === 'bisexual' ? 
      props.theme.primary.split(',')[0].replace('linear-gradient(145deg', '').trim() : 
      props.theme.primary.split(',')[0].replace('linear-gradient(145deg', '').trim()};
  `}
  
  &:hover {
    background: ${props => {
        if (props.theme.name === 'retro') return props.theme.buttonFace;
        return 'rgba(0,0,0,0.1)';
    }};
    ${props => props.theme.name === 'retro' && css`
      ${props.isSelected && `
        box-shadow: -1px -1px 0 0 ${props.theme.buttonHighlightSoft} inset, 1px 1px 0 0 ${props.theme.buttonShadowSoft} inset;
        border-color: ${props.theme.buttonShadowDark} ${props.theme.buttonHighlightLight} ${props.theme.buttonHighlightLight} ${props.theme.buttonShadowDark};
      `}
      ${!props.isSelected && `
        background: ${props.theme.highlightBackground};
        color: ${props.theme.highlightText};
      `}
    `}
  }

  ${props => props.isSelected && props.theme.name === 'retro' && css`
    background: ${props.theme.highlightBackground};
    color: ${props.theme.highlightText};
  `}

  & > ${ModelIcon} {
    ${props => props.theme.name === 'retro' && css`
      filter: grayscale(1) brightness(0.7);
      width: 16px; 
      height: 16px;
    `}
  }
`;

const ModelDetails = styled.div`
  margin-left: ${props => props.theme.name === 'retro' ? '8px' : '12px'};
  color: inherit;
  font-family: inherit;
`;

const ModelName = styled.div`
  font-weight: ${props => props.theme.name === 'retro' ? 'normal' : '500'};
  font-size: inherit;
`;

const ModelProvider = styled.div`
  font-size: ${props => props.theme.name === 'retro' ? '11px' : '0.8rem'};
  opacity: 0.7;
  margin-top: 2px;
  font-size: inherit;
`;

const BackendModelBadge = styled.span`
  background: ${props => props.theme.primary};
  color: white;
  font-size: 0.6rem;
  padding: 2px 4px;
  border-radius: 4px;
  margin-left: 5px;
  font-weight: bold;
  opacity: 0.8;
`;

const ModelSelector = ({ selectedModel, models, onChange, theme }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);
  const [apiKeys, setApiKeys] = useState({
    google: '',
    claude: '',
    openai: '',
    nvidia: '',
    ursa: ''
  });

  useEffect(() => {
    let userSettings = {};
    try {
      const userJSON = sessionStorage.getItem('ai_portal_current_user');
      if (userJSON) {
        const user = JSON.parse(userJSON);
        userSettings = user?.settings || {};
        console.log("Loaded settings from sessionStorage:", userSettings);
      } else {
        const settingsJSON = localStorage.getItem('settings');
        if (settingsJSON) {
          userSettings = JSON.parse(settingsJSON);
           console.log("Loaded settings from localStorage:", userSettings);
        } else {
           console.log("No settings found in storage.");
        }
      }

      setApiKeys({
        google: userSettings.googleApiKey || '',
        claude: userSettings.anthropicApiKey || '',
        openai: userSettings.openaiApiKey || '',
        nvidia: userSettings.nvidiaApiKey || '',
        ursa: userSettings.customGgufApiKey || ''
      });
    } catch (e) {
      console.error('Error reading user settings for API keys:', e);
      setApiKeys({ google: '', claude: '', openai: '', nvidia: '', ursa: '' });
    }
  }, []);

  const baseModels = models || [
    { id: 'gemini-2-flash', name: 'Gemini 2 Flash' },
    { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro' },
    { id: 'claude-3.7-sonnet', name: 'Claude 3.7 Sonnet' },
    { id: 'chatgpt-4o', name: 'ChatGPT 4o' },
    { id: 'nemotron-super-49b', name: 'Nemotron 49B' },
    { id: 'ursa-minor', name: 'Ursa Minor' }
  ];

  useEffect(() => {
    console.log("Base models before filtering:", models);
    console.log("Backend models:", models?.filter(m => m.isBackendModel === true));
  }, [models]);

  const availableModels = baseModels.filter(model => {
    if (model.isBackendModel === true) {
      console.log('Including backend model:', model);
      return true;
    }
    
    const checkKey = (key) => key && key.trim() !== '';

    if (model.id.includes('gemini')) return checkKey(apiKeys.google);
    if (model.id.includes('claude')) return checkKey(apiKeys.claude);
    if (model.id.includes('chatgpt') || model.id.includes('gpt')) return checkKey(apiKeys.openai);
    if (model.id.includes('nemotron')) return checkKey(apiKeys.nvidia);
    if (model.id.includes('ursa')) return checkKey(apiKeys.ursa);
    return false;
  });

   useEffect(() => {
     console.log("Available models after filtering:", availableModels);
   }, [availableModels]);

  const currentModel =
    availableModels.find(model => model.id === selectedModel) ||
    availableModels[0] ||
    baseModels.find(model => model.id === 'gemini-2-flash');

  useEffect(() => {
    if (selectedModel !== currentModel?.id && availableModels.length > 0) {
      onChange(currentModel.id);
    } else if (availableModels.length === 0 && selectedModel) {
       if(selectedModel !== currentModel?.id) {
           onChange(currentModel.id)
       }
    }
  }, [selectedModel, currentModel, availableModels, onChange]);

  const getProviderName = (model) => {
    const modelId = model.id;
    
    if (model.isBackendModel && model.provider) {
      return `${model.provider} (via Backend)`;
    }
    
    if (modelId.includes('gemini-2.5-pro')) return 'Google AI (2.5 Pro)';
    if (modelId.includes('gemini')) return 'Google AI';
    if (modelId.includes('claude')) return 'Anthropic';
    if (modelId.includes('gpt') || modelId.includes('chatgpt')) return 'OpenAI';
    if (modelId.includes('nemotron')) return 'NVIDIA';
    if (modelId.includes('ursa')) return 'Custom GGUF';
    return 'AI Provider';
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const toggleDropdown = () => {
    if (availableModels.length > 0) {
      console.log('Toggling dropdown with available models:', availableModels);
      setIsOpen(!isOpen);
    } else {
      console.log('Not toggling dropdown - no available models found');
    }
  };

  const handleSelectModel = (modelId) => {
    onChange(modelId);
    setIsOpen(false);
  };

  return (
    <ModelSelectorContainer ref={containerRef} theme={theme}>
       {currentModel ? (
         <ModelButton 
           onClick={toggleDropdown} 
           isOpen={isOpen}
           theme={theme}
         >
           <ModelIcon modelId={currentModel.id} />
           <span>{currentModel.name.replace(/^[^:]*:\s*/, '').replace(/\s*\([^)]*\)$/, '')}</span>
           {currentModel.isBackendModel && (
             <BackendModelBadge theme={theme}>E</BackendModelBadge>
           )}
         </ModelButton>
       ) : (
         <ModelButton disabled theme={theme}>No Models Available</ModelButton>
       )}

      {isOpen && (
        <DropdownMenu theme={theme}>
          {availableModels.map(model => (
            <ModelOption
              key={model.id}
              isSelected={model.id === selectedModel}
              onClick={() => handleSelectModel(model.id)}
              theme={theme}
            >
              <ModelIcon modelId={model.id} />
              <ModelDetails theme={theme}>
                <ModelName theme={theme}>{model.name.replace(/^[^:]*:\s*/, '').replace(/\s*\([^)]*\)$/, '')}</ModelName>
                {model.isBackendModel && (
                  <BackendModelBadge theme={theme}>External</BackendModelBadge>
                )}
              </ModelDetails>
            </ModelOption>
          ))}
        </DropdownMenu>
      )}
    </ModelSelectorContainer>
  );
};

export default ModelSelector;