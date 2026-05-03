export type UserRole = 'ADMIN' | 'USER'

export interface UserPermission {
  module: string
  canAccess: boolean
  canCreate: boolean
  canEdit: boolean
  canDelete: boolean
}

export interface AuthUser {
  id: string
  firstName: string
  lastName: string
  email: string
  role: UserRole
  permissions: UserPermission[]
  phone?: string
  dni?: string
  mustChangePassword?: boolean
  isActive?: boolean
}

export interface LoginResponse {
  token: string
  mustChangePassword: boolean
  user: AuthUser
}

export interface Pagination {
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface Product {
  id: string
  commercialName: string
  genericName?: string | null
  description?: string | null
  category: string
  pharmaceuticalForm?: string | null
  concentration?: string | null
  presentation?: string | null
  laboratory?: string | null
  purchasePrice: number
  salePrice: number
  currentStock: number
  minimumStock: number
  expirationDate?: string | null
  lot?: string | null
  sku: string
  barcode?: string | null
  physicalLocation?: string | null
  taxApplicable: boolean
  saleUnit: string
  isActive?: boolean
  createdAt?: string
  updatedAt?: string
}

export interface SaleItemLine {
  id?: string
  productId: string
  quantity: number
  unitPrice?: number
  subtotal?: number
  product?: Pick<Product, 'id' | 'commercialName' | 'sku' | 'saleUnit'>
}

export interface Sale {
  id: string
  saleNumber: string
  subtotal: number
  discountAmount: number
  taxAmount: number
  total: number
  pointsEarned?: number
  receiptPath?: string | null
  notes?: string | null
  createdAt?: string
  items: SaleItemLine[]
  user?: { firstName: string; lastName: string }
  client?: Client | null
}

export interface Client {
  id: string
  dni: string
  name: string
  phone?: string | null
  pointsBalance?: number
  createdAt?: string
}

export interface DashboardStats {
  todaySales: number
  todayRevenue: number
  averageTicket: number
  alertsCount: number
  criticalAlerts: number
  totalProducts: number
  lowStockCount: number
}

export interface ChartPoint {
  date: string
  revenue: number
}

export type AlertType =
  | 'LOW_STOCK'
  | 'CRITICAL_STOCK'
  | 'EXPIRING_SOON'
  | 'EXPIRED'

export interface AlertItem {
  productId: string
  productName: string
  type: AlertType
  severity: 'low' | 'medium' | 'high' | 'critical'
  message: string
  currentStock?: number
  minimumStock?: number
}

export interface SettingsMap {
  botica_name?: string
  ruc?: string
  address?: string
  igv_rate?: string
  points_per_sol?: string
  points_value?: string
}

export type DiscountType =
  | 'PERCENTAGE'
  | 'FIXED_AMOUNT'
  | 'BY_PRODUCT'
  | 'BY_CATEGORY'
  | 'BY_QUANTITY'
  | 'BY_MINIMUM_AMOUNT'

export interface DiscountRule {
  id: string
  name: string
  type: DiscountType
  value: number
  condition?: string | null
  isActive: boolean
  priority: number
}

export interface AuditLog {
  id: string
  userId?: string | null
  module: string
  action: string
  entityId?: string | null
  before?: unknown
  after?: unknown
  ip?: string | null
  createdAt: string
  user?: { firstName: string; lastName: string; email: string }
}
