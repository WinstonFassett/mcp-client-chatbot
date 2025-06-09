"use client";

import { Artifact } from "@/components/create-artifact";
import { CodeEditor } from "@/components/code-editor";
import {
  CopyIcon,
  LogsIcon,
  MessageIcon,
  RedoIcon,
  UndoIcon,
} from "@/components/icons";
import { toast } from "sonner";
import { useState, useEffect, useRef } from "react";

// Simple HTML preview component
function HtmlPreview({ html }: { html: string }) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [height, setHeight] = useState<number>(300);

  useEffect(() => {
    if (iframeRef.current) {
      const iframe = iframeRef.current;
      try {
        const doc = iframe.contentDocument || iframe.contentWindow?.document;
        if (doc) {
          doc.open();
          doc.write(html);
          doc.close();
          
          // Adjust height based on content
          const body = doc.body;
          if (body) {
            const newHeight = Math.max(300, body.scrollHeight);
            setHeight(newHeight);
          }
        }
      } catch (error) {
        console.error("Error rendering HTML preview:", error);
      }
    }
  }, [html]);

  return (
    <div className="w-full border dark:border-zinc-700 border-zinc-200 rounded-md overflow-hidden">
      <div className="bg-zinc-100 dark:bg-zinc-800 px-4 py-2 text-sm font-medium border-b dark:border-zinc-700 border-zinc-200">
        Preview
      </div>
      <iframe
        ref={iframeRef}
        title="HTML Preview"
        className="w-full"
        style={{ height, border: 'none' }}
        sandbox="allow-scripts"
      />
    </div>
  );
}

interface Metadata {
  activeTab: 'editor' | 'preview';
}

// @ts-ignore - Using 'code' kind for compatibility
export const htmlFragmentArtifact = new Artifact<"code", Metadata>({
  kind: "code",
  description:
    "HTML/CSS/JS fragment with live preview. Ideal for simple web demos and code snippets.",
  initialize: async ({ setMetadata }) => {
    setMetadata({
      activeTab: 'editor',
    });
  },
  onStreamPart: ({ streamPart, setArtifact }) => {
    if (streamPart.type === "code-delta") {
      setArtifact((draftArtifact) => ({
        ...draftArtifact,
        content: streamPart.content as string,
        isVisible:
          draftArtifact.status === "streaming" &&
          draftArtifact.content.length > 300 &&
          draftArtifact.content.length < 310
            ? true
            : draftArtifact.isVisible,
        status: "streaming",
      }));
    }
  },
  content: ({ content, metadata, setMetadata, ...props }) => {
    const [activeTab, setActiveTab] = useState<'editor' | 'preview'>(metadata?.activeTab || 'editor');
    
    useEffect(() => {
      if (metadata) {
        setMetadata({
          ...metadata,
          activeTab,
        });
      }
    }, [activeTab, metadata, setMetadata]);
    
    return (
      <div className="px-1 w-full">
        <div className="flex border-b dark:border-zinc-700 border-zinc-200 mb-2">
          <button 
            className={`px-4 py-2 ${activeTab === 'editor' ? 'border-b-2 border-blue-500' : ''}`}
            onClick={() => setActiveTab('editor')}
          >
            Code
          </button>
          <button 
            className={`px-4 py-2 ${activeTab === 'preview' ? 'border-b-2 border-blue-500' : ''}`}
            onClick={() => setActiveTab('preview')}
          >
            Preview
          </button>
        </div>
        
        {activeTab === 'editor' ? (
          <div className="px-1">
            <CodeEditor {...props} />
          </div>
        ) : (
          <HtmlPreview html={content} />
        )}
      </div>
    );
  },
  actions: [
    {
      icon: <UndoIcon size={18} />,
      description: "View Previous version",
      onClick: ({ handleVersionChange }) => {
        handleVersionChange("prev");
      },
      isDisabled: ({ currentVersionIndex }) => {
        return currentVersionIndex === 0;
      },
    },
    {
      icon: <RedoIcon size={18} />,
      description: "View Next version",
      onClick: ({ handleVersionChange }) => {
        handleVersionChange("next");
      },
      isDisabled: ({ isCurrentVersion }) => {
        return isCurrentVersion;
      },
    },
    {
      icon: <CopyIcon size={18} />,
      description: "Copy code to clipboard",
      onClick: ({ content }) => {
        navigator.clipboard.writeText(content);
        toast.success("Code copied to clipboard");
      },
    },
  ],
  toolbar: [
    {
      icon: <MessageIcon />,
      description: "Ask about this code",
      onClick: ({ appendMessage }) => {
        appendMessage({
          role: "user",
          content: "Can you explain this code?",
        });
      },
    },
    {
      icon: <LogsIcon />,
      description: "Add logs",
      onClick: ({ appendMessage }) => {
        appendMessage({
          role: "user",
          content: "Can you add logging to this code?",
        });
      },
    },
  ],
});
