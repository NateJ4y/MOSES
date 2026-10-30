import { 
  Lead, 
  ResearchItem, 
  DigitalOpsProject, 
  MemoryItem, 
  StrategicWarning, 
  EmailMessage, 
  OutreachDraft, 
  WhatsAppFlow, 
  WorkflowNode, 
  WorkflowEdge,
  KnowledgeDoc,
  ChatMessage
} from '../types';

/* =========================================================================
   CLEAN START STATE — no fabricated business records
   =========================================================================
   All CRM, project, inbox, outreach, warning and research records begin empty.
   Permanent knowledge below is system configuration, not client/demo data.
   ========================================================================= */

// All CRM, lead, project, and inbox records are initialized empty
export const INITIAL_LEADS: Lead[] = [];
export const STRATEGIC_WARNINGS: StrategicWarning[] = [];
export const INITIAL_WARNINGS = STRATEGIC_WARNINGS;
export const DIGITAL_OPS_PROJECTS: DigitalOpsProject[] = [];
export const INITIAL_PROJECTS = DIGITAL_OPS_PROJECTS;
export const INITIAL_EMAILS: EmailMessage[] = [];
export const INITIAL_OUTREACH_DRAFTS: OutreachDraft[] = [];

// Knowledge and memory are user-managed records. Never seed business content.
export const INITIAL_KNOWLEDGE_DOCS: KnowledgeDoc[] = [];
export const MEMORY_ITEMS: MemoryItem[] = [];

// Workflow Engine Blueprint
export const INITIAL_WORKFLOW_NODES: WorkflowNode[] = [
  { id: 'n-1', type: 'TRIGGER', title: 'New Web Lead Form', description: 'User submits inquiry on website or social link', x: 50, y: 150 },
  { id: 'n-2', type: 'PROCESS', title: 'Moses AI Analysis', description: 'Parses business URL, estimates budget & urgency', x: 280, y: 150 },
  { id: 'n-3', type: 'DECISION', title: 'Score >= 75 ?', description: 'Checks fit against Coalesce solo criteria', x: 520, y: 150 },
  { id: 'n-4', type: 'ACTION', title: 'WhatsApp Instant Reply', description: 'Dispatches personalized greeting + next step', x: 760, y: 80 },
  { id: 'n-5', type: 'NOTIFICATION', title: 'Telegram Alert to Nate', description: 'Pings phone with lead dossier & priority tag', x: 760, y: 240 },
  { id: 'n-6', type: 'DATABASE', title: 'Log in OS Pipeline', description: 'Appends to active pipeline with follow-up timer', x: 1000, y: 160 }
];

export const INITIAL_WORKFLOW_EDGES: WorkflowEdge[] = [
  { id: 'e-1', from: 'n-1', to: 'n-2', label: 'POST payload' },
  { id: 'e-2', from: 'n-2', to: 'n-3', label: 'Calculated Score' },
  { id: 'e-3', from: 'n-3', to: 'n-4', label: 'HOT / WARM' },
  { id: 'e-3b', from: 'n-3', to: 'n-5', label: 'High Priority' },
  { id: 'e-4', from: 'n-4', to: 'n-6' },
  { id: 'e-5', from: 'n-5', to: 'n-6' }
];

// WhatsApp intake flow blueprints
export const INITIAL_WHATSAPP_FLOWS: WhatsAppFlow[] = [
  {
    id: 'wf-1',
    name: 'Instant Lead Qualifier & Booking Bot',
    description: 'Greets inbound prospects in < 5s, identifies their primary bottleneck, presents service options, and books a call directly on Nate\'s calendar.',
    status: 'STANDBY',
    trigger: 'Inbound message on WhatsApp Webhook',
    stepsCount: 5,
    totalLeadsQualified: 0
  },
  {
    id: 'wf-2',
    name: 'Abandoned Quote / Cart Follow-Up Engine',
    description: 'Blueprint only. Requires a connected quote event source and WhatsApp provider before activation.',
    status: 'STANDBY',
    trigger: 'Webhook: quote_abandoned_event',
    stepsCount: 3,
    totalLeadsQualified: 0
  }
];

// Market Research & Intelligence Insights
// Live research must come from a connected research source. No fabricated insights are loaded.
export const RESEARCH_ITEMS: ResearchItem[] = [];

// Initial Default Boot Chat Message
export const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: 'msg-init-default',
    sender: 'MOSES',
    text: `System initialized. Telemetry online.

Good afternoon, Nate.
What's the move, skeem?

OS is in default standby mode. Pipeline records cleared. System ready for prospect intake, market research, or strategic instruction.`,
    timestamp: '10:00 AM',
    intent: 'SYSTEM_BOOT',
    structuredResponse: {
      analysis: 'Operating system is in default clean mode. Zero active pipeline records or pending bottlenecks.',
      plan: [
        'Add a new target business to the pipeline',
        'Connect a research source, then ask Moses to analyze verified prospects',
        'Configure outreach templates and service packages'
      ],
      action: 'Ready for verified data, connected integrations, or a tactical prompt.'
    }
  }
];
