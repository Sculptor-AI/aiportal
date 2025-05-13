/**
 * Format request packet according to the diagram specification
 * @param {string} modelType - Type of model to use
 * @param {string} prompt - User prompt
 * @param {boolean} search - Whether to use search
 * @param {boolean} deepResearch - Whether to use deep research
 * @param {boolean} imageGen - Whether to use image generation
 * @returns {Object} Formatted request packet
 */
export const formatRequestPacket = (modelType, prompt, search = false, deepResearch = false, imageGen = false) => {
  return {
    modelType,
    prompt,
    search: search.toString(),
    deepResearch: deepResearch.toString(),
    imageGen: imageGen.toString()
  };
};

/**
 * Format response packet
 * @param {string} modelType - Type of model used
 * @param {string} prompt - Original user prompt
 * @param {string} response - AI response
 * @returns {Object} Formatted response packet
 */
export const formatResponsePacket = (modelType, prompt, response) => {
  return {
    response,
    metadata: {
      modelType,
      prompt,
      timestamp: new Date().toISOString()
    }
  };
}; 