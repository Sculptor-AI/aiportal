import { GoogleGenerativeAI } from "@google/generative-ai";

/**
 * Initialize Gemini client
 */
const initializeGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured in environment variables");
  }
  
  return new GoogleGenerativeAI(apiKey);
};

/**
 * Map frontend model IDs to Gemini model names
 */
const mapToGeminiModel = (modelId) => {
  const modelMappings = {
    'gemini-2.5-flash': 'gemini-2.5-flash',
    'google/gemini-2.5-flash': 'gemini-2.5-flash',
    'google/gemini-2.0-flash': 'gemini-2.5-flash',
    'gemini-2.0-flash': 'gemini-2.5-flash',

    'gemini-2.5-pro': 'gemini-2.5-pro',
    'google/gemini-2.5-pro': 'gemini-2.5-pro',
    'google/gemini-pro': 'gemini-2.5-pro',
    'google/gemini-pro-vision': 'gemini-2.5-pro',
    'gemini-pro': 'gemini-2.5-pro',
  };
  
  return modelMappings[modelId] || modelId;
};

/**
 * Check if a model is a Gemini model
 */
export const isGeminiModel = (modelId) => {
  return modelId.startsWith('gemini-') || modelId.startsWith('google/gemini');
};

/**
 * Process a non-streaming Gemini chat request
 */
export const processGeminiChat = async (modelType, prompt, imageData = null, systemPrompt = null) => {
  try {
    const genAI = initializeGeminiClient();
    const modelName = mapToGeminiModel(modelType);
    
    console.log(`Processing Gemini request with model: ${modelName}`);
    
    const model = genAI.getGenerativeModel({ model: modelName });
    
    // Build the prompt with system prompt if provided
    let fullPrompt = prompt;
    if (systemPrompt) {
      fullPrompt = `${systemPrompt}\n\nUser: ${prompt}`;
    }
    
    // Prepare the content parts
    const parts = [];
    
    // Add text prompt
    parts.push({ text: fullPrompt });
    
    // Add image if provided
    if (imageData && imageData.data && imageData.mediaType) {
      parts.push({
        inlineData: {
          mimeType: imageData.mediaType,
          data: imageData.data
        }
      });
    }
    
    // Generate content
    const result = await model.generateContent(parts);
    const response = await result.response;
    const text = response.text();
    
    // Format response to match OpenRouter format for consistency
    return {
      id: `gemini-${Date.now()}`,
      object: 'chat.completion',
      created: Math.floor(Date.now() / 1000),
      model: modelName,
      choices: [{
        index: 0,
        message: {
          role: 'assistant',
          content: text
        },
        finish_reason: 'stop'
      }],
      usage: {
        prompt_tokens: -1, // Gemini doesn't provide token counts
        completion_tokens: -1,
        total_tokens: -1
      }
    };
  } catch (error) {
    console.error('Error in Gemini chat processing:', error);
    throw error;
  }
};

/**
 * Process a streaming Gemini chat request
 */
export const streamGeminiChat = async (modelType, prompt, imageData = null, systemPrompt = null, onChunk) => {
  try {
    const genAI = initializeGeminiClient();
    const modelName = mapToGeminiModel(modelType);
    
    console.log(`Processing streaming Gemini request with model: ${modelName}`);
    
    const model = genAI.getGenerativeModel({ model: modelName });
    
    // Build the prompt with system prompt if provided
    let fullPrompt = prompt;
    if (systemPrompt) {
      fullPrompt = `${systemPrompt}\n\nUser: ${prompt}`;
    }
    
    // Prepare the content parts
    const parts = [];
    
    // Add text prompt
    parts.push({ text: fullPrompt });
    
    // Add image if provided
    if (imageData && imageData.data && imageData.mediaType) {
      parts.push({
        inlineData: {
          mimeType: imageData.mediaType,
          data: imageData.data
        }
      });
    }
    
    // Generate content with streaming
    const result = await model.generateContentStream(parts);
    
    // Process the stream
    for await (const chunk of result.stream) {
      const chunkText = chunk.text();
      if (chunkText) {
        // Format as SSE event matching OpenRouter format
        const sseData = {
          id: `gemini-${Date.now()}`,
          object: 'chat.completion.chunk',
          created: Math.floor(Date.now() / 1000),
          model: modelName,
          choices: [{
            index: 0,
            delta: {
              content: chunkText
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
    console.error('Error in Gemini streaming:', error);
    throw error;
  }
};

/**
 * Get available Gemini models
 */
export const getGeminiModels = () => {
  return [
    {
      id: 'google/gemini-2.5-flash',
      name: 'Gemini 2.5 Flash',
      provider: 'google',
      source: 'gemini',
      context_length: 1048576,
      capabilities: ['text', 'vision'],
      pricing: {
        prompt: 0.00001,
        completion: 0.00003
      },
      isBackendModel: true
    },
    {
      id: 'google/gemini-2.5-pro',
      name: 'Gemini 2.5 Pro',
      provider: 'google',
      source: 'gemini',
      context_length: 1048576,
      capabilities: ['text', 'vision', 'audio'],
      pricing: {
        prompt: 0.0005,
        completion: 0.0015
      },
      isBackendModel: true
    }
  ];
}; 