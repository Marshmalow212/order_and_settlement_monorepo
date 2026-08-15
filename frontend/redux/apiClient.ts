import axios from "axios"
import { toast } from "sonner"

// Prefer explicit public API base when provided (NEXT_PUBLIC_API_BASE).
// Otherwise, use the same-origin proxy at `/api` (next.config rewrites).
const envBase = process.env.NEXT_PUBLIC_API_BASE
const baseURL = envBase && envBase.length > 0 ? envBase.replace(/\/$/, "") : "/api"

export const api = axios.create({
    baseURL,
    headers: {
        "Content-Type": "application/json",
    },
})

// Intercept errors to show a toast and resolve with a response-like object
api.interceptors.response.use(
    (response) => response,
    (error) => {
        const apiMsg = error?.response?.data?.message ?? error?.response?.data?.msg ?? error?.message ?? "API request failed"
        try {
            toast.error(`❗ ${String(apiMsg)}`)
        } catch (e) {
            // If toast cannot be called (server environment), ignore
        }

        const fakeRes = {
            data: error?.response?.data ?? { message: apiMsg },
            status: error?.response?.status ?? 500,
            headers: error?.response?.headers ?? {},
            config: error?.config,
            request: error?.request,
            error: true,
        }

        return Promise.resolve(fakeRes)
    }
)

export default api
