'use client';

import React from 'react';
import { ActionRunner } from '@/artifacts/bolt/lib/runtime/action-runner';
import { Workbench } from '@/artifacts/bolt/components/workbench/Workbench.client';

interface DebugWorkbenchProps {
  actionRunner: ActionRunner;
}

export default function DebugWorkbench({ actionRunner }: DebugWorkbenchProps) {
  return (
    <div className="debug-workbench-wrapper border-4 border-yellow-500 p-4 h-full flex flex-col">
      <h3 className="text-white text-xl mb-4">Debug Workbench</h3>
      
      <div className="flex 1 border-4 border-purple-500 p-4 flex-1 overflow-visible relative">
        {/* CRITICAL: Always set chatStarted=true to maintain consistent hooks order */}
        {/* This prevents the "Rendered more hooks than during the previous render" error */}
        <Workbench 
          chatStarted={true} // MUST be true to ensure consistent hooks rendering
          actionRunner={actionRunner}
          isStreaming={false}
        />
      </div>
    </div>
  );
}
