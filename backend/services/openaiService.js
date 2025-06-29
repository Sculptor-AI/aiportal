import OpenAI from 'openai';

/**
 * Initialize OpenAI client
 */
const initializeOpenAIClient = () => {
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured in environment variables");
  }
  
  return new OpenAI({
    apiKey: apiKey,
  });
};

/**
 * Map frontend model IDs to OpenAI model names
 */
const mapToOpenAIModel = (modelId) => {
  const modelMappings = {
    'gpt-4o': 'gpt-4o',
    'openai/gpt-4o': 'gpt-4o',
    'o3': 'o3',
    'openai/o3': 'o3',
  };
  
  return modelMappings[modelId] || modelId;
};

/**
 * Check if a model is an OpenAI model
 */
export const isOpenAIModel = (modelId) => {
  return modelId.startsWith('gpt-') || modelId.startsWith('openai/gpt');
};

/**
 * Process a non-streaming OpenAI chat request
 */
export const processOpenAIChat = async (modelType, prompt, imageData = null, systemPrompt = null, conversationHistory = []) => {
  try {
    const openai = initializeOpenAIClient();
    const modelName = mapToOpenAIModel(modelType);
    
    console.log(`Processing OpenAI request with model: ${modelName}`);
    
    // Build messages array
    const messages = [];
    
    // Add system prompt if provided
    if (systemPrompt) {
      messages.push({
        role: 'system',
        content: systemPrompt
      });
    }
    
    // Add conversation history
    if (conversationHistory && conversationHistory.length > 0) {
      messages.push(...conversationHistory);
    }
    
    // Prepare content for the user message
    let userContent;
    
    // Check if we have image data (for vision models)
    if (imageData && imageData.data && imageData.mediaType && modelName === 'gpt-4o') {
      userContent = [
        {
          type: 'text',
          text: prompt
        },
        {
          type: 'image_url',
          image_url: {
            url: `data:${imageData.mediaType};base64,${imageData.data}`
          }
        }
      ];
    } else {
      // Text-only content
      userContent = prompt;
    }
    
    messages.push({
      role: 'user',
      content: userContent
    });
    
    // Make the API call
    const completion = await openai.chat.completions.create({
      model: modelName,
      messages: messages,
      temperature: 0.7,
      max_tokens: 4096,
    });
    
    // Format response to match OpenRouter format for consistency
    return {
      id: completion.id,
      object: completion.object,
      created: completion.created,
      model: completion.model,
      choices: completion.choices,
      usage: completion.usage
    };
  } catch (error) {
    console.error('Error in OpenAI chat processing:', error);
    throw error;
  }
};

/**
 * Process a streaming OpenAI chat request
 */
export const streamOpenAIChat = async (modelType, prompt, imageData = null, systemPrompt = null, onChunk, conversationHistory = []) => {
  try {
    const openai = initializeOpenAIClient();
    const modelName = mapToOpenAIModel(modelType);
    
    console.log(`Processing streaming OpenAI request with model: ${modelName}`);
    
    // Build messages array
    const messages = [];
    
    // Add system prompt if provided
    if (systemPrompt) {
      messages.push({
        role: 'system',
        content: systemPrompt
      });
    }
    
    // Add conversation history
    if (conversationHistory && conversationHistory.length > 0) {
      messages.push(...conversationHistory);
    }
    
    // Prepare content for the user message
    let userContent;
    
    // Check if we have image data (for vision models)
    if (imageData && imageData.data && imageData.mediaType && modelName === 'gpt-4o') {
      userContent = [
        {
          type: 'text',
          text: prompt
        },
        {
          type: 'image_url',
          image_url: {
            url: `data:${imageData.mediaType};base64,${imageData.data}`
          }
        }
      ];
    } else {
      // Text-only content
      userContent = prompt;
    }
    
    messages.push({
      role: 'user',
      content: userContent
    });
    
    // Make the streaming API call
    const stream = await openai.chat.completions.create({
      model: modelName,
      messages: messages,
      temperature: 0.7,
      max_tokens: 4096,
      stream: true,
    });
    
    // Process the stream
    for await (const chunk of stream) {
      // Format as SSE event
      const sseData = {
        id: chunk.id,
        object: chunk.object,
        created: chunk.created,
        model: chunk.model,
        choices: chunk.choices
      };
      
      // Check if this is the final chunk
      if (chunk.choices[0]?.finish_reason) {
        onChunk(`data: ${JSON.stringify(sseData)}\n\n`);
        onChunk('data: [DONE]\n\n');
      } else {
        onChunk(`data: ${JSON.stringify(sseData)}\n\n`);
      }
    }
    
  } catch (error) {
    console.error('Error in OpenAI streaming:', error);
    throw error;
  }
};

/**
 * Get available OpenAI models
 */
export const getOpenAIModels = () => {
  return [
    {
      id: 'openai/gpt-4o',
      name: 'GPT-4o',
      provider: 'openai',
      source: 'openai',
      context_length: 128000,
      capabilities: ['text', 'vision'],
      pricing: {
        prompt: 0.005,
        completion: 0.015
      },
      isBackendModel: true
    },
    {
      id: 'openai/o3',
      name: 'ChatGPT o3',
      provider: 'openai',
      source: 'openai',
      context_length: 128000, // Placeholder - value inherited from GPT-4o
      capabilities: ['text'], // Placeholder - assuming text-only
      pricing: { // Placeholder - value inherited from GPT-4o
        prompt: 0.005,
        completion: 0.015
      },
      isBackendModel: true
    }
  ];
}; 