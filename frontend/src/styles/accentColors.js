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
  { value: 'theme', label: 'Same as theme' },
  { value: 'gray', label: 'Gray' },
  { value: 'blue', label: 'Blue' },
  { value: 'green', label: 'Green' },
  { value: 'yellow', label: 'Yellow' },
  { value: 'pink', label: 'Pink' },
  { value: 'orange', label: 'Orange' },
  { value: 'purple', label: 'Purple' },
  { value: 'red', label: 'Red' },
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

export const getAccentStyles = (theme = {}, accentChoice = 'theme') => {
  const fallbackColor = extractHex(theme.primary) || theme.primary || '#6366F1';
  const background = theme.accentGradient || theme.buttonGradient || theme.primary || fallbackColor;

  if (accentChoice === 'theme') {
    return {
      accentColor: fallbackColor,
      accentBackground: background,
      accentText: '#FFFFFF',
      accentSurface: addAlpha(fallbackColor, 0.14) || background,
      accentChoice,
    };
  }

  const solidColor = accentColorMap[accentChoice] || '#6366F1';
  return {
    accentColor: solidColor,
    accentBackground: solidColor,
    accentText: accentTextMap[accentChoice] || '#FFFFFF',
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
