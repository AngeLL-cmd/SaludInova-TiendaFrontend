import { api, unwrap, unwrapPaginated } from '@/api/client'
import type { Sale } from '@/types'

export interface CreateSalePayload {
  items: { productId: string; quantity: number }[]
  clientDni?: string
  clientName?: string
  clientPhone?: string
  pointsToUse?: number
  notes?: string
}

export async function createSale(payload: CreateSalePayload) {
  return unwrap<Sale>(api.post('/sales', payload))
}

export async function listSales(params?: {
  page?: number
  limit?: number
  startDate?: string
  endDate?: string
  userId?: string
  clientId?: string
}) {
  return unwrapPaginated<Sale>(api.get('/sales', { params }))
}

export async function getSale(id: string) {
  return unwrap<Sale>(api.get(`/sales/${id}`))
}

export async function todaySummary() {
  return unwrap<{
    todaySales: number
    todayRevenue: number
    averageTicket: number
    date: string
  }>(api.get('/sales/summary/today'))
}

export async function downloadReceipt(saleId: string) {
  const res = await api.get<Blob>(`/sales/${saleId}/receipt`, {
    responseType: 'blob',
  })
  return res.data
}
