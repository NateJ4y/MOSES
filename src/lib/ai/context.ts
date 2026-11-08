import type {
  MosesCollection,
  MosesCollectionContext,
  MosesCollectionInput,
  MosesContext,
} from './types';
import { MOSES_COLLECTION_NAMES } from './types';

const MAX_ITEMS_PER_COLLECTION = 100;
const MAX_MESSAGES = 30;
const MAX_CONTEXT_CHARACTERS = 120_000;
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
    return value.slice(0, MAX_ARRAY_ITEMS).map((item) => sanitizeValue(item, depth + 1));
  }
  if (typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>).slice(0, MAX_OBJECT_KEYS);
    return Object.fromEntries(entries.map(([key, item]) => [
      key,
      SECRET_KEY.test(key) ? '[REDACTED]' : sanitizeValue(item, depth + 1),
    ]));
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
  if (!input || input.error) {
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
  const loadedCollections = snapshots.filter((item) => item.status === 'loaded').length;
  const emptyCollections = snapshots.filter((item) => item.status === 'empty').length;

  return {
    ...context,
    system: {
      completeness: unavailableCollections || truncatedCollections ? 'partial' : 'complete',
      collectionCount: snapshots.length,
      loadedCollections,
      emptyCollections,
      unavailableCollections,
      truncatedCollections,
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
