import React from 'react';
import styled, { useTheme } from 'styled-components';
import { modelThemes } from '../styles/themes';
import { useAuth } from '../contexts/AuthContext';

// Moved sizeMap to module scope
const sizeMap = {
  small: { width: '24px', height: '24px', fontSize: '11px', padding: '3px' }, // Adjusted fontSize for small
  medium: { width: '32px', height: '32px', fontSize: '14px', padding: '6px' },
  large: { width: '40px', height: '40px', fontSize: '16px', padding: '8px' }
};

const ModelImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

// SVG icons as fallbacks for models without images
const GeminiIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="white">
    <path d="M12 1.5c-1.72 0-3.43.5-4.9 1.5L4.2 4.8C3.1 5.6 2.1 6.3 1.4 7.6c-.4.7-.7 1.4-.9 2.1C.1 11.3 0 12.6 0 13.9c0 1.2.3 2.4.6 3.3.3.9.9 1.8 1.6 2.5.7.7 1.6 1.2 2.5 1.6.9.4 1.9.7 2.9.7h8.7c1 0 2-.3 2.9-.7.9-.4 1.8-.9 2.5-1.6.7-.7 1.3-1.6 1.6-2.5.4-.9.6-2.1.6-3.3 0-1.3-.1-2.6-.5-3.8-.2-.7-.5-1.4-.9-2.1-.7-1.3-1.7-2-2.8-2.8-1.3-.7-2.7-1.5-4.2-2.3-1.5-1-3.2-1.5-4.9-1.5zm0 2c1.4 0 2.8.4 4 1.1l2.8 1.4c1.3.6 1.8 1.1 2.3 1.7.5.6.8 1 1 1.5.3.5.4 1.1.6 2 .2.8.3 1.8.3 2.8 0 .9-.1 1.8-.4 2.4-.2.6-.5 1.2-1 1.7-.5.5-1.1.9-1.7 1.1-.6.3-1.3.4-2.4.4h-8.7c-.9 0-1.6-.1-2.2-.3-.6-.2-1.2-.6-1.7-1-.5-.4-.9-1-1.1-1.8-.2-.8-.3-1.6-.3-2.5 0-1.1.1-2 .3-2.8.1-.9.4-1.5.6-2 .2-.5.5-.9 1-1.5.5-.6 1-1.1 2.3-1.7l3.2-1.8c1.2-.7 2.6-1.1 4-1.1z" />
    <path d="M10.8 15.9 8.1 13.2 6.9 14.4 10.8 18.3 17.1 12 15.9 10.8z" />
  </svg>
);

const ClaudeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="white">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-4-8c0-2.21 1.79-4 4-4s4 1.79 4 4-1.79 4-4 4-4-1.79-4-4z" />
  </svg>
);

const ChatGPTIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="white">
    <path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997z" />
  </svg>
);

// Custom model icon
const CustomModelIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="white">
    <path d="M20 5H4c-1.1 0-1.99.9-1.99 2L2 17c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm-9 3h2v2h-2V8zm0 3h2v2h-2v-2zM8 8h2v2H8V8zm0 3h2v2H8v-2zm-1 2H5v-2h2v2zm0-3H5V8h2v2zm9 7H8v-2h8v2zm0-4h-2v-2h2v2zm0-3h-2V8h2v2zm3 3h-2v-2h2v2zm0-3h-2V8h2v2z" />
  </svg>
);

// Map model IDs to their respective logo files
const MODEL_LOGOS = {
  // OpenAI models
  'openai/gpt-4o': '/images/openai-logo.png',
  'chatgpt-4o': '/images/openai-logo.png',

  // Google models
  'google/gemini-2.5-pro-exp-03-25': '/images/gemini-logo.png',
  'gemini-2.5-pro': '/images/gemini-logo.png',
  'gemini-2-flash': '/images/gemini-logo.png',

  // DeepSeek models
  'deepseek/deepseek-v3-base:free': '/images/deepseek-logo.png',
  'deepseek/deepseek-r1:free': '/images/deepseek-logo.png',

  // Meta models
  'meta-llama/llama-4-maverick:free': '/images/meta-logo.png',
  'llama-3-70b-instruct': '/images/meta-logo.png',

  // Claude models
  'claude-3.7-sonnet': '/images/claude-logo.png',
  'anthropic/claude-3-haiku': '/images/claude-logo.png',
  'anthropic/claude-3-opus': '/images/claude-logo.png',
  'anthropic/claude-3-sonnet': '/images/claude-logo.png',

  // Grok models
  'grok-beta': '/images/grok-logo.png',
  'x-ai/grok-beta': '/images/grok-logo.png',

  // Sculptor model
  'ursa-minor': '/images/sculptor.svg'
};

const ModelIconContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${props => props.$useImage ? 'transparent' : (props.theme.modelIconBackground || '#f0f0f0')};
  border-radius: 50%;
  padding: ${props => sizeMap[props.size]?.padding || sizeMap.medium.padding};
  width: ${props => sizeMap[props.size]?.width || sizeMap.medium.width};
  height: ${props => sizeMap[props.size]?.height || sizeMap.medium.height};
  font-size: ${props => sizeMap[props.size]?.fontSize || sizeMap.medium.fontSize}; // Added font-size from sizeMap
  color: white; // Ensure fallback text (like the letter) is white
  font-weight: bold; // Ensure fallback text is bold
  box-shadow: none;
  transition: all 0.2s ease-in-out;
  margin: ${props => props.$noMargin ? '0' : '0 0px'}; /* Adjusted default margin for alignment */
  flex-shrink: 0; /* Prevent shrinking in flex layouts */
  overflow: hidden;

  img, svg {
    width: 100%;
    height: 100%;
    object-fit: contain; // Keeping contain but since it's circle now, maybe cover?
  }
`;

const ModelIcon = ({ modelId, size = 'medium', $inMessage = false }) => {
  const theme = useTheme();
  const { settings } = useAuth(); // Access settings from AuthContext
  let iconComponent;
  let iconBackground;

  const model = modelThemes[modelId] || {};

  // Check if this is a custom model first
  const isCustomModel = modelId?.startsWith('custom-');

  // Try to get image from the MODEL_LOGOS mapping (unless it's a custom model)
  let imageUrl = !isCustomModel ? MODEL_LOGOS[modelId] : null;

  // For custom models, we'll use the emoji instead of an image
  if (isCustomModel) {
    // Get the available models from the parent context to find the emoji
    // Since we don't have access to availableModels here, we'll need to parse the model ID
    // The modelId format is 'custom-{id}', we need to get the emoji from localStorage
    try {
      const customModelsJson = localStorage.getItem('customModels');
      if (customModelsJson) {
        const customModels = JSON.parse(customModelsJson);
        const modelNumericId = modelId.replace('custom-', '');
        const customModel = customModels.find(m => m.id.toString() === modelNumericId);
        if (customModel && customModel.avatar) {
          iconComponent = <span style={{ fontSize: '1.2em' }}>{customModel.avatar}</span>;
          iconBackground = 'transparent';
        } else {
          // Fallback to first letter
          iconComponent = 'C';
          iconBackground = '#888';
        }
      }
    } catch (err) {
      console.error('Error getting custom model emoji:', err);
      iconComponent = 'C';
      iconBackground = '#888';
    }
  } else {
    // If we don't have an exact match, try to find a partial match
    if (!imageUrl) {
      // Check if the modelId contains any of our known provider names
      if (modelId?.includes('mercury')) {
        imageUrl = '/images/inception-logo.png';
      } else if (modelId?.includes('openai') || modelId?.includes('gpt')) {
        imageUrl = '/images/openai-logo.png';
      } else if (modelId?.includes('gemini')) {
        imageUrl = '/images/gemini-logo.png';
      } else if (modelId?.includes('claude') || modelId?.includes('anthropic')) {
        imageUrl = '/images/claude-logo.png';
      } else if (modelId?.includes('llama') || modelId?.includes('meta')) {
        imageUrl = '/images/meta-logo.png';
      } else if (modelId?.includes('deepseek')) {
        imageUrl = '/images/deepseek-logo.png';
      } else if (modelId?.includes('grok') || modelId?.includes('x-ai')) {
        imageUrl = '/images/grok-logo.png';
      }
    }

    // If no image available, set icon based on model
    if (!imageUrl) {
      switch (true) {
        case modelId?.includes('gemini'):
          iconComponent = <GeminiIcon />;
          iconBackground = model.gradient || modelThemes['gemini-2-flash']?.gradient;
          break;
        case modelId?.includes('claude') || modelId?.includes('anthropic'):
          iconComponent = <ClaudeIcon />;
          iconBackground = model.gradient;
          break;
        case modelId?.includes('gpt') || modelId?.includes('openai'):
          iconComponent = <ChatGPTIcon />;
          iconBackground = model.gradient;
          break;
        case modelId?.includes('custom-gguf'):
          iconComponent = <CustomModelIcon />;
          iconBackground = model.gradient;
          break;
        default:
          // Default icon (first letter of model name)
          const firstLetter = modelId?.charAt(0)?.toUpperCase() || '?';
          iconComponent = firstLetter;
          iconBackground = '#888';
      }
    }
  }

  const $useImage = !!imageUrl;
  const $noMargin = $inMessage && !!imageUrl; // Determine if margin should be applied

  return (
    <ModelIconContainer
      size={size}
      theme={theme}
      $inMessage={$inMessage}
      $useImage={$useImage}
      $noMargin={$noMargin}
      style={{ background: !$useImage && iconBackground ? iconBackground : undefined }}
      title={`${model?.name || modelId} (${model?.provider || 'Local'})`}
    >
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={modelId}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            filter: 'none'
          }}
        />
      ) : (
        iconComponent
      )}
    </ModelIconContainer>
  );
};

export default ModelIcon;
