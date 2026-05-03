import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as productsApi from '@/api/products'
import { useAuth } from '@/context/AuthContext'
import {
  canAccessModule,
  canCreateInModule,
  canDeleteInModule,
  canEditInModule,
} from '@/lib/permissions'
import { formatDate, formatMoney } from '@/lib/utils'
import type { Product } from '@/types'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Select } from '@/components/ui/Select'
import { Spinner } from '@/components/ui/Spinner'
import { Textarea } from '@/components/ui/Textarea'

export function ProductsPage() {
  const { user } = useAuth()
  const canSee = canAccessModule(user, 'inventory')
  const qc = useQueryClient()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [stockStatus, setStockStatus] = useState<string>('')
  const [editing, setEditing] = useState<Product | null>(null)
  const [creating, setCreating] = useState(false)

  const listQ = useQuery({
    queryKey: ['products', page, search, category, stockStatus],
    queryFn: () =>
      productsApi.listProducts({
        page,
        limit: 15,
        search: search || undefined,
        category: category || undefined,
        stockStatus: (stockStatus as productsApi.StockStatus) || undefined,
      }),
    enabled: canSee,
  })

  if (!canSee) {
    return (
      <Card>
        <p className="text-slate-600">No tienes acceso al inventario.</p>
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
          <h1 className="text-2xl font-semibold text-slate-900">Inventario</h1>
          <p className="text-sm text-slate-500">Productos, stock y precios</p>
        </div>
        {canCreateInModule(user, 'inventory') && (
          <Button type="button" onClick={() => setCreating(true)}>
            Nuevo producto
          </Button>
        )}
      </div>
      <Card className="flex flex-wrap items-end gap-3">
        <div className="min-w-[160px] flex-1">
          <Label>Buscar</Label>
          <Input
            placeholder="Nombre, SKU…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="w-40">
          <Label>Categoría</Label>
          <Input
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="Opcional"
          />
        </div>
        <div className="w-44">
          <Label>Stock</Label>
          <Select
            value={stockStatus}
            onChange={(e) => setStockStatus(e.target.value)}
          >
            <option value="">Todos</option>
            <option value="normal">Normal</option>
            <option value="low">Bajo</option>
            <option value="critical">Crítico</option>
          </Select>
        </div>
        <Button
          type="button"
          variant="secondary"
          onClick={() => {
            setPage(1)
            void listQ.refetch()
          }}
        >
          Aplicar
        </Button>
      </Card>
      <Card className="overflow-x-auto p-0">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="border-b border-slate-100 bg-slate-50/80 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3 font-medium">Producto</th>
              <th className="px-4 py-3 font-medium">SKU</th>
              <th className="px-4 py-3 font-medium">Stock</th>
              <th className="px-4 py-3 font-medium">P. venta</th>
              <th className="px-4 py-3 font-medium">Vence</th>
              <th className="px-4 py-3 font-medium text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.map((p) => (
              <tr key={p.id} className="hover:bg-slate-50/50">
                <td className="px-4 py-3">
                  <p className="font-medium text-slate-900">{p.commercialName}</p>
                  <p className="text-xs text-slate-500">{p.category}</p>
                </td>
                <td className="px-4 py-3 text-slate-600">{p.sku}</td>
                <td className="px-4 py-3">
                  <Badge
                    tone={
                      p.currentStock <= 0
                        ? 'danger'
                        : p.minimumStock > 0 && p.currentStock <= p.minimumStock
                          ? 'warning'
                          : 'success'
                    }
                  >
                    {p.currentStock} {p.saleUnit}
                  </Badge>
                </td>
                <td className="px-4 py-3">{formatMoney(p.salePrice)}</td>
                <td className="px-4 py-3 text-slate-600">
                  {formatDate(p.expirationDate ?? undefined)}
                </td>
                <td className="px-4 py-3 text-right">
                  {canEditInModule(user, 'inventory') && (
                    <Button
                      type="button"
                      variant="ghost"
                      className="text-emerald-700"
                      onClick={() => setEditing(p)}
                    >
                      Editar
                    </Button>
                  )}
                  {canDeleteInModule(user, 'inventory') && (
                    <DeleteProductButton id={p.id} name={p.commercialName} />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 text-sm text-slate-600">
          <span>
            Página {pagination.page} / {pagination.totalPages} · {pagination.total}{' '}
            productos
          </span>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="secondary"
              disabled={page <= 1}
              onClick={() => setPage((x) => Math.max(1, x - 1))}
            >
              Anterior
            </Button>
            <Button
              type="button"
              variant="secondary"
              disabled={page >= pagination.totalPages}
              onClick={() => setPage((x) => x + 1)}
            >
              Siguiente
            </Button>
          </div>
        </div>
      </Card>

      {(creating || editing) && (
        <ProductFormModal
          product={editing}
          onClose={() => {
            setCreating(false)
            setEditing(null)
          }}
          onSaved={() => {
            setCreating(false)
            setEditing(null)
            void qc.invalidateQueries({ queryKey: ['products'] })
          }}
        />
      )}
    </div>
  )
}

function DeleteProductButton({ id, name }: { id: string; name: string }) {
  const qc = useQueryClient()
  const m = useMutation({
    mutationFn: () => productsApi.deleteProduct(id),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['products'] }),
  })
  return (
    <Button
      type="button"
      variant="ghost"
      className="text-red-600"
      disabled={m.isPending}
      onClick={() => {
        if (confirm(`¿Desactivar «${name}»?`)) m.mutate()
      }}
    >
      Desactivar
    </Button>
  )
}

function ProductFormModal({
  product,
  onClose,
  onSaved,
}: {
  product: Product | null
  onClose: () => void
  onSaved: () => void
}) {
  const isEdit = Boolean(product)
  const [form, setForm] = useState({
    commercialName: product?.commercialName ?? '',
    genericName: product?.genericName ?? '',
    description: product?.description ?? '',
    category: product?.category ?? '',
    pharmaceuticalForm: product?.pharmaceuticalForm ?? '',
    concentration: product?.concentration ?? '',
    presentation: product?.presentation ?? '',
    laboratory: product?.laboratory ?? '',
    purchasePrice: product?.purchasePrice ?? 0,
    salePrice: product?.salePrice ?? 0,
    sku: product?.sku ?? '',
    saleUnit: product?.saleUnit ?? 'unidad',
    taxApplicable: product?.taxApplicable ?? true,
    currentStock: product?.currentStock ?? 0,
    minimumStock: product?.minimumStock ?? 0,
    expirationDate: product?.expirationDate?.slice(0, 10) ?? '',
    lot: product?.lot ?? '',
    barcode: product?.barcode ?? '',
    physicalLocation: product?.physicalLocation ?? '',
  })
  const [error, setError] = useState('')

  const m = useMutation({
    mutationFn: async () => {
      const payload = {
        ...form,
        expirationDate: form.expirationDate || undefined,
        genericName: form.genericName || undefined,
        description: form.description || undefined,
        pharmaceuticalForm: form.pharmaceuticalForm || undefined,
        concentration: form.concentration || undefined,
        presentation: form.presentation || undefined,
        laboratory: form.laboratory || undefined,
        lot: form.lot || undefined,
        barcode: form.barcode || undefined,
        physicalLocation: form.physicalLocation || undefined,
      }
      if (isEdit && product) {
        return productsApi.updateProduct(product.id, payload)
      }
      return productsApi.createProduct(payload)
    },
    onSuccess: onSaved,
    onError: (e: Error) => setError(e.message),
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <Card className="max-h-[92vh] w-full max-w-2xl overflow-y-auto">
        <h2 className="text-lg font-semibold text-slate-900">
          {isEdit ? 'Editar producto' : 'Nuevo producto'}
        </h2>
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
            <Label>Nombre comercial</Label>
            <Input
              value={form.commercialName}
              onChange={(e) =>
                setForm((f) => ({ ...f, commercialName: e.target.value }))
              }
              required
            />
          </div>
          <div>
            <Label>Categoría</Label>
            <Input
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
              required
            />
          </div>
          <div>
            <Label>Unidad de venta</Label>
            <Input
              value={form.saleUnit}
              onChange={(e) => setForm((f) => ({ ...f, saleUnit: e.target.value }))}
              required
            />
          </div>
          <div>
            <Label>SKU</Label>
            <Input
              value={form.sku}
              onChange={(e) => setForm((f) => ({ ...f, sku: e.target.value }))}
              required
              disabled={isEdit}
            />
          </div>
          <div>
            <Label>Código barras</Label>
            <Input
              value={form.barcode}
              onChange={(e) => setForm((f) => ({ ...f, barcode: e.target.value }))}
            />
          </div>
          <div>
            <Label>P. compra</Label>
            <Input
              type="number"
              step="0.01"
              min={0}
              value={form.purchasePrice}
              onChange={(e) =>
                setForm((f) => ({ ...f, purchasePrice: Number(e.target.value) }))
              }
              required
            />
          </div>
          <div>
            <Label>P. venta</Label>
            <Input
              type="number"
              step="0.01"
              min={0}
              value={form.salePrice}
              onChange={(e) =>
                setForm((f) => ({ ...f, salePrice: Number(e.target.value) }))
              }
              required
            />
          </div>
          <div>
            <Label>Stock actual</Label>
            <Input
              type="number"
              min={0}
              value={form.currentStock}
              onChange={(e) =>
                setForm((f) => ({ ...f, currentStock: Number(e.target.value) }))
              }
            />
          </div>
          <div>
            <Label>Stock mínimo</Label>
            <Input
              type="number"
              min={0}
              value={form.minimumStock}
              onChange={(e) =>
                setForm((f) => ({ ...f, minimumStock: Number(e.target.value) }))
              }
            />
          </div>
          <div>
            <Label>Vencimiento</Label>
            <Input
              type="date"
              value={form.expirationDate}
              onChange={(e) =>
                setForm((f) => ({ ...f, expirationDate: e.target.value }))
              }
            />
          </div>
          <div>
            <Label>Lote</Label>
            <Input
              value={form.lot}
              onChange={(e) => setForm((f) => ({ ...f, lot: e.target.value }))}
            />
          </div>
          <div className="sm:col-span-2 flex items-center gap-2">
            <input
              id="tax"
              type="checkbox"
              checked={form.taxApplicable}
              onChange={(e) =>
                setForm((f) => ({ ...f, taxApplicable: e.target.checked }))
              }
              className="size-4 rounded border-slate-300"
            />
            <Label htmlFor="tax" className="mb-0">
              Aplica IGV
            </Label>
          </div>
          <div className="sm:col-span-2">
            <Label>Genérico / principio activo</Label>
            <Input
              value={form.genericName}
              onChange={(e) =>
                setForm((f) => ({ ...f, genericName: e.target.value }))
              }
            />
          </div>
          <div className="sm:col-span-2">
            <Label>Descripción</Label>
            <Textarea
              rows={2}
              value={form.description}
              onChange={(e) =>
                setForm((f) => ({ ...f, description: e.target.value }))
              }
            />
          </div>
          <div className="flex justify-end gap-2 sm:col-span-2">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={m.isPending}>
              {m.isPending ? 'Guardando…' : 'Guardar'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
