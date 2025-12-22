const accentColorMap = {
  gray: '#9CA3AF',
  blue: '#3B82F6',
  green: '#10B981',
  yellow: '#FACC15',
  pink: '#EC4899',
  orange: '#F97316',
  purple: '#A855F7',
  red: '#EF4444',
};

const accentTextMap = {
  yellow: '#0F172A',
};

export const accentOptions = [
  { value: 'theme', labelKey: 'settings.appearance.accent.option.theme', defaultLabel: 'Same as theme' },
  { value: 'gray', labelKey: 'settings.appearance.accent.option.gray', defaultLabel: 'Gray' },
  { value: 'blue', labelKey: 'settings.appearance.accent.option.blue', defaultLabel: 'Blue' },
  { value: 'green', labelKey: 'settings.appearance.accent.option.green', defaultLabel: 'Green' },
  { value: 'yellow', labelKey: 'settings.appearance.accent.option.yellow', defaultLabel: 'Yellow' },
  { value: 'pink', labelKey: 'settings.appearance.accent.option.pink', defaultLabel: 'Pink' },
  { value: 'orange', labelKey: 'settings.appearance.accent.option.orange', defaultLabel: 'Orange' },
  { value: 'purple', labelKey: 'settings.appearance.accent.option.purple', defaultLabel: 'Purple' },
  { value: 'red', labelKey: 'settings.appearance.accent.option.red', defaultLabel: 'Red' },
];

const extractHex = (value) => {
  if (!value || typeof value !== 'string') {
    return null;
  }
  const match = value.match(/#([0-9a-fA-F]{6})/);
  if (match) {
    return `#${match[1]}`;
  }
  return null;
};

const addAlpha = (color, alpha) => {
  if (!color) {
    return color;
  }
  const normalized = color.replace('#', '');
  if (!/^[0-9a-fA-F]{6}$/.test(normalized)) {
    return color;
  }
  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const applyAlpha = (color, alpha) => {
  if (!color) return color;
  const hex = extractHex(color);
  if (hex) return addAlpha(hex, alpha);
  const rgbMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
  if (rgbMatch) {
    const [, r, g, b] = rgbMatch;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  return color;
};

export const getAccentStyles = (theme = {}, accentChoice = 'theme') => {
  const fallbackColor = extractHex(theme.primary) || theme.primary || '#6366F1';
  const background = theme.accentGradient || theme.buttonGradient || theme.primary || fallbackColor;
  const isDark = theme.isDark !== false; // Default to dark if not specified

  if (accentChoice === 'theme') {
    const isSunsetTheme = !isDark && theme.name === 'sunset';
    return {
      accentColor: fallbackColor,
      accentBackground: background,
      accentText: isSunsetTheme ? (theme.text || '#2d0b00') : (isDark ? '#FFFFFF' : (theme.text || fallbackColor)),
      accentSurface: (theme.name === 'sunset'
        ? applyAlpha(fallbackColor, 0.2)
        : applyAlpha(fallbackColor, 0.14)) || background,
      accentChoice,
    };
  }

  const solidColor = accentColorMap[accentChoice] || '#6366F1';
  // For light themes, use the accent color itself as text; for dark themes use white (or custom)
  const textColor = isDark 
    ? (accentTextMap[accentChoice] || '#FFFFFF')
    : solidColor;
  return {
    accentColor: solidColor,
    accentBackground: solidColor,
    accentText: textColor,
    accentSurface: addAlpha(solidColor, 0.14),
    accentChoice,
  };
};

export const getAccentSwatch = (accentChoice, theme = {}) => {
  if (accentChoice === 'theme') {
    return theme.accentGradient || theme.buttonGradient || theme.primary || '#6366F1';
  }
  return accentColorMap[accentChoice] || '#6366F1';
};

export default accentOptions;
