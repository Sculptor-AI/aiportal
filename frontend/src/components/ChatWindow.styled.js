import styled, { keyframes, css } from 'styled-components';

export const ChatWindowContainer = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  margin-left: ${props => props.$sidebarCollapsed ? '0' : '300px'}; /* 280px sidebar + 20px margin */
  transition: margin-left 0.3s cubic-bezier(0.25, 1, 0.5, 1);
  font-size: ${props => {
    switch (props.fontSize) {
      case 'small': return '0.9rem';
      case 'large': return '1.1rem';
      default: return '1rem';
    }
  }};
  position: relative;
  z-index: 5; // Added z-index to be above MainGreeting
  /* Use visible overflow so dropdown menus (e.g., model selector) aren't clipped */
  overflow: visible;
  
  @media (max-width: 768px) {
    margin-left: 0; /* No margin on mobile - sidebar overlays */
  }
`;

export const ChatHeader = styled.div`
  padding: 5px 20px 15px ${props => props.$sidebarCollapsed ? '45px' : '20px'}; // Adjust left padding based on sidebar state
  display: flex;
  align-items: flex-start; // Change from center to flex-start for better alignment
  justify-content: flex-start;
  backdrop-filter: blur(5px);
  -webkit-backdrop-filter: blur(5px);
  z-index: 101; // Changed from 10 to 101
  position: relative;
  transition: padding-left 0.3s cubic-bezier(0.25, 1, 0.5, 1),
              opacity 0.3s ease,
              filter 0.3s ease;
  opacity: ${props => props.$focusModeActive ? 0.12 : 1};
  filter: ${props => props.$focusModeActive ? 'blur(6px)' : 'none'};
  pointer-events: ${props => props.$focusModeActive ? 'none' : 'auto'};
`;

export const ChatTitleSection = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  gap: 4px; // Use gap instead of margin for more consistent spacing
  padding-left: ${props => props.$sidebarCollapsed ? '20px' : '0px'}; // Reset padding when sidebar is open
  transition: padding-left 0.3s cubic-bezier(0.25, 1, 0.5, 1);
`;

export const ModelSelectorsRow = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
`;

export const ChatTitle = styled.h2`
  font-size: 1.2rem;
  font-weight: 500;
  margin: 0;
  color: ${props => props.theme.name === 'retro' ? '#FFFFFF' : props.theme.text};
  flex: 1;
  line-height: 1.4; // Improve line height for better visual balance
`;

export const ModelSelectorWrapper = styled.div`
  // Remove the margin-top and use the parent's gap instead
  max-width: 240px;
  z-index: 10;
  
  @media (max-width: 768px) {
    max-width: 100%;
  }
`;

export const MessageList = styled.div`
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 20px 0;
  padding-bottom: ${props => props.theme.name === 'retro' ? '140px' : '115px'}; /* Add extra padding for retro theme */
  display: flex;
  flex-direction: column;
  width: 100%;
  position: relative;
  background: ${props => {
    if (props.theme.name === 'dark' || props.theme.name === 'oled') {
      return 'transparent';
    }
    return props.theme.name === 'retro' ? 'transparent' : 'rgba(255, 255, 255, 0.05)';
  }};
  
  /* Stylish scrollbar */
  &::-webkit-scrollbar {
    width: ${props => props.theme.name === 'retro' ? '16px' : '5px'};
  }
  
  &::-webkit-scrollbar-track {
    background: ${props => props.theme.name === 'retro' ? props.theme.buttonFace : 'transparent'};
    border: ${props => props.theme.name === 'retro' ? `1px solid ${props.theme.border}` : 'none'};
  }
  
  &::-webkit-scrollbar-thumb {
    background: ${props => props.theme.name === 'retro' ? props.theme.buttonFace : props.theme.border};
    border-radius: ${props => props.theme.name === 'retro' ? '0' : '10px'};
    border: ${props => props.theme.name === 'retro' ?
    `1px solid ${props.theme.buttonHighlightLight} ${props.theme.buttonShadowDark} ${props.theme.buttonShadowDark} ${props.theme.buttonHighlightLight}` :
    'none'};
    box-shadow: ${props => props.theme.name === 'retro' ?
    `1px 1px 0 0 ${props.theme.buttonHighlightSoft} inset, -1px -1px 0 0 ${props.theme.buttonShadowSoft} inset` :
    'none'};
  }
  
  opacity: ${props => props.$focusModeActive ? 0.1 : 1};
  filter: ${props => props.$focusModeActive ? 'blur(6px)' : 'none'};
  pointer-events: ${props => props.$focusModeActive ? 'none' : 'auto'};
  transition: opacity 0.3s ease, filter 0.3s ease;
`;

export const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

export const moveInputToBottom = keyframes`
  0% {
    top: 50%;
    transform: translate(-50%, -50%) scale(1);
    bottom: auto;
  }
  20% {
    transform: translate(-50%, -20%) scale(0.95, 1.05);
  }
  50% {
    top: auto;
    bottom: 35px; /* Overshoot slightly */
    transform: translateX(-50%) scale(1.05, 0.95);
  }
  75% {
    top: auto;
    bottom: 28px;
    transform: translateX(-50%) scale(0.98, 1.02);
  }
  100% {
    top: auto;
    bottom: 30px;
    transform: translateX(-50%) scale(1);
  }
`;

export const moveInputToBottomMobile = keyframes`
  0% {
    top: 50%;
    transform: translate(-50%, -50%);
    bottom: auto;
  }
  100% {
    top: auto;
    bottom: 20px;
    transform: translateX(-50%);
  }
`;

const liquidToPlus = keyframes`
  0% {
    opacity: 0.5;
    transform: translate(-50%, -50%) translateX(100px) scale(1);
  }
  50% {
    opacity: 0.7;
    transform: translate(-50%, -50%) translateX(30px) scale(0.6);
  }
  100% {
    opacity: 0;
    transform: translate(-50%, -50%) translateX(0) scale(0.2);
  }
`;

const liquidFromPlus = keyframes`
  0% {
    opacity: 0;
    transform: translate(-50%, -50%) translateX(0) scale(0.2);
  }
  50% {
    opacity: 0.7;
    transform: translate(-50%, -50%) translateX(30px) scale(0.6);
  }
  100% {
    opacity: 0;
    transform: translate(-50%, -50%) translateX(100px) scale(1);
  }
