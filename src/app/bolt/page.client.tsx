'use client';

import React, { useState } from 'react';
import { Workbench } from '@/artifacts/bolt/components/workbench/Workbench.client';
import { ActionRunner } from '@/artifacts/bolt/lib/runtime/action-runner';

export default function BoltClientPage() {
  const [actionRunner] = useState(() => new ActionRunner());
  const [chatStarted] = useState(true);

  return (
    <div className="h-screen w-screen">
      <Workbench 
        chatStarted={chatStarted}
        actionRunner={actionRunner}
        isStreaming={false}
      />
    </div>
  );
}
