import { NavLink, useLocation } from 'react-router-dom'
import { cn } from '../../utils/helpers'
import { useUIStore } from '../../stores/uiStore'
import { useAuthStore } from '../../stores/authStore'
import Avatar from '../ui/Avatar'
import {
  LayoutDashboard,
  Users,
  FileText,
  Calendar,
  Wallet,
  Bell,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  ChevronDown,
  Shield,
} from 'lucide-react'
import { useState } from 'react'

const mainNavItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
  { icon: Users, label: 'CLBs', path: '/clubs' },
  { icon: FileText, label: 'Báo cáo', path: '/reports' },
  { icon: Calendar, label: 'Hoạt động', path: '/activities' },
  { icon: Wallet, label: 'Tài chính', path: '/finance' },
]

const bottomNavItems = [
  { icon: Bell, label: 'Thông báo', path: '/notifications' },
  { icon: Settings, label: 'Cài đặt', path: '/settings' },
]

function Sidebar() {
  const { sidebarCollapsed, toggleSidebar } = useUIStore()
  const { user, logout } = useAuthStore()
  const location = useLocation()
  const [showUserMenu, setShowUserMenu] = useState(false)

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/'
    return location.pathname.startsWith(path)
  }

  const isAdmin = user?.role === 'Admin' || user?.role === 'SYSTEM_ADMIN'

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 h-screen z-40',
        'flex flex-col transition-all duration-300',
        'bg-white dark:bg-dark-800 border-r border-gray-200 dark:border-dark-700',
        sidebarCollapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className={cn(
        'h-16 flex items-center justify-between px-4',
        'border-b border-gray-100 dark:border-dark-700'
      )}>
        {!sidebarCollapsed && (
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary-600 to-primary-800 flex items-center justify-center shadow-md">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-bold text-gray-900 dark:text-white text-sm tracking-tight">ClubReport</span>
              <span className="text-primary-600 dark:text-primary-400 font-bold text-sm">Hub</span>
            </div>
          </div>
        )}
        {sidebarCollapsed && (
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary-600 to-primary-800 flex items-center justify-center shadow-md mx-auto">
            <Shield className="w-5 h-5 text-white" />
          </div>
        )}
        <button
          onClick={toggleSidebar}
          className={cn(
            'p-1.5 rounded-md transition-colors',
            'text-gray-400 hover:text-gray-600 hover:bg-gray-100',
            'dark:text-gray-500 dark:hover:text-gray-300 dark:hover:bg-dark-700',
            sidebarCollapsed && 'mx-auto mt-2'
          )}
        >
          {sidebarCollapsed ? (
            <ChevronRight className="w-5 h-5" />
          ) : (
            <ChevronLeft className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 py-4 px-2 overflow-y-auto">
        <div className="space-y-1">
          {mainNavItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200',
                'hover:bg-gray-50 dark:hover:bg-dark-700',
                isActive(item.path)
                  ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 border-l-4 border-primary-600 dark:border-primary-400 -ml-0.5 pl-[calc(0.75rem+4px)]'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              )}
            >
              <item.icon className={cn('w-5 h-5 flex-shrink-0', sidebarCollapsed && 'mx-auto')} />
              {!sidebarCollapsed && (
                <span className="font-medium text-sm">{item.label}</span>
              )}
            </NavLink>
          ))}
        </div>

        {/* Users link - Admin only */}
        {isAdmin && (
          <>
            <div className="my-4 border-t border-gray-100 dark:border-dark-700" />
            <NavLink
              to="/users"
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200',
                'hover:bg-gray-50 dark:hover:bg-dark-700',
                isActive('/users')
                  ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 border-l-4 border-primary-600 dark:border-primary-400 -ml-0.5 pl-[calc(0.75rem+4px)]'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              )}
            >
              <Users className={cn('w-5 h-5 flex-shrink-0', sidebarCollapsed && 'mx-auto')} />
              {!sidebarCollapsed && (
                <span className="font-medium text-sm">Người dùng</span>
              )}
            </NavLink>
          </>
        )}

        <div className="my-4 border-t border-gray-100 dark:border-dark-700" />
        <div className="space-y-1">
          {bottomNavItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200',
                'hover:bg-gray-50 dark:hover:bg-dark-700',
                isActive(item.path)
                  ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 border-l-4 border-primary-600 dark:border-primary-400 -ml-0.5 pl-[calc(0.75rem+4px)]'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              )}
            >
              <item.icon className={cn('w-5 h-5 flex-shrink-0', sidebarCollapsed && 'mx-auto')} />
              {!sidebarCollapsed && (
                <span className="font-medium text-sm">{item.label}</span>
              )}
            </NavLink>
          ))}
        </div>
      </nav>

      {/* User Profile */}
      <div className="border-t border-gray-100 dark:border-dark-700 p-2">
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className={cn(
              'w-full flex items-center gap-3 p-2 rounded-lg transition-colors',
              'hover:bg-gray-50 dark:hover:bg-dark-700',
              sidebarCollapsed && 'justify-center'
            )}
          >
            <Avatar name={user?.fullName || user?.email || 'User'} size="sm" />
            {!sidebarCollapsed && (
              <>
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                    {user?.fullName || user?.email?.split('@')[0] || 'User'}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {user?.role || 'Member'}
                  </p>
                </div>
                <ChevronDown className={cn(
                  'w-4 h-4 text-gray-400 transition-transform',
                  showUserMenu && 'rotate-180'
                )} />
              </>
            )}
          </button>

          {showUserMenu && !sidebarCollapsed && (
            <div className="absolute bottom-full left-0 right-0 mb-2 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-600 rounded-xl shadow-lg py-1 animate-fade-in overflow-hidden">
              <NavLink
                to="/profile"
                className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors"
                onClick={() => setShowUserMenu(false)}
              >
                Hồ sơ cá nhân
              </NavLink>
              <button
                onClick={() => {
                  setShowUserMenu(false)
                  logout()
                }}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-danger-600 dark:text-danger-400 hover:bg-danger-50 dark:hover:bg-danger-900/20 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Đăng xuất
              </button>
            </div>
          )}
        </div>
      </div>
    </aside>
  )
}

export default Sidebar
