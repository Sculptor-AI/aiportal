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
  inputBackground: 'rgba(255, 255, 255, 1.0)',
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
  inputBackground: 'rgba(40, 40, 40, 1.0)',
  buttonGradient: 'linear-gradient(145deg, #0A84FF, #38B0FF)',
  buttonHoverGradient: 'linear-gradient(145deg, #38B0FF, #0A84FF)',
};

// Add a new OLED theme definition after the darkTheme
export const oledTheme = {
  name: 'oled',
  background: '#000000', // True black background
  sidebar: 'rgba(10, 10, 10, 0.7)',
  chat: 'rgba(5, 5, 5, 0.6)',
  text: '#f0f2f5',
  border: 'rgba(255, 255, 255, 0.06)',
  messageUser: 'rgba(30, 30, 30, 0.8)',
  messageAi: 'rgba(15, 15, 15, 0.8)',
  hover: 'rgba(40, 40, 40, 0.5)',
  primary: 'linear-gradient(145deg, #007AFF, #1E90FF)',
  secondary: 'linear-gradient(145deg, #05a3ff, #0099e6)',
  shadow: 'rgba(0, 0, 0, 0.3)',
  glassBlur: '10px',
  glassEffect: 'blur(10px) saturate(120%)',
  inputBackground: 'rgba(20, 20, 20, 1.0)',
  buttonGradient: 'linear-gradient(145deg, #007AFF, #1E90FF)',
  buttonHoverGradient: 'linear-gradient(145deg, #1E90FF, #007AFF)',
  cardBackground: 'rgba(15, 15, 15, 0.7)'
};

// Update the oceanTheme sidebar style
export const oceanTheme = {
  name: 'ocean',
  background: 'linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.5)), url("https://images.unsplash.com/photo-1484291470158-b8f8d608850d?q=80&w=3540&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D")',
  backgroundAttachment: 'fixed',
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  sidebar: 'linear-gradient(rgba(10, 30, 50, 0.8), rgba(10, 40, 60, 0.85))', // Deep blue transparent gradient
  chat: 'rgba(10, 30, 50, 0.6)', // Dark blue with transparency
  text: '#ffffff',
  border: 'rgba(255, 255, 255, 0.1)',
  messageUser: 'rgba(25, 55, 85, 0.8)',
  messageAi: 'rgba(10, 30, 50, 0.8)',
  hover: 'rgba(40, 105, 160, 0.5)',
  primary: '#039be5',
  secondary: '#4fc3f7',
  shadow: 'rgba(0, 0, 0, 0.4)',
  glassBlur: '10px',
  glassEffect: 'blur(10px) saturate(120%)',
  inputBackground: 'rgba(10, 40, 60, 1.0)',
  buttonGradient: 'linear-gradient(145deg, #039be5, #0277bd)',
  buttonHoverGradient: 'linear-gradient(145deg, #0277bd, #039be5)',
  cardBackground: 'rgba(15, 45, 65, 0.7)'
};

// Update the forestTheme sidebar style
export const forestTheme = {
  name: 'forest',
  background: 'linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.5)), url("https://images.unsplash.com/photo-1558022103-603c34ab10ce?q=80&w=3542&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D")',
  backgroundAttachment: 'fixed',
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  sidebar: 'linear-gradient(rgba(20, 35, 15, 0.85), rgba(25, 45, 20, 0.9))', // Dark green gradient that matches forest
  chat: 'rgba(20, 30, 15, 0.6)', // Dark green with transparency
  text: '#ffffff',
  border: 'rgba(255, 255, 255, 0.1)',
  messageUser: 'rgba(40, 60, 30, 0.8)', // Medium green for user messages
  messageAi: 'rgba(25, 40, 20, 0.8)', // Darker green for AI messages
  hover: 'rgba(70, 90, 50, 0.5)', // Lighter green for hover states
  primary: '#2e7d32', // Forest green
  secondary: '#4caf50', // Medium green
  shadow: 'rgba(0, 0, 0, 0.4)',
  glassBlur: '10px',
  glassEffect: 'blur(10px) saturate(120%)',
  inputBackground: 'rgba(30, 45, 20, 1.0)',
  buttonGradient: 'linear-gradient(145deg, #2e7d32, #388e3c)',
  buttonHoverGradient: 'linear-gradient(145deg, #388e3c, #2e7d32)',
  cardBackground: 'rgba(35, 50, 25, 0.7)'
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
  inputBackground: 'rgba(25, 25, 35, 1.0)',
  // Bold pink to purple gradient for buttons
  buttonGradient: 'linear-gradient(145deg, #D60270, #9B4F96)',
  // Bold purple to blue gradient for button hover state
  buttonHoverGradient: 'linear-gradient(145deg, #9B4F96, #0038A8)',
  // Additional bi flag specific gradients
  accentGradient: 'linear-gradient(to right, #D60270, #9B4F96, #0038A8)',
  modelSelectorBackground: 'linear-gradient(145deg, rgba(25, 25, 35, 0.9), rgba(40, 40, 60, 0.7))',
  highlightBorder: 'linear-gradient(to right, #D60270, #9B4F96, #0038A8)',
};

