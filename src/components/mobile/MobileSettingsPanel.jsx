import React, { useState } from 'react';
import styled from 'styled-components';

const SettingsOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 2000;
  display: flex;
  align-items: flex-end;
  padding: 0;
`;

const SettingsContainer = styled.div`
  width: 100%;
  max-height: 80vh;
  background: ${props => props.theme.background};
  border-top-left-radius: 20px;
  border-top-right-radius: 20px;
  overflow: hidden;
  animation: slideUp 0.3s ease;
  
  @keyframes slideUp {
    from {
      transform: translateY(100%);
    }
    to {
      transform: translateY(0);
    }
  }
`;

const SettingsHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px;
  border-bottom: 1px solid ${props => props.theme.border};
  background: ${props => props.theme.background};
`;

const SettingsTitle = styled.h2`
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: ${props => props.theme.text};
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: ${props => props.theme.text};
  padding: 8px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  touch-action: manipulation;
  
  &:active {
    background: ${props => props.theme.border};
  }
  
  svg {
    width: 20px;
    height: 20px;
  }
`;

const SettingsContent = styled.div`
  max-height: calc(80vh - 80px);
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding: 0 20px 20px 20px;
`;

const SettingsSection = styled.div`
  margin: 24px 0;
  
  &:first-child {
    margin-top: 20px;
  }
`;

const SectionTitle = styled.h3`
  margin: 0 0 16px 0;
  font-size: 18px;
  font-weight: 600;
  color: ${props => props.theme.text};
`;

const SettingItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 0;
  border-bottom: 1px solid ${props => props.theme.border};
  
  &:last-child {
    border-bottom: none;
  }
`;

const SettingLabel = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
`;

const SettingName = styled.div`
  font-size: 16px;
  font-weight: 500;
  color: ${props => props.theme.text};
  margin-bottom: 2px;
`;

const SettingDescription = styled.div`
  font-size: 14px;
  color: ${props => props.theme.text}66;
`;

const SettingControl = styled.div`
  margin-left: 16px;
`;

const Toggle = styled.button`
  width: 48px;
  height: 28px;
  border: none;
  border-radius: 14px;
  background: ${props => props.enabled ? props.theme.primary : props.theme.border};
  position: relative;
  cursor: pointer;
  touch-action: manipulation;
  transition: background 0.2s ease;
  
  &::after {
    content: '';
    position: absolute;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: white;
    top: 4px;
    left: ${props => props.enabled ? '24px' : '4px'};
    transition: left 0.2s ease;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  }
`;

const Select = styled.select`
  padding: 8px 12px;
  border: 1px solid ${props => props.theme.border};
  border-radius: 8px;
  background: ${props => props.theme.inputBackground};
  color: ${props => props.theme.text};
  font-size: 16px;
  min-width: 120px;
  
  &:focus {
    outline: none;
    border-color: ${props => props.theme.primary};
  }
`;

const ColorGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-top: 8px;
`;

const ColorOption = styled.button`
  width: 60px;
  height: 40px;
  border: 2px solid ${props => props.selected ? props.theme.primary : 'transparent'};
  border-radius: 8px;
  background: ${props => props.color};
  cursor: pointer;
  touch-action: manipulation;
  position: relative;
  
  &:active {
    transform: scale(0.95);
  }
  
  ${props => props.selected && `
    &::after {
      content: '✓';
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      color: white;
      font-weight: bold;
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
    }
  `}
