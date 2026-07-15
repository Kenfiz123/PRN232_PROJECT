import { createContext, useContext, useState, useCallback } from 'react'
import { cn } from '../../utils/helpers'
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react'

const ToastContext = createContext()

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const addToast = useCallback((toast) => {
    const id = Date.now()
    setToasts(prev => [...prev, { ...toast, id }])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, toast.duration || 5000)
    return id
  }, [])

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const toast = {
    success: (message, title) => addToast({ type: 'success', message, title }),
    error: (message, title) => addToast({ type: 'error', message, title }),
    warning: (message, title) => addToast({ type: 'warning', message, title }),
    info: (message, title) => addToast({ type: 'info', message, title }),
  }

  return (
    <ToastContext.Provider value={{ toast, addToast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within ToastProvider')
  }
  return context
}

function ToastContainer({ toasts, removeToast }) {
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
      {toasts.map(toast => (
        <Toast key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
      ))}
    </div>
  )
}

function Toast({ toast, onClose }) {
  const types = {
    success: {
      icon: CheckCircle,
      light: {
        bg: 'bg-success-50 border-success-200',
        iconColor: 'text-success-600',
        titleColor: 'text-success-800',
        msgColor: 'text-success-700',
      },
      dark: {
        bg: 'bg-success-900/30 border-success-700/50',
        iconColor: 'text-success-400',
        titleColor: 'text-success-300',
        msgColor: 'text-success-400',
      },
    },
    error: {
      icon: AlertCircle,
      light: {
        bg: 'bg-danger-50 border-danger-200',
        iconColor: 'text-danger-600',
        titleColor: 'text-danger-800',
        msgColor: 'text-danger-700',
      },
      dark: {
        bg: 'bg-danger-900/30 border-danger-700/50',
        iconColor: 'text-danger-400',
        titleColor: 'text-danger-300',
        msgColor: 'text-danger-400',
      },
    },
    warning: {
      icon: AlertTriangle,
      light: {
        bg: 'bg-warning-50 border-warning-200',
        iconColor: 'text-warning-600',
        titleColor: 'text-warning-800',
        msgColor: 'text-warning-700',
      },
      dark: {
        bg: 'bg-warning-900/30 border-warning-700/50',
        iconColor: 'text-warning-400',
        titleColor: 'text-warning-300',
        msgColor: 'text-warning-400',
      },
    },
    info: {
      icon: Info,
      light: {
        bg: 'bg-accent-50 border-accent-200',
        iconColor: 'text-accent-600',
        titleColor: 'text-accent-800',
        msgColor: 'text-accent-700',
      },
      dark: {
        bg: 'bg-accent-900/30 border-accent-700/50',
        iconColor: 'text-accent-400',
        titleColor: 'text-accent-300',
        msgColor: 'text-accent-400',
      },
    },
  }

  const config = types[toast.type]
  const Icon = config.icon
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark'
  const colors = isDark ? config.dark : config.light

  return (
    <div
      className={cn(
        'flex items-start gap-3 p-4 rounded-lg border shadow-elevated',
        'animate-slide-in-right',
        colors.bg
      )}
      role="alert"
    >
      <Icon className={cn('w-5 h-5 flex-shrink-0 mt-0.5', colors.iconColor)} />
      <div className="flex-1 min-w-0">
        {toast.title && (
          <p className={cn('font-semibold text-sm', colors.titleColor)}>{toast.title}</p>
        )}
        <p className={cn('text-sm', colors.msgColor)}>{toast.message}</p>
      </div>
      <button
        onClick={onClose}
        className="flex-shrink-0 p-1 rounded hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
      >
        <X className={cn('w-4 h-4', isDark ? 'text-gray-400' : 'text-gray-500')} />
      </button>
    </div>
  )
}

export default Toast
