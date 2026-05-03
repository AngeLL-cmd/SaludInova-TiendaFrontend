import { Navigate, Outlet, Route, Routes } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { AppLayout } from '@/components/layout/AppLayout'
import { Spinner } from '@/components/ui/Spinner'
import { LoginPage } from '@/pages/LoginPage'
import { ChangePasswordPage } from '@/pages/ChangePasswordPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { UsersPage } from '@/pages/UsersPage'
import { ProductsPage } from '@/pages/ProductsPage'
import { SalesPage } from '@/pages/SalesPage'
import { NewSalePage } from '@/pages/NewSalePage'
import { SaleDetailPage } from '@/pages/SaleDetailPage'
import { ClientsPage } from '@/pages/ClientsPage'
import { ClientDetailPage } from '@/pages/ClientDetailPage'
import { AlertsPage } from '@/pages/AlertsPage'
import { SettingsPage } from '@/pages/SettingsPage'
import { AuditPage } from '@/pages/AuditPage'
import { ReportsPage } from '@/pages/ReportsPage'
import { ProfilePage } from '@/pages/ProfilePage'

function RequireFullSession() {
  const { token, loading, mustChangePassword, user } = useAuth()
  const needsPassword =
    mustChangePassword || user?.mustChangePassword === true

  if (!token) {
    return <Navigate to="/login" replace />
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <Spinner className="size-10" />
      </div>
    )
  }

  if (needsPassword) {
    return <Navigate to="/cambiar-contraseña" replace />
  }

  return <Outlet />
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/cambiar-contraseña" element={<ChangePasswordPage />} />
      <Route element={<RequireFullSession />}>
        <Route element={<AppLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="ventas" element={<SalesPage />} />
          <Route path="ventas/nueva" element={<NewSalePage />} />
          <Route path="ventas/:id" element={<SaleDetailPage />} />
          <Route path="inventario" element={<ProductsPage />} />
          <Route path="clientes" element={<ClientsPage />} />
          <Route path="clientes/:id" element={<ClientDetailPage />} />
          <Route path="alertas" element={<AlertsPage />} />
          <Route path="reportes" element={<ReportsPage />} />
          <Route path="usuarios" element={<UsersPage />} />
          <Route path="auditoria" element={<AuditPage />} />
          <Route path="configuracion" element={<SettingsPage />} />
          <Route path="perfil" element={<ProfilePage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
