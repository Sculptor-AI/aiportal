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
 * Resolve a model name (e.g. "gpt-5.2") to its API identifier (e.g. "gpt-5.2-pro-2025-12-11")
 */
export function resolveModel(provider, modelName) {
  const providerConfig = modelsConfig.chat?.[provider];
  if (!providerConfig) {
    return modelName; // Return as-is if provider not found
  }

  // Look up in simple models map
  if (providerConfig.models?.[modelName]) {
    return providerConfig.models[modelName];
  }

  // If not found, check if it was already an API ID (fallback)
  // or return default if completely unknown
  const defaultName = providerConfig.default;
  return providerConfig.models?.[defaultName] || modelName;
}

/**
 * Get default model API ID for a provider
 */
export function getDefaultModel(provider) {
  const config = modelsConfig.chat?.[provider];
  if (!config) return null;
  return config.models[config.default];
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
  
  for (const [provider, config] of Object.entries(modelsConfig.image || {})) {
    for (const [name, apiId] of Object.entries(config.models || {})) {
      models.push({
        id: name, // User facing name
        apiId: apiId, // Backend API ID
        provider,
        isDefault: name === config.default
      });
    }
  }
  
  return models;
}

/**
 * Get default image model API ID for a provider
 */
export function getDefaultImageModel(provider) {
  const config = modelsConfig.image?.[provider];
  if (!config) return null;
  return config.models[config.default];
}

/**
 * Get image model fallback list (as API IDs)
 */
export function getImageModelFallbacks(provider, preferredModelName) {
  const config = modelsConfig.image?.[provider];
  if (!config) return [];
  
  // Start with preferred model if valid
  const models = [];
  if (preferredModelName && config.models[preferredModelName]) {
    models.push(config.models[preferredModelName]);
  }

  // Add default model
  if (config.default && config.models[config.default]) {
    if (!models.includes(config.models[config.default])) {
      models.push(config.models[config.default]);
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
  
  for (const [provider, config] of Object.entries(modelsConfig.chat || {})) {
    for (const [name, apiId] of Object.entries(config.models || {})) {
      models.push({
        id: name,      // User-friendly name (e.g. "gpt-5.2")
        apiId: apiId,  // Actual API ID (e.g. "gpt-5.2-pro-2025...")
        provider,
        isDefault: name === config.default
      });
    }
  }
  
  return models;
}

export default modelsConfig;
