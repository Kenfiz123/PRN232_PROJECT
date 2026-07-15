import { forwardRef } from 'react'
import { cn } from '../../utils/helpers'
import { AlertCircle } from 'lucide-react'

const Textarea = forwardRef(({
  label,
  error,
  helperText,
  className,
  containerClassName,
  required,
  disabled,
  rows = 4,
  ...props
}, ref) => {
  return (
    <div className={cn('w-full', containerClassName)}>
      {label && (
        <label className="block text-sm font-medium text-dark-700 mb-1.5">
          {label}
          {required && <span className="text-danger-500 ml-1">*</span>}
        </label>
      )}
      <textarea
        ref={ref}
        rows={rows}
        disabled={disabled}
        className={cn(
          'w-full px-4 py-2.5 bg-white border rounded-md resize-none',
          'text-dark-800 placeholder:text-dark-400',
          'focus:outline-none focus:ring-2 focus:ring-offset-0',
          'transition-all duration-200',
          error
            ? 'border-danger-500 focus:border-danger-500 focus:ring-danger-100'
            : 'border-dark-200 focus:border-primary-500 focus:ring-primary-100',
          disabled && 'bg-dark-50 cursor-not-allowed resize-none',
          className
        )}
        {...props}
      />
      {(error || helperText) && (
        <div className={cn('mt-1.5 flex items-center gap-1 text-sm',
          error ? 'text-danger-500' : 'text-dark-500'
        )}>
          {error && <AlertCircle className="w-4 h-4" />}
          <span>{error || helperText}</span>
        </div>
      )}
    </div>
  )
})

Textarea.displayName = 'Textarea'

export default Textarea
