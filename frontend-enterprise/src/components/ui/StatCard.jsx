import { cn } from '../../utils/helpers'
import { TrendingUp, TrendingDown } from 'lucide-react'
import Card from './Card'

function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  trendValue,
  description,
  loading = false,
  className,
  onClick,
}) {
  const isPositive = trend === 'up'
  const isNegative = trend === 'down'

  return (
    <Card
      hover={!!onClick}
      className={cn('relative overflow-hidden', className)}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-dark-500 mb-1">{title}</p>
          {loading ? (
            <div className="h-8 w-24 bg-dark-200 rounded animate-pulse" />
          ) : (
            <p className="text-2xl font-bold text-dark-900">{value}</p>
          )}
          
          {(trendValue || description) && (
            <div className="flex items-center gap-2 mt-2">
              {trendValue && (
                <span className={cn(
                  'inline-flex items-center gap-1 text-sm font-medium',
                  isPositive && 'text-success-600',
                  isNegative && 'text-danger-600',
                  !isPositive && !isNegative && 'text-dark-500'
                )}>
                  {isPositive && <TrendingUp className="w-4 h-4" />}
                  {isNegative && <TrendingDown className="w-4 h-4" />}
                  {trendValue}
                </span>
              )}
              {description && (
                <span className="text-sm text-dark-400">{description}</span>
              )}
            </div>
          )}
        </div>
        
        {Icon && (
          <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-primary-100 flex items-center justify-center">
            <Icon className="w-6 h-6 text-primary-600" />
          </div>
        )}
      </div>

      {/* Decorative gradient */}
      <div className="absolute -right-4 -bottom-4 w-24 h-24 rounded-full bg-primary-50 opacity-50" />
    </Card>
  )
}

export default StatCard
