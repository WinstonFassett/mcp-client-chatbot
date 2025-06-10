'use client';

import React from 'react';
import { GitUrlImport } from '@/artifacts/bolt/components/git/GitUrlImport.client';
import BackgroundRays from '@/artifacts/bolt/components/ui/BackgroundRays';
import { Header } from '@/artifacts/bolt/components/header/Header';

export default function GitPage() {
  return (
    <div className="flex flex-col h-full w-full bg-bolt-elements-background-depth-1">
      <BackgroundRays />
      <Header />
      <GitUrlImport />
    </div>
  );
}
