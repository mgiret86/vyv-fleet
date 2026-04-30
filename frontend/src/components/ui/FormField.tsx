import { AlertCircle } from 'lucide-react'

interface FormFieldProps {
  label: string
  name: string
  type?: 'text' | 'email' | 'tel' | 'number' | 'date' | 'select' | 'textarea'
  value: string | number | null | undefined
  onChange: (name: string, value: string) => void
  error?: string
  required?: boolean
  placeholder?: string
  options?: { value: string; label: string }[]
  rows?: number
  hint?: string
  disabled?: boolean
}

export default function FormField({
  label,
  name,
  type = 'text',
  value,
  onChange,
  error,
  required = false,
  placeholder,
  options,
  rows = 3,
  hint,
  disabled = false,
}: FormFieldProps) {
  const inputClasses = [
    'block w-full rounded-lg border px-3 py-2 text-sm transition-colors duration-200',
    disabled
      ? 'border-gray-300 bg-gray-100 text-gray-500 cursor-not-allowed'
      : error
        ? 'border-red-400 focus:ring-red-400 focus:border-red-400 bg-red-50'
        : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500 bg-white',
  ].join(' ')

  const renderInput = () => {
    switch (type) {
      case 'select':
        return (
          <select
            id={name}
            name={name}
            value={value ?? ''}
            onChange={(e) => onChange(name, e.target.value)}
            className={inputClasses}
            disabled={disabled}
          >
            {placeholder && <option value="">{placeholder}</option>}
            {options?.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        )
      case 'textarea':
        return (
          <textarea
            id={name}
            name={name}
            value={value ?? ''}
            onChange={(e) => onChange(name, e.target.value)}
            rows={rows}
            className={inputClasses}
            placeholder={placeholder}
            disabled={disabled}
          />
        )
      case 'number':
        return (
          <input
            id={name}
            name={name}
            type="number"
            value={value ?? ''}
            onChange={(e) => onChange(name, e.target.value)}
            onKeyDown={(e) => {
              // Prevent 'e', 'E', '+', '-' from being typed into number input
              // as they can cause issues with parsing or unwanted behavior.
              // Note: 'type="number"' already handles most non-numeric input,
              // but these characters are often still allowed by browsers.
              if (['e', 'E', '+', '-'].includes(e.key)) e.preventDefault()
            }}
            className={inputClasses}
            placeholder={placeholder}
            disabled={disabled}
          />
        )
      default:
        return (
          <input
            id={name}
            name={name}
            type={type}
            value={value ?? ''}
            onChange={(e) => onChange(name, e.target.value)}
            className={inputClasses}
            placeholder={placeholder}
            disabled={disabled}
          />
        )
    }
  }

  return (
    <div className="mb-4">
      <label htmlFor={name} className="mb-1 block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </label>
      {renderInput()}
      {hint && !error && <p className="mt-1 text-xs text-gray-400">{hint}</p>}
      {error && (
        <p className="mt-1 flex items-center gap-1 text-xs text-red-600">
          <AlertCircle className="h-3 w-3" />
          <span>{error}</span>
        </p>
      )}
    </div>
  )
}
