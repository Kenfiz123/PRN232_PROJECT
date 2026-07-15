import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Plus,
  Search,
  Filter,
  Grid,
  List,
  MoreVertical,
  Users,
  FileText,
  Calendar,
  Edit,
  Trash2,
  Eye,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Select from '../components/ui/Select'
import Badge from '../components/ui/Badge'
import Modal, { ConfirmModal } from '../components/ui/Modal'
import { formatDate } from '../utils/helpers'

// Mock data
const mockClubs = [
  {
    id: 1,
    name: 'Câu lạc bộ IT',
    shortName: 'IT Club',
    description: 'Câu lạc bộ dành cho sinh viên yêu thích công nghệ thông tin',
    leader: 'Nguyễn Văn A',
    memberCount: 45,
    reportCount: 12,
    activityCount: 8,
    status: 'active',
    createdAt: '2023-09-01',
    avatar: null,
  },
  {
    id: 2,
    name: 'Câu lạc bộ Sinh viên',
    shortName: 'SV Club',
    description: 'Tổ chức các hoạt động và sự kiện cho sinh viên',
    leader: 'Trần Thị B',
    memberCount: 120,
    reportCount: 24,
    activityCount: 15,
    status: 'active',
    createdAt: '2023-08-15',
    avatar: null,
  },
  {
    id: 3,
    name: 'Câu lạc bộ Văn nghệ',
    shortName: 'VN Club',
    description: 'Phát triển tài năng văn nghệ và nghệ thuật',
    leader: 'Lê Văn C',
    memberCount: 35,
    reportCount: 6,
    activityCount: 4,
    status: 'inactive',
    createdAt: '2023-10-01',
    avatar: null,
  },
  {
    id: 4,
    name: 'Câu lạc bộ Thể thao',
    shortName: 'TT Club',
    description: 'Tổ chức các hoạt động thể thao và chăm sóc sức khỏe',
    leader: 'Phạm Thị D',
    memberCount: 80,
    reportCount: 18,
    activityCount: 10,
    status: 'active',
    createdAt: '2023-07-20',
    avatar: null,
  },
]

const statusOptions = [
  { value: '', label: 'Tất cả trạng thái' },
  { value: 'active', label: 'Hoạt động' },
  { value: 'inactive', label: 'Không hoạt động' },
  { value: 'suspended', label: 'Tạm ngưng' },
]

