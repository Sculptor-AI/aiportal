import { AgentConfig, ResponseType } from './types';

export const MAX_AGENTS_MANUAL = 10;
export const MAX_AGENTS_GO_DEEPER = 100; // Kept for consistency, actual "Go Deeper" uses this number
export const DEFAULT_AUTO_AGENTS_FALLBACK = 3; // Fallback if auto-config fails

export const GO_DEEPER_AGENT_TEMPERATURE = 1.0; // Max practical temperature for Flash models
export const GO_DEEPER_AGENT_FOCUS_PROMPT = (topic: string) => `You are an independent, highly creative research agent. Your main research topic is: "${topic}".
Formulate a unique and insightful sub-question related to this main topic.
Then, conduct deep research on YOUR SELF-DEFINED SUB-QUESTION using Google Search.
Aim for novel perspectives and uncover less obvious information. Your output should be the research summary.`;

export const AGENT_PROFILES: AgentConfig[] = [
  { id: 'analyst', name: 'Analyst Agent', focus: "Provide a factual overview, key statistics, and data points related to the research topic. Focus on objective information.", temperature: 0.2 },
  { id: 'critic', name: 'Critical Agent', focus: "Identify potential criticisms, counterarguments, challenges, and limitations concerning the research topic. Explore alternative perspectives.", temperature: 0.7 },
  { id: 'innovator', name: 'Innovator Agent', focus: "Explore future implications, potential innovations, novel applications, and forward-looking trends related to the research topic.", temperature: 0.9 },
  { id: 'historian', name: 'Historical Agent', focus: "Investigate the historical background, evolution, and significant past events or developments relevant to the research topic.", temperature: 0.3 },
  { id: 'ethicist', name: 'Ethics Agent', focus: "Analyze the ethical considerations, societal impacts, and moral dilemmas associated with the research topic.", temperature: 0.6 },
  { id: 'comparative', name: 'Comparative Agent', focus: "Compare and contrast the research topic with related concepts, similar technologies, or alternative approaches. Highlight similarities and differences.", temperature: 0.5 },
  { id: 'contextual', name: 'Contextual Agent', focus: "Examine the broader context in which the research topic exists, including regulatory, economic, social, and technological factors.", temperature: 0.4 },
  { id: 'data-miner', name: 'Data Mining Agent', focus: "Extract specific quantitative data, statistics, and figures related to the research topic. Focus on numerical evidence.", temperature: 0.1 },
  { id: 'impact-assessor', name: 'Impact Assessment Agent', focus: "Evaluate the potential positive and negative impacts of the research topic across different sectors or demographics.", temperature: 0.65 },
  { id: 'solution-seeker', name: 'Solution Seeker Agent', focus: "If the research topic involves a problem, explore potential solutions, existing remedies, and innovative approaches to address it.", temperature: 0.75 },
];

export const GEMINI_TEXT_MODEL = 'gemini-2.5-flash-preview-04-17';
export const GEMINI_SYNTHESIS_MODEL = 'gemini-2.5-flash-preview-04-17'; // Using Flash for synthesis as per earlier constraints

export const RESPONSE_TYPE_PROMPTS: { [key in ResponseType]: string } = {
  [ResponseType.Report]: "Synthesize the provided agent research findings into a comprehensive, objective, and well-structured report, similar in style to a detailed briefing or executive summary. Ensure clarity, factual accuracy, and logical flow. Structure the report logically. You can use headings (e.g., ## Key Findings) and subheadings (e.g., ### Details) to organize content effectively. Avoid starting the report with a generic 'Overview' heading, especially one followed by a horizontal rule. Instead, integrate any introductory summary directly into the main body or under a more specific initial heading if necessary. Ensure proper paragraph spacing for readability (double line breaks between paragraphs in Markdown).",
  [ResponseType.Article]: "Transform the provided agent research findings into a compelling news-style article. Include an engaging headline, an introductory lede, and a narrative structure suitable for a general audience. Maintain a professional journalistic tone. Ensure proper paragraph spacing for readability.",
  [ResponseType.ResearchPaper]: "Compile the provided agent research findings into a formal academic research paper. The paper should include the following sections (use Markdown headings like ## Abstract, ## Introduction): Abstract, Introduction (stating the research question/problem based on the user's query), Related Work (summarizing key insights from agents), Methodology (briefly describe the multi-agent research approach employed, including the use of dynamic agent configuration or 'Go Deeper' strategy if applicable), Findings and Discussion (present and interpret the synthesized information), Conclusion, and References. Ensure a formal, academic tone and logical flow. Ensure proper paragraph spacing for readability."
};

// API Configuration Constants
export const DEFAULT_PORT = 3000;
export const DEFAULT_RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
export const DEFAULT_RATE_LIMIT_MAX_REQUESTS = 100;
export const MAX_CONCURRENT_RESEARCH_TASKS = 10;
export const TASK_CLEANUP_INTERVAL_MS = 60 * 60 * 1000; // 1 hour
export const COMPLETED_TASK_RETENTION_MS = 24 * 60 * 60 * 1000; // 24 hours 