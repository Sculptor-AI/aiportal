const fontMap = {
  system: "Inter, system-ui, Avenir, Helvetica, Arial, sans-serif",
  inter: "'Inter', sans-serif",
  roboto: "'Roboto', sans-serif",
  opensans: "'Open Sans', sans-serif",
  montserrat: "'Montserrat', sans-serif",
  lato: "'Lato', sans-serif",
  caveat: "'Caveat', cursive",
  georgia: "'Georgia', serif",
  merriweather: "'Merriweather', serif",
};

export const getFontFamilyValue = (key) => {
  const normalized = (key || 'system').toLowerCase();
  return fontMap[normalized] || fontMap.system;
};

export default getFontFamilyValue;
