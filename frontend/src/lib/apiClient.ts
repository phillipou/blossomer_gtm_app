const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  let body: any = null;
  const text = await response.text();
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }

  if (!response.ok) {
    const error: any = new Error(
      `API error: ${response.status} ${response.statusText}`
    );
    error.status = response.status;
    error.body = body;
    throw error;
  }

  return body;
} 