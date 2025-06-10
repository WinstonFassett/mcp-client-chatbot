"use client";

import { WebContainer } from '@webcontainer/api';
import type { FileSystemTree } from '@webcontainer/api';

// Context to track WebContainer state
interface WebContainerContext {
  loaded: boolean;
}

// Module-level singleton for WebContainer
// This is the key to preventing React re-render issues
export let webcontainerPromise: Promise<WebContainer> | null = null;
export const webcontainerContext: WebContainerContext = {
  loaded: false
};

// Initialize the WebContainer immediately on module load (client-side only)
if (typeof window !== 'undefined') {
  // Only initialize once
  if (!webcontainerPromise) {
    console.log('Initializing WebContainer at module level');
    
    webcontainerPromise = (async () => {
      try {
        // Import WebContainer API
        const { WebContainer } = await import('@webcontainer/api');
        
        // Boot with credentialless COEP option
        const instance = await WebContainer.boot({
          coep: 'credentialless',
          forwardPreviewErrors: true
        });
        
        console.log('WebContainer booted successfully!');
        webcontainerContext.loaded = true;
        
        return instance;
      } catch (error) {
        console.error('Failed to boot WebContainer:', error);
        throw error;
      }
    })();
  }
}

// Simple getter that doesn't create new instances
export async function getWebContainerInstance(): Promise<WebContainer> {
  if (!webcontainerPromise) {
    throw new Error('WebContainer is not initialized or not supported in this environment');
  }
  
  return webcontainerPromise;
}

export async function mountFiles(files: Record<string, string>): Promise<void> {
  const webcontainer = await getWebContainerInstance();
  
  try {
    // Convert files to proper FileSystemTree format
    const fileTree: Record<string, any> = {};
    
    // Process files
    Object.entries(files).forEach(([path, content]) => {
      // Normalize path (remove leading slash if present)
      const normalizedPath = path.startsWith('/') ? path.substring(1) : path;
      fileTree[normalizedPath] = { file: { contents: content } };
    });
    
    // Mount all files at once
    console.log('Mounting files:', Object.keys(fileTree));
    await webcontainer.mount(fileTree);
    console.log('All files mounted successfully');
  } catch (error) {
    console.error('Error mounting files:', error);
    throw error;
  }
}

export async function runCommand(command: string, args: string[] = []): Promise<{ exitCode: number; output: string }> {
  const webcontainer = await getWebContainerInstance();
  
  // Start the process
  const process = await webcontainer.spawn(command, args);
  
  // Collect output
  let output = '';
  process.output.pipeTo(
    new WritableStream({
      write(data) {
        output += data;
      }
    })
  );
  
  // Wait for process to exit
  const exitCode = await process.exit;
  
  return { exitCode, output };
}

export async function installDependencies(): Promise<{ success: boolean; output: string }> {
  try {
    const { exitCode, output } = await runCommand('npm', ['install']);
    return { success: exitCode === 0, output };
  } catch (error) {
    console.error('Failed to install dependencies:', error);
    return { success: false, output: String(error) };
  }
}

// Track if the server is already running to prevent duplicate starts
let isServerRunning = false;
let serverUrl = '';

export async function startDevServer(): Promise<{ url: string; output: string }> {
  // If server is already running, return the existing URL
  if (isServerRunning && serverUrl) {
    console.log('Dev server already running at:', serverUrl);
    return { url: serverUrl, output: 'Server already running' };
  }
  
  const webcontainer = await getWebContainerInstance();
  
  return new Promise(async (resolve, reject) => {
    // Listen for server-ready event
    const onServerReady = (port: number, url: string) => {
      console.log('Server ready on port:', port, 'URL:', url);
      serverUrl = url;
      isServerRunning = true;
      // Remove the event listener to prevent memory leaks
      (webcontainer as any).removeListener('server-ready', onServerReady);
      resolve({ url: serverUrl, output: 'Server started successfully' });
    };

    // Add the event listener
    (webcontainer as any).on('server-ready', onServerReady);

    try {
      // Check if package.json exists and has a start script
      const packageJsonContent = await webcontainer.fs.readFile('package.json', 'utf-8');
      const packageJson = JSON.parse(packageJsonContent);
      
      // Determine which script to run
      const command = 'npm';
      let args = ['start'];
      
      if (packageJson.scripts) {
        if (packageJson.scripts.dev) {
          args = ['run', 'dev'];
        } else if (packageJson.scripts.serve) {
          args = ['run', 'serve'];
        }
      }
      
      console.log(`Starting dev server with command: ${command} ${args.join(' ')}`);
      
      // Start the server
      const serverProcess = await webcontainer.spawn(command, args);
      
      // Collect output
      const outputChunks: string[] = [];
      
      serverProcess.output.pipeTo(
        new WritableStream({
          write(data) {
            outputChunks.push(data);
            console.log(data); // Log server output in real-time
          }
        })
      );
      
      // Set up error handling
      serverProcess.exit.then(exitCode => {
        if (exitCode !== 0) {
          const error = new Error(`Server process exited with code ${exitCode}`);
          console.error(error.message);
          (webcontainer as any).removeListener('server-ready', onServerReady);
          reject(error);
        }
      });
      
      // Set a timeout in case the server doesn't start
      const timeout = setTimeout(() => {
        (webcontainer as any).removeListener('server-ready', onServerReady);
        reject(new Error('Server start timed out after 30 seconds'));
      }, 30000);
      
      // Clean up the timeout if the server starts successfully
      (webcontainer as any).once('server-ready', () => {
        clearTimeout(timeout);
      });
      
    } catch (error) {
      console.error('Failed to start dev server:', error);
      (webcontainer as any).removeListener('server-ready', onServerReady);
      reject(error);
    }
  });
}

export async function readFile(path: string): Promise<string> {
  const webcontainer = await getWebContainerInstance();
  return webcontainer.fs.readFile(path, 'utf-8');
}

export async function writeFile(path: string, content: string): Promise<void> {
  const webcontainer = await getWebContainerInstance();
  await webcontainer.fs.writeFile(path, content);
}

export async function listFiles(path: string = '/'): Promise<string[]> {
  const webcontainer = await getWebContainerInstance();
  return webcontainer.fs.readdir(path);
}
