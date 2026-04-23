import React, { useState, useMemo } from 'react';
import styled from 'styled-components';
import { getTheme } from '../styles/themes';
import { buildCustomTheme, hydrateFromPreset } from '../styles/customTheme';

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
  height: auto;
  min-height: 60vh;
  max-height: 90vh;
  display: flex;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
  overflow: hidden;
  
  @media (max-width: 900px) {
    width: 95%;
    height: 90vh;
    border-radius: 16px;
    flex-direction: column;
    overflow-y: auto;
  }
`;

const LeftPanel = styled.div`
  flex: 1;
  padding: 40px;
  background: ${props => props.theme.sidebar};
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: center;
  overflow-y: auto;
  
  /* Scrollbar styling */
  &::-webkit-scrollbar {
    width: 8px;
  }
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  &::-webkit-scrollbar-thumb {
    background: ${props => props.theme.border};
    border-radius: 4px;
  }

  @media (max-width: 900px) {
    flex: 1;
    padding: 20px;
    min-height: auto;
    width: 100%;
    overflow-y: visible; /* Let container handle scroll on mobile if needed, or keep auto */
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
  
  @media (max-width: 900px) {
    padding: 20px;
    min-height: 300px;
    display: none; /* Hide preview on smaller screens to save space or make it toggleable? 
                     User said "fits smaller screens like laptops", so maybe just stacking is enough.
                     Let's keep it visible but allow stacking. */
    display: flex;
    flex: 0 0 300px; /* Fixed height for preview on mobile */
  }
`;

const WelcomeTitle = styled.h1`
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 10px;
  margin-top: 10px;
  text-align: center;
  color: ${props => props.theme.text};
  
  @media (max-width: 900px) {
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
  
  @media (max-width: 900px) {
    grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
    gap: 12px;
    max-width: 100%;
  }
  
  &.theme-grid {
    grid-template-columns: repeat(4, 1fr);
    gap: 12px;
    max-width: 400px;
    
    @media (max-width: 900px) {
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
    flex-direction: column;
    align-items: center;
    justify-content: center;
    font-weight: 500;
    color: ${props => props.theme.text};
    gap: 8px;
    
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
    background-image: linear-gradient(180deg, rgba(3, 10, 26, 0.25) 0%, rgba(3, 10, 26, 0.55) 100%), url('/images/themes/ocean.jpg');
    background-size: cover;
    background-position: center;
    color: #eaf4ff;
    border-color: ${props => props.$selected ? '#38bdf8' : 'transparent'};
    text-shadow: 0 1px 3px rgba(0, 0, 0, 0.55);
  }

  &.forest-theme {
    background-image: linear-gradient(180deg, rgba(8, 16, 12, 0.25) 0%, rgba(6, 12, 8, 0.60) 100%), url('/images/themes/forest.jpg');
    background-size: cover;
    background-position: center;
    color: #f0f4e8;
    border-color: ${props => props.$selected ? '#9ccc65' : 'transparent'};
    text-shadow: 0 1px 3px rgba(0, 0, 0, 0.55);
  }

  &.pride-theme {
    background: ${props =>
      props.$selected
        ? 'linear-gradient(135deg, #e40303 0%, #ff8c00 20%, #ffed00 40%, #008026 60%, #004dff 80%, #750787 100%)'
        : 'radial-gradient(circle at 78% 20%, rgba(228, 3, 3, 0.5) 0%, transparent 55%), radial-gradient(circle at 80% 50%, rgba(255, 140, 0, 0.45) 0%, transparent 55%), radial-gradient(circle at 30% 75%, rgba(0, 128, 38, 0.4) 0%, transparent 55%), radial-gradient(circle at 15% 40%, rgba(0, 77, 255, 0.45) 0%, transparent 55%), radial-gradient(circle at 8% 15%, rgba(117, 7, 135, 0.4) 0%, transparent 55%), linear-gradient(160deg, #17171f 0%, #1a1320 100%)'};
    color: #ffffff;
    border-color: ${props => props.$selected ? '#ffffff' : 'transparent'};
  }

  &.trans-theme {
    background: ${props =>
      props.$selected
        ? 'linear-gradient(135deg, #5BCEFA 0%, #F5A9B8 50%, #ffffff 100%)'
        : 'radial-gradient(circle at 20% 20%, rgba(91, 206, 250, 0.55) 0%, transparent 60%), radial-gradient(circle at 80% 30%, rgba(245, 169, 184, 0.55) 0%, transparent 60%), radial-gradient(circle at 50% 90%, rgba(91, 206, 250, 0.4) 0%, transparent 60%), linear-gradient(160deg, #fbfdff 0%, #fff5f7 100%)'};
    color: ${props => props.$selected ? '#2a2430' : '#2a2430'};
    border-color: ${props => props.$selected ? '#3ea8d4' : 'transparent'};
  }

  &.bisexual-theme {
    background: ${props =>
      props.$selected
        ? 'linear-gradient(135deg, #D60270 0%, #9B4F96 50%, #0038A8 100%)'
        : 'radial-gradient(circle at 15% 15%, rgba(214, 2, 112, 0.5) 0%, transparent 60%), radial-gradient(circle at 85% 85%, rgba(0, 56, 168, 0.55) 0%, transparent 60%), radial-gradient(circle at 55% 50%, rgba(155, 79, 150, 0.4) 0%, transparent 65%), linear-gradient(160deg, #120820 0%, #170b28 100%)'};
    color: #ffffff;
    border-color: ${props => props.$selected ? '#D60270' : 'transparent'};
  }

  &.sunset-theme {
    background-image: linear-gradient(180deg, rgba(44, 18, 42, 0.20) 0%, rgba(18, 8, 20, 0.50) 100%), url('/images/themes/sunset.jpg');
    background-size: cover;
    background-position: center;
    color: #fff1e4;
    border-color: ${props => props.$selected ? '#ff7a59' : 'transparent'};
    text-shadow: 0 1px 3px rgba(0, 0, 0, 0.55);
  }

  &.sunrise-theme {
    background-image: linear-gradient(180deg, rgba(255, 240, 220, 0.20) 0%, rgba(200, 158, 120, 0.25) 100%), url('/images/themes/sunrise.jpg');
    background-size: cover;
    background-position: center;
    color: #2d1f14;
    border-color: ${props => props.$selected ? '#d48940' : 'transparent'};
    text-shadow: 0 1px 2px rgba(255, 255, 255, 0.55);
  }

  &.lakeside-theme {
    background: ${props =>
      props.$selected
        ? 'linear-gradient(135deg, #c84860 0%, #7a2a36 100%)'
        : 'linear-gradient(135deg, #1a0a10 0%, #4a1620 100%)'};
    color: ${props => props.$selected ? '#fff4e2' : '#f7ead6'};
    border-color: ${props => props.$selected ? '#e8c48a' : 'transparent'};
  }

  &.retro-theme {
    background: ${props => props.$selected ? '#000080' : '#C0C0C0'};
    color: ${props => props.$selected ? '#ffffff' : '#000000'};
    border-color: ${props => props.$selected ? '#000080' : '#808080'};
    border-style: ${props => props.$selected ? 'solid' : 'inset'};
    border-width: 2px;
  }

  &.custom-theme {
    border-style: dashed;
    border-color: ${props => props.$selected ? props.theme.primary : props.theme.border};
  }
`;

const ThemeOptionContent = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  text-align: center;
`;

const OptionIcon = styled.div`
  width: 36px;
  height: 36px;
  aspect-ratio: 1;
  border-radius: 12px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  background: ${props => props.$tone || props.theme.background};
  color: ${props => props.theme.text};
  border: 1px solid ${props => props.theme.border};
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.12);
  flex-shrink: 0;
`;

const ColorInputs = styled.div`
  margin-top: 12px;
  width: 100%;
  max-width: 520px;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
`;

const ColorInputRow = styled.label`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px;
  border-radius: 10px;
  border: 1px solid ${props => props.theme.border};
  background: ${props => props.theme.background};
`;

const ColorInputLabel = styled.span`
  font-weight: 600;
  color: ${props => props.theme.text};
`;

const ColorInputField = styled.input`
  width: 64px;
  height: 36px;
  padding: 0;
  border-radius: 8px;
  border: 1px solid ${props => props.theme.border};
  background: transparent;
  cursor: pointer;
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
    sidebarStyle: 'traditional'
  });
  const [customColors, setCustomColors] = useState({
    background: '#0f172a',
    text: '#e2e8f0',
    border: '#4f46e5'
  });

  const steps = [
    {
      title: 'Choose Your Theme',
      description: 'Select a theme that matches your style',
      options: [
        { id: 'light', label: 'Light', className: 'light-theme', icon: '☀️' },
        { id: 'dark', label: 'Dark', className: 'dark-theme', icon: '🌙' },
        { id: 'oled', label: 'OLED', className: 'oled-theme', icon: '🖥️' },
        { id: 'ocean', label: 'Ocean', className: 'ocean-theme', icon: '🌊' },
        { id: 'forest', label: 'Forest', className: 'forest-theme', icon: '🌲' },
        { id: 'sunset', label: 'Sunset', className: 'sunset-theme', icon: '🌇' },
        { id: 'sunrise', label: 'Sunrise', className: 'sunrise-theme', icon: '🌅' },
        { id: 'pride', label: 'Pride', className: 'pride-theme', icon: '🏳️‍🌈' },
        { id: 'trans', label: 'Trans', className: 'trans-theme', icon: '🏳️‍⚧️' },
        { id: 'bisexual', label: 'Bisexual', className: 'bisexual-theme', icon: '💜' },
        { id: 'lakeside', label: 'Lakeside', className: 'lakeside-theme', icon: '🌺' },
        { id: 'retro', label: 'Retro', className: 'retro-theme', icon: '💾' },
        { id: 'custom', label: 'Custom', className: 'custom-theme', icon: '🎛️'}
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

  // The onboarding only exposes three quick-pick colours ("background",
  // "text", "border"), but the rest of the app expects a fully-hydrated
  // authoring state. Merge the three picks on top of the Light preset so
  // saving this seed produces a valid full custom theme that the user can
  // keep iterating on from Settings ▸ Custom Theme Studio.
  const customThemeDraft = useMemo(() => ({
    ...hydrateFromPreset('light'),
    background: customColors.background,
    sidebar: customColors.background,
    chat: customColors.background,
    text: customColors.text,
    border: customColors.border,
    primary: customColors.border,
    accentColor: customColors.border,
  }), [customColors]);

  const customTheme = useMemo(() => {
    if (selections.theme !== 'custom') return null;
    return buildCustomTheme(customThemeDraft);
  }, [selections.theme, customThemeDraft]);

  const currentTheme = useMemo(() => {
    if (customTheme) return customTheme;
    return getTheme(selections.theme);
  }, [customTheme, selections.theme]);

  const isThemeStep = steps[currentStep].selectionKey === 'theme';

  const payloadWithCustomTheme = () => {
    if (selections.theme !== 'custom') return selections;
    return { ...selections, customTheme: customThemeDraft };
  };

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
      onComplete(payloadWithCustomTheme());
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    onComplete(payloadWithCustomTheme());
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
                  className={`${isThemeStep ? 'theme-option' : ''} ${option.className || ''} ${isThemeStep ? 'small' : ''}`}
                  $selected={selections[steps[currentStep].selectionKey] === option.id}
                  onClick={() => handleOptionSelect(option.id)}
                  theme={currentTheme}
                >
                  {isThemeStep ? (
                    <ThemeOptionContent>
                      <OptionIcon
                        className="option-icon"
                        $tone={option.id === 'custom' ? `${customColors.border}20` : undefined}
                        theme={currentTheme}
                      >
                        {option.icon || '🎨'}
                      </OptionIcon>
                      <div>{option.label}</div>
                    </ThemeOptionContent>
                  ) : option.preview ? (
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

            {isThemeStep && selections.theme === 'custom' && (
              <ColorInputs theme={currentTheme}>
                <ColorInputRow theme={currentTheme}>
                  <ColorInputLabel theme={currentTheme}>Background</ColorInputLabel>
                  <ColorInputField
                    type="color"
                    value={customColors.background}
                    onChange={(e) => setCustomColors(prev => ({ ...prev, background: e.target.value }))}
                    title="Pick background color"
                  />
                </ColorInputRow>
                <ColorInputRow theme={currentTheme}>
                  <ColorInputLabel theme={currentTheme}>Text</ColorInputLabel>
                  <ColorInputField
                    type="color"
                    value={customColors.text}
                    onChange={(e) => setCustomColors(prev => ({ ...prev, text: e.target.value }))}
                    title="Pick text color"
                  />
                </ColorInputRow>
                <ColorInputRow theme={currentTheme}>
                  <ColorInputLabel theme={currentTheme}>Border</ColorInputLabel>
                  <ColorInputField
                    type="color"
                    value={customColors.border}
                    onChange={(e) => setCustomColors(prev => ({ ...prev, border: e.target.value }))}
                    title="Pick border color"
                  />
                </ColorInputRow>
              </ColorInputs>
            )}
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
