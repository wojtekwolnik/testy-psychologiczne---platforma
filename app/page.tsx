'use client';

import React, { Suspense } from 'react';
import ClientCodeEntry from '@/components/ClientCodeEntry';

export default function Home() {
  return (
    <main>
      <Suspense fallback={<div className="min-h-screen bg-background" />}>
        <ClientCodeEntry />
      </Suspense>
    </main>
  );
}
