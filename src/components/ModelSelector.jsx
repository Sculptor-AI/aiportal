import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';
import ModelIcon from './ModelIcon';

const ModelSelectorContainer = styled.div`
  position: relative;
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
  z-index: 100;
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

const ModelSelector = ({ selectedModel, models, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);
  
  // Find current model data
  const currentModel = models.find(model => model.id === selectedModel) || models[0];
  
  // Get provider name for model
  const getProviderName = (modelId) => {
    if (modelId.includes('gemini')) return 'Google AI';
    if (modelId.includes('claude')) return 'Anthropic';
    if (modelId.includes('gpt') || modelId.includes('chatgpt')) return 'OpenAI';
    if (modelId.includes('ursa')) return 'SculptorAI';
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
    setIsOpen(!isOpen);
  };
  
  const handleSelectModel = (modelId) => {
    onChange(modelId);
    setIsOpen(false);
  };
  
  return (
    <ModelSelectorContainer ref={containerRef}>
      <ModelButton onClick={toggleDropdown} isOpen={isOpen}>
        <ModelIcon modelId={currentModel.id} size="small" />
        <span>{currentModel.name}</span>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </ModelButton>
      
      {isOpen && (
        <DropdownMenu>
          {models.map(model => (
            <ModelOption 
              key={model.id}
              isSelected={model.id === selectedModel}
              onClick={() => handleSelectModel(model.id)}
            >
              <ModelIcon modelId={model.id} size="small" />
              <ModelDetails>
                <ModelName>{model.name}</ModelName>
                <ModelProvider>{getProviderName(model.id)}</ModelProvider>
              </ModelDetails>
            </ModelOption>
          ))}
        </DropdownMenu>
      )}
    </ModelSelectorContainer>
  );
};

export default ModelSelector;