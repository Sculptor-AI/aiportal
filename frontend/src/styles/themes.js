import { createGlobalStyle } from 'styled-components';

/**
 * Theme token schema (every theme should provide these):
 *
 *  Identity:
 *    name, isDark
 *
 *  Canvas:
 *    background             - body background (gradient/image/solid)
 *    backgroundImage?       - photo URL for themes backed by a landscape photo.
 *                             Rendered beneath `background` with a cover fit.
 *    backgroundAttachment?  - for fixed backgrounds
 *    sidebar                - sidebar surface
 *    chat                   - chat surface (app shell background)
 *
 *  Text:
 *    text                   - primary text
 *    textSecondary          - secondary / muted text
 *
 *  Borders & elevation:
 *    border                 - default border color
 *    shadow                 - shadow tint
 *
 *  Messages:
 *    messageUser            - user bubble background
 *    messageAi              - assistant bubble background
 *    hover                  - generic hover state
 *
 *  Brand:
 *    primary                - solid brand color (avoid gradients here; gradients break alpha math)
 *    primaryForeground      - text/icon on top of primary
 *    primaryGradient        - optional gradient for hero CTAs
 *    secondary              - complementary solid color
 *    accentColor            - explicit accent (defaults to primary)
 *    accentBackground       - solid or gradient for accent pills
 *    accentText             - text on accent background
 *    accentSurface          - ~14% alpha accent tint for subtle highlights
 *    accentGradient?        - decorative gradient (pride band, etc.)
 *
 *  Glass + inputs:
 *    glassBlur, glassEffect
 *    inputBackground
 *    buttonGradient, buttonHoverGradient
 *
 *  Surface variants:
 *    cardBackground         - card / modal surface
 *    codeBlockBg            - code block body
 *    codeBlockHeaderBg      - code block header strip
 *    codeBlockBorder        - code block border
 *    inlineCodeBg           - inline `code` background
 *
 *  Optional flourishes:
 *    backgroundOverlay      - decorative overlay painted above `background` in GlobalStyles
 *    fontFamily             - theme-specific font family (e.g. retro)
 */

// ----------------------------------------------------------------------------
// LIGHT — Refined Apple-inspired neutral
// ----------------------------------------------------------------------------
export const lightTheme = {
  name: 'light',
  isDark: false,
  background: 'linear-gradient(160deg, #f5f5f7 0%, #eeeff2 100%)',
  sidebar: '#ffffff',
  chat: '#ffffff',
  text: '#1d1d1f',
  textSecondary: '#6e6e73',
  border: 'rgba(0, 0, 0, 0.08)',
  shadow: 'rgba(0, 0, 0, 0.05)',
  messageUser: 'rgba(255, 255, 255, 0.9)',
  messageAi: 'rgba(236, 246, 254, 0.9)',
  hover: 'rgba(0, 0, 0, 0.04)',
  primary: '#007AFF',
  primaryForeground: '#ffffff',
  primaryGradient: 'linear-gradient(145deg, #007AFF, #1E90FF)',
  secondary: '#5AC8FA',
  accentColor: '#007AFF',
  accentBackground: '#007AFF',
  accentText: '#ffffff',
  accentSurface: 'rgba(0, 122, 255, 0.08)',
  glassBlur: '10px',
  glassEffect: 'blur(10px) saturate(180%)',
  inputBackground: '#ffffff',
  buttonGradient: 'linear-gradient(145deg, #007AFF, #1E90FF)',
  buttonHoverGradient: 'linear-gradient(145deg, #1E90FF, #007AFF)',
  cardBackground: '#ffffff',
  codeBlockBg: '#f7f8fa',
  codeBlockHeaderBg: '#eff1f5',
  codeBlockBorder: 'rgba(0, 0, 0, 0.08)',
  inlineCodeBg: 'rgba(0, 0, 0, 0.05)',
};

// ----------------------------------------------------------------------------
// DARK — Tuned slate, optimized for long-form reading
// ----------------------------------------------------------------------------
export const darkTheme = {
  name: 'dark',
  isDark: true,
  background: 'linear-gradient(145deg, #141414 0%, #1a1a1c 100%)',
  sidebar: '#1c1c1e',
  chat: '#1c1c1e',
  text: '#f0f2f5',
  textSecondary: '#98989f',
  border: 'rgba(255, 255, 255, 0.08)',
  shadow: 'rgba(0, 0, 0, 0.4)',
  messageUser: 'rgba(48, 48, 52, 0.85)',
  messageAi: 'rgba(35, 45, 60, 0.85)',
  hover: 'rgba(255, 255, 255, 0.06)',
  primary: '#0A84FF',
  primaryForeground: '#ffffff',
  primaryGradient: 'linear-gradient(145deg, #0A84FF, #38B0FF)',
  secondary: '#64D2FF',
  accentColor: '#0A84FF',
  accentBackground: '#0A84FF',
  accentText: '#ffffff',
  accentSurface: 'rgba(10, 132, 255, 0.14)',
  glassBlur: '10px',
  glassEffect: 'blur(10px) saturate(180%)',
  inputBackground: '#252527',
  buttonGradient: 'linear-gradient(145deg, #0A84FF, #38B0FF)',
  buttonHoverGradient: 'linear-gradient(145deg, #38B0FF, #0A84FF)',
  cardBackground: 'rgba(40, 40, 44, 0.75)',
  codeBlockBg: '#151518',
  codeBlockHeaderBg: '#202024',
  codeBlockBorder: 'rgba(255, 255, 255, 0.06)',
  inlineCodeBg: 'rgba(255, 255, 255, 0.08)',
};

// ----------------------------------------------------------------------------
// OLED — Absolute black minimalism
// ----------------------------------------------------------------------------
export const oledTheme = {
  name: 'oled',
  isDark: true,
  background: '#000000',
  sidebar: '#000000',
  chat: '#000000',
  text: '#f0f2f5',
  textSecondary: '#808086',
  border: 'rgba(255, 255, 255, 0.07)',
  shadow: 'rgba(0, 0, 0, 0.6)',
  messageUser: 'rgba(24, 24, 24, 0.95)',
  messageAi: 'rgba(14, 14, 14, 0.95)',
  hover: 'rgba(255, 255, 255, 0.05)',
  primary: '#0A84FF',
  primaryForeground: '#ffffff',
  primaryGradient: 'linear-gradient(145deg, #0A84FF, #38B0FF)',
  secondary: '#64D2FF',
  accentColor: '#0A84FF',
  accentBackground: '#0A84FF',
  accentText: '#ffffff',
  accentSurface: 'rgba(10, 132, 255, 0.12)',
  glassBlur: '10px',
  glassEffect: 'blur(10px) saturate(120%)',
  inputBackground: '#0d0d0d',
  buttonGradient: 'linear-gradient(145deg, #0A84FF, #38B0FF)',
  buttonHoverGradient: 'linear-gradient(145deg, #38B0FF, #0A84FF)',
  cardBackground: 'rgba(12, 12, 12, 0.9)',
  codeBlockBg: '#070707',
  codeBlockHeaderBg: '#0f0f0f',
  codeBlockBorder: 'rgba(255, 255, 255, 0.08)',
  inlineCodeBg: 'rgba(255, 255, 255, 0.07)',
};

