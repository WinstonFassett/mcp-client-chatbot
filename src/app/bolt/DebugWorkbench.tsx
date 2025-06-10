'use client';

import React from 'react';
import { ActionRunner } from '@/artifacts/bolt/lib/runtime/action-runner';
import { Workbench } from '@/artifacts/bolt/components/workbench/Workbench.client';

interface DebugWorkbenchProps {
  actionRunner: ActionRunner;
}

export default function DebugWorkbench({ actionRunner }: DebugWorkbenchProps) {
  return (
    <div className="debug-workbench-wrapper border-4 border-yellow-500 p-4 h-full">
      <h3 className="text-white text-xl mb-4">Debug Workbench</h3>
      
      <div className="border-4 border-purple-500 p-4 h-[80%] overflow-visible">
        <Workbench 
          chatStarted={true}
          actionRunner={actionRunner}
          isStreaming={false}
        />
      </div>
    </div>
  );
}
