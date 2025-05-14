import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';
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
  padding: 8px 12px;
  background: ${props => props.theme.name === 'bisexual' ? 
    props.theme.modelSelectorBackground : 
    props.theme.inputBackground};
  border: none;
  border-radius: 20px;
  color: ${props => props.theme.text};
  font-weight: 500;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  
  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    background: ${props => props.theme.name === 'bisexual' ? 
      'linear-gradient(145deg, rgba(40, 40, 60, 0.7), rgba(25, 25, 35, 0.9))' : 
      props.theme.inputBackground};
  }
  
  span {
    margin-left: 8px;
  }
  
  svg {
    margin-left: 6px;
    width: 10px;
    height: 10px;
    transition: transform 0.2s ease;
    transform: ${props => props.isOpen ? 'rotate(180deg)' : 'rotate(0)'};
  }
  
  /* Ensure the button doesn't look disabled even if it has backend models only */
  opacity: 1;
  pointer-events: auto;
`;

const DropdownMenu = styled.div`
  position: absolute;
  top: calc(100% + 5px);
  right: 0;
  background: ${props => props.theme.inputBackground};
  min-width: 200px;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 5px 20px rgba(0,0,0,0.15);
  z-index: 1000;
  backdrop-filter: ${props => props.theme.glassEffect};
  -webkit-backdrop-filter: ${props => props.theme.glassEffect};
  
  /* Special styling for bisexual theme */
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
  
  /* Animation */
  transform-origin: top right;
  animation: dropdown 0.2s ease;
  
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
  padding: 12px 15px;
  cursor: pointer;
  transition: background 0.2s ease;
  border-left: 3px solid transparent;
  
  ${props => props.isSelected && `
    background: rgba(0,0,0,0.1);
    border-left-color: ${props.theme.name === 'bisexual' ? 
      props.theme.primary.split(',')[0].replace('linear-gradient(145deg', '').trim() : 
      props.theme.primary.split(',')[0].replace('linear-gradient(145deg', '').trim()};
  `}
  
  &:hover {
    background: rgba(0,0,0,0.1);
  }
`;

const ModelDetails = styled.div`
  margin-left: 12px;
`;

const ModelName = styled.div`
  font-weight: 500;
`;

const ModelProvider = styled.div`
  font-size: 0.8rem;
  opacity: 0.7;
  margin-top: 2px;