`;

const MobileSettingsPanel = ({ settings, updateSettings, closeModal }) => {
  const [localSettings, setLocalSettings] = useState(settings);

  const handleSettingChange = (key, value) => {
    const newSettings = { ...localSettings, [key]: value };
    setLocalSettings(newSettings);
    // Remove immediate parent update to prevent re-renders
    // updateSettings(newSettings);
  };

  const handleClose = () => {
    // Save settings when closing to maintain current UX behavior
    updateSettings(localSettings);
    closeModal();
  };

  const themeOptions = [
    { value: 'light', label: 'Light', color: '#ffffff' },
    { value: 'dark', label: 'Dark', color: '#1a1a1a' },
    { value: 'oled', label: 'OLED', color: '#000000' },
    { value: 'bisexual', label: 'Bisexual', color: '#d60270' },
    { value: 'lakeside', label: 'Lakeside', color: '#5b0019' },
    { value: 'pride', label: 'Pride', color: 'linear-gradient(135deg, #E40303 0%, #FF8C00 16.67%, #FFED00 33.33%, #008026 50%, #004DFF 66.67%, #750787 83.33%, #E40303 100%)' },
    { value: 'trans', label: 'Trans', color: 'linear-gradient(135deg, #5BCEFA 0%, #F5A9B8 50%, #FFFFFF 100%)' },
    { value: 'retro', label: 'Retro', color: '#008080' }
  ];

  const fontSizeOptions = [
    { value: 'small', label: 'Small' },
    { value: 'medium', label: 'Medium' },
    { value: 'large', label: 'Large' }
  ];

  const bubbleStyleOptions = [
    { value: 'modern', label: 'Modern' },
    { value: 'classic', label: 'Classic' },
    { value: 'minimal', label: 'Minimal' }
  ];

  return (
    <SettingsOverlay onClick={handleClose}>
      <SettingsContainer onClick={(e) => e.stopPropagation()}>
        <SettingsHeader>
          <SettingsTitle>Settings</SettingsTitle>
          <CloseButton onClick={handleClose}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </CloseButton>
        </SettingsHeader>
        
        <SettingsContent>
          <SettingsSection>
            <SectionTitle>Appearance</SectionTitle>
            
            <SettingItem>
              <SettingLabel>
                <SettingName>Theme</SettingName>
                <SettingDescription>Choose your preferred color scheme</SettingDescription>
              </SettingLabel>
            </SettingItem>
            <ColorGrid>
              {themeOptions.map(theme => (
                <ColorOption
                  key={theme.value}
                  color={theme.color}
                  selected={localSettings.theme === theme.value}
                  onClick={() => handleSettingChange('theme', theme.value)}
                />
              ))}
            </ColorGrid>
            
            <SettingItem>
              <SettingLabel>
                <SettingName>Font Size</SettingName>
                <SettingDescription>Adjust text size for better readability</SettingDescription>
              </SettingLabel>
              <SettingControl>
                <Select
                  value={localSettings.fontSize}
                  onChange={(e) => handleSettingChange('fontSize', e.target.value)}
                >
                  {fontSizeOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
              </SettingControl>
            </SettingItem>
            
            <SettingItem>
              <SettingLabel>
                <SettingName>Message Style</SettingName>
                <SettingDescription>Choose message bubble appearance</SettingDescription>
              </SettingLabel>
              <SettingControl>
                <Select
                  value={localSettings.bubbleStyle}
                  onChange={(e) => handleSettingChange('bubbleStyle', e.target.value)}
                >
                  {bubbleStyleOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
              </SettingControl>
            </SettingItem>
          </SettingsSection>
          
          <SettingsSection>
            <SectionTitle>Chat Behavior</SectionTitle>
            
            <SettingItem>
              <SettingLabel>
                <SettingName>Send with Enter</SettingName>
                <SettingDescription>Press Enter to send messages</SettingDescription>
              </SettingLabel>
              <SettingControl>
                <Toggle
                  enabled={localSettings.sendWithEnter}
                  onClick={() => handleSettingChange('sendWithEnter', !localSettings.sendWithEnter)}
                />
              </SettingControl>
            </SettingItem>
            
            <SettingItem>
              <SettingLabel>
                <SettingName>Show Timestamps</SettingName>
                <SettingDescription>Display time for each message</SettingDescription>
              </SettingLabel>
              <SettingControl>
                <Toggle
                  enabled={localSettings.showTimestamps}
                  onClick={() => handleSettingChange('showTimestamps', !localSettings.showTimestamps)}
                />
              </SettingControl>
            </SettingItem>
            
            <SettingItem>
              <SettingLabel>
                <SettingName>Show Model Icons</SettingName>
                <SettingDescription>Display AI model icons in messages</SettingDescription>
              </SettingLabel>
              <SettingControl>
                <Toggle
                  enabled={localSettings.showModelIcons}
                  onClick={() => handleSettingChange('showModelIcons', !localSettings.showModelIcons)}
                />
              </SettingControl>
            </SettingItem>

            <SettingItem>
              <SettingLabel>
                <SettingName>Show Greeting</SettingName>
                <SettingDescription>Display greeting on empty chat</SettingDescription>
              </SettingLabel>
              <SettingControl>
                <Toggle
                  enabled={localSettings.showGreeting !== false}
                  onClick={() => handleSettingChange('showGreeting', localSettings.showGreeting === false ? true : false)}
                />
              </SettingControl>
            </SettingItem>
            
            <SettingItem>
              <SettingLabel>
                <SettingName>Code Highlighting</SettingName>
                <SettingDescription>Syntax highlighting for code blocks</SettingDescription>
              </SettingLabel>
              <SettingControl>
                <Toggle
                  enabled={localSettings.codeHighlighting}
                  onClick={() => handleSettingChange('codeHighlighting', !localSettings.codeHighlighting)}
                />
              </SettingControl>
            </SettingItem>
          </SettingsSection>
          
          <SettingsSection>
            <SectionTitle>Accessibility</SectionTitle>
            
            <SettingItem>
              <SettingLabel>
                <SettingName>High Contrast</SettingName>
                <SettingDescription>Increase contrast for better visibility</SettingDescription>
              </SettingLabel>
              <SettingControl>
                <Toggle
                  enabled={localSettings.highContrast}
                  onClick={() => handleSettingChange('highContrast', !localSettings.highContrast)}
                />
              </SettingControl>
            </SettingItem>
            
            <SettingItem>
              <SettingLabel>
                <SettingName>Reduced Motion</SettingName>
                <SettingDescription>Minimize animations and transitions</SettingDescription>
              </SettingLabel>
              <SettingControl>
                <Toggle
                  enabled={localSettings.reducedMotion}
                  onClick={() => handleSettingChange('reducedMotion', !localSettings.reducedMotion)}
                />
              </SettingControl>
            </SettingItem>
          </SettingsSection>
        </SettingsContent>
      </SettingsContainer>
    </SettingsOverlay>
  );
};

export default MobileSettingsPanel;