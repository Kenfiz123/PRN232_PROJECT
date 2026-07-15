import { cn } from '../../utils/helpers'

const variants = {
  default: 'bg-dark-100 text-dark-700',
  primary: 'bg-primary-100 text-primary-800',
  secondary: 'bg-dark-200 text-dark-700',
  success: 'bg-success-100 text-success-800',
  warning: 'bg-warning-100 text-warning-800',
  danger: 'bg-danger-100 text-danger-800',
  info: 'bg-accent-100 text-accent-800',
}

const sizes = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-0.5 text-sm',
  lg: 'px-3 py-1 text-base',
}

function Badge({ 
  children, 
  variant = 'default', 
  size = 'md',
  className,
  dot = false,
  ...props 
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 font-medium rounded-full',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {dot && (
        <span className={cn('w-1.5 h-1.5 rounded-full', {
          'bg-dark-500': variant === 'default',
          'bg-primary-600': variant === 'primary',
          'bg-success-600': variant === 'success',
          'bg-warning-600': variant === 'warning',
          'bg-danger-600': variant === 'danger',
          'bg-accent-600': variant === 'info',
        })} />
      )}
      {children}
    </span>
  )
}

export default Badge
