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
   SAMPLE / DEMO DATASETS (Archived for optional demo reload in Settings)
   ========================================================================= */

// No demo/sample lead records. Leads are created only from real user-entered or connected source data.
export const SAMPLE_LEADS: Lead[] = [];


export const SAMPLE_WARNINGS: StrategicWarning[] = [
  {
    id: 'warn-1',
    title: 'FOLLOW-UP OVERDUE',
    code: 'FOLLOW_UP_OVERDUE',
    severity: 'HIGH',
    description: '3 qualified prospects have follow-ups scheduled for today (Kloof Roasters, Vanguard Freight, Coastal Legal).',
    recommendation: 'Dispatch conversational follow-ups before starting secondary UI design or systems tinkering.'
  },
  {
    id: 'warn-2',
    title: 'CAPACITY RISK DETECTED',
    code: 'CAPACITY_RISK',
    severity: 'MEDIUM',
    description: 'Titan Global enquiry flagged: 40+ system integrations requested. Beyond solo specialist capacity.',
    recommendation: 'Reject scope or broker as referral. Protect weekly bandwidth for high-margin retainer clients.'
  },
  {
    id: 'warn-3',
    title: 'PRICING BASELINE REVIEW',
    code: 'PRICING_NEEDS_REVIEW',
    severity: 'LOW',
    description: 'Historical baselines (Starter R1,500, Growth R2,500/mo, Partner R5,000/mo) need value-pricing alignment for AI automation tiers.',
    recommendation: 'Propose performance-linked retainer options to capture automation efficiency upside.'
  },
  {
    id: 'warn-4',
    title: 'AUTOMATION CASE STUDY GAP',
    code: 'AUTOMATION_CASE_STUDY_GAP',
    severity: 'MEDIUM',
    description: 'Prospects respond 3x faster when viewing a live interactive WhatsApp bot demo vs static PDF presentations.',
    recommendation: 'Keep the live WhatsApp demo widget active and linkable in outreach messages.'
  }
];

export const SAMPLE_PROJECTS: DigitalOpsProject[] = [
  {
    id: 'proj-1',
    client: 'Kloof Artisanal Roasters',
    serviceCategory: 'WEBSITES',
    serviceName: 'E-commerce & Subscription Overhaul',
    status: 'IN_PROGRESS',
    progress: 65,
    deadline: 'Friday, 17:00',
    monthlyRetainer: 2500,
    tasks: [
      { id: 't1', title: 'Design mobile-first subscription selector UI', completed: true },
      { id: 't2', title: 'Integrate PayFast recurring billing tokenization', completed: true },
      { id: 't3', title: 'Configure abandoned cart WhatsApp recovery flow', completed: false },
      { id: 't4', title: 'DNS migration & final client handover walkthrough', completed: false }
    ],
    assetsCount: 14,
    notes: 'Client is thrilled with the live preview. Focus on checkout speed testing.',
    nextAction: 'Finalize PayFast webhook test and deploy staging environment.',
    capacityImpact: 'MEDIUM'
  },
  {
    id: 'proj-2',
    client: 'Dr. Sarah Ndlovu (Aura Clinic)',
    serviceCategory: 'AUTOMATION',
    serviceName: '24/7 WhatsApp AI Receptionist & Booking Bot',
    status: 'DISCOVERY',
    progress: 30,
    deadline: 'Next Tuesday',
    monthlyRetainer: 3500,
    tasks: [
      { id: 't5', title: 'Map treatment FAQ database and doctor availability slots', completed: true },
      { id: 't6', title: 'Configure Google Calendar / Cal.com webhook integration', completed: false },
      { id: 't7', title: 'Train AI prompt on clinic tone and pricing tiers', completed: false }
    ],
    assetsCount: 6,
    notes: 'Dr. Ndlovu requested strict appointment deposit reminders.',
    nextAction: 'Send draft prompt test to clinic manager for approval.',
    capacityImpact: 'LOW'
  },
  {
    id: 'proj-3',
    client: 'Apex Fitness Collective',
    serviceCategory: 'GRAPHIC_DESIGN',
    serviceName: 'Digital Identity & Member Portal Assets',
    status: 'REVIEW',
    progress: 90,
    deadline: 'Today, 18:00',
    tasks: [
      { id: 't8', title: 'Vectorize high-contrast logo suite for dark/light display', completed: true },
      { id: 't9', title: 'Export social media launch promo kit', completed: true },
      { id: 't10', title: 'Deliver Figma asset bundle and brand guideline spec', completed: false }
    ],
    assetsCount: 22,
    notes: 'Final review underway. Awaiting client sign-off on social launch banners.',
    nextAction: 'Ping Sipho for final green light.',
    capacityImpact: 'LOW'
  }
];

