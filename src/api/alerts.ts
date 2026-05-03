import { api, unwrap } from '@/api/client'
import type { AlertItem, AlertType } from '@/types'

export async function listAlerts() {
  const raw = await unwrap<unknown>(api.get('/alerts'))
  return normalizeAlertList(raw)
}

export async function stockAlerts() {
  const raw = await unwrap<unknown>(api.get('/alerts/stock'))
  return normalizeAlertList(raw)
}

export async function expiryAlerts() {
  const raw = await unwrap<unknown>(api.get('/alerts/expiry'))
  return normalizeAlertList(raw)
}

export async function alertsCount() {
  return unwrap<{ count: number; critical: number }>(
    api.get('/alerts/count'),
  )
}

function normalizeAlertList(raw: unknown): AlertItem[] {
  const arr = extractArray(raw)
  return arr.map(normalizeAlertItem)
}

function extractArray(raw: unknown): unknown[] {
  if (Array.isArray(raw)) return raw
  if (raw && typeof raw === 'object') {
    const o = raw as Record<string, unknown>
    if (Array.isArray(o.data)) return o.data
    if (Array.isArray(o.items)) return o.items
    if (Array.isArray(o.alerts)) return o.alerts
  }
  return []
}

function str(v: unknown): string {
  if (v === null || v === undefined) return ''
  return String(v).trim()
}

function num(v: unknown): number | undefined {
  if (v === null || v === undefined || v === '') return undefined
  const n = typeof v === 'number' ? v : Number(v)
  return Number.isFinite(n) ? n : undefined
}

function normalizeAlertItem(row: unknown): AlertItem {
  if (!row || typeof row !== 'object') {
    return {
      productId: '—',
      productName: 'Dato no válido',
      type: 'LOW_STOCK',
      severity: 'low',
      message: 'No se pudo leer esta alerta.',
    }
  }
  const r = row as Record<string, unknown>
  const prod =
    r.product && typeof r.product === 'object'
      ? (r.product as Record<string, unknown>)
      : null

  const productId = str(
    r.productId ??
      r.product_id ??
      r.id ??
      prod?.id ??
      prod?.product_id,
  )
  const productName = str(
    r.productName ??
      r.product_name ??
      r.name ??
      r.commercialName ??
      r.commercial_name ??
      prod?.commercialName ??
      prod?.commercial_name ??
      prod?.name,
  )
  const message = str(
    r.message ?? r.msg ?? r.description ?? r.detail ?? r.text ?? r.reason,
  )
  const typeRaw = str(r.type ?? r.alertType ?? r.alert_type).toUpperCase()
  const type = (['LOW_STOCK', 'CRITICAL_STOCK', 'EXPIRING_SOON', 'EXPIRED'].includes(
    typeRaw,
  )
    ? typeRaw
    : 'LOW_STOCK') as AlertType

  const sevRaw = str(r.severity ?? r.level ?? r.priority).toLowerCase()
  const severity =
    sevRaw === 'critical' ||
    sevRaw === 'high' ||
    sevRaw === 'medium' ||
    sevRaw === 'low'
      ? (sevRaw === 'critical'
          ? 'critical'
          : sevRaw === 'high'
            ? 'high'
            : sevRaw === 'medium'
              ? 'medium'
              : 'low')
      : 'medium'

  const title =
    productName ||
    str(r.title ?? r.label) ||
    (productId ? `Producto (${productId.slice(0, 8)}…)` : 'Alerta')
  const body =
    message ||
    buildFallbackMessage(r, title)

  return {
    productId: productId || '—',
    productName: title,
    type,
    severity,
    message: body,
    currentStock: num(r.currentStock ?? r.current_stock),
    minimumStock: num(r.minimumStock ?? r.minimum_stock ?? r.minStock),
  }
}

function buildFallbackMessage(r: Record<string, unknown>, title: string): string {
  const parts: string[] = []
  const cur = num(r.currentStock ?? r.current_stock)
  const min = num(r.minimumStock ?? r.minimum_stock)
  if (cur !== undefined) parts.push(`Stock actual: ${cur}`)
  if (min !== undefined) parts.push(`Mínimo: ${min}`)
  if (parts.length) return parts.join(' · ')
  return `Alerta de inventario: ${title}`
}
