export const FONT_FAMILY_MAP = {
  system: "Inter, system-ui, Avenir, Helvetica, Arial, sans-serif",
  inter: "'Inter', sans-serif",
  roboto: "'Roboto', sans-serif",
  opensans: "'Open Sans', sans-serif",
  montserrat: "'Montserrat', sans-serif",
  lato: "'Lato', sans-serif",
  caveat: "'Caveat', cursive",
  georgia: "'Georgia', serif",
  merriweather: "'Merriweather', serif",
  spaceMono: "'Space Mono', 'SFMono-Regular', Menlo, Consolas, 'Liberation Mono', monospace",
  default: "Inter, system-ui, Avenir, Helvetica, Arial, sans-serif"
};

export const getFontFamilyValue = (key = 'system') => {
  const normalized = (key || 'system').toLowerCase();
  return FONT_FAMILY_MAP[normalized] || FONT_FAMILY_MAP.default;
};

export default getFontFamilyValue;

