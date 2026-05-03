import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as settingsApi from '@/api/settings'
import { useAuth } from '@/context/AuthContext'
import { isAdmin } from '@/lib/permissions'
import type { DiscountType } from '@/types'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Select } from '@/components/ui/Select'
import { Spinner } from '@/components/ui/Spinner'

export function SettingsPage() {
  const { user } = useAuth()
  const qc = useQueryClient()
  const admin = isAdmin(user)

  const settingsQ = useQuery({
    queryKey: ['settings'],
    queryFn: settingsApi.getSettings,
    enabled: admin,
  })

  const discountsQ = useQuery({
    queryKey: ['discounts'],
    queryFn: settingsApi.listDiscounts,
    enabled: admin,
  })

  const [form, setForm] = useState({
    botica_name: '',
    ruc: '',
    address: '',
    igv_rate: '',
    points_per_sol: '',
    points_value: '',
  })

  useEffect(() => {
    if (settingsQ.data) {
      const s = settingsQ.data
      setForm({
        botica_name: s.botica_name ?? '',
        ruc: s.ruc ?? '',
        address: s.address ?? '',
        igv_rate: s.igv_rate ?? '',
        points_per_sol: s.points_per_sol ?? '',
        points_value: s.points_value ?? '',
      })
    }
  }, [settingsQ.data])

  const saveM = useMutation({
    mutationFn: () => settingsApi.updateSettings(form),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['settings'] }),
  })

  const [discOpen, setDiscOpen] = useState(false)

  if (!admin) {
    return (
      <Card>
        <p className="text-slate-600">Solo administradores acceden a configuración.</p>
      </Card>
    )
  }

  if (settingsQ.isPending) {
    return (
      <div className="flex justify-center py-20">
        <Spinner className="size-8" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Configuración</h1>
        <p className="text-sm text-slate-500">Datos de la botica y reglas de descuento</p>
      </div>

      <Card>
        <h2 className="text-sm font-semibold text-slate-900">Datos generales</h2>
        <form
          className="mt-4 grid gap-4 sm:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault()
            saveM.mutate()
          }}
        >
          <div className="sm:col-span-2">
            <Label>Nombre comercial</Label>
            <Input
              value={form.botica_name}
              onChange={(e) =>
                setForm((f) => ({ ...f, botica_name: e.target.value }))
              }
            />
          </div>
          <div>
            <Label>RUC</Label>
            <Input
              value={form.ruc}
              onChange={(e) => setForm((f) => ({ ...f, ruc: e.target.value }))}
            />
          </div>
          <div>
            <Label>IGV (%)</Label>
            <Input
              value={form.igv_rate}
              onChange={(e) =>
                setForm((f) => ({ ...f, igv_rate: e.target.value }))
              }
            />
          </div>
          <div className="sm:col-span-2">
            <Label>Dirección</Label>
            <Input
              value={form.address}
              onChange={(e) =>
                setForm((f) => ({ ...f, address: e.target.value }))
              }
            />
          </div>
          <div>
            <Label>Puntos por sol</Label>
            <Input
              value={form.points_per_sol}
              onChange={(e) =>
                setForm((f) => ({ ...f, points_per_sol: e.target.value }))
              }
            />
          </div>
          <div>
            <Label>Valor del punto (S/)</Label>
            <Input
              value={form.points_value}
              onChange={(e) =>
                setForm((f) => ({ ...f, points_value: e.target.value }))
              }
            />
          </div>
          <div className="sm:col-span-2">
            <Button type="submit" disabled={saveM.isPending}>
              {saveM.isPending ? 'Guardando…' : 'Guardar configuración'}
            </Button>
            {saveM.isError && (
              <p className="mt-2 text-sm text-red-600">
                {saveM.error instanceof Error ? saveM.error.message : 'Error'}
              </p>
            )}
          </div>
        </form>
      </Card>

      <Card>
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-sm font-semibold text-slate-900">
            Reglas de descuento
          </h2>
          <Button type="button" onClick={() => setDiscOpen(true)}>
            Nueva regla
          </Button>
        </div>
        {discountsQ.isPending ? (
          <div className="flex justify-center py-8">
            <Spinner />
          </div>
        ) : (
          <ul className="mt-4 divide-y divide-slate-100">
            {(discountsQ.data ?? []).map((d) => (
              <li
                key={d.id}
                className="flex flex-wrap items-center justify-between gap-2 py-3"
              >
                <div>
                  <p className="font-medium text-slate-900">{d.name}</p>
                  <p className="text-xs text-slate-500">
                    {d.type} · valor {d.value} · prioridad {d.priority}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge tone={d.isActive ? 'success' : 'neutral'}>
                    {d.isActive ? 'Activa' : 'Inactiva'}
                  </Badge>
                  <DeleteDiscountButton id={d.id} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {discOpen && (
        <DiscountModal
          onClose={() => setDiscOpen(false)}
          onSaved={() => {
            setDiscOpen(false)
            void qc.invalidateQueries({ queryKey: ['discounts'] })
          }}
        />
      )}
    </div>
  )
}

function DeleteDiscountButton({ id }: { id: string }) {
  const qc = useQueryClient()
  const m = useMutation({
    mutationFn: () => settingsApi.deleteDiscount(id),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['discounts'] }),
  })
  return (
    <Button
      type="button"
      variant="ghost"
      className="text-red-600"
      disabled={m.isPending}
      onClick={() => {
        if (confirm('¿Eliminar esta regla?')) m.mutate()
      }}
    >
      Eliminar
    </Button>
  )
}

function DiscountModal({
  onClose,
  onSaved,
}: {
  onClose: () => void
  onSaved: () => void
}) {
  const [form, setForm] = useState({
    name: '',
    type: 'PERCENTAGE' as DiscountType,
    value: 0,
    condition: '',
    isActive: true,
    priority: 0,
  })
  const [error, setError] = useState('')
  const m = useMutation({
    mutationFn: () =>
      settingsApi.createDiscount({
        ...form,
        condition: form.condition.trim() || undefined,
      }),
    onSuccess: onSaved,
    onError: (e: Error) => setError(e.message),
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <Card className="w-full max-w-md">
        <h3 className="text-lg font-semibold text-slate-900">Nueva regla</h3>
        {error && (
          <p className="mt-2 text-sm text-red-600">{error}</p>
        )}
        <form
          className="mt-4 space-y-3"
          onSubmit={(e) => {
            e.preventDefault()
            setError('')
            m.mutate()
          }}
        >
          <div>
            <Label>Nombre</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              required
            />
          </div>
          <div>
            <Label>Tipo</Label>
            <Select
              value={form.type}
              onChange={(e) =>
                setForm((f) => ({ ...f, type: e.target.value as DiscountType }))
              }
            >
              {(
                [
                  'PERCENTAGE',
                  'FIXED_AMOUNT',
                  'BY_PRODUCT',
                  'BY_CATEGORY',
                  'BY_QUANTITY',
                  'BY_MINIMUM_AMOUNT',
                ] as const
              ).map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label>Valor</Label>
            <Input
              type="number"
              step="0.01"
              value={form.value}
              onChange={(e) =>
                setForm((f) => ({ ...f, value: Number(e.target.value) }))
              }
              required
            />
          </div>
          <div>
            <Label>Condición (JSON opcional)</Label>
            <Input
              value={form.condition}
              onChange={(e) =>
                setForm((f) => ({ ...f, condition: e.target.value }))
              }
              placeholder='{"minimumAmount":50}'
            />
          </div>
          <div className="flex gap-4">
            <div>
              <Label>Prioridad</Label>
              <Input
                type="number"
                value={form.priority}
                onChange={(e) =>
                  setForm((f) => ({ ...f, priority: Number(e.target.value) }))
                }
              />
            </div>
            <div className="flex items-end gap-2 pb-2">
              <input
                id="da"
                type="checkbox"
                checked={form.isActive}
                onChange={(e) =>
                  setForm((f) => ({ ...f, isActive: e.target.checked }))
                }
                className="size-4"
              />
              <Label htmlFor="da" className="mb-0">
                Activa
              </Label>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={m.isPending}>
              Crear
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
