import { forwardRef } from 'react'
import { cn } from '../../utils/helpers'
import { Check, Minus } from 'lucide-react'

const Checkbox = forwardRef(({
  checked,
  onChange,
  indeterminate = false,
  label,
  description,
  disabled = false,
  error,
  className,
  ...props
}, ref) => {
  return (
    <label className={cn('flex items-start gap-3 cursor-pointer', disabled && 'cursor-not-allowed opacity-60', className)}>
      <div className="relative flex items-center justify-center">
        <input
          ref={ref}
          type="checkbox"
          checked={checked}
          onChange={onChange}
          disabled={disabled}
          className="sr-only peer"
          {...props}
        />
        <div className={cn(
          'w-5 h-5 rounded border-2 transition-all duration-200',
          'flex items-center justify-center',
          checked || indeterminate
            ? 'bg-primary-600 border-primary-600'
            : error
              ? 'border-danger-500 bg-white'
              : 'border-dark-300 bg-white peer-focus:ring-2 peer-focus:ring-primary-100',
          disabled && 'bg-dark-100'
        )}>
          {checked && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
          {indeterminate && !checked && <Minus className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
        </div>
      </div>
      {(label || description) && (
        <div className="flex flex-col">
          {label && <span className="text-sm font-medium text-dark-700">{label}</span>}
          {description && <span className="text-sm text-dark-500">{description}</span>}
        </div>
      )}
    </label>
  )
})

Checkbox.displayName = 'Checkbox'

export default Checkbox
