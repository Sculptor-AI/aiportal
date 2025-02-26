import React, { useState } from 'react';
import styled from 'styled-components';

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
`;

const ModalContent = styled.div`
  background-color: ${props => props.theme.sidebar};
  color: ${props => props.theme.text};
  border-radius: 8px;
  width: 500px;
  max-width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 4px 12px ${props => props.theme.shadow};
  
  @media (max-width: 768px) {
    max-width: 95%;
    width: 95%;
  }
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid ${props => props.theme.border};
  position: sticky;
  top: 0;
  background-color: ${props => props.theme.sidebar};
  z-index: 1;
`;

const ModalTitle = styled.h2`
  margin: 0;
  font-size: 1.2rem;
  font-weight: 600;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1.5rem;
  color: ${props => props.theme.text};
  opacity: 0.7;
  
  &:hover {
    opacity: 1;
  }
`;

const ModalBody = styled.div`
  padding: 20px;
`;

const SettingsSection = styled.div`
  margin-bottom: 30px;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const SectionTitle = styled.h3`
  margin: 0 0 15px 0;
  font-size: 1.1rem;
  font-weight: 600;
  padding-bottom: 8px;
  border-bottom: 1px solid ${props => props.theme.border}80;
`;

const SettingGroup = styled.div`
  margin-bottom: 20px;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const ApiTokenInput = styled.div`
  margin-bottom: 16px;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const TokenLabel = styled.label`
  display: block;
  margin-bottom: 6px;
  font-size: 0.9rem;
  font-weight: 500;
`;

const TokenInput = styled.input`
  width: 100%;
  padding: 8px 10px;
  border-radius: 4px;
  border: 1px solid ${props => props.theme.border};
  background-color: ${props => props.theme.background};
  color: ${props => props.theme.text};
  font-family: inherit;
  
  &:focus {
    outline: none;
    border-color: ${props => props.theme.primary};
  }
`;

const TokenNote = styled.p`
  font-size: 0.8rem;
  color: ${props => props.theme.text}80;
  margin-top: 4px;
  margin-bottom: 0;
`;

const SettingLabel = styled.h4`
  margin: 0 0 10px 0;
  font-size: 1rem;
  font-weight: 500;
`;

const RadioGroup = styled.div`
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  
  @media (max-width: 768px) {
    gap: 8px;
  }
`;

const RadioOption = styled.label`
  display: flex;
  align-items: center;
  cursor: pointer;
  padding: 8px 12px;
  border-radius: 4px;
  background-color: ${props => props.isSelected ? props.theme.primary + '20' : 'transparent'};
  border: 1px solid ${props => props.isSelected ? props.theme.primary : props.theme.border};
  
  &:hover {
    background-color: ${props => props.theme.hover};
  }
  
  input {
    margin-right: 8px;
  }
`;

const ToggleWrapper = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 10px;
`;

const Toggle = styled.label`
  position: relative;
  display: inline-block;
  width: 44px;
  height: 24px;
  margin-right: 10px;
  
  input {
    opacity: 0;
    width: 0;
    height: 0;
  }
`;

const Slider = styled.span`
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: ${props => props.checked ? props.theme.primary : props.theme.border};
  transition: 0.4s;
  border-radius: 24px;
  
  &:before {
    position: absolute;
    content: "";
    height: 16px;
    width: 16px;
    left: 4px;
    bottom: 4px;
    background-color: white;
    transition: 0.4s;
    border-radius: 50%;
    transform: ${props => props.checked ? 'translateX(20px)' : 'translateX(0)'};
  }
