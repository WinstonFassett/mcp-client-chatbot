"use client";

import { useEffect, useRef, useState } from "react";
import { BoltArtifactData } from "./server";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";

// This is a placeholder component until we fully integrate the bolt components
export function BoltArtifact({ 
  data, 
  onUpdate 
}: { 
  data: BoltArtifactData; 
  onUpdate?: (data: BoltArtifactData) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("editor");
  const [activeFile, setActiveFile] = useState(data.entryFile);
  
  // This will be replaced with actual WebContainer initialization
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);

  // Placeholder for file list
  const fileList = Object.keys(data.files).map(filename => (
    <div 
      key={filename}
      className={`p-2 cursor-pointer ${activeFile === filename ? 'bg-accent' : ''}`}
      onClick={() => setActiveFile(filename)}
    >
      {filename}
    </div>
  ));

  return (
    <Card className="w-full h-[600px] overflow-hidden">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full h-full">
        <div className="flex items-center justify-between border-b px-4">
          <TabsList>
            <TabsTrigger value="editor">Editor</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
            <TabsTrigger value="terminal">Terminal</TabsTrigger>
          </TabsList>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              Run
            </Button>
          </div>
        </div>
        
        <div className="h-[calc(100%-48px)]">
          <TabsContent value="editor" className="h-full m-0 p-0">
            <ResizablePanelGroup direction="horizontal" className="h-full">
              <ResizablePanel defaultSize={20} minSize={15}>
                <div className="h-full overflow-auto p-2 border-r">
                  <div className="font-medium mb-2">Files</div>
                  {fileList}
                </div>
              </ResizablePanel>
              
              <ResizableHandle />
              
              <ResizablePanel defaultSize={80}>
                <div className="h-full p-2 font-mono text-sm overflow-auto">
                  {isLoading ? (
                    <div className="flex items-center justify-center h-full">
                      Loading editor...
                    </div>
                  ) : (
                    <pre>{data.files[activeFile] || 'File not found'}</pre>
                  )}
                </div>
              </ResizablePanel>
            </ResizablePanelGroup>
          </TabsContent>
          
          <TabsContent value="preview" className="h-full m-0 p-0">
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <p>Preview will be implemented here</p>
                <p className="text-sm text-muted-foreground">Using WebContainers</p>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="terminal" className="h-full m-0 p-0">
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <p>Terminal will be implemented here</p>
                <p className="text-sm text-muted-foreground">Using xterm.js</p>
              </div>
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </Card>
  );
}
