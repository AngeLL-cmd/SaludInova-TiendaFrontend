import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useMutation, useQuery } from '@tanstack/react-query'
import * as productsApi from '@/api/products'
import * as salesApi from '@/api/sales'
import * as clientsApi from '@/api/clients'
import { useAuth } from '@/context/AuthContext'
import { canCreateInModule } from '@/lib/permissions'
import { formatMoney } from '@/lib/utils'
import type { Product } from '@/types'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Textarea } from '@/components/ui/Textarea'

interface Line {
  productId: string
  quantity: number
  product: Product
}

export function NewSalePage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const canSell = canCreateInModule(user, 'sales')

  const [search, setSearch] = useState('')
  const [clientDni, setClientDni] = useState('')
  const [clientName, setClientName] = useState('')
  const [clientPhone, setClientPhone] = useState('')
  const [pointsToUse, setPointsToUse] = useState<number | ''>('')
  const [notes, setNotes] = useState('')
  const [lines, setLines] = useState<Line[]>([])
  const [error, setError] = useState('')

  const searchQ = useQuery({
    queryKey: ['products-search-sale', search],
    queryFn: () => productsApi.listProducts({ search, limit: 8, page: 1 }),
    enabled: search.trim().length >= 2 && canSell,
  })

  async function lookupClient() {
    if (!clientDni.trim()) return
    const c = await clientsApi.searchClientByDni(clientDni.trim())
    if (c) {
      setClientName(c.name)
      setClientPhone(c.phone ?? '')
    }
  }

  function addProduct(p: Product) {
    setLines((prev) => {
      const i = prev.findIndex((l) => l.productId === p.id)
      if (i >= 0) {
        const next = [...prev]
        next[i] = { ...next[i], quantity: next[i].quantity + 1 }
        return next
      }
      return [...prev, { productId: p.id, quantity: 1, product: p }]
    })
    setSearch('')
  }

  function setQty(productId: string, quantity: number) {
    setLines((prev) =>
      prev.map((l) =>
        l.productId === productId ? { ...l, quantity: Math.max(1, quantity) } : l,
      ),
    )
  }

  function removeLine(productId: string) {
    setLines((prev) => prev.filter((l) => l.productId !== productId))
  }

  const saleM = useMutation({
    mutationFn: () =>
      salesApi.createSale({
        items: lines.map((l) => ({
          productId: l.productId,
          quantity: l.quantity,
        })),
        clientDni: clientDni.trim() || undefined,
        clientName: clientName.trim() || undefined,
        clientPhone: clientPhone.trim() || undefined,
        pointsToUse:
          pointsToUse === '' ? undefined : Number(pointsToUse),
        notes: notes.trim() || undefined,
      }),
    onSuccess: (sale) => navigate(`/ventas/${sale.id}`, { replace: true }),
    onError: (e: Error) => setError(e.message),
  })

  if (!canSell) {
    return (
      <Card>
        <p className="text-slate-600">No tienes permiso para registrar ventas.</p>
        <Link to="/ventas" className="mt-2 inline-block text-emerald-700">
          Volver
        </Link>
      </Card>
    )
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Nueva venta</h1>
          <p className="text-sm text-slate-500">Agrega productos y confirma el cobro</p>
        </div>
        <Link to="/ventas">
          <Button type="button" variant="secondary">
            Volver al listado
          </Button>
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="text-sm font-semibold text-slate-900">Cliente (opcional)</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2 flex gap-2">
              <div className="flex-1">
                <Label>DNI</Label>
                <Input
                  value={clientDni}
                  onChange={(e) => setClientDni(e.target.value)}
                  placeholder="Buscar cliente"
                />
              </div>
              <div className="flex items-end">
                <Button type="button" variant="secondary" onClick={() => void lookupClient()}>
                  Buscar
                </Button>
              </div>
            </div>
            <div>
              <Label>Nombre</Label>
              <Input
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
              />
            </div>
            <div>
              <Label>Teléfono</Label>
              <Input
                value={clientPhone}
                onChange={(e) => setClientPhone(e.target.value)}
              />
            </div>
            <div>
              <Label>Puntos a usar</Label>
              <Input
                type="number"
                min={0}
                value={pointsToUse}
                onChange={(e) =>
                  setPointsToUse(e.target.value === '' ? '' : Number(e.target.value))
                }
              />
            </div>
            <div className="sm:col-span-2">
              <Label>Notas</Label>
              <Textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>
        </Card>

        <Card>
          <h2 className="text-sm font-semibold text-slate-900">Buscar producto</h2>
          <div className="mt-3">
            <Input
              placeholder="Escribe al menos 2 caracteres…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {searchQ.data && searchQ.data.items.length > 0 && (
              <ul className="mt-2 max-h-48 overflow-auto rounded-lg border border-slate-100 bg-slate-50/50 text-sm">
                {searchQ.data.items.map((p) => (
                  <li key={p.id}>
                    <button
                      type="button"
                      className="flex w-full items-center justify-between px-3 py-2 text-left hover:bg-white"
                      onClick={() => addProduct(p)}
                    >
                      <span className="font-medium text-slate-900">
                        {p.commercialName}
                      </span>
                      <span className="text-slate-500">
                        {formatMoney(p.salePrice)} · Stock {p.currentStock}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Card>
      </div>

      <Card className="overflow-x-auto p-0">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead className="border-b border-slate-100 bg-slate-50/80 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3 font-medium">Producto</th>
              <th className="px-4 py-3 font-medium">P. unit.</th>
              <th className="px-4 py-3 font-medium">Cantidad</th>
              <th className="px-4 py-3 font-medium text-right">Quitar</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {lines.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                  Aún no hay productos en esta venta.
                </td>
              </tr>
            )}
            {lines.map((l) => (
              <tr key={l.productId}>
                <td className="px-4 py-3">
                  <p className="font-medium text-slate-900">
                    {l.product.commercialName}
                  </p>
                  <p className="text-xs text-slate-500">{l.product.sku}</p>
                </td>
                <td className="px-4 py-3">{formatMoney(l.product.salePrice)}</td>
                <td className="px-4 py-3">
                  <Input
                    type="number"
                    min={1}
                    className="w-24"
                    value={l.quantity}
                    onChange={(e) =>
                      setQty(l.productId, Number(e.target.value) || 1)
                    }
                  />
                </td>
                <td className="px-4 py-3 text-right">
                  <Button
                    type="button"
                    variant="ghost"
                    className="text-red-600"
                    onClick={() => removeLine(l.productId)}
                  >
                    Quitar
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {error && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      )}

      <div className="flex justify-end">
        <Button
          type="button"
          disabled={lines.length === 0 || saleM.isPending}
          onClick={() => {
            setError('')
            saleM.mutate()
          }}
        >
          {saleM.isPending ? 'Registrando…' : 'Confirmar venta'}
        </Button>
      </div>
    </div>
  )
}
