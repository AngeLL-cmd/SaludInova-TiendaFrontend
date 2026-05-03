import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import * as auditApi from '@/api/audit'
import { useAuth } from '@/context/AuthContext'
import { isAdmin } from '@/lib/permissions'
import { formatDate } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Spinner } from '@/components/ui/Spinner'

export function AuditPage() {
  const { user } = useAuth()
  const admin = isAdmin(user)
  const [page, setPage] = useState(1)
  const [module, setModule] = useState('')
  const [action, setAction] = useState('')
  const [userId, setUserId] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const listQ = useQuery({
    queryKey: ['audit', page, module, action, userId, startDate, endDate],
    queryFn: () =>
      auditApi.listAudit({
        page,
        limit: 20,
        module: module || undefined,
        action: action || undefined,
        userId: userId || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      }),
    enabled: admin,
  })

  if (!admin) {
    return (
      <Card>
        <p className="text-slate-600">La auditoría es solo para administradores.</p>
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
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Auditoría</h1>
        <p className="text-sm text-slate-500">Registro de acciones en el sistema</p>
      </div>
      <Card className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <Label>Módulo</Label>
          <Input
            value={module}
            onChange={(e) => setModule(e.target.value)}
            placeholder="sales, inventory…"
          />
        </div>
        <div>
          <Label>Acción</Label>
          <Input
            value={action}
            onChange={(e) => setAction(e.target.value)}
            placeholder="create, update…"
          />
        </div>
        <div>
          <Label>Usuario (UUID)</Label>
          <Input
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
          />
        </div>
        <div>
          <Label>Desde</Label>
          <Input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>
        <div>
          <Label>Hasta</Label>
          <Input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
        <div className="flex items-end">
          <Button
            type="button"
            variant="secondary"
            className="w-full"
            onClick={() => {
              setPage(1)
              void listQ.refetch()
            }}
          >
            Aplicar filtros
          </Button>
        </div>
      </Card>
      <Card className="overflow-x-auto p-0">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="border-b border-slate-100 bg-slate-50/80 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3 font-medium">Fecha</th>
              <th className="px-4 py-3 font-medium">Usuario</th>
              <th className="px-4 py-3 font-medium">Módulo</th>
              <th className="px-4 py-3 font-medium">Acción</th>
              <th className="px-4 py-3 font-medium">Entidad</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.map((log) => (
              <tr key={log.id} className="hover:bg-slate-50/50">
                <td className="px-4 py-3 whitespace-nowrap text-slate-600">
                  {formatDate(log.createdAt)}
                </td>
                <td className="px-4 py-3 text-slate-700">
                  {log.user
                    ? `${log.user.firstName} ${log.user.lastName}`
                    : '—'}
                </td>
                <td className="px-4 py-3 font-mono text-xs">{log.module}</td>
                <td className="px-4 py-3">{log.action}</td>
                <td className="px-4 py-3 font-mono text-xs text-slate-500">
                  {log.entityId ?? '—'}
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
