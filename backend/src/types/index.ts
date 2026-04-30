import type { Request } from 'express'

// Payload JWT
export interface JWTPayload {
  userId:    string
  roleId:    string
  roleName:  string
  agencyIds: string[]
  iat?:      number
  exp?:      number
}

// Request authentifiée (user injecté par le middleware)
export interface AuthRequest extends Request {
  user?: JWTPayload
}

// Réponse API standard
export interface ApiResponse<T = unknown> {
  success: boolean
  data?:   T
  error?:  string
  message?: string
}

// Paramètres de pagination
export interface PaginationParams {
  page:  number
  limit: number
  skip:  number
}
