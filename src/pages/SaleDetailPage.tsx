import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import * as salesApi from '@/api/sales'
import { useAuth } from '@/context/AuthContext'
import { canAccessModule } from '@/lib/permissions'
import { formatDate, formatMoney } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Spinner } from '@/components/ui/Spinner'

export function SaleDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const canSee = canAccessModule(user, 'sales')

  const q = useQuery({
    queryKey: ['sale', id],
    queryFn: () => salesApi.getSale(id!),
    enabled: Boolean(id) && canSee,
  })

  if (!canSee) {
    return (
      <Card>
        <p className="text-slate-600">Sin acceso.</p>
      </Card>
    )
  }

  if (q.isPending) {
    return (
      <div className="flex justify-center py-20">
        <Spinner className="size-8" />
      </div>
    )
  }

  if (q.isError || !q.data) {
    return (
      <Card className="text-red-600">
        {q.error instanceof Error ? q.error.message : 'Venta no encontrada'}
      </Card>
    )
  }

  const s = q.data

  async function downloadPdf() {
    try {
      const blob = await salesApi.downloadReceipt(s.id)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = s.receiptPath ?? `comprobante-${s.saleNumber}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      alert('No se pudo descargar el PDF')
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">{s.saleNumber}</h1>
          <p className="text-sm text-slate-500">{formatDate(s.createdAt)}</p>
        </div>
        <div className="flex gap-2">
          <Link to="/ventas">
            <Button type="button" variant="secondary">
              Volver
            </Button>
          </Link>
          <Button type="button" onClick={() => void downloadPdf()}>
            Descargar PDF
          </Button>
        </div>
      </div>

      <Card>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-xs font-medium uppercase text-slate-500">Subtotal</p>
            <p className="text-lg font-semibold">{formatMoney(s.subtotal)}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase text-slate-500">IGV</p>
            <p className="text-lg font-semibold">{formatMoney(s.taxAmount)}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase text-slate-500">Descuento</p>
            <p className="text-lg font-semibold">{formatMoney(s.discountAmount)}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase text-slate-500">Total</p>
            <p className="text-xl font-bold text-emerald-700">{formatMoney(s.total)}</p>
          </div>
          {s.pointsEarned != null && (
            <div className="sm:col-span-2">
              <p className="text-xs font-medium uppercase text-slate-500">
                Puntos generados
              </p>
              <p className="text-lg font-semibold">{s.pointsEarned}</p>
            </div>
          )}
        </div>
      </Card>

      <Card>
        <h2 className="text-sm font-semibold text-slate-900">Cliente</h2>
        {s.client ? (
          <p className="mt-2 text-slate-700">
            {s.client.name} · DNI {s.client.dni}
            {s.client.phone ? ` · ${s.client.phone}` : ''}
          </p>
        ) : (
          <p className="mt-2 text-slate-500">Venta sin cliente registrado</p>
        )}
      </Card>

      <Card className="overflow-x-auto p-0">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-100 bg-slate-50/80 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3 font-medium">Producto</th>
              <th className="px-4 py-3 font-medium">Cant.</th>
              <th className="px-4 py-3 font-medium">P. unit.</th>
              <th className="px-4 py-3 font-medium">Subtotal</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {s.items.map((it) => (
              <tr key={it.id ?? it.productId}>
                <td className="px-4 py-3">
                  {it.product?.commercialName ?? it.productId}
                </td>
                <td className="px-4 py-3">{it.quantity}</td>
                <td className="px-4 py-3">
                  {it.unitPrice != null ? formatMoney(it.unitPrice) : '—'}
                </td>
                <td className="px-4 py-3">
                  {it.subtotal != null ? formatMoney(it.subtotal) : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  )
}
