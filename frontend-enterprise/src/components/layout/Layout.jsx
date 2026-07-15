import { cn } from '../../utils/helpers'
import { useUIStore } from '../../stores/uiStore'
import Sidebar from './Sidebar'
import Header from './Header'
import { ToastProvider } from '../ui/Toast'

function Layout({ children }) {
  const { sidebarCollapsed, sidebarMobileOpen, closeMobileSidebar } = useUIStore()

  return (
    <ToastProvider>
      <div className="min-h-screen bg-gray-50 dark:bg-dark-900">
        <Sidebar />
        <Header />

        {/* Mobile sidebar overlay */}
        {sidebarMobileOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-30 md:hidden"
            onClick={closeMobileSidebar}
          />
        )}

        {/* Main content */}
        <main
          className={cn(
            'pt-16 min-h-screen transition-all duration-300',
            sidebarCollapsed ? 'md:pl-16' : 'md:pl-64'
          )}
        >
          <div className="p-6 max-w-[1400px] mx-auto">
            {children}
          </div>
        </main>
      </div>
    </ToastProvider>
  )
}

export default Layout
