import { createGlobalStyle } from 'styled-components';

// Apple-inspired themes with glassmorphism and gradients
export const lightTheme = {
  name: 'light',
  background: 'linear-gradient(145deg, #f0f2f5, #e6e9ee)',
  sidebar: 'rgba(255, 255, 255, 0.7)',
  chat: 'rgba(255, 255, 255, 0.6)',
  text: '#212529',
  border: 'rgba(0, 0, 0, 0.06)',
  messageUser: 'rgba(255, 255, 255, 0.8)',
  messageAi: 'rgba(236, 246, 254, 0.8)',
  hover: 'rgba(255, 255, 255, 0.9)',
  primary: 'linear-gradient(145deg, #007AFF, #1E90FF)',
  secondary: 'linear-gradient(145deg, #05a3ff, #0099e6)',
  shadow: 'rgba(0, 0, 0, 0.08)',
  glassBlur: '10px',
  glassEffect: 'blur(10px) saturate(180%)',
  inputBackground: 'rgba(255, 255, 255, 0.7)',
  buttonGradient: 'linear-gradient(145deg, #007AFF, #1E90FF)',
  buttonHoverGradient: 'linear-gradient(145deg, #1E90FF, #007AFF)',
};

export const darkTheme = {
  name: 'dark',
  background: 'linear-gradient(145deg, #141414, #1e1e1e)',
  sidebar: 'rgba(30, 30, 30, 0.7)',
  chat: 'rgba(35, 35, 35, 0.6)',
  text: '#f0f2f5',
  border: 'rgba(255, 255, 255, 0.06)',
  messageUser: 'rgba(50, 50, 50, 0.8)',
  messageAi: 'rgba(35, 45, 60, 0.8)',
  hover: 'rgba(60, 60, 60, 0.9)',
  primary: 'linear-gradient(145deg, #0A84FF, #38B0FF)',
  secondary: 'linear-gradient(145deg, #38B0FF, #50C8FF)',
  shadow: 'rgba(0, 0, 0, 0.2)',
  glassBlur: '10px',
  glassEffect: 'blur(10px) saturate(180%)',
  inputBackground: 'rgba(40, 40, 40, 0.7)',
  buttonGradient: 'linear-gradient(145deg, #0A84FF, #38B0FF)',
  buttonHoverGradient: 'linear-gradient(145deg, #38B0FF, #0A84FF)',
};

// Bisexual theme using the bisexual flag colors with glass effect and gradients:
// Pink: #D60270, Purple: #9B4F96, Blue: #0038A8
export const bisexualTheme = {
  name: 'bisexual',
  // Background with all three colors from bi flag in a gradient
  background: 'linear-gradient(145deg, rgba(20, 20, 30, 0.9), rgba(25, 25, 35, 0.95)), linear-gradient(to bottom right, #D60270, #9B4F96, #0038A8)',
  // Solid dark color for sidebar with slight transparency
  sidebar: 'rgba(25, 25, 35, 0.8)',
  // Slightly transparent for the chat area
  chat: 'rgba(28, 28, 38, 0.7)',
  text: '#ffffff',
  border: 'rgba(155, 79, 150, 0.3)',
  // Gradients for messages
  messageUser: 'linear-gradient(145deg, rgba(214, 2, 112, 0.2), rgba(214, 2, 112, 0.1))',  // Pink gradient for user
  messageAi: 'linear-gradient(145deg, rgba(0, 56, 168, 0.2), rgba(0, 56, 168, 0.1))',   // Blue gradient for AI
  hover: 'linear-gradient(145deg, rgba(155, 79, 150, 0.3), rgba(155, 79, 150, 0.2))',  // Purple gradient for hover
  // Pink to purple gradient for primary elements
  primary: 'linear-gradient(145deg, #D60270, #9B4F96)',
  // Purple to blue gradient for secondary elements
  secondary: 'linear-gradient(145deg, #9B4F96, #0038A8)',
  shadow: 'rgba(155, 79, 150, 0.3)',  // Purple-tinted shadow
  glassBlur: '10px',
  glassEffect: 'blur(10px) saturate(180%)',
  inputBackground: 'rgba(25, 25, 35, 0.6)',
  // Bold pink to purple gradient for buttons
  buttonGradient: 'linear-gradient(145deg, #D60270, #9B4F96)',
  // Bold purple to blue gradient for button hover state
  buttonHoverGradient: 'linear-gradient(145deg, #9B4F96, #0038A8)',
  // Additional bi flag specific gradients
  accentGradient: 'linear-gradient(to right, #D60270, #9B4F96, #0038A8)',
  modelSelectorBackground: 'linear-gradient(145deg, rgba(25, 25, 35, 0.9), rgba(40, 40, 60, 0.7))',
  highlightBorder: 'linear-gradient(to right, #D60270, #9B4F96, #0038A8)',
};

// Custom theme for the model icons with enhanced gradients
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
  * {
    box-sizing: border-box;
  }
  
  body {
    background: ${props => props.theme.background};
    color: ${props => props.theme.text};
    transition: all 0.3s ease-in-out;
    font-family: -apple-system, BlinkMacSystemFont, 'San Francisco', 'Segoe UI', Roboto, sans-serif;
    margin: 0;
    padding: 0;
  }
  
  button, input, textarea, select {
    font-family: -apple-system, BlinkMacSystemFont, 'San Francisco', 'Segoe UI', Roboto, sans-serif;
    border-radius: 10px;
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
  
  /* Helper classes for glassmorphism */
  .glass {
    backdrop-filter: ${props => props.theme.glassEffect};
    -webkit-backdrop-filter: ${props => props.theme.glassEffect};
    background-color: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.18);
    box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
  }
`;