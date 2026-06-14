'use client'

import React, { useId } from 'react'
import { clsx } from 'clsx'

interface AccessibleInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
  helperText?: string
  hideLabel?: boolean
}

const AccessibleInput = React.forwardRef<HTMLInputElement, AccessibleInputProps>(
  (
    {
      label,
      error,
      helperText,
      hideLabel = false,
      className,
      required,
      disabled,
      ...props
    },
    ref
  ) => {
    const inputId = useId()
    const errorId = useId()
    const helperId = useId()

    const hasError = !!error

    return (
      <div className="w-full">
        <label
          htmlFor={inputId}
          className={clsx(
            'block text-sm font-medium text-gray-700 mb-1',
            hideLabel && 'sr-only'
          )}
        >
          {label}
          {required && (
            <span className="text-red-500 ml-1" aria-label="required">
              *
            </span>
          )}
        </label>

        <input
          ref={ref}
          id={inputId}
          className={clsx(
            'w-full px-4 py-2 border rounded-lg',
            'focus:outline-none focus:ring-2 focus:ring-offset-1',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'transition-colors',
            hasError
              ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
              : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500',
            className
          )}
          required={required}
          disabled={disabled}
          aria-required={required}
          aria-invalid={hasError}
          aria-describedby={
            clsx(
              hasError && errorId,
              helperText && helperId
            ) || undefined
          }
          {...props}
        />

        {helperText && !error && (
          <p
            id={helperId}
            className="mt-1 text-sm text-gray-500"
          >
            {helperText}
          </p>
        )}

        {error && (
          <p
            id={errorId}
            className="mt-1 text-sm text-red-600"
            role="alert"
          >
            {error}
          </p>
        )}
      </div>
    )
  }
)

AccessibleInput.displayName = 'AccessibleInput'

export default AccessibleInput
