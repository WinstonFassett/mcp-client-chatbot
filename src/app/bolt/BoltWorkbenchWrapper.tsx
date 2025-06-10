'use client';

import React, { useState, useEffect, Component, ErrorInfo } from 'react';
import { ActionRunner } from '@/artifacts/bolt/lib/runtime/action-runner';
import DebugWorkbench from './DebugWorkbench';
import { webcontainer } from '@/artifacts/bolt/lib/webcontainer';
import { WORK_DIR_NAME } from '@/artifacts/bolt/utils/constants';
import { useGit } from '@/artifacts/bolt/lib/hooks/useGit';
import { generateId, type Message } from 'ai';
import { escapeBoltTags } from '@/artifacts/bolt/utils/projectCommands';
import { useChatHistory } from '@/artifacts/bolt/lib/persistence';

/**
 * This component wraps the Bolt Workbench and handles all the browser-specific initialization
 * It ensures that browser-only APIs are only accessed in the client
 */
export default function BoltWorkbenchWrapper() {
  const [isLoading, setIsLoading] = useState(true);
  const [actionRunner, setActionRunner] = useState<ActionRunner | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string>('Initializing...');
  const [showDebug, setShowDebug] = useState(false);
  const [bootstrapped, setBootstrapped] = useState(false);
  const { ready: gitReady, gitClone } = useGit();
  const { ready: historyReady, importChat } = useChatHistory();
  
  // Add a debug overlay that can be toggled with a keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'D' && e.ctrlKey) {
        setShowDebug(prev => !prev);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
  
  // Initialize the WebContainer and ActionRunner
  useEffect(() => {
    let isMounted = true;
    
    const initWebContainer = async () => {
      try {
        setDebugInfo('Starting WebContainer initialization...');
        console.log('Starting WebContainer initialization...');
        
        // Use the existing webcontainer module from Bolt
        // This is already properly initialized with browser checks
        setDebugInfo('Creating shell terminal...');
        
        // Create a dummy shell terminal function for now
        // This will be replaced by the actual terminal when attached
        const dummyShellTerminal = () => {
          return {
            write: (data: string) => console.log('Terminal output:', data),
            clear: () => console.log('Terminal cleared'),
            // Add other required methods
          } as any;
        };
        
        setDebugInfo('Creating ActionRunner...');
        console.log('Creating ActionRunner with webcontainer:', webcontainer);
        
        // Create the ActionRunner with the WebContainer promise
        const runner = new ActionRunner(
          webcontainer, // Use the pre-configured webcontainer promise
          dummyShellTerminal,
          (alert) => {
            console.log('Action alert:', alert);
            setDebugInfo(`Action alert: ${JSON.stringify(alert)}`);
          },
          (alert) => {
            console.log('Supabase alert:', alert);
            setDebugInfo(`Supabase alert: ${JSON.stringify(alert)}`);
          },
          (alert) => {
            console.log('Deploy alert:', alert);
            setDebugInfo(`Deploy alert: ${JSON.stringify(alert)}`);
          }
        );
        
        setDebugInfo('ActionRunner created successfully');
        console.log('ActionRunner created successfully:', runner);
        
        if (isMounted) {
          setActionRunner(runner);
          setIsLoading(false);
          setDebugInfo('Ready to render Workbench');
        }
      } catch (err) {
        console.error('Failed to initialize WebContainer:', err);
        setDebugInfo(`Error: ${err instanceof Error ? err.message : String(err)}`);
        if (isMounted) {
          setError(`Failed to initialize WebContainer: ${err instanceof Error ? err.message : String(err)}`);
          setIsLoading(false);
        }
      }
    };
    
    initWebContainer();
    
    return () => {
      isMounted = false;
    };
  }, []);
  
  if (isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-gray-900 text-white">
        <div className="text-center">
          <div className="text-2xl font-bold mb-4">Loading Bolt IDE...</div>
          <div className="animate-pulse mb-4">Initializing WebContainer and dependencies</div>
          <div className="text-sm text-gray-400 mt-4">{debugInfo}</div>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-gray-900 text-white">
        <div className="text-center text-red-500">
          <div className="text-2xl font-bold mb-4">Error</div>
          <div className="mb-4">{error}</div>
          <div className="text-sm text-gray-400 mt-4">{debugInfo}</div>
        </div>
      </div>
    );
  }
  
  if (!actionRunner) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-gray-900 text-white">
        <div className="text-center text-yellow-500">
          <div className="text-2xl font-bold mb-4">Unexpected Error</div>
          <div className="mb-4">ActionRunner failed to initialize but no error was reported</div>
          <div className="text-sm text-gray-400 mt-4">{debugInfo}</div>
        </div>
      </div>
    );
  }
  

  
  // Bootstrap a project automatically for testing
  useEffect(() => {
    if (!actionRunner || !gitReady || !historyReady || bootstrapped) {
      return;
    }

    const bootstrapProject = async () => {
      try {
        setDebugInfo('Bootstrapping project for testing...');
        console.log('Bootstrapping project for testing...');
        
        // Use the Next.js with shadcn/ui template
        const repoUrl = 'https://github.com/xKevIsDev/bolt-nextjs-shadcn-template.git';
        
        setDebugInfo(`Cloning repository: ${repoUrl}`);
        const { workdir, data } = await gitClone(repoUrl);
        
        // Create messages for the chat history
        const textDecoder = new TextDecoder('utf-8');
        const filePaths = Object.keys(data);
        
        const fileContents = filePaths
          .map((filePath) => {
            const { data: content, encoding } = data[filePath];
            return {
              path: filePath,
              content:
                encoding === 'utf8' ? content : content instanceof Uint8Array ? textDecoder.decode(content) : '',
            };
          })
          .filter((f) => f.content);
        
        const filesMessage: Message = {
          role: 'assistant',
          content: `Cloning the repo ${repoUrl} into ${workdir}
<boltArtifact id="imported-files" title="Git Cloned Files" type="bundled">
${fileContents
  .map(
    (file) =>
      `<boltAction type="file" filePath="${file.path}">
${escapeBoltTags(file.content)}
</boltAction>`,
  )
  .join('\n')}
</boltArtifact>`,
          id: generateId(),
          createdAt: new Date(),
        };
        
        // Import the chat with the cloned files
        await importChat(`Test Project: Next.js with shadcn/ui`, [filesMessage], { gitUrl: repoUrl });
        
        setDebugInfo('Project bootstrapped successfully');
        setBootstrapped(true);
      } catch (error) {
        console.error('Error bootstrapping project:', error);
        setDebugInfo(`Error bootstrapping project: ${error instanceof Error ? error.message : String(error)}`);
      }
    };
    
    bootstrapProject();
  }, [actionRunner, gitReady, historyReady, bootstrapped, gitClone, importChat]);

  return (
    <div className="h-screen w-screen relative" style={{ background: '#222', minHeight: '100vh' }}>
      {/* Debug container with explicit dimensions */}
      <div className="h-[95vh] w-[95vw] m-auto flex flex-col">
        {/* Workbench with explicit styles */}
        <div className="flex-1 overflow-visible">
          <DebugWorkbench actionRunner={actionRunner} />
        </div>
      </div>
      
      {/* Debug overlay */}
      {showDebug && (
        <div className="absolute bottom-4 right-4 bg-black bg-opacity-80 text-white p-4 rounded-md z-50 max-w-md">
          <h3 className="font-bold mb-2">Debug Info</h3>
          <pre className="text-xs whitespace-pre-wrap">{debugInfo}</pre>
        </div>
      )}
      
      <div className="fixed top-0 left-0 p-2 text-white text-xs bg-black bg-opacity-50 z-50">
        Press Ctrl+D for debug info
      </div>
      
      <div className="absolute bottom-0 left-0 p-2 text-white text-xs bg-black bg-opacity-50 z-50">
        Press Ctrl+D for debug info
      </div>
    </div>
  );
}
