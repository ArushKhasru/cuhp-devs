export const API_URL = (
    process.env.NEXT_PUBLIC_HTTP_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:3001"
)
    .trim()
    .replace(/\/+$/, "");

type ApiErrorPayload = {
    message?: string;
    errors?: Record<string, string[] | undefined>;
};

function getPersistedAuthToken(): string | null {
    if (typeof window === "undefined") {
        return null;
    }

    const raw = window.localStorage.getItem("auth-storage");
    if (!raw) {
        return null;
    }

    try {
        const parsed = JSON.parse(raw) as { state?: { token?: unknown } };
        const token = parsed?.state?.token;
        return typeof token === "string" && token.trim() ? token : null;
    } catch {
        return null;
    }
}

function buildApiErrorMessage(errorData: ApiErrorPayload, status: number) {
    const baseMessage = errorData?.message || `API request failed with status ${status}`;
    const fieldErrors = errorData?.errors;

    if (fieldErrors && typeof fieldErrors === "object") {
        for (const key of Object.keys(fieldErrors)) {
            const value = fieldErrors[key];
            if (Array.isArray(value) && value.length > 0) {
                return `${baseMessage}: ${value[0]}`;
            }
        }
    }

    return baseMessage;
}

export async function apiFetch(endpoint: string, options: RequestInit = {}) {
    const normalizedEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
    const url = `${API_URL}${normalizedEndpoint}`;
    const headers = new Headers(options.headers);
    const authToken = getPersistedAuthToken();

    if (!headers.has("Content-Type") && options.body !== undefined && !(options.body instanceof FormData)) {
        headers.set("Content-Type", "application/json");
    }

    if (authToken && !headers.has("Authorization")) {
        headers.set("Authorization", `Bearer ${authToken}`);
    }

    const defaultOptions: RequestInit = {
        ...options,
        headers,
        // Important for sending cookies to the backend
        credentials: "include",
    };

    let response: Response;
    try {
        response = await fetch(url, defaultOptions);
    } catch (error) {
        throw new Error(`Network request failed for ${url}. Check backend availability and CORS settings.`);
    }

    if (!response.ok) {
        const errorData = (await response.json().catch(() => ({}))) as ApiErrorPayload;

        // Auto-logout on session expiration or missing token
        if (response.status === 401) {
            if (typeof window !== "undefined") {
                // Clear persistent auth state to prevent redirect loops
              
                
                // Only redirect if not already on sign-in page
                window.location.href = "/signin";
                
            }
        }

        const error = new Error(buildApiErrorMessage(errorData, response.status)) as any;
        error.status = response.status;
        error.errorData = errorData;
        throw error;
    }

    if (response.status === 204) {
        return null;
    }

    return response.json();
}