// ----------------------------------------------------------------------------
// OCEAN — Cinematic deep-sea photograph with god-rays, glass chrome floats.
//
// Design intent:
//   - Full-bleed landscape photo anchored to the viewport with a soft gradient
//     veil for legibility of UI chrome.
//   - `appShell: transparent` + `chat: transparent` let the photo read
//     continuously across the app; sidebar is a whisper of tint so it feels
//     like a single frosted pane over the water.
//   - Interactive elements (mic / send / pills) use a luminous cyan-to-sapphire
//     gradient tuned to the sunbeams in the photograph.
// ----------------------------------------------------------------------------
export const oceanTheme = {
  name: 'ocean',
  isDark: true,
  appShell: 'transparent',
  backgroundImage: "url('/images/themes/ocean.jpg')",
  background:
    // Subtle cool-blue tint + gentle vignette. Keeps the photo's luminance
    // so the sunbeams read through every surface, including the sidebar.
    'radial-gradient(ellipse 140% 100% at 50% 0%, rgba(10, 30, 60, 0.05) 0%, rgba(4, 14, 32, 0.28) 70%, rgba(2, 8, 22, 0.42) 100%)',
  backgroundAttachment: 'fixed',
  sidebar: 'rgba(3, 12, 28, 0.28)',
  chat: 'transparent',
  text: '#eaf4ff',
  textSecondary: '#9cbddc',
  border: 'rgba(125, 195, 235, 0.14)',
  shadow: 'rgba(0, 10, 28, 0.55)',
  messageUser: 'rgba(14, 34, 58, 0.55)',
  messageAi: 'rgba(6, 18, 38, 0.5)',
  hover: 'rgba(125, 211, 252, 0.12)',
  primary: '#38bdf8',
  primaryForeground: '#021428',
  primaryGradient: 'linear-gradient(135deg, #7dd3fc 0%, #38bdf8 45%, #0284c7 100%)',
  secondary: '#7dd3fc',
  accentColor: '#38bdf8',
  accentBackground: '#38bdf8',
  accentText: '#021428',
  accentSurface: 'rgba(56, 189, 248, 0.16)',
  accentGradient: 'linear-gradient(90deg, #bae6fd 0%, #38bdf8 50%, #0369a1 100%)',
  glassBlur: '22px',
  glassEffect: 'blur(22px) saturate(150%)',
  inputBackground: 'rgba(8, 22, 44, 0.5)',
  buttonGradient: 'linear-gradient(135deg, #7dd3fc 0%, #0284c7 100%)',
  buttonHoverGradient: 'linear-gradient(135deg, #0284c7 0%, #7dd3fc 100%)',
  cardBackground: 'rgba(8, 22, 44, 0.55)',
  codeBlockBg: 'rgba(3, 12, 26, 0.72)',
  codeBlockHeaderBg: 'rgba(5, 18, 36, 0.78)',
  codeBlockBorder: 'rgba(125, 211, 252, 0.18)',
  inlineCodeBg: 'rgba(125, 211, 252, 0.14)',
};

// ----------------------------------------------------------------------------
// FOREST — Dusky evergreen photograph, mossy light, glass chrome.
//
// Design intent:
//   - Full-bleed photograph of an old-growth temperate rainforest at golden
//     hour. A warm earth-tone veil preserves the amber backlight while keeping
//     UI chrome legible.
//   - Accent is a soft moss/lime that echoes the ferns and lichen, not a
//     harsh grass green. Buttons use a moss-to-amber gradient hinting at the
//     light shafts in the canopy.
// ----------------------------------------------------------------------------
export const forestTheme = {
  name: 'forest',
  isDark: true,
  appShell: 'transparent',
  backgroundImage: "url('/images/themes/forest.jpg')",
  background:
    // Warm moss tint that lets the amber backlight read while protecting UI.
    'radial-gradient(ellipse 140% 100% at 50% 0%, rgba(14, 28, 18, 0.06) 0%, rgba(8, 18, 12, 0.32) 70%, rgba(4, 12, 8, 0.48) 100%)',
  backgroundAttachment: 'fixed',
  sidebar: 'rgba(6, 16, 10, 0.30)',
  chat: 'transparent',
  text: '#f0f4e8',
  textSecondary: '#a8bfa0',
  border: 'rgba(174, 213, 129, 0.14)',
  shadow: 'rgba(0, 0, 0, 0.5)',
  messageUser: 'rgba(22, 40, 26, 0.55)',
  messageAi: 'rgba(14, 26, 18, 0.5)',
  hover: 'rgba(174, 213, 129, 0.12)',
  primary: '#9ccc65',
  primaryForeground: '#0a1408',
  primaryGradient: 'linear-gradient(135deg, #c5e1a5 0%, #9ccc65 45%, #689f38 100%)',
  secondary: '#e2b169',
  accentColor: '#9ccc65',
  accentBackground: '#9ccc65',
  accentText: '#0a1408',
  accentSurface: 'rgba(156, 204, 101, 0.16)',
  accentGradient: 'linear-gradient(90deg, #9ccc65 0%, #d4b56a 55%, #e2b169 100%)',
  glassBlur: '22px',
  glassEffect: 'blur(22px) saturate(145%)',
  inputBackground: 'rgba(12, 24, 16, 0.5)',
  buttonGradient: 'linear-gradient(135deg, #c5e1a5 0%, #689f38 100%)',
  buttonHoverGradient: 'linear-gradient(135deg, #689f38 0%, #c5e1a5 100%)',
  cardBackground: 'rgba(12, 24, 16, 0.55)',
  codeBlockBg: 'rgba(6, 14, 10, 0.72)',
  codeBlockHeaderBg: 'rgba(10, 20, 14, 0.78)',
  codeBlockBorder: 'rgba(174, 213, 129, 0.18)',
  inlineCodeBg: 'rgba(174, 213, 129, 0.14)',
};

// ----------------------------------------------------------------------------
// SUNSET — Editorial dusk photograph, warm afterglow, glass chrome.
//
// Design intent:
//   - Full-bleed coastal dusk photograph: magenta/violet sky, warm coral
//     horizon, reflective water. A plum-to-amber veil keeps chrome legible
//     against the bright horizon band while letting the sky colors glow.
//   - Accent is a warm coral that matches the afterglow. Buttons use a
//     coral-to-magenta gradient echoing the painterly clouds.
// ----------------------------------------------------------------------------
export const sunsetTheme = {
  name: 'sunset',
  isDark: true,
  appShell: 'transparent',
  backgroundImage: "url('/images/themes/sunset.jpg')",
  background:
    // Plum undertint centred low for legibility over the bright horizon;
    // fades out near the top so the sky glow stays radiant.
    'radial-gradient(ellipse 140% 80% at 50% 110%, rgba(30, 10, 28, 0.55) 0%, rgba(30, 12, 28, 0.22) 60%, transparent 95%)',
  backgroundAttachment: 'fixed',
  sidebar: 'rgba(22, 8, 24, 0.28)',
  chat: 'transparent',
  text: '#fff1e4',
  textSecondary: '#e4b8a0',
  border: 'rgba(255, 183, 140, 0.18)',
  shadow: 'rgba(44, 14, 30, 0.45)',
  messageUser: 'rgba(52, 22, 38, 0.55)',
  messageAi: 'rgba(30, 12, 26, 0.5)',
  hover: 'rgba(255, 140, 100, 0.12)',
  primary: '#ff7a59',
  primaryForeground: '#2a0d1a',
  primaryGradient: 'linear-gradient(135deg, #ffb88c 0%, #ff7a59 45%, #c94f7c 100%)',
  secondary: '#ffb88c',
  accentColor: '#ff7a59',
  accentBackground: '#ff7a59',
  accentText: '#2a0d1a',
  accentSurface: 'rgba(255, 122, 89, 0.16)',
  accentGradient: 'linear-gradient(90deg, #ffc795 0%, #ff7a59 50%, #c94f7c 100%)',
  glassBlur: '22px',
  glassEffect: 'blur(22px) saturate(145%)',
  inputBackground: 'rgba(32, 14, 28, 0.5)',
  buttonGradient: 'linear-gradient(135deg, #ffb88c 0%, #c94f7c 100%)',
  buttonHoverGradient: 'linear-gradient(135deg, #c94f7c 0%, #ffb88c 100%)',
  cardBackground: 'rgba(32, 14, 28, 0.55)',
  codeBlockBg: 'rgba(20, 8, 18, 0.72)',
  codeBlockHeaderBg: 'rgba(30, 12, 24, 0.78)',
  codeBlockBorder: 'rgba(255, 183, 140, 0.18)',
  inlineCodeBg: 'rgba(255, 183, 140, 0.14)',
};