`;

const ThemeOption = styled.label`
  display: flex;
  align-items: center;
  padding: 10px;
  border-radius: 8px;
  border: 2px solid ${props => props.isSelected ? props.theme.primary : props.theme.border};
  background: ${props => props.isSelected ? props.theme.cardBackground : 'transparent'};
  cursor: pointer;
  transition: all 0.2s ease;
  width: 90px;
  justify-content: center;
  position: relative;
  
  /* Make bisexual theme option wider */
  &.bisexual-theme {
    width: 110px;
  }
  
  input {
    position: relative;
    opacity: 1;
    margin-right: 6px;
    width: 16px;
    height: 16px;
  }
  
  &:hover {
    background: ${props => props.theme.cardBackground};
    border-color: ${props => props.theme.primary};
  }
  
  /* Light theme option - always light */
  &.light-theme {
    background: ${props => props.isSelected ? '#ffffff' : '#f0f0f0'};
    color: #222222;
    border-color: ${props => props.isSelected ? '#0078d7' : '#cccccc'};
  }
  
  /* Dark theme option - always dark */
  &.dark-theme {
    background: ${props => props.isSelected ? '#222222' : '#333333'};
    color: #ffffff;
    border-color: ${props => props.isSelected ? '#0078d7' : '#555555'};
  }
  
  /* OLED theme option - true black */
  &.oled-theme {
    background: ${props => props.isSelected ? '#000000' : '#0a0a0a'};
    color: #ffffff;
    border-color: ${props => props.isSelected ? '#0078d7' : '#333333'};
  }
  
  /* Ocean theme option */
  &.ocean-theme {
    background: ${props => props.isSelected ? 
      'linear-gradient(135deg, #0277bd, #039be5, #4fc3f7)' : 
      'linear-gradient(135deg, #0277bd80, #039be580, #4fc3f780)'};
    color: white;
    border-color: ${props => props.isSelected ? '#0277bd' : '#039be5'};
    text-shadow: 0 1px 2px rgba(0,0,0,0.5);
  }
  
  /* Forest theme option */
  &.forest-theme {
    background: ${props => props.isSelected ? 
      'linear-gradient(135deg, #2e7d32, #388e3c, #4caf50)' : 
      'linear-gradient(135deg, #2e7d3280, #388e3c80, #4caf5080)'};
    color: white;
    border-color: ${props => props.isSelected ? '#2e7d32' : '#388e3c'};
    text-shadow: 0 1px 2px rgba(0,0,0,0.5);
  }
  
  /* Keep existing theme-specific styles */
  &.bisexual-theme {
    background: ${props => props.isSelected ? 
      'linear-gradient(135deg, #D60270, #9B4F96, #0038A8)' : 
      'linear-gradient(135deg, #D6027080, #9B4F9680, #0038A880)'};
    color: white;
    border-color: ${props => props.isSelected ? '#D60270' : '#9B4F96'};
    text-shadow: 0 1px 2px rgba(0,0,0,0.5);
  }
  
  /* Pride theme option */
  &.pride-theme {
    background: ${props => props.isSelected ? 
      'linear-gradient(135deg, #ff0000, #ff9900, #ffff00, #33cc33, #3399ff, #9933ff)' : 
      'linear-gradient(135deg, #ff000080, #ff990080, #ffff0080, #33cc3380, #3399ff80, #9933ff80)'};
    color: white;
    border-color: ${props => props.isSelected ? '#ff0000' : '#9933ff'};
    text-shadow: 0 1px 2px rgba(0,0,0,0.5);
  }
  
  /* Trans theme option */
  &.trans-theme {
    background: ${props => props.isSelected ? 
      'linear-gradient(135deg, #5BCEFA, #F5A9B8, #FFFFFF, #F5A9B8, #5BCEFA)' : 
      'linear-gradient(135deg, #5BCEFA80, #F5A9B880, #FFFFFF80, #F5A9B880, #5BCEFA80)'};
    color: #333;
    border-color: ${props => props.isSelected ? '#5BCEFA' : '#F5A9B8'};
    text-shadow: 0 1px 2px rgba(0,0,0,0.2);
  }
  
  @media (max-width: 768px) {
    width: 80px;
    
    /* Keep bisexual theme wider on mobile too */
    &.bisexual-theme {
      width: 100px;
    }
  }
`;

const AboutSection = styled.div`
  margin-top: 20px;
  padding-top: 15px;
  border-top: 1px solid ${props => props.theme.border}80;
  text-align: center;
  font-size: 0.9rem;
`;

const VersionText = styled.div`
  margin-bottom: 8px;
  opacity: 0.8;
`;

const RainbowText = styled.span`
  background: ${props => {
    if (props.theme.name === 'bisexual') {
      return 'linear-gradient(to right, #D60270, #9B4F96, #0038A8, #9B4F96, #D60270)';
    } else if (props.theme.name === 'trans') {
      return 'linear-gradient(to right, #5BCEFA, #F5A9B8, #FFFFFF, #F5A9B8, #5BCEFA)';
    } else {
      return 'linear-gradient(to right, #ff0000, #ff9900, #ffff00, #33cc33, #3399ff, #9933ff, #ff33cc, #ff0000)';
    }
  }};
  background-size: 400% auto;
  color: transparent;
  -webkit-background-clip: text;
  background-clip: text;
  animation: ${props => {
    if (props.theme.name === 'bisexual') return 'bisexualPride';
    else if (props.theme.name === 'trans') return 'transPride';
    else return 'rainbow';
  }} 8s linear infinite;
  font-weight: 600;
  
  @keyframes rainbow { 
    0% {
      background-position: 0% center;
    }
    100% {
      background-position: 400% center;
    }
  }
  
  @keyframes bisexualPride { 
    0% {
      background-position: 0% center;
    }
    100% {
      background-position: 400% center;
    }
  }
  
  @keyframes transPride { 
    0% {
      background-position: 0% center;
    }
    100% {
      background-position: 400% center;
    }
  }
