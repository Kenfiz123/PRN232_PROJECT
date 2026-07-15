import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Plus,
  Search,
  Filter,
  Download,
  Eye,
  Edit,
  Trash2,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  Send,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Select from '../components/ui/Select'
import Badge from '../components/ui/Badge'
import Modal, { ConfirmModal } from '../components/ui/Modal'
import Table from '../components/ui/Table'
import { formatDate, formatDateTime } from '../utils/helpers'

const mockReports = [
  {
    id: 1,
    title: 'Báo cáo hoạt động tháng 6/2024',
    clubName: 'Câu lạc bộ IT',
    type: 'activity',
    status: 'approved',
    submittedAt: '2024-07-01',
    submittedBy: 'Nguyễn Văn A',
    reviewedAt: '2024-07-02',
    reviewer: 'Trần Admin',
  },
  {
    id: 2,
    title: 'Báo cáo tài chính Q2/2024',
    clubName: 'Câu lạc bộ IT',
    type: 'finance',
    status: 'pending',
    submittedAt: '2024-07-05',
    submittedBy: 'Trần Thị B',
    reviewedAt: null,
    reviewer: null,
  },
  {
    id: 3,
    title: 'Báo cáo hoạt động tháng 7/2024',
    clubName: 'Câu lạc bộ Sinh viên',
    type: 'activity',
    status: 'draft',
    submittedAt: null,
    submittedBy: null,
    reviewedAt: null,
    reviewer: null,
  },
  {
    id: 4,
    title: 'Báo cáo tài chính tháng 6/2024',
    clubName: 'Câu lạc bộ Sinh viên',
    type: 'finance',
    status: 'rejected',
    submittedAt: '2024-07-03',
    submittedBy: 'Lê Văn C',
    reviewedAt: '2024-07-04',
    reviewer: 'Trần Admin',
    feedback: 'Cần bổ sung chứng từ chi tiêu',
  },
  {
    id: 5,
    title: 'Báo cáo hoạt động tháng 5/2024',
    clubName: 'Câu lạc bộ Văn nghệ',
    type: 'activity',
    status: 'approved',
    submittedAt: '2024-06-01',
    submittedBy: 'Phạm Thị D',
    reviewedAt: '2024-06-02',
    reviewer: 'Nguyễn Admin',
  },
]

const statusOptions = [
  { value: '', label: 'Tất cả trạng thái' },
  { value: 'draft', label: 'Nháp' },
  { value: 'pending', label: 'Chờ duyệt' },
  { value: 'approved', label: 'Đã duyệt' },
  { value: 'rejected', label: 'Từ chối' },
]

const typeOptions = [
  { value: '', label: 'Tất cả loại' },
  { value: 'activity', label: 'Báo cáo hoạt động' },
  { value: 'finance', label: 'Báo cáo tài chính' },
]

