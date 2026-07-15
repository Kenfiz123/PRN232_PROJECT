import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useToast } from '../context/ToastContext'

const notificationsData = [
  { id: 1, title: 'Report Approved', message: 'Your Q4 Event Summary report has been approved by the admin.', time: '2 hours ago', type: 'success', read: false, icon: 'check' },
  { id: 2, title: 'New Budget Request', message: 'Photography Club submitted a new budget request for $3,500.', time: '4 hours ago', type: 'info', read: false, icon: 'dollar' },
  { id: 3, title: 'Event Reminder', message: 'Tech Symposium 2024 is happening in 5 days. Complete your preparations.', time: '6 hours ago', type: 'warning', read: false, icon: 'calendar' },
  { id: 4, title: 'New Member Joined', message: 'Emma Thompson joined the Environmental Club.', time: '8 hours ago', type: 'info', read: true, icon: 'user' },
  { id: 5, title: 'Report Rejected', message: 'Your Budget Allocation proposal was rejected. Please review and resubmit.', time: '1 day ago', type: 'error', read: true, icon: 'x' },
  { id: 6, title: 'Payment Received', message: 'Payment of $5,000 received for Tech Symposium sponsorship.', time: '1 day ago', type: 'success', read: true, icon: 'check' },
  { id: 7, title: 'Equipment Delivered', message: 'New laptops for Robotics Club have been delivered to Storage Room B.', time: '2 days ago', type: 'info', read: true, icon: 'box' },
  { id: 8, title: 'Meeting Scheduled', message: 'Club Presidents meeting scheduled for December 20th at 3 PM.', time: '2 days ago', type: 'warning', read: true, icon: 'calendar' },
  { id: 9, title: 'New Report Submitted', message: 'Winter Concert Planning report submitted by Music Ensemble.', time: '3 days ago', type: 'info', read: true, icon: 'file' },
  { id: 10, title: 'Club Anniversary', message: 'Celebrating 5 years of Debate Society! Congratulations!', time: '4 days ago', type: 'success', read: true, icon: 'star' }
]

const notificationIcons = {
  check: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  ),
  dollar: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  calendar: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  user: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  ),
  x: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  box: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
  ),
  file: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  star: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
    </svg>
  )
}

const typeConfig = {
  success: { bg: 'bg-green-500/20', text: 'text-green-400', border: 'border-green-500/30' },
  error: { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/30' },
  warning: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', border: 'border-yellow-500/30' },
  info: { bg: 'bg-cyan-500/20', text: 'text-cyan-400', border: 'border-cyan-500/30' }
}

export default function NotificationsPage() {
  const { success } = useToast()
  const [notifications, setNotifications] = useState(notificationsData)
  const [filter, setFilter] = useState('all')
  const [selectedNotification, setSelectedNotification] = useState(null)

  const unreadCount = notifications.filter(n => !n.read).length

  const filteredNotifications = notifications
    .filter(n => filter === 'all' || n.type === filter)
    .sort((a, b) => (b.read === a.read ? 0 : b.read ? 1 : -1))

  const markAsRead = (id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
  }

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    success('All notifications marked as read')
  }

  const deleteNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
    success('Notification deleted')
  }

  const clearAll = () => {
    setNotifications([])
    success('All notifications cleared')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4"
      >
        <div>
          <h2 className="font-orbitron text-2xl font-bold text-white">Notifications</h2>
          <p className="text-gray-400 text-sm mt-1">
            {unreadCount > 0 ? `You have ${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
          </p>
        </div>
        <div className="flex gap-3">
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="cyber-btn text-sm"
            >
              Mark All Read
            </button>
          )}
          {notifications.length > 0 && (
            <button
              onClick={clearAll}
              className="cyber-btn cyber-btn-danger text-sm"
            >
              Clear All
            </button>
          )}
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex gap-2 flex-wrap"
      >
        {[
          { key: 'all', label: 'All', count: notifications.length },
          { key: 'success', label: 'Success', count: notifications.filter(n => n.type === 'success').length },
          { key: 'info', label: 'Info', count: notifications.filter(n => n.type === 'info').length },
          { key: 'warning', label: 'Warning', count: notifications.filter(n => n.type === 'warning').length },
          { key: 'error', label: 'Error', count: notifications.filter(n => n.type === 'error').length }
        ].map(({ key, label, count }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${
              filter === key
                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50'
                : 'bg-white/5 text-gray-400 border border-white/10 hover:border-white/20'
            }`}
          >
            {label}
            <span className={`px-2 py-0.5 rounded text-xs ${
              filter === key ? 'bg-cyan-500/30' : 'bg-white/10'
            }`}>
              {count}
            </span>
          </button>
        ))}
      </motion.div>

      {/* Notifications List */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-3"
      >
        <AnimatePresence mode="popLayout">
          {filteredNotifications.map((notification, index) => (
            <motion.div
              key={notification.id}
              layout
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: -100, scale: 0.9 }}
              transition={{ delay: index * 0.03 }}
              className={`relative p-5 rounded-xl border transition-all cursor-pointer group ${
                notification.read
                  ? 'bg-white/5 border-white/10 hover:border-white/20'
                  : `bg-white/5 border ${typeConfig[notification.type].border} hover:border-cyan-500/50`
              }`}
              onClick={() => {
                setSelectedNotification(notification)
                if (!notification.read) markAsRead(notification.id)
              }}
            >
              {/* Unread Indicator */}
              {!notification.read && (
                <div className="absolute top-5 left-0 w-1 h-12 bg-gradient-to-b from-cyan-400 to-purple-400 rounded-r-full" />
              )}

              <div className="flex items-start gap-4">
                {/* Icon */}
                <div className={`p-3 rounded-xl ${typeConfig[notification.type].bg} ${typeConfig[notification.type].text}`}>
                  {notificationIcons[notification.icon]}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className={`font-semibold ${notification.read ? 'text-gray-300' : 'text-white'}`}>
                      {notification.title}
                    </h4>
                    <span className="text-xs text-gray-500">{notification.time}</span>
                  </div>
                  <p className="text-sm text-gray-400 line-clamp-2">{notification.message}</p>

                  {!notification.read && (
                    <div className="flex items-center gap-2 mt-3">
                      <span className={`cyber-badge ${
                        notification.type === 'success' ? 'cyber-badge-green' :
                        notification.type === 'error' ? 'cyber-badge-pink' :
                        notification.type === 'warning' ? 'cyber-badge-cyan' : 'cyber-badge-purple'
                      }`}>
                        New
                      </span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  {!notification.read && (
                    <button
                      onClick={(e) => { e.stopPropagation(); markAsRead(notification.id) }}
                      className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all"
                      title="Mark as read"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </button>
                  )}
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteNotification(notification.id) }}
                    className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-all"
                    title="Delete"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      {/* Empty State */}
      {filteredNotifications.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-16"
        >
          <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-white/5 flex items-center justify-center">
            <svg className="w-10 h-10 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </div>
          <p className="text-gray-500 text-lg">No notifications</p>
          <p className="text-gray-600 text-sm mt-1">You're all caught up!</p>
        </motion.div>
      )}
    </div>
  )
}