export const SAMPLE_EMAILS: EmailMessage[] = [
  {
    id: 'em-1',
    from: 'david@kloofroasters.co.za',
    to: 'nate@coalescedigital.co.za',
    subject: 'Re: Quick preview for Kloof Coffee subscription flow',
    snippet: 'Hey Nate! Just checked out that video walkthrough. The checkout flow looks insanely clean...',
    body: `Hey Nate,

Just checked out that video walkthrough you sent over. The subscription checkout flow looks insanely clean compared to what we have now.

Our team has been manually tracking weekly bean orders on a spreadsheet and it's getting chaotic. When could we get this live, and what does the timeline look like?

Cheers,
David Miller
Founder, Kloof Roasters`,
    date: '08:42 AM',
    category: 'LEADS',
    status: 'DRAFT_READY',
    aiSummary: 'David loved the live preview. He is asking for deployment timeline and implementation steps.',
    detectedOpportunity: 'High probability conversion. Immediate action required to lock proposal.'
  },
  {
    id: 'em-2',
    from: 'johan@vanguardlogistics.co.za',
    to: 'nate@coalescedigital.co.za',
    subject: 'Automated Rate Card Enquiry',
    snippet: 'Good morning Nate. Can this system integrate directly with our Durban dispatch desk?',
    body: `Good morning Nate,

Received your note regarding the mobile quoting friction. We do lose leads after hours. Can this bot send quote data directly into our dispatch WhatsApp group?

Regards,
Johan van der Merwe`,
    date: 'Yesterday',
    category: 'LEADS',
    status: 'RECEIVED',
    aiSummary: 'Johan is asking about dispatch WhatsApp group notification integration.',
    detectedOpportunity: 'Standard n8n webhook / WhatsApp Cloud API workflow will fulfill this in 20 minutes.'
  },
  {
    id: 'em-3',
    from: 'billing@payfast.io',
    to: 'nate@coalescedigital.co.za',
    subject: 'Merchant Token Integration Verified',
    snippet: 'Your recurring billing sandbox endpoints have passed automated testing.',
    body: 'Sandbox subscription test transactions executed with 0 errors.',
    date: '2 days ago',
    category: 'INBOX',
    status: 'RECEIVED'
  }
];

export const SAMPLE_OUTREACH_DRAFTS: OutreachDraft[] = [
  {
    id: 'out-1',
    channel: 'INSTAGRAM',
    targetBusiness: 'Apex Fitness Collective',
    contactPerson: 'Sipho Zuma',
    content: `Hey Sipho, love the energy on your latest training clips! 

Noticed your bio link still directs new gym members to a static PDF form. Put together a 30-sec live prototype showing how a 2-click WhatsApp member signup + instant PayFast debit order looks for Apex. 

Zero obligation at all, just thought it'd save your front desk 10+ hours a week. Drop me a thumbs up if you want to peek at the link!`,
    stage: 'SOFT_PITCH',
    includeSkeemPreview: true,
    status: 'READY',
    createdAt: 'Today, 07:30'
  },
  {
    id: 'out-2',
    channel: 'EMAIL',
    targetBusiness: 'Coastal Conveyancing Attorneys',
    contactPerson: 'Gareth Thorne',
    subject: 'Quick concept: Client transfer status tracker for Coastal Conveyance',
    content: `Hi Gareth,

Hope you're having a productive week.

Conveyancing firms often get overwhelmed with daily phone calls from buyers asking: "Has my deed lodged yet?"

I built a lightweight, secure status portal prototype where clients enter their file number and instantly see their transfer progress on their phone—cutting inbound repetitive status inquiries by over 60%.

Threw together a live interactive concept preview for Coastal Conveyance:
[Link: coalesce-preview.io/coastal-conveyance]

Would love to hear your thoughts on whether this could streamline your team's weekly admin.

Best regards,
Nate
Coalesce Digital`,
    stage: 'PROBLEM_ID',
    includeSkeemPreview: true,
    status: 'READY',
    createdAt: 'Yesterday'
  }
];

