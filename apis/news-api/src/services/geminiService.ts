import { GoogleGenAI, GenerateContentResponse, GenerateContentParameters, Type } from "@google/genai";
import { 
  NewsResearchAgent, 
  Source, 
  AgentResearchResult,
  NewsTopic 
} from '../types';
import { 
  GEMINI_FLASH_MODEL,
  GEMINI_PRO_MODEL,
  NEWS_TOPIC_ANALYSIS_PROMPT,
  NEWS_RESEARCH_AGENT_PROMPT,
  NEWS_SYNTHESIS_PROMPT,
  NEWS_AGENT_CONFIGURATION_PROMPT
} from '../constants';
import logger from '../utils/logger';

let ai: GoogleGenAI;

export const initializeGeminiService = (apiKey: string) => {
  if (!apiKey) {
    throw new Error("API_KEY environment variable not set. Gemini API calls will fail.");
  }
  ai = new GoogleGenAI({ apiKey });
  logger.info('Gemini service initialized');
};

// Helper to parse JSON from Gemini response
const parseJsonFromGeminiResponse = (text: string): any => {
  let jsonStr = text.trim();
  
  // Strip markdown fences
  const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
  const fenceMatch = jsonStr.match(fenceRegex);
  if (fenceMatch && fenceMatch[2]) {
    jsonStr = fenceMatch[2].trim();
  }

  // Clean up known error patterns
  jsonStr = jsonStr.replace(/\s*LookupError:\s*\{/g, '{');
  jsonStr = jsonStr.replace(/LookupError:\s*\n/g, '\n'); 
  jsonStr = jsonStr.replace(/LookupError:/g, ''); 

  // Remove characters that are not typical in JSON structures or string values
  // This targets non-ASCII characters that are not part of legitimate string data.
  // It allows common punctuation, alphanumeric, and whitespace.
  jsonStr = jsonStr.replace(/[^\x00-\x7F\{\}\[\]\":,\w\s\.\-\+]+/g, '');

  try {
    return JSON.parse(jsonStr);
  } catch (e) {
    logger.error("Failed to parse JSON response:", { error: e, text: jsonStr });
    throw new Error("Failed to parse JSON from AI response");
  }
};

// Analyze topic and generate news angle with research questions
export const analyzeNewsTopic = async (
  topic: NewsTopic
): Promise<{ newsAngle: string; suggestedHeadline: string; researchQuestions: string[] }> => {
  if (!ai) {
    throw new Error("Gemini service not initialized");
  }

  const prompt = NEWS_TOPIC_ANALYSIS_PROMPT(topic.name, topic.keywords);

  const newsTopicResponseSchema = {
    type: Type.OBJECT,
    properties: {
      newsAngle: { type: Type.STRING, description: "Specific current angle for the story" },
      suggestedHeadline: { type: Type.STRING, description: "Compelling headline" },
      researchQuestions: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: "List of specific research questions"
      },
    },
    required: ['newsAngle', 'suggestedHeadline', 'researchQuestions'],
  };

  try {
    const params: GenerateContentParameters = {
      model: GEMINI_FLASH_MODEL,
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        temperature: 0.8,
        responseMimeType: "application/json",
        responseSchema: newsTopicResponseSchema
      }
    };

    const response: GenerateContentResponse = await ai.models.generateContent(params);
    const responseText = response.text;
    
    if (!responseText) {
      throw new Error("Received empty response from AI");
    }

    const result = parseJsonFromGeminiResponse(responseText);
    
    // Validate response structure
    if (!result.newsAngle || !result.suggestedHeadline || !Array.isArray(result.researchQuestions)) {
      throw new Error("Invalid response structure from AI");
    }

    logger.debug('Topic analysis completed', { topic: topic.name, headline: result.suggestedHeadline });
    return result;

  } catch (error) {
    logger.error('Error analyzing news topic:', { error, topic: topic.name });
    throw error;
  }
};

// Configure research agents based on research questions
export const configureNewsAgents = async (
  topic: string,
  researchQuestions: string[]
): Promise<NewsResearchAgent[]> => {
  if (!ai) {
    throw new Error("Gemini service not initialized");
  }

  const prompt = NEWS_AGENT_CONFIGURATION_PROMPT(topic, researchQuestions);

  const agentConfigurationResponseSchema = {
    type: Type.OBJECT,
    properties: {
      agents: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING, description: "Unique, descriptive name for the agent" },
            focus: { type: Type.STRING, description: "Specific research focus for the agent" },
            temperature: { type: Type.NUMBER, description: "Appropriate temperature (0.3-0.9) for research" },
          },
          required: ['name', 'focus', 'temperature'],
        },
        description: "List of configured research agents"
      },
    },
    required: ['agents'],
  };

  try {
    const params: GenerateContentParameters = {
      model: GEMINI_FLASH_MODEL,
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        temperature: 0.6,
        responseMimeType: "application/json",
        responseSchema: agentConfigurationResponseSchema
      }
    };

    const response: GenerateContentResponse = await ai.models.generateContent(params);
    const responseText = response.text;
    
    if (!responseText) {
      throw new Error("Received empty response from AI");
    }

    const result = parseJsonFromGeminiResponse(responseText);
    
    if (!result.agents || !Array.isArray(result.agents)) {
      throw new Error("Invalid agent configuration response");
    }

    // Assign research questions to agents
    const agents: NewsResearchAgent[] = result.agents.map((agent: any, index: number) => ({
      ...agent,
      researchQuestion: researchQuestions[index] || researchQuestions[0],
      temperature: Math.min(0.9, Math.max(0.3, agent.temperature || 0.7))
    }));

    logger.debug('Agents configured', { count: agents.length });
    return agents;

  } catch (error) {
    logger.error('Error configuring agents:', error);
    // Fallback configuration
    return researchQuestions.map((question, index) => ({
      name: `Research Agent ${index + 1}`,
      focus: `Research the following: ${question}`,
      temperature: 0.7,
      researchQuestion: question
    }));
  }
};

