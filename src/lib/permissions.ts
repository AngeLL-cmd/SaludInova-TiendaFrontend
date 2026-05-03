import type { AuthUser } from '@/types'

export function isAdmin(user: AuthUser | null | undefined) {
  return user?.role === 'ADMIN'
}

export function canAccessModule(
  user: AuthUser | null | undefined,
  module: string,
) {
  if (!user) return false
  if (user.role === 'ADMIN') return true
  const p = user.permissions.find((x) => x.module === module)
  return !!p?.canAccess
}

export function canCreateInModule(
  user: AuthUser | null | undefined,
  module: string,
) {
  if (!user) return false
  if (user.role === 'ADMIN') return true
  const p = user.permissions.find((x) => x.module === module)
  return !!p?.canCreate
}

export function canEditInModule(
  user: AuthUser | null | undefined,
  module: string,
) {
  if (!user) return false
  if (user.role === 'ADMIN') return true
  const p = user.permissions.find((x) => x.module === module)
  return !!p?.canEdit
}

export function canDeleteInModule(
  user: AuthUser | null | undefined,
  module: string,
) {
  if (!user) return false
  if (user.role === 'ADMIN') return true
  const p = user.permissions.find((x) => x.module === module)
  return !!p?.canDelete
}
