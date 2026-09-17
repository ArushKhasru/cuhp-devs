import { cookies } from "next/headers";

export async function serverApiFetch(endpoint: string, options: RequestInit = {}) {
  const backend = (process.env.HTTP_BACKEND_URL || "http://localhost:3001").replace(/\/+$/, "");
  if (!endpoint.startsWith("/") || endpoint.startsWith("//")) throw new Error("Invalid API path");
  const cookieStore = await cookies();
  const headers = new Headers(options.headers);
  const token = cookieStore.get("token");
  if (token) headers.set("Cookie", "token=" + encodeURIComponent(token.value));
  if (options.body !== undefined && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  const response = await fetch(backend + endpoint, {
    ...options, headers, cache: "no-store", signal: options.signal ?? AbortSignal.timeout(15_000),
  });
  if (!response.ok) {
    const error = new Error("API request failed (" + response.status + ")") as Error & { status: number };
    error.status = response.status;
    throw error;
  }
  return response.status === 204 ? null : response.json();
}
