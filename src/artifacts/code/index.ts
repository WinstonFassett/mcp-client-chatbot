// Client-side artifacts
import { pythonFileArtifact } from './python-file-pyodide/client';
// @ts-ignore - These modules will be created later
import { jsProjectArtifact } from './js-project-sandpack/client';
// @ts-ignore - These modules will be created later
import { htmlFragmentArtifact } from './html-fragment/client';
import { Artifact } from '@/components/create-artifact';
// Import the bolt artifact
import { boltArtifact } from '../bolt/client';

// Server-side handlers
import { simpleCodeDocumentHandler } from "./server";
import { pythonFileDocumentHandler } from "./python-file-pyodide/server";
import { jsProjectDocumentHandler } from "./js-project-sandpack/server";
import { htmlFragmentDocumentHandler } from "./html-fragment/server";
import { boltDocumentHandler } from "../bolt/server-handler";

// Export the simpleCodeArtifact for backward compatibility
export { pythonFileArtifact as simpleCodeArtifact } from './python-file-pyodide/client';

// Detect the appropriate code artifact type based on content and intent
export function detectCodeArtifactType(content: string, intent?: string): string {
  // Normalize intent for easier matching
  const normalizedIntent = intent?.toLowerCase() || '';
  
  // Check for bolt project indicators - this should be the preferred option for Node.js projects
  if (
    normalizedIntent.includes('bolt') ||
    normalizedIntent.includes('webcontainer') ||
    normalizedIntent.includes('node') ||
    normalizedIntent.includes('express') ||
    normalizedIntent.includes('terminal') ||
    normalizedIntent.includes('full stack') ||
    normalizedIntent.includes('server') ||
    normalizedIntent.includes('api') ||
    content.includes('const express = require') ||
    content.includes('import express from') ||
    content.includes('npm init') ||
    content.includes('package.json') && content.includes('express')
  ) {
    return 'js-project-bolt';
  }
  
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
    case 'js-project-bolt':
      return boltArtifact;
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
  'html-fragment': htmlFragmentArtifact,
  'js-project-bolt': boltArtifact
};

// Export all document handlers
export const documentHandlers = {
  'simple-code-block': simpleCodeDocumentHandler,
  'python-file-pyodide': pythonFileDocumentHandler,
  'js-project-sandpack': jsProjectDocumentHandler,
  'html-fragment': htmlFragmentDocumentHandler,
  'js-project-bolt': boltDocumentHandler
};