// Run a single research agent
export const runNewsResearchAgent = async (
  agent: NewsResearchAgent & { eventContext?: string }
): Promise<AgentResearchResult> => {
  if (!ai) {
    throw new Error("Gemini service not initialized");
  }

  const prompt = NEWS_RESEARCH_AGENT_PROMPT(
    agent.name,
    agent.focus,
    agent.researchQuestion || '',
    agent.eventContext || ''
  );

  try {
    const params: GenerateContentParameters = {
      model: GEMINI_FLASH_MODEL,
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        temperature: agent.temperature,
        tools: [{ googleSearch: {} }],
      }
    };

    const response: GenerateContentResponse = await ai.models.generateContent(params);
    const researchSummary = response.text || '';
    
    // Extract sources from grounding metadata
    const groundingMetadata = response.candidates?.[0]?.groundingMetadata;
    let sources: Source[] = [];
    
    if (groundingMetadata?.groundingChunks) {
      sources = groundingMetadata.groundingChunks
        .map((chunk: any, index: number) => ({
          id: index + 1,
          uri: chunk.web?.uri || '',
          title: chunk.web?.title || chunk.web?.uri || 'Untitled Source',
        }))
        .filter((source: any) => source.uri);
    }

    logger.debug('Agent research completed', { agent: agent.name, sources: sources.length });

    return {
      agentName: agent.name,
      researchQuestion: agent.researchQuestion || '',
      researchSummary,
      sources
    };

  } catch (error) {
    logger.error(`Error in agent ${agent.name}:`, error);
    return {
      agentName: agent.name,
      researchQuestion: agent.researchQuestion || '',
      researchSummary: `Error: Could not complete research. ${error instanceof Error ? error.message : 'Unknown error'}`,
      sources: []
    };
  }
};

// Synthesize news article from research
export const synthesizeNewsArticle = async (
  headline: string,
  agentResults: AgentResearchResult[],
  allSources: Source[],
  newsType?: string
): Promise<{ content: string; summary: string }> => {
  if (!ai) {
    throw new Error("Gemini service not initialized");
  }

  try {
    // Prepare agent summaries
    const agentSummaries = agentResults
      .map(r => `--- ${r.agentName} (${r.researchQuestion}) ---\n${r.researchSummary}`)
      .join("\n\n");

    // Prepare source list
    const sourceList = allSources
      .map(s => `[${s.id}] ${s.title || s.uri}`)
      .join("\n");

    const synthesisPrompt = `
Original Headline Suggestion: "${headline}"
Article Type: ${newsType || 'news'}

${NEWS_SYNTHESIS_PROMPT}

REMINDER: Your article MUST start with the headline as a Markdown H1 (# Headline).

Sources available for citation:
${sourceList}

Agent Research Summaries:
${agentSummaries}

Generate the ${newsType || 'news'} article now with the headline "${headline}" formatted as # Headline at the top.`;

    const params: GenerateContentParameters = {
      model: GEMINI_PRO_MODEL, // Use Pro for final synthesis
      contents: [{ role: "user", parts: [{ text: synthesisPrompt }] }],
      config: {
        temperature: 0.5,
      }
    };

    const response: GenerateContentResponse = await ai.models.generateContent(params);
    const content = response.text || '';

    // Extract summary (first paragraph after headline)
    const lines = content.split('\n').filter((line: string) => line.trim());
    let summary = '';
    let foundHeadline = false;
    
    for (const line of lines) {
      if (line.startsWith('#') && !foundHeadline) {
        foundHeadline = true;
        continue;
      }
      if (foundHeadline && line.trim() && !line.startsWith('#')) {
        summary = line.trim();
        break;
      }
    }

    // If no summary found, use first 150 characters of content
    if (!summary) {
      summary = content.replace(/^#.*\n/, '').trim().substring(0, 150) + '...';
    }

    logger.debug('Article synthesis completed', { contentLength: content.length });

    return { content, summary };

  } catch (error) {
    logger.error('Error synthesizing article:', error);
    throw error;
  }
};

// Extract headline from article content
export const extractHeadlineFromContent = (content: string): string | null => {
  const lines = content.split('\n');
  for (const line of lines) {
    if (line.startsWith('# ')) {
      const headline = line.substring(2).trim();
      if (headline.length > 0) {
        return headline;
      }
    }
  }
  return null;
}; 