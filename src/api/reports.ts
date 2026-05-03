import { api, unwrap } from '@/api/client'

export type ReportPeriod = 'today' | 'week' | 'month' | 'quarter' | 'custom'

export async function reportSales(params?: {
  period?: ReportPeriod
  startDate?: string
  endDate?: string
  userId?: string
}) {
  return unwrap<unknown>(api.get('/reports/sales', { params }))
}

export async function reportTopProducts(params?: { period?: ReportPeriod }) {
  return unwrap<unknown>(api.get('/reports/top-products', { params }))
}

export async function reportInventory() {
  return unwrap<unknown>(api.get('/reports/inventory'))
}

export async function reportClients(params?: { period?: ReportPeriod }) {
  return unwrap<unknown>(api.get('/reports/clients', { params }))
}

export async function reportPoints(params?: { period?: ReportPeriod }) {
  return unwrap<unknown>(api.get('/reports/points', { params }))
}

export async function exportCsv(params?: { period?: ReportPeriod }) {
  const res = await api.get<Blob>('/reports/export/csv', {
    params,
    responseType: 'blob',
  })
  return res.data
}
