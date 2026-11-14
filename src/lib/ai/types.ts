export type MosesProvider = 'groq';

export const MOSES_COLLECTION_NAMES = [
  'companies',
  'contacts',
  'leads',
  'clients',
  'client_dna',
  'projects',
  'tasks',
  'services',
  'offers',
  'outreach',
  'messages',
  'emails',
  'research',
  'knowledge',
  'memory',
  'workflows',
  'workflow_runs',
  'activities',
  'goals_kpis',
  'documents',
  'integrations',
  'settings',
] as const;

export type MosesCollection = (typeof MOSES_COLLECTION_NAMES)[number];
export type CollectionLoadStatus = 'loaded' | 'empty' | 'unavailable' | 'truncated' | 'not_queried';

export interface MosesCollectionInput {
  records?: unknown[];
  error?: boolean;
}

export interface MosesCollectionContext {
  status: CollectionLoadStatus;
  count: number;
  fetchedCount: number;
  truncated: boolean;
  records: unknown[];
}

export interface MosesContext {
  activeSection: string;
  collections: Record<MosesCollection, MosesCollectionContext>;
  system: {
    completeness: 'complete' | 'partial';
    collectionCount: number;
    loadedCollections: number;
    emptyCollections: number;
    unavailableCollections: number;
    truncatedCollections: number;
    notQueriedCollections: number;
    totalRecords: number;
  };
}

export interface MosesAIResult {
  reply: string;
  provider: MosesProvider;
  model: string;
  status: 'ONLINE' | 'NOT_CONNECTED' | 'ERROR';
  timestamp: string;
}