// ----------------------------------------------------------------------------
// SUNRISE — Pastel dawn photograph, cool mist, warm horizon glow.
//
// Design intent:
//   - Full-bleed dawn photograph: pale lavender sky, butter-yellow horizon,
//     misty lake reflection. Palette runs cooler than sunset — no magentas,
//     no heavy orange. Pastel and optimistic.
//   - Light theme (isDark: false) because the photo itself is luminous pastel.
//     The veil is soft and warm, preserving the dawn glow.
//   - Accent is a soft golden amber tuned to the first light over the ridge.
// ----------------------------------------------------------------------------
export const sunriseTheme = {
  name: 'sunrise',
  isDark: false,
  appShell: 'transparent',
  backgroundImage: "url('/images/themes/sunrise.jpg')",
  background:
    // Cool pastel wash with a warm highlight at the horizon — keeps the
    // photo's dawn light radiant while helping dark text stay legible.
    'radial-gradient(ellipse 140% 100% at 50% 100%, rgba(255, 230, 200, 0.22) 0%, rgba(255, 244, 224, 0.10) 60%, rgba(212, 190, 220, 0.15) 100%)',
  backgroundAttachment: 'fixed',
  sidebar: 'rgba(255, 246, 232, 0.35)',
  chat: 'transparent',
  text: '#2d1f14',
  textSecondary: '#7d5a3e',
  border: 'rgba(194, 124, 66, 0.18)',
  shadow: 'rgba(120, 82, 44, 0.14)',
  messageUser: 'rgba(255, 250, 240, 0.75)',
  messageAi: 'rgba(255, 240, 220, 0.58)',
  hover: 'rgba(212, 148, 82, 0.12)',
  primary: '#d48940',
  primaryForeground: '#ffffff',
  primaryGradient: 'linear-gradient(135deg, #f4c987 0%, #d48940 50%, #a8621f 100%)',
  secondary: '#e9b88c',
  accentColor: '#d48940',
  accentBackground: '#d48940',
  accentText: '#ffffff',
  accentSurface: 'rgba(212, 137, 64, 0.14)',
  accentGradient: 'linear-gradient(90deg, #b4c7e7 0%, #f4c987 55%, #d48940 100%)',
  glassBlur: '24px',
  glassEffect: 'blur(24px) saturate(150%)',
  inputBackground: 'rgba(255, 248, 238, 0.55)',
  buttonGradient: 'linear-gradient(135deg, #f4c987 0%, #a8621f 100%)',
  buttonHoverGradient: 'linear-gradient(135deg, #a8621f 0%, #f4c987 100%)',
  cardBackground: 'rgba(255, 248, 238, 0.55)',
  codeBlockBg: 'rgba(250, 238, 220, 0.72)',
  codeBlockHeaderBg: 'rgba(244, 226, 202, 0.80)',
  codeBlockBorder: 'rgba(194, 124, 66, 0.22)',
  inlineCodeBg: 'rgba(212, 148, 82, 0.14)',
};

// ----------------------------------------------------------------------------
// LAKESIDE — Bliss Hall at golden hour.
//
// Design intent:
//   - Inspired by Lakeside School's identity: deep maroon brick architecture
//     (Bliss Hall, 1930) trimmed in white, the towering sequoias on the quad,
//     and the campus's signature maroon-and-gold rhododendron hybrid. The
//     flower mark in the sidebar is the visual anchor for the whole palette.
//   - Primary is the flower's deep oxblood maroon, used for hero CTAs and
//     brand surfaces. Secondary / accent is a warm pale gold (sun on brick),
//     reserved for highlights, subtle glints, and hover halos.
//   - Background is a layered dusk: warm brick glow in the upper-right, a
//     deep oxblood pool in the lower-left, over a near-black wine base.
//     Gradient-only (no photo) so it loads instantly and reads cohesively
//     with the maroon mark at any size.
// ----------------------------------------------------------------------------
export const lakesideTheme = {
  name: 'lakeside',
  isDark: true,
  appShell: 'transparent',
  background:
    // A radiant brick bloom from the upper-right (Bliss Hall catching the sunset)...
    'radial-gradient(ellipse 110% 85% at 100% -10%, rgba(200, 72, 96, 0.55) 0%, rgba(168, 50, 70, 0.18) 45%, transparent 70%),' +
    // ...a warm rose-gold rim hugging the right edge...
    'radial-gradient(ellipse 80% 70% at 115% 50%, rgba(232, 196, 138, 0.16) 0%, transparent 60%),' +
    // ...a deep oxblood pool in the lower-left (the quad in shadow)...
    'radial-gradient(ellipse 95% 75% at -5% 105%, rgba(80, 20, 32, 0.78) 0%, rgba(50, 14, 22, 0.30) 50%, transparent 75%),' +
    // ...over a warm wine base — never pure black.
    'linear-gradient(160deg, #2a0e16 0%, #240c14 50%, #1d0a12 100%)',
  backgroundAttachment: 'fixed',
  sidebar: 'rgba(28, 12, 18, 0.78)',
  chat: 'rgba(22, 10, 14, 0.55)',
  text: '#f7ead6',
  textSecondary: '#c2a487',
  border: 'rgba(232, 196, 138, 0.14)',
  shadow: 'rgba(8, 0, 4, 0.55)',
  messageUser: 'rgba(74, 24, 36, 0.78)',
  messageAi: 'rgba(28, 12, 18, 0.82)',
  hover: 'rgba(232, 196, 138, 0.10)',
  primary: '#a83246',
  primaryForeground: '#fff4e2',
  primaryGradient: 'linear-gradient(145deg, #c84860 0%, #a83246 50%, #7a2a36 100%)',
  secondary: '#e8c48a',
  accentColor: '#e8c48a',
  accentBackground: '#e8c48a',
  accentText: '#1a0a10',
  accentSurface: 'rgba(232, 196, 138, 0.14)',
  accentGradient: 'linear-gradient(90deg, #7a2a36 0%, #a83246 45%, #e8c48a 100%)',
  glassBlur: '14px',
  glassEffect: 'blur(14px) saturate(150%)',
  inputBackground: 'rgba(34, 14, 20, 0.92)',
  buttonGradient: 'linear-gradient(145deg, #c84860 0%, #7a2a36 100%)',
  buttonHoverGradient: 'linear-gradient(145deg, #7a2a36 0%, #c84860 100%)',
  cardBackground: 'rgba(34, 14, 20, 0.86)',
  codeBlockBg: '#14070c',
  codeBlockHeaderBg: '#1d0c12',
  codeBlockBorder: 'rgba(232, 196, 138, 0.16)',
  inlineCodeBg: 'rgba(232, 196, 138, 0.12)',
};

// ----------------------------------------------------------------------------
// PRIDE — Flag as an edge-to-edge aurora; chrome dissolves into it.
//
// Design intent:
//   - Aurora blooms anchored at the viewport CORNERS so every edge — including
//     the top behind the header — is already colored. No dark "header strip".
//   - Sidebar is a whisper of tint (0.22 alpha) so the aurora bleeds fully
//     through it. Sidebar and chat feel like one continuous frosted pane.
//   - Interactive elements (mic / send / pills) use a SOFT solid pink accent,
//     not rainbow. The flag gradient is preserved only in `accentGradient`
//     for rare decorative uses (onboarding swatch).
// ----------------------------------------------------------------------------
export const prideTheme = {
  name: 'pride',
  isDark: true,
  appShell: 'transparent',
  background:
    // Color blobs fully covering every edge of the canvas so the top looks
    // identical across the whole width (no dark "header strip" vs tinted sidebar).
    'radial-gradient(ellipse 60% 50% at 50% -5%, rgba(190, 60, 160, 0.30) 0%, transparent 62%),' + // center-top purple/pink fill
    'radial-gradient(ellipse 75% 60% at 85% -10%, rgba(228, 3, 3, 0.40) 0%, transparent 65%),' +
    'radial-gradient(ellipse 70% 55% at 105% 30%, rgba(255, 140, 0, 0.34) 0%, transparent 62%),' +
    'radial-gradient(ellipse 80% 55% at 95% 60%, rgba(255, 210, 0, 0.20) 0%, transparent 62%),' +
    'radial-gradient(ellipse 85% 60% at 35% 108%, rgba(0, 128, 38, 0.34) 0%, transparent 62%),' +
    'radial-gradient(ellipse 75% 60% at -8% 62%, rgba(0, 77, 255, 0.38) 0%, transparent 62%),' +
    'radial-gradient(ellipse 70% 55% at -5% -5%, rgba(117, 7, 135, 0.42) 0%, transparent 62%),' +
    'linear-gradient(160deg, #1a1428 0%, #1a1326 50%, #1d1322 100%)',
  backgroundAttachment: 'fixed',
  sidebar: 'rgba(14, 10, 22, 0.22)',
  chat: 'transparent',
  text: '#f4f1fa',
  textSecondary: '#c4bcd4',
  border: 'rgba(255, 255, 255, 0.08)',
  shadow: 'rgba(0, 0, 0, 0.45)',
  messageUser: 'rgba(32, 26, 44, 0.6)',
  messageAi: 'rgba(22, 18, 32, 0.52)',
  hover: 'rgba(255, 255, 255, 0.06)',
  primary: '#ff4d78',
  primaryForeground: '#ffffff',
  primaryGradient: 'linear-gradient(135deg, #ff4d78 0%, #c04dff 100%)',
  secondary: '#c04dff',
  accentColor: '#ff4d78',
  accentBackground: '#ff4d78',
  accentText: '#ffffff',
  accentSurface: 'rgba(255, 77, 120, 0.14)',
  accentGradient:
    'linear-gradient(90deg, #e40303 0%, #ff8c00 20%, #ffed00 40%, #008026 60%, #004dff 80%, #750787 100%)',
  glassBlur: '24px',
  glassEffect: 'blur(24px) saturate(140%)',
  inputBackground: 'rgba(22, 18, 32, 0.45)',
  buttonGradient: 'linear-gradient(135deg, #ff4d78 0%, #c04dff 100%)',
  buttonHoverGradient: 'linear-gradient(135deg, #c04dff 0%, #ff4d78 100%)',
  cardBackground: 'rgba(22, 18, 32, 0.55)',
  codeBlockBg: 'rgba(14, 10, 22, 0.75)',
  codeBlockHeaderBg: 'rgba(22, 16, 32, 0.8)',
  codeBlockBorder: 'rgba(255, 255, 255, 0.08)',
  inlineCodeBg: 'rgba(255, 255, 255, 0.09)',
};

