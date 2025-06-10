'use client';

import React, { useState, useEffect } from 'react';
import { Workbench } from '@/artifacts/bolt/components/workbench/Workbench.client';
import { ActionRunner } from '@/artifacts/bolt/lib/runtime/action-runner';
import { webcontainer } from '@/artifacts/bolt/lib/webcontainer';
import { WORK_DIR_NAME } from '@/artifacts/bolt/utils/constants';

/**
 * This component wraps the Bolt Workbench and handles all the browser-specific initialization
 * It ensures that browser-only APIs are only accessed in the client
 */
export default function BoltWorkbenchWrapper() {
  const [isLoading, setIsLoading] = useState(true);
  const [actionRunner, setActionRunner] = useState<ActionRunner | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Initialize the WebContainer and ActionRunner
  useEffect(() => {
    let isMounted = true;
    
    const initWebContainer = async () => {
      try {
        // Use the existing webcontainer module from Bolt
        // This is already properly initialized with browser checks
        
        // Create a dummy shell terminal function for now
        // This will be replaced by the actual terminal when attached
        const dummyShellTerminal = () => {
          return {
            write: (data: string) => console.log('Terminal output:', data),
            clear: () => console.log('Terminal cleared'),
            // Add other required methods
          } as any;
        };
        
        // Create the ActionRunner with the WebContainer promise
        const runner = new ActionRunner(
          webcontainer, // Use the pre-configured webcontainer promise
          dummyShellTerminal,
          (alert) => console.log('Action alert:', alert),
          (alert) => console.log('Supabase alert:', alert),
          (alert) => console.log('Deploy alert:', alert)
        );
        
        if (isMounted) {
          setActionRunner(runner);
          setIsLoading(false);
        }
      } catch (err) {
        console.error('Failed to initialize WebContainer:', err);
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
          <div className="animate-pulse">Initializing WebContainer and dependencies</div>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-gray-900 text-white">
        <div className="text-center text-red-500">
          <div className="text-2xl font-bold mb-4">Error</div>
          <div>{error}</div>
        </div>
      </div>
    );
  }
  
  if (!actionRunner) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-gray-900 text-white">
        <div className="text-center text-yellow-500">
          <div className="text-2xl font-bold mb-4">Unexpected Error</div>
          <div>ActionRunner failed to initialize but no error was reported</div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="h-screen w-screen">
      <Workbench 
        chatStarted={true}
        actionRunner={actionRunner}
        isStreaming={false}
      />
    </div>
  );
}
