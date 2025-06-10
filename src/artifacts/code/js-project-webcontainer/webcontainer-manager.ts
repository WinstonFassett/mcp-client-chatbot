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

export async function startDevServer(): Promise<{ url: string; output: string }> {
  const webcontainer = await getWebContainerInstance();
  
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
    
    // Start the server
    const serverProcess = await webcontainer.spawn(command, args);
    
    // Collect output
    let output = '';
    serverProcess.output.pipeTo(
      new WritableStream({
        write(data) {
          output += data;
          console.log(data); // Log server output in real-time
        }
      })
    );
    
    // For dev server, just return a standard URL
    // WebContainer doesn't have waitForPort in its type definitions
    const url = 'http://localhost:3000';
    
    return { url, output };
  } catch (error) {
    console.error('Failed to start dev server:', error);
    return { url: '', output: String(error) };
  }
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
