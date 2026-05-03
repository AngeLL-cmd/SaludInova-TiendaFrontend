import { NavLink, Outlet } from 'react-router-dom'
import {
  AlertTriangle,
  BarChart3,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  Package,
  Settings,
  ShoppingCart,
  UserCircle,
  Users,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import {
  canAccessModule,
  isAdmin,
} from '@/lib/permissions'
import { cn } from '@/lib/utils'

const navClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
    isActive
      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/25'
      : 'text-slate-600 hover:bg-slate-100',
  )

export function AppLayout() {
  const { user, logout } = useAuth()
  const admin = isAdmin(user)

  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside className="fixed inset-y-0 left-0 z-40 flex w-60 flex-col border-r border-slate-200 bg-white shadow-sm">
        <div className="flex h-16 items-center gap-2 border-b border-slate-100 px-5">
          <div className="flex size-9 items-center justify-center rounded-lg bg-emerald-600 text-sm font-bold text-white">
            SN
          </div>
          <div className="leading-tight">
            <p className="text-sm font-semibold text-slate-900">Salud Nova</p>
            <p className="text-xs text-slate-500">Gestión de botica</p>
          </div>
        </div>
        <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
          {canAccessModule(user, 'dashboard') && (
            <NavLink to="/" end className={navClass}>
              <LayoutDashboard className="size-4 shrink-0" />
              Panel
            </NavLink>
          )}
          {canAccessModule(user, 'sales') && (
            <NavLink to="/ventas" className={navClass}>
              <ShoppingCart className="size-4 shrink-0" />
              Ventas
            </NavLink>
          )}
          {canAccessModule(user, 'inventory') && (
            <NavLink to="/inventario" className={navClass}>
              <Package className="size-4 shrink-0" />
              Inventario
            </NavLink>
          )}
          {canAccessModule(user, 'clients') && (
            <NavLink to="/clientes" className={navClass}>
              <Users className="size-4 shrink-0" />
              Clientes
            </NavLink>
          )}
          <NavLink to="/alertas" className={navClass}>
            <AlertTriangle className="size-4 shrink-0" />
            Alertas
          </NavLink>
          {canAccessModule(user, 'reports') && (
            <NavLink to="/reportes" className={navClass}>
              <BarChart3 className="size-4 shrink-0" />
              Reportes
            </NavLink>
          )}
          {admin && (
            <NavLink to="/usuarios" className={navClass}>
              <UserCircle className="size-4 shrink-0" />
              Usuarios
            </NavLink>
          )}
          {admin && (
            <NavLink to="/auditoria" className={navClass}>
              <ClipboardList className="size-4 shrink-0" />
              Auditoría
            </NavLink>
          )}
          {admin && (
            <NavLink to="/configuracion" className={navClass}>
              <Settings className="size-4 shrink-0" />
              Configuración
            </NavLink>
          )}
        </nav>
        <div className="border-t border-slate-100 p-3">
          <NavLink to="/perfil" className={navClass}>
            <UserCircle className="size-4 shrink-0" />
            Mi perfil
          </NavLink>
          <button
            type="button"
            onClick={logout}
            className="mt-1 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
          >
            <LogOut className="size-4" />
            Cerrar sesión
          </button>
        </div>
      </aside>
      <div className="flex min-h-screen flex-1 flex-col pl-60">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-slate-200 bg-white/90 px-6 backdrop-blur">
          <p className="text-sm text-slate-500">
            {user?.firstName} {user?.lastName}
            <span className="ml-2 rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
              {user?.role}
            </span>
          </p>
        </header>
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
