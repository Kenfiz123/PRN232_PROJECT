import { useState } from 'react'
import {
  Bell,
  Check,
  CheckCheck,
  Trash2,
  Filter,
  AlertCircle,
  Info,
  CheckCircle,
  XCircle,
  UserPlus,
  FileText,
  Calendar,
  Wallet,
} from 'lucide-react'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import Avatar from '../components/ui/Avatar'
import EmptyState from '../components/ui/EmptyState'
import { formatDateTime, cn } from '../utils/helpers'

const mockNotifications = [
  {
    id: 1,
    type: 'success',
    title: 'Báo cáo được phê duyệt',
    message: 'Báo cáo hoạt động tháng 6/2024 của Câu lạc bộ IT đã được phê duyệt.',
    read: false,
    createdAt: '2024-07-14T10:30:00',
    icon: CheckCircle,
  },
  {
    id: 2,
    type: 'warning',
    title: 'Nhắc nhở deadline',
    message: 'Báo cáo tài chính Q2/2024 sắp đến hạn. Vui lòng nộp trước ngày 20/07/2024.',
    read: false,
    createdAt: '2024-07-14T09:00:00',
    icon: AlertCircle,
  },
  {
    id: 3,
    type: 'info',
    title: 'Thành viên mới',
    message: 'Lê Văn C đã được thêm vào Câu lạc bộ Văn nghệ.',
    read: true,
    createdAt: '2024-07-13T15:30:00',
    icon: UserPlus,
  },
  {
    id: 4,
    type: 'error',
    title: 'Báo cáo bị từ chối',
    message: 'Báo cáo tài chính tháng 6/2024 bị từ chối. Lý do: Cần bổ sung chứng từ.',
    read: true,
    createdAt: '2024-07-13T14:00:00',
    icon: XCircle,
  },
  {
    id: 5,
    type: 'info',
    title: 'Hoạt động mới được tạo',
    message: 'Workshop ReactJS đã được tạo cho Câu lạc bộ IT. Sự kiện diễn ra ngày 15/07/2024.',
    read: true,
    createdAt: '2024-07-12T10:00:00',
    icon: Calendar,
  },
  {
    id: 6,
    type: 'success',
    title: 'Ngân sách được duyệt',
    message: 'Đề xuất ngân sách tháng 8/2024 của Câu lạc bộ Thể thao đã được phê duyệt.',
    read: true,
    createdAt: '2024-07-11T16:00:00',
    icon: Wallet,
  },
]

const filterOptions = [
  { value: 'all', label: 'Tất cả' },
  { value: 'unread', label: 'Chưa đọc' },
  { value: 'read', label: 'Đã đọc' },
]

function Notifications() {
  const [notifications, setNotifications] = useState(mockNotifications)
  const [filter, setFilter] = useState('all')

  const filteredNotifications = notifications.filter(notif => {
    if (filter === 'unread') return !notif.read
    if (filter === 'read') return notif.read
    return true
  })

  const unreadCount = notifications.filter(n => !n.read).length

  const markAsRead = (id) => {
    setNotifications(notifications.map(n => 
      n.id === id ? { ...n, read: true } : n
    ))
  }

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })))
  }

  const deleteNotification = (id) => {
    setNotifications(notifications.filter(n => n.id !== id))
  }

  const getIconConfig = (type) => {
    const config = {
      success: { icon: CheckCircle, color: 'text-success-600 bg-success-100' },
      warning: { icon: AlertCircle, color: 'text-warning-600 bg-warning-100' },
      error: { icon: XCircle, color: 'text-danger-600 bg-danger-100' },
      info: { icon: Info, color: 'text-accent-600 bg-accent-100' },
    }
    return config[type] || config.info
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-dark-900">Thông báo</h1>
          <p className="text-dark-500 mt-1">
            {unreadCount > 0 
              ? `Bạn có ${unreadCount} thông báo chưa đọc`
              : 'Tất cả thông báo đã được đọc'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {unreadCount > 0 && (
            <Button variant="secondary" leftIcon={<CheckCheck className="w-4 h-4" />} onClick={markAllAsRead}>
              Đánh dấu tất cả đã đọc
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <Card padding="sm">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-dark-400" />
          {filterOptions.map(option => (
            <button
              key={option.value}
              onClick={() => setFilter(option.value)}
              className={cn(
                'px-4 py-2 text-sm font-medium rounded-lg transition-colors',
                filter === option.value
                  ? 'bg-primary-100 text-primary-800'
                  : 'text-dark-500 hover:bg-dark-100'
              )}
            >
              {option.label}
              {option.value === 'unread' && unreadCount > 0 && (
                <span className="ml-2 px-2 py-0.5 text-xs bg-danger-500 text-white rounded-full">
                  {unreadCount}
                </span>
              )}
            </button>
          ))}
        </div>
      </Card>

      {/* Notifications List */}
      <div className="space-y-3">
        {filteredNotifications.length === 0 ? (
          <Card>
            <EmptyState
              icon={Bell}
              title="Không có thông báo"
              description={filter === 'unread' 
                ? 'Tất cả thông báo đã được đọc'
                : 'Không có thông báo nào phù hợp với bộ lọc'
              }
            />
          </Card>
        ) : (
          filteredNotifications.map((notification) => {
            const { icon: Icon, color } = getIconConfig(notification.type)
            return (
              <Card
                key={notification.id}
                className={cn(
                  'transition-all duration-200',
                  !notification.read && 'border-l-4 border-l-primary-500 bg-primary-50/30'
                )}
              >
                <div className="flex items-start gap-4">
                  <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0', color)}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className={cn(
                          'font-semibold',
                          notification.read ? 'text-dark-700' : 'text-dark-900'
                        )}>
                          {notification.title}
                        </h3>
                        <p className="text-sm text-dark-600 mt-1">{notification.message}</p>
                        <p className="text-xs text-dark-400 mt-2">
                          {formatDateTime(notification.createdAt)}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {!notification.read && (
                          <button
                            onClick={() => markAsRead(notification.id)}
                            className="p-2 text-dark-400 hover:text-primary-600 hover:bg-primary-50 rounded-md transition-colors"
                            title="Đánh dấu đã đọc"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => deleteNotification(notification.id)}
                          className="p-2 text-dark-400 hover:text-danger-600 hover:bg-danger-50 rounded-md transition-colors"
                          title="Xóa thông báo"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}

export default Notifications
