import { api, unwrap, unwrapPaginated } from '@/api/client'
import type { AlertItem, Product } from '@/types'

export type StockStatus = 'low' | 'critical' | 'normal' | 'medium'

export interface CreateProductPayload {
  commercialName: string
  category: string
  purchasePrice: number
  salePrice: number
  sku: string
  saleUnit: string
  taxApplicable: boolean
  genericName?: string
  description?: string
  pharmaceuticalForm?: string
  concentration?: string
  presentation?: string
  laboratory?: string
  currentStock?: number
  minimumStock?: number
  expirationDate?: string
  lot?: string
  barcode?: string
  physicalLocation?: string
}

export async function listProducts(params?: {
  page?: number
  limit?: number
  search?: string
  category?: string
  stockStatus?: StockStatus
  pharmaceuticalForm?: string
  laboratory?: string
  expiryStatus?: string
  sortBy?: string
}) {
  return unwrapPaginated<Product>(api.get('/products', { params }))
}

export async function getProduct(id: string) {
  return unwrap<Product>(api.get(`/products/${id}`))
}

export async function createProduct(payload: CreateProductPayload) {
  return unwrap<Product>(api.post('/products', payload))
}

export async function updateProduct(
  id: string,
  payload: Partial<CreateProductPayload>,
) {
  return unwrap<Product>(api.put(`/products/${id}`, payload))
}

export async function deleteProduct(id: string) {
  return unwrap<unknown>(api.delete(`/products/${id}`))
}

export async function productAlerts() {
  return unwrap<AlertItem[] | Product[]>(api.get('/products/alerts'))
}

export async function productByBarcode(code: string) {
  return unwrap<Product>(api.get(`/products/barcode/${encodeURIComponent(code)}`))
}
