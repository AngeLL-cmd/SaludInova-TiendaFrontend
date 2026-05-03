import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import * as clientsApi from '@/api/clients'
import { useAuth } from '@/context/AuthContext'
import { canAccessModule } from '@/lib/permissions'
import { formatDate, formatMoney } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Spinner } from '@/components/ui/Spinner'

export function ClientDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const canSee = canAccessModule(user, 'clients')

  const clientQ = useQuery({
    queryKey: ['client', id],
    queryFn: () => clientsApi.getClient(id!),
    enabled: Boolean(id) && canSee,
  })

  const historyQ = useQuery({
    queryKey: ['client-history', id],
    queryFn: () => clientsApi.clientHistory(id!),
    enabled: Boolean(id) && canSee,
  })

  const pointsQ = useQuery({
    queryKey: ['client-points', id],
    queryFn: () => clientsApi.clientPoints(id!),
    enabled: Boolean(id) && canSee,
  })

  if (!canSee) {
    return (
      <Card>
        <p className="text-slate-600">Sin acceso.</p>
      </Card>
    )
  }

  if (clientQ.isPending) {
    return (
      <div className="flex justify-center py-20">
        <Spinner className="size-8" />
      </div>
    )
  }

  if (clientQ.isError || !clientQ.data) {
    return (
      <Card className="text-red-600">
        {clientQ.error instanceof Error ? clientQ.error.message : 'No encontrado'}
      </Card>
    )
  }

  const c = clientQ.data

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">{c.name}</h1>
          <p className="text-sm text-slate-500">
            DNI {c.dni}
            {c.phone ? ` · ${c.phone}` : ''}
          </p>
        </div>
        <Link to="/clientes">
          <Button type="button" variant="secondary">
            Volver
          </Button>
        </Link>
      </div>

      <Card>
        <h2 className="text-sm font-semibold text-slate-900">Puntos</h2>
        <pre className="mt-2 overflow-auto rounded-lg bg-slate-50 p-3 text-xs text-slate-700">
          {pointsQ.isPending
            ? 'Cargando…'
            : JSON.stringify(pointsQ.data ?? {}, null, 2)}
        </pre>
      </Card>

      <Card className="overflow-x-auto p-0">
        <div className="border-b border-slate-100 px-4 py-3">
          <h2 className="text-sm font-semibold text-slate-900">
            Historial de compras
          </h2>
        </div>
        {historyQ.isPending ? (
          <div className="flex justify-center py-12">
            <Spinner />
          </div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-100 bg-slate-50/80 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Venta</th>
                <th className="px-4 py-3 font-medium">Fecha</th>
                <th className="px-4 py-3 font-medium">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(historyQ.data ?? []).length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center text-slate-500">
                    Sin compras registradas
                  </td>
                </tr>
              )}
              {(historyQ.data ?? []).map((s) => (
                <tr key={s.id}>
                  <td className="px-4 py-3 font-mono">{s.saleNumber}</td>
                  <td className="px-4 py-3 text-slate-600">
                    {formatDate(s.createdAt)}
                  </td>
                  <td className="px-4 py-3">{formatMoney(s.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  )
}