`;

export const emptyStateExitAnimation = keyframes`
  from {
    opacity: 1;
    transform: translate(-50%, -50%);
  }
  to {
    opacity: 0;
    transform: translate(-50%, -55%); /* Fade and move slightly up */
  }
`;

export const InputContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  position: fixed !important;
  width: 100% !important;
  max-width: ${props => props.theme.name === 'retro' ? '750px' : '700px'} !important;
  padding: 0 !important;
  z-index: 100 !important;
  pointer-events: ${props => props.$isWhiteboardOpen || props.$isEquationEditorOpen || props.$isGraphingOpen || props.$isFlowchartOpen || props.$isSandbox3DOpen ? 'auto' : 'none'};
  flex-direction: column;
  --composer-plus-size: 44px;
  --composer-plus-gap: 12px;
  --composer-plus-offset: calc(var(--composer-plus-size) + var(--composer-plus-gap));
  /* margin-left will be handled by the left property based on $sidebarCollapsed */
  transition: all 0.3s cubic-bezier(0.25, 1, 0.5, 1) !important;

  @media (max-width: 768px) {
    --composer-plus-size: 42px;
    --composer-plus-gap: 10px;
  }

  ${({ $isEmpty, $animateDown, theme, $sidebarCollapsed, $isWhiteboardOpen, $isEquationEditorOpen, $isGraphingOpen, $isFlowchartOpen, $isSandbox3DOpen }) => {
    const bottomPosition = theme.name === 'retro' ? '40px' : '30px';
    const mobileBottomPosition = theme.name === 'retro' ? '30px' : '20px';

    const centerPosition = $sidebarCollapsed
      ? `calc(50%)`
      : `calc(50% + 160px)`; // Increased from 140px to 160px to account for sidebar's 20px left margin // 140px is half of sidebar width 280px

    if ($animateDown) {
      return css`
        top: 50%;
        transform: translate(-50%, -50%);
        bottom: auto;
        left: ${centerPosition} !important;

        animation-name: ${moveInputToBottom};
        animation-duration: 0.6s;
        animation-timing-function: cubic-bezier(0.34, 1.56, 0.64, 1);
        animation-fill-mode: forwards;

        @media (max-width: 768px) {
          animation-name: ${moveInputToBottomMobile};
          left: 50% !important; /* On mobile, always center in viewport - CURRENT MOBILE STYLE */
        }
      `;
    } else if ($isEmpty) { // Centered, no animation
      return css`
        top: 50% !important;
        transform: translate(-50%, -50%) !important;
        bottom: auto !important;
        left: ${centerPosition} !important;
        
        @media (max-width: 768px) {
          left: 50% !important; /* On mobile, always center in viewport - CURRENT MOBILE STYLE */
        }
      `;
    } else { // At bottom, no animation ($isEmpty is false, $animateDown is false)
      return css`
        top: auto !important;
        bottom: ${bottomPosition} !important;
        transform: translateX(-50%) !important;
        left: ${centerPosition} !important;
        
        @media (max-width: 768px) {
          bottom: ${mobileBottomPosition} !important;
          left: 50% !important; /* On mobile, always center in viewport - CURRENT MOBILE STYLE */
        }
      `;
    }
  }}
`;

export const InputGreeting = styled.div`
  width: 100%;
  text-align: center;
  font-size: 2rem;
  font-weight: 400;
  color: ${props => props.theme.text};
  margin: 0 0 20px;
  pointer-events: none;
  letter-spacing: -0.02em;
  transition: opacity 0.3s ease, transform 0.3s ease;
  
  @media (max-width: 768px) {
    font-size: 1.75rem;
    margin: 0 0 16px;
  }
`;

export const MessageInputWrapper = styled.div.attrs({ 'data-shadow': 'message-bar' })`
  position: relative;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
  min-width: 0;
  pointer-events: auto;
  box-shadow: ${props => props.theme.name === 'retro' ?
    `inset 1px 1px 0px ${props.theme.buttonHighlightLight}, inset -1px -1px 0px ${props.theme.buttonShadowDark}` :
    '0 2px 12px rgba(0, 0, 0, 0.04)'};
  border-radius: ${props => props.theme.name === 'retro' ? '0' : '24px'};
  background: ${props => {
    if (props.theme.name === 'retro') return props.theme.inputBackground;
    if (props.theme.name === 'light') return 'rgba(255, 255, 255, 0.95)';
    if (props.theme.name === 'dark' || props.theme.name === 'oled') return props.theme.inputBackground;
    return props.theme.inputBackground;
  }};
  border: ${props => props.theme.name === 'retro' ?
    `2px solid ${props.theme.buttonFace}` :
    `1px solid ${props.theme.border}`};
  padding-bottom: 0;
  transition: box-shadow 0.3s ease, border-color 0.3s ease;
  overflow: visible;

  &:focus-within {
    box-shadow: ${props => props.theme.name === 'retro' ?
    `inset 1px 1px 0px ${props.theme.buttonHighlightLight}, inset -1px -1px 0px ${props.theme.buttonShadowDark}` :
    '0 4px 20px rgba(0, 0, 0, 0.08)'};
  }
`;

export const ChipsDock = styled.div`
  width: 100%;
  pointer-events: ${props => props.$visible ? 'auto' : 'none'};
  max-height: ${props => props.$visible ? '60px' : '0'};
  opacity: ${props => props.$visible ? '1' : '0'};
  padding-left: ${props => props.$indent ? 'var(--composer-plus-offset)' : '0'};
  padding-bottom: ${props => props.$visible ? '10px' : '0'};
  transform: ${props => props.$visible ? 'translateY(0)' : 'translateY(10px)'};
  transition: max-height 0.3s cubic-bezier(0.4, 0, 0.2, 1),
              opacity 0.25s cubic-bezier(0.4, 0, 0.2, 1),
              padding-left 0.3s cubic-bezier(0.4, 0, 0.2, 1),
              padding-bottom 0.25s cubic-bezier(0.4, 0, 0.2, 1),
              transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
`;

export const ComposerRow = styled.div`
  width: 100%;
  display: flex;
  flex-direction: row;
  gap: var(--composer-plus-gap);
  align-items: flex-end;
  pointer-events: auto;
`;