/* =========================================================================
   DEFAULT WIPED SYSTEM STATE (OS in clean default mode)
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
    status: 'ACTIVE',
    trigger: 'Inbound message on WhatsApp Webhook',
    stepsCount: 5,
    totalLeadsQualified: 0
  },
  {
    id: 'wf-2',
    name: 'Abandoned Quote / Cart Follow-Up Engine',
    description: 'Triggers 2 hours after a lead interacts with the web quote widget but does not complete submission. Offers friendly assistance with no pressure.',
    status: 'STANDBY',
    trigger: 'Webhook: quote_abandoned_event',
    stepsCount: 3,
    totalLeadsQualified: 0
  }
];

// Market Research & Intelligence Insights
export const RESEARCH_ITEMS: ResearchItem[] = [
  {
    id: 'res-1',
    category: 'AI',
    trend: '24/7 WhatsApp AI Customer Support & Booking for Service SMBs',
    whyItMatters: 'WhatsApp maintains 96% open rates in South Africa & Africa. Small clinics, salons, and mechanics lose warm leads when receptionists are off-duty.',
    opportunityForCoalesce: 'Package turnkey WhatsApp AI Lead Qualification & Appointment Bots as a recurring monthly retainer (R2,500 - R4,500/mo).',
    recommendedAction: 'Build interactive demo on Coalesce OS and send 10 targeted DMs to local clinic founders with a free concept test.',
    date: 'Active',
    urgency: 'HIGH'
  },
  {
    id: 'res-2',
    category: 'WEBSITES',
    trend: 'Headless / High-Speed Jamstack vs Clunky Legacy WordPress for SMBs',
    whyItMatters: 'Legacy WP plugins create security vulnerabilities and 4+ second load times, slashing mobile conversion rates by 50%.',
    opportunityForCoalesce: 'Offer ultra-fast lightweight websites with integrated lead capture and zero bloat.',
    recommendedAction: 'Audit local businesses on PageSpeed Insights and lead with speed benchmark data in outreach.',
    date: 'Active',
    urgency: 'HIGH'
  },
  {
    id: 'res-3',
    category: 'AUTOMATION',
    trend: 'Low-Code Webhook Pipelines (n8n / Make) Replacing Manual Admin in SMBs',
    whyItMatters: 'Business owners spend 15+ hours weekly copy-pasting customer data between emails, spreadsheets, and invoices.',
    opportunityForCoalesce: 'Position "System Building" over generic freelancing. Sell time-savings and administrative freedom.',
    recommendedAction: 'Document a 3-step automation blueprint and publish it as an actionable LinkedIn teardown.',
    date: 'Active',
    urgency: 'MEDIUM'
  },
  {
    id: 'res-4',
    category: 'MARKETING',
    trend: 'The "Concept-First" Soft Pitch vs Hard Cold Pitching',
    whyItMatters: 'Cold email replies have dropped 40% due to spam filters. High-value prospects only respond when given tangible value upfront.',
    opportunityForCoalesce: 'Deploy the Coalesce "Skeem" method: deliver a 45-second loom or live preview link with zero obligation.',
    recommendedAction: 'Standardize Figma / code preview templates for fast 20-minute turnaround per lead.',
    date: 'Active',
    urgency: 'HIGH'
  }
];

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
        'Command Moses to find high-probability prospects',
        'Configure outreach templates and service packages'
      ],
      action: 'Ready for new prospect intake or tactical prompt.'
    }
  }
];
