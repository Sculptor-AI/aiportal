import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { getTheme } from '../styles/themes';

const OnboardingOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(10px);
`;

const OnboardingContainer = styled.div`
  background: ${props => props.theme.background};
  border-radius: 20px;
  width: 90%;
  max-width: 1200px;
  height: 80vh;
  max-height: 700px;
  display: flex;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
  overflow: hidden;
  
  @media (max-width: 768px) {
    width: 95%;
    height: 90vh;
    border-radius: 16px;
    flex-direction: column;
  }
`;

const LeftPanel = styled.div`
  flex: 1;
  padding: 20px 40px;
  background: ${props => props.theme.sidebar};
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: center;
  
  @media (max-width: 768px) {
    flex: 1;
    padding: 15px 20px;
    min-height: 60vh;
  }
`;

const RightPanel = styled.div`
  flex: 1;
  padding: 40px;
  background: ${props => props.theme.chat};
  display: flex;
  flex-direction: column;
  justify-content: center;
  position: relative;
  overflow: hidden;
  
  @media (max-width: 768px) {
    padding: 20px;
    min-height: 30vh;
  }
`;

const WelcomeTitle = styled.h1`
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 10px;
  margin-top: 10px;
  text-align: center;
  color: ${props => props.theme.text};
  
  @media (max-width: 768px) {
    font-size: 2rem;
    margin-bottom: 8px;
    margin-top: 8px;
  }
`;

const WelcomeSubtitle = styled.p`
  font-size: 1.2rem;
  color: ${props => props.theme.text}CC;
  text-align: center;
  margin-bottom: 40px;
  line-height: 1.6;
`;

const StepIndicator = styled.div`
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-bottom: 0px;
`;

const StepDot = styled.div`
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: ${props => props.$active ? props.theme.primary : props.theme.border};
  transition: all 0.3s ease;
`;

const StepContent = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
`;

const StepTitle = styled.h2`
  font-size: 1.8rem;
  font-weight: 600;
  margin-bottom: 16px;
  color: ${props => props.theme.text};
`;

const StepDescription = styled.p`
  font-size: 1rem;
  color: ${props => props.theme.text}BB;
  margin-bottom: 20px;
  line-height: 1.5;
`;

const OptionGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 16px;
  width: 100%;
  max-width: 600px;
  
  @media (max-width: 768px) {
    grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
    gap: 12px;
    max-width: 100%;
  }
  
  &.theme-grid {
    grid-template-columns: repeat(4, 1fr);
    gap: 12px;
    max-width: 400px;
    
    @media (max-width: 768px) {
      grid-template-columns: repeat(3, 1fr);
      gap: 8px;
      max-width: 300px;
    }
  }