`;

// Add a new styled component for the backend model indicator
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

const ModelSelector = ({ selectedModel, models, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);
  // Initialize keys as empty, rely solely on settings storage
  const [apiKeys, setApiKeys] = useState({
    google: '',
    claude: '',
    openai: '',
    nvidia: '',
    ursa: '' // Assuming custom gguf might have a key too
  });

  // Load API keys from user settings on component mount
  useEffect(() => {
    let userSettings = {};
    try {
      // Check sessionStorage first
      const userJSON = sessionStorage.getItem('ai_portal_current_user');
      if (userJSON) {
        const user = JSON.parse(userJSON);
        userSettings = user?.settings || {};
        console.log("Loaded settings from sessionStorage:", userSettings);
      } else {
        // Fall back to localStorage
        const settingsJSON = localStorage.getItem('settings');
        if (settingsJSON) {
          userSettings = JSON.parse(settingsJSON);
           console.log("Loaded settings from localStorage:", userSettings);
        } else {
           console.log("No settings found in storage.");
        }
      }

      // Update API keys state ONLY with values found in settings
      setApiKeys({
        google: userSettings.googleApiKey || '',
        claude: userSettings.anthropicApiKey || '',
        openai: userSettings.openaiApiKey || '',
        nvidia: userSettings.nvidiaApiKey || '',
        // Assuming 'customGgufApiKey' corresponds to Ursa/Custom GGUF models
        ursa: userSettings.customGgufApiKey || ''
      });
    } catch (e) {
      console.error('Error reading user settings for API keys:', e);
      // Ensure keys are reset if parsing fails
       setApiKeys({ google: '', claude: '', openai: '', nvidia: '', ursa: '' });
    }
  }, []); // Dependency array is empty, so this runs once on mount

  // Define all available models
  const baseModels = models || [
    { id: 'gemini-2-flash', name: 'Gemini 2 Flash' },
    { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro' },
    { id: 'claude-3.7-sonnet', name: 'Claude 3.7 Sonnet' },
    { id: 'chatgpt-4o', name: 'ChatGPT 4o' },
    { id: 'nemotron-super-49b', name: 'Nemotron 49B' },
    { id: 'ursa-minor', name: 'Ursa Minor' } // Represents custom GGUF
  ];

  // Debug log to see what models are passed into the component
  useEffect(() => {
    console.log("Base models before filtering:", models);
    console.log("Backend models:", models?.filter(m => m.isBackendModel === true));
  }, [models]);

  // Filter models based on available API keys (stricter check)
  const availableModels = baseModels.filter(model => {
    // If it's a backend model, always include it
    if (model.isBackendModel === true) {
      console.log('Including backend model:', model);
      return true;
    }
    
    const checkKey = (key) => key && key.trim() !== '';

    if (model.id.includes('gemini')) return checkKey(apiKeys.google);
    if (model.id.includes('claude')) return checkKey(apiKeys.claude);
    if (model.id.includes('chatgpt') || model.id.includes('gpt')) return checkKey(apiKeys.openai);
    if (model.id.includes('nemotron')) return checkKey(apiKeys.nvidia);
    // Check 'ursa' key for 'ursa-minor' (custom gguf)
    if (model.id.includes('ursa')) return checkKey(apiKeys.ursa);
    return false; // Hide if no key found or doesn't match category
  });

   // Debug log for filtered models
   useEffect(() => {
     console.log("Available models after filtering:", availableModels);
   }, [availableModels]);


  // Find current model data from the *available* models
  // If the selected model is no longer available, default to the first available, or the very first base model if none are available
  const currentModel =
    availableModels.find(model => model.id === selectedModel) ||
    availableModels[0] ||
    baseModels.find(model => model.id === 'gemini-2-flash'); // Fallback to a default like flash

  // If the initially selected model is not available, call onChange with the new default
  useEffect(() => {
    if (selectedModel !== currentModel?.id && availableModels.length > 0) {
      onChange(currentModel.id);
    } else if (availableModels.length === 0 && selectedModel) {
       // Handle case where no models are available anymore
       // Perhaps clear selection or select a placeholder?
       // For now, let's stick with the hardcoded fallback in currentModel definition
       if(selectedModel !== currentModel?.id) {
           onChange(currentModel.id) // Force selection of the fallback like flash
       }
    }
  }, [selectedModel, currentModel, availableModels, onChange]);


  // Get provider name for model
  const getProviderName = (model) => {
    const modelId = model.id;
    
    // If it's a backend model and has provider info, use it
    if (model.isBackendModel && model.provider) {
      return `${model.provider} (via Backend)`;
    }
    
    // Otherwise fall back to the standard provider logic
    if (modelId.includes('gemini-2.5-pro')) return 'Google AI (2.5 Pro)';
    if (modelId.includes('gemini')) return 'Google AI';
    if (modelId.includes('claude')) return 'Anthropic';
    if (modelId.includes('gpt') || modelId.includes('chatgpt')) return 'OpenAI';
    if (modelId.includes('nemotron')) return 'NVIDIA';
    if (modelId.includes('ursa')) return 'Custom GGUF';
    return 'AI Provider';
  };

  // Close dropdown when clicking outside
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
    // Only open if there are models to show
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
    <ModelSelectorContainer ref={containerRef}>
       {/* Only render button if a currentModel could be determined */}
       {currentModel ? (
         <ModelButton 
           onClick={toggleDropdown} 
           isOpen={isOpen}
         >
           <ModelIcon modelId={currentModel.id} size="small" />
           <span>{currentModel.name.replace(/^[^:]*:\s*/, '').replace(/\s*\([^)]*\)$/, '')}</span>
           {currentModel.isBackendModel && (
             <BackendModelBadge>E</BackendModelBadge>
           )}
           <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
             <polyline points="6 9 12 15 18 9"></polyline>
           </svg>
         </ModelButton>
       ) : (
         <ModelButton disabled>No Models Available</ModelButton>
       )}

      {isOpen && (
        <DropdownMenu>
          {availableModels.map(model => (
            <ModelOption
              key={model.id}
              isSelected={model.id === selectedModel}
              onClick={() => handleSelectModel(model.id)}
            >
              <ModelIcon modelId={model.id} size="small" />
              <ModelDetails>
                <ModelName>{model.name.replace(/^[^:]*:\s*/, '').replace(/\s*\([^)]*\)$/, '')}</ModelName>
                {model.isBackendModel && (
                  <BackendModelBadge>External</BackendModelBadge>
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