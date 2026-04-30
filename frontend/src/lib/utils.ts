import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export function formatCurrency(amount: number | null): string {
  if (amount === null) return '—'
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount)
}

export function formatMileage(km: number): string {
  return new Intl.NumberFormat('fr-FR').format(km) + ' km'
}

export function daysUntil(dateStr: string | null): number | null {
  if (!dateStr) return null
  const diff = new Date(dateStr).getTime() - new Date().getTime()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

export function getExpiryColor(dateStr: string | null): string {
  const days = daysUntil(dateStr)
  if (days === null) return 'text-gray-400'
  if (days < 0) return 'text-red-600'
  if (days <= 30) return 'text-red-500'
  if (days <= 90) return 'text-orange-500'
  return 'text-green-600'
}
