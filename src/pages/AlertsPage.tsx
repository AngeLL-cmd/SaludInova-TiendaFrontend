import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import * as alertsApi from '@/api/alerts'
import type { AlertItem } from '@/types'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { Spinner } from '@/components/ui/Spinner'

type Tab = 'all' | 'stock' | 'expiry'

export function AlertsPage() {
  const [tab, setTab] = useState<Tab>('all')

  const allQ = useQuery({
    queryKey: ['alerts', 'all'],
    queryFn: alertsApi.listAlerts,
    enabled: tab === 'all',
  })
  const stockQ = useQuery({
    queryKey: ['alerts', 'stock'],
    queryFn: alertsApi.stockAlerts,
    enabled: tab === 'stock',
  })
  const expiryQ = useQuery({
    queryKey: ['alerts', 'expiry'],
    queryFn: alertsApi.expiryAlerts,
    enabled: tab === 'expiry',
  })

  const countQ = useQuery({
    queryKey: ['alerts-count'],
    queryFn: alertsApi.alertsCount,
  })

  const q = tab === 'all' ? allQ : tab === 'stock' ? stockQ : expiryQ

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Alertas</h1>
          <p className="text-sm text-slate-500">
            Stock bajo, crítico y vencimientos
            {countQ.data && (
              <span className="ml-2 text-slate-600">
                · Total {countQ.data.count} (críticas {countQ.data.critical})
              </span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          {(['all', 'stock', 'expiry'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                tab === t
                  ? 'bg-emerald-600 text-white'
                  : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50'
              }`}
            >
              {t === 'all' ? 'Todas' : t === 'stock' ? 'Stock' : 'Vencimiento'}
            </button>
          ))}
        </div>
      </div>

      {q.isPending ? (
        <div className="flex justify-center py-20">
          <Spinner className="size-8" />
        </div>
      ) : q.isError ? (
        <Card className="text-red-600">
          {q.error instanceof Error ? q.error.message : 'Error'}
        </Card>
      ) : (
        <div className="grid gap-3">
          {(q.data as AlertItem[]).length === 0 && (
            <Card>
              <p className="text-slate-500">No hay alertas en esta vista.</p>
            </Card>
          )}
          {(q.data as AlertItem[]).map((a) => (
            <Card key={`${a.productId}-${a.type}`} className="py-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-slate-900">{a.productName}</p>
                  <p className="mt-1 text-sm text-slate-600">{a.message}</p>
                  {(a.currentStock != null || a.minimumStock != null) && (
                    <p className="mt-2 font-mono text-xs text-slate-500">
                      Stock actual: {a.currentStock ?? '—'} · Mínimo:{' '}
                      {a.minimumStock ?? '—'}
                    </p>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge tone="neutral">{a.type}</Badge>
                  <SeverityBadge severity={a.severity} />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

function SeverityBadge({
  severity,
}: {
  severity: AlertItem['severity']
}) {
  const tone =
    severity === 'critical' || severity === 'high'
      ? 'danger'
      : severity === 'medium'
        ? 'warning'
        : 'neutral'
  return <Badge tone={tone}>{severity}</Badge>
}
