import { getTheme, lightTheme, darkTheme } from './themes';

/**
 * Custom-theme authoring model
 *
 * The previous implementation exposed only three knobs (`background`, `text`,
 * `border`). Users asked for real control, including the ability to swap in
 * a background image. This module defines the full authoring schema and the
 * resolver that turns saved user values into a complete theme object that
 * every surface in the app can consume.
 *
 * Design goals:
 *   1. Every surface the app draws has a dedicated knob (sidebar, chat
 *      surface, bubbles, inputs, cards, code blocks, borders).
 *   2. Unset fields fall through to a named "base" theme, so a user can pick
 *      "Start from Dark" and only override one or two values without losing
 *      sensible defaults elsewhere.
 *   3. Optional background image: either a built-in `/images/themes/*.jpg`
 *      URL or a user-uploaded data URL. When set, rendering behaves like the
 *      Ocean / Forest photo themes (fixed-cover, `appShell: transparent`) so
 *      the image is the dominant surface.
 *   4. A single gradient veil (two stops + angle) drawn above the image for
 *      legibility.
 *   5. Small helpers so the editor UI and the renderer share one truth.
 */

export const CUSTOM_THEME_FIELDS = [
  { key: 'background', label: 'Background', group: 'surfaces' },
  { key: 'backgroundTo', label: 'Background (gradient stop)', group: 'surfaces' },
  { key: 'sidebar', label: 'Sidebar', group: 'surfaces' },
  { key: 'chat', label: 'Chat surface', group: 'surfaces' },
  { key: 'cardBackground', label: 'Cards / modals', group: 'surfaces' },
  { key: 'inputBackground', label: 'Inputs', group: 'surfaces' },

  { key: 'text', label: 'Primary text', group: 'typography' },
  { key: 'textSecondary', label: 'Secondary text', group: 'typography' },

  { key: 'primary', label: 'Primary / brand', group: 'brand' },
  { key: 'accentColor', label: 'Accent', group: 'brand' },
  { key: 'border', label: 'Border', group: 'brand' },

  { key: 'messageUser', label: 'User bubble', group: 'chat' },
  { key: 'messageAi', label: 'Assistant bubble', group: 'chat' },
];

// Built-in backgrounds you can pick without uploading.
export const BUILTIN_BACKGROUND_IMAGES = [
  { id: 'none', label: 'None', url: null },
  { id: 'ocean', label: 'Ocean', url: '/images/themes/ocean.jpg' },
  { id: 'forest', label: 'Forest', url: '/images/themes/forest.jpg' },
  { id: 'sunset', label: 'Sunset', url: '/images/themes/sunset.jpg' },
  { id: 'sunrise', label: 'Sunrise', url: '/images/themes/sunrise.jpg' },
];

// Starter presets. Selecting one hydrates the editor with fully-populated
// tokens from the corresponding built-in theme so the user has a working
// canvas to tweak from.
export const CUSTOM_THEME_PRESETS = [
  { id: 'light', label: 'Light', baseTheme: 'light' },
  { id: 'dark', label: 'Dark', baseTheme: 'dark' },
  { id: 'oled', label: 'OLED', baseTheme: 'oled' },
  { id: 'ocean', label: 'Ocean', baseTheme: 'ocean' },
  { id: 'forest', label: 'Forest', baseTheme: 'forest' },
  { id: 'sunset', label: 'Sunset', baseTheme: 'sunset' },
  { id: 'sunrise', label: 'Sunrise', baseTheme: 'sunrise' },
  { id: 'lakeside', label: 'Lakeside', baseTheme: 'lakeside' },
];

const DEFAULT_GRADIENT_ANGLE = 160;
const DEFAULT_VEIL_OPACITY = 0.35;

/**
 * The initial authoring values, used when a user first picks "Custom" with
 * no prior saved state. We start from the light theme so the first render
 * looks benign rather than an eye-searing pure-black canvas.
 */
export const defaultCustomTheme = () => hydrateFromPreset('light');

/**
 * Rehydrate the editor from a built-in theme, copying every knob the user
 * might want to tweak. The resulting object is safe to persist and safe to
 * feed back into `buildCustomTheme` later.
 */
export function hydrateFromPreset(presetId = 'light') {
  const preset = CUSTOM_THEME_PRESETS.find((p) => p.id === presetId) || CUSTOM_THEME_PRESETS[0];
  const base = getTheme(preset.baseTheme) || lightTheme;
  return {
    baseTheme: preset.baseTheme,
    isDark: !!base.isDark,
    background: extractStart(base.background) || (base.isDark ? '#141414' : '#f5f5f7'),
    backgroundTo: extractEnd(base.background) || '',
    backgroundAngle: DEFAULT_GRADIENT_ANGLE,
    sidebar: toSolid(base.sidebar) || (base.isDark ? '#1c1c1e' : '#ffffff'),
    chat: toSolid(base.chat) || (base.isDark ? '#1c1c1e' : '#ffffff'),
    cardBackground: toSolid(base.cardBackground) || (base.isDark ? '#27272a' : '#ffffff'),
    inputBackground: toSolid(base.inputBackground) || (base.isDark ? '#252527' : '#ffffff'),
    text: base.text,
    textSecondary: base.textSecondary,
    primary: base.primary,
    accentColor: base.accentColor || base.primary,
    border: toSolid(base.border) || (base.isDark ? '#3f3f46' : '#e5e7eb'),
    messageUser: toSolid(base.messageUser) || (base.isDark ? '#2a2a2d' : '#ffffff'),
    messageAi: toSolid(base.messageAi) || (base.isDark ? '#1f2937' : '#eff6ff'),
    backgroundImage: null,
    backgroundImageSource: 'none',
    backgroundImageOpacity: DEFAULT_VEIL_OPACITY,
  };
}