export const LiquidBlob = styled.span`
  position: absolute;
  top: 50%;
  left: 50%;
  width: 40px;
  height: 40px;
  background: ${props => props.theme.buttonGradient || 'rgba(100, 100, 200, 0.3)'};
  opacity: 0;
  border-radius: 50%;
  pointer-events: none;
  filter: blur(8px);
  z-index: -1;

  ${({ $direction }) => $direction === 'toPlus' && css`
    animation: ${liquidToPlus} 350ms cubic-bezier(0.4, 0, 0.2, 1) forwards;
  `}

  ${({ $direction }) => $direction === 'fromPlus' && css`
    animation: ${liquidFromPlus} 350ms cubic-bezier(0.4, 0, 0.2, 1) forwards;
  `}
`;

export const ComposerPlusButton = styled.button`
  width: 50px;
  height: 50px;
  flex-shrink: 0;
  border-radius: ${props => props.theme.name === 'retro' ? '0' : '24px'};
  border: ${props => props.theme.name === 'retro' ?
    `2px solid ${props.theme.buttonFace}` :
    `1px solid ${props.theme.border}`};
  background: ${props => {
    if (props.theme.name === 'retro') return props.theme.inputBackground;
    if (props.theme.name === 'light') return 'rgba(255, 255, 255, 0.95)';
    if (props.theme.name === 'dark' || props.theme.name === 'oled') return props.theme.inputBackground;
    return props.theme.inputBackground;
  }};
  color: ${props => props.theme.text};
  box-shadow: ${props => props.theme.name === 'retro' ?
    `inset 1px 1px 0px ${props.theme.buttonHighlightLight}, inset -1px -1px 0px ${props.theme.buttonShadowDark}` :
    '0 2px 12px rgba(0, 0, 0, 0.04)'};
  position: relative;
  isolation: isolate;
  display: ${props => props.$visible ? 'flex' : 'none'};
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1),
              background-color 0.2s ease,
              border-color 0.2s ease,
              box-shadow 0.2s ease;

  &:hover {
    box-shadow: ${props => props.theme.name === 'retro' ?
      `inset 1px 1px 0px ${props.theme.buttonHighlightLight}, inset -1px -1px 0px ${props.theme.buttonShadowDark}` :
      '0 4px 20px rgba(0, 0, 0, 0.08)'};
  }

  &:active:not(:disabled) {
    transform: scale(0.97);
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.35;
  }

  /* Plus icon container */
  .plus-icon {
    position: relative;
    width: 20px;
    height: 20px;
    z-index: 2;
    transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  /* Horizontal bar */
  .plus-icon::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 20px;
    height: 2px;
    border-radius: 1px;
    background: ${props => props.theme.text};
    opacity: 0.6;
    transform: translate(-50%, -50%);
  }

  /* Vertical bar */
  .plus-icon::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 2px;
    height: 20px;
    border-radius: 1px;
    background: ${props => props.theme.text};
    opacity: 0.6;
    transform: translate(-50%, -50%);
  }

  ${({ $expanded }) => $expanded && css`
    .plus-icon {
      transform: rotate(45deg);
    }
  `}
`;

export const FilesPreviewContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: ${props => props.$show ? '12px 16px 8px 16px' : '0 16px'};
  max-height: ${props => props.$show ? '120px' : '0'};
  opacity: ${props => props.$show ? '1' : '0'};
  width: 100%;
  box-sizing: border-box;
  border-bottom: ${props => props.$show ? `1px solid ${props.theme.border}` : 'none'};
  background: ${props => props.theme.background};
  border-radius: ${props => props.theme.name === 'retro' ? '0' : '24px 24px 0 0'};
  overflow: hidden;
  transition: max-height 0.3s cubic-bezier(0.4, 0, 0.2, 1),
              opacity 0.25s cubic-bezier(0.4, 0, 0.2, 1),
              padding 0.3s cubic-bezier(0.4, 0, 0.2, 1);
`;

export const FilePreviewChip = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  background: ${props => props.theme.inputBackground};
  border: 1px solid ${props => props.theme.border};
  border-radius: ${props => props.theme.name === 'retro' ? '0' : '12px'};
  font-size: 12px;
  color: ${props => props.theme.text};
  position: relative;
  max-width: 180px;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);

  &:hover {
    background: ${props => props.theme.name === 'retro' ? props.theme.inputBackground : 'rgba(0, 0, 0, 0.03)'};
    border-color: ${props => props.theme.name === 'retro' ? props.theme.border : 'rgba(0, 0, 0, 0.12)'};
  }
`;

export const FilePreviewIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: ${props => props.$hasPreview ? '40px' : '24px'};
  height: ${props => props.$hasPreview ? '40px' : '24px'};
  flex-shrink: 0;
  border-radius: ${props => props.theme.name === 'retro' ? '0' : '6px'};
  overflow: hidden;
  background: ${props => props.$hasPreview ? 'rgba(0, 0, 0, 0.05)' : 'transparent'};

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: ${props => props.theme.name === 'retro' ? '0' : '6px'};
  }

  svg {
    width: ${props => props.$hasPreview ? '24px' : '18px'};
    height: ${props => props.$hasPreview ? '24px' : '18px'};
    flex-shrink: 0;
  }
