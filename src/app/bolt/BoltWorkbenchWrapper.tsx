'use client';

import React, { useState, useEffect, useRef, Component, ErrorInfo } from 'react';
import { ActionRunner } from '@/artifacts/bolt/lib/runtime/action-runner';
import DebugWorkbench from './DebugWorkbench';
import { WebContainer } from '@webcontainer/api';
import { useGit } from '@/artifacts/bolt/lib/hooks/useGit';
import { workbenchStore } from '@/artifacts/bolt/lib/stores/workbench';
import { webcontainer } from '@/artifacts/bolt/lib/webcontainer';
import { WORK_DIR_NAME } from '@/artifacts/bolt/utils/constants';
import { generateId, type Message } from 'ai';
import { escapeBoltTags, detectProjectCommands, createCommandsMessage } from '@/artifacts/bolt/utils/projectCommands';

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
  // Use refs to track initialization state across renders
  const didInitWebContainerRef = useRef(false);
  const didTriggerBootstrapRef = useRef(false);
  const [filesReady, setFilesReady] = useState(false);
  const [setupRunning, setSetupRunning] = useState(false);
  const [setupError, setSetupError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewReady, setPreviewReady] = useState(false);
  const { ready: gitReady, gitClone } = useGit();
  // Commented out for now until chat integration is needed
  // const { ready: historyReady, importChat } = useChatHistory();
  const historyReady = true; // Stub value
  const importChat = async () => { console.log('Chat import stubbed'); }; // Stub function
  const bootstrapRef = useRef(false);
  const initRef = useRef(false);

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
  
  // Initialize the component
  useEffect(() => {
    // Only run once
    if (bootstrapRef.current) return;
    bootstrapRef.current = true;
  }, []);

  // Initialize the WebContainer and ActionRunner
  useEffect(() => {
    let isMounted = true;
    
    const initWebContainer = async () => {
      // Prevent double initialization in development mode
      if (initRef.current) return;
      initRef.current = true;
      
      try {
        setDebugInfo('Starting WebContainer initialization...');
        
        // Don't create a dummy terminal here, it will be set by TerminalTabs
        const dummyTerminal = {
          write: (data: string) => console.log('Terminal output:', data),
          clear: () => console.log('Terminal cleared'),
          onData: () => {},
          cols: 80,
          rows: 15,
        };

        setDebugInfo('Creating ActionRunner...');
        const runner = new ActionRunner(
          webcontainer,
          dummyTerminal,
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

        if (isMounted) {
          workbenchStore.setActionRunner(runner);
          setActionRunner(runner);
          setIsLoading(false);
          setDebugInfo('Ready to render Workbench');
        }
      } catch (err) {
        console.error('Failed to initialize WebContainer:', err);
        if (isMounted) {
          setError('Failed to initialize WebContainer. Please try refreshing the page.');
          setIsLoading(false);
        }
      }
    };

    initWebContainer();

    return () => {
      isMounted = false;
    };
  }, []);

  // Initialize the WebContainer once
  useEffect(() => {
    // Skip if we've already initialized
    if (didInitWebContainerRef.current) {
      return;
    }
    
    didInitWebContainerRef.current = true;
    console.log('Initializing WebContainer (should happen only once)...');
    
    // The webcontainer is already a Promise that resolves when ready
    // We don't need to do anything here as it's initialized in the module
    
    // Log when the WebContainer is ready for debugging purposes
    webcontainer.then(() => {
      console.log('WebContainer promise resolved');
    }).catch(error => {
      console.error('WebContainer initialization failed:', error);
    });
  }, []); // Empty dependency array ensures this runs only once

  // Define the bootstrap function outside of useEffect
  const bootstrapProject = async () => {
      console.log('Starting project bootstrap...');
      setSetupRunning(true);

      // Ensure WebContainer is initialized properly
      console.log('Waiting for WebContainer to be ready...');
      let webcontainerInstance;
      try {
        // webcontainer is a Promise<WebContainer> that resolves when the container is booted
        // We don't call boot() on it - it's already booting when the module is loaded
        webcontainerInstance = await webcontainer;
        console.log('WebContainer initialized successfully');
        
        if (!webcontainerInstance) {
          setSetupRunning(false);
          throw new Error('WebContainer initialization failed');
        }
        
        // Set up server-ready event listener
        webcontainerInstance.on('server-ready', (port, url) => {
          console.log(`Server ready event received! Port: ${port}, URL: ${url}`);
          setPreviewUrl(url);
          setPreviewReady(true);
          
          // Now that the server is ready, switch to preview tab
          workbenchStore.currentView.set('preview');
        });
        
        // Chat import would happen here
        // For now, we'll just clone a sample repo
        const repoUrl = 'https://github.com/xKevIsDev/bolt-nextjs-shadcn-template.git';
        console.log(`Cloning ${repoUrl}...`);
        
        // Clone the repository
        await gitClone(repoUrl);
        console.log('Repository cloned successfully');
        
        // IMPORTANT: Show the workbench immediately after git clone
        // This matches bolt.diy's behavior
        setFilesReady(true);
        
        // Make sure the code tab is active initially
        workbenchStore.currentView.set('code');
        // Show the workbench
        workbenchStore.showWorkbench.set(true);
        
        // Get the actual files from the cloned repo
        const fileSystem = webcontainerInstance.fs;
        if (!fileSystem) {
          throw new Error("WebContainer filesystem not available");
        }
        
        // List files in the root directory
        console.log('Reading directory contents...');
        const rootDir = await fileSystem.readdir('/', { withFileTypes: true });
        console.log('Root directory contents:', rootDir);

        // Collect file contents
        const fileContents = await Promise.all(
          rootDir
            .filter(entry => !entry.isDirectory())
            .map(async (entry) => {
              try {
                const content = await fileSystem.readFile(`/${entry.name}`, 'utf-8');
                return {
                  path: entry.name,
                  content
                };
              } catch (error) {
                console.error(`Error reading file ${entry.name}:`, error);
                return null;
              }
            })
        );
        
        // Filter out nulls from failed reads
        const validFiles = fileContents.filter((file): file is {path: string, content: string} => file !== null);
        
        console.log('Files collected for project commands detection:', validFiles.length);
        
        // Detect project commands based on file contents
        const projectCommands = await detectProjectCommands(validFiles);
        console.log('Detected project commands:', projectCommands);
        
        // Make terminal visible before running commands
        workbenchStore.toggleTerminal(true);
        
        // Wait a moment for the terminal to be fully visible and initialized
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Run setup command in the visible terminal
        if (projectCommands.setupCommand) {
          console.log(`Running setup command: ${projectCommands.setupCommand}`);
          
          // IMPORTANT: Pass the entire command as a single string to runCommand
          // Do NOT split it into command and args
          const setupResult = await runCommand(projectCommands.setupCommand);
          
          if (setupResult.exitCode !== 0) {
            throw new Error(`Setup command failed with exit code ${setupResult.exitCode}: ${setupResult.output}`);
          }
          
          console.log('Setup command completed successfully');
        }
        
        // Run start command in the visible terminal
        if (projectCommands.startCommand) {
          console.log(`Running start command: ${projectCommands.startCommand}`);
          
          try {
            // IMPORTANT: Pass the entire command as a single string to runCommand
            // Do NOT split it into command and args
            const startResult = await runCommand(projectCommands.startCommand);
            
            if (startResult.exitCode !== 0) {
              throw new Error(`Start command failed with exit code ${startResult.exitCode}: ${startResult.output}`);
            }
            
            console.log('Start command initiated successfully');
            // Only switch to preview tab after server is ready
            // This happens in the server-ready event handler
          } catch (error) {
            console.error('Error running start command:', error);
            setSetupError(`Error running start command: ${error instanceof Error ? error.message : String(error)}`);
            setSetupRunning(false);
            return;
          }
        }
        
        // Setup is complete
        setSetupRunning(false);
        
      } catch (error) {
        console.error('Error bootstrapping project:', error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        
        // Reset state on error
        setSetupRunning(false);
        setSetupError(errorMessage);
        
        // Display a more user-friendly error in the UI
        setError(`Failed to bootstrap project: ${errorMessage}`);
      }
  };
  
  // Bootstrap the project when WebContainer and Git are ready
  useEffect(() => {
    // Skip if we've already triggered bootstrap
    if (didTriggerBootstrapRef.current) {
      return;
    }
    
    // Wait for all dependencies to be ready
    if (!gitReady || !historyReady) {
      return;
    }
    
    console.log('All dependencies ready, starting bootstrap process');
    
    // Mark as triggered to prevent duplicate runs
    didTriggerBootstrapRef.current = true;
    
    // Terminal is already visible in the UI
    
    // Start the bootstrap process
    bootstrapProject().catch(error => {
      console.error('Bootstrap process failed:', error);
      setError(`Bootstrap process failed: ${error instanceof Error ? error.message : String(error)}`);
    });
    
    // No need for cleanup as we're using refs to track state
  }, [gitReady, historyReady]);
  
  // REMOVED: The terminal initialization effect that was causing an infinite loop
  // We'll rely on the terminal being properly initialized by TerminalTabs.tsx

  // REMOVED the setupRunning check that was blocking the workbench from showing
  // We want to show the workbench as soon as files are ready, even if setup is still running

  if (setupError) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-gray-900 text-white">
        <div className="text-center text-red-500">
          <div className="text-2xl font-bold mb-4">Error during setup</div>
          <div className="mb-4">{setupError}</div>
          <div className="text-sm text-gray-400 mt-4">{debugInfo}</div>
        </div>
      </div>
    );
  }

  if (!filesReady) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-gray-900 text-white">
        <div className="text-center">
          <div className="text-2xl font-bold mb-4">Loading project files...</div>
          <div className="animate-pulse mb-4">Cloning repository and preparing environment</div>
          <div className="text-sm text-gray-400 mt-4">{debugInfo}</div>
        </div>
      </div>
    );
  }
  
  // Just render the workbench when ready, no split view or error blocking
  if (!isLoading && !error && actionRunner) {
    return (
      <div className="h-screen w-screen flex flex-col bg-gray-900 text-white">
        <div className="p-4 bg-gray-800 border-b border-gray-700 flex justify-between items-center">
          <h1 className="text-xl font-bold">Bolt IDE</h1>
          <div className="flex items-center space-x-2">
            {previewUrl && (
              <a 
                href={previewUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm"
              >
                Open preview in new tab
              </a>
            )}
          </div>
        </div>
        
        {/* Just show the workbench, terminal will be shown automatically */}
        <div className="flex-1 overflow-auto">
          <DebugWorkbench actionRunner={actionRunner} />
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
      </div>
    );
  }

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

  return (
    <div className="h-screen w-screen relative" style={{ background: '#222', minHeight: '100vh' }}>
      <div className="h-[95vh] w-[95vw] m-auto flex flex-col">
        <div className="flex-1 overflow-visible">
          <DebugWorkbench actionRunner={actionRunner} />
        </div>
      </div>

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
