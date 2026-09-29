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

// System Knowledge & Architecture Docs (Permanent OS Manifesto & Protocols)
export const INITIAL_KNOWLEDGE_DOCS: KnowledgeDoc[] = [
  {
    id: 'doc-1',
    title: 'The Coalesce Philosophy & Solo Operator Model',
    category: 'BRAND',
    content: `// COALESCE DIGITAL MANIFESTO
Coalesce Digital is a solo specialist practice operated by Nate.

1. System Building Over Task Freelancing:
   Traditional agencies sell hourly labor. Coalesce builds revenue and operational systems (websites that convert, automations that eliminate admin, AI intake bots that capture leads 24/7).

2. Capacity Protection Mandate:
   As a solo operator, Nate's primary leverage is focus and delivery speed. We deliberately cap simultaneous high-touch client builds at 3 to maintain elite craftsmanship.

3. High-Leverage Delivery:
   Utilize modern Jamstack, webhook orchestrations (n8n), AI models, and rapid prototyping to deliver agency-grade output in days, not months.`,
    tags: ['manifesto', 'solo-model', 'positioning', 'systems'],
    lastUpdated: '2026-08-25'
  },
  {
    id: 'doc-2',
    title: 'The Skeem Outreach Method: Playbook & Framework',
    category: 'SCRIPTS',
    content: `// THE SKEEM METHOD PLAYBOOK
Objective: Create high-trust business conversations without cold pitching.

Core Philosophy:
"Nobody wants a cold pitch deck. Everyone wants to see how their business could look if someone solved their friction."

The 7-Stage Sequence:
1. IDENTIFY: Audit the prospect's public digital presence. Pinpoint observable friction (slow mobile loading, clunky manual PDF forms, dead WhatsApp links).
2. ENGAGE: Interact authentically with their content.
3. CONVERSATION: Open low-friction dialogue with a casual, genuine compliment and observation.
4. PROBLEM ID: Casually highlight the specific bottleneck costing them money.
5. SKEEM PREVIEW: Deliver a free 45-60s interactive prototype or live demo link.
6. RISK REMOVAL: Reiterate zero pressure / zero obligation.
7. FOLLOW-UP: Value-first check-in 48 hours later.`,
    tags: ['skeem', 'outreach', 'scripts', 'conversion'],
    lastUpdated: '2026-08-28'
  },
  {
    id: 'doc-3',
    title: 'Coalesce Flexible Retainer Architecture & Pricing Baseline',
    category: 'PRICING',
    content: `// PRICING REFERENCE & REVENUE MATRIX
Baseline guidance for South African market (treat as flexible starting points):

1. STARTER SETUP (~R1,500 - R2,500 once-off):
   Lightweight digital asset overhaul, landing page conversion tune-up, single WhatsApp lead intake integration.

2. GROWTH SYSTEM (~R2,500 - R3,500/mo retainer):
   Fast Jamstack website + automated lead capture + weekly maintenance + social conversion assets.

3. PARTNER SUITE (~R5,000/mo retainer):
   Full digital operations partner. 24/7 WhatsApp AI receptionist + CRM automation + continuous conversion rate optimization + priority turnaround.

Rule: Always frame pricing in terms of hours saved and revenue captured.`,
    tags: ['pricing', 'retainers', 'revenue', 'rates'],
    lastUpdated: '2026-08-27'
  },
  {
    id: 'doc-4',
    title: 'Moses Persona Operating Directive & Tone Guidelines',
    category: 'OPERATIONS',
    content: `// MOSES AI CORE DIRECTIVE
Moses is Nate's tactical AI operating partner.

Voice Characteristics:
- Direct, concise, and unapologetically practical.
- Intelligent and strategic: always prioritizes high-leverage revenue over vanity metrics.
- Slightly dry, sarcastic sense of humor.
- Colloquial nuance: uses South African slang ("skeem") naturally, without forcing it.
- Action-oriented: never delivers a wall of text without a clear, immediate next action for Nate.`,
    tags: ['moses', 'persona', 'ai-core', 'rules'],
    lastUpdated: '2026-08-29'
  }
];

// Core Operating Memory
export const MEMORY_ITEMS: MemoryItem[] = [
  {
    id: 'mem-1',
    category: 'BUSINESS',
    type: 'FACT',
    content: 'Coalesce Digital is a solo specialist practice operated by Nate. High-touch quality and lean automation are core differentiators.',
    context: 'Core operational mandate',
    timestamp: 'Permanent',
    confidence: 1.0
  },
  {
    id: 'mem-2',
    category: 'STRATEGIES',
    type: 'DECISION',
    content: 'Always lead with the "Skeem" method (free low-friction concept preview) to build trust and conversation before pitching contracts.',
    context: 'Outreach philosophy',
    timestamp: 'Permanent',
    confidence: 0.98
  },
  {
    id: 'mem-3',
    category: 'PREFERENCES',
    type: 'PREFERENCE',
    content: 'Prioritize ongoing monthly retainers (R2,500 - R5,000/mo) over one-off low-margin brochure builds to stabilize recurring cashflow.',
    context: 'Business model',
    timestamp: 'Permanent',
    confidence: 0.95
  },
  {
    id: 'mem-4',
    category: 'BUSINESS',
    type: 'FACT',
    content: 'Historical baseline reference: Starter ~R1,500 once-off, Growth ~R2,500/mo, Partner ~R5,000/mo. Subject to Nate confirmation per deal.',
    context: 'Pricing reference',
    timestamp: 'Permanent',
    confidence: 0.92
  },
  {
    id: 'mem-5',
    category: 'PROJECTS',
    type: 'TASK',
    content: 'Keep personal development bandwidth capped at 3-4 concurrent client builds to avoid delivery quality drops.',
    context: 'Capacity safety threshold',
    timestamp: 'Permanent',
    confidence: 0.96
  }
];

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
