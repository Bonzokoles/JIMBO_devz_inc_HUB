export type AgentType = 'research' | 'analytics' | 'system' | 'content' | 'automation' | 'security';
export type AgentStatus = 'active' | 'idle' | 'error' | 'disabled';
export type AgentLanguage = 'python' | 'typescript' | 'mixed';

export type Agent = {
  id: string;
  name: string;
  type: AgentType;
  status: AgentStatus;
  capabilities: string[];
  description: string;
  port?: number;
  endpoint?: string;
  language: AgentLanguage;
};

export const AGENT_REGISTRY: Agent[] = [
  // NEXT_GEN_RAG Python Agents
  {
    id: 'research-agent',
    name: 'Research Agent',
    type: 'research',
    status: 'idle',
    capabilities: ['search', 'trends', 'content-briefs', 'duckduckgo'],
    description: 'DuckDuckGo search, trend analysis, content brief generation',
    port: 6062,
    language: 'python',
  },
  {
    id: 'writer-agent',
    name: 'Writer Agent',
    type: 'content',
    status: 'idle',
    capabilities: ['content-generation', 'copywriting'],
    description: 'AI-powered content and copywriting',
    port: 6030,
    language: 'python',
  },
  {
    id: 'seo-agent',
    name: 'SEO Agent',
    type: 'content',
    status: 'idle',
    capabilities: ['seo', 'optimization', 'keywords'],
    description: 'SEO optimization and keyword analysis',
    language: 'python',
  },
  {
    id: 'finance-agent',
    name: 'Finance Agent',
    type: 'analytics',
    status: 'idle',
    capabilities: ['financial-analysis', 'reporting'],
    description: 'Financial analysis and reporting',
    language: 'python',
  },
  {
    id: 'graphics-agent',
    name: 'Graphics Agent',
    type: 'content',
    status: 'idle',
    capabilities: ['graphics', 'image-generation'],
    description: 'Graphics and image generation',
    port: 6050,
    language: 'python',
  },
  {
    id: 'market-research-agent',
    name: 'Market Research Agent',
    type: 'research',
    status: 'idle',
    capabilities: ['market-analysis', 'competitor-research'],
    description: 'Market analysis and competitor research',
    language: 'python',
  },
  {
    id: 'company-analysis-agent',
    name: 'Company Analysis Agent',
    type: 'research',
    status: 'idle',
    capabilities: ['company-research', 'business-intelligence'],
    description: 'Company research and business intelligence',
    language: 'python',
  },
  {
    id: 'planner-agent',
    name: 'Planner Agent',
    type: 'automation',
    status: 'idle',
    capabilities: ['orchestration', 'planning', 'task-delegation'],
    description: 'Multi-agent orchestration and task planning',
    language: 'python',
  },

  // Modular TypeScript Agents
  {
    id: 'analytics-prophet',
    name: 'Analytics Prophet',
    type: 'analytics',
    status: 'active',
    capabilities: ['ml', 'forecasting', 'reporting', 'dashboards', 'bi'],
    description: 'Advanced analytics with ML forecasting and predictive business intelligence',
    language: 'typescript',
  },
  {
    id: 'system-monitor',
    name: 'System Monitor',
    type: 'system',
    status: 'active',
    capabilities: ['monitoring', 'performance', 'health-checks'],
    description: 'Real-time system performance and health monitoring',
    language: 'typescript',
  },
  {
    id: 'web-crawler',
    name: 'Web Crawler',
    type: 'automation',
    status: 'idle',
    capabilities: ['scraping', 'crawling', 'data-extraction'],
    description: 'Automated web scraping and data extraction',
    language: 'typescript',
  },
  {
    id: 'file-manager',
    name: 'File Manager',
    type: 'system',
    status: 'idle',
    capabilities: ['file-ops', 'document-management'],
    description: 'File operations and document management',
    language: 'typescript',
  },
  {
    id: 'database-query',
    name: 'Database Query',
    type: 'analytics',
    status: 'idle',
    capabilities: ['sql', 'nosql', 'data-analysis'],
    description: 'SQL and NoSQL database analysis',
    language: 'typescript',
  },
  {
    id: 'email-handler',
    name: 'Email Handler',
    type: 'automation',
    status: 'idle',
    capabilities: ['email', 'smtp', 'newsletters'],
    description: 'Email automation and newsletter management',
    language: 'typescript',
  },
  {
    id: 'security-guard',
    name: 'Security Guard',
    type: 'security',
    status: 'active',
    capabilities: ['auth', 'threat-detection', 'security'],
    description: 'Authentication and threat detection',
    language: 'typescript',
  },
  {
    id: 'content-guardian',
    name: 'Content Guardian',
    type: 'security',
    status: 'idle',
    capabilities: ['moderation', 'content-filtering'],
    description: 'Content moderation and filtering',
    language: 'typescript',
  },
  {
    id: 'marketing-maestro',
    name: 'Marketing Maestro',
    type: 'automation',
    status: 'idle',
    capabilities: ['marketing', 'campaigns', 'automation'],
    description: 'Marketing automation and campaign management',
    language: 'typescript',
  },
  {
    id: 'webmaster',
    name: 'Webmaster',
    type: 'system',
    status: 'idle',
    capabilities: ['website-management', 'deployment'],
    description: 'Website management and deployment',
    language: 'typescript',
  },
  {
    id: 'voice-command',
    name: 'Voice Command',
    type: 'automation',
    status: 'disabled',
    capabilities: ['voice-recognition', 'commands'],
    description: 'Voice recognition and command processing',
    language: 'typescript',
  },
  {
    id: 'music-control',
    name: 'Music Control',
    type: 'automation',
    status: 'disabled',
    capabilities: ['audio', 'streaming', 'playlists'],
    description: 'Audio streaming and playlist management',
    language: 'typescript',
  },
];

export function getAgentsByType(type: AgentType): Agent[] {
  return AGENT_REGISTRY.filter(agent => agent.type === type);
}

export function getAgentById(id: string): Agent | undefined {
  return AGENT_REGISTRY.find(agent => agent.id === id);
}

export function getActiveAgents(): Agent[] {
  return AGENT_REGISTRY.filter(agent => agent.status === 'active');
}
