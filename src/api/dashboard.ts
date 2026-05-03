import { api, unwrap } from '@/api/client'
import { coerceMoneyNumber } from '@/lib/utils'
import type { ChartPoint, DashboardStats } from '@/types'

export async function dashboardStats() {
  return unwrap<DashboardStats>(api.get('/dashboard/stats'))
}

export async function dashboardChart(): Promise<ChartPoint[]> {
  const raw = await unwrap<unknown>(api.get('/dashboard/chart'))
  return normalizeChartRows(raw)
}

/** Acepta arrays o objetos con distintas formas; unifica `date` + `revenue` numérico */
function normalizeChartRows(raw: unknown): ChartPoint[] {
  const rows = extractChartArray(raw)
  const out: ChartPoint[] = []
  for (const item of rows) {
    if (!item || typeof item !== 'object') continue
    const r = item as Record<string, unknown>
    const dateVal = r.date ?? r.fecha ?? r.day ?? r.dia ?? r.label
    let date = dateVal != null ? String(dateVal).trim() : ''
    if (date.includes('T')) date = date.slice(0, 10)
    const revRaw =
      r.revenue ??
      r.total ??
      r.ingresos ??
      r.amount ??
      r.value ??
      r.totalRevenue ??
      r.todayRevenue
    const revenue = coerceMoneyNumber(revRaw)
    if (!date) continue
    out.push({ date, revenue })
  }
  return out.sort((a, b) => a.date.localeCompare(b.date))
}

function extractChartArray(raw: unknown): unknown[] {
  if (Array.isArray(raw)) return raw
  if (raw && typeof raw === 'object') {
    const o = raw as Record<string, unknown>
    if (Array.isArray(o.data)) return o.data
    if (Array.isArray(o.points)) return o.points
    if (Array.isArray(o.series)) return o.series
    if (Array.isArray(o.items)) return o.items
  }
  return []
}

/** Fecha local YYYY-MM-DD (igual criterio que “hoy” del usuario en tarjetas) */
export function localTodayISODate(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/**
 * El gráfico suele traer serie por días; si viene vacío o con otros nombres de campo,
 * usamos los ingresos de hoy de `/dashboard/stats` para que coincida con la tarjeta.
 */
export function mergeChartWithTodayStats(
  points: ChartPoint[],
  stats: DashboardStats,
): ChartPoint[] {
  const map = new Map<string, number>()
  for (const p of points) {
    const d = (p.date || '').slice(0, 10)
    if (!d) continue
    map.set(d, coerceMoneyNumber(p.revenue))
  }
  const today = localTodayISODate()
  const todayRev = coerceMoneyNumber(stats.todayRevenue)
  if (todayRev > 0) {
    map.set(today, todayRev)
  }
  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, revenue]) => ({ date, revenue }))
}
