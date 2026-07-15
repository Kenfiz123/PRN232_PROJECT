import { useState, useRef, useEffect } from 'react'
import { useLocation, Link } from 'react-router-dom'
import { cn } from '../../utils/helpers'
import { useUIStore } from '../../stores/uiStore'
import { useAuthStore } from '../../stores/authStore'
import { useNotificationStore } from '../../stores/notificationStore'
import Avatar from '../ui/Avatar'
import {
  Search,
  Bell,
  Menu,
  Settings,
  User,
  LogOut,
  X,
  Check,
  AlertCircle,
  Sun,
  Moon,
} from 'lucide-react'
import { formatDateTime } from '../../utils/helpers'

function Header() {
  const location = useLocation()
  const { sidebarCollapsed, toggleMobileSidebar, theme, toggleTheme } = useUIStore()
  const { user, logout } = useAuthStore()
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotificationStore()
  const [showSearch, setShowSearch] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showNotifications, setShowNotifications] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const notifRef = useRef(null)
  const userRef = useRef(null)

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifications(false)
      }
      if (userRef.current && !userRef.current.contains(event.target)) {
        setShowUserMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const getBreadcrumbs = () => {
    const paths = location.pathname.split('/').filter(Boolean)
    return paths.map((path, index) => ({
      label: path.charAt(0).toUpperCase() + path.slice(1),
      href: '/' + paths.slice(0, index + 1).join('/'),
    }))
  }

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'success': return <Check className="w-4 h-4 text-success-500" />
      case 'error': return <AlertCircle className="w-4 h-4 text-danger-500" />
      default: return <Bell className="w-4 h-4 text-primary-500" />
    }
  }

  return (
    <header
      className={cn(
        'fixed top-0 right-0 h-16 z-30',
        'flex items-center justify-between px-6',
        'bg-white dark:bg-dark-800 border-b border-gray-200 dark:border-dark-700',
        'transition-all duration-300',
        sidebarCollapsed ? 'left-16' : 'left-64',
        'max-md:left-0'
      )}
    >
      {/* Left side */}
      <div className="flex items-center gap-4">
        <button
          onClick={toggleMobileSidebar}
          className="md:hidden p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-dark-700 dark:text-gray-400 rounded-md"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Breadcrumbs */}
        <nav className="hidden sm:flex items-center gap-2 text-sm">
          <Link to="/" className="text-gray-400 dark:text-gray-500 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
            Trang chủ
          </Link>
          {getBreadcrumbs().map((crumb, index) => (
            <span key={crumb.href} className="flex items-center gap-2">
              <span className="text-gray-300 dark:text-gray-600">/</span>
              {index === getBreadcrumbs().length - 1 ? (
                <span className="text-gray-800 dark:text-gray-200 font-medium">{crumb.label}</span>
              ) : (
                <Link to={crumb.href} className="text-gray-400 dark:text-gray-500 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                  {crumb.label}
                </Link>
              )}
            </span>
          ))}
        </nav>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-1">
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-dark-700 dark:text-gray-400 rounded-md transition-colors"
          title={theme === 'dark' ? 'Chuyển sang chế độ sáng' : 'Chuyển sang chế độ tối'}
        >
          {theme === 'dark' ? (
            <Sun className="w-5 h-5" />
          ) : (
            <Moon className="w-5 h-5" />
          )}
        </button>

        {/* Search */}
        <div className="relative">
          {showSearch ? (
            <div className="flex items-center gap-2 animate-fade-in">
              <input
                type="text"
                placeholder="Tìm kiếm..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-64 px-4 py-2 text-sm bg-white dark:bg-dark-700 border border-gray-200 dark:border-dark-600 rounded-lg focus:outline-none focus:border-primary-500 dark:focus:border-primary-400 text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500"
                autoFocus
              />
              <button
                onClick={() => {
                  setShowSearch(false)
                  setSearchQuery('')
                }}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-dark-700 dark:hover:text-gray-300 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowSearch(true)}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-dark-700 dark:text-gray-400 rounded-md transition-colors"
            >
              <Search className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Notifications */}
        <div ref={notifRef} className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-dark-700 dark:text-gray-400 rounded-md transition-colors"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-danger-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-600 rounded-xl shadow-lg overflow-hidden animate-fade-in">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-dark-700">
                <h3 className="font-semibold text-gray-800 dark:text-gray-200">Thông báo</h3>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-xs text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300 font-medium"
                  >
                    Đánh dấu tất cả đã đọc
                  </button>
                )}
              </div>
              <div className="max-h-96 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                    Không có thông báo nào
                  </div>
                ) : (
                  notifications.slice(0, 5).map((notif) => (
                    <button
                      key={notif.id}
                      onClick={() => markAsRead(notif.id)}
                      className={cn(
                        'w-full flex items-start gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors text-left border-b border-gray-100 dark:border-dark-700 last:border-0',
                        !notif.read && 'bg-primary-50/50 dark:bg-primary-900/10'
                      )}
                    >
                      <div className="flex-shrink-0 mt-0.5">
                        {getNotificationIcon(notif.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-800 dark:text-gray-200 font-medium truncate">
                          {notif.title}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                          {notif.message}
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                          {formatDateTime(notif.createdAt)}
                        </p>
                      </div>
                      {!notif.read && (
                        <span className="w-2 h-2 bg-primary-500 rounded-full flex-shrink-0 mt-2" />
                      )}
                    </button>
                  ))
                )}
              </div>
              {notifications.length > 5 && (
                <Link
                  to="/notifications"
                  onClick={() => setShowNotifications(false)}
                  className="block px-4 py-3 text-center text-sm text-primary-600 dark:text-primary-400 hover:bg-gray-50 dark:hover:bg-dark-700 border-t border-gray-100 dark:border-dark-700 font-medium"
                >
                  Xem tất cả thông báo
                </Link>
              )}
            </div>
          )}
        </div>

        {/* User Menu */}
        <div ref={userRef} className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 p-1 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-md transition-colors"
          >
            <Avatar name={user?.fullName || user?.email || 'User'} size="sm" />
            <span className="hidden lg:block text-sm font-medium text-gray-700 dark:text-gray-300">
              {user?.fullName || user?.email?.split('@')[0] || 'User'}
            </span>
          </button>

          {showUserMenu && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-600 rounded-xl shadow-lg py-1 animate-fade-in overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 dark:border-dark-700">
                <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                  {user?.fullName || 'User'}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user?.email}</p>
              </div>
              <Link
                to="/profile"
                onClick={() => setShowUserMenu(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-dark-700 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
              >
                <User className="w-4 h-4" />
                Hồ sơ cá nhân
              </Link>
              <Link
                to="/settings"
                onClick={() => setShowUserMenu(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-dark-700 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
              >
                <Settings className="w-4 h-4" />
                Cài đặt
              </Link>
              <div className="border-t border-gray-100 dark:border-dark-700 mt-1 pt-1">
                <button
                  onClick={() => {
                    setShowUserMenu(false)
                    logout()
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-danger-600 dark:text-danger-400 hover:bg-danger-50 dark:hover:bg-danger-900/20 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Đăng xuất
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

export default Header
