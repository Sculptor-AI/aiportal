import React, { useState } from 'react';
import styled from 'styled-components';
import { useTranslation } from '../../contexts/TranslationContext';

const SettingsOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(2px);
  -webkit-backdrop-filter: blur(2px);
  z-index: 2000;
  display: flex;
  align-items: flex-end;
  padding: 0;
`;

const SettingsContainer = styled.div`
  width: 100%;
  max-height: 85vh;
  background: ${props => props.theme.sidebar || props.theme.background};
  backdrop-filter: blur(40px) saturate(180%);
  -webkit-backdrop-filter: blur(40px) saturate(180%);
  border-top-left-radius: 14px;
  border-top-right-radius: 14px;
  overflow: hidden;
  animation: settingsSlideUp 0.4s cubic-bezier(0.32, 0.72, 0, 1);
  
  @keyframes settingsSlideUp {
    from {
      transform: translateY(100%);
    }
    to {
      transform: translateY(0);
    }
  }

  &::before {
    content: '';
    display: block;
    width: 36px;
    height: 5px;
    background: ${props => props.theme.isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)'};
    border-radius: 3px;
    margin: 8px auto 0;
  }
`;

const SettingsHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 20px;
  border-bottom: 0.5px solid ${props => props.theme.border};
`;

const SettingsTitle = styled.h2`
  margin: 0;
  font-size: 17px;
  font-weight: 650;
  color: ${props => props.theme.text};
  letter-spacing: -0.02em;
`;

const CloseButton = styled.button`
  background: ${props => props.theme.isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.04)'};
  border: none;
  color: ${props => props.theme.textSecondary || (props.theme.text + 'aa')};
  padding: 6px;
  border-radius: 50%;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  touch-action: manipulation;
  transition: all 0.15s ease;
  
  &:active {
    transform: scale(0.88);
    background: ${props => props.theme.isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)'};
  }
  
  svg {
    width: 16px;
    height: 16px;
    stroke-width: 2.2;
  }
`;

const SettingsContent = styled.div`
  max-height: calc(85vh - 80px);
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding: 0 20px 20px 20px;
  
  &::-webkit-scrollbar { display: none; }
  scrollbar-width: none;
`;

const SettingsSection = styled.div`
  margin: 20px 0;
  
  &:first-child {
    margin-top: 16px;
  }
`;

const SectionTitle = styled.h3`
  margin: 0 0 12px 0;
  font-size: 12px;
  font-weight: 600;
  color: ${props => props.theme.textSecondary || (props.theme.text + '77')};
  text-transform: uppercase;
  letter-spacing: 0.06em;
`;

const SettingItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 13px 0;
  border-bottom: 0.5px solid ${props => props.theme.border};
  
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
  font-size: 15px;
  font-weight: 400;
  color: ${props => props.theme.text};
  margin-bottom: 1px;
  letter-spacing: -0.01em;
`;

const SettingDescription = styled.div`
  font-size: 13px;
  color: ${props => props.theme.textSecondary || (props.theme.text + '66')};
  line-height: 1.3;
`;

const SettingControl = styled.div`
  margin-left: 16px;
  flex-shrink: 0;
`;

const Toggle = styled.button`
  width: 51px;
  height: 31px;
  border: none;
  border-radius: 16px;
  background: ${props => {
    if (!props.enabled) return props.theme.isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)';
    const p = props.theme.primary;
    if (typeof p === 'string' && p.includes('gradient')) return p;
    return p;
  }};
  position: relative;
  cursor: pointer;
  touch-action: manipulation;
  transition: background 0.25s cubic-bezier(0.25, 1, 0.5, 1);
  
  &::after {
    content: '';
    position: absolute;
    width: 27px;
    height: 27px;
    border-radius: 50%;
    background: white;
    top: 2px;
    left: ${props => props.enabled ? '22px' : '2px'};
    transition: left 0.25s cubic-bezier(0.25, 1, 0.5, 1);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2), 0 2px 8px rgba(0, 0, 0, 0.06);
  }
`;

const Select = styled.select`
  padding: 7px 10px;
  border: 0.5px solid ${props => props.theme.border};
  border-radius: 8px;
  background: ${props => props.theme.inputBackground};
  color: ${props => props.theme.text};
  font-size: 15px;
  min-width: 110px;
  -webkit-appearance: none;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L5 5L9 1' stroke='%2388888888' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 10px center;
  padding-right: 28px;
  
  &:focus {
    outline: none;
    border-color: ${props => {
      const p = props.theme.primary;
      if (typeof p === 'string' && !p.includes('gradient')) return p;
      return props.theme.border;
    }};
  }
`;

const ColorGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(56px, 1fr));
  gap: 10px;
  margin-top: 8px;
`;

const ColorOption = styled.button`
  aspect-ratio: 1.5;
  border: 2px solid ${props => props.selected 
    ? (typeof props.theme.primary === 'string' && !props.theme.primary.includes('gradient') 
      ? props.theme.primary 
      : '#007AFF')
    : 'transparent'};
  border-radius: 10px;
  background: ${props => props.color};
  cursor: pointer;
  touch-action: manipulation;
  position: relative;
  transition: all 0.2s cubic-bezier(0.25, 1, 0.5, 1);
  box-shadow: ${props => props.selected ? '0 2px 12px rgba(0,0,0,0.15)' : '0 1px 4px rgba(0,0,0,0.08)'};
  
  &:active {
    transform: scale(0.92);
  }
  
  ${props => props.selected && `
    &::after {
      content: '✓';
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      color: white;
      font-weight: 700;
      font-size: 14px;
      text-shadow: 0 1px 3px rgba(0, 0, 0, 0.4);
    }
  `}
`;