`;

const SettingsModal = ({ settings, updateSettings, closeModal }) => {
  const [localSettings, setLocalSettings] = useState(settings);
  
  const handleChange = (key, value) => {
    const newSettings = { ...localSettings, [key]: value };
    setLocalSettings(newSettings);
    updateSettings(newSettings);
  };
  
  const handleOutsideClick = (e) => {
    if (e.target === e.currentTarget) {
      closeModal();
    }
  };
  
  return (
    <ModalOverlay onClick={handleOutsideClick}>
      <ModalContent>
        <ModalHeader>
          <ModalTitle>Settings</ModalTitle>
          <CloseButton onClick={closeModal}>&times;</CloseButton>
        </ModalHeader>
        <ModalBody>
          <SettingsSection>
            <SectionTitle>Appearance</SectionTitle>
            
            <SettingGroup>
              <SettingLabel>Theme</SettingLabel>
              <RadioGroup>
                <ThemeOption 
                  isSelected={localSettings.theme === 'light'}
                  className="light-theme"
                >
                  <input
                    type="radio"
                    name="theme"
                    value="light"
                    checked={localSettings.theme === 'light'}
                    onChange={() => handleChange('theme', 'light')}
                  />
                  Light
                </ThemeOption>
                <ThemeOption 
                  isSelected={localSettings.theme === 'dark'}
                  className="dark-theme"
                >
                  <input
                    type="radio"
                    name="theme"
                    value="dark"
                    checked={localSettings.theme === 'dark'}
                    onChange={() => handleChange('theme', 'dark')}
                  />
                  Dark
                </ThemeOption>
                <ThemeOption 
                  isSelected={localSettings.theme === 'oled'}
                  className="oled-theme"
                >
                  <input
                    type="radio"
                    name="theme"
                    value="oled"
                    checked={localSettings.theme === 'oled'}
                    onChange={() => handleChange('theme', 'oled')}
                  />
                  OLED
                </ThemeOption>
                <ThemeOption 
                  isSelected={localSettings.theme === 'ocean'}
                  className="ocean-theme"
                >
                  <input
                    type="radio"
                    name="theme"
                    value="ocean"
                    checked={localSettings.theme === 'ocean'}
                    onChange={() => handleChange('theme', 'ocean')}
                  />
                  Ocean
                </ThemeOption>
                <ThemeOption 
                  isSelected={localSettings.theme === 'forest'}
                  className="forest-theme"
                >
                  <input
                    type="radio"
                    name="theme"
                    value="forest"
                    checked={localSettings.theme === 'forest'}
                    onChange={() => handleChange('theme', 'forest')}
                  />
                  Forest
                </ThemeOption>
                <ThemeOption 
                  isSelected={localSettings.theme === 'pride'}
                  className="pride-theme"
                >
                  <input
                    type="radio"
                    name="theme"
                    value="pride"
                    checked={localSettings.theme === 'pride'}
                    onChange={() => handleChange('theme', 'pride')}
                  />
                  Pride
                </ThemeOption>
                <ThemeOption 
                  isSelected={localSettings.theme === 'trans'}
                  className="trans-theme"
                >
                  <input
                    type="radio"
                    name="theme"
                    value="trans"
                    checked={localSettings.theme === 'trans'}
                    onChange={() => handleChange('theme', 'trans')}
                  />
                  Trans
                </ThemeOption>
                <ThemeOption 
                  isSelected={localSettings.theme === 'bisexual'}
                  className="bisexual-theme"
                >
                  <input
                    type="radio"
                    name="theme"
                    value="bisexual"
                    checked={localSettings.theme === 'bisexual'}
                    onChange={() => handleChange('theme', 'bisexual')}
                  />
                  Bisexual
                </ThemeOption>
              </RadioGroup>
            </SettingGroup>
            
            <SettingGroup>
              <SettingLabel>Font Size</SettingLabel>
              <RadioGroup>
                <RadioOption isSelected={localSettings.fontSize === 'small'}>
                  <input
                    type="radio"
                    name="fontSize"
                    value="small"
                    checked={localSettings.fontSize === 'small'}
                    onChange={() => handleChange('fontSize', 'small')}
                  />
                  Small
                </RadioOption>
                <RadioOption isSelected={localSettings.fontSize === 'medium'}>
                  <input
                    type="radio"
                    name="fontSize"
                    value="medium"
                    checked={localSettings.fontSize === 'medium'}
                    onChange={() => handleChange('fontSize', 'medium')}
                  />
                  Medium
                </RadioOption>
                <RadioOption isSelected={localSettings.fontSize === 'large'}>
                  <input
                    type="radio"
                    name="fontSize"
                    value="large"
                    checked={localSettings.fontSize === 'large'}
                    onChange={() => handleChange('fontSize', 'large')}
                  />
                  Large
                </RadioOption>
              </RadioGroup>
            </SettingGroup>
          </SettingsSection>
          
          <SettingsSection>
            <SectionTitle>Chat</SectionTitle>
            
            <SettingGroup>
              <SettingLabel>Message Features</SettingLabel>
              
              <ToggleWrapper>
                <Toggle>
                  <input
                    type="checkbox"
                    checked={localSettings.showTimestamps}
                    onChange={() => handleChange('showTimestamps', !localSettings.showTimestamps)}
                  />
                  <Slider checked={localSettings.showTimestamps} />
                </Toggle>
                Show message timestamps
              </ToggleWrapper>
              
              <ToggleWrapper>
                <Toggle>
                  <input
                    type="checkbox"
                    checked={localSettings.showModelIcons}
                    onChange={() => handleChange('showModelIcons', !localSettings.showModelIcons)}
                  />
                  <Slider checked={localSettings.showModelIcons} />
                </Toggle>
                Show model icons in messages
              </ToggleWrapper>
              
              <ToggleWrapper>
                <Toggle>
                  <input
                    type="checkbox"
                    checked={localSettings.codeHighlighting}
                    onChange={() => handleChange('codeHighlighting', !localSettings.codeHighlighting)}
                  />
                  <Slider checked={localSettings.codeHighlighting} />
                </Toggle>
                Enable code syntax highlighting
              </ToggleWrapper>
            </SettingGroup>
            
            <SettingGroup>
              <SettingLabel>Message Sending</SettingLabel>
              <ToggleWrapper>
                <Toggle>
                  <input
                    type="checkbox"
                    checked={localSettings.sendWithEnter}
                    onChange={() => handleChange('sendWithEnter', !localSettings.sendWithEnter)}
                  />
                  <Slider checked={localSettings.sendWithEnter} />
                </Toggle>
                Send message with Enter (use Shift+Enter for new line)
              </ToggleWrapper>
            </SettingGroup>
            
            <SettingGroup>
              <SettingLabel>Message Alignment</SettingLabel>
              <RadioGroup>
                <RadioOption isSelected={localSettings.messageAlignment === 'left'}>
                  <input
                    type="radio"
                    name="messageAlignment"
                    value="left"
                    checked={localSettings.messageAlignment === 'left'}
                    onChange={() => handleChange('messageAlignment', 'left')}
                  />
                  Left
                </RadioOption>
                <RadioOption isSelected={localSettings.messageAlignment === 'right'}>
                  <input
                    type="radio"
                    name="messageAlignment"
                    value="right"
                    checked={localSettings.messageAlignment === 'right'}
                    onChange={() => handleChange('messageAlignment', 'right')}
                  />
                  Right
                </RadioOption>
              </RadioGroup>
            </SettingGroup>
          </SettingsSection>
          
          <SettingsSection>
            <SectionTitle>API Tokens</SectionTitle>
            <p style={{ fontSize: '0.9rem', marginBottom: '15px' }}>
              Add your own API tokens to use with the different AI models.
              These will be securely stored in your account.
            </p>
            
            <ApiTokenInput>
              <TokenLabel htmlFor="openai-api-token">OpenAI API Key</TokenLabel>
              <TokenInput
                id="openai-api-token"
                type="password"
                placeholder="sk-..."
                value={localSettings.openaiApiKey || ''}
                onChange={(e) => handleChange('openaiApiKey', e.target.value)}
              />
              <TokenNote>Used for ChatGPT models</TokenNote>
            </ApiTokenInput>
            
            <ApiTokenInput>
              <TokenLabel htmlFor="anthropic-api-token">Anthropic API Key</TokenLabel>
              <TokenInput
                id="anthropic-api-token"
                type="password"
                placeholder="sk-ant-..."
                value={localSettings.anthropicApiKey || ''}
                onChange={(e) => handleChange('anthropicApiKey', e.target.value)}
              />
              <TokenNote>Used for Claude models</TokenNote>
            </ApiTokenInput>
            
            <ApiTokenInput>
              <TokenLabel htmlFor="google-api-token">Google AI API Key</TokenLabel>
              <TokenInput
                id="google-api-token"
                type="password"
                placeholder="AIzaSy..."
                value={localSettings.googleApiKey || ''}
                onChange={(e) => handleChange('googleApiKey', e.target.value)}
              />
              <TokenNote>Used for Gemini models</TokenNote>
            </ApiTokenInput>
          </SettingsSection>
          <AboutSection>
            <VersionText>Version : 0.1.0</VersionText>
            <div>Made with <RainbowText>Pride</RainbowText></div>
          </AboutSection>
        </ModalBody>
      </ModalContent>
    </ModalOverlay>
  );
};

export default SettingsModal;