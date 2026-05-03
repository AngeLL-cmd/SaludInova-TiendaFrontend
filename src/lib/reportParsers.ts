import { coerceMoneyNumber } from '@/lib/utils'

const ARRAY_KEYS = [
  'data',
  'items',
  'sales',
  'rows',
  'results',
  'records',
  'products',
  'clients',
  'byMonth',
  'series',
  'dailyBreakdown',
  'salesByDay',
  'byDay',
  'dailySales',
  'timeline',
  'ventas',
  'ranking',
  'list',
  'breakdown',
  'details',
  'topProducts',
  'perDay',
  'byDate',
  'chart',
  'points',
  'report',
]

/** Extrae arrays típicos de respuestas de reporte y un nivel anidado */
export function extractRows(data: unknown): Record<string, unknown>[] {
  if (Array.isArray(data)) return data as Record<string, unknown>[]
  if (!data || typeof data !== 'object') return []
  const o = data as Record<string, unknown>
  for (const k of ARRAY_KEYS) {
    const arr = o[k]
    if (Array.isArray(arr)) return arr as Record<string, unknown>[]
  }
  for (const wrap of ['summary', 'result', 'payload', 'report']) {
    const inner = o[wrap]
    if (inner && typeof inner === 'object' && !Array.isArray(inner)) {
      const innerObj = inner as Record<string, unknown>
      for (const k of ARRAY_KEYS) {
        const arr = innerObj[k]
        if (Array.isArray(arr)) return arr as Record<string, unknown>[]
      }
    }
  }
  return []
}

export function pickNum(row: Record<string, unknown>, keys: string[]): number {
  for (const k of keys) {
    if (!(k in row)) continue
    const n = coerceMoneyNumber(row[k])
    if (n !== 0 || row[k] === 0) return n
  }
  return 0
}

export function pickStr(row: Record<string, unknown>, keys: string[]): string {
  for (const k of keys) {
    const v = row[k]
    if (v != null && String(v).trim() !== '') return String(v).trim()
  }
  return ''
}

/** Totales para tarjetas KPI */
export function summarizeSalesLike(data: unknown): {
  totalRevenue: number
  transactions: number
  avgTicket: number
} {
  const rows = extractRows(data)
  let total = 0
  for (const r of rows) {
    total += pickNum(r, [
      'total',
      'amount',
      'revenue',
      'totalAmount',
      'saleTotal',
      'value',
      'subtotal',
    ])
  }
  let transactions = rows.length
  const flat =
    data && typeof data === 'object' ? (data as Record<string, unknown>) : {}
  if (rows.length === 0) {
    total = pickNum(flat, [
      'totalRevenue',
      'total',
      'revenue',
      'amount',
      'sum',
      'grandTotal',
    ])
    transactions = Math.trunc(
      pickNum(flat, [
        'transactions',
        'count',
        'todaySales',
        'totalSales',
        'salesCount',
      ]) || (total > 0 ? 1 : 0),
    )
  }
  const avgTicket =
    transactions > 0 && total > 0
      ? total / transactions
      : pickNum(flat, ['averageTicket', 'avgTicket', 'ticketAverage'])
  return {
    totalRevenue: total,
    transactions: Math.max(transactions, 0),
    avgTicket: Number.isFinite(avgTicket) ? avgTicket : 0,
  }
}

export function summarizeClientsLike(data: unknown): {
  activeClients: number
  totalRevenue?: number
} {
  const rows = extractRows(data)
  if (rows.length > 0) {
    return { activeClients: rows.length }
  }
  const o = (data && typeof data === 'object' ? data : {}) as Record<
    string,
    unknown
  >
  const n = Math.trunc(
    pickNum(o, ['total', 'count', 'activeClients', 'clientsCount']) || 0,
  )
  return { activeClients: n }
}