`;

const OptionCard = styled.div`
  padding: 20px 16px;
  border-radius: 12px;
  border: 2px solid ${props => props.$selected ? props.theme.primary : 'transparent'};
  background: ${props => props.$selected ? props.theme.primary + '20' : props.theme.background};
  cursor: pointer;
  transition: all 0.3s ease;
  text-align: center;
  position: relative;
  overflow: hidden;
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
  }
  
  &.theme-option {
    min-height: 80px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 500;
    color: ${props => props.theme.text};
    
    &.small {
      padding: 12px 8px;
      min-height: 60px;
      font-size: 0.85rem;
    }
  }
  
  &.light-theme {
    background: ${props => props.$selected ? '#0078d7' : '#ffffff'};
    color: ${props => props.$selected ? '#ffffff' : '#000000'};
    border-color: ${props => props.$selected ? '#0078d7' : '#e0e0e0'};
  }
  
  &.dark-theme {
    background: ${props => props.$selected ? '#0078d7' : '#1a1a1a'};
    color: ${props => props.$selected ? '#ffffff' : '#ffffff'};
    border-color: ${props => props.$selected ? '#0078d7' : '#333333'};
  }
  
  &.oled-theme {
    background: ${props => props.$selected ? '#0078d7' : '#000000'};
    color: ${props => props.$selected ? '#ffffff' : '#ffffff'};
    border-color: ${props => props.$selected ? '#0078d7' : '#111111'};
  }
  
  &.ocean-theme {
    background: ${props => props.$selected ? '#0277bd' : 'linear-gradient(135deg, #0277bd, #039be5)'};
    color: white;
    border-color: ${props => props.$selected ? '#0277bd' : 'transparent'};
  }
  
  &.forest-theme {
    background: ${props => props.$selected ? '#2e7d32' : 'linear-gradient(135deg, #2e7d32, #4caf50)'};
    color: white;
    border-color: ${props => props.$selected ? '#2e7d32' : 'transparent'};
  }
  
  &.pride-theme {
    background: ${props => props.$selected ? '#E40303' : 'linear-gradient(135deg, #E40303, #FF8C00, #FFED00, #008026, #004DFF, #750787)'};
    color: white;
    border-color: ${props => props.$selected ? '#E40303' : 'transparent'};
  }
  
  &.trans-theme {
    background: ${props => props.$selected ? '#5BCEFA' : 'linear-gradient(135deg, #5BCEFA, #F5A9B8, #FFFFFF)'};
    color: ${props => props.$selected ? '#ffffff' : '#000000'};
    border-color: ${props => props.$selected ? '#5BCEFA' : 'transparent'};
  }
  
  &.bisexual-theme {
    background: ${props => props.$selected ? '#D60270' : 'linear-gradient(135deg, #D60270, #9B4F96, #0038A8)'};
    color: white;
    border-color: ${props => props.$selected ? '#D60270' : 'transparent'};
  }
  
  &.galaxy-theme {
    background: ${props => props.$selected ? '#7b61ff' : 'linear-gradient(135deg, #0f052b, #12063b, #1b0a4a)'};
    color: white;
    border-color: ${props => props.$selected ? '#7b61ff' : 'transparent'};
  }
  
  &.sunset-theme {
    background: ${props => props.$selected ? '#ff7e5f' : 'linear-gradient(135deg, #ff7e5f, #feb47b)'};
    color: ${props => props.$selected ? '#ffffff' : '#2d0b00'};
    border-color: ${props => props.$selected ? '#ff7e5f' : 'transparent'};
  }
  
  &.cyberpunk-theme {
    background: ${props => props.$selected ? '#ff00cc' : 'linear-gradient(135deg, #0f0c29, #302b63, #24243e)'};
    color: white;
    border-color: ${props => props.$selected ? '#ff00cc' : 'transparent'};
  }
  
  &.bubblegum-theme {
    background: ${props => props.$selected ? '#ff69b4' : 'linear-gradient(135deg, #ff9a9e, #fad0c4)'};
    color: ${props => props.$selected ? '#ffffff' : '#551133'};
    border-color: ${props => props.$selected ? '#ff69b4' : 'transparent'};
  }
  
  &.desert-theme {
    background: ${props => props.$selected ? '#d86f45' : 'linear-gradient(135deg, #c79081, #dfa579)'};
    color: ${props => props.$selected ? '#ffffff' : '#3e2b1f'};
    border-color: ${props => props.$selected ? '#d86f45' : 'transparent'};
  }
  
  &.lakeside-theme {
    background: ${props => props.$selected ? '#c69214' : 'linear-gradient(135deg, #783f40, #c69214)'};
    color: white;
    border-color: ${props => props.$selected ? '#c69214' : 'transparent'};
  }
  
  &.retro-theme {
    background: ${props => props.$selected ? '#000080' : '#C0C0C0'};
    color: ${props => props.$selected ? '#ffffff' : '#000000'};
    border-color: ${props => props.$selected ? '#000080' : '#808080'};
    border-style: ${props => props.$selected ? 'solid' : 'inset'};
    border-width: 2px;
  }
`;

const FontSizeLabel = styled.div`
  font-weight: 600;
  
  &.small { font-size: 0.9rem; }
  &.medium { font-size: 1rem; }
  &.large { font-size: 1.1rem; }
`;

const BubbleStylePreview = styled.div`
  margin-top: 8px;
  padding: 8px 12px;
  background: ${props => props.theme.messageAi};
  color: ${props => props.theme.text};
  
  &.modern { border-radius: 16px; }
  &.classic { border-radius: 4px; }
  &.minimal { border-radius: 0; border: 1px solid ${props => props.theme.border}; }
`;

const SidebarIndicator = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-top: -2px;
`;

const IndicatorSquare = styled.div`
  width: 16px;
  height: 16px;
  position: relative;
  
  &.traditional {
    background: ${props => props.theme.text};
    border-radius: 2px;
  }
  
  &.floating {
    background: ${props => props.theme.background};
    border: 2px solid ${props => props.theme.text};
    border-radius: 2px;
    
    &::after {
      content: '';
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 8px;
      height: 8px;
      background: ${props => props.theme.text};
      border-radius: 1px;
    }
  }
`;

const NavigationButtons = styled.div`
  display: flex;
  justify-content: space-between;
  margin-top: 20px;
  width: 100%;
  max-width: 600px;
`;

