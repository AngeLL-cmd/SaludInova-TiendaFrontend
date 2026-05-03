import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as usersApi from '@/api/users'
import { useAuth } from '@/context/AuthContext'
import { isAdmin } from '@/lib/permissions'
import type { AuthUser, UserPermission } from '@/types'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Select } from '@/components/ui/Select'
import { Spinner } from '@/components/ui/Spinner'

const MODULES: string[] = [
  'dashboard',
  'sales',
  'inventory',
  'clients',
  'reports',
  'users',
  'settings',
  'audit',
]

function defaultPermissionRow(module: string): UserPermission {
  return {
    module,
    canAccess: ['dashboard', 'sales', 'clients', 'reports'].includes(module),
    canCreate: module === 'sales',
    canEdit: false,
    canDelete: false,
  }
}

export function UsersPage() {
  const { user: current } = useAuth()
  const qc = useQueryClient()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [permUser, setPermUser] = useState<AuthUser | null>(null)

  const listQ = useQuery({
    queryKey: ['users', page, search],
    queryFn: () =>
      usersApi.listUsers({ page, limit: 10, search: search || undefined }),
    enabled: isAdmin(current),
  })

  if (!isAdmin(current)) {
    return (
      <Card>
        <p className="text-slate-600">Solo administradores pueden gestionar usuarios.</p>
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
          <h1 className="text-2xl font-semibold text-slate-900">Usuarios</h1>
          <p className="text-sm text-slate-500">Empleados y permisos por módulo</p>
        </div>
        <Button type="button" onClick={() => setCreateOpen(true)}>
          Nuevo usuario
        </Button>
      </div>
      <Card className="flex flex-wrap items-end gap-3">
        <div className="min-w-[200px] flex-1">
          <Label>Buscar</Label>
          <Input
            placeholder="Nombre o correo"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && setPage(1)}
          />
        </div>
        <Button type="button" variant="secondary" onClick={() => { setPage(1); void listQ.refetch() }}>
          Filtrar
        </Button>
      </Card>
      <Card className="overflow-x-auto p-0">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-slate-100 bg-slate-50/80 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3 font-medium">Nombre</th>
              <th className="px-4 py-3 font-medium">Correo</th>
              <th className="px-4 py-3 font-medium">Rol</th>
              <th className="px-4 py-3 font-medium">Estado</th>
              <th className="px-4 py-3 font-medium text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.map((u) => (
              <tr key={u.id} className="hover:bg-slate-50/50">
                <td className="px-4 py-3 font-medium text-slate-900">
                  {u.firstName} {u.lastName}
                </td>
                <td className="px-4 py-3 text-slate-600">{u.email}</td>
                <td className="px-4 py-3">
                  <Badge tone={u.role === 'ADMIN' ? 'info' : 'neutral'}>
                    {u.role}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <Badge tone={u.isActive === false ? 'danger' : 'success'}>
                    {u.isActive === false ? 'Inactivo' : 'Activo'}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-right">
                  <Button
                    type="button"
                    variant="ghost"
                    className="text-emerald-700"
                    onClick={() => setPermUser(u)}
                  >
                    Permisos
                  </Button>
                  <ResetPasswordButton userId={u.id} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 text-sm text-slate-600">
          <span>
            Página {pagination.page} de {pagination.totalPages} ({pagination.total}{' '}
            usuarios)
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

      {createOpen && (
        <CreateUserModal
          onClose={() => setCreateOpen(false)}
          onCreated={() => {
            setCreateOpen(false)
            void qc.invalidateQueries({ queryKey: ['users'] })
          }}
        />
      )}
      {permUser && (
        <PermissionsModal
          key={permUser.id}
          user={permUser}
          onClose={() => setPermUser(null)}
          onSaved={() => {
            setPermUser(null)
            void qc.invalidateQueries({ queryKey: ['users'] })
          }}
        />
      )}
    </div>
  )
}

function ResetPasswordButton({ userId }: { userId: string }) {
  const qc = useQueryClient()
  const m = useMutation({
    mutationFn: () => usersApi.resetPassword(userId),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['users'] }),
  })
  return (
    <Button
      type="button"
      variant="ghost"
      className="text-slate-600"
      disabled={m.isPending}
      onClick={() => {
        if (confirm('¿Restablecer contraseña al DNI?')) m.mutate()
      }}
    >
      Reset pass
    </Button>
  )
}

