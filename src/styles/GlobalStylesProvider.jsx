import React from 'react';
import { createGlobalStyle } from 'styled-components';

const GlobalStyle = createGlobalStyle`
  /* Add Windows 98 font */
  @font-face {
    font-family: 'MSW98UI';
    src: url('/fonts/MSW98UI-Regular.ttf') format('truetype');
    font-weight: normal;
    font-style: normal;
    font-display: swap;
  }

  :root {
    --font-size: ${props => {
      switch(props.fontSize) {
        case 'small': return '0.9rem';
        case 'large': return '1.1rem';
        default: return '1rem';
      }
    }};
    
    --font-family: ${props => {
      switch(props.fontFamily) {
        case 'inter': return "'Inter', sans-serif";
        case 'roboto': return "'Roboto', sans-serif";
        case 'opensans': return "'Open Sans', sans-serif";
        case 'georgia': return "'Georgia', serif";
        case 'merriweather': return "'Merriweather', serif";
        default: return "Inter, system-ui, Avenir, Helvetica, Arial, sans-serif";
      }
    }};
    
    --line-height: ${props => {
      switch(props.lineSpacing) {
        case 'relaxed': return '1.7';
        case 'loose': return '2';
        default: return '1.5';
      }
    }};
    
    --transition-speed: ${props => props.reducedMotion ? '0s' : '0.3s'};
    
    --message-spacing: ${props => {
      switch(props.messageSpacing) {
        case 'compact': return '16px';
        case 'spacious': return '32px';
        default: return '24px'; // comfortable
      }
    }};
    
    --bubble-radius: ${props => {
      switch(props.bubbleStyle) {
        case 'classic': return '8px';
        case 'minimal': return '0';
        default: return '18px'; // modern
      }
    }};
  }

  body {
    font-family: ${props => props.theme?.name === 'retro' ? "'MSW98UI', 'MS Sans Serif', 'Tahoma', sans-serif" : 'var(--font-family)'};
    font-size: ${props => props.theme?.name === 'retro' ? '12px' : 'var(--font-size)'};
    line-height: ${props => props.theme?.name === 'retro' ? '1.2' : 'var(--line-height)'};
  }

  * {
    transition-duration: var(--transition-speed);
  }
  
  ${props => props.highContrast && `
    * {
      --high-contrast-text: #ffffff;
      --high-contrast-bg: #000000;
      --high-contrast-border: #ffffff;
    }
    
    body, .message-content, .chat-window {
      color: var(--high-contrast-text) !important;
    }
    
    button, input, textarea, select {
      border: 2px solid var(--high-contrast-border) !important;
      color: var(--high-contrast-text) !important;
    }
    
    .message-bubble {
      background: var(--high-contrast-bg) !important;
      border: 2px solid var(--high-contrast-border) !important;
    }
  `}
  
  /* Loading spinner animation */
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  /* Override animation effects for reduced motion */
  ${props => props.reducedMotion && `
    * {
      animation: none !important;
      transition: none !important;
    }
  `}

  /* Apply retro font to all elements when retro theme is active */
  ${props => props.theme?.name === 'retro' && `
    * {
      font-family: 'MSW98UI', 'MS Sans Serif', 'Tahoma', sans-serif !important;
    }
    
    button, input, textarea, select {
      font-family: 'MSW98UI', 'MS Sans Serif', 'Tahoma', sans-serif !important;
      font-size: 12px !important;
    }
    
    h1, h2, h3, h4, h5, h6 {
      font-family: 'MSW98UI', 'MS Sans Serif', 'Tahoma', sans-serif !important;
      font-weight: bold !important;
    }
  `}
`;

const GlobalStylesProvider = ({ settings, children }) => {
  return (
    <>
      <GlobalStyle 
        fontSize={settings?.fontSize || 'medium'} 
        fontFamily={settings?.fontFamily || 'system'}
        lineSpacing={settings?.lineSpacing || 'normal'}
        reducedMotion={settings?.reducedMotion || false}
        highContrast={settings?.highContrast || false}
        bubbleStyle={settings?.bubbleStyle || 'modern'}
        messageSpacing={settings?.messageSpacing || 'comfortable'}
        theme={settings?.theme}
      />
      {children}
    </>
  );
};

export default GlobalStylesProvider;
