'use client';

import React, { Suspense, forwardRef } from 'react';
import dynamic from 'next/dynamic';
import type { TerminalRef } from './Terminal';

// Dynamically import the Terminal component with SSR disabled
const TerminalComponent = dynamic(
  () => import('./Terminal').then(mod => mod.Terminal),
  { ssr: false }
);

// Create a loading placeholder
const TerminalPlaceholder = () => (
  <div className="flex items-center justify-center h-full w-full bg-gray-900 text-white">
    <div className="text-center">
      <div className="animate-pulse">Loading Terminal...</div>
    </div>
  </div>
);

// Create a wrapper component that renders the dynamically imported Terminal
const DynamicTerminal = forwardRef<TerminalRef, any>((props, ref) => {
  return (
    <Suspense fallback={<TerminalPlaceholder />}>
      <TerminalComponent {...props} ref={ref} />
    </Suspense>
  );
});

DynamicTerminal.displayName = 'DynamicTerminal';

export default DynamicTerminal;
