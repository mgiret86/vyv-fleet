import axios, { type AxiosInstance, type AxiosRequestConfig, type InternalAxiosRequestConfig } from 'axios'

export interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
  pagination?: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

const STORAGE_KEY = 'vyv-fleet-auth'

function getStoredState(): Record<string, unknown> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    return parsed?.state ?? {}
  } catch {
    return {}
  }
}

function getAccessToken(): string | null {
  return (getStoredState().accessToken as string) ?? null
}

function getRefreshToken(): string | null {
  return (getStoredState().refreshToken as string) ?? null
}

function setTokens(accessToken: string, refreshToken: string): void {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : { state: {}, version: 0 }
    parsed.state = { ...parsed.state, accessToken, refreshToken }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed))
  } catch {
    // ignore
  }
}

function clearAuth(): void {
  localStorage.removeItem(STORAGE_KEY)
}

const BASE_URL = (import.meta as unknown as { env: Record<string, string> }).env.VITE_API_URL ?? '/api'

export const authApi: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
})

export const api: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getAccessToken()
  if (token && config.headers) {
    config.headers['Authorization'] = `Bearer ${token}`
  }
  return config
})

let isRefreshing = false
let failedQueue: Array<{ resolve: (token: string) => void; reject: (err: unknown) => void }> = []

function processQueue(error: unknown, token: string | null = null): void {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error)
    else resolve(token as string)
  })
  failedQueue = []
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean }

    if (error.response?.status === 403) {
      return Promise.reject(new Error('Acces refuse'))
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then((token) => {
          if (originalRequest.headers) {
            (originalRequest.headers as Record<string, string>)['Authorization'] = `Bearer ${token}`
          }
          return api(originalRequest)
        })
      }

      originalRequest._retry = true
      isRefreshing = true

      const refreshToken = getRefreshToken()
      if (!refreshToken) {
        clearAuth()
        window.location.href = '/login'
        return Promise.reject(error)
      }

      try {
        const { data } = await authApi.post<ApiResponse<{ accessToken: string; refreshToken: string }>>(
          '/auth/refresh',
          { refreshToken }
        )
        const { accessToken, refreshToken: newRefreshToken } = data.data
        setTokens(accessToken, newRefreshToken)
        processQueue(null, accessToken)
        if (originalRequest.headers) {
          (originalRequest.headers as Record<string, string>)['Authorization'] = `Bearer ${accessToken}`
        }
        return api(originalRequest)
      } catch (refreshError) {
        processQueue(refreshError, null)
        clearAuth()
        window.location.href = '/login'
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    const message = error.response?.data?.error ?? error.response?.data?.message ?? error.message ?? 'Une erreur est survenue'
    return Promise.reject(new Error(message))
  }
)

export async function get<T>(url: string, params?: Record<string, unknown>): Promise<T> {
  const { data } = await api.get<ApiResponse<T>>(url, { params })
  return data.data
}

export async function post<T>(url: string, body?: unknown): Promise<T> {
  const { data } = await api.post<ApiResponse<T>>(url, body)
  return data.data
}

export async function put<T>(url: string, body?: unknown): Promise<T> {
  const { data } = await api.put<ApiResponse<T>>(url, body)
  return data.data
}

export async function patch<T>(url: string, body?: unknown): Promise<T> {
  const { data } = await api.patch<ApiResponse<T>>(url, body)
  return data.data
}

export async function del<T>(url: string): Promise<T> {
  const { data } = await api.delete<ApiResponse<T>>(url)
  return data.data
}