function Clubs() {
  const [viewMode, setViewMode] = useState('grid')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedClub, setSelectedClub] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 8

  const filteredClubs = mockClubs.filter((club) => {
    const matchesSearch = club.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      club.shortName.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = !statusFilter || club.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const paginatedClubs = filteredClubs.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  )

  const totalPages = Math.ceil(filteredClubs.length / pageSize)

  const handleDeleteClub = () => {
    // Handle delete logic
    setShowDeleteModal(false)
    setSelectedClub(null)
  }

  const getStatusBadge = (status) => {
    const variants = {
      active: { variant: 'success', label: 'Hoạt động' },
      inactive: { variant: 'default', label: 'Không hoạt động' },
      suspended: { variant: 'danger', label: 'Tạm ngưng' },
    }
    const config = variants[status] || variants.inactive
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-dark-900">Quản lý Câu lạc bộ</h1>
          <p className="text-dark-500 mt-1">Danh sách và quản lý các câu lạc bộ trong hệ thống</p>
        </div>
        <Button leftIcon={<Plus className="w-4 h-4" />} onClick={() => setShowCreateModal(true)}>
          Tạo CLB mới
        </Button>
      </div>

      {/* Filters and Search */}
      <Card padding="sm">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <Input
              type="search"
              placeholder="Tìm kiếm câu lạc bộ..."
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
              placeholder="Trạng thái"
              className="w-48"
            />
            <div className="flex border border-dark-200 rounded-md">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2.5 ${viewMode === 'grid' ? 'bg-primary-50 text-primary-600' : 'text-dark-400 hover:text-dark-600'}`}
              >
                <Grid className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2.5 ${viewMode === 'list' ? 'bg-primary-50 text-primary-600' : 'text-dark-400 hover:text-dark-600'}`}
              >
                <List className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </Card>

      {/* Results count */}
      <p className="text-sm text-dark-500">
        Hiển thị {paginatedClubs.length} trong {filteredClubs.length} câu lạc bộ
      </p>

      {/* Clubs Grid/List */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {paginatedClubs.map((club) => (
            <Card key={club.id} hover className="group">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center">
                  <span className="text-primary-700 font-bold text-lg">
                    {club.shortName.charAt(0)}
                  </span>
                </div>
                {getStatusBadge(club.status)}
              </div>
              
              <Link to={`/clubs/${club.id}`} className="block">
                <h3 className="text-lg font-semibold text-dark-800 group-hover:text-primary-600 transition-colors">
                  {club.name}
                </h3>
                <p className="text-sm text-dark-500 mt-1 line-clamp-2">{club.description}</p>
              </Link>

              <div className="mt-4 space-y-2">
                <div className="flex items-center gap-2 text-sm text-dark-600">
                  <Users className="w-4 h-4 text-dark-400" />
                  <span>Trưởng CLB: <span className="font-medium">{club.leader}</span></span>
                </div>
                <div className="flex items-center gap-4 text-sm text-dark-500">
                  <span className="flex items-center gap-1">
                    <Users className="w-4 h-4" /> {club.memberCount} thành viên
                  </span>
                  <span className="flex items-center gap-1">
                    <FileText className="w-4 h-4" /> {club.reportCount} báo cáo
                  </span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-dark-100 flex items-center justify-between">
                <span className="text-xs text-dark-400">
                  Ngày tạo: {formatDate(club.createdAt)}
                </span>
                <div className="flex items-center gap-1">
                  <Link
                    to={`/clubs/${club.id}`}
                    className="p-1.5 text-dark-400 hover:text-primary-600 hover:bg-primary-50 rounded-md transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                  </Link>
                  <button
                    onClick={() => {
                      setSelectedClub(club)
                      setShowCreateModal(true)
                    }}
                    className="p-1.5 text-dark-400 hover:text-primary-600 hover:bg-primary-50 rounded-md transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      setSelectedClub(club)
                      setShowDeleteModal(true)
                    }}
                    className="p-1.5 text-dark-400 hover:text-danger-600 hover:bg-danger-50 rounded-md transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card padding="none">
          <table className="w-full">
            <thead className="bg-dark-50 border-b border-dark-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-dark-600 uppercase tracking-wider">
                  Câu lạc bộ
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-dark-600 uppercase tracking-wider">
                  Trưởng CLB
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-dark-600 uppercase tracking-wider">
                  Thành viên
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-dark-600 uppercase tracking-wider">
                  Báo cáo
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-dark-600 uppercase tracking-wider">
                  Trạng thái
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-dark-600 uppercase tracking-wider">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-100">
              {paginatedClubs.map((club) => (
                <tr key={club.id} className="hover:bg-primary-50/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center">
                        <span className="text-primary-700 font-bold">
                          {club.shortName.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <Link to={`/clubs/${club.id}`} className="font-medium text-dark-800 hover:text-primary-600">
                          {club.name}
                        </Link>
                        <p className="text-xs text-dark-500">{club.shortName}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-dark-600">{club.leader}</td>
                  <td className="px-4 py-3 text-sm text-dark-600">{club.memberCount}</td>
                  <td className="px-4 py-3 text-sm text-dark-600">{club.reportCount}</td>
                  <td className="px-4 py-3">{getStatusBadge(club.status)}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Link
                        to={`/clubs/${club.id}`}
                        className="p-1.5 text-dark-400 hover:text-primary-600 hover:bg-primary-50 rounded-md transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => {
                          setSelectedClub(club)
                          setShowCreateModal(true)
                        }}
                        className="p-1.5 text-dark-400 hover:text-primary-600 hover:bg-primary-50 rounded-md transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedClub(club)
                          setShowDeleteModal(true)
                        }}
                        className="p-1.5 text-dark-400 hover:text-danger-600 hover:bg-danger-50 rounded-md transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-dark-500">
            Trang {currentPage} trong {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(p => p - 1)}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            {[...Array(totalPages)].map((_, i) => (
              <Button
                key={i}
                variant={currentPage === i + 1 ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => setCurrentPage(i + 1)}
              >
                {i + 1}
              </Button>
            ))}
            <Button
              variant="secondary"
              size="sm"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(p => p + 1)}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false)
          setSelectedClub(null)
        }}
        title={selectedClub ? 'Chỉnh sửa Câu lạc bộ' : 'Tạo Câu lạc bộ mới'}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => {
              setShowCreateModal(false)
              setSelectedClub(null)
            }}>
              Hủy
            </Button>
            <Button>
              {selectedClub ? 'Lưu thay đổi' : 'Tạo mới'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Tên câu lạc bộ" defaultValue={selectedClub?.name} required />
            <Input label="Tên viết tắt" defaultValue={selectedClub?.shortName} required />
          </div>
          <Input label="Trưởng CLB" defaultValue={selectedClub?.leader} required />
          <div>
            <label className="block text-sm font-medium text-dark-700 mb-1.5">Mô tả</label>
            <textarea
              rows={3}
              className="w-full px-4 py-2.5 border border-dark-200 rounded-md focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
              defaultValue={selectedClub?.description}
            />
          </div>
          <Select
            label="Trạng thái"
            options={statusOptions.filter(s => s.value)}
            defaultValue={selectedClub?.status || 'active'}
          />
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false)
          setSelectedClub(null)
        }}
        onConfirm={handleDeleteClub}
        title="Xóa Câu lạc bộ"
        message={`Bạn có chắc chắn muốn xóa câu lạc bộ "${selectedClub?.name}"? Hành động này không thể hoàn tác.`}
        confirmText="Xóa"
        variant="danger"
      />
    </div>
  )
}

export default Clubs