// ----------------------------------------------------------------------------
// TRANS — Sky-meets-blossom aurora, chrome dissolves into it.
// Same design language as Pride: edge-to-edge aurora, whisper-thin sidebar,
// soft solid sky-blue accent on interactive elements.
// ----------------------------------------------------------------------------
export const transTheme = {
  name: 'trans',
  isDark: false,
  appShell: 'transparent',
  background:
    // Horizontal top fill so sidebar and chat share the same top tint
    'radial-gradient(ellipse 60% 50% at 50% -5%, rgba(168, 198, 230, 0.40) 0%, transparent 62%),' +
    'radial-gradient(ellipse 80% 65% at -5% -10%, rgba(91, 206, 250, 0.65) 0%, transparent 65%),' +
    'radial-gradient(ellipse 75% 60% at 105% 20%, rgba(245, 169, 184, 0.58) 0%, transparent 62%),' +
    'radial-gradient(ellipse 95% 65% at 50% 110%, rgba(91, 206, 250, 0.45) 0%, transparent 65%),' +
    'radial-gradient(ellipse 75% 60% at 15% 80%, rgba(245, 169, 184, 0.48) 0%, transparent 62%),' +
    'linear-gradient(160deg, #fafcff 0%, #fff5f8 100%)',
  backgroundAttachment: 'fixed',
  sidebar: 'rgba(255, 252, 253, 0.3)',
  chat: 'transparent',
  text: '#2a2430',
  textSecondary: '#74697e',
  border: 'rgba(91, 131, 180, 0.14)',
  shadow: 'rgba(91, 206, 250, 0.12)',
  messageUser: 'rgba(255, 255, 255, 0.7)',
  messageAi: 'rgba(255, 255, 255, 0.5)',
  hover: 'rgba(91, 206, 250, 0.1)',
  primary: '#3ea8d4',
  primaryForeground: '#ffffff',
  primaryGradient: 'linear-gradient(135deg, #5BCEFA 0%, #3ea8d4 100%)',
  secondary: '#e68fa3',
  accentColor: '#3ea8d4',
  accentBackground: '#3ea8d4',
  accentText: '#ffffff',
  accentSurface: 'rgba(62, 168, 212, 0.14)',
  accentGradient:
    'linear-gradient(90deg, #5BCEFA 0%, #F5A9B8 50%, #ffffff 100%)',
  glassBlur: '26px',
  glassEffect: 'blur(26px) saturate(160%)',
  inputBackground: 'rgba(255, 255, 255, 0.55)',
  buttonGradient: 'linear-gradient(135deg, #5BCEFA 0%, #3ea8d4 100%)',
  buttonHoverGradient: 'linear-gradient(135deg, #3ea8d4 0%, #5BCEFA 100%)',
  cardBackground: 'rgba(255, 255, 255, 0.55)',
  codeBlockBg: 'rgba(245, 249, 253, 0.65)',
  codeBlockHeaderBg: 'rgba(230, 240, 249, 0.7)',
  codeBlockBorder: 'rgba(91, 131, 180, 0.18)',
  inlineCodeBg: 'rgba(91, 206, 250, 0.14)',
};

// ----------------------------------------------------------------------------
// BISEXUAL — Plum-indigo aurora, chrome dissolves into it.
// ----------------------------------------------------------------------------
export const bisexualTheme = {
  name: 'bisexual',
  isDark: true,
  appShell: 'transparent',
  background:
    // Horizontal top fill so sidebar and chat share the same top tint
    'radial-gradient(ellipse 65% 55% at 50% -5%, rgba(155, 79, 150, 0.36) 0%, transparent 62%),' +
    'radial-gradient(ellipse 80% 65% at -5% -10%, rgba(214, 2, 112, 0.44) 0%, transparent 62%),' +
    'radial-gradient(ellipse 85% 70% at 105% 108%, rgba(0, 56, 168, 0.48) 0%, transparent 62%),' +
    'radial-gradient(ellipse 70% 60% at 55% 45%, rgba(155, 79, 150, 0.32) 0%, transparent 65%),' +
    'linear-gradient(160deg, #130824 0%, #17092a 100%)',
  backgroundAttachment: 'fixed',
  sidebar: 'rgba(16, 8, 26, 0.25)',
  chat: 'transparent',
  text: '#f4e8ff',
  textSecondary: '#bdadd4',
  border: 'rgba(214, 2, 112, 0.16)',
  shadow: 'rgba(0, 0, 0, 0.5)',
  messageUser: 'rgba(52, 14, 40, 0.55)',
  messageAi: 'rgba(18, 16, 56, 0.5)',
  hover: 'rgba(214, 2, 112, 0.12)',
  primary: '#e91a6e',
  primaryForeground: '#ffffff',
  primaryGradient: 'linear-gradient(135deg, #D60270 0%, #9B4F96 100%)',
  secondary: '#3f51b5',
  accentColor: '#e91a6e',
  accentBackground: '#e91a6e',
  accentText: '#ffffff',
  accentSurface: 'rgba(233, 26, 110, 0.14)',
  accentGradient: 'linear-gradient(90deg, #D60270 0%, #9B4F96 50%, #0038A8 100%)',
  glassBlur: '22px',
  glassEffect: 'blur(22px) saturate(160%)',
  inputBackground: 'rgba(22, 12, 36, 0.5)',
  buttonGradient: 'linear-gradient(135deg, #D60270 0%, #9B4F96 100%)',
  buttonHoverGradient: 'linear-gradient(135deg, #9B4F96 0%, #D60270 100%)',
  cardBackground: 'rgba(22, 12, 36, 0.55)',
  codeBlockBg: 'rgba(12, 6, 22, 0.72)',
  codeBlockHeaderBg: 'rgba(22, 10, 38, 0.78)',
  codeBlockBorder: 'rgba(214, 2, 112, 0.16)',
  inlineCodeBg: 'rgba(214, 2, 112, 0.14)',
};

