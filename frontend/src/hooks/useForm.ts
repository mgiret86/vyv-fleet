import { useState, useCallback } from 'react'
import { z } from 'zod'

export function useForm<T extends Record<string, any>>(
  schema: z.ZodSchema<T>,
  initialValues: T
) {
  const [formData, setFormData] = useState<T>(initialValues)
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({})
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  /**
   * Validates the provided data against the Zod schema.
   * Populates field-level errors on failure, clears them on success.
   * Returns true if valid, false otherwise.
   */
  const validate = useCallback(
    (data: T): boolean => {
      const result = schema.safeParse(data)

      if (result.success) {
        setErrors({})
        return true
      }

      // Map Zod validation errors to a flat field → message record,
      // keeping only the first error message per field.
      const fieldErrors: Partial<Record<keyof T, string>> = {}
      result.error.errors.forEach((err) => {
        const field = err.path[0] as keyof T
        if (field && !fieldErrors[field]) {
          fieldErrors[field] = err.message
        }
      })

      setErrors(fieldErrors)
      return false
    },
    [schema]
  )

  /**
   * Handles input changes with type-aware coercion.
   * - Numeric fields receive null when the raw value is empty/undefined.
   * - String fields receive an empty string when the raw value is empty.
   * - Numeric strings are parsed via parseFloat; invalid results become null.
   * Marks the field as touched and re-runs validation on every change.
   */
  const handleChange = useCallback(
    (name: string, value: string | number | null) => {
      const initial = initialValues as Record<string, unknown>
      const currentType = typeof initial[name]

      let coerced: string | number | null = value

      if (value === '' || value === null || value === undefined) {
        // Fall back to null for numeric fields, empty string for others.
        coerced = currentType === 'number' ? null : ''
      } else if (currentType === 'number' && typeof value === 'string') {
        // Attempt numeric coercion for fields whose initial value was a number.
        const parsed = parseFloat(value)
        coerced = isNaN(parsed) ? null : parsed
      }

      const newData = { ...formData, [name]: coerced } as T
      setFormData(newData)
      setTouched((prev) => ({ ...prev, [name]: true }))
      validate(newData)
    },
    [formData, validate, initialValues]
  )

  /**
   * Handles form submission.
   * - Marks all fields as touched so errors become visible.
   * - Runs validation; calls onSuccess with the current form data if valid,
   *   or calls the optional onError callback if invalid.
   * - Manages the isSubmitting flag around the async operation.
   */
  const handleSubmit = useCallback(
    async (
      onSuccess: (data: T) => Promise<void> | void,
      onError?: () => void
    ) => {
      setIsSubmitting(true)

      // Mark all fields as touched
      const allTouched = Object.keys(formData).reduce( // Corrected syntax for reduce
        (acc, key) => ({ ...acc, [key]: true }),
        {}
      ) as Partial<Record<keyof T, boolean>>
      setTouched(allTouched)

      const isValid = validate(formData)

      if (isValid) {
        await onSuccess(formData)
      } else {
        onError?.()
      }

      setIsSubmitting(false)
    },
    [formData, validate]
  )

  /**
   * Resets all form state back to the provided initial values,
   * clearing errors, touched flags, and the submitting indicator.
   */
  const resetForm = useCallback(() => {
    setFormData(initialValues)
    setErrors({})
    setTouched({})
    setIsSubmitting(false)
  }, [initialValues])

  return {
    formData,
    errors,
    touched,
    isSubmitting,
    handleChange,
    handleSubmit,
    resetForm,
    setFormData,
  }
}

export default useForm
