import { forwardRef, useState, useRef, useEffect } from 'react'
import { cn } from '../../utils/helpers'
import { ChevronDown, Check, X, AlertCircle } from 'lucide-react'

const Select = forwardRef(({
  label,
  options = [],
  value,
  onChange,
  placeholder = 'Chọn...',
  error,
  helperText,
  required,
  disabled,
  multiple = false,
  searchable = false,
  className,
  containerClassName,
}, ref) => {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')
  const containerRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const filteredOptions = searchable
    ? options.filter(opt => 
        opt.label.toLowerCase().includes(search.toLowerCase())
      )
    : options

  const selectedOptions = multiple
    ? options.filter(opt => value?.includes(opt.value))
    : options.find(opt => opt.value === value)

  const handleSelect = (option) => {
    if (multiple) {
      const newValue = value?.includes(option.value)
        ? value.filter(v => v !== option.value)
        : [...(value || []), option.value]
      onChange(newValue)
    } else {
      onChange(option.value)
      setIsOpen(false)
    }
    setSearch('')
  }

  const handleRemove = (e, val) => {
    e.stopPropagation()
    onChange(value.filter(v => v !== val))
  }

  return (
    <div ref={containerRef} className={cn('w-full', containerClassName)}>
      {label && (
        <label className="block text-sm font-medium text-dark-700 mb-1.5">
          {label}
          {required && <span className="text-danger-500 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className={cn(
            'w-full px-4 py-2.5 bg-white border rounded-md text-left',
            'flex items-center justify-between gap-2',
            'transition-all duration-200',
            error
              ? 'border-danger-500 focus-within:ring-danger-100'
              : 'border-dark-200 focus-within:border-primary-500 focus-within:ring-primary-100',
            disabled && 'bg-dark-50 cursor-not-allowed',
            'focus:outline-none focus:ring-2 focus:ring-offset-0'
          )}
        >
          <div className="flex-1 flex flex-wrap gap-1">
            {multiple && selectedOptions?.length > 0 ? (
              selectedOptions.map(opt => (
                <span key={opt.value} className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary-100 text-primary-800 text-sm rounded">
                  {opt.label}
                  <X className="w-3 h-3 cursor-pointer" onClick={(e) => handleRemove(e, opt.value)} />
                </span>
              ))
            ) : !multiple && selectedOptions ? (
              <span className={cn(!selectedOptions && 'text-dark-400')}>
                {selectedOptions.label}
              </span>
            ) : (
              <span className="text-dark-400">{placeholder}</span>
            )}
          </div>
          <ChevronDown className={cn('w-5 h-5 text-dark-400 transition-transform', isOpen && 'rotate-180')} />
        </button>

        {isOpen && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-dark-200 rounded-md shadow-elevated animate-fade-in">
            {searchable && (
              <div className="p-2 border-b border-dark-100">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Tìm kiếm..."
                  className="w-full px-3 py-2 text-sm border border-dark-200 rounded focus:outline-none focus:border-primary-500"
                  autoFocus
                />
              </div>
            )}
            <div className="max-h-60 overflow-auto">
              {filteredOptions.length === 0 ? (
                <div className="px-4 py-3 text-dark-500 text-sm">Không có kết quả</div>
              ) : (
                filteredOptions.map(option => {
                  const isSelected = multiple
                    ? value?.includes(option.value)
                    : value === option.value
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => handleSelect(option)}
                      className={cn(
                        'w-full px-4 py-2.5 text-left flex items-center justify-between',
                        'hover:bg-primary-50 transition-colors',
                        isSelected && 'bg-primary-50 text-primary-800'
                      )}
                    >
                      <span>{option.label}</span>
                      {isSelected && <Check className="w-4 h-4 text-primary-600" />}
                    </button>
                  )
                })
              )}
            </div>
          </div>
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

Select.displayName = 'Select'

export default Select
