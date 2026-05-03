import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as profileApi from '@/api/profile'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'

export function ProfilePage() {
  const { refreshMe } = useAuth()
  const qc = useQueryClient()
  const profileQ = useQuery({
    queryKey: ['profile'],
    queryFn: profileApi.getProfile,
  })

  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')

  useEffect(() => {
    if (profileQ.data) {
      setPhone(profileQ.data.phone ?? '')
      setEmail(profileQ.data.email ?? '')
    }
  }, [profileQ.data])

  const updateM = useMutation({
    mutationFn: () => profileApi.updateProfile({ phone, email }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['profile'] })
      await refreshMe()
    },
  })

  const [cpCur, setCpCur] = useState('')
  const [cpNew, setCpNew] = useState('')
  const [cpCfm, setCpCfm] = useState('')
  const [cpErr, setCpErr] = useState('')
  const cpM = useMutation({
    mutationFn: () =>
      profileApi.profileChangePassword({
        currentPassword: cpCur,
        newPassword: cpNew,
        confirmPassword: cpCfm,
      }),
    onSuccess: () => {
      setCpCur('')
      setCpNew('')
      setCpCfm('')
      setCpErr('')
      alert('Contraseña actualizada')
    },
    onError: (e: Error) => setCpErr(e.message),
  })

  if (profileQ.isPending) {
    return <Card>Cargando perfil…</Card>
  }

  if (profileQ.isError) {
    return (
      <Card className="text-red-600">
        {profileQ.error instanceof Error ? profileQ.error.message : 'Error'}
      </Card>
    )
  }

  const p = profileQ.data!

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Mi perfil</h1>
        <p className="text-sm text-slate-500">
          {p.firstName} {p.lastName} · {p.role}
        </p>
      </div>

      <Card>
        <h2 className="text-sm font-semibold text-slate-900">Datos de contacto</h2>
        <form
          className="mt-4 space-y-3"
          onSubmit={(e) => {
            e.preventDefault()
            updateM.mutate()
          }}
        >
          <div>
            <Label>Correo</Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <Label>Teléfono</Label>
            <Input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
          <Button type="submit" disabled={updateM.isPending}>
            {updateM.isPending ? 'Guardando…' : 'Guardar cambios'}
          </Button>
          {updateM.isError && (
            <p className="text-sm text-red-600">
              {updateM.error instanceof Error ? updateM.error.message : 'Error'}
            </p>
          )}
        </form>
      </Card>

      <Card>
        <h2 className="text-sm font-semibold text-slate-900">Cambiar contraseña</h2>
        <form
          className="mt-4 space-y-3"
          onSubmit={(e) => {
            e.preventDefault()
            setCpErr('')
            if (cpNew.length < 6) {
              setCpErr('Mínimo 6 caracteres')
              return
            }
            if (cpNew !== cpCfm) {
              setCpErr('La confirmación no coincide')
              return
            }
            cpM.mutate()
          }}
        >
          {cpErr && (
            <p className="text-sm text-red-600">{cpErr}</p>
          )}
          <div>
            <Label>Contraseña actual</Label>
            <Input
              type="password"
              value={cpCur}
              onChange={(e) => setCpCur(e.target.value)}
              required
            />
          </div>
          <div>
            <Label>Nueva</Label>
            <Input
              type="password"
              value={cpNew}
              onChange={(e) => setCpNew(e.target.value)}
              required
            />
          </div>
          <div>
            <Label>Confirmar</Label>
            <Input
              type="password"
              value={cpCfm}
              onChange={(e) => setCpCfm(e.target.value)}
              required
            />
          </div>
          <Button type="submit" variant="secondary" disabled={cpM.isPending}>
            {cpM.isPending ? 'Actualizando…' : 'Actualizar contraseña'}
          </Button>
        </form>
      </Card>
    </div>
  )
}
