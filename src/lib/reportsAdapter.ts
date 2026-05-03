import { coerceMoneyNumber } from '@/lib/utils'
import {
  aggregateByCategory,
  extractRows,
  extractTimeSeries,
  extractWeeklySeries,
  pickNum,
  pickStr,
  summarizeClientsLike,
  summarizeSalesLike,
} from '@/lib/reportParsers'

export type TrendBar = { label: string; ventas: number; meta?: number }

/** KPIs leyendo también objetos `summary` / `totals` anidados */
export function summarizeSalesFromApi(data: unknown) {
  const direct = summarizeSalesLike(data)
  if (direct.totalRevenue > 0 || direct.transactions > 0) return direct

  const root = data && typeof data === 'object' ? (data as Record<string, unknown>) : {}
  for (const key of ['summary', 'totals', 'aggregate', 'stats', 'overview']) {
    const block = root[key]
    if (block && typeof block === 'object') {
      const s = summarizeSalesLike(block)
      if (s.totalRevenue > 0 || s.transactions > 0) return s
    }
  }
  return direct
}

/** Barras / serie temporal: claves anidadas + barrido de arrays en el JSON */
export function getSalesTrendBars(data: unknown): TrendBar[] {
  const fromParser = extractTimeSeries(data)
  if (fromParser.length > 0) return fromParser

  const arrays = collectObjectArrays(data, 0)
  let best: unknown[] | null = null
  let bestScore = -1
  for (const arr of arrays) {
    const sc = scoreArrayAsTrend(arr)
    if (sc > bestScore) {
      bestScore = sc
      best = arr
    }
  }
  if (best && best.length > 0) {
    const mapped = (best as Record<string, unknown>[])
      .map(mapRowToTrend)
      .filter((x): x is TrendBar => x !== null)
    if (mapped.length > 0) return mapped
  }
  return []
}

function collectObjectArrays(node: unknown, depth: number): unknown[][] {
  if (depth > 14) return []
  const out: unknown[][] = []
  if (Array.isArray(node)) {
    if (
      node.length > 0 &&
      typeof node[0] === 'object' &&
      node[0] !== null &&
      !Array.isArray(node[0])
    ) {
      out.push(node)
    }
    return out
  }
  if (node && typeof node === 'object' && !Array.isArray(node)) {
    for (const v of Object.values(node as Record<string, unknown>)) {
      out.push(...collectObjectArrays(v, depth + 1))
    }
  }
  return out
}

function scoreArrayAsTrend(arr: unknown[]): number {
  if (arr.length < 1) return -1
  const row = arr[0] as Record<string, unknown>
  if (!row || typeof row !== 'object') return -1
  let nums = 0
  let dateLike = false
  for (const [k, v] of Object.entries(row)) {
    if (/date|fecha|dia|day|period|month|label|name|weekday/i.test(k)) {
      dateLike = true
    }
    if (typeof v === 'number' && Number.isFinite(v)) nums++
    else if (coerceMoneyNumber(v) !== 0 || v === 0) nums++
  }
  return arr.length + nums * 3 + (dateLike ? 8 : 0)
}

function mapRowToTrend(row: Record<string, unknown>): TrendBar | null {
  const label =
    pickStr(row, [
      'date',
      'fecha',
      'dia',
      'day',
      'period',
      'month',
      'label',
      'name',
      'weekday',
      'bucket',
    ]) || ''
  const ventas = pickNum(row, [
    'revenue',
    'total',
    'amount',
    'ventas',
    'value',
    'sales',
    'ingresos',
    'totalAmount',
    'sum',
  ])
  const meta = pickNum(row, ['goal', 'meta', 'target', 'budget', 'objetivo'])
  const short = shortenDateLabel(label)
  if (!short && ventas === 0 && meta === 0) return null
  return {
    label: short || '—',
    ventas,
    meta: meta > 0 ? meta : undefined,
  }
}

