import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import { AlertTriangle, Info } from 'lucide-react'

interface ConfirmModalProps {
  isOpen:        boolean
  onClose:       () => void
  onConfirm:     () => void
  title:         string
  message:       string
  confirmLabel?: string
  variant?:      'DANGER' | 'WARNING'
  isLoading?:    boolean
}

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirmer',
  variant      = 'DANGER',
  isLoading    = false,
}: ConfirmModalProps) {
  const iconColor = variant === 'DANGER' ? 'text-red-500' : 'text-orange-500'

  // Button ne supporte pas 'WARNING' → DANGER pour danger, SECONDARY pour warning
  const buttonVariant: 'DANGER' | 'SECONDARY' =
    variant === 'DANGER' ? 'DANGER' : 'SECONDARY'

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <div className="flex flex-col items-center justify-center text-center p-4">
        {variant === 'DANGER' ? (
          <AlertTriangle className={`h-12 w-12 ${iconColor} mb-4`} />
        ) : (
          <Info className={`h-12 w-12 ${iconColor} mb-4`} />
        )}
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
        <p className="text-gray-600 mb-6">{message}</p>
      </div>
      <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
        <Button type="button" variant="SECONDARY" onClick={onClose} disabled={isLoading}>
          Annuler
        </Button>
        <Button type="button" variant={buttonVariant} onClick={onConfirm} isLoading={isLoading}>
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  )
}