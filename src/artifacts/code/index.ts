// Client-side artifacts
import { pythonFileArtifact } from './python-file-pyodide/client';
// @ts-ignore - These modules will be created later
import { jsProjectArtifact } from './js-project-sandpack/client';
// @ts-ignore - These modules will be created later
import { htmlFragmentArtifact } from './html-fragment/client';
import { Artifact } from '@/components/create-artifact';

// Server-side handlers
import { simpleCodeDocumentHandler } from "./server";
import { pythonFileDocumentHandler } from "./python-file-pyodide/server";
import { jsProjectDocumentHandler } from "./js-project-sandpack/server";
import { htmlFragmentDocumentHandler } from "./html-fragment/server";

// Export the simpleCodeArtifact for backward compatibility
export { pythonFileArtifact as simpleCodeArtifact } from './python-file-pyodide/client';

// Detect the appropriate code artifact type based on content and intent
export function detectCodeArtifactType(content: string, intent?: string): string {
  // Normalize intent for easier matching
  const normalizedIntent = intent?.toLowerCase() || '';
  
  // Check for TypeScript/JavaScript project indicators
  if (
    content.includes('---filepath:') || 
    content.includes('package.json') ||
    normalizedIntent.includes('typescript project') ||
    normalizedIntent.includes('javascript project') ||
    normalizedIntent.includes('react project') ||
    normalizedIntent.includes('vue project') ||
    normalizedIntent.includes('next.js') ||
    normalizedIntent.includes('sandpack')
  ) {
    return 'js-project-sandpack';
  }
  
  // Check for HTML fragment indicators
  if (
    content.includes('<!DOCTYPE html>') || 
    content.includes('<html>') || 
    content.includes('<body>') ||
    (content.includes('<style>') && content.includes('<script>')) ||
    normalizedIntent.includes('html') ||
    normalizedIntent.includes('web page') ||
    normalizedIntent.includes('css') ||
    normalizedIntent.includes('webpage')
  ) {
    return 'html-fragment';
  }
  
  // Check for Python code indicators
  if (
    // Python imports
    content.includes('import ') || 
    content.includes('from ') ||
    // Python syntax
    content.includes('def ') || 
    content.includes('class ') || 
    content.includes('print(') || 
    content.includes('if __name__') ||
    // Python libraries
    normalizedIntent.includes('python') ||
    normalizedIntent.includes('numpy') ||
    normalizedIntent.includes('pandas') ||
    normalizedIntent.includes('matplotlib') ||
    normalizedIntent.includes('tensorflow') ||
    normalizedIntent.includes('pytorch') ||
    normalizedIntent.includes('scikit')
  ) {
    return 'python-file-pyodide';
  }
  
  // Default to simple code block for any other code
  return 'simple-code-block';
}

// Get the appropriate artifact based on type
export function getCodeArtifact(type: string): Artifact<any, any> {
  switch (type) {
    case 'js-project-sandpack':
      return jsProjectArtifact;
    case 'html-fragment':
      return htmlFragmentArtifact;
    case 'python-file-pyodide':
    default:
      return pythonFileArtifact;
  }
}

// Export all client-side artifacts
export const clientArtifacts = {
  'simple-code-block': pythonFileArtifact, // Fallback for backward compatibility
  'python-file-pyodide': pythonFileArtifact,
  'js-project-sandpack': jsProjectArtifact,
  'html-fragment': htmlFragmentArtifact
};

// Export all document handlers
export const documentHandlers = {
  'simple-code-block': simpleCodeDocumentHandler,
  'python-file-pyodide': pythonFileDocumentHandler,
  'js-project-sandpack': jsProjectDocumentHandler,
  'html-fragment': htmlFragmentDocumentHandler
};
