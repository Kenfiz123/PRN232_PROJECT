import { Link } from 'react-router-dom'
import { ChevronRight, Home } from 'lucide-react'
import { cn } from '../../utils/helpers'

function Breadcrumb({ items, className }) {
  return (
    <nav className={cn('flex', className)} aria-label="Breadcrumb">
      <ol className="flex items-center gap-2">
        <li>
          <Link
            to="/"
            className="text-dark-400 hover:text-primary-600 transition-colors"
            aria-label="Home"
          >
            <Home className="w-4 h-4" />
          </Link>
        </li>
        {items.map((item, index) => (
          <li key={index} className="flex items-center gap-2">
            <ChevronRight className="w-4 h-4 text-dark-300" />
            {item.href ? (
              <Link
                to={item.href}
                className="text-dark-500 hover:text-primary-600 transition-colors text-sm"
              >
                {item.label}
              </Link>
            ) : (
              <span className="text-dark-800 font-medium text-sm">
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}

export default Breadcrumb
