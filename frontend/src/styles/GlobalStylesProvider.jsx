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
        case 'relaxed': return '1.75';
        case 'loose': return '2.2';
        default: return '1.25';
      }
    }};

    --transition-speed: ${props => props.reducedMotion ? '0s' : '0.3s'};

    --message-spacing: ${props => {
      switch(props.messageSpacing) {
        case 'compact': return '10px';
        case 'spacious': return '85px';
        default: return '42.5px';
      }
    }};

    --bubble-radius: ${props => {
      switch(props.bubbleStyle) {
        case 'classic': return '8px';
        case 'minimal': return '0';
        default: return '18px';
      }
    }};

    /* Theme-driven color tokens (resolved theme is passed via $appTheme) */
    --bubble-user-bg: ${props => props.$appTheme?.messageUser || 'rgba(255, 255, 255, 0.8)'};
    --bubble-assistant-bg: ${props => props.$appTheme?.messageAi || 'rgba(240, 244, 248, 0.8)'};
    --bubble-border-color: ${props => props.$appTheme?.border || 'rgba(0, 0, 0, 0.08)'};
    --bubble-shadow-color: ${props => props.$appTheme?.shadow || 'rgba(0, 0, 0, 0.06)'};
    --bubble-user-pointer: ${props => props.$appTheme?.messageUser || 'rgba(255, 255, 255, 0.8)'};

    --theme-text: ${props => props.$appTheme?.text || '#1d1d1f'};
    --theme-text-secondary: ${props => props.$appTheme?.textSecondary || props.$appTheme?.text || '#6e6e73'};
    --theme-primary: ${props => props.$appTheme?.primary || '#007AFF'};
    --theme-border: ${props => props.$appTheme?.border || 'rgba(0,0,0,0.08)'};
    --theme-sidebar: ${props => props.$appTheme?.sidebar || '#ffffff'};
    --theme-chat: ${props => props.$appTheme?.chat || '#ffffff'};
    --theme-card-bg: ${props => props.$appTheme?.cardBackground || props.$appTheme?.chat || '#ffffff'};
    --theme-input-bg: ${props => props.$appTheme?.inputBackground || '#ffffff'};
    --theme-code-block-bg: ${props => props.$appTheme?.codeBlockBg || (props.$appTheme?.isDark ? '#1a1a1e' : '#f7f8fa')};
    --theme-code-block-header-bg: ${props => props.$appTheme?.codeBlockHeaderBg || (props.$appTheme?.isDark ? '#232328' : '#eff1f5')};
    --theme-code-block-border: ${props => props.$appTheme?.codeBlockBorder || props.$appTheme?.border || 'rgba(0,0,0,0.08)'};
    --theme-inline-code-bg: ${props => props.$appTheme?.inlineCodeBg || (props.$appTheme?.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)')};
    --theme-accent-color: ${props => props.$appTheme?.accentColor || props.$appTheme?.primary || '#007AFF'};
    --theme-accent-surface: ${props => props.$appTheme?.accentSurface || 'rgba(0,122,255,0.1)'};
  }

  body {
    font-family: ${props => props.$appTheme?.name === 'retro' ? "'MSW98UI', 'MS Sans Serif', 'Tahoma', sans-serif" : 'var(--font-family)'};
    font-size: ${props => props.$appTheme?.name === 'retro' ? '12px' : 'var(--font-size)'};
    line-height: ${props => props.$appTheme?.name === 'retro' ? '1.2' : 'var(--line-height)'};
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
  ${props => props.$appTheme?.name === 'retro' && `
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

/**
 * GlobalStylesProvider
 *
 * Accepts either:
 *   - `settings` (back-compat): will read `settings.theme` (string name) and resolve via getTheme.
 *     NOTE: the previous version passed the raw string into styled-components'
 *     `theme` prop which clobbers the real ThemeProvider context. We now pass
 *     the resolved theme object via `$appTheme` so the real theme context
 *     is preserved and :root variables get the correct values.
 *   - `appTheme` (preferred): the already-resolved theme object from App.jsx
 */
const GlobalStylesProvider = ({ settings, appTheme, children }) => {
  // Prefer explicit appTheme prop; fall back to settings.theme (may be an
  // object already, or a string name we leave for caller to have resolved).
  const resolvedTheme =
    appTheme ||
    (settings && typeof settings.theme === 'object' ? settings.theme : null);

  return (
    <>
      <GlobalStyle
        fontSize={settings?.fontSize || 'medium'}
        fontFamily={settings?.fontFamily || 'system'}
        lineSpacing={settings?.lineSpacing || 'normal'}
        reducedMotion={settings?.reducedMotion || false}
        highContrast={settings?.highContrast || false}
        bubbleStyle={settings?.bubbleStyle || 'minimal'}
        messageSpacing={settings?.messageSpacing || 'comfortable'}
        $appTheme={resolvedTheme}
      />
      {children}
    </>
  );
};

export default GlobalStylesProvider;