// Lakeside theme - dark theme with maroon sidebar and gold accents
export const lakesideTheme = {
  name: 'lakeside',
  background: 'rgba(23, 23, 23)',
  sidebar: 'rgb(120, 47, 64)', // Maroon sidebar as specified
  chat: 'rgba(25, 25, 30, 0.7)',
  text: '#f0f2f5',
  border: 'rgba(198, 146, 20, 0.15)', // Gold-tinted borders
  messageUser: 'rgba(40, 40, 45, 0.8)',
  messageAi: 'rgba(30, 30, 35, 0.8)',
  hover: 'rgba(91, 10, 35, 0.6)', // Lighter maroon for hover
  primary: 'rgb(198, 146, 20)', // Gold
  secondary: '#8B0000', // Dark red
  shadow: 'rgba(0, 0, 0, 0.3)',
  glassBlur: '10px',
  glassEffect: 'blur(10px) saturate(160%)',
  inputBackground: 'rgba(30, 30, 35, 1.0)',
  buttonGradient: 'linear-gradient(145deg, rgb(198, 146, 20), rgb(178, 126, 0))', // Gold gradient
  buttonHoverGradient: 'linear-gradient(145deg, rgb(178, 126, 0), rgb(198, 146, 20))', // Reversed gradient
  cardBackground: 'rgba(30, 30, 35, 0.8)',
  accentGradient: 'linear-gradient(to right, #5B0019, #8B0000, rgb(198, 146, 20))', // Maroon to gold gradient
};

export const prideTheme = {
  name: 'pride',
  // Vibrant rainbow background with a dark overlay for readability - making overlay even less opaque
  background: 'linear-gradient(rgba(10, 10, 10, 0.7), rgba(0, 0, 0, 0.75)), linear-gradient(135deg, #E40303 0%, #FF8C00 16.67%, #FFED00 33.33%, #008026 50%, #004DFF 66.67%, #750787 83.33%, #E40303 100%)',
  backgroundAttachment: 'fixed', // Make background fixed for a cooler effect with scrolling
  sidebar: 'rgba(30, 30, 40, 0.85)', // Slightly lighter, more modern dark
  chat: 'rgba(20, 20, 25, 0.8)', // Consistent dark base for chat area
  text: '#f0f2f5', // Softer white for better readability
  border: 'rgba(220, 220, 255, 0.15)', // Slightly brighter border
  // Enhanced rainbow glow using specific pride colors - removed
  borderGlow: 'none',
  // Dark, neutral message bubbles to make content pop
  messageUser: 'rgba(45, 45, 55, 0.8)',
  messageAi: 'rgba(40, 40, 50, 0.8)',
  hover: 'rgba(65, 65, 80, 0.6)', // A more responsive neutral hover
  primary: '#E40303', // Pride Red
  secondary: '#004DFF', // Pride Blue
  shadow: 'rgba(0, 0, 0, 0.5)', // Slightly stronger shadow for depth
  glassBlur: '12px', // Slightly more blur
  glassEffect: 'blur(12px) saturate(180%)', // More saturation for glass
  inputBackground: 'rgba(40, 40, 55, 1.0)',
  // Full, vibrant rainbow gradients for buttons
  buttonGradient: 'linear-gradient(145deg, #E40303, #FF8C00, #FFED00, #008026, #004DFF, #750787)',
  buttonHoverGradient: 'linear-gradient(145deg, #750787, #004DFF, #008026, #FFED00, #FF8C00, #E40303)', // Reversed
  cardBackground: 'rgba(35, 35, 50, 0.85)', // Consistent dark card background
  // Accent gradient for special highlights
  accentGradient: 'linear-gradient(to right, #E40303, #FF8C00, #FFED00, #008026, #004DFF, #750787)',
};