`;

export const FileTypeIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  background: ${props => {
    const colors = {
      // Documents
      pdf: 'linear-gradient(135deg, #FF6B6B 0%, #EE5A5A 100%)',
      doc: 'linear-gradient(135deg, #4A90D9 0%, #3A7BC8 100%)',
      docx: 'linear-gradient(135deg, #4A90D9 0%, #3A7BC8 100%)',
      txt: 'linear-gradient(135deg, #6B7280 0%, #4B5563 100%)',
      // Spreadsheets
      xls: 'linear-gradient(135deg, #22C55E 0%, #16A34A 100%)',
      xlsx: 'linear-gradient(135deg, #22C55E 0%, #16A34A 100%)',
      csv: 'linear-gradient(135deg, #22C55E 0%, #16A34A 100%)',
      // Presentations
      ppt: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)',
      pptx: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)',
      // Archives
      zip: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)',
      rar: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)',
      '7z': 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)',
      tar: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)',
      gz: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)',
      // JavaScript/TypeScript
      js: 'linear-gradient(135deg, #F7DF1E 0%, #E5CD00 100%)',
      jsx: 'linear-gradient(135deg, #61DAFB 0%, #4FA8C7 100%)',
      ts: 'linear-gradient(135deg, #3178C6 0%, #235A97 100%)',
      tsx: 'linear-gradient(135deg, #3178C6 0%, #235A97 100%)',
      mjs: 'linear-gradient(135deg, #F7DF1E 0%, #E5CD00 100%)',
      cjs: 'linear-gradient(135deg, #F7DF1E 0%, #E5CD00 100%)',
      // Python
      py: 'linear-gradient(135deg, #3776AB 0%, #FFD43B 100%)',
      pyw: 'linear-gradient(135deg, #3776AB 0%, #FFD43B 100%)',
      pyi: 'linear-gradient(135deg, #3776AB 0%, #FFD43B 100%)',
      // Java/JVM
      java: 'linear-gradient(135deg, #ED8B00 0%, #B07219 100%)',
      kt: 'linear-gradient(135deg, #A97BFF 0%, #7F52FF 100%)',
      kts: 'linear-gradient(135deg, #A97BFF 0%, #7F52FF 100%)',
      scala: 'linear-gradient(135deg, #DC322F 0%, #B71C1C 100%)',
      // C/C++
      c: 'linear-gradient(135deg, #A8B9CC 0%, #555555 100%)',
      cpp: 'linear-gradient(135deg, #00599C 0%, #004482 100%)',
      cc: 'linear-gradient(135deg, #00599C 0%, #004482 100%)',
      cxx: 'linear-gradient(135deg, #00599C 0%, #004482 100%)',
      h: 'linear-gradient(135deg, #A8B9CC 0%, #555555 100%)',
      hpp: 'linear-gradient(135deg, #00599C 0%, #004482 100%)',
      hxx: 'linear-gradient(135deg, #00599C 0%, #004482 100%)',
      // C#
      cs: 'linear-gradient(135deg, #9B4F96 0%, #68217A 100%)',
      // Go
      go: 'linear-gradient(135deg, #00ADD8 0%, #007D9C 100%)',
      // Rust
      rs: 'linear-gradient(135deg, #DEA584 0%, #B7410E 100%)',
      // Ruby
      rb: 'linear-gradient(135deg, #CC342D 0%, #A91D1D 100%)',
      erb: 'linear-gradient(135deg, #CC342D 0%, #A91D1D 100%)',
      // PHP
      php: 'linear-gradient(135deg, #777BB4 0%, #4F5B93 100%)',
      phtml: 'linear-gradient(135deg, #777BB4 0%, #4F5B93 100%)',
      // Swift
      swift: 'linear-gradient(135deg, #F05138 0%, #C93D2C 100%)',
      // Shell
      sh: 'linear-gradient(135deg, #4EAA25 0%, #3D8B1F 100%)',
      bash: 'linear-gradient(135deg, #4EAA25 0%, #3D8B1F 100%)',
      zsh: 'linear-gradient(135deg, #4EAA25 0%, #3D8B1F 100%)',
      fish: 'linear-gradient(135deg, #4EAA25 0%, #3D8B1F 100%)',
      // PowerShell
      ps1: 'linear-gradient(135deg, #012456 0%, #001833 100%)',
      psm1: 'linear-gradient(135deg, #012456 0%, #001833 100%)',
      psd1: 'linear-gradient(135deg, #012456 0%, #001833 100%)',
      // SQL
      sql: 'linear-gradient(135deg, #E38C00 0%, #CC7A00 100%)',
      // R
      r: 'linear-gradient(135deg, #276DC3 0%, #1E5AA8 100%)',
      // Lua
      lua: 'linear-gradient(135deg, #000080 0%, #00007F 100%)',
      // Perl
      pl: 'linear-gradient(135deg, #39457E 0%, #2A3560 100%)',
      pm: 'linear-gradient(135deg, #39457E 0%, #2A3560 100%)',
      // Elixir
      ex: 'linear-gradient(135deg, #6E4A7E 0%, #4E2A5E 100%)',
      exs: 'linear-gradient(135deg, #6E4A7E 0%, #4E2A5E 100%)',
      // Erlang
      erl: 'linear-gradient(135deg, #A90533 0%, #8B042A 100%)',
      hrl: 'linear-gradient(135deg, #A90533 0%, #8B042A 100%)',
      // Haskell
      hs: 'linear-gradient(135deg, #5E5086 0%, #453A65 100%)',
      lhs: 'linear-gradient(135deg, #5E5086 0%, #453A65 100%)',
      // Clojure
      clj: 'linear-gradient(135deg, #63B132 0%, #4D8A27 100%)',
      cljs: 'linear-gradient(135deg, #63B132 0%, #4D8A27 100%)',
      cljc: 'linear-gradient(135deg, #63B132 0%, #4D8A27 100%)',
      edn: 'linear-gradient(135deg, #63B132 0%, #4D8A27 100%)',
      // OCaml
      ml: 'linear-gradient(135deg, #EC6813 0%, #C75510 100%)',
      mli: 'linear-gradient(135deg, #EC6813 0%, #C75510 100%)',
      // F#
      fs: 'linear-gradient(135deg, #378BBA 0%, #2B6D92 100%)',
      fsi: 'linear-gradient(135deg, #378BBA 0%, #2B6D92 100%)',
      fsx: 'linear-gradient(135deg, #378BBA 0%, #2B6D92 100%)',
      // Dart
      dart: 'linear-gradient(135deg, #00B4AB 0%, #009688 100%)',
      // Frontend frameworks
      vue: 'linear-gradient(135deg, #42B883 0%, #35495E 100%)',
      svelte: 'linear-gradient(135deg, #FF3E00 0%, #CC3200 100%)',
      // Web
      html: 'linear-gradient(135deg, #E34F26 0%, #C7421F 100%)',
      htm: 'linear-gradient(135deg, #E34F26 0%, #C7421F 100%)',
      xml: 'linear-gradient(135deg, #E34F26 0%, #C7421F 100%)',
      xhtml: 'linear-gradient(135deg, #E34F26 0%, #C7421F 100%)',
      css: 'linear-gradient(135deg, #1572B6 0%, #0F5A8C 100%)',
      scss: 'linear-gradient(135deg, #CC6699 0%, #A65280 100%)',
      sass: 'linear-gradient(135deg, #CC6699 0%, #A65280 100%)',
      less: 'linear-gradient(135deg, #1D365D 0%, #16294A 100%)',
      styl: 'linear-gradient(135deg, #FF6347 0%, #CC4F39 100%)',
      // Data/Config
      json: 'linear-gradient(135deg, #CBCB41 0%, #A8A835 100%)',
      yaml: 'linear-gradient(135deg, #CB171E 0%, #A81216 100%)',
      yml: 'linear-gradient(135deg, #CB171E 0%, #A81216 100%)',
      toml: 'linear-gradient(135deg, #9C4121 0%, #7D351A 100%)',
      // Documentation
      md: 'linear-gradient(135deg, #083FA1 0%, #062D73 100%)',
      markdown: 'linear-gradient(135deg, #083FA1 0%, #062D73 100%)',
      rst: 'linear-gradient(135deg, #6B7280 0%, #4B5563 100%)',
      // Config
      ini: 'linear-gradient(135deg, #6B7280 0%, #4B5563 100%)',
      cfg: 'linear-gradient(135deg, #6B7280 0%, #4B5563 100%)',
      conf: 'linear-gradient(135deg, #6B7280 0%, #4B5563 100%)',
      config: 'linear-gradient(135deg, #6B7280 0%, #4B5563 100%)',
      env: 'linear-gradient(135deg, #ECD53F 0%, #CDB835 100%)',
      // Build
      dockerfile: 'linear-gradient(135deg, #2496ED 0%, #1D7AC0 100%)',
      makefile: 'linear-gradient(135deg, #6D8086 0%, #555F64 100%)',
      cmake: 'linear-gradient(135deg, #064F8C 0%, #053D6B 100%)',
      // Default
      default: 'linear-gradient(135deg, #9CA3AF 0%, #6B7280 100%)'
    };
    return colors[props.$fileType] || colors.default;
  }};
  border-radius: ${props => props.theme.name === 'retro' ? '0' : '6px'};

  svg {
    width: 20px;
    height: 20px;
    color: white;
  }

  span {
    font-size: 9px;
    font-weight: 700;
    color: white;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
`;

