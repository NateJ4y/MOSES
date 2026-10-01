import type { MosesContext } from './types';

const MAX_ITEMS = 100;
const MAX_MESSAGES = 30;

function cap<T>(items: T[] | undefined, max = MAX_ITEMS): T[] {
  return Array.isArray(items) ? items.slice(0, max) : [];
}

export function buildMosesContext(input: Partial<MosesContext>): MosesContext {
  const leads = cap(input.leads);
  const projects = cap(input.projects);
  const emails = cap(input.emails);
  const clientDNA = cap(input.clientDNA);
  const memory = cap(input.memory);
  const knowledge = cap(input.knowledge);
  const messages = cap(input.messages, MAX_MESSAGES);

  return {
    activeSection: String(input.activeSection || 'COMMAND'),
    leads,
    projects,
    emails,
    clientDNA,
    messages,
    memory,
    knowledge,
    system: {
      leadCount: leads.length,
      projectCount: projects.length,
      emailCount: emails.length,
      clientDNACount: clientDNA.length,
      memoryCount: memory.length,
      knowledgeCount: knowledge.length,
    },
  };
}

export function serializeMosesContext(context: MosesContext): string {
  return JSON.stringify(context, null, 2);
}
