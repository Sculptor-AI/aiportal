# Company Logos for AI Portal

This directory is for storing logo images for the AI model providers in the AI Portal application.

## Recommended Image Format
- Use SVG or PNG with transparency
- Square aspect ratio (1:1)
- Size: At least 128x128px
- Simple, recognizable designs work best

## Suggested Files

Place your logo files here with these suggested names:

- `gemini-logo.png` - Google's Gemini logo
- `claude-logo.png` - Anthropic's Claude logo
- `openai-logo.png` - OpenAI's logo for ChatGPT

## How to Use

After adding your logo files to this directory, you can update the ModelIcon component to use these images instead of the SVG icons:

```jsx
// In src/components/ModelIcon.jsx

// Add image imports
import geminiLogo from '/images/gemini-logo.png';
import claudeLogo from '/images/claude-logo.png';
import openaiLogo from '/images/openai-logo.png';

// Then in the ModelIcon component:
const getModelImage = (modelId) => {
  switch (modelId) {
    case 'gemini-2-flash':
      return geminiLogo;
    case 'claude-3.7-sonnet':
      return claudeLogo;
    case 'chatgpt-4o':
      return openaiLogo;
    default:
      return null;
  }
};

// Then in the render section:
const imageUrl = getModelImage(modelId);
return (
  <IconContainer 
    gradient={!imageUrl ? iconBackground : undefined}
    style={sizeStyle}
    inMessage={inMessage}
  >
    {imageUrl ? (
      <img src={imageUrl} alt={modelId} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
    ) : (
      iconComponent
    )}
  </IconContainer>
);
```

This will use the image files when available, and fall back to the SVG icons when not.