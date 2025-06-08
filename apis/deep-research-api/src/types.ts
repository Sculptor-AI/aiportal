export enum ResponseType {
  Report = "Report",
  Article = "Article",
  ResearchPaper = "Research Paper",
}

// Configuration for dynamically generated agents
export interface DynamicAgentConfig {
  name: string;
  focus: string;
  temperature: number;
}

// Base AgentConfig, can be from predefined profiles or dynamic
export interface AgentConfig extends DynamicAgentConfig {
  id: string; // ID might be from profile or generated
}

export interface AutoAgentSetup {
  agentCount: number;
  agents: DynamicAgentConfig[];
}

export interface Source {
  id: number;
  uri: string;
  title: string;
}

export interface AgentResearchResult {
  agentName: string;
  researchSummary: string;
  sources: Source[];
}

export interface AgentStatus {
  id: string; // Can be agent.id + index or a unique generated ID
  name: string;
  status: 'pending' | 'configuring' | 'researching' | 'synthesizing' | 'completed' | 'error';
  message?: string;
  research?: string;
  sources?: Source[];
}

// API Request/Response Types
export interface ResearchRequest {
  researchTopic: string;
  numAgents?: number;
  autoAgents?: boolean;
  responseType?: ResponseType;
  includeCitations?: boolean;
  limitCitationsToThree?: boolean;
  goDeeper?: boolean;
}

export interface ResearchResponse {
  taskId: string;
  status: 'started' | 'configuring' | 'researching' | 'synthesizing' | 'completed' | 'error';
  progress: number;
  agentStatuses: AgentStatus[];
  finalReport?: string;
  sources?: Source[];
  error?: string;
  estimatedTimeRemaining?: number;
}

export interface AgentConfigurationRequest {
  researchTopic: string;
}

export interface AgentConfigurationResponse {
  success: boolean;
  agentSetup?: AutoAgentSetup;
  error?: string;
}

// Internal task management
export interface ResearchTask {
  id: string;
  request: ResearchRequest;
  status: 'started' | 'configuring' | 'researching' | 'synthesizing' | 'completed' | 'error';
  progress: number;
  agentStatuses: AgentStatus[];
  finalReport?: string;
  sources?: Source[];
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Error response
export interface ApiError {
  error: string;
  message: string;
  statusCode: number;
  timestamp: string;
}

// API Info response
export interface ApiInfo {
  name: string;
  version: string;
  description: string;
  endpoints: {
    [key: string]: {
      method: string;
      description: string;
      parameters?: string[];
    };
  };
} 