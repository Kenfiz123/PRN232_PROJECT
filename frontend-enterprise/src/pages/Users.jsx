import { useState } from 'react'
import {
  Plus,
  Search,
  Filter,
  MoreVertical,
  Edit,
  Trash2,
  UserX,
  Shield,
  Eye,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Select from '../components/ui/Select'
import Badge from '../components/ui/Badge'
import Avatar from '../components/ui/Avatar'
import Modal, { ConfirmModal } from '../components/ui/Modal'
import Table from '../components/ui/Table'
import { formatDate } from '../utils/helpers'

const mockUsers = [
  { id: 1, fullName: 'Nguyễn Văn A', email: 'nguyenvana@example.com', role: 'admin', status: 'active', clubName: 'Quản trị viên', createdAt: '2023-09-01' },
  { id: 2, fullName: 'Trần Thị B', email: 'tranthib@example.com', role: 'manager', status: 'active', clubName: 'CLB IT', createdAt: '2023-09-15' },
  { id: 3, fullName: 'Lê Văn C', email: 'levanc@example.com', role: 'user', status: 'active', clubName: 'CLB Sinh viên', createdAt: '2023-10-01' },
  { id: 4, fullName: 'Phạm Thị D', email: 'phamthid@example.com', role: 'manager', status: 'inactive', clubName: 'CLB Văn nghệ', createdAt: '2023-11-01' },
  { id: 5, fullName: 'Hoàng Văn E', email: 'hoangvane@example.com', role: 'user', status: 'active', clubName: 'CLB Thể thao', createdAt: '2024-01-10' },
  { id: 6, fullName: 'Ngô Thị F', email: 'ngothif@example.com', role: 'user', status: 'pending', clubName: '-', createdAt: '2024-02-20' },
]

const roleOptions = [
  { value: '', label: 'Tất cả vai trò' },
  { value: 'admin', label: 'Quản trị viên' },
  { value: 'manager', label: 'Quản lý CLB' },
  { value: 'user', label: 'Người dùng' },
]

const statusOptions = [
  { value: '', label: 'Tất cả trạng thái' },
  { value: 'active', label: 'Hoạt động' },
  { value: 'inactive', label: 'Không hoạt động' },
  { value: 'pending', label: 'Chờ xác nhận' },
]

function Users() {
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 10

  const filteredUsers = mockUsers.filter((user) => {
    const matchesSearch = user.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesRole = !roleFilter || user.role === roleFilter
    const matchesStatus = !statusFilter || user.status === statusFilter
    return matchesSearch && matchesRole && matchesStatus
  })

  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  )

  const getRoleBadge = (role) => {
    const config = {
      admin: { variant: 'danger', label: 'Quản trị viên' },
      manager: { variant: 'warning', label: 'Quản lý CLB' },
      user: { variant: 'primary', label: 'Người dùng' },
    }
    const { variant, label } = config[role] || config.user
    return <Badge variant={variant}>{label}</Badge>
  }

  const getStatusBadge = (status) => {
    const config = {
      active: { variant: 'success', label: 'Hoạt động' },
      inactive: { variant: 'default', label: 'Không hoạt động' },
      pending: { variant: 'warning', label: 'Chờ xác nhận' },
    }
    const { variant, label } = config[status] || config.active
    return <Badge variant={variant}>{label}</Badge>
  }

  const columns = [
    {
      key: 'fullName',
      header: 'Người dùng',
      sortable: true,
      render: (value, row) => (
        <div className="flex items-center gap-3">
          <Avatar name={value} size="sm" />
          <div>
            <p className="font-medium text-dark-800">{value}</p>
            <p className="text-xs text-dark-500">{row.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'clubName',
      header: 'Câu lạc bộ',
      sortable: true,
    },
    {
      key: 'role',
      header: 'Vai trò',
      sortable: true,
      render: (value) => getRoleBadge(value),
    },
    {
      key: 'status',
      header: 'Trạng thái',
      sortable: true,
      render: (value) => getStatusBadge(value),
    },
    {
      key: 'createdAt',
      header: 'Ngày tạo',
      sortable: true,
      render: (value) => formatDate(value),
    },
    {
      key: 'actions',
      header: 'Thao tác',
      render: (_, row) => (
        <div className="flex items-center gap-1">
          <button className="p-1.5 text-dark-400 hover:text-primary-600 hover:bg-primary-50 rounded-md transition-colors">
            <Eye className="w-4 h-4" />
          </button>
          <button 
            onClick={() => {
              setSelectedUser(row)
              setShowCreateModal(true)
            }}
            className="p-1.5 text-dark-400 hover:text-primary-600 hover:bg-primary-50 rounded-md transition-colors"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              setSelectedUser(row)
              setShowDeleteModal(true)
            }}
            className="p-1.5 text-dark-400 hover:text-danger-600 hover:bg-danger-50 rounded-md transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-dark-900">Quản lý Người dùng</h1>
          <p className="text-dark-500 mt-1">Quản lý tài khoản và phân quyền người dùng</p>
        </div>
        <Button leftIcon={<Plus className="w-4 h-4" />} onClick={() => setShowCreateModal(true)}>
          Thêm người dùng
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Tổng số', value: mockUsers.length, color: 'bg-primary-50 text-primary-700' },
          { label: 'Quản trị', value: mockUsers.filter(u => u.role === 'admin').length, color: 'bg-danger-50 text-danger-700' },
          { label: 'Hoạt động', value: mockUsers.filter(u => u.status === 'active').length, color: 'bg-success-50 text-success-700' },
          { label: 'Chờ xác nhận', value: mockUsers.filter(u => u.status === 'pending').length, color: 'bg-warning-50 text-warning-700' },
        ].map((stat, idx) => (
          <Card key={idx} padding="sm" className={stat.color}>
            <p className="text-2xl font-bold">{stat.value}</p>
            <p className="text-sm font-medium opacity-80">{stat.label}</p>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card padding="sm">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <Input
              type="search"
              placeholder="Tìm kiếm người dùng..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftIcon={<Search className="w-5 h-5" />}
            />
          </div>
          <div className="flex gap-3">
            <Select
              value={roleFilter}
              onChange={setRoleFilter}
              options={roleOptions}
              className="w-44"
            />
            <Select
              value={statusFilter}
              onChange={setStatusFilter}
              options={statusOptions}
              className="w-44"
            />
          </div>
        </div>
      </Card>

      {/* Table */}
      <Table
        columns={columns}
        data={paginatedUsers}
        pagination={true}
        pageSize={pageSize}
      />

      {/* Create/Edit Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false)
          setSelectedUser(null)
        }}
        title={selectedUser ? 'Chỉnh sửa người dùng' : 'Thêm người dùng mới'}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => {
              setShowCreateModal(false)
              setSelectedUser(null)
            }}>Hủy</Button>
            <Button>{selectedUser ? 'Lưu thay đổi' : 'Tạo người dùng'}</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input label="Họ và tên" defaultValue={selectedUser?.fullName} required />
          <Input label="Email" type="email" defaultValue={selectedUser?.email} required />
          <Input label="Số điện thoại" type="tel" />
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Vai trò"
              options={roleOptions.filter(r => r.value)}
              defaultValue={selectedUser?.role || 'user'}
            />
            <Select
              label="Trạng thái"
              options={statusOptions.filter(s => s.value)}
              defaultValue={selectedUser?.status || 'active'}
            />
          </div>
          <Select
            label="Câu lạc bộ"
            options={[
              { value: '', label: 'Không có' },
              { value: '1', label: 'Câu lạc bộ IT' },
              { value: '2', label: 'Câu lạc bộ Sinh viên' },
              { value: '3', label: 'Câu lạc bộ Văn nghệ' },
            ]}
          />
        </div>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false)
          setSelectedUser(null)
        }}
        onConfirm={() => {
          setShowDeleteModal(false)
          setSelectedUser(null)
        }}
        title="Xóa người dùng"
        message={`Bạn có chắc chắn muốn xóa người dùng "${selectedUser?.fullName}"?`}
        confirmText="Xóa"
        variant="danger"
      />
    </div>
  )
}

export default Users
