import type { Lead, OutreachChannel, OutreachSequence } from '../../types';
import type { ColdSequenceStatus } from '../../lib/skeem';

export const newId = (prefix: string) => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
export const nice = (value: string) => value.replace(/_/g, ' ').toLowerCase().replace(/^\w/, (c) => c.toUpperCase());
export const day = (iso?: string | null) => (iso ? new Date(iso).toISOString().slice(0, 10) : '—');
export const shortDate = (iso?: string | null) => {
  const d = iso ? new Date(iso) : null;
  return d && !isNaN(d.getTime()) ? d.toLocaleDateString('en-ZA', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'Africa/Johannesburg' }) : '—';
};
export const when = (iso?: string) => {
  const d = iso ? new Date(iso) : null;
  return d && !isNaN(d.getTime()) ? d.toLocaleString('en-ZA', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Africa/Johannesburg' }) : '—';
};

export const CHANNELS: { id: OutreachChannel; label: string }[] = [
  { id: 'WHATSAPP', label: 'WhatsApp' }, { id: 'EMAIL', label: 'Email' },
  { id: 'INSTAGRAM', label: 'Instagram' }, { id: 'LINKEDIN', label: 'LinkedIn' }, { id: 'PHONE', label: 'Phone' }
];
export const TONES = [
  { id: 'NATURAL', label: 'Natural' }, { id: 'FRIENDLY', label: 'Friendly' },
  { id: 'DIRECT', label: 'Direct' }, { id: 'PROFESSIONAL', label: 'Professional' }
] as const;

/** Which cadence a new message belongs to. Derived, so the two cadences never merge by accident. */
export function sequenceFor(lead: Lead, cold: ColdSequenceStatus | null): OutreachSequence {
  if (lead.conceptStatus === 'DELIVERED') return 'POST_CONCEPT';
  if (cold?.state === 'REPLIED') return 'OTHER';
  return 'COLD';
}
