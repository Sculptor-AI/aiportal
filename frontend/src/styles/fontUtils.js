export const FONT_FAMILY_MAP = {
  system: "-apple-system, BlinkMacSystemFont, 'San Francisco', 'Segoe UI', Roboto, sans-serif",
  inter: "'Inter', sans-serif",
  roboto: "'Roboto', sans-serif",
  opensans: "'Open Sans', sans-serif",
  georgia: "'Georgia', serif",
  merriweather: "'Merriweather', serif",
  default: "Inter, system-ui, Avenir, Helvetica, Arial, sans-serif"
};

export const getFontFamilyValue = (fontKey = 'system') => {
  if (!fontKey) return FONT_FAMILY_MAP.default;
  return FONT_FAMILY_MAP[fontKey] || FONT_FAMILY_MAP.default;
};