/**
 * Turn a saved custom-theme authoring object into a fully-resolved styled-
 * components theme, suitable to pass into `<ThemeProvider>`. Unknown fields
 * fall through to the selected `baseTheme` so partial customisations still
 * produce coherent UI.
 */
export function buildCustomTheme(overrides = {}) {
  const baseName = overrides.baseTheme || (overrides.isDark ? 'dark' : 'light');
  const base = getTheme(baseName) || (overrides.isDark ? darkTheme : lightTheme);

  const hasImage = !!overrides.backgroundImage;
  const angle = Number.isFinite(Number(overrides.backgroundAngle))
    ? Number(overrides.backgroundAngle)
    : DEFAULT_GRADIENT_ANGLE;
  const start = overrides.background || base.background;
  const end = overrides.backgroundTo;

  // Resolve the final background paint.
  //   - No image, two stops  -> linear gradient
  //   - No image, one stop   -> use it verbatim (solid / CSS value)
  //   - Image present        -> draw a translucent gradient veil in the
  //                             selected colour, using `backgroundImageOpacity`
  //                             as the overall veil strength.
  let background;
  if (hasImage) {
    const veilStart = toRgba(start, overrides.backgroundImageOpacity ?? DEFAULT_VEIL_OPACITY);
    const veilEnd = toRgba(
      end || start,
      (overrides.backgroundImageOpacity ?? DEFAULT_VEIL_OPACITY) * 0.6,
    );
    background = `linear-gradient(${angle}deg, ${veilStart} 0%, ${veilEnd} 100%)`;
  } else if (end) {
    background = `linear-gradient(${angle}deg, ${start} 0%, ${end} 100%)`;
  } else {
    background = start;
  }

  const accent = overrides.accentColor || overrides.primary || base.accentColor || base.primary;

  return {
    ...base,
    name: 'custom',
    isDark: overrides.isDark !== undefined ? !!overrides.isDark : !!base.isDark,
    appShell: hasImage ? 'transparent' : base.appShell,
    backgroundImage: hasImage ? `url(${JSON.stringify(overrides.backgroundImage)})` : undefined,
    backgroundAttachment: hasImage ? 'fixed' : base.backgroundAttachment,
    background,
    sidebar: overrides.sidebar || base.sidebar,
    chat: hasImage ? 'transparent' : overrides.chat || base.chat,
    text: overrides.text || base.text,
    textSecondary: overrides.textSecondary || base.textSecondary,
    border: overrides.border || base.border,
    messageUser: overrides.messageUser || base.messageUser,
    messageAi: overrides.messageAi || base.messageAi,
    primary: overrides.primary || base.primary,
    primaryForeground: base.primaryForeground,
    secondary: overrides.primary || base.secondary,
    accentColor: accent,
    accentBackground: accent,
    accentText: base.accentText || (isLight(accent) ? '#1d1d1f' : '#ffffff'),
    accentSurface: toRgba(accent, 0.14),
    inputBackground: overrides.inputBackground || base.inputBackground,
    cardBackground: overrides.cardBackground || base.cardBackground,
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// Best-effort extraction of the first / last colour stop from a CSS gradient
// string so we can seed the editor with a sensible default when the user
// picks a photo-backed preset (those use gradient veils instead of solids).
function extractStart(value) {
  if (!value || typeof value !== 'string') return null;
  const match = value.match(/#([0-9a-fA-F]{3,8})\b/);
  if (match) return `#${match[1]}`;
  if (value.startsWith('#')) return value.split(/\s/)[0];
  return null;
}
function extractEnd(value) {
  if (!value || typeof value !== 'string') return null;
  const matches = value.match(/#([0-9a-fA-F]{3,8})\b/g);
  if (!matches || matches.length < 2) return null;
  return matches[matches.length - 1];
}

// When a base theme uses rgba/gradient for a surface (e.g. cardBackground),
// the editor swatches prefer an opaque colour so the <input type="color">
// native picker is happy. This strips alpha/gradients down to a plain hex.
function toSolid(value) {
  if (!value || typeof value !== 'string') return null;
  const hex = value.match(/#([0-9a-fA-F]{6})/);
  if (hex) return `#${hex[1]}`;
  const rgb = value.match(/rgba?\((\d+)[,\s]+(\d+)[,\s]+(\d+)/i);
  if (rgb) {
    const [, r, g, b] = rgb;
    return (
      '#' +
      [r, g, b]
        .map((n) => Number(n).toString(16).padStart(2, '0'))
        .join('')
    );
  }
  return null;
}

function toRgba(value, alpha) {
  if (!value) return `rgba(0,0,0,${alpha})`;
  const solid = toSolid(value) || value;
  const hex = solid.match(/#([0-9a-fA-F]{6})/);
  if (!hex) return solid;
  const r = parseInt(hex[1].slice(0, 2), 16);
  const g = parseInt(hex[1].slice(2, 4), 16);
  const b = parseInt(hex[1].slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function isLight(value) {
  const solid = toSolid(value);
  if (!solid) return false;
  const hex = solid.replace('#', '');
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6;
}
