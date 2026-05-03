import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import * as clientsApi from '@/api/clients'
import { useAuth } from '@/context/AuthContext'
import { canAccessModule } from '@/lib/permissions'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Spinner } from '@/components/ui/Spinner'

export function ClientsPage() {
  const { user } = useAuth()
  const canSee = canAccessModule(user, 'clients')
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')

  const listQ = useQuery({
    queryKey: ['clients', page, search],
    queryFn: () =>
      clientsApi.listClients({
        page,
        limit: 15,
        search: search || undefined,
      }),
    enabled: canSee,
  })

  if (!canSee) {
    return (
      <Card>
        <p className="text-slate-600">No tienes acceso a clientes.</p>
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
        <h1 className="text-2xl font-semibold text-slate-900">Clientes</h1>
        <p className="text-sm text-slate-500">
          Clientes registrados por DNI en ventas
        </p>
      </div>
      <Card className="flex flex-wrap items-end gap-3">
        <div className="min-w-[200px] flex-1">
          <Label>Buscar</Label>
          <Input
            placeholder="Nombre o DNI"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button
          type="button"
          variant="secondary"
          onClick={() => {
            setPage(1)
            void listQ.refetch()
          }}
        >
          Buscar
        </Button>
      </Card>
      <Card className="overflow-x-auto p-0">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead className="border-b border-slate-100 bg-slate-50/80 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3 font-medium">Nombre</th>
              <th className="px-4 py-3 font-medium">DNI</th>
              <th className="px-4 py-3 font-medium">Teléfono</th>
              <th className="px-4 py-3 font-medium text-right">Perfil</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.map((c) => (
              <tr key={c.id} className="hover:bg-slate-50/50">
                <td className="px-4 py-3 font-medium text-slate-900">{c.name}</td>
                <td className="px-4 py-3 font-mono text-slate-600">{c.dni}</td>
                <td className="px-4 py-3 text-slate-600">{c.phone ?? '—'}</td>
                <td className="px-4 py-3 text-right">
                  <Link to={`/clientes/${c.id}`}>
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
