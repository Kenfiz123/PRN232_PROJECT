import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  Users,
  FileText,
  Calendar,
  Edit,
  Plus,
  Mail,
  Phone,
  MapPin,
  ArrowLeft,
  MoreVertical,
  Settings,
  UserPlus,
  Trash2,
} from 'lucide-react'
import Card, { CardHeader, CardTitle, CardContent } from '../components/ui/Card'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import Avatar from '../components/ui/Avatar'
import Tabs from '../components/ui/Tabs'
import Table from '../components/ui/Table'
import Modal from '../components/ui/Modal'
import Input from '../components/ui/Input'
import { formatDate } from '../utils/helpers'

// Mock data
const mockClub = {
  id: 1,
  name: 'Câu lạc bộ IT',
  shortName: 'IT Club',
  description: 'Câu lạc bộ dành cho sinh viên yêu thích công nghệ thông tin, nơi học hỏi và phát triển kỹ năng lập trình.',
  leader: {
    id: 1,
    name: 'Nguyễn Văn A',
    email: 'nguyenvana@example.com',
    phone: '0912345678',
    avatar: null,
  },
  memberCount: 45,
  reportCount: 12,
  activityCount: 8,
  status: 'active',
  createdAt: '2023-09-01',
  location: 'Tòa nhà A, Phòng 301',
  foundedYear: 2023,
}

const mockMembers = [
  { id: 1, name: 'Trần Thị B', email: 'tranthib@example.com', role: 'Phó Trưởng CLB', joinDate: '2023-09-15', status: 'active' },
  { id: 2, name: 'Lê Văn C', email: 'levanc@example.com', role: 'Thư ký', joinDate: '2023-10-01', status: 'active' },
  { id: 3, name: 'Phạm Thị D', email: 'phamthid@example.com', role: 'Thành viên', joinDate: '2023-11-01', status: 'active' },
  { id: 4, name: 'Hoàng Văn E', email: 'hoangvane@example.com', role: 'Thành viên', joinDate: '2024-01-10', status: 'active' },
  { id: 5, name: 'Ngô Thị F', email: 'ngothif@example.com', role: 'Thành viên', joinDate: '2024-02-20', status: 'inactive' },
]

const mockReports = [
  { id: 1, title: 'Báo cáo hoạt động tháng 6/2024', status: 'approved', submittedAt: '2024-07-01', submittedBy: 'Nguyễn Văn A' },
  { id: 2, title: 'Báo cáo tài chính Q2/2024', status: 'approved', submittedAt: '2024-07-05', submittedBy: 'Trần Thị B' },
  { id: 3, title: 'Báo cáo hoạt động tháng 7/2024', status: 'pending', submittedAt: null, submittedBy: null },
]

const mockActivities = [
  { id: 1, title: 'Workshop ReactJS', date: '2024-07-15', participants: 25, status: 'upcoming' },
  { id: 2, title: 'Tech Talk: AI in 2024', date: '2024-07-20', participants: 40, status: 'upcoming' },
  { id: 3, title: 'Code Challenge', date: '2024-06-10', participants: 30, status: 'completed' },
]

