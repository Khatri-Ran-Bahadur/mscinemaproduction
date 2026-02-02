/**
 * Next.js API Route - Proxy for external API calls
 * This solves CORS issues by making requests from the server
 */

import { NextResponse } from 'next/server';
import { API_CONFIG } from '@/config/api';

// API Configuration from centralized config
const { API_BASE_URL: EXTERNAL_API_URL } = API_CONFIG;

/**
 * Extract user-friendly error message from HTML error page
 * @param {string} html - HTML content
 * @param {number} status - HTTP status code
 * @returns {string} - User-friendly error message
 */
function getUserFriendlyErrorFromHtml(html, status) {
  // Try to extract error message from HTML (common patterns)
  const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
  const h2Match = html.match(/<h2>([^<]+)<\/h2>/i);
  const h3Match = html.match(/<h3>([^<]+)<\/h3>/i);
  
  // Use the status code to provide context-specific error messages
  return getUserFriendlyErrorFromStatus(status);
}

/**
 * Get user-friendly error message from HTTP status code
 * @param {number} status - HTTP status code
 * @returns {string} - User-friendly error message
 */
function getUserFriendlyErrorFromStatus(status) {
  switch (status) {
    case 400:
      return 'Invalid request. Please check your input and try again.';
    case 401:
      return 'Authentication failed. Please log in and try again.';
    case 403:
      return 'Access denied. You do not have permission to perform this action.';
    case 404:
      return 'The requested service was not found. Please check your information and try again, or contact support if the problem persists.';
    case 409:
      return 'This action conflicts with existing data. Please check and try again.';
    case 422:
      return 'Validation error. Please check your input and try again.';
    case 429:
      return 'Too many requests. Please wait a moment and try again.';
    case 500:
      return 'Server error. Please try again later or contact support if the problem persists.';
    case 502:
      return 'Service temporarily unavailable. Please try again in a few moments.';
    case 503:
      return 'Service is currently under maintenance. Please try again later.';
    case 504:
      return 'Request timeout. Please try again.';
    default:
      if (status >= 400 && status < 500) {
        return 'Request error. Please check your information and try again.';
      } else if (status >= 500) {
        return 'Server error. Please try again later or contact support.';
      }
      return 'An error occurred. Please try again.';
  }
}

export async function GET(request) {
  return handleRequest(request, 'GET');
}

export async function POST(request) {
  return handleRequest(request, 'POST');
}

export async function PUT(request) {
  return handleRequest(request, 'PUT');
}


export async function DELETE(request) {
  return handleRequest(request, 'DELETE');
}

