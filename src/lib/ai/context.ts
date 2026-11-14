import type {
  MosesCollection,
  MosesCollectionContext,
  MosesCollectionInput,
  MosesContext,
} from './types';
import { MOSES_COLLECTION_NAMES } from './types';

const MAX_ITEMS_PER_COLLECTION = 25;
const MAX_MESSAGES = 20;
const MAX_CONTEXT_CHARACTERS = 12_000;
const MAX_STRING_LENGTH = 3_000;
const MAX_OBJECT_KEYS = 50;
const MAX_ARRAY_ITEMS = 30;
const MAX_DEPTH = 7;

const SECRET_KEY = /(password|secret|token|authorization|credential|private.?key|api.?key|access.?key|refresh.?token)/i;

function sanitizeValue(value: unknown, depth = 0): unknown {
  if (value == null || typeof value === 'boolean' || typeof value === 'number') return value;
  if (typeof value === 'string') {
    return value.length > MAX_STRING_LENGTH ? value.slice(0, MAX_STRING_LENGTH) + ' [TRUNCATED]' : value;
  }
  if (depth >= MAX_DEPTH) return '[DEPTH LIMITED]';
  if (Array.isArray(value)) {
    const items = value.slice(0, MAX_ARRAY_ITEMS).map((item) => sanitizeValue(item, depth + 1));
    if (value.length > MAX_ARRAY_ITEMS) items.push(`[TRUNCATED: ${value.length - MAX_ARRAY_ITEMS} additional array items omitted]`);
    return items;
  }
  if (typeof value === 'object') {
    const allEntries = Object.entries(value as Record<string, unknown>);
    const entries = allEntries.slice(0, MAX_OBJECT_KEYS);
    const safe = Object.fromEntries(entries.map(([key, item]) => [
      key,
      SECRET_KEY.test(key) ? '[REDACTED]' : sanitizeValue(item, depth + 1),
    ]));
    if (allEntries.length > MAX_OBJECT_KEYS) {
      safe._mosesTruncatedFields = allEntries.length - MAX_OBJECT_KEYS;
    }
    return safe;
  }
  return String(value);
}

function sanitizeRecord(collection: MosesCollection, record: unknown): unknown {
  if (!record || typeof record !== 'object' || Array.isArray(record)) {
    return sanitizeValue(record);
  }

  const source = record as Record<string, unknown>;
  const safe = { ...(sanitizeValue(source) as Record<string, unknown>) };

  // Integration configuration can contain provider credentials. The AI only
  // needs connection identity and status, never the stored configuration.
  if (collection === 'integrations') delete safe.config;

  // Settings values are recursively secret-filtered; credentials are never
  // intentionally supplied as operational context.
  if (collection === 'documents') {
    delete safe.storage_key;
    delete safe.storageKey;
  }

  return {
    ...safe,
    _mosesContext: {
      collection,
      recordId: typeof source.id === 'string' ? source.id : null,
      createdAt: source.createdAt ?? source.created_at ?? null,
      updatedAt: source.updatedAt ?? source.updated_at ?? null,
    },
  };
}

function makeSnapshot(input: MosesCollectionInput | undefined, collection: MosesCollection): MosesCollectionContext {
  if (!input) {
    return { status: 'not_queried', count: 0, fetchedCount: 0, truncated: false, records: [] };
  }
  if (input.error) {
    return { status: 'unavailable', count: 0, fetchedCount: 0, truncated: false, records: [] };
  }

  const sourceRecords = Array.isArray(input.records) ? input.records : [];
  const max = collection === 'messages' ? MAX_MESSAGES : MAX_ITEMS_PER_COLLECTION;
  const truncated = sourceRecords.length > max;
  const records = sourceRecords.slice(0, max).map((record) => sanitizeRecord(collection, record));

  return {
    status: truncated ? 'truncated' : records.length ? 'loaded' : 'empty',
    count: records.length,
    fetchedCount: sourceRecords.length,
    truncated,
    records,
  };
}

function updateSystem(context: Omit<MosesContext, 'system'>): MosesContext {
  const snapshots = Object.values(context.collections);
  const unavailableCollections = snapshots.filter((item) => item.status === 'unavailable').length;
  const truncatedCollections = snapshots.filter((item) => item.truncated).length;
  const notQueriedCollections = snapshots.filter((item) => item.status === 'not_queried').length;
  const loadedCollections = snapshots.filter((item) => item.status === 'loaded').length;
  const emptyCollections = snapshots.filter((item) => item.status === 'empty').length;

  return {
    ...context,
    system: {
      completeness: unavailableCollections || truncatedCollections || notQueriedCollections ? 'partial' : 'complete',
      collectionCount: snapshots.length,
      loadedCollections,
      emptyCollections,
      unavailableCollections,
      truncatedCollections,
      notQueriedCollections,
      totalRecords: snapshots.reduce((total, item) => total + item.count, 0),
    },
  };
}

