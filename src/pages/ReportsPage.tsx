import { useMemo, useState, type ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import * as reportsApi from '@/api/reports'
import { useAuth } from '@/context/AuthContext'
import { canAccessModule } from '@/lib/permissions'
import {
  aggregateByCategory,
  extractWeeklySeries,
  getClientsRankingBars,
  getInventoryDistribution,
  getPointsSeries,
  getSalesTrendBars,
  getTopProductsBars,
  summarizeClientsLike,
  summarizeSalesFromApi,
} from '@/lib/reportsAdapter'
import { chartColors, extractRows } from '@/lib/reportParsers'
import { formatMoney } from '@/lib/utils'
import {
  BarChart3,
  DollarSign,
  Download,
  FileDown,
  Package,
  TrendingUp,
  Users,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Select } from '@/components/ui/Select'
import { Spinner } from '@/components/ui/Spinner'

type MainTab = 'sales' | 'products' | 'clients'

const PERIOD_LABEL: Record<reportsApi.ReportPeriod, string> = {
  today: 'Hoy',
  week: 'Esta semana',
  month: 'Este mes',
  quarter: 'Este trimestre',
  custom: 'Personalizado',
}

export function ReportsPage() {
  const { user } = useAuth()
  const canSee = canAccessModule(user, 'reports')
  const [tab, setTab] = useState<MainTab>('sales')
  const [period, setPeriod] = useState<reportsApi.ReportPeriod>('month')

  const salesQ = useQuery({
    queryKey: ['report-sales', period],
    queryFn: () => reportsApi.reportSales({ period }),
    enabled: canSee,
  })
  const salesWeekQ = useQuery({
    queryKey: ['report-sales', 'week'],
    queryFn: () => reportsApi.reportSales({ period: 'week' }),
    enabled: canSee,
  })
  const topQ = useQuery({
    queryKey: ['report-top', period],
    queryFn: () => reportsApi.reportTopProducts({ period }),
    enabled: canSee,
  })
  const clientsQ = useQuery({
    queryKey: ['report-clients', period],
    queryFn: () => reportsApi.reportClients({ period }),
    enabled: canSee,
  })
  const inventoryQ = useQuery({
    queryKey: ['report-inv'],
    queryFn: reportsApi.reportInventory,
    enabled: canSee,
  })
  const pointsQ = useQuery({
    queryKey: ['report-points', period],
    queryFn: () => reportsApi.reportPoints({ period }),
    enabled: canSee,
  })

  const salesSummary = useMemo(
    () => summarizeSalesFromApi(salesQ.data),
    [salesQ.data],
  )
  const clientsSummary = useMemo(
    () => summarizeClientsLike(clientsQ.data),
    [clientsQ.data],
  )

  const barSeries = useMemo(
    () => getSalesTrendBars(salesQ.data),
    [salesQ.data],
  )
  const hasMeta = barSeries.some((x) => x.meta != null && x.meta > 0)

  const categoryPie = useMemo(
    () => aggregateByCategory(topQ.data),
    [topQ.data],
  )
  const weeklyLine = useMemo(
    () => extractWeeklySeries(salesWeekQ.data),
    [salesWeekQ.data],
  )
  const topProductsHBar = useMemo(
    () => getTopProductsBars(topQ.data, 10),
    [topQ.data],
  )
  const clientsBars = useMemo(
    () => getClientsRankingBars(clientsQ.data, 12),
    [clientsQ.data],
  )
  const pointsSeries = useMemo(
    () => getPointsSeries(pointsQ.data),
    [pointsQ.data],
  )
  const inventoryBars = useMemo(
    () => getInventoryDistribution(inventoryQ.data),
    [inventoryQ.data],
  )

  const secondaryLineData = useMemo(() => {
    if (pointsSeries.length > 0) return pointsSeries.map((p) => ({
      label: p.label,
      value: p.value,
    }))
    if (weeklyLine.length > 0)
      return weeklyLine.map((w) => ({
        label: w.label,
        value: w.ventas,
      }))
    return barSeries.map((b) => ({
      label: b.label,
      value: b.ventas,
    }))
  }, [pointsSeries, weeklyLine, barSeries])

  const secondaryTitle =
    pointsSeries.length > 0
      ? 'Puntos / fidelización'
      : weeklyLine.length > 0
        ? 'Ventas por día (semana)'
        : 'Tendencia (línea)'
  const secondarySubtitle =
    pointsSeries.length > 0
      ? 'Datos de GET /reports/points'
      : weeklyLine.length > 0
        ? 'GET /reports/sales?period=week'
        : 'Misma serie que las barras cuando no hay otros datos'

  async function downloadCsv() {
    try {
      const blob = await reportsApi.exportCsv({ period })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `reporte-${period}.csv`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      alert('No se pudo exportar CSV')
    }
  }

  function exportPdf() {
    window.print()
  }

  if (!canSee) {
    return (
      <Card>
        <p className="text-slate-600">No tienes acceso a reportes.</p>
      </Card>
    )
  }

  const loadingKpi = salesQ.isPending || clientsQ.isPending

  return (
    <div className="reports-print space-y-6 print:space-y-4" id="reportes-root">
      <div className="flex flex-col gap-4 print:hidden lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Reportes</h1>
          <p className="text-sm text-slate-500">
            Análisis y estadísticas del negocio
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select
            className="w-44 min-w-[11rem]"
            value={period}
            onChange={(e) =>
              setPeriod(e.target.value as reportsApi.ReportPeriod)
            }
            aria-label="Período"
          >
            {(Object.keys(PERIOD_LABEL) as reportsApi.ReportPeriod[])
              .filter((p) => p !== 'custom')
              .map((p) => (
                <option key={p} value={p}>
                  {PERIOD_LABEL[p]}
                </option>
              ))}
          </Select>
          <Button type="button" variant="secondary" onClick={exportPdf}>
            <FileDown className="size-4" />
            Exportar PDF
          </Button>
          <Button type="button" variant="secondary" onClick={() => void downloadCsv()}>
            <Download className="size-4" />
            Exportar CSV
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          icon={<DollarSign className="size-5 text-white" />}
          iconBg="bg-emerald-600"
          label={`Ventas (${PERIOD_LABEL[period].toLowerCase()})`}
          value={formatMoney(salesSummary.totalRevenue)}
          loading={loadingKpi}
        />
        <KpiCard
          icon={<TrendingUp className="size-5 text-white" />}
          iconBg="bg-teal-600"
          label="Ticket promedio"
          value={formatMoney(salesSummary.avgTicket)}
          loading={loadingKpi}
        />
        <KpiCard
          icon={<Package className="size-5 text-white" />}
          iconBg="bg-sky-600"
          label="Transacciones"
          value={
            loadingKpi ? '…' : String(salesSummary.transactions || '—')
          }
          loading={loadingKpi}
        />
        <KpiCard
          icon={<Users className="size-5 text-white" />}
          iconBg="bg-amber-500"
          label="Clientes (registros)"
          value={
            loadingKpi ? '…' : String(clientsSummary.activeClients || '—')
          }
          loading={loadingKpi}
        />
      </div>

      {/* Pestañas principales */}
      <div className="flex flex-wrap gap-2 print:hidden">
        <TabBtn
          active={tab === 'sales'}
          onClick={() => setTab('sales')}
          icon={<BarChart3 className="size-4" />}
        >
          Ventas
        </TabBtn>
        <TabBtn
          active={tab === 'products'}
          onClick={() => setTab('products')}
          icon={<Package className="size-4" />}
        >
          Productos
        </TabBtn>
        <TabBtn
          active={tab === 'clients'}
          onClick={() => setTab('clients')}
          icon={<Users className="size-4" />}
        >
          Clientes
        </TabBtn>
      </div>

      {tab === 'sales' && (
        <div className="grid gap-6 lg:grid-cols-2">
          <ChartCard
            title={
              hasMeta
                ? 'Ventas vs meta'
                : 'Ventas por período'
            }
            subtitle={
              hasMeta
                ? 'Comparación con objetivos si el API los envía'
                : 'Desglose según datos devueltos por el servidor'
            }
          >
            {salesQ.isPending ? (
              <ChartLoading />
            ) : barSeries.length === 0 ? (
              <EmptyChart hint="No se encontró ninguna lista o serie en la respuesta de /reports/sales. Revisa en el backend que el JSON incluya totales o un array (p. ej. por día o por mes)." />
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={barSeries} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip
                    formatter={(v) => [formatMoney(Number(v)), 'Monto']}
                  />
                  <Legend />
                  <Bar dataKey="ventas" name="Ventas" fill="#10b981" radius={[4, 4, 0, 0]} />
                  {hasMeta ? (
                    <Bar dataKey="meta" name="Meta" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  ) : null}
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartCard>

          <ChartCard title={secondaryTitle} subtitle={secondarySubtitle}>
            {secondaryLineData.length === 0 ? (
              <EmptyChart hint="Sin datos para línea o puntos en este período." />
            ) : pointsSeries.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart
                  data={secondaryLineData}
                  margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="report-points-area" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v) => [String(v), 'Puntos']} />
                  <Area
                    type="monotone"
                    dataKey="value"
                    name="Valor"
                    stroke="#059669"
                    fill="url(#report-points-area)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <LineChart
                  data={secondaryLineData}
                  margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v) => [formatMoney(Number(v)), 'Monto']} />
                  <Line
                    type="monotone"
                    dataKey="value"
                    name="Ventas"
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={{ r: 4, fill: '#10b981' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </ChartCard>
        </div>
      )}

      {tab === 'products' && (
        <div className="grid gap-6">
          <ChartCard
            title="Productos más vendidos"
            subtitle="Respuesta de GET /reports/top-products (nombre + importe/cantidad)"
          >
            {topQ.isPending ? (
              <ChartLoading />
            ) : topProductsHBar.length === 0 ? (
              <EmptyChart hint="No hay filas reconocibles en top productos." />
            ) : (
              <ResponsiveContainer width="100%" height={Math.min(420, 40 + topProductsHBar.length * 36)}>
                <BarChart
                  layout="vertical"
                  data={topProductsHBar}
                  margin={{ top: 8, right: 16, left: 8, bottom: 8 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} className="stroke-slate-200" />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={132}
                    tick={{ fontSize: 10 }}
                  />
                  <Tooltip formatter={(v) => [formatMoney(Number(v)), 'Valor']} />
                  <Bar dataKey="value" fill="#10b981" radius={[0, 4, 4, 0]} name="Valor" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartCard>

          <div className="grid gap-6 lg:grid-cols-2">
          <ChartCard
            title="Ventas por categoría"
            subtitle="Agrupación por categoría en top productos"
          >
            {topQ.isPending ? (
              <ChartLoading />
            ) : categoryPie.length === 0 ? (
              <EmptyChart hint="No hay categorías en los datos de productos más vendidos." />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={categoryPie}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={68}
                    outerRadius={96}
                    paddingAngle={2}
                  >
                    {categoryPie.map((_, i) => (
                      <Cell key={i} fill={chartColors(i)} stroke="transparent" />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v) => [formatMoney(Number(v)), 'Monto']}
                  />
                  <Legend layout="horizontal" verticalAlign="bottom" />
                </PieChart>
              </ResponsiveContainer>
            )}
          </ChartCard>

          <ChartCard
            title="Ventas de la semana"
            subtitle="Tendencia diaria (reporte semanal)"
          >
            {salesWeekQ.isPending ? (
              <ChartLoading />
            ) : weeklyLine.length === 0 ? (
              <EmptyChart hint="Sin puntos diarios en el reporte semanal; prueba otro período o revisa el formato del API." />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={weeklyLine} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip
                    formatter={(v) => [formatMoney(Number(v)), 'Monto']}
                  />
                  <Line
                    type="monotone"
                    dataKey="ventas"
                    name="Ventas"
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={{ r: 4, fill: '#10b981' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </ChartCard>
          </div>

          <ChartCard
            title="Inventario"
            subtitle="Distribución por categoría o grupo si el JSON incluye filas con stock"
          >
            {inventoryQ.isPending ? (
              <div className="flex justify-center py-12">
                <Spinner />
              </div>
            ) : inventoryQ.isError ? (
              <p className="text-sm text-red-600">
                {inventoryQ.error instanceof Error
                  ? inventoryQ.error.message
                  : 'Error'}
              </p>
            ) : inventoryBars.length === 0 ? (
              <pre className="max-h-48 overflow-auto rounded-lg bg-slate-50 p-4 text-xs text-slate-700">
                {JSON.stringify(inventoryQ.data, null, 2)}
              </pre>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={inventoryBars} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200" />
                  <XAxis dataKey="label" tick={{ fontSize: 10 }} interval={0} angle={-25} height={60} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v) => [Number(v), 'Cantidad']} />
                  <Bar dataKey="value" fill="#0ea5e9" name="Cantidad" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartCard>
        </div>
      )}

      {tab === 'clients' && (
        <div className="grid gap-6">
          <ChartCard
            title="Ranking de clientes"
            subtitle="Campos numéricos típicos: total comprado, puntos, pedidos…"
          >
            {clientsQ.isPending ? (
              <ChartLoading />
            ) : clientsBars.length === 0 ? (
              <EmptyChart hint="No se pudieron extraer filas de GET /reports/clients. Abre “JSON” abajo para ver la forma real." />
            ) : (
              <ResponsiveContainer width="100%" height={Math.min(400, 36 + clientsBars.length * 36)}>
                <BarChart
                  layout="vertical"
                  data={clientsBars}
                  margin={{ top: 8, right: 16, left: 8, bottom: 8 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} className="stroke-slate-200" />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="label" width={120} tick={{ fontSize: 10 }} />
                  <Tooltip formatter={(v) => [formatMoney(Number(v)), 'Valor']} />
                  <Bar dataKey="value" fill="#f59e0b" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartCard>
          <ChartCard title="Detalle (filas)" subtitle="GET /reports/clients">
            {clientsQ.isPending ? (
              <ChartLoading />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[520px] text-left text-sm">
                  <thead className="border-b border-slate-200 text-xs uppercase text-slate-500">
                    <tr>
                      <th className="pb-2 pr-4 font-medium">#</th>
                      <th className="pb-2 pr-4 font-medium">Campos</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {extractRows(clientsQ.data).length === 0 ? (
                      <tr>
                        <td colSpan={2} className="py-8 text-center text-slate-500">
                          Sin filas reconocibles.
                        </td>
                      </tr>
                    ) : (
                      extractRows(clientsQ.data).slice(0, 15).map((row, i) => (
                        <tr key={i}>
                          <td className="py-2 text-slate-400">{i + 1}</td>
                          <td className="py-2 font-mono text-xs text-slate-700">
                            {Object.entries(row)
                              .slice(0, 8)
                              .map(([k, v]) => `${k}: ${String(v)}`)
                              .join(' · ')}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
            {!clientsQ.isPending && (
              <details className="mt-4">
                <summary className="cursor-pointer text-xs text-emerald-700">
                  Ver JSON completo
                </summary>
                <pre className="mt-2 max-h-48 overflow-auto rounded-lg bg-slate-50 p-3 text-xs">
                  {JSON.stringify(clientsQ.data, null, 2)}
                </pre>
              </details>
            )}
          </ChartCard>
        </div>
      )}
    </div>
  )
}

function KpiCard({
  icon,
  iconBg,
  label,
  value,
  loading,
}: {
  icon: ReactNode
  iconBg: string
  label: string
  value: string
  loading?: boolean
}) {
  return (
    <Card className="flex gap-4 py-5">
      <div
        className={`flex size-12 shrink-0 items-center justify-center rounded-xl ${iconBg}`}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
          {label}
        </p>
        <p className="mt-1 truncate text-xl font-semibold text-slate-900">
          {loading ? <Spinner className="size-6" /> : value}
        </p>
      </div>
    </Card>
  )
}

function TabBtn({
  active,
  onClick,
  icon,
  children,
}: {
  active: boolean
  onClick: () => void
  icon: ReactNode
  children: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
        active
          ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/25'
          : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50'
      }`}
    >
      {icon}
      {children}
    </button>
  )
}

function ChartCard({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle: string
  children: ReactNode
}) {
  return (
    <Card className="min-h-[320px]">
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>
      <div className="mt-4">{children}</div>
    </Card>
  )
}

function ChartLoading() {
  return (
    <div className="flex h-[280px] items-center justify-center">
      <Spinner className="size-8" />
    </div>
  )
}

function EmptyChart({ hint }: { hint: string }) {
  return (
    <div className="flex h-[280px] flex-col items-center justify-center px-4 text-center">
      <p className="text-sm text-slate-500">{hint}</p>
    </div>
  )
}
