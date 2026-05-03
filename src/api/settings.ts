import { api, unwrap } from '@/api/client'
import type { DiscountRule, DiscountType, SettingsMap } from '@/types'

export async function getSettings() {
  return unwrap<SettingsMap>(api.get('/settings'))
}

export async function updateSettings(settings: Partial<SettingsMap>) {
  return unwrap<SettingsMap>(api.put('/settings', { settings }))
}

export async function listDiscounts() {
  return unwrap<DiscountRule[]>(api.get('/settings/discounts'))
}

export async function createDiscount(payload: {
  name: string
  type: DiscountType
  value: number
  condition?: string
  isActive?: boolean
  priority?: number
}) {
  return unwrap<DiscountRule>(api.post('/settings/discounts', payload))
}

export async function updateDiscount(
  id: string,
  payload: Partial<{
    name: string
    type: DiscountType
    value: number
    condition: string
    isActive: boolean
    priority: number
  }>,
) {
  return unwrap<DiscountRule>(api.put(`/settings/discounts/${id}`, payload))
}

export async function deleteDiscount(id: string) {
  return unwrap<unknown>(api.delete(`/settings/discounts/${id}`))
}
