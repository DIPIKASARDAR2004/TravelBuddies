import toast from "react-hot-toast";
import { requestJson } from "@/lib/client/requestJson";

/** Existing UI contract: exactly one notification per failed request. */
export async function apiClient<T = unknown>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  try {
    return await requestJson<T>(endpoint, options);
  } catch (error) {
    const message =
      error instanceof TypeError
        ? "Network error. Please check your connection."
        : error instanceof Error
          ? error.message
          : "The request failed. Please try again.";
    toast.error(message);
    throw error;
  }
}
