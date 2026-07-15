import { useState } from 'react'
import {
  Plus,
  Search,
  Calendar,
  List,
  Grid3X3,
  MapPin,
  Users,
  Clock,
  ChevronLeft,
  ChevronRight,
  Edit,
  Trash2,
  UserPlus,
} from 'lucide-react'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Select from '../components/ui/Select'
import Badge from '../components/ui/Badge'
import Modal from '../components/ui/Modal'
import { formatDate } from '../utils/helpers'

const mockActivities = [
  {
    id: 1,
    title: 'Workshop ReactJS',
    description: 'Workshop giới thiệu ReactJS cho người mới bắt đầu',
    clubName: 'Câu lạc bộ IT',
    date: '2024-07-15',
    time: '14:00',
    location: 'Phòng A301',
    participants: 25,
    maxParticipants: 30,
    status: 'upcoming',
    type: 'workshop',
  },
  {
    id: 2,
    title: 'Tech Talk: AI in 2024',
    description: 'Talk show về AI và ứng dụng trong năm 2024',
    clubName: 'Câu lạc bộ IT',
    date: '2024-07-20',
    time: '09:00',
    location: 'Hội trường lớn',
    participants: 40,
    maxParticipants: 100,
    status: 'upcoming',
    type: 'talk',
  },
  {
    id: 3,
    title: 'Code Challenge',
    description: 'Cuộc thi lập trình giữa các CLB',
    clubName: 'Câu lạc bộ IT',
    date: '2024-06-25',
    time: '08:00',
    location: 'Phòng Lab IT',
    participants: 30,
    maxParticipants: 30,
    status: 'completed',
    type: 'competition',
  },
  {
    id: 4,
    title: 'Giao lưu văn nghệ',
    description: 'Chương trình giao lưu văn nghệ giữa các CLB',
    clubName: 'Câu lạc bộ Văn nghệ',
    date: '2024-07-28',
    time: '19:00',
    location: 'Sân vận động',
    participants: 15,
    maxParticipants: 50,
    status: 'upcoming',
    type: 'event',
  },
]

const statusOptions = [
  { value: '', label: 'Tất cả trạng thái' },
  { value: 'upcoming', label: 'Sắp diễn ra' },
  { value: 'ongoing', label: 'Đang diễn ra' },
  { value: 'completed', label: 'Đã hoàn thành' },
]

const typeOptions = [
  { value: '', label: 'Tất cả loại' },
  { value: 'workshop', label: 'Workshop' },
  { value: 'talk', label: 'Talk show' },
  { value: 'competition', label: 'Cuộc thi' },
  { value: 'event', label: 'Sự kiện' },
]

function Activities() {
  const [viewMode, setViewMode] = useState('grid')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedActivity, setSelectedActivity] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 8

  const filteredActivities = mockActivities.filter((activity) => {
    const matchesSearch = activity.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      activity.clubName.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = !statusFilter || activity.status === statusFilter
    const matchesType = !typeFilter || activity.type === typeFilter
    return matchesSearch && matchesStatus && matchesType
  })

  const paginatedActivities = filteredActivities.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  )

  const totalPages = Math.ceil(filteredActivities.length / pageSize)

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-dark-900">Quản lý Hoạt động</h1>
          <p className="text-dark-500 mt-1">Quản lý và theo dõi các hoạt động của câu lạc bộ</p>
        </div>
        <Button leftIcon={<Plus className="w-4 h-4" />} onClick={() => setShowCreateModal(true)}>
          Tạo hoạt động
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Tổng số', value: mockActivities.length, color: 'bg-primary-50 text-primary-700' },
          { label: 'Sắp diễn ra', value: mockActivities.filter(a => a.status === 'upcoming').length, color: 'bg-warning-50 text-warning-700' },
          { label: 'Đang diễn ra', value: mockActivities.filter(a => a.status === 'ongoing').length, color: 'bg-success-50 text-success-700' },
          { label: 'Đã hoàn thành', value: mockActivities.filter(a => a.status === 'completed').length, color: 'bg-dark-50 text-dark-700' },
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
              placeholder="Tìm kiếm hoạt động..."
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
              className="w-40"
            />
            <div className="flex border border-dark-200 rounded-md">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2.5 ${viewMode === 'grid' ? 'bg-primary-50 text-primary-600' : 'text-dark-400 hover:text-dark-600'}`}
              >
                <Grid3X3 className="w-5 h-5" />
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

      {/* Activities Grid */}
      <div className={viewMode === 'grid' 
        ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
        : 'space-y-4'
      }>
        {paginatedActivities.map((activity) => (
          <Card key={activity.id} hover className={viewMode === 'list' ? 'flex items-center gap-4' : ''}>
            {viewMode === 'grid' ? (
              <>
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-primary-600" />
                  </div>
                  <Badge variant={activity.status === 'upcoming' ? 'warning' : activity.status === 'ongoing' ? 'success' : 'default'}>
                    {activity.status === 'upcoming' ? 'Sắp diễn ra' : activity.status === 'ongoing' ? 'Đang diễn ra' : 'Đã hoàn thành'}
                  </Badge>
                </div>
                <h3 className="text-lg font-semibold text-dark-800 mb-2">{activity.title}</h3>
                <p className="text-sm text-dark-500 mb-4 line-clamp-2">{activity.description}</p>
                <div className="space-y-2 text-sm text-dark-600">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-dark-400" />
                    <span>{formatDate(activity.date)} lúc {activity.time}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-dark-400" />
                    <span>{activity.location}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-dark-400" />
                    <span>{activity.participants}/{activity.maxParticipants} người</span>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="w-16 h-16 rounded-xl bg-primary-100 flex items-center justify-center">
                  <Calendar className="w-8 h-8 text-primary-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-dark-800">{activity.title}</h3>
                  <p className="text-sm text-dark-500">{activity.clubName}</p>
                </div>
                <div className="text-sm text-dark-600">
                  <p>{formatDate(activity.date)}</p>
                  <p>{activity.location}</p>
                </div>
                <Badge variant={activity.status === 'upcoming' ? 'warning' : activity.status === 'ongoing' ? 'success' : 'default'}>
                  {activity.status === 'upcoming' ? 'Sắp diễn ra' : activity.status === 'ongoing' ? 'Đang diễn ra' : 'Đã hoàn thành'}
                </Badge>
              </>
            )}
          </Card>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="secondary" size="sm" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm text-dark-600 px-4">
            Trang {currentPage} / {totalPages}
          </span>
          <Button variant="secondary" size="sm" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Create Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Tạo hoạt động mới"
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowCreateModal(false)}>Hủy</Button>
            <Button>Tạo hoạt động</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input label="Tên hoạt động" required />
          <Select
            label="Câu lạc bộ"
            options={[
              { value: '1', label: 'Câu lạc bộ IT' },
              { value: '2', label: 'Câu lạc bộ Sinh viên' },
            ]}
            required
          />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Ngày" type="date" required />
            <Input label="Giờ" type="time" required />
          </div>
          <Input label="Địa điểm" required />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Số người tham gia tối đa" type="number" />
            <Select
              label="Loại hoạt động"
              options={typeOptions.filter(t => t.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-dark-700 mb-1.5">Mô tả</label>
            <textarea rows={3} className="w-full px-4 py-2.5 border border-dark-200 rounded-md focus:outline-none focus:border-primary-500" />
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default Activities
