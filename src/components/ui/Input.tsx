import type { InputHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export function Input({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition-shadow placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20',
        className,
      )}
      {...props}
    />
  )
}
