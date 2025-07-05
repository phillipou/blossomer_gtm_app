import type { ApiError } from "../types/api";
import { transformKeysToCamelCase, transformKeysToSnakeCase } from "./utils";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
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

  const response = await fetch(url, {
    ...transformedOptions,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  let data: T | ApiError;
  const text = await response.text();
  try {
    const rawData = text ? JSON.parse(text) : {};
    // Transform snake_case keys to camelCase
    data = transformKeysToCamelCase<T | ApiError>(rawData);
  } catch {
    data = { message: text, errorCode: "UNKNOWN_ERROR" } as ApiError;
  }

  if (!response.ok) {
    throw data as ApiError;
  }

  return data as T;
} 