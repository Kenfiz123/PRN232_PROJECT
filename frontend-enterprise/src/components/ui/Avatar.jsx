import { forwardRef } from 'react'
import { cn, getInitials } from '../../utils/helpers'

const Avatar = forwardRef(({
  src,
  alt,
  name,
  size = 'md',
  status,
  className,
  ...props
}, ref) => {
  const sizes = {
    xs: 'w-6 h-6 text-2xs',
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-lg',
    '2xl': 'w-20 h-20 text-xl',
  }

  const statusSizes = {
    xs: 'w-1.5 h-1.5 border',
    sm: 'w-2 h-2 border',
    md: 'w-2.5 h-2.5 border-2',
    lg: 'w-3 h-3 border-2',
    xl: 'w-4 h-4 border-2',
  }

  const statusColors = {
    online: 'bg-success-500',
    offline: 'bg-dark-300',
    busy: 'bg-danger-500',
    away: 'bg-warning-500',
  }

  return (
    <div ref={ref} className={cn('relative inline-flex', className)} {...props}>
      {src ? (
        <img
          src={src}
          alt={alt || name}
          className={cn(
            'rounded-full object-cover bg-dark-100',
            sizes[size]
          )}
        />
      ) : (
        <div
          className={cn(
            'rounded-full bg-primary-100 text-primary-800 font-semibold',
            'flex items-center justify-center',
            sizes[size]
          )}
        >
          {getInitials(name || alt)}
        </div>
      )}
      {status && (
        <span
          className={cn(
            'absolute bottom-0 right-0 rounded-full border-white',
            statusSizes[size],
            statusColors[status]
          )}
        />
      )}
    </div>
  )
})

Avatar.displayName = 'Avatar'

export const AvatarGroup = ({ children, max = 4, size = 'md' }) => {
  const childArray = Array.isArray(children) ? children : [children]
  const visible = childArray.slice(0, max)
  const remaining = childArray.length - max

  return (
    <div className="flex -space-x-2">
      {visible}
      {remaining > 0 && (
        <div
          className={cn(
            'rounded-full bg-dark-200 text-dark-600 font-medium',
            'flex items-center justify-center border-2 border-white',
            size === 'sm' ? 'w-8 h-8 text-xs' : 'w-10 h-10 text-sm'
          )}
        >
          +{remaining}
        </div>
      )}
    </div>
  )
}

export default Avatar
