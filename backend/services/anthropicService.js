import Anthropic from '@anthropic-ai/sdk';

/**
 * Initialize Anthropic client
 */
const initializeAnthropicClient = () => {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY is not configured in environment variables");
  }
  
  return new Anthropic({
    apiKey: apiKey,
  });
};

/**
 * Map frontend model IDs to Anthropic model names
 */
const mapToAnthropicModel = (modelId) => {
  const modelMappings = {
    'claude-4-opus': 'claude-opus-4-20250514',
    'anthropic/claude-4-opus': 'claude-opus-4-20250514',
    'claude-4-sonnet': 'claude-sonnet-4-20250514',
    'anthropic/claude-4-sonnet': 'claude-sonnet-4-20250514',
  };
  
  return modelMappings[modelId] || modelId;
};

/**
 * Check if a model is an Anthropic model
 */
export const isAnthropicModel = (modelId) => {
  return modelId.startsWith('claude-') || modelId.startsWith('anthropic/claude');
};

/**
 * Process a non-streaming Anthropic chat request
 */
export const processAnthropicChat = async (modelType, prompt, imageData = null, systemPrompt = null, conversationHistory = []) => {
  try {
    const anthropic = initializeAnthropicClient();
    const modelName = mapToAnthropicModel(modelType);
    
    console.log(`Processing Anthropic request with model: ${modelName}`);
    
    // Build messages array
    const messages = [];
    
    // Add conversation history
    if (conversationHistory && conversationHistory.length > 0) {
      messages.push(...conversationHistory);
    }
    
    // Prepare content for the current message
    const content = [];
    
    // Add text prompt
    content.push({
      type: 'text',
      text: prompt
    });
    
    // Add image if provided
    if (imageData && imageData.data && imageData.mediaType) {
      content.push({
        type: 'image',
        source: {
          type: 'base64',
          media_type: imageData.mediaType,
          data: imageData.data
        }
      });
    }
    
    messages.push({
      role: 'user',
      content: content
    });
    
    // Make the API call
    const completion = await anthropic.messages.create({
      model: modelName,
      messages: messages,
      system: systemPrompt || undefined,
      max_tokens: 4096,
    });
    
    // Format response to match OpenRouter format for consistency
    return {
      id: completion.id,
      object: 'chat.completion',
      created: Math.floor(Date.now() / 1000),
      model: modelName,
      choices: [{
        index: 0,
        message: {
          role: 'assistant',
          content: completion.content[0].text
        },
        finish_reason: completion.stop_reason || 'stop'
      }],
      usage: {
        prompt_tokens: completion.usage?.input_tokens || -1,
        completion_tokens: completion.usage?.output_tokens || -1,
        total_tokens: (completion.usage?.input_tokens || 0) + (completion.usage?.output_tokens || 0) || -1
      }
    };
  } catch (error) {
    console.error('Error in Anthropic chat processing:', error);
    throw error;
  }
};

/**
 * Process a streaming Anthropic chat request
 */
export const streamAnthropicChat = async (modelType, prompt, imageData = null, systemPrompt = null, onChunk, conversationHistory = []) => {
  try {
    const anthropic = initializeAnthropicClient();
    const modelName = mapToAnthropicModel(modelType);
    
    console.log(`Processing streaming Anthropic request with model: ${modelName}`);
    
    // Build messages array
    const messages = [];
    
    // Add conversation history
    if (conversationHistory && conversationHistory.length > 0) {
      messages.push(...conversationHistory);
    }
    
    // Prepare content for the current message
    const content = [];
    
    // Add text prompt
    content.push({
      type: 'text',
      text: prompt
    });
    
    // Add image if provided
    if (imageData && imageData.data && imageData.mediaType) {
      content.push({
        type: 'image',
        source: {
          type: 'base64',
          media_type: imageData.mediaType,
          data: imageData.data
        }
      });
    }
    
    messages.push({
      role: 'user',
      content: content
    });
    
    // Make the streaming API call
    const stream = await anthropic.messages.create({
      model: modelName,
      messages: messages,
      system: systemPrompt || undefined,
      max_tokens: 4096,
      stream: true,
    });
    
    // Process the stream
    for await (const event of stream) {
      if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
        // Format as SSE event matching OpenRouter format
        const sseData = {
          id: `anthropic-${Date.now()}`,
          object: 'chat.completion.chunk',
          created: Math.floor(Date.now() / 1000),
          model: modelName,
          choices: [{
            index: 0,
            delta: {
              content: event.delta.text
            },
            finish_reason: null
          }]
        };
        
        onChunk(`data: ${JSON.stringify(sseData)}\n\n`);
      }
    }
    
    // Send the final done message
    onChunk('data: [DONE]\n\n');
    
  } catch (error) {
    console.error('Error in Anthropic streaming:', error);
    throw error;
  }
};

/**
 * Get available Anthropic models
 */
export const getAnthropicModels = () => {
  return [
    {
      id: 'anthropic/claude-4-opus',
      name: 'Claude 4 Opus',
      provider: 'anthropic',
      source: 'anthropic',
      context_length: 200000,
      capabilities: ['text', 'vision'],
      pricing: {
        prompt: 0.015,
        completion: 0.075
      },
      isBackendModel: true
    },
    {
      id: 'anthropic/claude-4-sonnet',
      name: 'Claude 4 Sonnet',
      provider: 'anthropic',
      source: 'anthropic',
      context_length: 200000,
      capabilities: ['text', 'vision'],
      pricing: {
        prompt: 0.003,
        completion: 0.015
      },
      isBackendModel: true
    }
  ];
}; 