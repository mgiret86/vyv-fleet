import React, { useEffect, useRef, useState, useCallback } from 'react'
import { X } from 'lucide-react'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  children: React.ReactNode
  footer?: React.ReactNode
}

const sizeMap = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
} as const

export default function Modal({ isOpen, onClose, title, size = 'md', children, footer }: ModalProps) {
  const [isVisible, setIsVisible] = useState(false)
  const modalRef = useRef<HTMLDivElement>(null)

  const handleEscape = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    },
    [onClose]
  )

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true)
      document.addEventListener('keydown', handleEscape, false)
      document.body.style.overflow = 'hidden'
    } else {
      setIsVisible(false)
      document.removeEventListener('keydown', handleEscape, false)
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.removeEventListener('keydown', handleEscape, false)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, handleEscape])

  if (!isOpen && !isVisible) return null

  const modalClasses = `
    fixed inset-0 z-[9998] flex items-center justify-center p-4
    bg-black/50 backdrop-blur-sm transition-opacity duration-300
    ${isVisible ? 'opacity-100' : 'opacity-0'}
  `

  const contentClasses = `
    relative bg-white rounded-xl shadow-2xl flex flex-col
    transform transition-all duration-300 ease-out
    ${sizeMap[size]} w-full
    ${isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}
  `

  return (
    <div className={modalClasses} onClick={onClose}>
      <div
        ref={modalRef}
        className={contentClasses}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h3 id="modal-title" className="text-lg font-semibold text-gray-900">
            {title}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            aria-label="Fermer la modale"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="overflow-y-auto max-h-[70vh] px-6 py-4">{children}</div>
        {footer && (
          <div className="border-t border-gray-100 px-6 py-4 flex justify-end gap-2">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
