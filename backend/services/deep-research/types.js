// Enum-like constants
export const ResponseType = {
  Report: "Report",
  Article: "Article",
  ResearchPaper: "Research Paper",
};

/**
 * @typedef {Object} DynamicAgentConfig
 * @property {string} name
 * @property {string} focus
 * @property {number} temperature
 */

/**
 * @typedef {Object} AgentConfig
 * @property {string} id
 * @property {string} name
 * @property {string} focus
 * @property {number} temperature
 */

/**
 * @typedef {Object} AutoAgentSetup
 * @property {number} agentCount
 * @property {DynamicAgentConfig[]} agents
 */

/**
 * @typedef {Object} Source
 * @property {number} id
 * @property {string} uri
 * @property {string} title
 */

/**
 * @typedef {Object} AgentResearchResult
 * @property {string} agentName
 * @property {string} researchSummary
 * @property {Source[]} sources
 */

/**
 * @typedef {Object} AgentStatus
 * @property {string} id
 * @property {string} name
 * @property {'pending' | 'configuring' | 'researching' | 'synthesizing' | 'completed' | 'error'} status
 * @property {string} [message]
 * @property {string} [research]
 * @property {Source[]} [sources]
 */

/**
 * @typedef {Object} ResearchRequest
 * @property {string} researchTopic
 * @property {number} [numAgents]
 * @property {boolean} [autoAgents]
 * @property {string} [responseType]
 * @property {boolean} [includeCitations]
 * @property {boolean} [limitCitationsToThree]
 * @property {boolean} [goDeeper]
 */

/**
 * @typedef {Object} ResearchResponse
 * @property {string} taskId
 * @property {'started' | 'configuring' | 'researching' | 'synthesizing' | 'completed' | 'error'} status
 * @property {number} progress
 * @property {AgentStatus[]} agentStatuses
 * @property {string} [finalReport]
 * @property {Source[]} [sources]
 * @property {string} [error]
 * @property {number} [estimatedTimeRemaining]
 */

/**
 * @typedef {Object} ResearchTask
 * @property {string} id
 * @property {ResearchRequest} request
 * @property {'started' | 'configuring' | 'researching' | 'synthesizing' | 'completed' | 'error'} status
 * @property {number} progress
 * @property {AgentStatus[]} agentStatuses
 * @property {string} [finalReport]
 * @property {Source[]} [sources]
 * @property {string} [error]
 * @property {Date} createdAt
 * @property {Date} updatedAt
 */ 