"use client";

import { WebContainer } from '@webcontainer/api';

// Singleton pattern for WebContainer instance
let webcontainerInstance: WebContainer | null = null;
let isWebContainerSupported = true;

// Check if the environment supports cross-origin isolation
export function isCrossOriginIsolated(): boolean {
  if (typeof window === 'undefined') return false;
  return !!(window.crossOriginIsolated);
}

export async function getWebContainerInstance(): Promise<WebContainer> {
  if (!isWebContainerSupported) {
    throw new Error('WebContainer is not supported in this environment. Cross-origin isolation is required.');
  }
  
  if (webcontainerInstance) {
    return webcontainerInstance;
  }
  
  // Check for cross-origin isolation
  if (!isCrossOriginIsolated()) {
    isWebContainerSupported = false;
    throw new Error(
      'WebContainer requires cross-origin isolation. ' +
      'The server needs to send the following headers: ' +
      'Cross-Origin-Opener-Policy: same-origin, ' +
      'Cross-Origin-Embedder-Policy: require-corp'
    );
  }
  
  try {
    // Dynamically import WebContainer API to avoid SSR issues
    const { WebContainer } = await import('@webcontainer/api');
    webcontainerInstance = await WebContainer.boot();
    return webcontainerInstance;
  } catch (error) {
    console.error('Failed to boot WebContainer:', error);
    isWebContainerSupported = false;
    throw error;
  }
}

export async function mountFiles(files: Record<string, string>): Promise<void> {
  const webcontainer = await getWebContainerInstance();
  
  // Convert string content to file entries for WebContainer
  const fileEntries: Record<string, any> = {};
  
  for (const [path, content] of Object.entries(files)) {
    // Skip the leading slash if present
    const normalizedPath = path.startsWith('/') ? path.substring(1) : path;
    
    // Handle directory creation
    const parts = normalizedPath.split('/');
    let currentPath = '';
    
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      if (part) {
        currentPath = currentPath ? `${currentPath}/${part}` : part;
        fileEntries[currentPath] = { directory: {} };
      }
    }
    
    // Add file content
    fileEntries[normalizedPath] = { file: { contents: content } };
  }
  
  // Mount the file system
  await webcontainer.mount(fileEntries);
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
    const packageJsonContent = await webcontainer.fs.readFile('/package.json', 'utf-8');
    const packageJson = JSON.parse(packageJsonContent);
    
    // Determine which script to run
    let command = 'npm';
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
        }
      })
    );
    
    // Wait for server to be ready - default port for most dev servers
    // TypeScript definition fix: WebContainer.waitForPort is available at runtime
    // but might not be in the type definitions
    let url = '';
    try {
      // Try with type assertion as a workaround
      url = await (webcontainer as any).waitForPort(3000);
    } catch (portError) {
      console.warn('Could not wait for port 3000:', portError);
      // Fallback to a generic URL
      url = 'http://localhost:3000';
    }
    
    return { url, output };
  } catch (error) {
    console.error('Failed to start dev server:', error);
    throw error;
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
