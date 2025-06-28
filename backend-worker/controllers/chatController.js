// Workers-compatible chat controller
import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * Process a chat completion request
 */
export const completeChat = async (request, env) => {
  try {
    const body = await request.json();
    const { modelType, prompt, search = false, deepResearch = false, imageGen = false, imageData = null, mode, systemPrompt } = body;
    
    // Validate inputs
    if (!prompt && !imageData) {
      return new Response(JSON.stringify({ error: "No content provided to send." }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    if (!modelType) {
      return new Response(JSON.stringify({ error: "Missing required parameter: modelType" }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Check allowed models
    const allowedModels = env.ALLOWED_MODELS?.split(',') || [];
    if (mode !== 'instant' && !allowedModels.includes(modelType)) {
      return new Response(JSON.stringify({ error: 'Invalid model type requested' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // If search is enabled, call search endpoint
    if (search) {
      console.log('Search functionality requested, performing search...');
      try {
        const searchUrl = new URL('/api/search-process', request.url);
        const searchRequest = new Request(searchUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: prompt,
            max_results: deepResearch ? 5 : 3,
            model_prompt: "Based on the search results above, please answer this question in a comprehensive way with the most up-to-date information. DO NOT mention or reference the sources in your answer, as they will be displayed separately.",
            modelType: modelType
          })
        });
        
        // Call the search endpoint
        const { searchAndProcess } = await import('./searchController.js');
        return await searchAndProcess(searchRequest, env);
      } catch (error) {
        console.error('Error in search processing:', error);
        // Fall back to normal completion
        console.log('Search failed, falling back to normal completion');
      }
    }
    
    // Model-specific adjustments
    let adjustedModelType = modelType;
    let providerConfig = null;

    if (mode === 'instant') {
      adjustedModelType = 'meta-llama/llama-4-scout';
      providerConfig = { only: ["Cerebras"] };
      console.log(`Instant mode detected. Overriding model to ${adjustedModelType} with provider Cerebras.`);
    } else {
      // Model mappings
      const modelMappings = {
        'google/gemini-2.5-pro-exp-03-25': 'google/gemini-pro-1.5',
        'deepseek/deepseek-v3-base:free': 'deepseek/deepseek-chat-v3-0324:free',
        'deepseek/deepseek-r1:free': 'deepseek/deepseek-r1'
      };
      
      if (modelMappings[modelType]) {
        console.log(`Adjusting model ID from ${modelType} to ${modelMappings[modelType]}`);
        adjustedModelType = modelMappings[modelType];
      }
    }
    
    // Prepare message content
    let messageContent;
    
    if (imageData && imageData.data && imageData.mediaType) {
      messageContent = [
        {
          type: "image",
          source: {
            type: "base64",
            media_type: imageData.mediaType,
            data: imageData.data
          }
        },
        {
          type: "text",
          text: prompt
        }
      ];
    } else {
      messageContent = prompt;
    }
    
    // Create OpenRouter payload
    const openRouterPayload = {
      model: adjustedModelType,
      messages: []
    };

    if (systemPrompt) {
      openRouterPayload.messages.push({ role: 'system', content: systemPrompt });
    }

    openRouterPayload.messages.push({
      role: 'user',
      content: messageContent
    });

    if (providerConfig) {
      openRouterPayload.provider = providerConfig;
    }
    
    console.log(`Sending request to OpenRouter with model: ${adjustedModelType}`);
    
    // Call OpenRouter API
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://ai.kaileh.dev',
        'X-Title': 'AI Portal'
      },
      body: JSON.stringify(openRouterPayload)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      return new Response(JSON.stringify({
        error: 'OpenRouter API error',
        details: errorData,
        modelType: modelType
      }), {
        status: response.status,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const aiResponse = await response.json();
    
    return new Response(JSON.stringify(aiResponse), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Error in chat completion:', error);
    
    return new Response(JSON.stringify({
      error: 'Failed to complete chat request',
      details: error.message,
      modelType: body?.modelType
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

/**
 * Process a streaming chat completion request
 */
export const streamChat = async (request, env) => {
  try {
    const body = await request.json();
    const { modelType, prompt, search, deepResearch, imageGen, imageData, fileTextContent, mode, systemPrompt } = body;
    
    if (!modelType || !prompt) {
      return new Response(JSON.stringify({ error: 'Missing required fields: modelType and prompt' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    console.log("Backend streamChat received:", { 
      modelType, 
      mode,
      promptLength: prompt?.length,
      hasImage: !!imageData,
      hasFileText: !!fileTextContent
    });
    
    // Convert boolean strings to actual booleans
    const doSearch = search === 'true' || search === true;
    const doDeepResearch = deepResearch === 'true' || deepResearch === true;
    
    // Create a TransformStream for SSE
    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();
    const encoder = new TextEncoder();
    
    // Handle the streaming in the background
    handleStreamingResponse(body, env, writer, encoder, request).catch(error => {
      console.error('Streaming error:', error);
      writer.write(encoder.encode(`data: ${JSON.stringify({ error: error.message })}\n\n`));
      writer.close();
    });
    
    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': getAllowedOrigin(request),
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    });
  } catch (error) {
    console.error('Error in streaming chat:', error);
    
    return new Response(JSON.stringify({ 
      error: 'Failed to initiate streaming chat',
      details: error.message,
      modelType: body?.modelType
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

async function handleStreamingResponse(body, env, writer, encoder, request) {
  const { modelType, prompt, search, deepResearch, imageData, fileTextContent, mode, systemPrompt } = body;
  
  // Handle search if enabled
  if (search === true || search === 'true') {
    try {
      const searchUrl = new URL('/api/search-process', request.url);
      const searchRequest = new Request(searchUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: prompt,
          max_results: deepResearch ? 5 : 3,
          model_prompt: "Based on the search results above, please answer this question in a comprehensive way with the most up-to-date information.",
          modelType: modelType
        })
      });
      
      const { searchAndProcess } = await import('./searchController.js');
      const searchResponse = await searchAndProcess(searchRequest, env);
      const searchData = await searchResponse.json();
      
      // Stream the search results
      if (searchData.sources && searchData.sources.length > 0) {
        const sourceEvent = {
          type: 'sources',
          sources: searchData.sources
        };
        await writer.write(encoder.encode(`data: ${JSON.stringify(sourceEvent)}\n\n`));
      }
      
      // Stream the content
      if (searchData.result?.choices?.[0]?.message?.content) {
        const content = searchData.result.choices[0].message.content;
        await writer.write(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`));
      } else if (searchData.choices?.[0]?.message?.content) {
        const content = searchData.choices[0].message.content;
        await writer.write(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`));
      }
      
      await writer.write(encoder.encode('data: [DONE]\n\n'));
      await writer.close();
      return;
    } catch (error) {
      console.error('Error in search processing:', error);
      await writer.write(encoder.encode(`data: Error performing search: ${error.message}\n\n`));
      await writer.write(encoder.encode('data: Falling back to regular model response.\n\n'));
    }
  }
  
  // Prepare model and payload
  let adjustedModelType = modelType;
  let providerConfig = null;
  
  if (mode === 'instant') {
    adjustedModelType = 'meta-llama/llama-4-scout';
    providerConfig = { only: ["Cerebras"] };
  }
  
  // Prepare message content
  let messageContent;
  if (fileTextContent && imageData) {
    messageContent = [
      {
        type: "image",
        source: {
          type: "base64",
          media_type: imageData.mediaType,
          data: imageData.data
        }
      },
      {
        type: "text",
        text: `File Content:\n${fileTextContent}\n\nUser Message:\n${prompt}`
      }
    ];
  } else if (imageData) {
    messageContent = [
      {
        type: "image",
        source: {
          type: "base64",
          media_type: imageData.mediaType,
          data: imageData.data
        }
      },
      {
        type: "text",
        text: prompt
      }
    ];
  } else if (fileTextContent) {
    messageContent = `File Content:\n${fileTextContent}\n\nUser Message:\n${prompt}`;
  } else {
    messageContent = prompt;
  }
  
  // Create OpenRouter payload
  const openRouterPayload = {
    model: adjustedModelType,
    messages: [],
    stream: true
  };
  
  if (systemPrompt) {
    openRouterPayload.messages.push({ role: 'system', content: systemPrompt });
  }
  
  openRouterPayload.messages.push({
    role: 'user',
    content: messageContent
  });
  
  if (providerConfig) {
    openRouterPayload.provider = providerConfig;
  }
  
  // Make streaming request to OpenRouter
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://ai.kaileh.dev',
      'X-Title': 'AI Portal'
    },
    body: JSON.stringify(openRouterPayload)
  });
  
  if (!response.ok) {
    const error = await response.text();
    await writer.write(encoder.encode(`data: ${JSON.stringify({ error })}\n\n`));
    await writer.close();
    return;
  }
  
  // Stream the response
  const reader = response.body.getReader();
  
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      // Forward the chunk directly
      await writer.write(value);
    }
  } finally {
    await writer.close();
  }
}

// Helper function to get allowed origin
function getAllowedOrigin(request) {
  const origin = request.headers.get('Origin');
  const allowedOrigins = [
    'https://ai.kaileh.dev',
    'http://localhost:3009',
    'http://localhost:3010'
  ];
  
  if (allowedOrigins.includes(origin)) {
    return origin;
  }
  
  return allowedOrigins[0];
} 