"use client";

import { useEffect, useState } from 'react';
import { startDevServer } from './webcontainer-manager';

interface PreviewProps {
  className?: string;
  url?: string;
}

export function Preview({ className = '', url: propUrl }: PreviewProps) {
  const [url, setUrl] = useState<string | null>(propUrl || null);
  const [loading, setLoading] = useState(!propUrl);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // If URL is provided via props, use it directly
    if (propUrl) {
      setUrl(propUrl);
      setLoading(false);
      return;
    }
    
    // Otherwise, try to start the dev server
    const initPreview = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const { url: serverUrl } = await startDevServer();
        setUrl(serverUrl);
      } catch (err) {
        console.error('Failed to start preview server:', err);
        setError('Failed to start preview server. Check the terminal for details.');
      } finally {
        setLoading(false);
      }
    };
    
    initPreview();
  }, [propUrl]);

  if (loading) {
    return (
      <div className={`flex items-center justify-center ${className}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
          <div>Starting server...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex items-center justify-center ${className}`}>
        <div className="text-center text-red-500">
          <div className="mb-2">⚠️ {error}</div>
          <button 
            onClick={() => window.location.reload()}
            className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!url) {
    return (
      <div className={`flex items-center justify-center ${className}`}>
        <div className="text-center text-gray-500">
          No preview available
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full h-full ${className}`}>
      <div className="border-b dark:border-gray-700 p-2 flex justify-between items-center">
        <div className="font-mono text-sm truncate">{url}</div>
        <button 
          onClick={() => window.open(url, '_blank')}
          className="px-2 py-1 text-xs bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
        >
          Open in new tab
        </button>
      </div>
      <iframe 
        src={url} 
        className="w-full h-[calc(100%-40px)]"
        sandbox="allow-scripts allow-same-origin allow-forms"
        title="Preview"
      />
    </div>
  );
}
