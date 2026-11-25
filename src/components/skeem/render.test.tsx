import React from 'react';
import { describe, expect, it } from 'vitest';
import { renderToString } from 'react-dom/server';
import { OutreachView } from '../views/OutreachView';
import { AccessContext } from '../AccessContext';
import type { ActivityRecord, Lead, OutreachRecord } from '../../types';

const lead = (over: Partial<Lead>): Lead => ({
  id: 'L1', business: 'Acme Bakery', contactPerson: 'Thandi', location: 'Johannesburg, Gauteng', status: 'CONTACTED',
  potentialService: 'Website', problem: 'Unknown', lastContact: 'Never', nextAction: '', followUpDate: '', ...over
} as unknown as Lead);

const sent = (id: string, leadId: string, iso: string): OutreachRecord => ({
  id, leadId, stage: 'OPENING', channel: 'WHATSAPP', direction: 'OUTBOUND', sequence: 'COLD', content: 'Hi Thandi, quick question', status: 'SENT', createdAt: iso, sentAt: iso
});

function render(leads: Lead[], outreach: OutreachRecord[] = [], admin = false, canPersist = true) {
  const noop = () => undefined;
  return renderToString(
    <AccessContext.Provider value={{ isPlatformAdmin: admin, email: 'owner@example.com' }}>
      <OutreachView leads={leads} outreach={outreach} activities={[] as ActivityRecord[]} onUpdateLead={noop}
        onUpdateOutreach={noop as never} onUpdateActivities={noop as never} canPersist={canPersist} userName="Nate" />
    </AccessContext.Provider>
  );
}

describe('SKEEM Coach screen renders', () => {
  it('shows the empty state with no prospects', () => {
    expect(render([])).toContain('No prospects yet');
  });
  it('shows the prospect rail, next move and conversation for a new lead', () => {
    const html = render([lead({})]);
    expect(html).toContain('Acme Bakery'); expect(html).toContain('No outreach yet'); expect(html).toContain('Ask SKEEM to do this');
    expect(html).toContain('Nothing sent or received yet');
  });
  it('shows history and the cadence for a lead with a sent opener', () => {
    const html = render([lead({})], [sent('o1', 'L1', '2026-11-02T09:00:00Z')]);
    expect(html).toContain('Hi Thandi, quick question'); expect(html).toMatch(/Soft nudge \(Day 4\)/);
  });
  it('blocks everything for an opted-out lead', () => {
    const html = render([lead({ contactRestriction: 'OPT_OUT' })]);
    expect(html).toContain('Opted out'); expect(html).toContain('This prospect has opted out.');
  });
  it('tells the user saving is off while records are still loading', () => {
    expect(render([lead({})], [], false, false)).toContain('Saving is switched off');
  });
  it('shows concept approval controls to the super admin and a request button to everyone else', () => {
    expect(render([lead({})], [], true)).toContain('Approve concept');
    expect(render([lead({})], [], false)).toContain('Request a concept');
    expect(render([lead({ conceptStatus: 'REQUESTED' })], [], false)).toContain('Waiting for the super admin');
  });
  it('shows the regional price and suggests a region from the location', () => {
    expect(render([lead({ priceRegion: 'SOUTH_AFRICA' })])).toContain('R1,600');
    const html = render([lead({ location: 'Harare, Zimbabwe' })]);
    expect(html).toContain('Africa (outside South Africa)'); expect(html).toContain('Use it');
  });
});
