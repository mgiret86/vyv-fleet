import type { Response } from 'express'
import type { ApiResponse } from '../types'

export function ok<T>(res: Response, data: T, message?: string) {
  const body: ApiResponse<T> = { success: true, data }
  if (message) body.message = message
  return res.status(200).json(body)
}

export function created<T>(res: Response, data: T) {
  return res.status(201).json({ success: true, data })
}

export function noContent(res: Response) {
  return res.status(204).send()
}

export function badRequest(res: Response, error: string) {
  return res.status(400).json({ success: false, error })
}

export function unauthorized(res: Response, error = 'Non authentifié') {
  return res.status(401).json({ success: false, error })
}

export function forbidden(res: Response, error = 'Accès refusé') {
  return res.status(403).json({ success: false, error })
}

export function notFound(res: Response, error = 'Ressource introuvable') {
  return res.status(404).json({ success: false, error })
}

export function serverError(res: Response, error = 'Erreur interne') {
  return res.status(500).json({ success: false, error })
}