export function buildMosesContext(input: {
  activeSection: string;
  collections: Partial<Record<MosesCollection, MosesCollectionInput>>;
}): MosesContext {
  const collections = Object.fromEntries(
    MOSES_COLLECTION_NAMES.map((collection) => [
      collection,
      makeSnapshot(input.collections[collection], collection),
    ]),
  ) as Record<MosesCollection, MosesCollectionContext>;

  const context = updateSystem({
    activeSection: String(input.activeSection || 'COMMAND').slice(0, 40),
    collections,
  });

  // Keep the prompt bounded. If the total context is too large, remove the
  // oldest/last-listed records from the currently largest collection and mark
  // that collection truncated. The database itself is never modified.
  while (JSON.stringify(context).length > MAX_CONTEXT_CHARACTERS) {
    const largest = MOSES_COLLECTION_NAMES
      .filter((name) => context.collections[name].records.length > 0)
      .sort((a, b) => context.collections[b].records.length - context.collections[a].records.length)[0];

    if (!largest) break;
    const snapshot = context.collections[largest];
    snapshot.records.pop();
    snapshot.count = snapshot.records.length;
    snapshot.truncated = true;
    snapshot.status = 'truncated';
    context.system = updateSystem({
      activeSection: context.activeSection,
      collections: context.collections,
    }).system;
  }

  return context;
}

export function serializeMosesContext(context: MosesContext): string {
  return JSON.stringify(context);
}


const COLLECTION_TERMS: Partial<Record<MosesCollection, RegExp>> = {
  companies: /\b(compan(?:y|ies)|business(?:es)?)\b/i,
  contacts: /\b(contact|person|people|owner|decision.?maker)\b/i,
  leads: /\b(lead|prospect|pipeline|enquir(?:y|ies)|rl\s?trailers?)\b/i,
  clients: /\b(client|customer|account)\b/i,
  client_dna: /\b(client dna|ideal customer|customer profile|personas?)\b/i,
  projects: /\b(project|build|delivery|website|redesign|launch)\b/i,
  tasks: /\b(task|todo|to-do|deadline|due|priority)\b/i,
  services: /\b(service|offering|capabilit(?:y|ies))\b/i,
  offers: /\b(offer|quote|quotation|proposal|pricing|price)\b/i,
  outreach: /\b(outreach|cold message|follow.?up|campaign|prospecting)\b/i,
  messages: /\b(message|chat|conversation|whatsapp|communication|reply)\b/i,
  emails: /\b(email|inbox|mail|sent)\b/i,
  research: /\b(research|competitor|market|industry|benchmark)\b/i,
  knowledge: /\b(knowledge|playbook|guideline|documentation|how do we)\b/i,
  memory: /\b(memory|remember|previous decision|history)\b/i,
  workflows: /\b(workflow|automation|n8n|process|integration flow)\b/i,
  workflow_runs: /\b(workflow run|execution|run history|automation history)\b/i,
  activities: /\b(activity|timeline|audit trail|what happened)\b/i,
  goals_kpis: /\b(goal|kpi|target|metric|performance|revenue|growth)\b/i,
  documents: /\b(document|file|attachment|contract|brief)\b/i,
  integrations: /\b(integration|connected app|provider|connection status)\b/i,
  settings: /\b(setting|configuration|preference)\b/i,
};
const RELATED_COLLECTIONS: Partial<Record<MosesCollection, MosesCollection[]>> = {
  leads: ['companies', 'contacts', 'outreach', 'messages', 'activities', 'offers'],
  clients: ['companies', 'contacts', 'client_dna', 'projects', 'tasks', 'messages', 'emails'],
  projects: ['clients', 'tasks', 'documents', 'activities', 'messages'],
  tasks: ['projects', 'clients', 'activities'],
  outreach: ['leads', 'companies', 'contacts', 'messages'],
  messages: ['leads', 'clients', 'contacts', 'outreach'],
  workflows: ['workflow_runs', 'integrations', 'activities'],
  goals_kpis: ['activities', 'projects', 'tasks'],
};
const BROAD_REQUEST = /\b(overview|snapshot|everything|all (?:my |the )?(?:data|records|collections)|entire workspace|workspace data|what data (?:do|does) you have)\b/i;
const DEFAULT_COLLECTIONS: MosesCollection[] = ['leads', 'clients', 'companies', 'contacts', 'projects', 'tasks', 'messages'];
export function selectRelevantCollections(message: string, activeSection = 'COMMAND'): MosesCollection[] {
  if (BROAD_REQUEST.test(message)) return [...MOSES_COLLECTION_NAMES];
  const query = (activeSection + ' ' + message).slice(0, 8_500);
  const selected = new Set<MosesCollection>();
  for (const [collection, pattern] of Object.entries(COLLECTION_TERMS) as [MosesCollection, RegExp][]) {
    if (pattern.test(query)) selected.add(collection);
  }
  if (!selected.size) DEFAULT_COLLECTIONS.forEach((collection) => selected.add(collection));
  for (const collection of [...selected]) for (const related of RELATED_COLLECTIONS[collection] || []) selected.add(related);
  return MOSES_COLLECTION_NAMES.filter((collection) => selected.has(collection));
}
