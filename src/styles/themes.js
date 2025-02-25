import { createGlobalStyle } from 'styled-components';

// Standard themes
export const lightTheme = {
  name: 'light',
  background: '#f8f9fa',
  sidebar: '#ffffff',
  chat: '#ffffff',
  text: '#212529',
  border: '#e1e4e8',
  messageUser: '#f1f3f5',
  messageAi: '#e3f2fd',
  hover: '#f0f2f5',
  primary: '#0366d6',
  secondary: '#05a3ff',
  shadow: 'rgba(0, 0, 0, 0.05)',
};

export const darkTheme = {
  name: 'dark',
  background: '#1a1a1a',
  sidebar: '#2a2a2a',
  chat: '#2d2d2d',
  text: '#e4e6eb',
  border: '#444444',
  messageUser: '#3a3a3a',
  messageAi: '#213547',
  hover: '#3d3d3d',
  primary: '#68b5f6',
  secondary: '#38bdf8',
  shadow: 'rgba(0, 0, 0, 0.2)',
};

// Bisexual theme using the bisexual flag colors:
// Pink: #D60270, Purple: #9B4F96, Blue: #0038A8
export const bisexualTheme = {
  name: 'bisexual',
  background: '#2d004e',
  sidebar: '#3d0066',
  chat: '#2d004e',
  text: '#ffffff',
  border: '#9B4F96',
  messageUser: '#D60270',  // Pink for user messages
  messageAi: '#0038A8',   // Blue for AI messages
  hover: '#9B4F96',      // Purple for hover effects
  primary: '#D60270',    // Pink for primary actions
  secondary: '#0038A8',  // Blue for secondary actions
  shadow: 'rgba(155, 79, 150, 0.3)',  // Purple-tinted shadow
};

// Custom theme for the model icons
export const modelThemes = {
  'gemini-2-flash': {
    primary: '#1B72E8',     // Google blue 
    secondary: '#EA4335',   // Google red
    gradient: 'linear-gradient(135deg, #1B72E8, #EA4335)'
  },
  'claude-3.7-sonnet': {
    primary: '#732BEB',     // Claude purple
    secondary: '#A480EB',   // Light purple
    gradient: 'linear-gradient(135deg, #732BEB, #A480EB)'
  },
  'chatgpt-4o': {
    primary: '#10A37F',     // OpenAI green
    secondary: '#1A7F64',   // Darker green
    gradient: 'linear-gradient(135deg, #10A37F, #1A7F64)'
  }
};

export const getTheme = (themeName) => {
  switch (themeName) {
    case 'dark': return darkTheme;
    case 'bisexual': return bisexualTheme;
    default: return lightTheme;
  }
};

export const GlobalStyles = createGlobalStyle`
  body {
    background-color: ${props => props.theme.background};
    color: ${props => props.theme.text};
    transition: all 0.2s ease-in-out;
  }
  
  .font-size-small {
    font-size: 0.9rem;
  }
  
  .font-size-medium {
    font-size: 1rem;
  }
  
  .font-size-large {
    font-size: 1.1rem;
  }
`;