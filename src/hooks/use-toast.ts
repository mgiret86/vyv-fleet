import { useToastStore } from '@/store/toastStore'

export function useToast() {
  const store = useToastStore()
  return {
    success: (message?: string) => store.addToast({ type: 'success', message: message ?? '' }),
    error:   (message?: string) => store.addToast({ type: 'error',   message: message ?? '' }),
    warning: (message?: string) => store.addToast({ type: 'warning', message: message ?? '' }),
    info:    (message?: string) => store.addToast({ type: 'info',    message: message ?? '' }),
  }
}
