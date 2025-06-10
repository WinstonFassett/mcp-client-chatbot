"use client";

import { useEffect, useState } from "react";
import { ActionRunner } from "@/artifacts/bolt/lib/runtime/action-runner";
import { Workbench } from "@/artifacts/bolt/components/workbench/Workbench.client";
import { BoltArtifactData } from "@/artifacts/bolt/server";

// Default files are defined in the server-handler.ts

export default function BoltPage() {
  const [actionRunner] = useState(() => new ActionRunner());
  const [chatStarted] = useState(true);

  return (
    <div className="flex flex-col w-full h-screen">
      <Workbench 
        chatStarted={chatStarted} 
        actionRunner={actionRunner} 
        isStreaming={false}
      />
    </div>
  );
}