function Reports() {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedReport, setSelectedReport] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 10

  const filteredReports = mockReports.filter((report) => {
    const matchesSearch = report.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.clubName.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = !statusFilter || report.status === statusFilter
    const matchesType = !typeFilter || report.type === typeFilter
    return matchesSearch && matchesStatus && matchesType
  })

  const paginatedReports = filteredReports.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  )

  const columns = [
    {
      key: 'title',
      header: 'Tiêu đề',
      sortable: true,
      render: (value, row) => (
        <Link to={`/reports/${row.id}`} className="font-medium text-dark-800 hover:text-primary-600">
          {value}
        </Link>
      ),
    },
    {
      key: 'clubName',
      header: 'Câu lạc bộ',
      sortable: true,
    },
    {
      key: 'type',
      header: 'Loại',
      render: (value) => (
        <Badge variant={value === 'activity' ? 'primary' : 'info'}>
          {value === 'activity' ? 'Hoạt động' : 'Tài chính'}
        </Badge>
      ),
    },
    {
      key: 'status',
      header: 'Trạng thái',
      sortable: true,
      render: (value) => {
        const config = {
          draft: { variant: 'default', icon: FileText, label: 'Nháp' },
          pending: { variant: 'warning', icon: Clock, label: 'Chờ duyệt' },
          approved: { variant: 'success', icon: CheckCircle, label: 'Đã duyệt' },
          rejected: { variant: 'danger', icon: XCircle, label: 'Từ chối' },
        }
        const { variant, icon: Icon, label } = config[value] || config.draft
        return (
          <Badge variant={variant} className="gap-1">
            <Icon className="w-3 h-3" />
            {label}
          </Badge>
        )
      },
    },
    {
      key: 'submittedAt',
      header: 'Ngày nộp',
      sortable: true,
      render: (value) => value ? formatDate(value) : '-',
    },
    {
      key: 'submittedBy',
      header: 'Người nộp',
      render: (value) => value || '-',
    },
    {
      key: 'actions',
      header: 'Thao tác',
      render: (_, row) => (
        <div className="flex items-center gap-1">
          <button
            onClick={() => {
              setSelectedReport(row)
              setShowDetailModal(true)
            }}
            className="p-1.5 text-dark-400 hover:text-primary-600 hover:bg-primary-50 rounded-md transition-colors"
          >
            <Eye className="w-4 h-4" />
          </button>
          {row.status === 'draft' && (
            <>
              <button className="p-1.5 text-dark-400 hover:text-primary-600 hover:bg-primary-50 rounded-md transition-colors">
                <Edit className="w-4 h-4" />
              </button>
              <button className="p-1.5 text-dark-400 hover:text-success-600 hover:bg-success-50 rounded-md transition-colors">
                <Send className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-dark-900">Quản lý Báo cáo</h1>
          <p className="text-dark-500 mt-1">Theo dõi và quản lý các báo cáo từ các câu lạc bộ</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="secondary" leftIcon={<Download className="w-4 h-4" />}>
            Xuất Excel
          </Button>
          <Button leftIcon={<Plus className="w-4 h-4" />} onClick={() => setShowCreateModal(true)}>
            Tạo báo cáo
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Tổng số', value: mockReports.length, color: 'bg-primary-50 text-primary-700' },
          { label: 'Chờ duyệt', value: mockReports.filter(r => r.status === 'pending').length, color: 'bg-warning-50 text-warning-700' },
          { label: 'Đã duyệt', value: mockReports.filter(r => r.status === 'approved').length, color: 'bg-success-50 text-success-700' },
          { label: 'Từ chối', value: mockReports.filter(r => r.status === 'rejected').length, color: 'bg-danger-50 text-danger-700' },
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
              placeholder="Tìm kiếm báo cáo..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftIcon={<Search className="w-5 h-5" />}
            />
          </div>
          <div className="flex gap-3">
            <Select
              value={statusFilter}
              onChange={setStatusFilter}
              options={statusOptions}
              className="w-40"
            />
            <Select
              value={typeFilter}
              onChange={setTypeFilter}
              options={typeOptions}
              className="w-48"
            />
          </div>
        </div>
      </Card>

      {/* Table */}
      <Table
        columns={columns}
        data={paginatedReports}
        pagination={true}
        pageSize={pageSize}
      />

      {/* Create Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Tạo báo cáo mới"
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowCreateModal(false)}>Hủy</Button>
            <Button>Lưu nháp</Button>
            <Button>Nộp báo cáo</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input label="Tiêu đề báo cáo" required />
          <Select
            label="Câu lạc bộ"
            options={[
              { value: '1', label: 'Câu lạc bộ IT' },
              { value: '2', label: 'Câu lạc bộ Sinh viên' },
              { value: '3', label: 'Câu lạc bộ Văn nghệ' },
            ]}
            required
          />
          <Select
            label="Loại báo cáo"
            options={typeOptions.filter(t => t.value)}
          />
          <div>
            <label className="block text-sm font-medium text-dark-700 mb-1.5">Nội dung báo cáo</label>
            <textarea
              rows={6}
              className="w-full px-4 py-2.5 border border-dark-200 rounded-md focus:outline-none focus:border-primary-500"
              placeholder="Nhập nội dung báo cáo..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-dark-700 mb-1.5">Đính kèm file</label>
            <div className="border-2 border-dashed border-dark-200 rounded-lg p-6 text-center hover:border-primary-300 transition-colors cursor-pointer">
              <p className="text-dark-500">Kéo thả file hoặc nhấn để tải lên</p>
              <p className="text-xs text-dark-400 mt-1">Hỗ trợ: PDF, DOCX, XLSX, JPG, PNG</p>
            </div>
          </div>
        </div>
      </Modal>

      {/* Detail Modal */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => {
          setShowDetailModal(false)
          setSelectedReport(null)
        }}
        title="Chi tiết báo cáo"
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowDetailModal(false)}>Đóng</Button>
            {selectedReport?.status === 'pending' && (
              <>
                <Button variant="danger">Từ chối</Button>
                <Button>Phê duyệt</Button>
              </>
            )}
          </>
        }
      >
        {selectedReport && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-dark-500">Tiêu đề</label>
                <p className="text-dark-800 font-medium">{selectedReport.title}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-dark-500">Câu lạc bộ</label>
                <p className="text-dark-800">{selectedReport.clubName}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-dark-500">Trạng thái</label>
                <Badge variant={
                  selectedReport.status === 'approved' ? 'success' :
                  selectedReport.status === 'pending' ? 'warning' :
                  selectedReport.status === 'rejected' ? 'danger' : 'default'
                }>
                  {selectedReport.status === 'approved' ? 'Đã duyệt' :
                   selectedReport.status === 'pending' ? 'Chờ duyệt' :
                   selectedReport.status === 'rejected' ? 'Từ chối' : 'Nháp'}
                </Badge>
              </div>
              <div>
                <label className="text-sm font-medium text-dark-500">Ngày nộp</label>
                <p className="text-dark-800">{selectedReport.submittedAt ? formatDate(selectedReport.submittedAt) : '-'}</p>
              </div>
            </div>
            {selectedReport.feedback && (
              <div className="p-4 bg-danger-50 border border-danger-200 rounded-lg">
                <label className="text-sm font-medium text-danger-700">Phản hồi từ người duyệt</label>
                <p className="text-danger-600 mt-1">{selectedReport.feedback}</p>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false)
          setSelectedReport(null)
        }}
        onConfirm={() => {
          setShowDeleteModal(false)
          setSelectedReport(null)
        }}
        title="Xóa báo cáo"
        message={`Bạn có chắc chắn muốn xóa báo cáo "${selectedReport?.title}"?`}
        confirmText="Xóa"
        variant="danger"
      />
    </div>
  )
}

export default Reports
