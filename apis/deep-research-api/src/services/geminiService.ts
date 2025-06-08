import { GoogleGenAI, GenerateContentResponse, GenerateContentParameters, Schema, Type as GeminiType } from "@google/genai";
import { AgentConfig, Source, ResponseType, AutoAgentSetup, DynamicAgentConfig } from '../types';
import { 
  GEMINI_TEXT_MODEL, 
  GEMINI_SYNTHESIS_MODEL, 
  RESPONSE_TYPE_PROMPTS, 
  MAX_AGENTS_MANUAL, 
  DEFAULT_AUTO_AGENTS_FALLBACK 
} from '../constants';

let ai: GoogleGenAI;

export const initializeGeminiService = (apiKey: string) => {
  if (!apiKey) {
    throw new Error("API_KEY environment variable not set. Gemini API calls will fail.");
  }
  ai = new GoogleGenAI({ apiKey });
};

// Helper to parse JSON from Gemini response, stripping markdown fences and known error strings
const parseJsonFromGeminiResponse = (text: string): any => {
  let jsonStr = text.trim();
  
  // 1. Strip markdown fences
  const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
  const fenceMatch = jsonStr.match(fenceRegex);
  if (fenceMatch && fenceMatch[2]) {
    jsonStr = fenceMatch[2].trim();
  }

  // 2. Clean up known "LookupError:" patterns.
  jsonStr = jsonStr.replace(/\s*LookupError:\s*\{/g, '{');
  jsonStr = jsonStr.replace(/LookupError:\s*\n/g, '\n'); 
  jsonStr = jsonStr.replace(/LookupError:/g, ''); 

  // 3. Clean up junk words ending with a quote after a number, e.g., "temperature": 0.5 junkword"
  jsonStr = jsonStr.replace(/([0-9\.]+)\s+([a-zA-Z0-9_'-]+)\"\s*(\r?\n(?=\s*[\},]))/g, '$1$3');
  
  // 4. Attempt to remove simple unescaped text between a property value and the next comma/brace
  jsonStr = jsonStr.replace(/([0-9\.]+)\s*\n\s*([^\{\}\[\]\",\n]+?)\s*\n(\s*[\},])/g, (match, num, junk, endChar) => {
    if (!junk.includes(':') && !junk.startsWith('"') && !junk.startsWith('{') && !junk.startsWith('[')) {
      console.warn(`Attempting to remove suspected junk text: "${junk}"`);
      return `${num}\n${endChar}`;
    }
    return match; 
  });

  try {
    return JSON.parse(jsonStr);
  } catch (e) {
    console.error("Failed to parse JSON response:", e, "\nAttempted to parse (after cleaning):", jsonStr, "\nOriginal text from API:", text);
    throw new Error("Failed to parse JSON from AI response. The response was not valid JSON even after cleaning attempts.");
  }
};

// Define the schema for individual agent configuration
const agentConfigSchemaPart: Schema = {
  type: GeminiType.OBJECT,
  properties: {
    name: { type: GeminiType.STRING, description: "Agent's unique name (e.g., 'Market Analyst Agent')." },
    focus: { type: GeminiType.STRING, description: "Specific research focus for the agent, as a concise instruction." },
    temperature: { type: GeminiType.NUMBER, description: "Creativity temperature (a float between 0.0 and 1.0)." }
  },
  required: ['name', 'focus', 'temperature']
};

// Define the schema for the overall AutoAgentSetup
const autoAgentSetupSchema: Schema = {
  type: GeminiType.OBJECT,
  properties: {
    agentCount: { type: GeminiType.NUMBER, description: "The total number of agents configured." },
    agents: {
      type: GeminiType.ARRAY,
      description: "List of agent configurations.",
      items: agentConfigSchemaPart
    }
  },
  required: ['agentCount', 'agents']
};

export const determineAgentConfiguration = async (
  researchTopic: string
): Promise<AutoAgentSetup> => {
  if (!ai) {
    throw new Error("Gemini service not initialized. Call initializeGeminiService first.");
  }

  const prompt = `Based on the complexity and nature of the research topic "${researchTopic}", determine an optimal number of research agents (between 2 and ${MAX_AGENTS_MANUAL}) and define their configurations.
For each agent, provide a unique name, a specific research focus (a concise instruction for their research task related to the main topic), and a temperature (a float between 0.0 and 1.0, where higher means more creative/diverse).
The agent focuses should be complementary and cover different facets of the topic.

Example for topic "Future of AI in Healthcare":
The system might configure 3 agents:
1.  Name: "Clinical Applications Agent", Focus: "Investigate current and near-future clinical applications of AI in diagnostics, treatment planning, and patient monitoring.", Temperature: 0.5
2.  Name: "Ethical & Regulatory Agent", Focus: "Analyze the ethical dilemmas, patient data privacy concerns, and regulatory hurdles for AI adoption in healthcare.", Temperature: 0.6
3.  Name: "Technological Advancement Agent", Focus: "Explore cutting-edge AI research (e.g., new algorithms, hardware) that could revolutionize healthcare.", Temperature: 0.7`;

  try {
    const params: GenerateContentParameters = {
      model: GEMINI_TEXT_MODEL, 
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        temperature: 0.4, 
        responseMimeType: "application/json",
        responseSchema: autoAgentSetupSchema, 
      }
    };
    const response: GenerateContentResponse = await ai.models.generateContent(params);
    const responseText = response.text;
    if (responseText === undefined) {
        throw new Error("Received undefined text response from AI for agent configuration.");
    }
    const parsedJson = parseJsonFromGeminiResponse(responseText);

    if (!parsedJson || typeof parsedJson.agentCount !== 'number' || !Array.isArray(parsedJson.agents) || parsedJson.agents.length !== parsedJson.agentCount) {
      console.error("Malformed agent configuration JSON structure after schema enforcement:", parsedJson);
      throw new Error("AI response for agent configuration is malformed or missing key fields despite schema.");
    }
    
    parsedJson.agents.forEach((agent: any, index: number) => {
        if (typeof agent.name !== 'string' || typeof agent.focus !== 'string' || typeof agent.temperature !== 'number') {
            console.error(`Invalid agent structure at index ${index}:`, agent);
            throw new Error(`AI response for agent configuration has invalid agent structure for agent ${index + 1}.`);
        }
        agent.temperature = Math.min(1.0, Math.max(0.0, agent.temperature)); 
    });

    return parsedJson as AutoAgentSetup;

  } catch (error) {
    console.error("Error determining agent configuration:", error);
    return {
      agentCount: DEFAULT_AUTO_AGENTS_FALLBACK,
      agents: [
        { name: "General Researcher Agent 1", focus: `Conduct general research on the primary aspects of "${researchTopic}".`, temperature: 0.5 },
        { name: "Alternative Perspectives Agent", focus: `Explore alternative viewpoints or less common aspects of "${researchTopic}".`, temperature: 0.7 },
        { name: "Implications Agent", focus: `Investigate the potential implications or future developments related to "${researchTopic}".`, temperature: 0.6 },
      ].slice(0, DEFAULT_AUTO_AGENTS_FALLBACK)
    };
  }
};

export const runResearchAgent = async (
  researchTopic: string, 
  agentConfig: DynamicAgentConfig 
): Promise<{ researchSummary: string; sources: Source[] }> => {
  if (!ai) {
    throw new Error("Gemini service not initialized. Call initializeGeminiService first.");
  }

  try {
    let fullPrompt = agentConfig.focus;
    
    const prompt = `Agent: ${agentConfig.name}\nTask: ${fullPrompt}\n\nBased on your specific task, provide a concise research summary using information from Google Search. Cite your sources. Your response should be the summary text. The search tool will provide source information.`;

    const params: GenerateContentParameters = {
        model: GEMINI_TEXT_MODEL,
        contents: [{ role: "user", parts: [{text: prompt}] }],
        config: {
          temperature: agentConfig.temperature,
          tools: [{ googleSearch: {} }],
        }
    };
    
    const response: GenerateContentResponse = await ai.models.generateContent(params);

    const researchSummary = response.text;
    if (researchSummary === undefined) {
        return { 
            researchSummary: `Error: Received undefined text response from AI for agent ${agentConfig.name}.`,
            sources: [] 
        };
    }
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
    
    return { researchSummary, sources };

  } catch (error) {
    console.error(`Error in agent ${agentConfig.name}:`, error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error during research";
    return { researchSummary: `Error: Could not complete research for ${agentConfig.name}. ${errorMessage}`, sources: [] };
  }
};

export const synthesizeReport = async (
  originalQuery: string,
  agentResults: Array<{ agentName: string; researchSummary: string }>,
  allSources: Source[],
  responseType: ResponseType,
  includeCitations: boolean,
  limitCitationsToThree: boolean = true
): Promise<string> => {
  if (!ai) {
    throw new Error("Gemini service not initialized. Call initializeGeminiService first.");
  }

  let agentSummaries = ""; 
  try {
    agentSummaries = agentResults.map(r => `--- Research from ${r.agentName} ---\n${r.researchSummary}`).join("\n\n");
    if (agentSummaries.trim() === "") {
        agentSummaries = "No research data was gathered by the agents, or all agents encountered errors.";
    }

    let citationInstruction = "";
    if (includeCitations && allSources.length > 0) {
      const sourceListText = allSources.map(s => `${s.id}. ${s.title || s.uri}`).join("\n");
      
      const ruleLimitToThree = limitCitationsToThree 
        ? "\n3. For any single piece of information or claim, cite a maximum of three (3) distinct sources. Prioritize the most relevant ones." 
        : "";

      citationInstruction = `
When citing information, use the format [number] corresponding to the source in this list:
${sourceListText}

Key Citation Rules:
1. Ensure claims are supported by these sources where appropriate.
2. If multiple sources support a single point, list them as separate bracketed numbers with a space in between, for example: [1] [2] or [1] [7]. Do NOT combine them like [1, 2].${ruleLimitToThree}
4. You do not need to cite every source from the provided list; only use citations for specific information that requires attribution.
`;
    } else if (includeCitations && allSources.length === 0) {
      citationInstruction = "Citations were requested, but no sources were found or processed from the agents.";
    }

    const synthesisPrompt = `Original User Query: "${originalQuery}"

You have received research summaries from multiple AI agents. Your task is to synthesize this information into a single, coherent document IN MARKDOWN FORMAT.

${RESPONSE_TYPE_PROMPTS[responseType]} 
Ensure your entire response is well-formatted Markdown. Specifically, use double line breaks to create separate paragraphs for better readability.

${citationInstruction}

--- Agent Research Summaries ---
${agentSummaries}
--- End of Agent Research Summaries ---

Now, generate the final ${responseType.toLowerCase()} based on all the provided information.
If generating a Research Paper, ensure all specified sections (Abstract, Introduction, etc.) are present using Markdown headings (e.g., ## Abstract).
For Articles, create a catchy headline (e.g., # My Headline).
For Reports, use clear headings (e.g. ## Key Findings) and subheadings (e.g. ### Sub-section) to structure the information.
Focus on synthesizing the information, not just listing it. If information is contradictory, acknowledge it if appropriate for the format.
Do not make up information beyond what is provided in the agent summaries and their implicit sources.
Output ONLY the final ${responseType.toLowerCase()} content in Markdown format. Adhere to all formatting and citation rules.`;
    
    const params: GenerateContentParameters = {
        model: GEMINI_SYNTHESIS_MODEL,
        contents: [{ role: "user", parts: [{ text: synthesisPrompt }] }],
        config: {
          temperature: 0.5, 
        }
    };
    
    const response: GenerateContentResponse = await ai.models.generateContent(params);
    const reportText = response.text;
    if (reportText === undefined) {
        throw new Error("Received undefined text response from AI for synthesis.");
    }
    return reportText;

  } catch (error) {
    console.error("Error in synthesis:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error during synthesis";
    return `Error: Could not synthesize the final report. ${errorMessage}\n\nDEBUG INFO:\nOriginal Query: ${originalQuery}\nResponse Type: ${responseType}\nCitations: ${includeCitations}\nAgent Summaries Snippet: ${agentSummaries.substring(0, 200)}`;
  }
}; 