const NavButton = styled.button`
  padding: 12px 24px;
  border-radius: 8px;
  border: none;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &.primary {
    background: ${props => props.theme.primary};
    color: white;
    
    &:hover {
      background: ${props => props.theme.primary}DD;
      transform: translateY(-2px);
    }
  }
  
  &.secondary {
    background: transparent;
    color: ${props => props.theme.text};
    border: 1px solid ${props => props.theme.border};
    
    &:hover {
      background: ${props => props.theme.background};
    }
  }
`;

const PreviewContainer = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 90%;
  max-width: 400px;
  height: 300px;
  background: ${props => props.theme.background};
  border-radius: 12px;
  padding: ${props => props.$sidebarStyle === 'floating' ? '16px' : '0'};
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  display: flex;
  overflow: hidden;
`;

const PreviewSidebar = styled.div`
  width: 80px;
  background: ${props => props.theme.sidebar};
  border-radius: ${props => props.$sidebarStyle === 'traditional' ? '12px 0 0 12px' : '8px'};
  padding: 16px 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
`;

const PreviewMain = styled.div`
  flex: 1;
  background: ${props => props.theme.chat};
  border-radius: ${props => props.$sidebarStyle === 'traditional' ? '0 12px 12px 0' : '8px'};
  padding: 16px;
  margin-left: ${props => props.$sidebarStyle === 'floating' ? '8px' : '0'};
  display: flex;
  flex-direction: column;
`;

const PreviewSidebarItem = styled.div`
  width: 32px;
  height: 32px;
  background: ${props => props.theme.primary}40;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${props => props.theme.text};
  font-size: 12px;
  font-weight: 500;
`;

const PreviewHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid ${props => props.theme.border};
`;

const PreviewAvatar = styled.div`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: ${props => props.theme.primary};
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
  font-size: 14px;
`;

const PreviewMessage = styled.div`
  padding: 12px 16px;
  border-radius: 16px;
  background: ${props => props.theme.messageAi};
  color: ${props => props.theme.text};
  font-size: ${props => 
    props.$fontSize === 'small' ? '0.9rem' : 
    props.$fontSize === 'large' ? '1.1rem' : '1rem'
  };
  margin-bottom: 12px;
`;

const PreviewInput = styled.div`
  padding: 12px 16px;
  border-radius: 8px;
  background: ${props => props.theme.inputBackground || props.theme.background};
  border: 1px solid ${props => props.theme.border};
  color: ${props => props.theme.text}80;
  font-size: ${props => 
    props.$fontSize === 'small' ? '0.9rem' : 
    props.$fontSize === 'large' ? '1.1rem' : '1rem'
  };
`;

