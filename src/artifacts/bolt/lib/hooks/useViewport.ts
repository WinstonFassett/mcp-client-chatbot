import { useState, useEffect } from 'react';

// Helper to check if code is running in browser environment
const isBrowser = () => typeof window !== 'undefined';

const useViewport = (threshold = 1024) => {
  // Default to false for server-side rendering
  const [isSmallViewport, setIsSmallViewport] = useState(
    isBrowser() ? window.innerWidth < threshold : false
  );

  useEffect(() => {
    if (!isBrowser()) return;
    
    // Now we're safely in the browser
    // Update once on mount to ensure we have the right value
    setIsSmallViewport(window.innerWidth < threshold);
    
    const handleResize = () => setIsSmallViewport(window.innerWidth < threshold);
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [threshold]);

  return isSmallViewport;
};

export default useViewport;
