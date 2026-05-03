import axios, { type AxiosError } from 'axios'
import type { Pagination } from '@/types'

const TOKEN_KEY = 'sn_token'

export interface ApiErrorBody {
  success?: false
  statusCode?: number
  message?: string
  errors?: string[]
}

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setStoredToken(token: string | null) {
  if (token) localStorage.setItem(TOKEN_KEY, token)
  else localStorage.removeItem(TOKEN_KEY)
}

export const api = axios.create({
  baseURL:
    import.meta.env.VITE_API_URL ??
    'https://nova-salud-backend.onrender.com/api',
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const t = getStoredToken()
  if (t) config.headers.Authorization = `Bearer ${t}`
  return config
})

let onUnauthorized: (() => void) | null = null
export function setOnUnauthorized(cb: (() => void) | null) {
  onUnauthorized = cb
}

api.interceptors.response.use(
  (r) => r,
  (error: AxiosError<ApiErrorBody>) => {
    const msg = error.response?.data?.message ?? error.message
    const status = error.response?.status
    if (status === 401) {
      setStoredToken(null)
      onUnauthorized?.()
    }
    return Promise.reject(new Error(msg))
  },
)

export async function unwrap<T>(
  p: Promise<{ data: unknown }>,
): Promise<T> {
  const { data } = await p
  const body = data as {
    success: boolean
    data: T
    message?: string
  }
  if (!body.success) throw new Error(body.message ?? 'Error desconocido')
  return body.data
}

export async function unwrapPaginated<T>(
  p: Promise<{ data: unknown }>,
): Promise<{ items: T[]; pagination: Pagination }> {
  const { data } = await p
  const body = data as {
    success: boolean
    data: T[]
    pagination: Pagination
    message?: string
  }
  if (!body.success) throw new Error(body.message ?? 'Error desconocido')
  return { items: body.data, pagination: body.pagination }
}
