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
        {/* Always render the Workbench component to maintain consistent hooks order */}
        <Workbench 
          chatStarted={true} // Always true to ensure component renders
          actionRunner={actionRunner}
          isStreaming={false}
        />
      </div>
    </div>
  );
}