const MobileSettingsPanel = ({ settings, updateSettings, closeModal }) => {
  const { t } = useTranslation();
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
    { value: 'night', label: 'Night', color: '#080808' },
    { value: 'oled', label: 'OLED', color: '#000000' },
    { value: 'bisexual', label: 'Bisexual', color: '#d60270' },
    { value: 'lakeside', label: 'Lakeside', color: '#5b0019' },
    { value: 'pride', label: 'Pride', color: 'linear-gradient(135deg, #E40303 0%, #FF8C00 16.67%, #FFED00 33.33%, #008026 50%, #004DFF 66.67%, #750787 83.33%, #E40303 100%)' },
    { value: 'trans', label: 'Trans', color: 'linear-gradient(135deg, #5BCEFA 0%, #F5A9B8 50%, #FFFFFF 100%)' },
    { value: 'retro', label: 'Retro', color: '#008080' }
  ];

  const fontSizeOptions = [
    { value: 'small', labelKey: 'settings.fontSize.small' },
    { value: 'medium', labelKey: 'settings.fontSize.medium' },
    { value: 'large', labelKey: 'settings.fontSize.large' }
  ];

  const bubbleStyleOptions = [
    { value: 'modern', labelKey: 'settings.interface.bubbles.modern' },
    { value: 'classic', labelKey: 'settings.interface.bubbles.classic' },
    { value: 'minimal', labelKey: 'settings.interface.bubbles.minimal' }
  ];

  return (
    <SettingsOverlay onClick={handleClose}>
      <SettingsContainer onClick={(e) => e.stopPropagation()}>
        <SettingsHeader>
          <SettingsTitle>{t('settings.title')}</SettingsTitle>
          <CloseButton onClick={handleClose} aria-label={t('settings.close')}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </CloseButton>
        </SettingsHeader>
        
        <SettingsContent>
          <SettingsSection>
            <SectionTitle>{t('settings.sections.appearance')}</SectionTitle>
            
            <SettingItem>
              <SettingLabel>
                <SettingName>{t('settings.general.theme.label')}</SettingName>
                <SettingDescription>{t('settings.mobile.themeDescription')}</SettingDescription>
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
                <SettingName>{t('settings.appearance.fontSize.label')}</SettingName>
                <SettingDescription>{t('settings.mobile.fontSizeDescription')}</SettingDescription>
              </SettingLabel>
              <SettingControl>
                <Select
                  value={localSettings.fontSize}
                  onChange={(e) => handleSettingChange('fontSize', e.target.value)}
                >
                  {fontSizeOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {t(option.labelKey)}
                    </option>
                  ))}
                </Select>
              </SettingControl>
            </SettingItem>
            
            <SettingItem>
              <SettingLabel>
                <SettingName>{t('settings.mobile.messageStyle.label')}</SettingName>
                <SettingDescription>{t('settings.mobile.messageStyle.description')}</SettingDescription>
              </SettingLabel>
              <SettingControl>
                <Select
                  value={localSettings.bubbleStyle}
                  onChange={(e) => handleSettingChange('bubbleStyle', e.target.value)}
                >
                  {bubbleStyleOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {t(option.labelKey)}
                    </option>
                  ))}
                </Select>
              </SettingControl>
            </SettingItem>
          </SettingsSection>
          
          <SettingsSection>
            <SectionTitle>{t('settings.mobile.chatBehavior')}</SectionTitle>
            
            <SettingItem>
              <SettingLabel>
                <SettingName>{t('settings.mobile.sendWithEnter.title')}</SettingName>
                <SettingDescription>{t('settings.mobile.sendWithEnter.description')}</SettingDescription>
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
                <SettingName>{t('settings.mobile.timestamps.title')}</SettingName>
                <SettingDescription>{t('settings.mobile.timestamps.description')}</SettingDescription>
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
                <SettingName>{t('settings.mobile.modelIcons.title')}</SettingName>
                <SettingDescription>{t('settings.mobile.modelIcons.description')}</SettingDescription>
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
                <SettingName>{t('settings.mobile.greeting.title')}</SettingName>
                <SettingDescription>{t('settings.mobile.greeting.description')}</SettingDescription>
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
                <SettingName>{t('settings.mobile.codeHighlighting.title')}</SettingName>
                <SettingDescription>{t('settings.mobile.codeHighlighting.description')}</SettingDescription>
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
            <SectionTitle>{t('settings.sections.accessibility')}</SectionTitle>
            
            <SettingItem>
              <SettingLabel>
                <SettingName>{t('settings.accessibility.visual.highContrast')}</SettingName>
                <SettingDescription>{t('settings.mobile.accessibility.highContrastDescription')}</SettingDescription>
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
                <SettingName>{t('settings.accessibility.visual.reducedMotion')}</SettingName>
                <SettingDescription>{t('settings.mobile.accessibility.reducedMotionDescription')}</SettingDescription>
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
