// Client-side artifacts
import { pythonFileArtifact } from './python-file-pyodide/client';
// @ts-ignore - These modules will be created later
import { jsProjectArtifact } from './js-project-sandpack/client';
// @ts-ignore - These modules will be created later
import { htmlFragmentArtifact } from './html-fragment/client';
import { Artifact } from '@/components/create-artifact';

// Server-side handlers
import { codeDocumentHandler } from "./server";
import { pythonFileDocumentHandler } from "./python-file-pyodide/server";
import { jsProjectDocumentHandler } from "./js-project-sandpack/server";
import { htmlFragmentDocumentHandler } from "./html-fragment/server";

// Legacy export for backward compatibility
export { pythonFileArtifact as codeArtifact } from './python-file-pyodide/client';

// Detect the appropriate code artifact type based on content and intent
export function detectCodeArtifactType(content: string, intent?: string): string {
  // Check for multi-file JavaScript project indicators
  if (content.includes('---filepath:') || 
      (intent && intent.toLowerCase().includes('javascript project'))) {
    return 'js-project-sandpack';
  }
  
  // Check for HTML fragment indicators
  if (content.includes('<!DOCTYPE html>') || 
      content.includes('<html>') || 
      content.includes('<body>') ||
      (content.includes('<style>') && content.includes('<script>')) ||
      (intent && intent.toLowerCase().includes('html'))) {
    return 'html-fragment';
  }
  
  // Default to python if we detect python imports or syntax
  if (content.includes('import numpy') || 
      content.includes('import pandas') ||
      content.includes('def ') ||
      content.includes('print(') ||
      content.includes('matplotlib')) {
    return 'python-file-pyodide';
  }
  
  // Default to python-file as fallback for backward compatibility
  return 'python-file-pyodide';
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

// Export all artifact types
export const codeArtifacts = {
  'python-file-pyodide': pythonFileArtifact,
  'js-project-sandpack': jsProjectArtifact,
  'html-fragment': htmlFragmentArtifact
};

// Export all document handlers
export const serverHandlers = {
  'python-file-pyodide': pythonFileDocumentHandler,
  'js-project-sandpack': jsProjectDocumentHandler,
  'html-fragment': htmlFragmentDocumentHandler
};