function shortenDateLabel(label: string): string {
  const mNames = [
    'Ene',
    'Feb',
    'Mar',
    'Abr',
    'May',
    'Jun',
    'Jul',
    'Ago',
    'Sep',
    'Oct',
    'Nov',
    'Dic',
  ]
  const dayShort = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
  if (/^\d{4}-\d{2}-\d{2}/.test(label)) {
    const d = new Date(label)
    if (!Number.isNaN(d.getTime())) return dayShort[d.getDay()] ?? label.slice(5)
  }
  if (/^\d{4}-\d{2}/.test(label)) {
    const d = new Date(label)
    if (!Number.isNaN(d.getTime())) return mNames[d.getMonth()] ?? label
  }
  return label
}

/** Top N productos por importe o cantidad (top-products) */
export function getTopProductsBars(
  data: unknown,
  limit = 10,
): { name: string; value: number }[] {
  const rows = extractRows(data)
  const list: { name: string; value: number }[] = []
  for (const r of rows) {
    const prod =
      r.product && typeof r.product === 'object'
        ? (r.product as Record<string, unknown>)
        : null
    const name =
      pickStr(r, [
        'commercialName',
        'productName',
        'name',
        'nombre',
        'sku',
      ]) || pickStr(prod || {}, ['commercialName', 'name'])
    const value = pickNum(r, [
      'revenue',
      'total',
      'amount',
      'totalAmount',
      'value',
      'quantitySold',
      'quantity',
      'qty',
      'units',
    ])
    if (name || value > 0) {
      list.push({ name: name || 'Producto', value: value > 0 ? value : 1 })
    }
  }
  return list
    .sort((a, b) => b.value - a.value)
    .slice(0, limit)
}

/** Barras horizontales de clientes (ranking) */
export function getClientsRankingBars(
  data: unknown,
  limit = 12,
): { label: string; value: number }[] {
  const rows = extractRows(data)
  const out: { label: string; value: number }[] = []
  for (const r of rows) {
    const label =
      pickStr(r, [
        'name',
        'nombre',
        'clientName',
        'fullName',
        'customerName',
      ]) || pickStr(
        (r.client as Record<string, unknown>) || {},
        ['name', 'nombre'],
      )
    const value = pickNum(r, [
      'totalSpent',
      'totalPurchases',
      'total',
      'revenue',
      'amount',
      'purchases',
      'ordersCount',
      'points',
      'visitCount',
    ])
    if (label || value > 0)
      out.push({ label: label || 'Cliente', value: value > 0 ? value : 1 })
  }
  return out
    .sort((a, b) => b.value - a.value)
    .slice(0, limit)
}

/** Serie simple para /reports/points */
export function getPointsSeries(
  data: unknown,
): { label: string; value: number }[] {
  const rows = extractRows(data)
  const direct = rows
    .map((r) => {
      const label =
        pickStr(r, [
          'period',
          'month',
          'date',
          'label',
          'name',
          'tier',
        ]) || ''
      const value = pickNum(r, [
        'points',
        'totalPoints',
        'amount',
        'value',
        'count',
      ])
      if (!label && !value) return null
      return { label: label || '—', value }
    })
    .filter((x): x is { label: string; value: number } => x !== null)
  if (direct.length > 0) return direct

  const flat =
    data && typeof data === 'object' ? (data as Record<string, unknown>) : {}
  const single = pickNum(flat, [
    'totalPoints',
    'points',
    'sum',
    'redeemed',
    'issued',
  ])
  if (single > 0) return [{ label: 'Total', value: single }]
  return []
}

/** Inventario: barras por categoría o estado si hay números */
export function getInventoryDistribution(data: unknown): {
  label: string
  value: number
}[] {
  const rows = extractRows(data)
  const byCat = new Map<string, number>()
  for (const r of rows) {
    const cat =
      pickStr(r, ['category', 'categoria', 'status', 'estado']) ||
      'Sin grupo'
    const v = pickNum(r, [
      'currentStock',
      'stock',
      'quantity',
      'count',
      'value',
    ])
    byCat.set(cat, (byCat.get(cat) ?? 0) + (v || 1))
  }
  return [...byCat.entries()]
    .map(([label, value]) => ({ label, value }))
    .filter((x) => x.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, 12)
}

export {
  aggregateByCategory,
  extractWeeklySeries,
  summarizeClientsLike,
}
