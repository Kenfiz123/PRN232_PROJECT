import { forwardRef, useState } from 'react'
import { cn } from '../../utils/helpers'
import { Eye, EyeOff, AlertCircle, Search } from 'lucide-react'

const Input = forwardRef(({
  label,
  error,
  helperText,
  type = 'text',
  leftIcon,
  rightIcon,
  className,
  containerClassName,
  required,
  disabled,
  onLeftIconClick,
  onRightIconClick,
  ...props
}, ref) => {
  const [showPassword, setShowPassword] = useState(false)
  const isPassword = type === 'password'
  const isSearch = type === 'search'
  const inputType = isPassword ? (showPassword ? 'text' : 'password') : type

  return (
    <div className={cn('w-full', containerClassName)}>
      {label && (
        <label className="block text-sm font-medium text-dark-700 mb-1.5">
          {label}
          {required && <span className="text-danger-500 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        {(leftIcon || isSearch) && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400">
            {isSearch ? <Search className="w-5 h-5" /> : leftIcon}
          </div>
        )}
        <input
          ref={ref}
          type={inputType}
          disabled={disabled}
          className={cn(
            'w-full px-4 py-2.5 bg-white border rounded-md',
            'text-dark-800 placeholder:text-dark-400',
            'focus:outline-none focus:ring-2 focus:ring-offset-0',
            'transition-all duration-200',
            error
              ? 'border-danger-500 focus:border-danger-500 focus:ring-danger-100'
              : 'border-dark-200 focus:border-primary-500 focus:ring-primary-100',
            disabled && 'bg-dark-50 cursor-not-allowed',
            (leftIcon || isSearch) && 'pl-10',
            (rightIcon || isPassword) && 'pr-10',
            className
          )}
          {...props}
        />
        {(rightIcon || isPassword) && (
          <button
            type="button"
            onClick={isPassword ? () => setShowPassword(!showPassword) : onRightIconClick}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-400 hover:text-dark-600"
          >
            {isPassword ? (
              showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />
            ) : rightIcon}
          </button>
        )}
      </div>
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

Input.displayName = 'Input'

export default Input
