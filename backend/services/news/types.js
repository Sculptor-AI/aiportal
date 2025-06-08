/**
 * @typedef {Object} NewsArticle
 * @property {string} id
 * @property {string} topicId
 * @property {string} topicName
 * @property {string} headline
 * @property {string} summary
 * @property {string} content
 * @property {Date} publishedAt
 * @property {Date} updatedAt
 * @property {Date} expiresAt
 * @property {'draft' | 'published' | 'archived'} status
 * @property {Source[]} sources
 * @property {AgentResearchResult[]} [researchData]
 * @property {ArticleMetadata} metadata
 */

/**
 * @typedef {Object} ArticleMetadata
 * @property {number} readingTime - in minutes
 * @property {number} wordCount
 * @property {'positive' | 'neutral' | 'negative'} [sentiment]
 * @property {string[]} tags
 * @property {string} [imageUrl]
 */

/**
 * @typedef {Object} NewsTopic
 * @property {string} id
 * @property {string} name
 * @property {string} description
 * @property {string[]} keywords
 * @property {number} priority - 1 (highest) to 5 (lowest)
 * @property {number} minArticles
 * @property {number} maxArticles
 */

/**
 * @typedef {Object} TopicsConfig
 * @property {NewsTopic[]} topics
 * @property {Object} settings
 * @property {boolean} settings.balanceTopics
 * @property {number} settings.priorityWeight
 * @property {number} settings.randomWeight
 * @property {number} settings.refreshTopicsHours
 */

/**
 * @typedef {Object} NewsResearchAgent
 * @property {string} name
 * @property {string} focus
 * @property {number} temperature
 * @property {string} [researchQuestion]
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
 * @property {string} researchQuestion
 * @property {string} researchSummary
 * @property {Source[]} sources
 */

/**
 * @typedef {Object} NewsGenerationTask
 * @property {string} id
 * @property {string} topicId
 * @property {string} topicName
 * @property {'pending' | 'researching' | 'writing' | 'completed' | 'failed'} status
 * @property {number} progress
 * @property {Date} startedAt
 * @property {Date} [completedAt]
 * @property {string} [error]
 * @property {string} [articleId]
 */

/**
 * @typedef {Object} NewsGenerationCycle
 * @property {string} id
 * @property {Date} startedAt
 * @property {Date} [completedAt]
 * @property {'running' | 'completed' | 'failed'} status
 * @property {number} articlesGenerated
 * @property {number} articlesDeleted
 * @property {NewsGenerationTask[]} tasks
 */

/**
 * @typedef {Object} GetNewsRequest
 * @property {string} [topicId]
 * @property {number} [limit]
 * @property {number} [offset]
 * @property {'publishedAt' | 'topicId'} [sortBy]
 * @property {'asc' | 'desc'} [sortOrder]
 */

/**
 * @typedef {Object} GenerateNewsRequest
 * @property {string} [topicId]
 * @property {number} [count]
 * @property {boolean} [force]
 */

/**
 * @typedef {Object} NewsStats
 * @property {number} totalArticles
 * @property {Object.<string, number>} articlesByTopic
 * @property {Date} [oldestArticle]
 * @property {Date} [newestArticle]
 * @property {Date} [nextGenerationTime]
 * @property {NewsGenerationCycle} [lastGenerationCycle]
 */

/**
 * @typedef {Object} NewsEvent
 * @property {string} id
 * @property {string} topicId
 * @property {string} headline
 * @property {string} summary
 * @property {Date} eventDate
 * @property {Date} discoveredAt
 * @property {string} source
 * @property {'breaking' | 'major' | 'standard' | 'minor'} importance
 * @property {string[]} keywords
 * @property {string[]} [relatedEvents]
 */

/**
 * @typedef {Object} CoverageGap
 * @property {string} topicId
 * @property {string} angle
 * @property {string} reason
 * @property {number} importance - 1-10
 */

/**
 * @typedef {Object} ArticleAssignment
 * @property {string} topicId
 * @property {string} [eventId]
 * @property {string} angle
 * @property {'breaking' | 'analysis' | 'update' | 'feature' | 'explainer'} newsType
 * @property {number} priority
 * @property {string[]} researchFocus
 * @property {string} suggestedHeadline
 */

/**
 * @typedef {Object} GenerationProgress
 * @property {string} cycleId
 * @property {number} overallProgress - 0-100
 * @property {'initializing' | 'discovery' | 'selection' | 'researching' | 'writing' | 'publishing' | 'completed' | 'failed'} phase
 * @property {string} phaseDescription
 * @property {Date} startTime
 * @property {number} [estimatedTimeRemaining] - seconds
 * @property {Object} [currentArticle]
 * @property {string} currentArticle.taskId
 * @property {string} currentArticle.topicId
 * @property {string} currentArticle.topicName
 * @property {string} [currentArticle.headline]
 * @property {number} currentArticle.progress
 * @property {string} currentArticle.phase
 * @property {number} articlesCompleted
 * @property {number} articlesTotal
 * @property {string[]} errors
 */

export { /* Empty export to make this a module */ }; 