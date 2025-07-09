import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import type { ApiError } from "../types/api";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Converts snake_case string to camelCase
 */
function toCamelCase(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
}

/**
 * Converts camelCase string to snake_case
 */
function toSnakeCase(str: string): string {
  return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`)
}

/**
 * Recursively converts all snake_case keys in an object to camelCase
 */
export function transformKeysToCamelCase<T = unknown>(obj: unknown): T {
  if (obj === null || obj === undefined) {
    return obj as T
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => transformKeysToCamelCase(item)) as T
  }
  
  if (typeof obj === 'object' && obj.constructor === Object) {
    const transformed: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(obj)) {
      const camelKey = toCamelCase(key)
      transformed[camelKey] = transformKeysToCamelCase(value)
    }
    return transformed as T
  }
  
  return obj as T
}

/**
 * Recursively converts all camelCase keys in an object to snake_case
 */
export function transformKeysToSnakeCase<T = unknown>(obj: unknown): T {
  if (obj === null || obj === undefined) {
    return obj as T
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => transformKeysToSnakeCase(item)) as T
  }
  
  if (typeof obj === 'object' && obj.constructor === Object) {
    const transformed: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(obj)) {
      const snakeKey = toSnakeCase(key)
      transformed[snakeKey] = transformKeysToSnakeCase(value)
    }
    return transformed as T
  }
  
  return obj as T
}

export function isApiError(error: any): error is ApiError {
  return error && typeof error.errorCode === 'string' && typeof error.message === 'string';
}
