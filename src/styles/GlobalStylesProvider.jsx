import React from 'react';
import { createGlobalStyle } from 'styled-components';

const GlobalStyle = createGlobalStyle`
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
  }

  body {
    font-family: var(--font-family);
    font-size: var(--font-size);
    line-height: var(--line-height);
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
    
    body {
      color: var(--high-contrast-text) !important;
    }
    
    button, input, textarea, select {
      border: 2px solid var(--high-contrast-border) !important;
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
      />
      {children}
    </>
  );
};

export default GlobalStylesProvider;
