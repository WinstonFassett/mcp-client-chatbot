'use client';

import React, { Suspense } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import the Terminal component with SSR disabled
const Terminal = dynamic(
  () => import('./Terminal'),
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

// Props type should match the original Terminal component
type TerminalProps = React.ComponentProps<typeof Terminal>;

// Create a wrapper component that renders the dynamically imported Terminal
export default function DynamicTerminal(props: any) {
  return (
    <Suspense fallback={<TerminalPlaceholder />}>
      <Terminal {...props} />
    </Suspense>
  );
}
