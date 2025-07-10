import { createGlobalStyle } from 'styled-components';

// Apple-inspired themes with glassmorphism and gradients
export const lightTheme = {
  name: 'light',
  background: 'linear-gradient(145deg, #f0f2f5, #e6e9ee)',
  sidebar: 'rgba(255, 255, 255, 1)',
  chat: 'rgba(255, 255, 255, 1)',
  text: '#212529',
  border: 'rgba(0, 0, 0, 0.06)',
  messageUser: 'rgba(255, 255, 255, 0.8)',
  messageAi: 'rgba(236, 246, 254, 0.8)',
  hover: 'rgba(255, 255, 255, 0.9)',
  primary: '#007AFF',
  primaryGradient: 'linear-gradient(145deg, #007AFF, #1E90FF)',
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
  sidebar: 'rgba(30, 30, 30, 1)',
  chat: 'rgba(30, 30, 30, 1)',
  text: '#f0f2f5',
  border: 'rgba(255, 255, 255, 0.06)',
  messageUser: 'rgba(50, 50, 50, 0.8)',
  messageAi: 'rgba(35, 45, 60, 0.8)',
  hover: 'rgba(60, 60, 60, 0.9)',
  primary: '#0A84FF',
  primaryGradient: 'linear-gradient(145deg, #0A84FF, #38B0FF)',
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
  sidebar: 'rgba(10, 10, 10, 1)',
  chat: 'rgba(10, 10, 10, 1)',
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
  sidebar: 'linear-gradient(rgba(10, 30, 50, 1), rgba(10, 40, 60, 1))', // Deep blue transparent gradient
  chat: 'linear-gradient(rgba(10, 30, 50, 1), rgba(10, 40, 60, 1))', // Dark blue with transparency
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
  sidebar: 'linear-gradient(rgba(20, 35, 15, 1), rgba(25, 45, 20, 1))', // Dark green gradient that matches forest
  chat: 'linear-gradient(rgba(20, 35, 15, 1), rgba(25, 45, 20, 1))', // Dark green with transparency
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
  sidebar: 'rgba(25, 25, 35, 1)',
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
  sidebar: 'rgba(120, 47, 64, 1)', // Maroon sidebar as specified
  chat: 'rgba(120, 47, 64, 1)',
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
  sidebar: 'rgba(30, 30, 40, 1)', // Slightly lighter, more modern dark
  chat: 'rgba(30, 30, 40, 1)',
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
  sidebar: 'rgba(30, 25, 35, 1)',
  chat: 'rgba(30, 25, 35, 1)',
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

// Galaxy-inspired deep space theme
export const galaxyTheme = {
  name: 'galaxy',
  background: 'linear-gradient(135deg, #0f052b, #12063b, #1b0a4a)',
  backgroundAttachment: 'fixed',
  sidebar: 'rgba(15, 10, 40, 1)',
  chat: 'rgba(15, 10, 40, 1)',
  text: '#e0e0ff',
  border: 'rgba(255, 255, 255, 0.1)',
  messageUser: 'rgba(35, 25, 70, 0.8)',
  messageAi: 'rgba(25, 20, 60, 0.8)',
  hover: 'rgba(90, 60, 150, 0.5)',
  primary: '#7b61ff',
  secondary: '#a18aff',
  shadow: 'rgba(0, 0, 0, 0.4)',
  glassBlur: '12px',
  glassEffect: 'blur(12px) saturate(150%)',
  inputBackground: 'rgba(25, 20, 60, 1)',
  buttonGradient: 'linear-gradient(145deg, #7b61ff, #a18aff)',
  buttonHoverGradient: 'linear-gradient(145deg, #a18aff, #7b61ff)',
  cardBackground: 'rgba(25, 20, 55, 0.7)'
};

// Warm sunset oranges and pinks
export const sunsetTheme = {
  name: 'sunset',
  background: 'linear-gradient(145deg, #ff7e5f, #feb47b)',
  sidebar: 'rgba(255, 126, 95, 1)',
  chat: 'rgba(255, 126, 95, 1)',
  text: '#2d0b00',
  border: 'rgba(0, 0, 0, 0.1)',
  messageUser: 'rgba(255, 230, 200, 0.8)',
  messageAi: 'rgba(255, 210, 180, 0.8)',
  hover: 'rgba(255, 150, 110, 0.6)',
  primary: '#ff7e5f',
  secondary: '#feb47b',
  shadow: 'rgba(0, 0, 0, 0.2)',
  glassBlur: '8px',
  glassEffect: 'blur(8px) saturate(150%)',
  inputBackground: 'rgba(255, 235, 205, 1)',
  buttonGradient: 'linear-gradient(145deg, #ff7e5f, #feb47b)',
  buttonHoverGradient: 'linear-gradient(145deg, #feb47b, #ff7e5f)',
  cardBackground: 'rgba(255, 230, 210, 0.8)'
};

// Neon cyberpunk aesthetic
export const cyberpunkTheme = {
  name: 'cyberpunk',
  background: 'linear-gradient(145deg, #0f0c29, #302b63, #24243e)',
  backgroundAttachment: 'fixed',
  sidebar: 'rgba(0, 0, 0, 1)',
  chat: 'rgba(0, 0, 0, 1)',
  text: '#f5f5f5',
  border: 'rgba(255, 0, 255, 0.2)',
  messageUser: 'rgba(50, 10, 60, 0.8)',
  messageAi: 'rgba(10, 40, 70, 0.8)',
  hover: 'rgba(255, 0, 255, 0.3)',
  primary: '#ff00cc',
  secondary: '#3333ff',
  shadow: 'rgba(0, 0, 0, 0.6)',
  glassBlur: '10px',
  glassEffect: 'blur(10px) saturate(160%)',
  inputBackground: 'rgba(20, 20, 40, 1)',
  buttonGradient: 'linear-gradient(145deg, #ff00cc, #3333ff)',
  buttonHoverGradient: 'linear-gradient(145deg, #3333ff, #ff00cc)',
  cardBackground: 'rgba(25, 25, 50, 0.8)'
};

// Sweet bubblegum pinks
export const bubblegumTheme = {
  name: 'bubblegum',
  background: 'linear-gradient(145deg, #ff9a9e, #fad0c4)',
  sidebar: 'rgba(255, 150, 180, 1)',
  chat: 'rgba(255, 150, 180, 1)',
  text: '#551133',
  border: 'rgba(255, 0, 128, 0.2)',
  messageUser: 'rgba(255, 182, 193, 0.8)',
  messageAi: 'rgba(255, 192, 203, 0.8)',
  hover: 'rgba(255, 105, 180, 0.6)',
  primary: '#ff69b4',
  secondary: '#ffaec9',
  shadow: 'rgba(0, 0, 0, 0.2)',
  glassBlur: '10px',
  glassEffect: 'blur(10px) saturate(170%)',
  inputBackground: 'rgba(255, 220, 230, 1)',
  buttonGradient: 'linear-gradient(145deg, #ff69b4, #ffaec9)',
  buttonHoverGradient: 'linear-gradient(145deg, #ffaec9, #ff69b4)',
  cardBackground: 'rgba(255, 200, 215, 0.8)'
};

// Sandy desert browns
export const desertTheme = {
  name: 'desert',
  background: 'linear-gradient(145deg, #c79081, #dfa579)',
  sidebar: 'rgba(199, 144, 129, 1)',
  chat: 'rgba(199, 144, 129, 1)',
  text: '#3e2b1f',
  border: 'rgba(60, 30, 20, 0.2)',
  messageUser: 'rgba(238, 194, 150, 0.8)',
  messageAi: 'rgba(210, 160, 120, 0.8)',
  hover: 'rgba(230, 170, 120, 0.5)',
  primary: '#d86f45',
  secondary: '#f4a460',
  shadow: 'rgba(0, 0, 0, 0.3)',
  glassBlur: '8px',
  glassEffect: 'blur(8px) saturate(140%)',
  inputBackground: 'rgba(240, 220, 180, 1)',
  buttonGradient: 'linear-gradient(145deg, #d86f45, #f4a460)',
  buttonHoverGradient: 'linear-gradient(145deg, #f4a460, #d86f45)',
  cardBackground: 'rgba(235, 200, 160, 0.8)'
};

// Windows 98 "Retro" Theme
export const retroTheme = {
  name: 'retro',
  background: '#008080', // Teal desktop background
  sidebar: '#C0C0C0',    // Classic gray for UI elements
  chat: '#C0C0C0',        // White for chat area (like a document)
  text: '#000000',        // Black text
  border: '#808080',      // Dark gray for general borders
  windowTitleBarBackground: '#000080', // Navy blue for title bars
  windowTitleBarText: '#FFFFFF',     // White text on title bars
  messageUser: '#E0E0E0', // Light gray for user messages
  messageAi: '#D0D0D0',   // Slightly different light gray for AI messages
  hover: '#B0B0B0',       // Darker gray for hover (general)
  primary: '#000080',     // Navy blue (active elements, title bars)
  secondary: '#C0C0C0',   // Silver/Gray (main UI color)
  shadow: 'none',         // No drop shadows, use beveled edges
  glassBlur: '0px',
  glassEffect: 'none',
  inputBackground: '#FFFFFF',
  buttonFace: '#C0C0C0',      // Standard button color
  buttonText: '#000000',
  // For 3D effect - outer border
  buttonHighlightLight: '#FFFFFF', // Top/Left outer highlight
  buttonShadowDark: '#000000',    // Bottom/Right outer shadow
  // For 3D effect - inner border (slightly softer)
  buttonHighlightSoft: '#DFDFDF', // Top/Left inner highlight
  buttonShadowSoft: '#808080',   // Bottom/Right inner shadow
  buttonGradient: '#C0C0C0', // Fallback, actual style in GlobalStyles
  buttonHoverGradient: '#B0B0B0', // Fallback for hover
  cardBackground: '#C0C0C0',
  scrollbarWidth: '16px',
  scrollbarTrack: '#C0C0C0',
  scrollbarThumb: '#808080',
  scrollbarThumbHover: '#666666',
  textSelection: '#000080',
  textSelectionBackground: '#00FFFF',
  checkboxBorder: '#808080',
  checkboxBackground: '#FFFFFF',
  checkmarkColor: '#000000',
  fontFamily: "'MSW98UI', 'MS Sans Serif', 'Tahoma', 'Microsoft Sans Serif', 'Arial', sans-serif",
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
  },
  // Add Mercury/Inception AI theme
  'mercury': {
    primary: '#2E0854',     // Deep purple
    secondary: '#6A1B9A',   // Lighter purple
    gradient: 'linear-gradient(135deg, #2E0854, #6A1B9A)'
  },
  // Add Grok theme
  'grok-beta': {
    primary: '#000000',     // Black
    secondary: '#1DA1F2',   // Twitter blue
    gradient: 'linear-gradient(135deg, #000000, #1DA1F2)'
  },
  'x-ai/grok-beta': {
    primary: '#000000',     // Black
    secondary: '#1DA1F2',   // Twitter blue
    gradient: 'linear-gradient(135deg, #000000, #1DA1F2)'
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
    case 'galaxy': return galaxyTheme;
    case 'sunset': return sunsetTheme;
    case 'cyberpunk': return cyberpunkTheme;
    case 'bubblegum': return bubblegumTheme;
    case 'desert': return desertTheme;
    case 'lakeside': return lakesideTheme;
    case 'retro': return retroTheme;
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
    font-family: ${props => props.theme.fontFamily || "-apple-system, BlinkMacSystemFont, 'San Francisco', 'Segoe UI', Roboto, sans-serif"};
    margin: 0;
    padding: 0;
  }
  
  button, input, textarea, select {
    font-family: ${props => props.theme.fontFamily || "-apple-system, BlinkMacSystemFont, 'San Francisco', 'Segoe UI', Roboto, sans-serif"};
    border-radius: 0px; /* Retro buttons are not rounded */
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

  /* Retro theme specific styles */
  ${props => props.theme.name === 'retro' && `
    body {
      font-family: ${props.theme.fontFamily};
      background-image: url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAYAAADED76LAAAAAXNSR0IArs4c6QAAAERlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAA6ABAAMAAAABAAEAAKACAAQAAAABAAAACKADAAQAAAABAAAACAAAAAAd6oXVAAAAJElEQVQYGWP8z8Dwn4EIwMRAJGAhVgGMUQVEh9F/BgYGdD4qHQB5nwem38x4UgAAAABJRU5ErkJggg==');
      background-repeat: no-repeat;
      background-position: left bottom;
      cursor: default;
    }

    /* Reset border-radius everywhere */
    * {
      border-radius: 0 !important;
      font-family: ${props.theme.fontFamily};
    }
    
    /* Window styling */
    .card, 
    .message-box, 
    .settings-panel,
    .dropdown-menu,
    .modal-content,
    .notification,
    .chat-container,
    .sidebar {
      border: 1px solid;
      border-color: ${props.theme.buttonHighlightLight} ${props.theme.buttonShadowDark} ${props.theme.buttonShadowDark} ${props.theme.buttonHighlightLight};
      box-shadow: 2px 2px 0 0 ${props.theme.buttonShadowDark};
      background-color: ${props.theme.sidebar};
    }
    
    /* Window title bars */
    .card-header,
    .modal-header,
    .settings-header,
    .panel-header {
      background-color: ${props.theme.windowTitleBarBackground};
      color: ${props.theme.windowTitleBarText};
      padding: 2px 4px;
      font-weight: bold;
      text-align: left;
      height: 20px;
    }
    
    /* Standard button styling */
    button, 
    input[type="button"], 
    input[type="submit"], 
    input[type="reset"],
    .button {
      font-family: ${props.theme.fontFamily};
      background-color: ${props.theme.buttonFace};
      color: ${props.theme.buttonText};
      border: 1px solid;
      border-color: ${props.theme.buttonHighlightLight} ${props.theme.buttonShadowDark} ${props.theme.buttonShadowDark} ${props.theme.buttonHighlightLight};
      box-shadow: 1px 1px 0 0 ${props.theme.buttonHighlightSoft} inset, -1px -1px 0 0 ${props.theme.buttonShadowSoft} inset;
      padding: 4px 8px;
      margin: 2px;
      border-radius: 0;
      cursor: default;
      min-width: 75px;
      min-height: 23px;
      text-align: center;
      outline: none;
    }

    /* Pressed button state */
    button:active,
    input[type="button"]:active,
    input[type="submit"]:active,
    input[type="reset"]:active,
    .button:active {
      border-color: ${props.theme.buttonShadowDark} ${props.theme.buttonHighlightLight} ${props.theme.buttonHighlightLight} ${props.theme.buttonShadowDark};
      box-shadow: -1px -1px 0 0 ${props.theme.buttonHighlightSoft} inset, 1px 1px 0 0 ${props.theme.buttonShadowSoft} inset;
      padding: 5px 7px 3px 9px;
    }
    
    /* Form controls (text inputs) */
    input[type="text"],
    input[type="password"],
    input[type="email"],
    input[type="search"],
    textarea,
    .text-input {
      font-family: ${props.theme.fontFamily};
      background-color: ${props.theme.inputBackground};
      border: 1px solid;
      border-color: ${props.theme.buttonShadowDark} ${props.theme.buttonHighlightLight} ${props.theme.buttonHighlightLight} ${props.theme.buttonShadowDark};
      box-shadow: inset 1px 1px 1px ${props.theme.buttonShadowSoft};
      padding: 3px;
      border-radius: 0;
    }
    
    /* Select boxes */
    select {
      appearance: none;
      -webkit-appearance: none;
      -moz-appearance: none;
      padding: 2px 20px 2px 2px;
      border: 1px solid;
      border-color: ${props.theme.buttonShadowDark} ${props.theme.buttonHighlightLight} ${props.theme.buttonHighlightLight} ${props.theme.buttonShadowDark};
      background-color: ${props.theme.buttonFace};
      background-image: url('data:image/svg+xml;utf8,<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 6L8 10L12 6" stroke="black" stroke-width="1"/></svg>');
      background-repeat: no-repeat;
      background-position: right 2px center;
      font-family: ${props.theme.fontFamily};
    }
    
    /* Custom scrollbar */
    ::-webkit-scrollbar {
      width: ${props.theme.scrollbarWidth};
      height: ${props.theme.scrollbarWidth};
    }
    
    ::-webkit-scrollbar-track {
      background: ${props.theme.scrollbarTrack};
      border: 1px solid;
      border-color: ${props.theme.buttonShadowDark} ${props.theme.buttonHighlightLight} ${props.theme.buttonHighlightLight} ${props.theme.buttonShadowDark};
    }
    
    ::-webkit-scrollbar-thumb {
      background: ${props.theme.scrollbarThumb};
      border: 1px solid;
      border-color: ${props.theme.buttonHighlightLight} ${props.theme.buttonShadowDark} ${props.theme.buttonShadowDark} ${props.theme.buttonHighlightLight};
    }
    
    ::-webkit-scrollbar-thumb:hover {
      background: ${props.theme.scrollbarThumbHover};
    }
    
    ::-webkit-scrollbar-button {
      display: block;
      background-color: ${props.theme.buttonFace};
      border: 1px solid;
      border-color: ${props.theme.buttonHighlightLight} ${props.theme.buttonShadowDark} ${props.theme.buttonShadowDark} ${props.theme.buttonHighlightLight};
      height: 16px;
      width: 16px;
    }
    
    ::-webkit-scrollbar-button:vertical:start {
      background-image: url('data:image/svg+xml;utf8,<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 10L8 6L12 10" stroke="black" stroke-width="1"/></svg>');
      background-repeat: no-repeat;
      background-position: center;
    }
    
    ::-webkit-scrollbar-button:vertical:end {
      background-image: url('data:image/svg+xml;utf8,<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 6L8 10L12 6" stroke="black" stroke-width="1"/></svg>');
      background-repeat: no-repeat;
      background-position: center;
    }
    
    /* Checkbox styling */
    input[type="checkbox"],
    input[type="radio"] {
      appearance: none;
      -webkit-appearance: none;
      -moz-appearance: none;
      width: 13px;
      height: 13px;
      border: 1px solid;
      border-color: ${props.theme.buttonShadowDark} ${props.theme.buttonHighlightLight} ${props.theme.buttonHighlightLight} ${props.theme.buttonShadowDark};
      background-color: ${props.theme.checkboxBackground};
      position: relative;
      margin: 3px;
      cursor: default;
    }
    
    input[type="checkbox"]:checked::before {
      content: "✓";
      position: absolute;
      font-size: 11px;
      top: -2px;
      left: 1px;
      color: ${props.theme.checkmarkColor};
    }
    
    input[type="radio"] {
      border-radius: 50% !important;
    }
    
    input[type="radio"]:checked::before {
      content: "";
      position: absolute;
      top: 3px;
      left: 3px;
      width: 5px;
      height: 5px;
      border-radius: 50%;
      background-color: ${props.theme.checkmarkColor};
    }
    
    /* Text selection */
    ::selection {
      color: ${props.theme.textSelection};
      background: ${props.theme.textSelectionBackground};
    }
    
    /* Settings panels - radio buttons and sliders */
    .radio-group {
      margin: 5px 0;
    }
    
    .slider {
      border: 1px solid;
      border-color: ${props.theme.buttonShadowDark} ${props.theme.buttonHighlightLight} ${props.theme.buttonHighlightLight} ${props.theme.buttonShadowDark} !important;
      background-color: ${props.theme.buttonFace} !important;
    }
    
    .slider::before {
      border-color: ${props.theme.buttonHighlightLight} ${props.theme.buttonShadowDark} ${props.theme.buttonShadowDark} ${props.theme.buttonHighlightLight} !important;
      background-color: ${props.theme.buttonFace} !important;
    }
    
    /* Make UI modals more Windows 98-like */
    .modal-content {
      border-radius: 0 !important;
      padding: 2px !important;
      background-color: ${props.theme.buttonFace} !important;
    }
    
    /* Specific message bubbles */
    .message-user {
      background-color: ${props.theme.messageUser} !important;
      border: 1px solid;
      border-color: ${props.theme.buttonShadowDark} ${props.theme.buttonHighlightLight} ${props.theme.buttonHighlightLight} ${props.theme.buttonShadowDark};
    }
    
    .message-ai {
      background-color: ${props.theme.messageAi} !important;
      border: 1px solid;
      border-color: ${props.theme.buttonShadowDark} ${props.theme.buttonHighlightLight} ${props.theme.buttonHighlightLight} ${props.theme.buttonShadowDark};
    }
    
    /* App-specific elements */
    .settings-container, .chat-container {
      border: 2px solid;
      border-color: ${props.theme.buttonHighlightLight} ${props.theme.buttonShadowDark} ${props.theme.buttonShadowDark} ${props.theme.buttonHighlightLight};
    }
    
    /* Make toggle switches look like classic checkboxes */
    .toggle-switch {
      background: ${props.theme.buttonFace} !important;
      border: 1px solid !important;
      border-color: ${props.theme.buttonShadowDark} ${props.theme.buttonHighlightLight} ${props.theme.buttonHighlightLight} ${props.theme.buttonShadowDark} !important;
      border-radius: 0 !important;
    }
    
    /* Add start button & taskbar styling - app-specific implementation may vary */
    .taskbar {
      background-color: ${props.theme.buttonFace};
      border-top: 1px solid ${props.theme.buttonHighlightLight};
      height: 28px;
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
    }
    
    .start-button {
      background-color: ${props.theme.buttonFace};
      border: 1px solid;
      border-color: ${props.theme.buttonHighlightLight} ${props.theme.buttonShadowDark} ${props.theme.buttonShadowDark} ${props.theme.buttonHighlightLight};
      padding: 2px 8px;
      margin: 2px;
      display: inline-flex;
      align-items: center;
    }
    
    .windows-logo {
      margin-right: 5px;
    }
  `}
`;