export const FilePreviewName = styled.div`
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-weight: 500;
`;

export const FilePreviewRemove = styled.button`
  background: none;
  border: none;
  color: ${props => props.theme.text};
  opacity: 0.5;
  cursor: pointer;
  padding: 2px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  border-radius: ${props => props.theme.name === 'retro' ? '0' : '50%'};
  flex-shrink: 0;
  transition: opacity 0.15s cubic-bezier(0.4, 0, 0.2, 1),
              background-color 0.15s cubic-bezier(0.4, 0, 0.2, 1),
              color 0.15s cubic-bezier(0.4, 0, 0.2, 1);

  &:hover {
    opacity: 1;
    background: rgba(255, 80, 80, 0.15);
    color: #ff5050;
  }

  svg {
    width: 10px;
    height: 10px;
  }
`;

export const InputRow = styled.div`
  display: flex;
  width: 100%;
  position: relative;
  align-items: center;
  
  ${props => props.theme.name === 'retro' && `
    &::before {
      content: '';
      position: absolute;
      left: 12px;
      top: 50%;
      transform: translateY(-50%);
      width: 28px;
      height: 80%;
      background: ${props.theme.buttonFace};
      border: 1px solid;
      border-color: ${props.theme.buttonHighlightLight} ${props.theme.buttonShadowDark} ${props.theme.buttonShadowDark} ${props.theme.buttonHighlightLight};
      box-shadow: 1px 1px 0 0 ${props.theme.buttonHighlightSoft} inset, -1px -1px 0 0 ${props.theme.buttonShadowSoft} inset;
      z-index: 5;
    }
  `}
`;

export const MessageInput = styled.textarea`
  width: 100%;
  padding: 15px 96px 15px ${props => props.theme.name === 'retro' ? '16px' : '16px'};
  border-radius: ${props => props.theme.name === 'retro' ? '0' : '24px'};
  border: none;
  background: transparent;
  color: ${props => props.theme.text};
  font-family: inherit;
  font-size: inherit;
  resize: none;
  min-height: 50px;
  max-height: 150px;
  /* Change from auto to hidden until height threshold is reached */
  overflow-y: hidden;
  /* Hide scrollbar using browser-specific selectors */
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE and Edge */
  
  /* Hide scrollbar for Chrome, Safari and Opera */
  &::-webkit-scrollbar {
    display: none;
  }
  
  /* Show scrollbar only when content exceeds ~4 lines */
  &.show-scrollbar {
    overflow-y: auto;
    scrollbar-width: thin; /* Firefox */
    -ms-overflow-style: auto; /* IE and Edge */
    
    /* Show scrollbar for Chrome, Safari and Opera */
    &::-webkit-scrollbar {
      display: block;
      width: 6px;
    }
    
    &::-webkit-scrollbar-thumb {
      background-color: rgba(0, 0, 0, 0.2);
      border-radius: 3px;
    }
  }
  
  transition: all 0.2s ease;
  
  &::placeholder {
    color: #888;
  }
  
  &:focus {
    outline: none;
  }
  
  @media (max-width: 768px) {
    padding: 13px 96px 13px ${props => props.theme.name === 'retro' ? '16px' : '16px'};
    min-height: 45px;
  }
`;