function ClubDetail() {
  const { id } = useParams()
  const [showAddMemberModal, setShowAddMemberModal] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')

  const memberColumns = [
    {
      key: 'name',
      header: 'Thành viên',
      sortable: true,
      render: (value, row) => (
        <div className="flex items-center gap-3">
          <Avatar name={row.name} size="sm" />
          <div>
            <p className="font-medium text-dark-800">{row.name}</p>
            <p className="text-xs text-dark-500">{row.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Vai trò',
      sortable: true,
    },
    {
      key: 'joinDate',
      header: 'Ngày tham gia',
      sortable: true,
      render: (value) => formatDate(value),
    },
    {
      key: 'status',
      header: 'Trạng thái',
      render: (value) => (
        <Badge variant={value === 'active' ? 'success' : 'default'}>
          {value === 'active' ? 'Hoạt động' : 'Không hoạt động'}
        </Badge>
      ),
    },
  ]

  const reportColumns = [
    {
      key: 'title',
      header: 'Tiêu đề',
      sortable: true,
    },
    {
      key: 'status',
      header: 'Trạng thái',
      render: (value) => {
        const variants = {
          approved: 'success',
          pending: 'warning',
          rejected: 'danger',
          draft: 'default',
        }
        const labels = {
          approved: 'Đã duyệt',
          pending: 'Chờ duyệt',
          rejected: 'Từ chối',
          draft: 'Nháp',
        }
        return <Badge variant={variants[value]}>{labels[value]}</Badge>
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
  ]

  const activityColumns = [
    {
      key: 'title',
      header: 'Tên hoạt động',
      sortable: true,
    },
    {
      key: 'date',
      header: 'Ngày',
      sortable: true,
      render: (value) => formatDate(value),
    },
    {
      key: 'participants',
      header: 'Số người tham gia',
      sortable: true,
    },
    {
      key: 'status',
      header: 'Trạng thái',
      render: (value) => (
        <Badge variant={value === 'upcoming' ? 'primary' : 'success'}>
          {value === 'upcoming' ? 'Sắp diễn ra' : 'Đã hoàn thành'}
        </Badge>
      ),
    },
  ]

  const tabs = [
    { value: 'overview', label: 'Tổng quan' },
    { value: 'members', label: 'Thành viên', count: mockMembers.length },
    { value: 'reports', label: 'Báo cáo', count: mockReports.length },
    { value: 'activities', label: 'Hoạt động', count: mockActivities.length },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        <Link to="/clubs" className="flex items-center gap-1 text-dark-400 hover:text-primary-600 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          <span>Danh sách CLB</span>
        </Link>
        <span className="text-dark-300">/</span>
        <span className="text-dark-600 font-medium">{mockClub.name}</span>
      </div>

      {/* Header */}
      <Card>
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-xl bg-primary-100 flex items-center justify-center">
              <span className="text-primary-700 font-bold text-2xl">
                {mockClub.shortName.charAt(0)}
              </span>
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-dark-900">{mockClub.name}</h1>
                <Badge variant="success">Hoạt động</Badge>
              </div>
              <p className="text-dark-500 mt-1 max-w-2xl">{mockClub.description}</p>
              <div className="flex items-center gap-6 mt-3 text-sm text-dark-600">
                <span className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  {mockClub.memberCount} thành viên
                </span>
                <span className="flex items-center gap-1">
                  <FileText className="w-4 h-4" />
                  {mockClub.reportCount} báo cáo
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {mockClub.activityCount} hoạt động
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {mockClub.location}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" leftIcon={<Settings className="w-4 h-4" />}>
              Cài đặt
            </Button>
            <Button variant="secondary" leftIcon={<Edit className="w-4 h-4" />}>
              Chỉnh sửa
            </Button>
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <Tabs
        tabs={tabs}
        defaultTab="overview"
        onChange={setActiveTab}
      />

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Club Info */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Thông tin câu lạc bộ</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-medium text-dark-500 mb-2">Trưởng CLB</h4>
                  <div className="flex items-center gap-3">
                    <Avatar name={mockClub.leader.name} size="md" />
                    <div>
                      <p className="font-medium text-dark-800">{mockClub.leader.name}</p>
                      <p className="text-sm text-dark-500">{mockClub.leader.email}</p>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-dark-500 mb-2">Liên hệ</h4>
                  <div className="space-y-2">
                    <p className="flex items-center gap-2 text-sm text-dark-700">
                      <Mail className="w-4 h-4 text-dark-400" />
                      {mockClub.leader.email}
                    </p>
                    <p className="flex items-center gap-2 text-sm text-dark-700">
                      <Phone className="w-4 h-4 text-dark-400" />
                      {mockClub.leader.phone}
                    </p>
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-dark-500 mb-2">Ngày thành lập</h4>
                  <p className="text-dark-800">{formatDate(mockClub.createdAt)}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-dark-500 mb-2">Địa điểm</h4>
                  <p className="flex items-center gap-2 text-dark-800">
                    <MapPin className="w-4 h-4 text-dark-400" />
                    {mockClub.location}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Thống kê nhanh</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-primary-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Users className="w-5 h-5 text-primary-600" />
                    <span className="text-dark-700">Thành viên</span>
                  </div>
                  <span className="text-xl font-bold text-primary-700">{mockClub.memberCount}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-success-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-success-600" />
                    <span className="text-dark-700">Báo cáo</span>
                  </div>
                  <span className="text-xl font-bold text-success-700">{mockClub.reportCount}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-warning-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-warning-600" />
                    <span className="text-dark-700">Hoạt động</span>
                  </div>
                  <span className="text-xl font-bold text-warning-700">{mockClub.activityCount}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Thành viên gần đây</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {mockMembers.slice(0, 3).map((member) => (
                    <div key={member.id} className="flex items-center gap-3">
                      <Avatar name={member.name} size="sm" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-dark-800 truncate">{member.name}</p>
                        <p className="text-xs text-dark-500">{member.role}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {activeTab === 'members' && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-dark-800">Danh sách thành viên</h2>
            <Button size="sm" leftIcon={<UserPlus className="w-4 h-4" />} onClick={() => setShowAddMemberModal(true)}>
              Thêm thành viên
            </Button>
          </div>
          <Table columns={memberColumns} data={mockMembers} />
        </Card>
      )}

      {activeTab === 'reports' && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-dark-800">Danh sách báo cáo</h2>
            <Button size="sm" leftIcon={<Plus className="w-4 h-4" />}>
              Tạo báo cáo
            </Button>
          </div>
          <Table columns={reportColumns} data={mockReports} />
        </Card>
      )}

      {activeTab === 'activities' && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-dark-800">Danh sách hoạt động</h2>
            <Button size="sm" leftIcon={<Plus className="w-4 h-4" />}>
              Tạo hoạt động
            </Button>
          </div>
          <Table columns={activityColumns} data={mockActivities} />
        </Card>
      )}

      {/* Add Member Modal */}
      <Modal
        isOpen={showAddMemberModal}
        onClose={() => setShowAddMemberModal(false)}
        title="Thêm thành viên mới"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowAddMemberModal(false)}>
              Hủy
            </Button>
            <Button onClick={() => setShowAddMemberModal(false)}>
              Thêm thành viên
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input label="Họ và tên" required />
          <Input label="Email" type="email" required />
          <Input label="Số điện thoại" type="tel" />
          <div>
            <label className="block text-sm font-medium text-dark-700 mb-1.5">Vai trò</label>
            <select className="w-full px-4 py-2.5 border border-dark-200 rounded-md focus:outline-none focus:border-primary-500">
              <option>Thành viên</option>
              <option>Thư ký</option>
              <option>Phó Trưởng CLB</option>
            </select>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default ClubDetail