function CreateUserModal({
  onClose,
  onCreated,
}: {
  onClose: () => void
  onCreated: () => void
}) {
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    dni: '',
    phone: '',
    position: '',
    role: 'USER' as 'USER' | 'ADMIN',
  })
  const [error, setError] = useState('')
  const m = useMutation({
    mutationFn: () => usersApi.createUser(form),
    onSuccess: onCreated,
    onError: (e: Error) => setError(e.message),
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <Card className="max-h-[90vh] w-full max-w-lg overflow-y-auto">
        <h2 className="text-lg font-semibold text-slate-900">Crear usuario</h2>
        <p className="text-sm text-slate-500">
          La contraseña inicial será el DNI. Deberá cambiarla al primer acceso.
        </p>
        {error && (
          <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}
        <form
          className="mt-4 grid gap-3 sm:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault()
            setError('')
            m.mutate()
          }}
        >
          <div className="sm:col-span-2">
            <Label>Nombres</Label>
            <Input
              value={form.firstName}
              onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
              required
            />
          </div>
          <div className="sm:col-span-2">
            <Label>Apellidos</Label>
            <Input
              value={form.lastName}
              onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
              required
            />
          </div>
          <div className="sm:col-span-2">
            <Label>Correo</Label>
            <Input
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              required
            />
          </div>
          <div>
            <Label>DNI</Label>
            <Input
              value={form.dni}
              onChange={(e) => setForm((f) => ({ ...f, dni: e.target.value }))}
              required
              minLength={8}
              maxLength={15}
            />
          </div>
          <div>
            <Label>Teléfono</Label>
            <Input
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            />
          </div>
          <div className="sm:col-span-2">
            <Label>Cargo</Label>
            <Input
              value={form.position}
              onChange={(e) => setForm((f) => ({ ...f, position: e.target.value }))}
              required
            />
          </div>
          <div className="sm:col-span-2">
            <Label>Rol</Label>
            <Select
              value={form.role}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  role: e.target.value as 'USER' | 'ADMIN',
                }))
              }
            >
              <option value="USER">Usuario</option>
              <option value="ADMIN">Administrador</option>
            </Select>
          </div>
          <div className="flex justify-end gap-2 sm:col-span-2">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={m.isPending}>
              {m.isPending ? 'Creando…' : 'Crear'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}

function PermissionsModal({
  user,
  onClose,
  onSaved,
}: {
  user: AuthUser
  onClose: () => void
  onSaved: () => void
}) {
  const initial = useMemo(() => {
    const map = new Map(user.permissions.map((p) => [p.module, p]))
    return MODULES.map((m) => {
      const existing = map.get(m)
      return (
        existing ?? {
          ...defaultPermissionRow(m),
          module: m,
        }
      )
    })
  }, [user])

  const [rows, setRows] = useState<UserPermission[]>(initial)
  const [error, setError] = useState('')
  const m = useMutation({
    mutationFn: () => usersApi.updatePermissions(user.id, rows),
    onSuccess: onSaved,
    onError: (e: Error) => setError(e.message),
  })

  function patch(i: number, patch: Partial<UserPermission>) {
    setRows((r) => {
      const next = [...r]
      next[i] = { ...next[i], ...patch }
      return next
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <Card className="max-h-[90vh] w-full max-w-3xl overflow-y-auto">
        <h2 className="text-lg font-semibold text-slate-900">
          Permisos — {user.firstName} {user.lastName}
        </h2>
        {error && (
          <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[600px] text-sm">
            <thead>
              <tr className="border-b text-left text-xs text-slate-500">
                <th className="pb-2">Módulo</th>
                <th className="pb-2">Acceso</th>
                <th className="pb-2">Crear</th>
                <th className="pb-2">Editar</th>
                <th className="pb-2">Eliminar</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={row.module} className="border-b border-slate-50">
                  <td className="py-2 font-medium capitalize">{row.module}</td>
                  {(['canAccess', 'canCreate', 'canEdit', 'canDelete'] as const).map(
                    (k) => (
                      <td key={k} className="py-2">
                        <input
                          type="checkbox"
                          checked={row[k]}
                          onChange={(e) => patch(i, { [k]: e.target.checked })}
                          className="size-4 rounded border-slate-300"
                        />
                      </td>
                    ),
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cerrar
          </Button>
          <Button type="button" disabled={m.isPending} onClick={() => m.mutate()}>
            {m.isPending ? 'Guardando…' : 'Guardar'}
          </Button>
        </div>
      </Card>
    </div>
  )
}
