import { api, unwrap } from '@/api/client'
import type { AuthUser, LoginResponse } from '@/types'

export async function login(email: string, password: string) {
  return unwrap<LoginResponse>(
    api.post('/auth/login', { email, password }),
  )
}

export async function changePassword(body: {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}) {
  return unwrap<unknown>(api.post('/auth/change-password', body))
}

export async function fetchMe() {
  return unwrap<AuthUser>(api.get('/auth/me'))
}
