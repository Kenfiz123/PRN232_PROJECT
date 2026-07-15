import { clsx } from 'clsx'

export function cn(...inputs) {
  return clsx(inputs)
}

export function formatDate(date, options = {}) {
  if (!date) return ''
  const d = new Date(date)
  return d.toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    ...options,
  })
}

export function formatDateTime(date) {
  if (!date) return ''
  const d = new Date(date)
  return d.toLocaleString('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatCurrency(amount, currency = 'VND') {
  if (amount === null || amount === undefined) return ''
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatNumber(num) {
  if (num === null || num === undefined) return ''
  return new Intl.NumberFormat('vi-VN').format(num)
}

export function truncate(str, length = 50) {
  if (!str) return ''
  if (str.length <= length) return str
  return str.substring(0, length) + '...'
}

export function getInitials(name) {
  if (!name) return ''
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2)
}

export function debounce(func, wait) {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

export function generateId() {
  return Math.random().toString(36).substring(2) + Date.now().toString(36)
}

export const STATUS_COLORS = {
  draft: 'bg-dark-100 text-dark-700',
  pending: 'bg-warning-100 text-warning-800',
  submitted: 'bg-primary-100 text-primary-800',
  approved: 'bg-success-100 text-success-800',
  rejected: 'bg-danger-100 text-danger-800',
  active: 'bg-success-100 text-success-800',
  inactive: 'bg-dark-100 text-dark-500',
}

export const REPORT_STATUSES = [
  { value: 'draft', label: 'Nháp' },
  { value: 'submitted', label: 'Đã nộp' },
  { value: 'approved', label: 'Đã duyệt' },
  { value: 'rejected', label: 'Từ chối' },
]

export const CLUB_STATUSES = [
  { value: 'active', label: 'Hoạt động' },
  { value: 'inactive', label: 'Không hoạt động' },
  { value: 'suspended', label: 'Tạm ngưng' },
]
