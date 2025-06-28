export const getModels = async (request, env) => {
  const models = [
    {
      id: 'chatgpt-4o',
      name: 'ChatGPT-4o',
      description: 'Latest GPT-4 Omni model with vision capabilities',
      provider: 'openai',
      capabilities: ['chat', 'vision', 'code'],
      supportsStreaming: true
    },
    {
      id: 'claude-3.7-sonnet',
      name: 'Claude 3.5 Sonnet',
      description: 'Anthropic\'s balanced model for general tasks',
      provider: 'anthropic',
      capabilities: ['chat', 'vision', 'code'],
      supportsStreaming: true
    },
    {
      id: 'gemini-2-flash',
      name: 'Gemini 2.0 Flash',
      description: 'Google\'s fast multimodal model',
      provider: 'google',
      capabilities: ['chat', 'vision'],
      supportsStreaming: true
    },
    {
      id: 'gemini-2.5-pro',
      name: 'Gemini 2.5 Pro',
      description: 'Google\'s advanced model with enhanced capabilities',
      provider: 'google',
      capabilities: ['chat', 'vision', 'code'],
      supportsStreaming: true
    },
    {
      id: 'meta-llama/llama-4-maverick:free',
      name: 'Llama 4 Maverick (Free)',
      description: 'Meta\'s open-source model',
      provider: 'meta',
      capabilities: ['chat'],
      supportsStreaming: true
    },
    {
      id: 'deepseek/deepseek-chat-v3-0324:free',
      name: 'DeepSeek V3 (Free)',
      description: 'Advanced reasoning model',
      provider: 'deepseek',
      capabilities: ['chat', 'code'],
      supportsStreaming: true
    },
    {
      id: 'nemotron-super-49b',
      name: 'Nemotron Super 49B',
      description: 'NVIDIA\'s powerful language model',
      provider: 'nvidia',
      capabilities: ['chat', 'code'],
      supportsStreaming: true
    }
  ];
  
  return new Response(JSON.stringify({ models }), {
    headers: { 'Content-Type': 'application/json' }
  });
};