export const transTheme = {
  name: 'trans',
  // Dynamic background using trans flag colors - significantly reduced dark overlay for intensity
  background: 'linear-gradient(rgba(10, 5, 10, 0.5), rgba(0, 0, 0, 0.6)), linear-gradient(135deg, #5BCEFA 0%, #F5A9B8 50%, #FFFFFF 100%)',
  backgroundAttachment: 'fixed',
  // Slightly adjusted UI element backgrounds to let background color influence them more
  sidebar: 'rgba(30, 25, 35, 0.8)',
  chat: 'rgba(20, 15, 25, 0.75)',
  text: '#f0f2f5',
  border: 'rgba(245, 169, 184, 0.3)', // Slightly more visible pink border
  borderGlow: 'none',
  messageUser: 'rgba(55, 50, 60, 0.8)',
  messageAi: 'rgba(50, 45, 55, 0.8)',
  hover: 'rgba(80, 75, 90, 0.6)',
  primary: '#5BCEFA',
  secondary: '#F5A9B8',
  shadow: 'rgba(0, 0, 0, 0.55)', // Slightly darker shadow for contrast
  glassBlur: '12px',
  glassEffect: 'blur(12px) saturate(190%)', // Increased saturation
  inputBackground: 'rgba(50, 45, 60, 1.0)',
  buttonGradient: 'linear-gradient(145deg, #5BCEFA, #F5A9B8, #FFFFFF)',
  buttonHoverGradient: 'linear-gradient(145deg, #FFFFFF, #F5A9B8, #5BCEFA)',
  cardBackground: 'rgba(45, 40, 55, 0.8)',
  accentGradient: 'linear-gradient(to right, #5BCEFA, #F5A9B8, #FFFFFF, #F5A9B8, #5BCEFA)',
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
  },
  // Add your custom model
  'custom-gguf': {
    primary: '#FF5722',     // Orange
    secondary: '#FF9800',   // Light orange
    gradient: 'linear-gradient(135deg, #FF5722, #FF9800)'
  },
  // Add NVIDIA Nemotron theme
  'nemotron-super-49b': {
    primary: '#76B900',     // NVIDIA green
    secondary: '#1A1A1A',   // Dark gray/black
    gradient: 'linear-gradient(135deg, #76B900, #1A1A1A)'
  }
};

export const getTheme = (themeName) => {
  switch (themeName) {
    case 'dark': return darkTheme;
    case 'oled': return oledTheme;
    case 'ocean': return oceanTheme;
    case 'forest': return forestTheme;
    case 'pride': return prideTheme;
    case 'trans': return transTheme;
    case 'bisexual': return bisexualTheme;
    case 'lakeside': return lakesideTheme;
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
  
  /* Pride theme rainbow effects */
  ${props => props.theme.name === 'pride' && `
    /* Add subtle rainbow glow to interactive elements */
    button, 
    input:focus,
    textarea:focus,
    select:focus {
      box-shadow: ${props.theme.borderGlow};
      border-color: rgba(255, 255, 255, 0.2);
    }
    
    /* Add rainbow glow to cards and sections */
    .card,
    .chat-message,
    .modal-content,
    .settings-section {
      border-color: rgba(255, 255, 255, 0.15);
      box-shadow: ${props.theme.borderGlow};
    }
    
    /* Highlight active elements with rainbow */
    .active-item,
    .selected {
      box-shadow: ${props.theme.borderGlow};
      border-color: rgba(255, 255, 255, 0.3);
    }
  `}
`;