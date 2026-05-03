import { api, unwrap, unwrapPaginated } from '@/api/client'
import type { Client, Sale } from '@/types'

export async function listClients(params?: {
  page?: number
  limit?: number
  search?: string
}) {
  return unwrapPaginated<Client>(api.get('/clients', { params }))
}

export async function searchClientByDni(dni: string) {
  try {
    return await unwrap<Client | null>(
      api.get('/clients/search', { params: { dni } }),
    )
  } catch {
    return null
  }
}

export async function getClient(id: string) {
  return unwrap<Client>(api.get(`/clients/${id}`))
}

export async function clientHistory(id: string) {
  return unwrap<Sale[]>(api.get(`/clients/${id}/history`))
}

export async function clientPoints(id: string) {
  return unwrap<unknown>(api.get(`/clients/${id}/points`))
}

export async function updateClient(
  id: string,
  payload: { name?: string; phone?: string },
) {
  return unwrap<Client>(api.put(`/clients/${id}`, payload))
}