/** Puntos para gráfico de barras por etiqueta temporal */
export function extractTimeSeries(
  data: unknown,
): { label: string; ventas: number; meta?: number }[] {
  const rows = extractRows(data)
  const out: { label: string; ventas: number; meta?: number }[] = []
  const monthNames = [
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

  for (const r of rows) {
    const label =
      pickStr(r, [
        'label',
        'month',
        'period',
        'name',
        'date',
        'day',
        'weekday',
      ]) || ''
    const ventas = pickNum(r, [
      'total',
      'revenue',
      'amount',
      'sales',
      'value',
      'ventas',
    ])
    const meta = pickNum(r, ['goal', 'meta', 'target', 'budget'])
    if (label || ventas || meta) {
      let short = label
      if (/^\d{4}-\d{2}/.test(label)) {
        const d = new Date(label)
        if (!Number.isNaN(d.getTime())) {
          short = monthNames[d.getMonth()] ?? label.slice(0, 7)
        }
      }
      out.push({
        label: short || '—',
        ventas,
        meta: meta || undefined,
      })
    }
  }

  if (out.length > 0) return out

  const o = data as Record<string, unknown> | null
  if (o && typeof o === 'object') {
    for (const k of ['byMonth', 'monthly', 'perMonth']) {
      const block = o[k]
      if (block && typeof block === 'object' && !Array.isArray(block)) {
        const entries = Object.entries(block as Record<string, unknown>)
        for (const [key, val] of entries) {
          const ventas =
            typeof val === 'number'
              ? val
              : coerceMoneyNumber(
                  (val as Record<string, unknown>)?.total ??
                    (val as Record<string, unknown>)?.revenue,
                )
          let short = key
          if (/^\d{4}-\d{2}/.test(key)) {
            const d = new Date(key)
            if (!Number.isNaN(d.getTime())) short = monthNames[d.getMonth()] ?? key
          }
          out.push({ label: short, ventas })
        }
        if (out.length) return out
      }
    }
  }

  return out
}

/** Agrega top productos por categoría para donut */
export function aggregateByCategory(
  data: unknown,
): { name: string; value: number }[] {
  const rows = extractRows(data)
  const map = new Map<string, number>()
  for (const r of rows) {
    const prod =
      r.product && typeof r.product === 'object'
        ? (r.product as Record<string, unknown>)
        : null
    const cat =
      pickStr(r, [
        'category',
        'categoria',
        'categoryName',
        'tipo',
        'group',
      ]) ||
      pickStr(prod || {}, ['category', 'categoria']) ||
      'Sin categoría'
    const qty = pickNum(r, [
      'quantitySold',
      'quantity',
      'qty',
      'units',
      'totalQuantity',
    ])
    const rev = pickNum(r, [
      'revenue',
      'total',
      'amount',
      'totalAmount',
      'value',
    ])
    const value = rev > 0 ? rev : qty
    map.set(cat, (map.get(cat) ?? 0) + (value || 1))
  }
  return [...map.entries()]
    .map(([name, value]) => ({ name, value }))
    .filter((x) => x.value > 0)
    .sort((a, b) => b.value - a.value)
}

/** Serie semanal (día → valor) */
export function extractWeeklySeries(
  data: unknown,
): { label: string; ventas: number }[] {
  const rows = extractRows(data)
  const dayShort = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
  const out: { label: string; ventas: number }[] = []

  for (const r of rows) {
    const label =
      pickStr(r, ['weekday', 'day', 'label', 'name', 'date']) || ''
    const ventas = pickNum(r, [
      'total',
      'revenue',
      'amount',
      'sales',
      'value',
    ])
    let short = label
    if (/^\d{4}-\d{2}-\d{2}/.test(label)) {
      const d = new Date(label)
      if (!Number.isNaN(d.getTime())) short = dayShort[d.getDay()] ?? label
    }
    if (label || ventas) out.push({ label: short || '—', ventas })
  }
  return out
}

const COLORS = ['#10b981', '#3b82f6', '#eab308', '#f97316', '#a855f7', '#ec4899']

export function chartColors(i: number) {
  return COLORS[i % COLORS.length]
}
