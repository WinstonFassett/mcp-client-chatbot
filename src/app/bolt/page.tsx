'use client';

import React from 'react';
import BoltWorkbenchWrapper from './BoltWorkbenchWrapper';
import ErrorBoundary from './ErrorBoundary';

export default function BoltPage() {
  return (
    <ErrorBoundary>
      <BoltWorkbenchWrapper />
    </ErrorBoundary>
  );
}
