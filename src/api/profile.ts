import { api, unwrap } from '@/api/client'
import type { AuthUser } from '@/types'

export async function getProfile() {
  return unwrap<AuthUser>(api.get('/profile'))
}

export async function updateProfile(payload: { phone?: string; email?: string }) {
  return unwrap<AuthUser>(api.put('/profile', payload))
}

export async function profileChangePassword(body: {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}) {
  return unwrap<unknown>(api.post('/profile/change-password', body))
}
