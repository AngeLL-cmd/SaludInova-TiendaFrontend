import { api, unwrap, unwrapPaginated } from '@/api/client'
import type { AuthUser, UserPermission } from '@/types'

export interface CreateUserPayload {
  firstName: string
  lastName: string
  email: string
  dni: string
  position: string
  role: 'ADMIN' | 'USER'
  phone?: string
}

export async function listUsers(params?: {
  page?: number
  limit?: number
  search?: string
  role?: string
}) {
  return unwrapPaginated<AuthUser>(api.get('/users', { params }))
}

export async function getUser(id: string) {
  return unwrap<AuthUser>(api.get(`/users/${id}`))
}

export async function createUser(payload: CreateUserPayload) {
  return unwrap<AuthUser>(api.post('/users', payload))
}

export async function updateUser(
  id: string,
  payload: Partial<CreateUserPayload> & { isActive?: boolean },
) {
  return unwrap<AuthUser>(api.put(`/users/${id}`, payload))
}

export async function updatePermissions(id: string, permissions: UserPermission[]) {
  return unwrap<AuthUser>(
    api.put(`/users/${id}/permissions`, { permissions }),
  )
}

export async function resetPassword(id: string) {
  return unwrap<{ message: string }>(api.post(`/users/${id}/reset-password`))
}

export async function toggleUserActive(id: string) {
  return unwrap<AuthUser>(api.patch(`/users/${id}/toggle-active`))
}

export async function deleteUser(id: string) {
  return unwrap<unknown>(api.delete(`/users/${id}`))
}
