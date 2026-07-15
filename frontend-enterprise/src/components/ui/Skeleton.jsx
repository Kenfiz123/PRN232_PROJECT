import { cn } from '../../utils/helpers'

function Skeleton({ className, variant = 'text', ...props }) {
  const variants = {
    text: 'h-4 rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-md',
    card: 'rounded-lg h-32',
  }

  return (
    <div
      className={cn(
        'animate-pulse bg-dark-200',
        variants[variant],
        className
      )}
      {...props}
    />
  )
}

export const SkeletonText = ({ lines = 3, className }) => (
  <div className={cn('space-y-2', className)}>
    {[...Array(lines)].map((_, i) => (
      <Skeleton key={i} className={i === lines - 1 ? 'w-3/4' : 'w-full'} />
    ))}
  </div>
)

export const SkeletonCard = ({ className }) => (
  <div className={cn('bg-white rounded-lg border border-dark-200 p-6', className)}>
    <div className="flex items-center gap-4 mb-4">
      <Skeleton variant="circular" className="w-12 h-12" />
      <div className="flex-1 space-y-2">
        <Skeleton className="w-1/3 h-4" />
        <Skeleton className="w-1/2 h-3" />
      </div>
    </div>
    <SkeletonText lines={3} />
  </div>
)

export const SkeletonTable = ({ rows = 5, columns = 4, className }) => (
  <div className={cn('bg-white rounded-lg border border-dark-200 overflow-hidden', className)}>
    <div className="border-b border-dark-200 p-4">
      <div className="flex gap-4">
        {[...Array(columns)].map((_, i) => (
          <Skeleton key={i} className="w-24 h-4" />
        ))}
      </div>
    </div>
    {[...Array(rows)].map((_, i) => (
      <div key={i} className="border-b border-dark-100 p-4 flex gap-4">
        {[...Array(columns)].map((_, j) => (
          <Skeleton key={j} className="w-full h-4" />
        ))}
      </div>
    ))}
  </div>
)

export default Skeleton
