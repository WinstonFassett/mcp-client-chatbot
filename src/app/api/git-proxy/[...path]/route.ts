import { NextRequest, NextResponse } from 'next/server';

// Allowed headers to forward to the target server
const ALLOW_HEADERS = [
  'accept-encoding',
  'accept-language',
  'accept',
  'access-control-allow-origin',
  'authorization',
  'cache-control',
  'connection',
  'content-length',
  'content-type',
  'dnt',
  'pragma',
  'range',
  'referer',
  'user-agent',
  'x-authorization',
  'x-http-method-override',
  'x-requested-with',
];

// Headers to expose from the target server's response
const EXPOSE_HEADERS = [
  'accept-ranges',
  'age',
  'cache-control',
  'content-length',
  'content-language',
  'content-type',
  'date',
  'etag',
  'expires',
  'last-modified',
  'pragma',
  'server',
  'transfer-encoding',
  'vary',
  'x-github-request-id',
  'x-redirected-url',
];

// Handle OPTIONS requests for CORS preflight
export async function OPTIONS(request: NextRequest, { params }: { params: { path: string[] } }) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
      'Access-Control-Allow-Headers': ALLOW_HEADERS.join(', '),
      'Access-Control-Expose-Headers': EXPOSE_HEADERS.join(', '),
      'Access-Control-Max-Age': '86400',
    },
  });
}

// Handle GET requests
export async function GET(request: NextRequest, { params }: { params: { path: string[] } }) {
  return handleProxyRequest(request, params.path);
}

// Handle POST requests
export async function POST(request: NextRequest, { params }: { params: { path: string[] } }) {
  return handleProxyRequest(request, params.path);
}

async function handleProxyRequest(request: NextRequest, pathParams: string[]) {
  try {
    if (!pathParams || pathParams.length === 0) {
      return NextResponse.json({ error: 'Invalid proxy URL format' }, { status: 400 });
    }

    // Extract domain and remaining path
    const domain = pathParams[0];
    const remainingPath = pathParams.slice(1).join('/');

    // Reconstruct the target URL with query parameters
    const url = new URL(request.url);
    const targetURL = `https://${domain}/${remainingPath}${url.search}`;

    console.log('Git Proxy Target URL:', targetURL);

    // Filter and prepare headers
    const headers = new Headers();

    // Only forward allowed headers
    for (const header of ALLOW_HEADERS) {
      const headerValue = request.headers.get(header);
      if (headerValue) {
        headers.set(header, headerValue);
      }
    }

    // Set the host header
    headers.set('Host', domain);

    // Set Git user agent if not already present
    const userAgent = request.headers.get('user-agent');
    if (!userAgent || !userAgent.startsWith('git/')) {
      headers.set('User-Agent', 'git/@isomorphic-git/cors-proxy');
    }

    console.log('Git Proxy Request headers:', Object.fromEntries(headers.entries()));

    // Prepare fetch options with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
    
    const fetchOptions: RequestInit = {
      method: request.method,
      headers,
      redirect: 'follow',
      signal: controller.signal,
    };

    // Add body for non-GET/HEAD requests
    if (!['GET', 'HEAD'].includes(request.method)) {
      const body = await request.blob();
      fetchOptions.body = body;
    }

    // Forward the request to the target URL
    let response;
    try {
      response = await fetch(targetURL, fetchOptions);
      clearTimeout(timeoutId);
    } catch (fetchError) {
      clearTimeout(timeoutId);
      
      // Handle network errors more specifically
      console.error('Git Proxy fetch error:', fetchError);
      const errorMessage = fetchError instanceof Error ? fetchError.message : String(fetchError);
      
      // Determine the appropriate error status and message
      let status = 500;
      let message = 'Network error while connecting to repository';
      
      if (fetchError instanceof DOMException && fetchError.name === 'AbortError') {
        status = 504;
        message = 'Request timed out after 30 seconds';
      } else if (errorMessage.includes('ENOTFOUND') || errorMessage.includes('getaddrinfo')) {
        status = 404;
        message = 'Host not found. Please check the repository URL.';
      } else if (errorMessage.includes('ETIMEDOUT')) {
        status = 504;
        message = 'Connection timed out. The server took too long to respond.';
      } else if (errorMessage.includes('ECONNREFUSED')) {
        status = 502;
        message = 'Connection refused by the server.';
      } else if (errorMessage.includes('ECONNRESET')) {
        status = 502;
        message = 'Connection was reset by the server.';
      }
      
      return NextResponse.json(
        {
          error: 'Git Proxy error',
          message,
          details: errorMessage,
          url: pathParams ? `https://${pathParams.join('/')}` : 'Invalid URL',
        },
        { 
          status,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
            'Access-Control-Allow-Headers': ALLOW_HEADERS.join(', '),
          }
        }
      );
    }

    console.log('Git Proxy Response status:', response.status);

    // Create response headers
    const responseHeaders = new Headers();

    // Add CORS headers
    responseHeaders.set('Access-Control-Allow-Origin', '*');
    responseHeaders.set('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    responseHeaders.set('Access-Control-Allow-Headers', ALLOW_HEADERS.join(', '));
    responseHeaders.set('Access-Control-Expose-Headers', EXPOSE_HEADERS.join(', '));

    // Copy exposed headers from the target response
    for (const header of EXPOSE_HEADERS) {
      // Skip content-length as we'll use the original response's content-length
      if (header === 'content-length') {
        continue;
      }

      const headerValue = response.headers.get(header);
      if (headerValue) {
        responseHeaders.set(header, headerValue);
      }
    }

    // If the response was redirected, add the x-redirected-url header
    if (response.redirected) {
      responseHeaders.set('x-redirected-url', response.url);
    }

    console.log('Git Proxy Response headers:', Object.fromEntries(responseHeaders.entries()));

    // Return the response with the target's body stream piped directly
    return new NextResponse(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error('Git Proxy error:', error);
    
    // Provide more detailed error information
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    return NextResponse.json(
      {
        error: 'Git Proxy error',
        message: errorMessage,
        url: pathParams ? `https://${pathParams.join('/')}` : 'Invalid URL',
      },
      { 
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
          'Access-Control-Allow-Headers': ALLOW_HEADERS.join(', '),
        }
      },
    );
  }
}
