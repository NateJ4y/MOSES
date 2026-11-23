'use client';

import { App } from '../App';
import { AccessGate } from '@/components/AccessGate';

export default function Page() {
  return (
    <AccessGate>
      <App />
    </AccessGate>
  );
}
