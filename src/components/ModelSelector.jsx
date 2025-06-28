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
  z-index: 105;
`;

const ModelButton = styled.button`
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
  min-width: 120px;
  justify-content: space-between;
  
  &:hover {
    transform: ${props => props.theme.name === 'retro' ? 'none' : 'none'};
    box-shadow: ${props => {
      if (props.theme.name === 'retro') return `1px 1px 0 0 ${props.theme.buttonHighlightSoft} inset, -1px -1px 0 0 ${props.theme.buttonShadowSoft} inset`;
      return 'none';
    }};
    background: rgba(0, 0, 0, 0.05);
  }

  ${props => props.theme.name === 'retro' && css`
    &:active {
      border-color: ${props.theme.buttonShadowDark} ${props.theme.buttonHighlightLight} ${props.theme.buttonHighlightLight} ${props.theme.buttonShadowDark};
      box-shadow: -1px -1px 0 0 ${props.theme.buttonHighlightSoft} inset, 1px 1px 0 0 ${props.theme.buttonShadowSoft} inset;
      padding: ${props => props.$isOpen ? '5px 10px' : '6px 9px 4px 11px'}; /* Adjust padding for pressed state */
    }
  `}
  
  .model-info {
    display: flex;
    align-items: center;
    flex: 1;
  }
  
  span {
    margin-left: ${props => props.theme.name === 'retro' ? '4px' : '6px'};
    margin-right: ${props => props.theme.name === 'retro' ? '4px' : '0'};
  }
  
  .dropdown-arrow {
    margin-left: 6px;
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
      transform: ${props => props.$isOpen ? 'translateY(-2px) rotate(225deg)' : 'translateY(-3px) rotate(45deg)' };
      margin-bottom: ${props => props.$isOpen ? '0px' : '1px' };
    `}
  }
  
  opacity: 1;
  pointer-events: auto;
`;

const DropdownMenu = styled.div`
  position: absolute;
  top: calc(100% + ${props => props.theme.name === 'retro' ? '1px' : '5px'});
  left: 0;
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
  
  transform-origin: top left;
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

  ${props => props.$isSelected && props.theme.name !== 'retro' && `
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
      ${props.$isSelected && `
        box-shadow: -1px -1px 0 0 ${props.theme.buttonHighlightSoft} inset, 1px 1px 0 0 ${props.theme.buttonShadowSoft} inset;
        border-color: ${props.theme.buttonShadowDark} ${props.theme.buttonHighlightLight} ${props.theme.buttonHighlightLight} ${props.theme.buttonShadowDark};
      `}
      ${!props.$isSelected && `
        background: ${props.theme.highlightBackground};
        color: ${props.theme.highlightText};
      `}
    `}
  }

  ${props => props.$isSelected && props.theme.name === 'retro' && css`
    background: ${props.theme.highlightBackground};
    color: ${props.theme.highlightText};
  `}

  & > div { 
    ${props => props.theme.name === 'retro' && css`
      & > img, & > svg {
        filter: grayscale(1) brightness(0.7);
      }
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

const ProviderLogo = styled.img`
  width: 16px;
  height: 16px;
  margin-left: 6px;
  opacity: 0.9;
  object-fit: contain;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 4px;
  padding: 2px;
  backdrop-filter: blur(5px);
  -webkit-backdrop-filter: blur(5px);
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
    { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro' },
    { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash' },
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
    baseModels.find(model => model.id === 'gemini-2.5-pro');

  useEffect(() => {
    if (selectedModel !== currentModel?.id && availableModels.length > 0) {
      onChange(currentModel.id);
    } else if (availableModels.length === 0 && selectedModel) {
       if(selectedModel !== currentModel?.id) {
           onChange(currentModel.id)
       }
    }
  }, [selectedModel, currentModel, availableModels, onChange]);

  const getProviderSource = (model) => {
    // For backend models, use the source field
    if (model.isBackendModel && model.source) {
      return model.source;
    }
    
    // For frontend models, determine source based on model ID
    const modelId = model.id?.toLowerCase() || '';
    
    // Check for Google/Gemini models
    if (modelId.includes('gemini') || modelId.includes('google/')) {
      return 'gemini';
    }
    
    // Check for Anthropic/Claude models  
    if (modelId.includes('claude') || modelId.includes('anthropic/')) {
      return 'anthropic';
    }
    
    // Check for OpenAI models
    if (modelId.includes('gpt') || modelId.includes('chatgpt') || modelId.includes('openai/')) {
      return 'openai';
    }
    
    // Check for Meta/Llama models
    if (modelId.includes('llama') || modelId.includes('meta-llama/') || modelId.includes('meta/')) {
      return 'meta';
    }
    
    // Check for DeepSeek models
    if (modelId.includes('deepseek')) {
      return 'deepseek';
    }
    
    // Default to openrouter for other backend models
    if (model.isBackendModel) {
      return 'openrouter';
    }
    
    return null;
  };

  const getProviderName = (model) => {
    const modelId = model.id;
    
    if (model.isBackendModel) {
      if (model.source === 'gemini') {
        return 'Google Gemini API';
      } else if (model.source === 'openrouter') {
        return `${model.provider} (via OpenRouter)`;
      }
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
           $isOpen={isOpen}
           theme={theme}
         >
           <div className="model-info">
             <ModelIcon modelId={currentModel.id} />
             <span>{currentModel.name.replace(/^[^:]*:\s*/, '').replace(/\s*\([^)]*\)$/, '')}</span>
             {getProviderSource(currentModel) === 'gemini' && (
               <ProviderLogo 
                 src="/images/google.png" 
                 alt="Google" 
                 title="Google Gemini API"
               />
             )}
             {getProviderSource(currentModel) === 'openrouter' && (
               <ProviderLogo 
                 src="/images/openrouter.png" 
                 alt="OpenRouter" 
                 title="OpenRouter API"
               />
             )}
           </div>
           {theme.name === 'retro' ? (
             <div className="dropdown-arrow"></div>
           ) : (
             <svg 
               className="dropdown-arrow" 
               xmlns="http://www.w3.org/2000/svg" 
               width="16" 
               height="16" 
               viewBox="0 0 24 24" 
               fill="none" 
               stroke="currentColor" 
               strokeWidth="2" 
               strokeLinecap="round" 
               strokeLinejoin="round"
             >
               <polyline points="6 9 12 15 18 9"></polyline>
             </svg>
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
              $isSelected={model.id === selectedModel}
              onClick={() => handleSelectModel(model.id)}
              theme={theme}
            >
              <ModelIcon modelId={model.id} />
              <ModelDetails theme={theme}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <ModelName theme={theme}>{model.name.replace(/^[^:]*:\s*/, '').replace(/\s*\([^)]*\)$/, '')}</ModelName>
                  {getProviderSource(model) === 'gemini' && (
                    <ProviderLogo 
                      src="/images/google.png" 
                      alt="Google" 
                      title="Google Gemini API"
                    />
                  )}
                  {getProviderSource(model) === 'openrouter' && (
                    <ProviderLogo 
                      src="/images/openrouter.png" 
                      alt="OpenRouter" 
                      title="OpenRouter API"
                    />
                  )}
                </div>
              </ModelDetails>
            </ModelOption>
          ))}
        </DropdownMenu>
      )}
    </ModelSelectorContainer>
  );
};

export default ModelSelector;