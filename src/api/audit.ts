import { api, unwrap, unwrapPaginated } from '@/api/client'
import type { AuditLog } from '@/types'

export async function listAudit(params?: {
  page?: number
  limit?: number
  userId?: string
  module?: string
  action?: string
  startDate?: string
  endDate?: string
}) {
  return unwrapPaginated<AuditLog>(api.get('/audit', { params }))
}

export async function getAuditLog(id: string) {
  return unwrap<AuditLog>(api.get(`/audit/${id}`))
}

export async function auditByUser(userId: string, params?: { page?: number; limit?: number }) {
  return unwrapPaginated<AuditLog>(api.get(`/audit/user/${userId}`, { params }))
}
