import { forwardRef } from 'react'
import { cn } from '../../utils/helpers'

const Toggle = forwardRef(({
  checked,
  onChange,
  label,
  description,
  disabled = false,
  size = 'md',
  className,
  ...props
}, ref) => {
  const sizes = {
    sm: {
      track: 'w-8 h-4',
      thumb: 'w-3 h-3',
      translate: 'translate-x-4',
    },
    md: {
      track: 'w-11 h-6',
      thumb: 'w-5 h-5',
      translate: 'translate-x-5',
    },
    lg: {
      track: 'w-14 h-7',
      thumb: 'w-6 h-6',
      translate: 'translate-x-7',
    },
  }

  const sizeConfig = sizes[size]

  return (
    <label className={cn('flex items-center gap-3 cursor-pointer', disabled && 'cursor-not-allowed opacity-60', className)}>
      <button
        ref={ref}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onChange?.(!checked)}
        className={cn(
          'relative inline-flex items-center rounded-full transition-colors duration-200',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2',
          sizeConfig.track,
          checked ? 'bg-primary-600' : 'bg-dark-200'
        )}
        {...props}
      >
        <span
          className={cn(
            'inline-block rounded-full bg-white shadow-sm transform transition-transform duration-200',
            sizeConfig.thumb,
            checked ? sizeConfig.translate : 'translate-x-0.5'
          )}
        />
      </button>
      {(label || description) && (
        <div className="flex flex-col">
          {label && <span className="text-sm font-medium text-dark-700">{label}</span>}
          {description && <span className="text-sm text-dark-500">{description}</span>}
        </div>
      )}
    </label>
  )
})

Toggle.displayName = 'Toggle'

export default Toggle