export const WaveformButton = styled.button`
  background: ${props => props.theme.name === 'retro' ? props.theme.buttonFace : props.theme.accentBackground};
  color: ${props => props.theme.name === 'retro' ? props.theme.buttonText : '#FFFFFF'};
  border: ${props => props.theme.name === 'retro' ?
    `1px solid ${props.theme.buttonHighlightLight} ${props.theme.buttonShadowDark} ${props.theme.buttonShadowDark} ${props.theme.buttonHighlightLight}` :
    'none'};
  border-radius: ${props => props.theme.name === 'retro' ? '0' : '50%'};
  width: 38px;
  height: 38px;
  position: absolute;
  right: 54px;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.25s cubic-bezier(0.4, 0, 0.2, 1),
              box-shadow 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: ${props => props.theme.name === 'retro' ?
    `1px 1px 0 0 ${props.theme.buttonHighlightSoft} inset, -1px -1px 0 0 ${props.theme.buttonShadowSoft} inset` :
    props.$isActive ? `0 0 0 3px ${props.theme.accentColor}33` : '0 2px 8px rgba(0,0,0,0.1)'};

  &:hover:not(:disabled) {
    background: ${props => {
    if (props.theme.name === 'retro') {
      return props.theme.buttonFace;
    }
    if (props.$isActive) {
      return props.theme.accentBackground;
    }
    return props.theme.accentBackground;
  }};
    box-shadow: ${props => props.theme.name === 'retro' ?
    `1px 1px 0 0 ${props.theme.buttonHighlightSoft} inset, -1px -1px 0 0 ${props.theme.buttonShadowSoft} inset` :
    props.$isActive ? `0 0 0 4px ${props.theme.accentColor}44` : '0 4px 14px rgba(0,0,0,0.18)'};
  }

  &:active:not(:disabled) {
    ${props => props.theme.name === 'retro' && `
      border-color: ${props.theme.buttonShadowDark} ${props.theme.buttonHighlightLight} ${props.theme.buttonHighlightLight} ${props.theme.buttonShadowDark};
      box-shadow: -1px -1px 0 0 ${props.theme.buttonHighlightSoft} inset, 1px 1px 0 0 ${props.theme.buttonShadowSoft} inset;
      padding: 1px 0 0 1px;
    `}
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.4;
  }
`;

export const SendButton = styled.button`
  background: ${props => {
    if (props.theme.name === 'retro') {
      return props.theme.buttonFace;
    }
    return props.disabled ? 'rgba(0, 0, 0, 0.1)' : props.theme.accentBackground;
  }};
  color: ${props => {
    if (props.theme.name === 'retro') {
      return props.theme.buttonText;
    }
    // When disabled, use a muted accent color for visibility on light background
    if (props.disabled) {
      return props.theme.accentColor 
        ? `${props.theme.accentColor}99` 
        : 'rgba(0, 0, 0, 0.35)';
    }
    // When enabled, always use white for contrast on accent background
    return '#FFFFFF';
  }};
  border: ${props => props.theme.name === 'retro' ?
    `1px solid ${props.theme.buttonHighlightLight} ${props.theme.buttonShadowDark} ${props.theme.buttonShadowDark} ${props.theme.buttonHighlightLight}` :
    'none'};
  border-radius: ${props => props.theme.name === 'retro' ? '0' : '50%'};
  width: 38px;
  height: 38px;
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.25s cubic-bezier(0.4, 0, 0.2, 1),
              box-shadow 0.25s cubic-bezier(0.4, 0, 0.2, 1),
              opacity 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: ${props => props.theme.name === 'retro' ?
    `1px 1px 0 0 ${props.theme.buttonHighlightSoft} inset, -1px -1px 0 0 ${props.theme.buttonShadowSoft} inset` :
    props.disabled ? 'none' : '0 2px 8px rgba(0,0,0,0.12)'};

  &:hover:not(:disabled) {
    background: ${props => props.theme.name === 'retro' ?
    props.theme.buttonFace :
    props.theme.accentBackground};
    filter: ${props => props.theme.name === 'retro' ? 'none' : 'brightness(0.92)'};
    box-shadow: ${props => props.theme.name === 'retro' ?
    `1px 1px 0 0 ${props.theme.buttonHighlightSoft} inset, -1px -1px 0 0 ${props.theme.buttonShadowSoft} inset` :
    '0 4px 14px rgba(0,0,0,0.18)'};
  }

  &:active:not(:disabled) {
    ${props => props.theme.name === 'retro' && `
      border-color: ${props.theme.buttonShadowDark} ${props.theme.buttonHighlightLight} ${props.theme.buttonHighlightLight} ${props.theme.buttonShadowDark};
      box-shadow: -1px -1px 0 0 ${props.theme.buttonHighlightSoft} inset, 1px 1px 0 0 ${props.theme.buttonShadowSoft} inset;
      padding: 1px 0 0 1px;
    `}
  }

  &:disabled {
    cursor: not-allowed;
    opacity: ${props => props.theme.name === 'retro' ? '0.5' : '0.4'};
    ${props => props.theme.name === 'retro' && `
      background: ${props.theme.buttonFace};
    `}
  }

  svg {
    width: 18px;
    height: 18px;
  }
`;

export const EmptyState = styled.div`
  position: fixed;
  top: 40%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: ${props => props.theme.name === 'retro' ? '#FFFFFF' : props.theme.text}aa;
  text-align: center;
  padding: 20px;
  /* backdrop-filter: blur(5px); */ // Apply blur effect to elements behind
  /* -webkit-backdrop-filter: blur(5px); */ // Vendor prefix for backdrop-filter
  width: 100%;
  max-width: 600px;
  z-index: 8; // Lower than MainGreeting (10) but higher than ChatWindowContainer (5)
  pointer-events: none; /* Allow clicks to pass through */
  opacity: 1; /* Default opacity */

  ${({ $isExiting }) => $isExiting && css`
    animation: ${emptyStateExitAnimation} 0.5s ease-out forwards;
  `}
  
  opacity: ${props => props.$focusModeActive ? 0.1 : 1};
  filter: ${props => props.$focusModeActive ? 'blur(6px)' : 'none'};
  
  h3 {
    margin-bottom: 0;
    font-weight: 500;
    font-size: 1.5rem;
  }
  
  p {
    max-width: 500px;
    line-height: 1.6;
    font-size: 1rem;
  }
`;

export const ActionChipsContainer = styled.div`
  display: flex;
  justify-content: flex-start;
  margin: 0;
  gap: ${props => props.theme.name === 'retro' ? '12px' : '8px'};
  pointer-events: auto;
  width: 100%;
  position: relative;
`;

