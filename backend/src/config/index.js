/**
 * Configuration loader
 * 
 * Loads model configuration from models.json
 * Update models.json when providers release new models
 */

import modelsConfig from './models.json';

/**
 * Get all model configurations
 */
export function getModelsConfig() {
  return modelsConfig;
}

/**
 * Get the global default model
 */
export function getGlobalDefault() {
  return modelsConfig.default || 'gpt-5.2';
}

/**
 * Resolve a model name to its API identifier
 * Handles "latest" as an alias for the global default
 */
export function resolveModel(provider, modelName) {
  // Handle "latest" as global default
  if (modelName === 'latest') {
    const defaultModel = modelsConfig.default;
    // Find which provider has this model and resolve it
    for (const [p, config] of Object.entries(modelsConfig.chat || {})) {
      if (config.models?.[defaultModel]) {
        return config.models[defaultModel];
      }
    }
    return defaultModel;
  }

  const providerConfig = modelsConfig.chat?.[provider];
  if (!providerConfig) {
    return modelName; // Return as-is if provider not found
  }

  // Look up in models map
  if (providerConfig.models?.[modelName]) {
    return providerConfig.models[modelName];
  }

  // Return as-is if not found (might already be an API ID)
  return modelName;
}

/**
 * Get default model API ID for a provider
 */
export function getDefaultModel(provider) {
  const config = modelsConfig.chat?.[provider];
  if (!config) return null;
  
  // Use global default if it belongs to this provider
  const globalDefault = modelsConfig.default;
  if (config.models?.[globalDefault]) {
    return config.models[globalDefault];
  }
  
  // Otherwise return first model in the provider's list
  const firstModel = Object.keys(config.models || {})[0];
  return config.models?.[firstModel] || null;
}

/**
 * Get image generation models config for a provider
 */
export function getImageModels(provider) {
  return modelsConfig.image?.[provider];
}

/**
 * Get available image models (names)
 */
export function listImageModels() {
  const models = [];
  const imageDefault = modelsConfig.image?.default;
  
  for (const [provider, config] of Object.entries(modelsConfig.image || {})) {
    if (provider === 'default') continue; // Skip the default key
    
    for (const [name, apiId] of Object.entries(config.models || {})) {
      models.push({
        id: name,
        apiId: apiId,
        provider,
        isDefault: name === imageDefault
      });
    }
  }
  
  return models;
}

/**
 * Get default image model API ID for a provider
 */
export function getDefaultImageModel(provider) {
  const imageDefault = modelsConfig.image?.default;
  const config = modelsConfig.image?.[provider];
  
  if (!config) return null;
  
  // Check if global image default is in this provider
  if (config.models?.[imageDefault]) {
    return config.models[imageDefault];
  }
  
  // Otherwise return first model
  const firstModel = Object.keys(config.models || {})[0];
  return config.models?.[firstModel] || null;
}

/**
 * Get image model fallback list (as API IDs)
 */
export function getImageModelFallbacks(provider, preferredModelName) {
  const config = modelsConfig.image?.[provider];
  if (!config) return [];
  
  const models = [];
  
  // Start with preferred model if valid
  if (preferredModelName && config.models[preferredModelName]) {
    models.push(config.models[preferredModelName]);
  }

  // Add default model
  const imageDefault = modelsConfig.image?.default;
  if (imageDefault && config.models[imageDefault]) {
    if (!models.includes(config.models[imageDefault])) {
      models.push(config.models[imageDefault]);
    }
  }

  // Add remaining models as fallbacks
  Object.values(config.models).forEach(apiId => {
    if (!models.includes(apiId)) {
      models.push(apiId);
    }
  });

  return models;
}

/**
 * List all available chat models for API response
 */
export function listChatModels() {
  const models = [];
  const globalDefault = modelsConfig.default;
  
  for (const [provider, config] of Object.entries(modelsConfig.chat || {})) {
    const capabilities = config.capabilities || {};
    
    for (const [name, apiId] of Object.entries(config.models || {})) {
      models.push({
        id: name,
        apiId: apiId,
        provider,
        isDefault: name === globalDefault,
        capabilities: capabilities
      });
    }
  }
  
  return models;
}

/**
 * Get capabilities for a specific provider
 */
export function getProviderCapabilities(provider) {
  const config = modelsConfig.chat?.[provider];
  if (!config) return {};
  return config.capabilities || {};
}

/**
 * Check if a provider supports a specific capability
 */
export function providerSupports(provider, capability) {
  const capabilities = getProviderCapabilities(provider);
  return capabilities[capability] === true;
}

/**
 * Validate requested tools against provider capabilities
 * Returns { valid: boolean, errors: string[], supported: string[] }
 */
export function validateToolsForProvider(provider, requestedTools) {
  const capabilities = getProviderCapabilities(provider);
  const errors = [];
  const supported = [];
  const requested = [];
  
  if (requestedTools.web_search) {
    requested.push('web_search');
    if (capabilities.web_search) {
      supported.push('web_search');
    } else {
      errors.push(`Web search is not supported by ${provider} models.`);
    }
  }
  
  if (requestedTools.code_execution) {
    requested.push('code_execution');
    if (capabilities.code_execution) {
      supported.push('code_execution');
    } else {
      errors.push(`Code execution is not supported by ${provider} models. This feature is available for Gemini and Anthropic models.`);
    }
  }
  
  if (requestedTools.url_context) {
    requested.push('url_context');
    if (capabilities.url_context) {
      supported.push('url_context');
    } else {
      errors.push(`URL context is not supported by ${provider} models. This feature is available for Gemini and Anthropic models.`);
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
    supported,
    requested
  };
}

export default modelsConfig;
