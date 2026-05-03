import { useQuery } from '@tanstack/react-query'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import * as dashboardApi from '@/api/dashboard'
import { useAuth } from '@/context/AuthContext'
import { canAccessModule } from '@/lib/permissions'
import { formatMoney } from '@/lib/utils'
import { Card } from '@/components/ui/Card'
import { Spinner } from '@/components/ui/Spinner'

export function DashboardPage() {
  const { user } = useAuth()
  const allowed = canAccessModule(user, 'dashboard')

  const statsQ = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: dashboardApi.dashboardStats,
    enabled: allowed,
  })
  const chartQ = useQuery({
    queryKey: ['dashboard-chart'],
    queryFn: dashboardApi.dashboardChart,
    enabled: allowed,
  })

  if (!allowed) {
    return (
      <Card>
        <p className="text-slate-600">No tienes permiso para ver el panel.</p>
      </Card>
    )
  }

  if (statsQ.isPending) {
    return (
      <div className="flex justify-center py-20">
        <Spinner className="size-8" />
      </div>
    )
  }

  if (statsQ.isError) {
    return (
      <Card>
        <p className="text-red-600">
          {statsQ.error instanceof Error
            ? statsQ.error.message
            : 'Error al cargar estadísticas'}
        </p>
      </Card>
    )
  }

  const s = statsQ.data!
  const chartSeries = dashboardApi.mergeChartWithTodayStats(chartQ.data ?? [], s)

  const kpis = [
    { label: 'Ventas hoy', value: String(s.todaySales) },
    { label: 'Ingresos hoy', value: formatMoney(s.todayRevenue) },
    { label: 'Ticket promedio', value: formatMoney(s.averageTicket) },
    { label: 'Alertas', value: String(s.alertsCount) },
    { label: 'Críticas', value: String(s.criticalAlerts) },
    { label: 'Productos', value: String(s.totalProducts) },
    { label: 'Stock bajo', value: String(s.lowStockCount) },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Panel</h1>
        <p className="text-sm text-slate-500">
          Resumen operativo del día y tendencia de ingresos
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.slice(0, 4).map((k) => (
          <Card key={k.label} className="py-4">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              {k.label}
            </p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">{k.value}</p>
          </Card>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        {kpis.slice(4).map((k) => (
          <Card key={k.label} className="py-4">
            <p className="text-xs font-medium text-slate-500">{k.label}</p>
            <p className="mt-1 text-xl font-semibold text-slate-900">{k.value}</p>
          </Card>
        ))}
      </div>
      <Card className="min-h-[320px]">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-slate-900">
            Ingresos recientes
          </h2>
          {chartQ.isFetching && (
            <span className="text-xs text-slate-400">Actualizando serie…</span>
          )}
        </div>
        <div className="h-[260px] w-full">
          {chartQ.isPending ? (
            <div className="flex h-full items-center justify-center">
              <Spinner className="size-8" />
            </div>
          ) : chartSeries.length === 0 ? (
            <p className="flex h-full items-center justify-center text-sm text-slate-500">
              Aún no hay ingresos por día en el historial.
            </p>
          ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartSeries}>
              <defs>
                <linearGradient id="income-area-gradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11 }}
                tickFormatter={(v) =>
                  new Date(v).toLocaleDateString('es-PE', {
                    day: '2-digit',
                    month: 'short',
                  })
                }
              />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip
                formatter={(value) => [
                  formatMoney(Number(value)),
                  'Ingresos',
                ]}
                labelFormatter={(l) => formatDateLabel(String(l))}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#059669"
                fill="url(#income-area-gradient)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
          )}
        </div>
      </Card>
    </div>
  )
}

function formatDateLabel(iso: string) {
  try {
    return new Date(iso).toLocaleDateString('es-PE', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    })
  } catch {
    return iso
  }
}