export const ActionChip = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: ${props => props.theme.name === 'retro' ? '0' : '20px'};
  background-color: ${props => {
    if (props.theme.name === 'retro') {
      return props.theme.buttonFace;
    }
    return props.selected ? 'rgba(0, 0, 0, 0.1)' : 'rgba(0, 0, 0, 0.03)';
  }};
  border: ${props => {
    if (props.theme.name === 'retro') {
      return props.selected ?
        `1px solid ${props.theme.buttonShadowDark} ${props.theme.buttonHighlightLight} ${props.theme.buttonHighlightLight} ${props.theme.buttonShadowDark}` :
        `1px solid ${props.theme.buttonHighlightLight} ${props.theme.buttonShadowDark} ${props.theme.buttonShadowDark} ${props.theme.buttonHighlightLight}`;
    }
    return props.selected ? '1px solid rgba(0, 0, 0, 0.15)' : '1px solid rgba(0, 0, 0, 0.06)';
  }};
  color: ${props => props.selected ? props.theme.text : props.theme.text + '99'};
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s ease,
              border-color 0.2s ease,
              color 0.2s ease,
              box-shadow 0.2s ease,
              transform 0.15s ease;
  position: relative;
  box-shadow: ${props => props.theme.name === 'retro' ?
    props.selected ?
      `-1px -1px 0 0 ${props.theme.buttonHighlightSoft} inset, 1px 1px 0 0 ${props.theme.buttonShadowSoft} inset` :
      `1px 1px 0 0 ${props.theme.buttonHighlightSoft} inset, -1px -1px 0 0 ${props.theme.buttonShadowSoft} inset` :
    props.selected ? '0 1px 3px rgba(0, 0, 0, 0.08)' : 'none'};

  &:hover {
    background-color: ${props => {
    if (props.theme.name === 'retro') {
      return props.theme.buttonFace;
    }
    return props.selected ? 'rgba(0, 0, 0, 0.12)' : 'rgba(0, 0, 0, 0.07)';
  }};
    color: ${props => props.theme.text};
    box-shadow: ${props => props.theme.name === 'retro' ? 'none' : '0 2px 6px rgba(0, 0, 0, 0.1)'};
  }

  &:active:not(:disabled) {
    transform: scale(0.97);
    ${props => props.theme.name === 'retro' && `
      border-color: ${props.theme.buttonShadowDark} ${props.theme.buttonHighlightLight} ${props.theme.buttonHighlightLight} ${props.theme.buttonShadowDark};
      box-shadow: -1px -1px 0 0 ${props.theme.buttonHighlightSoft} inset, 1px 1px 0 0 ${props.theme.buttonShadowSoft} inset;
      padding: 7px 11px 5px 13px;
    `}
  }

  svg {
    width: 15px;
    height: 15px;
    opacity: 0.75;
    transition: opacity 0.15s ease;
  }

  &:hover svg {
    opacity: 1;
  }
`;

export const ChipDropdownButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  padding: 0;
  margin-left: 3px;
  cursor: pointer;
  
  svg {
    width: 12px;
    height: 12px;
    opacity: 0.7;
  }
  
  &:hover svg {
    opacity: 1;
  }
`;

export const RetroIconWrapper = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-right: 8px;
`;

export const HammerIcon = styled.span`
  position: absolute;
  inset: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: opacity 0.2s ease,
              transform 0.2s ease;
  opacity: ${props => props.$isOpen ? 0 : 1};
  transform: ${props => props.$isOpen ? 'scale(0.85) rotate(90deg)' : 'scale(1) rotate(0deg)'};
`;

export const CloseIcon = styled(HammerIcon)`
  opacity: ${props => props.$isOpen ? 1 : 0};
  transform: ${props => props.$isOpen ? 'scale(1) rotate(0deg)' : 'scale(0.85) rotate(-90deg)'};
`;

export const HammerButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  position: relative;
  border-radius: ${props => props.theme.name === 'retro' ? '0' : '50%'};
  background-color: ${props => {
    if (props.theme.name === 'retro') {
      return props.theme.buttonFace;
    }
    return props.$isOpen ? 'rgba(0, 0, 0, 0.1)' : 'rgba(0, 0, 0, 0.03)';
  }};
  border: ${props => {
    if (props.theme.name === 'retro') {
      return props.$isOpen ?
        `1px solid ${props.theme.buttonShadowDark} ${props.theme.buttonHighlightLight} ${props.theme.buttonHighlightLight} ${props.theme.buttonShadowDark}` :
        `1px solid ${props.theme.buttonHighlightLight} ${props.theme.buttonShadowDark} ${props.theme.buttonShadowDark} ${props.theme.buttonHighlightLight}`;
    }
    return props.$isOpen ? '1px solid rgba(0, 0, 0, 0.15)' : '1px solid rgba(0, 0, 0, 0.06)';
  }};
  cursor: pointer;
  transition: background-color 0.2s cubic-bezier(0.4, 0, 0.2, 1),
              border-color 0.2s cubic-bezier(0.4, 0, 0.2, 1),
              box-shadow 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: ${props => props.theme.name === 'retro' ?
    props.$isOpen ?
      `-1px -1px 0 0 ${props.theme.buttonHighlightSoft} inset, 1px 1px 0 0 ${props.theme.buttonShadowSoft} inset` :
      `1px 1px 0 0 ${props.theme.buttonHighlightSoft} inset, -1px -1px 0 0 ${props.theme.buttonShadowSoft} inset` :
    props.$isOpen ? '0 1px 3px rgba(0, 0, 0, 0.1)' : 'none'};

  &:hover {
    background-color: ${props => {
    if (props.theme.name === 'retro') {
      return props.theme.buttonFace;
    }
    return props.$isOpen ? 'rgba(0, 0, 0, 0.12)' : 'rgba(0, 0, 0, 0.07)';
  }};
  }

  &:active:not(:disabled) {
    ${props => props.theme.name === 'retro' && `
      border-color: ${props.theme.buttonShadowDark} ${props.theme.buttonHighlightLight} ${props.theme.buttonHighlightLight} ${props.theme.buttonShadowDark};
      box-shadow: -1px -1px 0 0 ${props.theme.buttonHighlightSoft} inset, 1px 1px 0 0 ${props.theme.buttonShadowSoft} inset;
      padding: 1px;
    `}
  }

  svg {
    width: 20px;
    height: 20px;
    color: ${props => props.$isOpen ? props.theme.text : props.theme.text + '99'};
    opacity: 0.75;
    transition: opacity 0.15s ease;
  }

  &:hover svg {
    opacity: 1;
  }
`;

