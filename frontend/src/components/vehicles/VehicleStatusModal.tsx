import { useState, useEffect } from 'react'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import FormField from '@/components/ui/FormField'
import { useVehicleStore } from '@/store/vehicleStore'
import { useToast } from '@/hooks/useToast'
import type { Vehicle } from '@/types'

interface VehicleStatusModalProps {
  isOpen:   boolean
  onClose:  () => void
  vehicle:  Vehicle
}

// Statuts qui requièrent un motif obligatoire
function requiresReason(status: Vehicle['status']): boolean {
  return status === 'IMMOBILIZED' || status === 'DECOMMISSIONED'
}

export default function VehicleStatusModal({ isOpen, onClose, vehicle }: VehicleStatusModalProps) {
  const { updateVehicleStatus } = useVehicleStore()
  const toast = useToast()
  const [newStatus,    setNewStatus]    = useState<Vehicle['status']>(vehicle.status)
  const [reason,       setReason]       = useState('')
  const [reasonError,  setReasonError]  = useState('')

  useEffect(() => {
    if (isOpen) {
      setNewStatus(vehicle.status)
      setReason('')
      setReasonError('')
    }
  }, [isOpen, vehicle.status])

  const handleStatusChange = (_name: string, value: string) => {
    const status = value as Vehicle['status']
    setNewStatus(status)
    if (requiresReason(status)) {
      setReasonError('Le motif est requis pour ce statut')
    } else {
      setReasonError('')
    }
  }

  const handleReasonChange = (_name: string, value: string) => {
    setReason(value)
    if (requiresReason(newStatus) && !value.trim()) {
      setReasonError('Le motif est requis pour ce statut')
    } else {
      setReasonError('')
    }
  }

  const handleConfirm = () => {
    if (requiresReason(newStatus) && !reason.trim()) {
      setReasonError('Le motif est requis pour ce statut')
      return
    }
    updateVehicleStatus(vehicle.id, newStatus, reason)
    toast.success('Statut du vehicule mis a jour')
    onClose()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Changer le statut — ${vehicle.registration}`}
      size="sm"
    >
      <div className="space-y-4">
        <p className="text-gray-700">
          Statut actuel : <span className="font-medium">{vehicle.status}</span>
        </p>
        <FormField
          label="Nouveau statut"
          name="newStatus"
          type="select"
          value={newStatus}
          onChange={handleStatusChange}
          options={[
            { value: 'ACTIVE',           label: 'Actif'              },
            { value: 'MAINTENANCE',      label: 'En maintenance'     },
            { value: 'IMMOBILIZED',      label: 'Immobilisé'         },
            { value: 'DECOMMISSIONED',   label: 'Retiré du service'  },
            { value: 'PENDING_APPROVAL', label: 'En attente ARS'     },
            { value: 'IN_TRANSFER',      label: 'En transfert'       },
          ]}
        />
        {requiresReason(newStatus) && (
          <FormField
            label="Motif"
            name="reason"
            type="textarea"
            value={reason}
            onChange={handleReasonChange}
            error={reasonError}
            placeholder="Décrivez la raison du changement de statut"
          />
        )}
      </div>
      <div className="flex justify-end gap-2 pt-4 border-t border-gray-100 mt-6">
        <Button type="button" variant="SECONDARY" onClick={onClose}>
          Annuler
        </Button>
        <Button
          type="button"
          variant="PRIMARY"
          onClick={handleConfirm}
          disabled={!!reasonError}
        >
          Confirmer
        </Button>
      </div>
    </Modal>
  )
}