"use client";

import { Artifact } from "./artifact";
import { useArtifactSelector } from "@/hooks/use-artifact";

export function ArtifactWrapper() {
  const isVisible = useArtifactSelector((state) => state.isVisible);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
      <div className="pointer-events-auto max-w-[90vw] max-h-[90vh] w-full h-full">
        <Artifact
          threadId=""
          input=""
          setInput={(_value) => {}}
          status="ready"
          stop={() => { /* no-op */ }}
          append={async () => { /* no-op */ }}
          messages={[]}
          setMessages={() => { /* no-op */ }}
          reload={() => { /* no-op */ }}
          votes={undefined}
          isReadonly={false}
        />
      </div>
    </div>
  );
}
