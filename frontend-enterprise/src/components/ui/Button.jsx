import { forwardRef } from 'react'
import { cn } from '../../utils/helpers'
import { Loader2 } from 'lucide-react'

const Button = forwardRef(({
  children,
  className,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled,
  leftIcon,
  rightIcon,
  fullWidth = false,
  ...props
}, ref) => {
  const variants = {
    primary: 'bg-primary-800 text-white hover:bg-primary-700 active:bg-primary-900 focus-visible:ring-primary-500',
    secondary: 'bg-white text-dark-700 border border-dark-200 hover:bg-dark-50 focus-visible:ring-dark-300',
    ghost: 'bg-transparent text-dark-600 hover:bg-dark-100 focus-visible:ring-dark-300',
    danger: 'bg-danger-500 text-white hover:bg-danger-600 focus-visible:ring-danger-500',
    success: 'bg-success-500 text-white hover:bg-success-600 focus-visible:ring-success-500',
    outline: 'bg-transparent border-2 border-primary-800 text-primary-800 hover:bg-primary-50 focus-visible:ring-primary-500',
  }

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
    xl: 'px-8 py-4 text-lg',
    icon: 'p-2',
  }

  return (
    <button
      ref={ref}
      disabled={disabled || isLoading}
      className={cn(
        'inline-flex items-center justify-center gap-2 font-medium rounded-md',
        'transition-all duration-200 ease-in-out',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        variants[variant],
        sizes[size],
        fullWidth && 'w-full',
        className
      )}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : leftIcon}
      {children}
      {!isLoading && rightIcon}
    </button>
  )
})

Button.displayName = 'Button'

export default Button
