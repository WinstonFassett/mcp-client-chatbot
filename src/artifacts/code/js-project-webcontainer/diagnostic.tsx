import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';

export function WebContainerDiagnostic() {
  const [diagnostics, setDiagnostics] = useState<Record<string, boolean | string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function runDiagnostics() {
      const results: Record<string, boolean | string> = {};
      
      // Check if running in browser
      results.isBrowser = typeof window !== 'undefined';
      
      // Check cross-origin isolation status
      results.crossOriginIsolated = typeof window !== 'undefined' && !!window.crossOriginIsolated;
      
      // Check SharedArrayBuffer support
      try {
        results.sharedArrayBufferSupported = typeof SharedArrayBuffer === 'function';
        // Create a small one to verify it actually works
        new SharedArrayBuffer(1);
      } catch (e) {
        results.sharedArrayBufferSupported = false;
        results.sharedArrayBufferError = e instanceof Error ? e.message : String(e);
      }
      
      // Check headers
      try {
        const response = await fetch('/api/check-headers');
        const headers = await response.json();
        results.headers = headers;
      } catch (e) {
        results.headerCheckError = e instanceof Error ? e.message : String(e);
      }
      
      // Check browser
      results.userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown';
      
      // Check if WebContainer API can be imported
      try {
        await import('@webcontainer/api');
        results.webContainerImportSuccess = true;
      } catch (e) {
        results.webContainerImportSuccess = false;
        results.webContainerImportError = e instanceof Error ? e.message : String(e);
      }
      
      setDiagnostics(results);
      setLoading(false);
      
      // Log for easier debugging
      console.log('WebContainer Diagnostics:', results);
    }
    
    runDiagnostics();
  }, []);
  
  if (loading) {
    return <div className="p-4">Running diagnostics...</div>;
  }
  
  const issues: string[] = [];
  
  if (!diagnostics.crossOriginIsolated) {
    issues.push('Cross-Origin Isolation is not enabled. This is required for WebContainers.');
  }
  
  if (!diagnostics.sharedArrayBufferSupported) {
    issues.push('SharedArrayBuffer is not supported. This is required for WebContainers.');
  }
  
  if (!diagnostics.webContainerImportSuccess) {
    issues.push('Failed to import WebContainer API.');
  }
  
  return (
    <div className="p-4 border rounded-md bg-gray-50 dark:bg-gray-900">
      <h2 className="text-lg font-bold mb-2">WebContainer Diagnostics</h2>
      
      {issues.length > 0 ? (
        <div className="mb-4">
          <h3 className="text-red-500 font-bold">Issues Found:</h3>
          <ul className="list-disc pl-5">
            {issues.map((issue, i) => (
              <li key={i} className="text-red-500">{issue}</li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="text-green-500 mb-4">✅ All checks passed! WebContainers should work.</div>
      )}
      
      <div className="mt-4">
        <h3 className="font-bold">Diagnostic Details:</h3>
        <pre className="bg-gray-100 dark:bg-gray-800 p-2 rounded overflow-auto text-xs mt-2">
          {JSON.stringify(diagnostics, null, 2)}
        </pre>
      </div>
      
      <div className="mt-4">
        <button
          onClick={() => {
            toast.info('Creating API route to check headers...');
            window.open('/api/check-headers', '_blank');
          }}
          className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Check Headers
        </button>
      </div>
    </div>
  );
}
