import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import * as authApi from '@/api/auth'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Card } from '@/components/ui/Card'
import { Spinner } from '@/components/ui/Spinner'

export function ChangePasswordPage() {
  const navigate = useNavigate()
  const {
    refreshMe,
    setMustChangePassword,
    token,
    mustChangePassword,
    loading,
    user,
  } = useAuth()
  const needsChange =
    mustChangePassword || user?.mustChangePassword === true
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)

  if (!token) return <Navigate to="/login" replace />
  if (token && loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <Spinner className="size-10" />
      </div>
    )
  }
  if (token && !loading && !needsChange) {
    return <Navigate to="/" replace />
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (newPassword.length < 6) {
      setError('La nueva contraseña debe tener al menos 6 caracteres.')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('La confirmación no coincide.')
      return
    }
    setPending(true)
    try {
      await authApi.changePassword({
        currentPassword,
        newPassword,
        confirmPassword,
      })
      setMustChangePassword(false)
      await refreshMe()
      navigate('/', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cambiar la contraseña')
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
      <Card className="w-full max-w-md">
        <h1 className="text-lg font-semibold text-slate-900">
          Cambio de contraseña obligatorio
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Por seguridad debes definir una nueva contraseña antes de continuar.
        </p>
        <form onSubmit={onSubmit} className="mt-6 space-y-4 text-left">
          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}
          <div>
            <Label htmlFor="cur">Contraseña actual</Label>
            <Input
              id="cur"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="npw">Nueva contraseña</Label>
            <Input
              id="npw"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>
          <div>
            <Label htmlFor="cfm">Confirmar</Label>
            <Input
              id="cfm"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? 'Guardando…' : 'Actualizar contraseña'}
          </Button>
        </form>
      </Card>
    </div>
  )
}