const OnboardingFlow = ({ onComplete, initialStep = 0 }) => {
  const [currentStep, setCurrentStep] = useState(initialStep);
  const [selections, setSelections] = useState({
    theme: 'light',
    fontSize: 'medium',
    sidebarStyle: 'floating'
  });

  const steps = [
    {
      title: 'Choose Your Theme',
      description: 'Select a theme that matches your style',
      options: [
        { id: 'light', label: 'Light', className: 'light-theme' },
        { id: 'dark', label: 'Dark', className: 'dark-theme' },
        { id: 'oled', label: 'OLED', className: 'oled-theme' },
        { id: 'ocean', label: 'Ocean', className: 'ocean-theme' },
        { id: 'forest', label: 'Forest', className: 'forest-theme' },
        { id: 'pride', label: 'Pride', className: 'pride-theme' },
        { id: 'trans', label: 'Trans', className: 'trans-theme' },
        { id: 'bisexual', label: 'Bisexual', className: 'bisexual-theme' },
        { id: 'galaxy', label: 'Galaxy', className: 'galaxy-theme' },
        { id: 'sunset', label: 'Sunset', className: 'sunset-theme' },
        { id: 'cyberpunk', label: 'Cyberpunk', className: 'cyberpunk-theme' },
        { id: 'bubblegum', label: 'Bubblegum', className: 'bubblegum-theme' },
        { id: 'desert', label: 'Desert', className: 'desert-theme' },
        { id: 'lakeside', label: 'Lakeside', className: 'lakeside-theme' },
        { id: 'retro', label: 'Retro', className: 'retro-theme' }
      ],
      selectionKey: 'theme'
    },
    {
      title: 'Text Size',
      description: 'Choose the text size that\'s comfortable for you',
      options: [
        { id: 'small', label: 'Small', preview: true },
        { id: 'medium', label: 'Medium', preview: true },
        { id: 'large', label: 'Large', preview: true }
      ],
      selectionKey: 'fontSize'
    },
    {
      title: 'Sidebar Style',
      description: 'Choose how you want the sidebar to appear',
      options: [
        { id: 'floating', label: 'Floating', indicator: true },
        { id: 'traditional', label: 'Connected', indicator: true }
      ],
      selectionKey: 'sidebarStyle'
    }
  ];

  const currentTheme = getTheme(selections.theme);

  const handleOptionSelect = (optionId) => {
    setSelections(prev => ({
      ...prev,
      [steps[currentStep].selectionKey]: optionId
    }));
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete(selections);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    onComplete(selections);
  };

  return (
    <OnboardingOverlay theme={currentTheme}>
      <OnboardingContainer theme={currentTheme}>
        <LeftPanel theme={currentTheme}>
          {currentStep === 0 && (
            <>
              <WelcomeTitle theme={currentTheme}>Welcome to Sculptor!</WelcomeTitle>
            </>
          )}
          
          <StepIndicator>
            {steps.map((_, index) => (
              <StepDot 
                key={index} 
                $active={index <= currentStep}
                theme={currentTheme}
              />
            ))}
          </StepIndicator>
          
          <StepContent>
            <StepTitle theme={currentTheme}>
              {steps[currentStep].title}
            </StepTitle>
            <StepDescription theme={currentTheme}>
              {steps[currentStep].description}
            </StepDescription>
            
            <OptionGrid className={currentStep === 0 ? 'theme-grid' : ''}>
              {steps[currentStep].options.map((option) => (
                <OptionCard
                  key={option.id}
                  className={`theme-option ${option.className || ''} ${currentStep === 0 ? 'small' : ''}`}
                  $selected={selections[steps[currentStep].selectionKey] === option.id}
                  onClick={() => handleOptionSelect(option.id)}
                  theme={currentTheme}
                >
                  {option.preview ? (
                    <FontSizeLabel className={option.id}>
                      {option.label}
                    </FontSizeLabel>
                  ) : option.indicator ? (
                    <SidebarIndicator>
                      <span>{option.label}</span>
                      <IndicatorSquare 
                        className={option.id}
                        theme={currentTheme}
                      />
                    </SidebarIndicator>
                  ) : (
                    option.label
                  )}
                  {option.description && (
                    <div style={{ fontSize: '0.85rem', marginTop: '4px', opacity: 0.8 }}>
                      {option.description}
                    </div>
                  )}
                </OptionCard>
              ))}
            </OptionGrid>
          </StepContent>
          
          <NavigationButtons>
            <NavButton 
              className="secondary" 
              onClick={handleSkip}
              theme={currentTheme}
            >
              Skip
            </NavButton>
            <div>
              {currentStep > 0 && (
                <NavButton 
                  className="secondary" 
                  onClick={handleBack}
                  theme={currentTheme}
                  style={{ marginRight: '12px' }}
                >
                  Back
                </NavButton>
              )}
              <NavButton 
                className="primary" 
                onClick={handleNext}
                theme={currentTheme}
              >
                {currentStep === steps.length - 1 ? 'Finish' : 'Next'}
              </NavButton>
            </div>
          </NavigationButtons>
        </LeftPanel>
        
        <RightPanel theme={currentTheme}>
          <PreviewContainer theme={currentTheme} $sidebarStyle={selections.sidebarStyle}>
            <PreviewSidebar theme={currentTheme} $sidebarStyle={selections.sidebarStyle}>
              <PreviewSidebarItem theme={currentTheme}>💬</PreviewSidebarItem>
              <PreviewSidebarItem theme={currentTheme}>⚙️</PreviewSidebarItem>
              <PreviewSidebarItem theme={currentTheme}>📁</PreviewSidebarItem>
            </PreviewSidebar>
            
            <PreviewMain theme={currentTheme} $sidebarStyle={selections.sidebarStyle}>
              <PreviewHeader theme={currentTheme}>
                <PreviewAvatar theme={currentTheme}>AI</PreviewAvatar>
                <div>
                  <div style={{ fontWeight: '500', fontSize: '0.9rem' }}>AI Assistant</div>
                  <div style={{ fontSize: '0.75rem', opacity: 0.7 }}>Online</div>
                </div>
              </PreviewHeader>
              
              <PreviewMessage 
                theme={currentTheme}
                $fontSize={selections.fontSize}
              >
                Hi! Welcome to SculptorAI!
              </PreviewMessage>
              
              <PreviewInput 
                theme={currentTheme}
                $fontSize={selections.fontSize}
              >
                Type your message here...
              </PreviewInput>
            </PreviewMain>
          </PreviewContainer>
        </RightPanel>
      </OnboardingContainer>
    </OnboardingOverlay>
  );
};

export default OnboardingFlow;