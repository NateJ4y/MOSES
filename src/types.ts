export type NavSection =
  | 'HOME'
  | 'COMMAND'
  | 'BUSINESS_DEVELOPMENT'
  | 'LEADS'
  | 'OUTREACH'
  | 'EMAIL'
  | 'WHATSAPP'
  | 'RESEARCH'
  | 'SYSTEMS'
  | 'DIGITAL_OPERATIONS'
  | 'KNOWLEDGE'
  | 'MEMORY'
  | 'SETTINGS';

export type LeadStatus =
  | 'NEW'
  | 'QUALIFIED'
  | 'CONTACTED'
  | 'CONVERSATION'
  | 'OPPORTUNITY'
  | 'PROPOSAL'
  | 'WON'
  | 'LOST';

export type LeadScoreTier = 'HOT' | 'WARM' | 'COLD' | 'POOR_FIT' | 'UNSCORED';

export interface LeadSocialLinks {
  instagram?: string;
  linkedin?: string;
  twitter?: string;
  facebook?: string;
  whatsapp?: string;
}

export interface Lead {
  id: string;
  business: string;
  contactPerson?: string;
  contactRole?: string;
  email?: string;
  phone?: string;
  website: string;
  social: string;
  socialLinks?: LeadSocialLinks;
  industry: string;
  location: string;
  problem: string;
  potentialService: string;
  leadScore: number;
  scoreTier: LeadScoreTier;
  status: LeadStatus;
  estimatedValue: number;
  nextAction: string;
  lastContact: string;
  followUpDate: string;
  scoreExplanation: string;
  signals: string[];
  capacityRisk?: boolean;
  notes?: string;
}

export interface OutreachDraft {
  id: string;
  channel: 'INSTAGRAM' | 'EMAIL' | 'LINKEDIN' | 'WHATSAPP';
  targetBusiness: string;
  contactPerson: string;
  subject?: string;
  content: string;
  stage: 'IDENTIFY' | 'ENGAGE' | 'CONVERSATION' | 'PROBLEM_ID' | 'SOFT_PITCH' | 'RISK_REMOVAL' | 'FOLLOW_UP';
  includeSkeemPreview: boolean;
  status: 'DRAFT' | 'READY' | 'SENT';
  createdAt: string;
}

export interface EmailMessage {
  id: string;
  from: string;
  to: string;
  subject: string;
  snippet: string;
  body: string;
  date: string;
  category: 'INBOX' | 'LEADS' | 'FOLLOW_UPS' | 'CAMPAIGNS' | 'DRAFTS' | 'SENT';
  status: 'DRAFT_READY' | 'UNDER_REVIEW' | 'APPROVED' | 'SENT' | 'RECEIVED';
  aiSummary?: string;
  detectedOpportunity?: string;
}

export interface WhatsAppFlow {
  id: string;
  name: string;
  description: string;
  status: 'ACTIVE' | 'STANDBY' | 'PAUSED';
  trigger: string;
  stepsCount: number;
  totalLeadsQualified: number;
}

export interface ResearchItem {
  id: string;
  category: 'AI' | 'MARKETING' | 'WEBSITES' | 'SOCIAL_MEDIA' | 'AUTOMATION' | 'BUSINESS' | 'DESIGN' | 'TECHNOLOGY';
  trend: string;
  whyItMatters: string;
  opportunityForCoalesce: string;
  recommendedAction: string;
  date: string;
  urgency: 'HIGH' | 'MEDIUM' | 'EMERGING';
}

export type NodeType = 'TRIGGER' | 'INPUT' | 'PROCESS' | 'DECISION' | 'ACTION' | 'NOTIFICATION' | 'DATABASE';

export interface WorkflowNode {
  id: string;
  type: NodeType;
  title: string;
  description: string;
  x: number;
  y: number;
  config?: Record<string, any>;
}

export interface WorkflowEdge {
  id: string;
  from: string;
  to: string;
  label?: string;
}

export interface DigitalOpsProject {
  id: string;
  client: string;
  serviceCategory: 'WEBSITES' | 'SOCIAL_MEDIA' | 'GRAPHIC_DESIGN' | 'AUTOMATION' | 'CLIENT_PROJECTS';
  serviceName: string;
  status: 'DISCOVERY' | 'IN_PROGRESS' | 'REVIEW' | 'DELIVERED' | 'MAINTENANCE';
  progress: number;
  deadline: string;
  monthlyRetainer?: number;
  tasks: { id: string; title: string; completed: boolean }[];
  assetsCount: number;
  notes: string;
  nextAction: string;
  capacityImpact: 'LOW' | 'MEDIUM' | 'HIGH';
}

export type MemoryCategory = 'USER' | 'BUSINESS' | 'CLIENTS' | 'PROJECTS' | 'PREFERENCES' | 'DECISIONS' | 'STRATEGIES';
export type MemoryType = 'FACT' | 'PREFERENCE' | 'DECISION' | 'TASK' | 'INFERENCE';

export interface MemoryItem {
  id: string;
  category: MemoryCategory;
  type: MemoryType;
  content: string;
  context?: string;
  timestamp: string;
  confidence: number;
}

export interface StrategicWarning {
  id: string;
  title: string;
  code: 'POSITIONING_CONFLICT' | 'PRICING_NEEDS_REVIEW' | 'PORTFOLIO_TOO_THIN' | 'FOLLOW_UP_OVERDUE' | 'PIPELINE_LEAKAGE' | 'CAPACITY_RISK' | 'LOW_PROOF' | 'AUTOMATION_CASE_STUDY_GAP';
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  description: string;
  recommendation: string;
}

export interface KnowledgeDoc {
  id: string;
  title: string;
  category: 'BRAND' | 'PRICING' | 'SCRIPTS' | 'OPERATIONS' | 'DECISIONS' | 'CLIENT_HISTORY';
  content: string;
  tags: string[];
  lastUpdated: string;
}

export interface ChatMessage {
  id: string;
  sender: 'USER' | 'MOSES' | 'NATE';
  text: string;
  timestamp: string;
  intent?: string;
  structuredResponse?: {
    analysis?: string;
    plan?: string[];
    action?: string;
    result?: string;
  };
}
