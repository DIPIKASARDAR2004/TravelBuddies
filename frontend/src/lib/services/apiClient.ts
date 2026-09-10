import toast from 'react-hot-toast';

/**
 * A wrapper around native fetch that handles JSON serialization,
 * default headers, error throwing, and standard toast notifications.
 */
export async function apiClient<T = unknown>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  try {
    const res = await fetch(endpoint, {
      ...options,
      headers,
    });

    const data = await res.json();

    if (!res.ok) {
      const errorMsg = data.error || data.message || 'An error occurred';
      toast.error(errorMsg);
      throw new Error(errorMsg);
    }

    return data;
  } catch (error: unknown) {
    console.error('API Client Error:', error);
    if (
      error instanceof TypeError ||
      (error instanceof Error && error.message.toLowerCase().includes('fetch'))
    ) {
      toast.error('Network error. Please check your connection.');
    }
    throw error;
  }
}
