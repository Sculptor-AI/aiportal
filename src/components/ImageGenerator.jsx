import React, { useState } from 'react';
import styled from 'styled-components';
import { generateImageApi } from '../services/imageService';

const ImageGeneratorContainer = styled.div`
  position: fixed;
  top: 0;
  right: ${props => props.$otherPanelsOpen * 450}px;
  width: 450px;
  height: 100vh;
  background: ${props => props.theme.background};
  z-index: 1000;
  display: flex;
  flex-direction: column;
  box-shadow: -3px 0 10px rgba(0, 0, 0, 0.15);
  border-left: 1px solid ${props => props.theme.border};
  transform: ${props => props.$isOpen ? 'translateX(0%)' : 'translateX(100%)'};
  visibility: ${props => props.$isOpen ? 'visible' : 'hidden'};
  transition: transform 0.3s ease-in-out, visibility 0.3s ease-in-out;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid ${props => props.theme.border};
  background: ${props => props.theme.name === 'retro' ? props.theme.buttonFace : 'transparent'};
`;

const Title = styled.h2`
  margin: 0;
  font-size: 18px;
  color: ${props => props.theme.text};
  font-family: ${props => props.theme.name === 'retro' ? 'MS Sans Serif, sans-serif' : 'inherit'};
`;

const CloseButton = styled.button`
  background: ${props => props.theme.name === 'retro' ? props.theme.buttonFace : 'transparent'};
  border: ${props => props.theme.name === 'retro' ? 
    `1px solid ${props.theme.buttonHighlightLight} ${props.theme.buttonShadowDark} ${props.theme.buttonShadowDark} ${props.theme.buttonHighlightLight}` : 
    'none'};
  color: ${props => props.theme.text};
  padding: ${props => props.theme.name === 'retro' ? '4px 12px' : '8px'};
  cursor: pointer;
  font-size: ${props => props.theme.name === 'retro' ? '12px' : '24px'};
  border-radius: ${props => props.theme.name === 'retro' ? '0' : '4px'};
  
  &:hover {
    background: ${props => props.theme.name === 'retro' ? props.theme.buttonFace : 'rgba(0, 0, 0, 0.1)'};
  }
`;

const Content = styled.div`
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const InputSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const Label = styled.label`
  color: ${props => props.theme.text};
  font-size: 14px;
  font-weight: 500;
`;

const TextArea = styled.textarea`
  background: ${props => props.theme.inputBackground || props.theme.background};
  border: 1px solid ${props => props.theme.border};
  color: ${props => props.theme.text};
  padding: 12px;
  border-radius: 6px;
  resize: vertical;
  min-height: 80px;
  font-family: inherit;
  
  &:focus {
    outline: none;
    border-color: ${props => props.theme.primary || '#007bff'};
  }
`;

const GenerateButton = styled.button`
  background: ${props => props.theme.primary || '#007bff'};
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 16px;
  font-weight: 500;
  disabled: ${props => props.disabled};
  
  &:hover:not(:disabled) {
    opacity: 0.9;
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const ImageSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const GeneratedImage = styled.img`
  max-width: 100%;
  height: auto;
  border-radius: 6px;
  border: 1px solid ${props => props.theme.border};
`;

const LoadingSpinner = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
  color: ${props => props.theme.text};
`;

const ErrorMessage = styled.div`
  color: #dc3545;
  background: rgba(220, 53, 69, 0.1);
  border: 1px solid rgba(220, 53, 69, 0.3);
  border-radius: 6px;
  padding: 12px;
  font-size: 14px;
`;

const ImageGenerator = ({ isOpen, onClose, otherPanelsOpen = 0 }) => {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [generatedImage, setGeneratedImage] = useState(null);
  const [error, setError] = useState(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('Please enter a prompt');
      return;
    }

    setIsLoading(true);
    setError(null);
    setGeneratedImage(null);

    try {
      const data = await generateImageApi(prompt.trim());
      setGeneratedImage(data.imageData);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleGenerate();
    }
  };

  return (
    <ImageGeneratorContainer $isOpen={isOpen} $otherPanelsOpen={otherPanelsOpen}>
      <Header>
        <Title>Generate Image</Title>
        <CloseButton onClick={onClose}>×</CloseButton>
      </Header>
      
      <Content>
        <InputSection>
          <Label htmlFor="image-prompt">Enter your image prompt:</Label>
          <TextArea
            id="image-prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Describe the image you want to generate..."
            disabled={isLoading}
          />
          <GenerateButton 
            onClick={handleGenerate} 
            disabled={isLoading || !prompt.trim()}
          >
            {isLoading ? 'Generating...' : 'Generate Image'}
          </GenerateButton>
        </InputSection>

        {error && <ErrorMessage>{error}</ErrorMessage>}

        {isLoading && (
          <LoadingSpinner>
            Generating your image...
          </LoadingSpinner>
        )}

        {generatedImage && (
          <ImageSection>
            <Label>Generated Image:</Label>
            <GeneratedImage src={generatedImage} alt="Generated artwork" />
          </ImageSection>
        )}
      </Content>
    </ImageGeneratorContainer>
  );
};

export default ImageGenerator;