async function handleRequest(request, method) {
  try {
    // Get the endpoint from query parameters
    const { searchParams } = new URL(request.url);
    const endpoint = searchParams.get('endpoint');
    
    if (!endpoint) {
      return NextResponse.json(
        { error: 'Endpoint parameter is required' },
        { status: 400 }
      );
    }

    // Get authorization header from request (only if present - GetToken doesn't need it)
    const authHeader = request.headers.get('authorization');
    
    // Build the full URL
    // Note: endpoint may already contain query parameters (e.g., /path?param=value)
    // In that case, we should use it as-is and not add additional query parameters
    let url = `${EXTERNAL_API_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
    
    // URL already logged if needed in development
    
    // Only add additional query parameters if endpoint doesn't already have them
    // and if there are any additional query params in the request (besides 'endpoint')
    if (!endpoint.includes('?')) {
      const queryParams = new URLSearchParams();
      searchParams.forEach((value, key) => {
        if (key !== 'endpoint') {
          queryParams.append(key, value);
        }
      });
      if (queryParams.toString()) {
        url += `?${queryParams.toString()}`;
      }
    }
    
    // Prepare fetch options
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    // Add authorization header ONLY if present (GetToken endpoint doesn't need it)
    if (authHeader) {
      options.headers['Authorization'] = authHeader;
    }
    
    // Auth status logged if needed

    // Add body for POST/PUT requests
    if (method === 'POST' || method === 'PUT') {
      try {
        const bodyText = await request.text();
        
        // Only add body if it's not empty
        if (bodyText && bodyText.trim() && bodyText !== '{}') {
          // Try to parse as JSON, if it fails, use as text
          try {
            const body = JSON.parse(bodyText);
            // Only send body if it has actual content (not empty object)
            if (body && Object.keys(body).length > 0) {
              options.body = JSON.stringify(body);
            }
          } catch (parseError) {
            // Not JSON, send as text
            options.body = bodyText;
          }
        }
        // If body is empty or '{}', don't add it (API expects no body for registration endpoint)
      } catch (error) {
        // No body provided or error reading body, that's okay
        // The registration endpoint doesn't require a body (parameters are in the URL path)
      }
    }

    // Make the request to external API
    if (process.env.NODE_ENV === 'development') {
    }
    
    let response;
    try {
      // Add timeout to prevent hanging requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
      
      response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
    } catch (fetchError) {
      // Handle network/connection errors
      if (fetchError.name === 'AbortError') {
        console.error('[Proxy] Request timeout after 30s:', url);
        return NextResponse.json(
          {
            error: 'Request timeout',
            message: 'The API server did not respond within 30 seconds.',
            details: `Timeout connecting to: ${url}`,
            suggestion: 'Please check if the API server is running and accessible.',
          },
          { status: 504 }
        );
      }
      
      // Network connection errors
      const errorMessage = fetchError.message || 'Unknown network error';
      console.error('[Proxy] Fetch failed:', errorMessage);
      console.error('[Proxy] Failed URL:', url);
      console.error('[Proxy] API Base URL:', EXTERNAL_API_URL);
      
      return NextResponse.json(
        {
          error: 'Connection failed',
          message: 'Unable to connect to the API server.',
          details: {
            url: url,
            endpoint: endpoint,
            apiBaseUrl: EXTERNAL_API_URL,
            error: errorMessage,
            troubleshooting: [
              '1. Check if the API server is running',
              '2. Verify the API URL is correct in your .env.local file',
              '3. Check your network connection',
              `4. Test if you can access: ${EXTERNAL_API_URL}`,
            ],
          },
        },
        { status: 503 }
      );
    }
    
    // Status monitoring
    
    // Get response data
    const contentType = response.headers.get('content-type') || '';
    let data;
    
    try {
      if (contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const textData = await response.text();
        
        // Check if response is HTML (error page)
        if (textData.trim().startsWith('<!DOCTYPE') || textData.trim().startsWith('<html')) {
          // Convert HTML error page to user-friendly JSON error
          const errorMessage = getUserFriendlyErrorFromHtml(textData, response.status);
          return NextResponse.json(
            {
              error: errorMessage,
              message: errorMessage,
            },
            { status: response.status }
          );
        }
        
        // Try to parse as JSON if it looks like JSON
        try {
          data = JSON.parse(textData);
        } catch {
          // If it's not JSON and not HTML, return as text (but only if successful)
          if (response.ok) {
            data = textData;
          } else {
            // For non-JSON, non-HTML error responses, return user-friendly error
            const errorMessage = getUserFriendlyErrorFromStatus(response.status);
            return NextResponse.json(
              {
                error: errorMessage,
                message: errorMessage,
              },
              { status: response.status }
            );
          }
        }
      }
    } catch (parseError) {
      // If parsing fails, return error response
      if (process.env.NODE_ENV === 'development') {
        console.error('[Proxy] Parse error:', parseError);
      }
      const errorMessage = getUserFriendlyErrorFromStatus(response.status);
      return NextResponse.json(
        {
          error: errorMessage,
          message: errorMessage,
        },
        { status: response.status }
      );
    }

    // If response is not OK and data doesn't have error/message/remarks fields, add user-friendly error
    if (!response.ok && data) {
      if (!data.error && !data.message && !data.remarks && !data.Remarks) {
        const errorMessage = getUserFriendlyErrorFromStatus(response.status);
        data.error = errorMessage;
        data.message = errorMessage;
      }
    }

    // Return response with same status and data
    return NextResponse.json(data, {
      status: response.status,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  } catch (error) {
    console.error('Proxy error:', error);
    return NextResponse.json(
      { 
        error: 'Proxy request failed',
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

// Handle OPTIONS for CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

