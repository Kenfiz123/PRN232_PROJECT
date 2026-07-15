import { useState } from 'react'
import { cn } from '../../utils/helpers'

function Tabs({ tabs, defaultTab, onChange, className }) {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.value)

  const handleTabChange = (value) => {
    setActiveTab(value)
    onChange?.(value)
  }

  return (
    <div className={className}>
      <div className="border-b border-dark-200">
        <nav className="flex gap-6 -mb-px">
          {tabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => handleTabChange(tab.value)}
              className={cn(
                'py-3 px-1 text-sm font-medium border-b-2 transition-colors',
                activeTab === tab.value
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-dark-500 hover:text-dark-700 hover:border-dark-300'
              )}
            >
              {tab.icon && <span className="mr-2">{tab.icon}</span>}
              {tab.label}
              {tab.count !== undefined && (
                <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-dark-100 text-dark-600">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>
      <div className="py-4">
        {tabs.find(tab => tab.value === activeTab)?.content}
      </div>
    </div>
  )
}

export default Tabs

export const TabPanel = ({ children, className }) => (
  <div className={cn('', className)}>{children}</div>
)
