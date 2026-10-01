export type MosesProvider = 'gemini';

export interface MosesContext {
  activeSection: string;
  leads: unknown[];
  projects: unknown[];
  emails: unknown[];
  clientDNA: unknown[];
  messages: unknown[];
  memory: unknown[];
  knowledge: unknown[];
  system: {
    leadCount: number;
    projectCount: number;
    emailCount: number;
    clientDNACount: number;
    memoryCount: number;
    knowledgeCount: number;
  };
}

export interface MosesAIResult {
  reply: string;
  provider: MosesProvider;
  model: string;
  status: 'ONLINE' | 'NOT_CONNECTED' | 'ERROR';
  timestamp: string;
}
