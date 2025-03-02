// Update the component that displays model info in messages:

const getModelDisplayName = (modelId) => {
  switch(modelId) {
    case 'gemini-2-flash':
      return 'Gemini';
    case 'claude-3.7-sonnet':
      return 'Anthropic';
    case 'chatgpt-4o':
      return 'OpenAI';
    case 'ursa-minor':
      return 'SculptorAI'; // Changed from OpenAI to SculptorAI
    default:
      return 'AI';
  }
};