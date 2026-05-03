import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Card } from '@/components/ui/Card'
import { Spinner } from '@/components/ui/Spinner'

export function LoginPage() {
  const navigate = useNavigate()
  const { login, token, mustChangePassword, loading } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)

  if (token && loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <Spinner className="size-10" />
      </div>
    )
  }
  if (token && mustChangePassword) {
    return <Navigate to="/cambiar-contraseña" replace />
  }
  if (token) return <Navigate to="/" replace />

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setPending(true)
    try {
      const data = await login(email.trim(), password)
      if (data.mustChangePassword) {
        navigate('/cambiar-contraseña', { replace: true })
      } else {
        navigate('/', { replace: true })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al iniciar sesión')
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-slate-100 p-4">
      <Card className="w-full max-w-md border-slate-200/80 shadow-xl shadow-slate-900/10">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-xl bg-emerald-600 text-lg font-bold text-white">
            SN
          </div>
          <h1 className="text-xl font-semibold text-slate-900">Salud Nova</h1>
          <p className="mt-1 text-sm text-slate-500">
            Ingresa con tu cuenta corporativa
          </p>
        </div>
        <form onSubmit={onSubmit} className="space-y-4 text-left">
          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}
          <div>
            <Label htmlFor="email">Correo</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="usuario@botica.com"
            />
          </div>
          <div>
            <Label htmlFor="password">Contraseña</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <Button
            type="submit"
            className="w-full"
            disabled={pending}
          >
            {pending ? 'Entrando…' : 'Iniciar sesión'}
          </Button>
        </form>
      </Card>
    </div>
  )
}