// ----------------------------------------------------------------------------
// RETRO — Windows 98
//
// Design intent:
//   - Classic teal desktop wallpaper with the app rendered as a single Win98
//     window: outset bevel, navy title bar, MDI feel.
//   - Every surface uses Win98 chrome: dialog buttons, inset text inputs,
//     explorer-like sidebar with a title strip, Win98 icons from
//     /images/retroTheme/ where meaningful.
//   - Hyper-sharp: no border-radius anywhere, pixel-perfect MS Sans fonts,
//     no gradients, no glass blur. Authenticity over modernity.
// ----------------------------------------------------------------------------
export const retroTheme = {
  name: 'retro',
  isDark: false,

  // Canvas + wallpaper
  desktopBackground: '#008080', // Classic teal behind everything
  background: '#C0C0C0', // Body itself is gray so chrome reads on it
  appShell: '#C0C0C0',
  sidebar: '#C0C0C0',
  chat: '#C0C0C0',

  // Typography
  text: '#000000',
  textSecondary: '#404040',

  // Borders & shadows
  border: '#808080',
  shadow: 'none',

  // Win98 window chrome
  windowTitleBarBackground:
    'linear-gradient(90deg, #000080 0%, #1084d0 100%)', // Classic active titlebar gradient
  windowTitleBarInactiveBackground:
    'linear-gradient(90deg, #7b7b7b 0%, #b6b6b6 100%)',
  windowTitleBarText: '#FFFFFF',
  windowBodyBackground: '#C0C0C0',

  // Message bubbles
  messageUser: '#FFFFFF',
  messageAi: '#ECECEC',
  hover: '#B0B0B0',

  // Brand tokens
  primary: '#000080',
  primaryForeground: '#FFFFFF',
  primaryGradient: '#000080',
  secondary: '#C0C0C0',
  accentColor: '#000080',
  accentBackground: '#000080',
  accentText: '#FFFFFF',
  accentSurface: '#D0D0D0',

  // Glass disabled
  glassBlur: '0px',
  glassEffect: 'none',

  // Inputs
  inputBackground: '#FFFFFF',

  // Button chrome
  buttonFace: '#C0C0C0',
  buttonText: '#000000',
  buttonHighlightLight: '#FFFFFF',
  buttonShadowDark: '#000000',
  buttonHighlightSoft: '#DFDFDF',
  buttonShadowSoft: '#808080',
  buttonGradient: '#C0C0C0',
  buttonHoverGradient: '#B0B0B0',

  // Cards / code
  cardBackground: '#C0C0C0',
  codeBlockBg: '#FFFFFF',
  codeBlockHeaderBg:
    'linear-gradient(90deg, #000080 0%, #1084d0 100%)',
  codeBlockBorder: '#808080',
  inlineCodeBg: '#FFFFFF',

  // Scrollbars
  scrollbarWidth: '16px',
  scrollbarTrack:
    'repeating-conic-gradient(#C0C0C0 0% 25%, #DFDFDF 0% 50%) 50% / 2px 2px',
  scrollbarThumb: '#C0C0C0',
  scrollbarThumbHover: '#B0B0B0',

  // Selection
  textSelection: '#FFFFFF',
  textSelectionBackground: '#000080',

  // Form controls
  checkboxBorder: '#808080',
  checkboxBackground: '#FFFFFF',
  checkmarkColor: '#000000',

  fontFamily:
    "'MSW98UI', 'MS Sans Serif', 'Tahoma', 'Microsoft Sans Serif', 'Arial', sans-serif",
};

// ----------------------------------------------------------------------------
// MODEL THEMES (unchanged - used for model icon badges only)
// ----------------------------------------------------------------------------
export const modelThemes = {
  'gemini-2-flash': {
    primary: '#1B72E8',
    secondary: '#EA4335',
    gradient: 'linear-gradient(135deg, #1B72E8, #EA4335)',
  },
  'claude-opus-4.7': {
    primary: '#5B21B6',
    secondary: '#7C3AED',
    gradient: 'linear-gradient(135deg, #5B21B6, #7C3AED)',
  },
  'claude-3.7-sonnet': {
    primary: '#732BEB',
    secondary: '#A480EB',
    gradient: 'linear-gradient(135deg, #732BEB, #A480EB)',
  },
  'chatgpt-4o': {
    primary: '#10A37F',
    secondary: '#1A7F64',
    gradient: 'linear-gradient(135deg, #10A37F, #1A7F64)',
  },
  'custom-gguf': {
    primary: '#FF5722',
    secondary: '#FF9800',
    gradient: 'linear-gradient(135deg, #FF5722, #FF9800)',
  },
  'nemotron-super-49b': {
    primary: '#76B900',
    secondary: '#1A1A1A',
    gradient: 'linear-gradient(135deg, #76B900, #1A1A1A)',
  },
  mercury: {
    primary: '#2E0854',
    secondary: '#6A1B9A',
    gradient: 'linear-gradient(135deg, #2E0854, #6A1B9A)',
  },
  'grok-beta': {
    primary: '#000000',
    secondary: '#1DA1F2',
    gradient: 'linear-gradient(135deg, #000000, #1DA1F2)',
  },
  'x-ai/grok-beta': {
    primary: '#000000',
    secondary: '#1DA1F2',
    gradient: 'linear-gradient(135deg, #000000, #1DA1F2)',
  },
};

// ----------------------------------------------------------------------------
// Theme resolver
// ----------------------------------------------------------------------------
export const getTheme = (themeName) => {
  switch (themeName) {
    case 'dark':
      return darkTheme;
    case 'oled':
      return oledTheme;
    case 'ocean':
      return oceanTheme;
    case 'forest':
      return forestTheme;
    case 'sunset':
      return sunsetTheme;
    case 'sunrise':
      return sunriseTheme;
    case 'lakeside':
      return lakesideTheme;
    case 'pride':
      return prideTheme;
    case 'trans':
      return transTheme;
    case 'bisexual':
      return bisexualTheme;
    case 'retro':
      return retroTheme;
    // Aliases for deprecated / removed theme names so existing user settings
    // fall through to a sensible modern equivalent instead of a white flash.
    case 'night':
      return darkTheme;
    case 'galaxy':
      return lakesideTheme;
    case 'bubblegum':
    case 'comic-book':
      return prideTheme;
    case 'desert':
      return sunsetTheme;
    case 'ocean-breeze':
      return oceanTheme;
    case 'matrix':
      return forestTheme;
    // Cyberpunk was retired; OLED is the closest minimal dark sibling.
    case 'cyberpunk':
      return oledTheme;
    default:
      return lightTheme;
  }
};

