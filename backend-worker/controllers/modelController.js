export const getModels = async (request, env) => {
  const models = [
    {
      id: 'chatgpt-4o',
      name: 'ChatGPT-4o',
      description: 'Latest GPT-4 Omni model with vision capabilities',
      provider: 'openai',
      capabilities: ['chat', 'vision', 'code']
    },
    {
      id: 'claude-3.7-sonnet',
      name: 'Claude 3.5 Sonnet',
      description: 'Anthropic\'s balanced model for general tasks',
      provider: 'anthropic',
      capabilities: ['chat', 'vision', 'code']
    },
    {
      id: 'gemini-2-flash',
      name: 'Gemini 2.0 Flash',
      description: 'Google\'s fast multimodal model',
      provider: 'google',
      capabilities: ['chat', 'vision']
    },
    {
      id: 'meta-llama/llama-4-maverick:free',
      name: 'Llama 4 Maverick (Free)',
      description: 'Meta\'s open-source model',
      provider: 'meta',
      capabilities: ['chat']
    }
  ];
  
  return new Response(JSON.stringify({ models }), {
    headers: { 'Content-Type': 'application/json' }
  });
};
