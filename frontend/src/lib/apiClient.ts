import type { ApiError } from "../types/api";
import { transformKeysToCamelCase, transformKeysToSnakeCase } from "./utils";
import { getAuthState, getApiBasePath, parseRateLimitHeaders, type RateLimitInfo } from "./auth";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export interface ApiResponse<T> {
  data: T;
  rateLimitInfo?: RateLimitInfo;
}

export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {},
  token?: string | null
): Promise<T> {
  // Get the appropriate base path (demo vs authenticated)
  const basePath = getApiBasePath();
  const url = `${API_BASE_URL}${basePath}${endpoint}`;
  
  // Get auth state for headers (use passed token if available)
  const authState = getAuthState();
  const authToken = token || authState.token;
  
  // Transform request body to snake_case if it exists
  let transformedOptions = { ...options };
  if (options.body && typeof options.body === 'string') {
    try {
      const bodyData = JSON.parse(options.body);
      const snakeCaseBody = transformKeysToSnakeCase(bodyData);
      transformedOptions = { ...transformedOptions, body: JSON.stringify(snakeCaseBody) };
    } catch {
      // If body isn't valid JSON, leave it as is
    }
  }

  // Prepare headers
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  // Add headers from options, ensuring proper type conversion
  if (options.headers) {
    if (options.headers instanceof Headers) {
      options.headers.forEach((value, key) => {
        headers[key] = value;
      });
    } else if (typeof options.headers === 'object') {
      Object.entries(options.headers).forEach(([key, value]) => {
        if (typeof value === 'string') {
          headers[key] = value;
        }
      });
    }
  }

  // Add authorization header if authenticated with Stack Auth token
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  // Log the outgoing request
  console.log(`🚀 API REQUEST: ${transformedOptions.method || 'GET'} ${url}`, {
    endpoint,
    basePath,
    hasAuth: !!authToken,
    headers: { ...headers, Authorization: authToken ? 'Bearer [REDACTED]' : undefined },
    body: transformedOptions.body ? JSON.parse(transformedOptions.body as string) : undefined
  });

  const response = await fetch(url, {
    ...transformedOptions,
    headers,
  });

  // Log the response
  console.log(`📥 API RESPONSE: ${response.status} ${transformedOptions.method || 'GET'} ${url}`, {
    status: response.status,
    statusText: response.statusText,
    ok: response.ok
  });

  // Parse rate limit headers
  const rateLimitInfo = parseRateLimitHeaders(response);

  let data: T | ApiError;
  const text = await response.text();
  try {
    const rawData = text ? JSON.parse(text) : {};
    
    // Log API responses for debugging (can be removed in production)
    if (endpoint.includes('/companies')) {
      console.log(`📋 API Response for ${endpoint}:`, {
        dataKeys: Object.keys(rawData),
        dataType: Array.isArray(rawData) ? 'array' : typeof rawData,
      });
    }
    
    // Transform snake_case keys to camelCase
    data = transformKeysToCamelCase<T | ApiError>(rawData);
  } catch {
    data = { message: text, errorCode: "UNKNOWN_ERROR" } as ApiError;
  }

  if (!response.ok) {
    // Attach rate limit info to error if available
    const error = data as ApiError;
    if (rateLimitInfo) {
      error.rateLimitInfo = rateLimitInfo;
    }
    throw error;
  }

  return data as T;
}

// Convenience function that returns both data and rate limit info
export async function apiFetchWithRateLimit<T>(
  endpoint: string,
  options: RequestInit = {},
  token?: string | null
): Promise<ApiResponse<T>> {
  // This is a modified version that doesn't transform the URL automatically
  const authState = getAuthState();
  const authToken = token || authState.token;
  const basePath = getApiBasePath();
  const url = `${API_BASE_URL}${basePath}${endpoint}`;
  
  let transformedOptions = { ...options };
  if (options.body && typeof options.body === 'string') {
    try {
      const bodyData = JSON.parse(options.body);
      const snakeCaseBody = transformKeysToSnakeCase(bodyData);
      transformedOptions = { ...transformedOptions, body: JSON.stringify(snakeCaseBody) };
    } catch {
      // If body isn't valid JSON, leave it as is
    }
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  // Add headers from options, ensuring proper type conversion
  if (options.headers) {
    if (options.headers instanceof Headers) {
      options.headers.forEach((value, key) => {
        headers[key] = value;
      });
    } else if (typeof options.headers === 'object') {
      Object.entries(options.headers).forEach(([key, value]) => {
        if (typeof value === 'string') {
          headers[key] = value;
        }
      });
    }
  }

  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  const response = await fetch(url, {
    ...transformedOptions,
    headers,
  });

  const rateLimitInfo = parseRateLimitHeaders(response);

  let data: T | ApiError;
  const text = await response.text();
  try {
    const rawData = text ? JSON.parse(text) : {};
    data = transformKeysToCamelCase<T | ApiError>(rawData);
  } catch {
    data = { message: text, errorCode: "UNKNOWN_ERROR" } as ApiError;
  }

  if (!response.ok) {
    const error = data as ApiError;
    if (rateLimitInfo) {
      error.rateLimitInfo = rateLimitInfo;
    }
    throw error;
  }

  return {
    data: data as T,
    rateLimitInfo: rateLimitInfo || undefined,
  };
} 