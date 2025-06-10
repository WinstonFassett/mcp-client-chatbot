import { NextResponse } from 'next/server';

export async function GET() {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json',
    'Cross-Origin-Opener-Policy': 'same-origin',
    'Cross-Origin-Embedder-Policy': 'require-corp',
    'Cross-Origin-Resource-Policy': 'cross-origin'
  };

  // Return the headers that this route received and sent
  return NextResponse.json({
    sent: headers,
    crossOriginIsolated: typeof globalThis !== 'undefined' && 
      // @ts-ignore - crossOriginIsolated exists on window but TypeScript doesn't know it
      (typeof globalThis.crossOriginIsolated !== 'undefined' ? 
        // @ts-ignore
        globalThis.crossOriginIsolated : 
        'Not available on server')
  }, { headers });
}
