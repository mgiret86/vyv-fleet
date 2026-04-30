export type PermissionAction = 'view' | 'create' | 'edit' | 'delete'

export type AppModule =
  | 'dashboard'
  | 'vehicles'
  | 'maintenance'
  | 'compliance'
  | 'incidents'
  | 'drivers'
  | 'fuel'
  | 'equipment'
  | 'settings'

export type ModulePermissions = {
  view: boolean
  create: boolean
  edit: boolean
  delete: boolean
}

export type Permissions = {
  dashboard: ModulePermissions
  vehicles: ModulePermissions
  maintenance: ModulePermissions
  compliance: ModulePermissions
  incidents: ModulePermissions
  drivers: ModulePermissions
  fuel: ModulePermissions
  equipment: ModulePermissions
  settings: ModulePermissions
}

export type RoleColor = 'violet' | 'blue' | 'green' | 'gray'

export interface Role {
  id: string
  name: string
  description: string
  isSystem: boolean
  color: RoleColor
  permissions: Permissions
}

export interface SettingsUser {
  id: string
  firstName: string
  lastName: string
  email: string
  password: string
  roleId: string
  agencyIds: string[]
  isActive: boolean
  lastLogin: string | null
  createdAt: string
}

export interface SettingsAgency {
  id: string
  name: string
  code: string
  city: string
  address: string
  zipCode: string
  phone: string
  email: string
  managerId: string | null
  vehicleCount: number
  userCount: number
  isActive: boolean
}

export type DateFormat = 'DD/MM/YYYY' | 'MM/DD/YYYY'
export type AlertDelayDays = 7 | 15 | 30 | 60
export type SessionDurationHours = 1 | 4 | 8 | 24
export type MaxLoginAttempts = 3 | 5 | 10

export interface AppSettings {
  appName: string
  logoUrl: string
  timezone: string
  dateFormat: DateFormat
  alertDelayDays: AlertDelayDays
  notificationEmail: string
  emailNotificationsEnabled: boolean
  sessionDurationHours: SessionDurationHours
  maxLoginAttempts: MaxLoginAttempts
  passwordRotationDays: number | null
}
