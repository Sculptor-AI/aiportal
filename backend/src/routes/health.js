/**
 * Health Check & Models Routes
 */

import { Hono } from 'hono';
import { nowIso } from '../state.js';
import { 
  getModelsConfig, 
  listChatModels, 
  listImageModels
} from '../config/index.js';

const health = new Hono();

/**
 * Health check endpoint
 */
health.get('/health', (c) => c.json({ ok: true, time: nowIso() }));

/**
 * List available AI models across all providers
 * Uses centralized config from models.json
 * Includes capabilities per model for frontend feature toggling
 */
health.get('/models', (c) => {
  const chatModels = listChatModels();
  
  // Format for API response - include capabilities for frontend
  const models = chatModels.map(m => ({
    id: m.id,
    apiId: m.apiId,
    provider: m.provider,
    isDefault: m.isDefault,
    capabilities: m.capabilities || {}
  }));

  return c.json({ 
    models,
    _note: 'Model mappings are defined in src/config/models.json. Update that file when providers release new models.'
  });
});

/**
 * Get raw models configuration
 * Useful for debugging and frontend model selection
 */
health.get('/models/config', (c) => {
  return c.json(getModelsConfig());
});

/**
 * List all supported capabilities
 */
health.get('/capabilities', (c) => {
  return c.json({
    capabilities: {
      // Chat features
      chat: {
        streaming: true,
        non_streaming: true,
        system_prompts: true
      },

      // Vision/Multimodal
      vision: {
        images: true,
        image_urls: true,
        base64_images: true,
        pdfs: ['anthropic', 'gemini'],
        audio_input: [],
        video_input: []
      },

      // Tool use
      tools: {
        function_calling: true,
        parallel_tool_calls: true,
        tool_choice: ['auto', 'none', 'required', 'specific']
      },

      // Web search
      web_search: {
        google: ['gemini'],
        anthropic: ['claude-sonnet-4.5'],
        openai: ['gpt-5.2', 'gpt-4o'],
        openrouter: true
      },

      // Code execution
      code_execution: {
        gemini: true
      },

      // Reasoning/Thinking
      reasoning: {
        display_thinking: ['gemini', 'anthropic'],
        reasoning_effort: ['openai']
      },

      // Structured outputs
      structured_outputs: {
        json_mode: true,
        json_schema: true
      },

      // Generation
      image_generation: {
        models: listImageModels()
      },

      // Provider-specific features
      computer_use: ['anthropic'],
      citations: ['anthropic'],
      url_context: ['gemini']
    }
  });
});

/**
 * Get API key status (without exposing keys)
 */
health.get('/status', (c) => {
  const env = c.env;

  return c.json({
    providers: {
      openrouter: {
        configured: !!env.OPENROUTER_API_KEY,
        description: 'Access to 200+ models via unified API'
      },
      gemini: {
        configured: !!env.GEMINI_API_KEY,
        description: 'Direct Google Gemini, Imagen access'
      },
      anthropic: {
        configured: !!env.ANTHROPIC_API_KEY,
        description: 'Direct Claude API access'
      },
      openai: {
        configured: !!env.OPENAI_API_KEY,
        description: 'Direct OpenAI API access'
      }
    }
  });
});

export default health;
