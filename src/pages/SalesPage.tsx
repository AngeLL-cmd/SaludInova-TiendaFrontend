import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import * as dashboardApi from '@/api/dashboard'
import * as salesApi from '@/api/sales'
import { useAuth } from '@/context/AuthContext'
import { canAccessModule } from '@/lib/permissions'
import { formatDate, formatMoney } from '@/lib/utils'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Spinner } from '@/components/ui/Spinner'

export function SalesPage() {
  const { user } = useAuth()
  const canSee = canAccessModule(user, 'sales')
  const [page, setPage] = useState(1)

  const listQ = useQuery({
    queryKey: ['sales', page],
    queryFn: () => salesApi.listSales({ page, limit: 15 }),
    enabled: canSee,
  })

  if (!canSee) {
    return (
      <Card>
        <p className="text-slate-600">No tienes acceso a ventas.</p>
      </Card>
    )
  }

  if (listQ.isPending) {
    return (
      <div className="flex justify-center py-20">
        <Spinner className="size-8" />
      </div>
    )
  }

  if (listQ.isError) {
    return (
      <Card className="text-red-600">
        {listQ.error instanceof Error ? listQ.error.message : 'Error'}
      </Card>
    )
  }

  const { items, pagination } = listQ.data!

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Ventas</h1>
          <p className="text-sm text-slate-500">Historial y detalle de comprobantes</p>
        </div>
        <Link to="/ventas/nueva">
          <Button type="button">Nueva venta</Button>
        </Link>
      </div>
      <SummaryCard />
      <Card className="overflow-x-auto p-0">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-slate-100 bg-slate-50/80 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3 font-medium">Número</th>
              <th className="px-4 py-3 font-medium">Fecha</th>
              <th className="px-4 py-3 font-medium">Total</th>
              <th className="px-4 py-3 font-medium">Cliente</th>
              <th className="px-4 py-3 font-medium text-right">Detalle</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.map((s) => (
              <tr key={s.id} className="hover:bg-slate-50/50">
                <td className="px-4 py-3 font-mono text-sm font-medium text-slate-900">
                  {s.saleNumber}
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {formatDate(s.createdAt)}
                </td>
                <td className="px-4 py-3 font-medium">{formatMoney(s.total)}</td>
                <td className="px-4 py-3 text-slate-600">
                  {s.client?.name ?? '—'}
                </td>
                <td className="px-4 py-3 text-right">
                  <Link to={`/ventas/${s.id}`}>
                    <Button type="button" variant="ghost" className="text-emerald-700">
                      Ver
                    </Button>
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 text-sm text-slate-600">
          <span>
            Página {pagination.page} / {pagination.totalPages}
          </span>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="secondary"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Anterior
            </Button>
            <Button
              type="button"
              variant="secondary"
              disabled={page >= pagination.totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Siguiente
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}

/** Misma fuente que el Panel (`/dashboard/stats`) para que los números coincidan.
 *  `/sales/summary/today` puede usar otro criterio de “hoy” (zona horaria) y desfasarse. */
function SummaryCard() {
  const q = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: dashboardApi.dashboardStats,
  })

  const dateLabel = new Date().toLocaleDateString('es-PE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })

  if (q.isPending) {
    return (
      <div className="grid gap-4 sm:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="h-[104px] animate-pulse bg-slate-100/80" />
        ))}
      </div>
    )
  }

  if (q.isError || !q.data) {
    return (
      <Card className="border-amber-200 bg-amber-50 text-sm text-amber-900">
        No se pudieron cargar las estadísticas del día. Intenta recargar la página.
      </Card>
    )
  }

  const s = q.data
  const sales = Number(s.todaySales)
  const revenue = Number(s.todayRevenue)
  const ticket = Number(s.averageTicket)

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <Card className="py-4">
        <p className="text-xs font-medium uppercase text-slate-500">Hoy</p>
        <p className="mt-1 text-2xl font-semibold text-slate-900">
          {Number.isFinite(sales) ? sales : 0}
        </p>
        <p className="text-xs text-slate-500">ventas</p>
      </Card>
      <Card className="py-4">
        <p className="text-xs font-medium uppercase text-slate-500">Ingresos</p>
        <p className="mt-1 text-2xl font-semibold text-slate-900">
          {formatMoney(Number.isFinite(revenue) ? revenue : 0)}
        </p>
      </Card>
      <Card className="py-4">
        <p className="text-xs font-medium uppercase text-slate-500">Ticket medio</p>
        <p className="mt-1 text-2xl font-semibold text-slate-900">
          {formatMoney(Number.isFinite(ticket) ? ticket : 0)}
        </p>
        <Badge tone="neutral" className="mt-1">
          {dateLabel}
        </Badge>
      </Card>
    </div>
  )
}
