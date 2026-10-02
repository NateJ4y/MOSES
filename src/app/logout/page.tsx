'use client';

import { useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function LogoutPage() {
  useEffect(() => {
    const run = async () => {
      const supabase = createClient();
      await supabase.auth.signOut();
      window.location.assign('/login');
    };
    void run();
  }, []);

  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="text-center">
        <div className="text-xs tracking-[0.3em] text-zinc-500">MOSES // COALESCE OS</div>
        <p className="mt-4 text-sm text-zinc-300">TERMINATING SESSION...</p>
      </div>
    </main>
  );
}