// ----------------------------------------------------------------------------
// Global styles driven by the resolved theme
// ----------------------------------------------------------------------------
export const GlobalStyles = createGlobalStyle`
  * {
    box-sizing: border-box;
  }

  html {
    /*
     * The <html> element always paints the photo (or stays transparent so the
     * body gradient below shows). Using <html> guarantees the backdrop fills
     * the full viewport even when #root or AppContainer are transparent or
     * have overflow:hidden that would otherwise clip a body-attached fixed
     * background.
     *
     * A solid fallback color matches the theme's tonality so we don't flash
     * white on load while the photo decodes.
     */
    background-color: ${(props) =>
      props.theme.backgroundImage
        ? props.theme.isDark
          ? '#0a0a0a'
          : '#f5f5f7'
        : 'transparent'};
    ${(props) =>
      props.theme.backgroundImage &&
      `
      background-image: ${props.theme.backgroundImage};
      background-size: cover;
      background-position: center center;
      background-repeat: no-repeat;
      background-attachment: fixed;
    `}
  }

  body {
    /*
     * The body paints the coloured veil (gradients) on top of <html>'s photo.
     * For photo-backed themes we force fixed attachment + cover sizing so the
     * veil tracks the viewport just like the photo underneath; for legacy
     * gradient-only themes we preserve their existing render behaviour.
     */
    background: ${(props) => props.theme.background};
    ${(props) =>
      props.theme.backgroundImage &&
      `
      background-size: cover;
      background-position: center center;
      background-repeat: no-repeat;
    `}
    background-attachment: ${(props) =>
      props.theme.backgroundAttachment ||
      (props.theme.backgroundImage ? 'fixed' : 'scroll')};
    color: ${(props) => props.theme.text};
    transition: background-color 0.35s ease-in-out, color 0.2s ease-in-out;
    font-family: ${(props) =>
      props.theme.fontFamily ||
      "-apple-system, BlinkMacSystemFont, 'San Francisco', 'Segoe UI', Roboto, sans-serif"};
    margin: 0;
    padding: 0;
    min-height: 100vh;
  }

  /* Optional decorative overlay for themes that define one (galaxy stars, etc.) */
  ${(props) =>
    props.theme.backgroundOverlay &&
    `
    body::before {
      content: '';
      position: fixed;
      inset: 0;
      pointer-events: none;
      background: ${props.theme.backgroundOverlay};
      background-size: 200px 200px;
      opacity: 0.55;
      z-index: 0;
      mix-blend-mode: screen;
    }
  `}

  button, input, textarea, select {
    font-family: ${(props) =>
      props.theme.fontFamily ||
      "-apple-system, BlinkMacSystemFont, 'San Francisco', 'Segoe UI', Roboto, sans-serif"};
  }

  .font-size-small { font-size: 0.9rem; }
  .font-size-medium { font-size: 1rem; }
  .font-size-large { font-size: 1.1rem; }

  .glass {
    backdrop-filter: ${(props) => props.theme.glassEffect};
    -webkit-backdrop-filter: ${(props) => props.theme.glassEffect};
    background-color: ${(props) =>
      props.theme.isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(255, 255, 255, 0.6)'};
    border: 1px solid ${(props) => props.theme.border};
  }

  ::selection {
    background: ${(props) =>
      props.theme.textSelectionBackground || props.theme.accentColor || props.theme.primary};
    color: ${(props) => props.theme.textSelection || props.theme.accentText || '#ffffff'};
  }

  /* ------------------------------------------------------------------------
     RETRO theme overrides (Windows 98 chrome)
     -----------------------------------------------------------------------
     Design language:
       - outset bevel:  highlight top/left, shadow bottom/right
       - inset bevel:   shadow top/left, highlight bottom/right (for inputs)
       - buttonFace #C0C0C0 everywhere; no border-radius anywhere
       - navy+sky title bars with pixel-bold text
  ------------------------------------------------------------------------- */
  ${(props) =>
    props.theme.name === 'retro' &&
    `
    /* Desktop color applied to body so any gap between root and children
       (e.g. scrollbar corners) still reads as the classic Win98 desktop. */
    html, body {
      background-color: ${props.theme.desktopBackground} !important;
    }

    body {
      font-family: ${props.theme.fontFamily};
      cursor: default;
      color: ${props.theme.text};
      background-image:
        repeating-conic-gradient(rgba(0, 0, 0, 0.04) 0% 25%, transparent 0% 50%) !important;
      background-size: 2px 2px !important;
      background-attachment: fixed !important;
    }

    * {
      border-radius: 0 !important;
      font-family: ${props.theme.fontFamily};
      letter-spacing: 0 !important;
    }

    /* Classic Win98 "maximized window" chrome. The app is rendered full-screen
       with a proper title bar on top and a Start-menu style taskbar on the
       bottom, like an app in a maximized Win98 session. This avoids fighting
       the app's own layout for a floating window look. */
    #root {
      position: relative !important;
    }

    /* Title bar painted on a fixed pseudo-element at the top. */
    body::before {
      content: '\\2728  Sculptor 98  \\2014  [Chat]';
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      height: 24px;
      line-height: 24px;
      padding: 0 80px 0 8px;
      color: ${props.theme.windowTitleBarText};
      font-family: ${props.theme.fontFamily};
      font-weight: 700;
      font-size: 12px;
      background-image:
        linear-gradient(90deg, #000080 0%, #1084d0 100%),
        url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='68' height='18' viewBox='0 0 68 18' shape-rendering='crispEdges'><g><rect x='0' y='0' width='22' height='18' fill='%23c0c0c0'/><rect x='0' y='0' width='22' height='1' fill='%23ffffff'/><rect x='0' y='0' width='1' height='18' fill='%23ffffff'/><rect x='0' y='17' width='22' height='1' fill='%23000000'/><rect x='21' y='0' width='1' height='18' fill='%23000000'/><rect x='1' y='1' width='20' height='1' fill='%23dfdfdf'/><rect x='1' y='1' width='1' height='16' fill='%23dfdfdf'/><rect x='1' y='16' width='20' height='1' fill='%23808080'/><rect x='20' y='1' width='1' height='16' fill='%23808080'/><rect x='6' y='12' width='10' height='2' fill='%23000000'/></g><g transform='translate(23,0)'><rect x='0' y='0' width='22' height='18' fill='%23c0c0c0'/><rect x='0' y='0' width='22' height='1' fill='%23ffffff'/><rect x='0' y='0' width='1' height='18' fill='%23ffffff'/><rect x='0' y='17' width='22' height='1' fill='%23000000'/><rect x='21' y='0' width='1' height='18' fill='%23000000'/><rect x='1' y='1' width='20' height='1' fill='%23dfdfdf'/><rect x='1' y='1' width='1' height='16' fill='%23dfdfdf'/><rect x='1' y='16' width='20' height='1' fill='%23808080'/><rect x='20' y='1' width='1' height='16' fill='%23808080'/><rect x='5' y='4' width='12' height='2' fill='%23000000'/><rect x='5' y='4' width='2' height='9' fill='%23000000'/><rect x='15' y='4' width='2' height='9' fill='%23000000'/><rect x='5' y='11' width='12' height='2' fill='%23000000'/></g><g transform='translate(46,0)'><rect x='0' y='0' width='22' height='18' fill='%23c0c0c0'/><rect x='0' y='0' width='22' height='1' fill='%23ffffff'/><rect x='0' y='0' width='1' height='18' fill='%23ffffff'/><rect x='0' y='17' width='22' height='1' fill='%23000000'/><rect x='21' y='0' width='1' height='18' fill='%23000000'/><rect x='1' y='1' width='20' height='1' fill='%23dfdfdf'/><rect x='1' y='1' width='1' height='16' fill='%23dfdfdf'/><rect x='1' y='16' width='20' height='1' fill='%23808080'/><rect x='20' y='1' width='1' height='16' fill='%23808080'/><rect x='6' y='5' width='2' height='2' fill='%23000000'/><rect x='14' y='5' width='2' height='2' fill='%23000000'/><rect x='7' y='6' width='2' height='2' fill='%23000000'/><rect x='13' y='6' width='2' height='2' fill='%23000000'/><rect x='8' y='7' width='2' height='2' fill='%23000000'/><rect x='12' y='7' width='2' height='2' fill='%23000000'/><rect x='9' y='8' width='4' height='2' fill='%23000000'/><rect x='9' y='10' width='4' height='2' fill='%23000000'/><rect x='8' y='11' width='2' height='2' fill='%23000000'/><rect x='12' y='11' width='2' height='2' fill='%23000000'/><rect x='7' y='12' width='2' height='2' fill='%23000000'/><rect x='13' y='12' width='2' height='2' fill='%23000000'/><rect x='6' y='13' width='2' height='2' fill='%23000000'/><rect x='14' y='13' width='2' height='2' fill='%23000000'/></g></svg>");
      background-repeat: no-repeat, no-repeat;
      background-position: 0 0, right 3px center;
      background-size: 100% 100%, 68px 18px;
      z-index: 9999;
      pointer-events: none;
      text-shadow: 1px 1px 0 rgba(0, 0, 0, 0.4);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    /* Taskbar painted at the bottom with Start button + clock */
    body::after {
      content: '';
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      height: 28px;
      background: ${props.theme.buttonFace};
      border-top: 2px solid #ffffff;
      box-shadow: inset 0 1px 0 0 #dfdfdf;
      z-index: 9999;
      pointer-events: none;
    }

    /* Start button + clock painted onto the taskbar via a second pseudo */
    #root::after {
      content: '10:45 PM';
      position: fixed;
      bottom: 4px;
      right: 6px;
      height: 20px;
      line-height: 20px;
      padding: 0 12px 0 20px;
      color: #000;
      font-family: ${props.theme.fontFamily};
      font-size: 11px;
      background: ${props.theme.buttonFace};
      border-top: 2px solid #808080;
      border-left: 2px solid #808080;
      border-right: 2px solid #ffffff;
      border-bottom: 2px solid #ffffff;
      box-shadow: inset 1px 1px 0 0 #404040;
      /* clock icon */
      background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 14 14' shape-rendering='crispEdges'><circle cx='7' cy='7' r='5' fill='%23ffffff' stroke='%23000' stroke-width='1'/><path d='M7 4 L7 7 L9 8' fill='none' stroke='%23000' stroke-width='1'/></svg>");
      background-repeat: no-repeat;
      background-position: 4px center;
      background-size: 12px 12px;
      z-index: 10000;
      pointer-events: none;
    }

    #root::before {
      content: '\\2728 Start';
      position: fixed;
      bottom: 4px;
      left: 4px;
      height: 22px;
      line-height: 22px;
      padding: 0 10px;
      color: #000;
      font-family: ${props.theme.fontFamily};
      font-weight: 700;
      font-size: 12px;
      background: ${props.theme.buttonFace};
      border-top: 2px solid #ffffff;
      border-left: 2px solid #ffffff;
      border-right: 2px solid #000000;
      border-bottom: 2px solid #000000;
      box-shadow: inset 1px 1px 0 0 #dfdfdf, inset -1px -1px 0 0 #808080;
      z-index: 10000;
      pointer-events: none;
    }

    /* Reserve room for the title bar (24px) and taskbar (28px). */
    #root > div {
      padding-top: 24px !important;
      padding-bottom: 28px !important;
      box-sizing: border-box !important;
    }

    /* Unified sharp font color fix */
    h1, h2, h3, h4, h5, h6, p, span, label, a, input, textarea, select, button {
      text-shadow: none !important;
      font-family: ${props.theme.fontFamily} !important;
    }

    /* Card / panel / modal chrome */
    .card,
    .message-box,
    .settings-panel,
    .dropdown-menu,
    .modal-content,
    .notification {
      border-top: 2px solid #ffffff !important;
      border-left: 2px solid #ffffff !important;
      border-right: 2px solid #000000 !important;
      border-bottom: 2px solid #000000 !important;
      box-shadow:
        inset 1px 1px 0 0 #dfdfdf,
        inset -1px -1px 0 0 #808080 !important;
      background-color: ${props.theme.buttonFace} !important;
    }

    .card-header,
    .modal-header,
    .settings-header,
    .panel-header {
      background: ${props.theme.windowTitleBarBackground} !important;
      color: ${props.theme.windowTitleBarText} !important;
      padding: 3px 6px !important;
      font-weight: 700 !important;
      font-size: 12px !important;
      text-align: left !important;
      height: 20px !important;
      text-shadow: 1px 1px 0 rgba(0, 0, 0, 0.35) !important;
    }

    /* Generic Win98 raised button */
    button,
    input[type="button"],
    input[type="submit"],
    input[type="reset"],
    .button {
      font-family: ${props.theme.fontFamily} !important;
      background-color: ${props.theme.buttonFace} !important;
      background-image: none !important;
      color: ${props.theme.buttonText} !important;
      border-top: 2px solid #ffffff !important;
      border-left: 2px solid #ffffff !important;
      border-right: 2px solid #000000 !important;
      border-bottom: 2px solid #000000 !important;
      box-shadow:
        inset 1px 1px 0 0 #dfdfdf,
        inset -1px -1px 0 0 #808080 !important;
      padding: 3px 10px !important;
      border-radius: 0 !important;
      cursor: default !important;
      min-height: 23px;
      text-align: center;
      outline: none !important;
      font-size: 12px !important;
      line-height: 1.1 !important;
      font-weight: 400 !important;
      transition: none !important;
      transform: none !important;
    }

    button:hover,
    input[type="button"]:hover,
    input[type="submit"]:hover,
    input[type="reset"]:hover,
    .button:hover {
      background-color: ${props.theme.buttonFace} !important;
      background-image: none !important;
      filter: none !important;
    }

    button:focus,
    input[type="button"]:focus,
    .button:focus {
      outline: 1px dotted #000 !important;
      outline-offset: -4px !important;
    }

    /* Pressed state: swap bevel */
    button:active,
    input[type="button"]:active,
    input[type="submit"]:active,
    input[type="reset"]:active,
    .button:active {
      border-top: 2px solid #000000 !important;
      border-left: 2px solid #000000 !important;
      border-right: 2px solid #ffffff !important;
      border-bottom: 2px solid #ffffff !important;
      box-shadow:
        inset 1px 1px 0 0 #808080,
        inset -1px -1px 0 0 #dfdfdf !important;
      padding: 4px 9px 2px 11px !important;
    }

    /* Inputs: inset bevel, always white background */
    input[type="text"],
    input[type="password"],
    input[type="email"],
    input[type="search"],
    input[type="number"],
    input[type="url"],
    input:not([type]),
    textarea,
    .text-input {
      font-family: ${props.theme.fontFamily} !important;
      background-color: ${props.theme.inputBackground} !important;
      color: ${props.theme.text} !important;
      border-top: 2px solid #808080 !important;
      border-left: 2px solid #808080 !important;
      border-right: 2px solid #ffffff !important;
      border-bottom: 2px solid #ffffff !important;
      box-shadow:
        inset 1px 1px 0 0 #404040,
        inset -1px -1px 0 0 #dfdfdf !important;
      padding: 4px 4px !important;
      border-radius: 0 !important;
      font-size: 12px !important;
    }

    input:focus, textarea:focus {
      outline: none !important;
    }

    /* Dropdowns */
    select {
      appearance: none;
      -webkit-appearance: none;
      -moz-appearance: none;
      padding: 3px 22px 3px 4px !important;
      border-top: 2px solid #808080 !important;
      border-left: 2px solid #808080 !important;
      border-right: 2px solid #ffffff !important;
      border-bottom: 2px solid #ffffff !important;
      box-shadow: inset 1px 1px 0 0 #404040 !important;
      background-color: ${props.theme.inputBackground} !important;
      background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='18' height='18' viewBox='0 0 18 18' shape-rendering='crispEdges'><rect x='0' y='0' width='18' height='18' fill='%23c0c0c0' stroke='%23ffffff'/><rect x='1' y='1' width='15' height='15' fill='%23c0c0c0' stroke='%23404040'/><path d='M6 7 L9 10 L12 7 Z' fill='black'/></svg>") !important;
      background-repeat: no-repeat !important;
      background-position: right 1px center !important;
      font-family: ${props.theme.fontFamily} !important;
      font-size: 12px !important;
      color: #000 !important;
    }

    /* Scrollbars */
    ::-webkit-scrollbar { width: ${props.theme.scrollbarWidth}; height: ${props.theme.scrollbarWidth}; }
    ::-webkit-scrollbar-track {
      background: ${props.theme.scrollbarTrack};
      border-top: 1px solid #808080;
      border-left: 1px solid #808080;
    }
    ::-webkit-scrollbar-thumb {
      background: ${props.theme.scrollbarThumb};
      border-top: 2px solid #ffffff;
      border-left: 2px solid #ffffff;
      border-right: 2px solid #000000;
      border-bottom: 2px solid #000000;
    }
    ::-webkit-scrollbar-thumb:hover { background: ${props.theme.scrollbarThumbHover}; }
    ::-webkit-scrollbar-corner { background: ${props.theme.buttonFace}; }

    ::-webkit-scrollbar-button:single-button {
      background-color: ${props.theme.buttonFace};
      border-top: 2px solid #ffffff;
      border-left: 2px solid #ffffff;
      border-right: 2px solid #000000;
      border-bottom: 2px solid #000000;
      display: block;
      background-size: 8px 8px;
      background-position: center;
      background-repeat: no-repeat;
      height: 16px;
      width: 16px;
    }
    ::-webkit-scrollbar-button:single-button:vertical:decrement {
      background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='8' height='8' shape-rendering='crispEdges'><path d='M4 2 L1 5 L7 5 Z' fill='black'/></svg>");
    }
    ::-webkit-scrollbar-button:single-button:vertical:increment {
      background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='8' height='8' shape-rendering='crispEdges'><path d='M1 3 L7 3 L4 6 Z' fill='black'/></svg>");
    }

    /* Checkboxes + radios */
    input[type="checkbox"],
    input[type="radio"] {
      appearance: none;
      -webkit-appearance: none;
      -moz-appearance: none;
      width: 13px;
      height: 13px;
      border-top: 1px solid #808080 !important;
      border-left: 1px solid #808080 !important;
      border-right: 1px solid #ffffff !important;
      border-bottom: 1px solid #ffffff !important;
      background-color: ${props.theme.checkboxBackground};
      position: relative;
      margin: 3px;
      cursor: default;
    }

    input[type="checkbox"]:checked::before {
      content: "\\2714";
      position: absolute;
      font-size: 11px;
      line-height: 11px;
      top: 0;
      left: 1px;
      color: ${props.theme.checkmarkColor};
      font-weight: 700;
    }

    input[type="radio"] { border-radius: 50% !important; }
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

    /* Selection */
    ::selection {
      color: ${props.theme.textSelection} !important;
      background: ${props.theme.textSelectionBackground} !important;
    }

    /* Modal content sits inside a sharp frame with padding */
    .modal-content {
      border-radius: 0 !important;
      padding: 2px !important;
      background-color: ${props.theme.buttonFace} !important;
    }

    /* ---------------------------------------------------------
       Sidebar: Windows Explorer chrome
       --------------------------------------------------------- */
    [data-shadow="sidebar"] {
      background: ${props.theme.sidebar} !important;
      border-right: 2px solid #808080 !important;
      border-top: 2px solid #ffffff !important;
      border-left: 2px solid #ffffff !important;
      border-bottom: 2px solid #000000 !important;
      box-shadow: inset -1px 0 0 0 #000000 !important;
      border-radius: 0 !important;
      top: 28px !important;
      left: 6px !important;
      height: calc(100vh - 38px) !important;
      backdrop-filter: none !important;
      -webkit-backdrop-filter: none !important;
    }

    /* Sidebar nav links: explorer-style list items, 24px icon + 12px text */
    [data-shadow="sidebar"] a {
      padding: 3px 6px !important;
      border-radius: 0 !important;
      font-size: 12px !important;
      font-family: ${props.theme.fontFamily} !important;
      text-decoration: none !important;
    }

    [data-shadow="sidebar"] a:hover {
      background-color: ${props.theme.textSelectionBackground} !important;
      color: ${props.theme.textSelection} !important;
    }

    [data-shadow="sidebar"] a.active {
      background-color: ${props.theme.textSelectionBackground} !important;
      color: ${props.theme.textSelection} !important;
    }

    /* Chat row items in sidebar */
    [data-shadow="sidebar"] [title] {
      font-size: 12px !important;
    }

    /* ---------------------------------------------------------
       Messages: dialog-like boxes
       --------------------------------------------------------- */
    .message-user,
    .message-ai,
    [class*="MessageBubble"],
    [class*="MessageContainer"] > div {
      border-radius: 0 !important;
    }

    .message-user {
      background-color: ${props.theme.messageUser} !important;
      border-top: 2px solid #ffffff !important;
      border-left: 2px solid #ffffff !important;
      border-right: 2px solid #000000 !important;
      border-bottom: 2px solid #000000 !important;
      box-shadow: inset 1px 1px 0 0 #dfdfdf, inset -1px -1px 0 0 #808080 !important;
      color: ${props.theme.text} !important;
    }

    .message-ai {
      background-color: ${props.theme.messageAi} !important;
      border-top: 2px solid #ffffff !important;
      border-left: 2px solid #ffffff !important;
      border-right: 2px solid #000000 !important;
      border-bottom: 2px solid #000000 !important;
      box-shadow: inset 1px 1px 0 0 #dfdfdf, inset -1px -1px 0 0 #808080 !important;
      color: ${props.theme.text} !important;
    }

    /* ---------------------------------------------------------
       Composer: Win98 dialog bar at the bottom.
       Drop all rounded pill styles, use inset bevel for the text area,
       raised buttons for chips, and a subtle 2-tone gradient band.
       --------------------------------------------------------- */
    [class*="InputContainer"],
    [class*="MessageInputWrapper"],
    [class*="InputWrapper"],
    [class*="ComposerWrapper"] {
      border-radius: 0 !important;
      box-shadow: none !important;
      background-color: ${props.theme.buttonFace} !important;
    }

    [data-shadow="message-bar"] {
      background-color: ${props.theme.buttonFace} !important;
      border-top: 2px solid #ffffff !important;
      border-left: 2px solid #ffffff !important;
      border-right: 2px solid #000000 !important;
      border-bottom: 2px solid #000000 !important;
      box-shadow:
        inset 1px 1px 0 0 #dfdfdf,
        inset -1px -1px 0 0 #808080 !important;
      padding: 4px !important;
    }

    /* Composer chips — Search / Deep Research / Create — styled like Win98
       toolbar buttons. */
    [class*="ChipButton"],
    [class*="OverflowChipButton"],
    [class*="MainActionButton"] {
      border-top: 2px solid #ffffff !important;
      border-left: 2px solid #ffffff !important;
      border-right: 2px solid #000000 !important;
      border-bottom: 2px solid #000000 !important;
      box-shadow: inset 1px 1px 0 0 #dfdfdf, inset -1px -1px 0 0 #808080 !important;
      background: ${props.theme.buttonFace} !important;
      background-image: none !important;
      color: #000 !important;
      padding: 3px 10px !important;
      font-size: 12px !important;
      font-weight: 400 !important;
      border-radius: 0 !important;
    }

    [class*="ChipButton"][class*="active"],
    [class*="ChipButton"][data-active="true"] {
      background: #dfdfdf !important;
      border-top: 2px solid #000000 !important;
      border-left: 2px solid #000000 !important;
      border-right: 2px solid #ffffff !important;
      border-bottom: 2px solid #ffffff !important;
      box-shadow: inset 1px 1px 0 0 #808080 !important;
    }

    /* The textarea inside the composer — classic Win98 inset white input */
    [data-shadow="message-bar"] textarea,
    [data-shadow="message-bar"] input {
      background-color: #ffffff !important;
      border-top: 2px solid #808080 !important;
      border-left: 2px solid #808080 !important;
      border-right: 2px solid #ffffff !important;
      border-bottom: 2px solid #ffffff !important;
      box-shadow: inset 1px 1px 0 0 #404040 !important;
      font-size: 12px !important;
    }

    /* Greeting: Win98 dialog-style "document title" instead of big hero text */
    [class*="InputGreeting"] {
      font-size: 1.1rem !important;
      font-weight: 700 !important;
      font-family: ${props.theme.fontFamily} !important;
      color: #000080 !important;
      margin-bottom: 8px !important;
      text-shadow: none !important;
      letter-spacing: 0 !important;
    }

    /* Chat window background gets the classic workspace inset look */
    [class*="ChatWindowContainer"] {
      background: ${props.theme.buttonFace} !important;
    }

    /* Messages wrapper */
    [class*="MessageList"] {
      background: ${props.theme.buttonFace} !important;
    }

    /* Code blocks: white paper with navy gradient title strip */
    pre, .code-block {
      background-color: #ffffff !important;
      border-top: 2px solid #808080 !important;
      border-left: 2px solid #808080 !important;
      border-right: 2px solid #ffffff !important;
      border-bottom: 2px solid #ffffff !important;
      box-shadow: inset 1px 1px 0 0 #404040 !important;
      padding: 8px !important;
      font-family: 'Courier New', monospace !important;
      font-size: 12px !important;
    }

    code, .inline-code {
      background-color: #ffffff !important;
      font-family: 'Courier New', monospace !important;
      font-size: 12px !important;
      padding: 0 2px !important;
      border: 1px solid #808080 !important;
    }

    /* Tooltip chrome: Win98 yellow sticky */
    [role="tooltip"] {
      background: #ffffe1 !important;
      color: #000 !important;
      border: 1px solid #000 !important;
      padding: 2px 4px !important;
      font-size: 11px !important;
      box-shadow: 2px 2px 0 0 rgba(0, 0, 0, 0.2) !important;
    }

    /* Links in chat = classic blue underlined */
    a { color: #000080; text-decoration: underline; }
    a:visited { color: #800080; }

    /* Pixel-perfect rendering for icons / images */
    img[src*="/images/retroTheme/"] {
      image-rendering: pixelated !important;
      image-rendering: -moz-crisp-edges !important;
      image-rendering: crisp-edges !important;
    }

    /* Blinking caret like an old CRT */
    textarea, input {
      caret-color: #000 !important;
    }
  `}

`;
