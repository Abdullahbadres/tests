import axios, { isAxiosError } from "axios";

const baseURL = process.env.NEXT_PUBLIC_API_URL;

/**
 * Sanctum: panggil endpoint resmi Laravel (web middleware) — **tanpa** `withXSRFToken`
 * pada request ini, supaya tidak mengirim header X-XSRF-TOKEN lama yang bikin 419.
 */
async function fetchSanctumCsrfCookie(): Promise<void> {
  await axios.get(`${baseURL}/sanctum/csrf-cookie`, {
    withCredentials: true,
    headers: {
      Accept: "application/json",
      "X-Requested-With": "XMLHttpRequest",
    },
  });
}

const api = axios.create({
  baseURL: `${baseURL}/api`,
  withCredentials: true,
  withXSRFToken: true,
  xsrfCookieName: "XSRF-TOKEN",
  xsrfHeaderName: "X-XSRF-TOKEN",
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
    "X-Requested-With": "XMLHttpRequest",
  },
});

api.interceptors.request.use(async (config) => {
  const url = config.url ?? "";
  const method = (config.method ?? "get").toLowerCase();
  if (url.includes("sanctum/csrf-cookie")) {
    return config;
  }
  /** Only mutating requests need CSRF; GET requests like /api/user do not (401 before login is normal). */
  if (["post", "put", "patch", "delete"].includes(method)) {
    await fetchSanctumCsrfCookie();
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (isAxiosError(error) && error.response?.status === 401) {
      const url = error.config?.url ?? "";
      const isAuthAttempt = url.includes("/login") || url.includes("/register");
      if (!isAuthAttempt) {
        const { useAuthStore } = await import("@/store/auth.store");
        useAuthStore.getState().setUser(null);
      }
    }
    return Promise.reject(error);
  },
);

export default api;

/** Pesan error dari body JSON Laravel: field pertama dari `errors`, lalu `message`. */
export function getAxiosErrorMessage(error: unknown, fallback = "Request failed"): string {
  if (isAxiosError(error)) {
    const data = error.response?.data as
      | { message?: string; errors?: Record<string, string[]> }
      | undefined;
    if (data?.errors && typeof data.errors === "object") {
      const keys = Object.keys(data.errors);
      const firstKey = keys[0];
      const firstMsg = firstKey ? data.errors[firstKey]?.[0] : undefined;
      if (typeof firstMsg === "string" && firstMsg.length > 0) {
        return firstMsg;
      }
    }
    if (typeof data?.message === "string" && data.message.length > 0) {
      return data.message;
    }
  }
  return fallback;
}
