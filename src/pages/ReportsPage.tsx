import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import * as reportsApi from '@/api/reports'
import { useAuth } from '@/context/AuthContext'
import { canAccessModule } from '@/lib/permissions'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Select } from '@/components/ui/Select'
import { Spinner } from '@/components/ui/Spinner'

type Tab = 'sales' | 'top' | 'inventory' | 'clients' | 'points'

export function ReportsPage() {
  const { user } = useAuth()
  const canSee = canAccessModule(user, 'reports')
  const [tab, setTab] = useState<Tab>('sales')
  const [period, setPeriod] = useState<reportsApi.ReportPeriod>('month')

  const salesQ = useQuery({
    queryKey: ['report-sales', period],
    queryFn: () => reportsApi.reportSales({ period }),
    enabled: canSee && tab === 'sales',
  })
  const topQ = useQuery({
    queryKey: ['report-top', period],
    queryFn: () => reportsApi.reportTopProducts({ period }),
    enabled: canSee && tab === 'top',
  })
  const invQ = useQuery({
    queryKey: ['report-inv'],
    queryFn: reportsApi.reportInventory,
    enabled: canSee && tab === 'inventory',
  })
  const clientsQ = useQuery({
    queryKey: ['report-clients', period],
    queryFn: () => reportsApi.reportClients({ period }),
    enabled: canSee && tab === 'clients',
  })
  const pointsQ = useQuery({
    queryKey: ['report-points', period],
    queryFn: () => reportsApi.reportPoints({ period }),
    enabled: canSee && tab === 'points',
  })

  if (!canSee) {
    return (
      <Card>
        <p className="text-slate-600">No tienes acceso a reportes.</p>
      </Card>
    )
  }

  const activeQ =
    tab === 'sales'
      ? salesQ
      : tab === 'top'
        ? topQ
        : tab === 'inventory'
          ? invQ
          : tab === 'clients'
            ? clientsQ
            : pointsQ

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

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Reportes</h1>
          <p className="text-sm text-slate-500">Agregados según el período</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="w-40">
            <Select
              value={period}
              onChange={(e) =>
                setPeriod(e.target.value as reportsApi.ReportPeriod)
              }
            >
              <option value="today">Hoy</option>
              <option value="week">Semana</option>
              <option value="month">Mes</option>
              <option value="quarter">Trimestre</option>
            </Select>
          </div>
          <Button type="button" variant="secondary" onClick={() => void downloadCsv()}>
            Exportar CSV
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {(
          [
            ['sales', 'Ventas'],
            ['top', 'Top productos'],
            ['inventory', 'Inventario'],
            ['clients', 'Clientes'],
            ['points', 'Puntos'],
          ] as const
        ).map(([k, label]) => (
          <button
            key={k}
            type="button"
            onClick={() => setTab(k)}
            className={`rounded-lg px-3 py-2 text-sm font-medium ${
              tab === k
                ? 'bg-emerald-600 text-white'
                : 'bg-white text-slate-600 ring-1 ring-slate-200'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <Card>
        {activeQ.isPending ? (
          <div className="flex justify-center py-16">
            <Spinner className="size-8" />
          </div>
        ) : activeQ.isError ? (
          <p className="text-red-600">
            {activeQ.error instanceof Error ? activeQ.error.message : 'Error'}
          </p>
        ) : (
          <pre className="max-h-[480px] overflow-auto rounded-lg bg-slate-50 p-4 text-xs text-slate-800">
            {JSON.stringify(activeQ.data, null, 2)}
          </pre>
        )}
      </Card>
    </div>
  )
}
