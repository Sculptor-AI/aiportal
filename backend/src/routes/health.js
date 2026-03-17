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
import getDeepResearchConfig from '../config/deepResearch.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

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
health.get('/models/config', requireAuth, requireAdmin, (c) => {
  return c.json(getModelsConfig());
});

/**
 * List all supported capabilities
 */
health.get('/capabilities', (c) => {
  const deepResearch = getDeepResearchConfig(c.env || {});
  const chatModels = listChatModels();
  const getModelsByCapability = (provider, capability) =>
    chatModels
      .filter((model) => model.provider === provider && model.capabilities?.[capability])
      .map((model) => model.id);

  const openAIWebSearchModels = getModelsByCapability('openai', 'web_search');
  const anthropicWebSearchModels = getModelsByCapability('anthropic', 'web_search');
  const geminiWebSearchModels = getModelsByCapability('gemini', 'web_search');
  const openAICodeExecutionModels = getModelsByCapability('openai', 'code_execution');
  const anthropicCodeExecutionModels = getModelsByCapability('anthropic', 'code_execution');
  const geminiCodeExecutionModels = getModelsByCapability('gemini', 'code_execution');
  const urlContextModels = chatModels
    .filter((model) => model.capabilities?.url_context)
    .map((model) => model.id);
  const reasoningEffortModels = chatModels
    .filter((model) => model.capabilities?.reasoning_effort)
    .map((model) => model.id);

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
        google: geminiWebSearchModels,
        anthropic: anthropicWebSearchModels,
        openai: openAIWebSearchModels,
        openrouter: true
      },

      // Code execution
      code_execution: {
        gemini: geminiCodeExecutionModels,
        anthropic: anthropicCodeExecutionModels,
        openai: openAICodeExecutionModels
      },

      // Reasoning/Thinking
      reasoning: {
        display_thinking: ['gemini', 'anthropic', 'openai'],
        reasoning_effort: reasoningEffortModels
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
      url_context: urlContextModels,

      // Deep research orchestration
      deep_research: {
        enabled: deepResearch.enabled,
        planner_model: deepResearch.plannerModel,
        researcher_model: deepResearch.researcherModel,
        writer_model: deepResearch.writerModel,
        default_agents: deepResearch.defaultMaxAgents,
        max_agents: deepResearch.maxAgents
      }
    }
  });
});

/**
 * Get API key status (without exposing keys)
 */
health.get('/status', requireAuth, requireAdmin, (c) => {
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
