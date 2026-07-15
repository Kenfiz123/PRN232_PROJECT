import { forwardRef } from 'react'
import { cn } from '../../utils/helpers'

const Card = forwardRef(({
  children,
  className,
  hover = false,
  padding = 'default',
  border = true,
  shadow = 'default',
  ...props
}, ref) => {
  const paddings = {
    none: '',
    sm: 'p-4',
    default: 'p-6',
    lg: 'p-8',
  }

  const shadows = {
    none: '',
    default: 'shadow-card',
    soft: 'shadow-soft',
    elevated: 'shadow-elevated',
  }

  return (
    <div
      ref={ref}
      className={cn(
        'bg-white rounded-lg',
        border && 'border border-dark-100',
        shadows[shadow],
        paddings[padding],
        hover && 'hover:shadow-card-hover transition-shadow duration-300 cursor-pointer',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
})

Card.displayName = 'Card'

export const CardHeader = ({ children, className, ...props }) => (
  <div className={cn('mb-4', className)} {...props}>
    {children}
  </div>
)

export const CardTitle = ({ children, className, as: Component = 'h3', ...props }) => (
  <Component className={cn('text-lg font-semibold text-dark-800', className)} {...props}>
    {children}
  </Component>
)

export const CardDescription = ({ children, className, ...props }) => (
  <p className={cn('text-sm text-dark-500 mt-1', className)} {...props}>
    {children}
  </p>
)

export const CardContent = ({ children, className, ...props }) => (
  <div className={cn('', className)} {...props}>
    {children}
  </div>
)

export const CardFooter = ({ children, className, ...props }) => (
  <div className={cn('mt-4 pt-4 border-t border-dark-100 flex items-center gap-3', className)} {...props}>
    {children}
  </div>
)

export default Card