export const ToolbarContainer = styled.div`
  position: absolute;
  bottom: calc(100% + 7px);
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: ${props => props.theme.name === 'retro' ? '12px' : '8px'};
  width: auto;
  opacity: ${props => props.$isOpen ? 1 : 0};
  transform: translate(calc(-50% + 18px), ${props => props.$isOpen ? '0' : '10px'});
  visibility: ${props => props.$isOpen ? 'visible' : 'hidden'};
  border: ${props => {
    if (props.theme.name === 'retro') {
      return props.$isOpen ?
        `1px solid ${props.theme.buttonShadowDark} ${props.theme.buttonHighlightLight} ${props.theme.buttonHighlightLight} ${props.theme.buttonShadowDark}` :
        `1px solid ${props.theme.buttonHighlightLight} ${props.theme.buttonShadowDark} ${props.theme.buttonShadowDark} ${props.theme.buttonHighlightLight}`;
    }
    return props.$isOpen ? '1px solid rgba(0, 0, 0, 0.15)' : '1px solid rgba(0, 0, 0, 0.06)';
  }};
  padding: 3px;
  border-radius: ${props => props.theme.name === 'retro' ? '0' : '30px'};
  transition: opacity 0.2s ease, transform 0.2s ease;
  pointer-events: ${props => props.$isOpen ? 'auto' : 'none'};
  z-index: 99;
`;

export const ToolbarItem = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  background: ${props => {
    if (props.theme.name === 'retro') {
      return props.theme.buttonFace;
    }
    return props.$active ? 'rgba(0, 0, 0, 0.1)' : 'rgba(0, 0, 0, 0.03)';
  }};
  border: ${props => {
    if (props.theme.name === 'retro') {
      return `1px solid ${props.theme.buttonHighlightLight} ${props.theme.buttonShadowDark} ${props.theme.buttonShadowDark} ${props.theme.buttonHighlightLight}`;
    }
    return '1px solid rgba(0, 0, 0, 0.06)';
  }};
  border-radius: 50%;
  cursor: pointer;
  transition: background-color 0.2s cubic-bezier(0.4, 0, 0.2, 1),
              border-color 0.2s cubic-bezier(0.4, 0, 0.2, 1),
              box-shadow 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;

  box-shadow: ${props => props.theme.name === 'retro' ?
    `1px 1px 0 0 ${props.theme.buttonHighlightSoft} inset, -1px -1px 0 0 ${props.theme.buttonShadowSoft} inset` :
    'none'};

  &:hover {
    background: ${props => {
    if (props.theme.name === 'retro') {
      return props.theme.buttonFace;
    }
    return 'rgba(0, 0, 0, 0.08)';
  }};
    box-shadow: ${props => props.theme.name === 'retro' ? 'none' : '0 2px 8px rgba(0, 0, 0, 0.12)'};
  }

  &:active:not(:disabled) {
    ${props => props.theme.name === 'retro' && `
      border-color: ${props.theme.buttonShadowDark} ${props.theme.buttonHighlightLight} ${props.theme.buttonHighlightLight} ${props.theme.buttonShadowDark};
      box-shadow: -1px -1px 0 0 ${props.theme.buttonHighlightSoft} inset, 1px 1px 0 0 ${props.theme.buttonShadowSoft} inset;
    `}
  }

  svg {
    width: 18px;
    height: 18px;
    color: ${props => props.theme.text + '99'};
    opacity: 0.75;
    transition: opacity 0.15s ease;
  }

  &:hover svg {
    opacity: 1;
  }
`;

export const OverflowChipButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: ${props => props.theme.name === 'retro' ? '0' : '20px'};
  background-color: ${props => {
    if (props.theme.name === 'retro') {
      return props.theme.buttonFace;
    }
    return 'rgba(0, 0, 0, 0.03)';
  }};
  border: ${props => {
    if (props.theme.name === 'retro') {
      return `1px solid ${props.theme.buttonHighlightLight} ${props.theme.buttonShadowDark} ${props.theme.buttonShadowDark} ${props.theme.buttonHighlightLight}`;
    }
    return '1px solid rgba(0, 0, 0, 0.06)';
  }};
  color: ${props => props.theme.text + '99'};
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 1px;
  cursor: pointer;
  transition: background-color 0.2s cubic-bezier(0.4, 0, 0.2, 1),
              border-color 0.2s cubic-bezier(0.4, 0, 0.2, 1),
              color 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: ${props => props.theme.name === 'retro' ?
    `1px 1px 0 0 ${props.theme.buttonHighlightSoft} inset, -1px -1px 0 0 ${props.theme.buttonShadowSoft} inset` :
    'none'};
  min-width: 44px;

  &:hover {
    background-color: ${props => {
    if (props.theme.name === 'retro') {
      return props.theme.buttonFace;
    }
    return 'rgba(0, 0, 0, 0.07)';
  }};
    color: ${props => props.theme.text};
  }

  &:active:not(:disabled) {
    ${props => props.theme.name === 'retro' && `
      border-color: ${props.theme.buttonShadowDark} ${props.theme.buttonHighlightLight} ${props.theme.buttonHighlightLight} ${props.theme.buttonShadowDark};
      box-shadow: -1px -1px 0 0 ${props.theme.buttonHighlightSoft} inset, 1px 1px 0 0 ${props.theme.buttonShadowSoft} inset;
      padding: 7px 11px 5px 13px;
    `}
  }
`;

const dropdownSlideIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(-10px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
`;

export const OverflowDropdown = styled.div`
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 6px;
  background: ${props => props.theme.inputBackground};
  border: 1px solid ${props => props.theme.border};
  border-radius: ${props => props.theme.name === 'retro' ? '0' : '12px'};
  box-shadow: ${props => props.theme.name === 'retro' ?
    `inset 1px 1px 0px ${props.theme.buttonHighlightLight}, inset -1px -1px 0px ${props.theme.buttonShadowDark}` :
    '0 8px 24px rgba(0, 0, 0, 0.15), 0 2px 6px rgba(0, 0, 0, 0.08)'};
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 150px;
  z-index: 1000;
  animation: ${dropdownSlideIn} 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
  transform-origin: top right;
`; 
