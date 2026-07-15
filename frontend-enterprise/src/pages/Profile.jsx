import { useState } from 'react'
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Shield,
  Camera,
  Save,
  Key,
  Bell,
  Activity,
} from 'lucide-react'
import Card, { CardHeader, CardTitle, CardContent } from '../components/ui/Card'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Select from '../components/ui/Select'
import Avatar from '../components/ui/Avatar'
import Badge from '../components/ui/Badge'
import Toggle from '../components/ui/Toggle'

function Profile() {
  const [profile, setProfile] = useState({
    fullName: 'Nguyễn Văn A',
    email: 'nguyenvana@example.com',
    phone: '0912345678',
    gender: 'male',
    birthDate: '2002-05-15',
    address: '123 Đường ABC, Quận 1, TP.HCM',
    department: 'Công nghệ thông tin',
    studentId: 'SE123456',
    role: 'Trưởng CLB IT',
  })

  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    reports: true,
    activities: false,
  })

  const [isEditing, setIsEditing] = useState(false)

  const activityLog = [
    { id: 1, action: 'Đăng nhập hệ thống', time: '2024-07-14 08:30:00', ip: '192.168.1.1' },
    { id: 2, action: 'Cập nhật thông tin cá nhân', time: '2024-07-13 15:20:00', ip: '192.168.1.1' },
    { id: 3, action: 'Nộp báo cáo tháng 6', time: '2024-07-01 10:30:00', ip: '192.168.1.1' },
    { id: 4, action: 'Tạo hoạt động mới', time: '2024-06-28 14:00:00', ip: '192.168.1.1' },
  ]

  const handleSave = () => {
    setIsEditing(false)
    // Save logic here
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-dark-900">Hồ sơ cá nhân</h1>
        <p className="text-dark-500 mt-1">Quản lý thông tin và cài đặt tài khoản</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="space-y-6">
          <Card>
            <CardContent className="flex flex-col items-center py-8">
              <div className="relative">
                <Avatar name={profile.fullName} size="2xl" />
                <button className="absolute bottom-0 right-0 p-2 bg-primary-600 text-white rounded-full hover:bg-primary-700 transition-colors">
                  <Camera className="w-4 h-4" />
                </button>
              </div>
              <h2 className="text-xl font-bold text-dark-900 mt-4">{profile.fullName}</h2>
              <p className="text-dark-500">{profile.role}</p>
              <Badge variant="primary" className="mt-2">{profile.department}</Badge>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quyền hạn</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-dark-600">Vai trò</span>
                  <Badge variant="primary">Trưởng CLB</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-dark-600">CLB quản lý</span>
                  <span className="font-medium text-dark-800">Câu lạc bộ IT</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-dark-600">Trạng thái</span>
                  <Badge variant="success">Hoạt động</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Profile Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Personal Info */}
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle>Thông tin cá nhân</CardTitle>
              <Button
                variant={isEditing ? 'primary' : 'secondary'}
                size="sm"
                leftIcon={<User className="w-4 h-4" />}
                onClick={() => isEditing ? handleSave() : setIsEditing(true)}
              >
                {isEditing ? 'Lưu thay đổi' : 'Chỉnh sửa'}
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="Họ và tên"
                  value={profile.fullName}
                  onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
                  disabled={!isEditing}
                  leftIcon={<User className="w-5 h-5" />}
                />
                <Input
                  label="Email"
                  type="email"
                  value={profile.email}
                  onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                  disabled={!isEditing}
                  leftIcon={<Mail className="w-5 h-5" />}
                />
                <Input
                  label="Số điện thoại"
                  type="tel"
                  value={profile.phone}
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  disabled={!isEditing}
                  leftIcon={<Phone className="w-5 h-5" />}
                />
                <Input
                  label="Mã sinh viên"
                  value={profile.studentId}
                  disabled
                />
                <Input
                  label="Ngày sinh"
                  type="date"
                  value={profile.birthDate}
                  onChange={(e) => setProfile({ ...profile, birthDate: e.target.value })}
                  disabled={!isEditing}
                  leftIcon={<Calendar className="w-5 h-5" />}
                />
                <Select
                  label="Giới tính"
                  value={profile.gender}
                  onChange={(val) => setProfile({ ...profile, gender: val })}
                  options={[
                    { value: 'male', label: 'Nam' },
                    { value: 'female', label: 'Nữ' },
                    { value: 'other', label: 'Khác' },
                  ]}
                  disabled={!isEditing}
                />
                <div className="md:col-span-2">
                  <Input
                    label="Địa chỉ"
                    value={profile.address}
                    onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                    disabled={!isEditing}
                    leftIcon={<MapPin className="w-5 h-5" />}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notification Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Cài đặt thông báo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b border-dark-100">
                  <div>
                    <p className="font-medium text-dark-800">Thông báo qua Email</p>
                    <p className="text-sm text-dark-500">Nhận thông báo qua địa chỉ email của bạn</p>
                  </div>
                  <Toggle
                    checked={notifications.email}
                    onChange={(val) => setNotifications({ ...notifications, email: val })}
                  />
                </div>
                <div className="flex items-center justify-between py-3 border-b border-dark-100">
                  <div>
                    <p className="font-medium text-dark-800">Thông báo đẩy</p>
                    <p className="text-sm text-dark-500">Nhận thông báo trên trình duyệt</p>
                  </div>
                  <Toggle
                    checked={notifications.push}
                    onChange={(val) => setNotifications({ ...notifications, push: val })}
                  />
                </div>
                <div className="flex items-center justify-between py-3 border-b border-dark-100">
                  <div>
                    <p className="font-medium text-dark-800">Báo cáo mới</p>
                    <p className="text-sm text-dark-500">Thông báo khi có báo cáo mới cần duyệt</p>
                  </div>
                  <Toggle
                    checked={notifications.reports}
                    onChange={(val) => setNotifications({ ...notifications, reports: val })}
                  />
                </div>
                <div className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-medium text-dark-800">Hoạt động mới</p>
                    <p className="text-sm text-dark-500">Thông báo khi có hoạt động mới</p>
                  </div>
                  <Toggle
                    checked={notifications.activities}
                    onChange={(val) => setNotifications({ ...notifications, activities: val })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Activity Log */}
          <Card>
            <CardHeader>
              <CardTitle>Nhật ký hoạt động</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activityLog.map((log) => (
                  <div key={log.id} className="flex items-start gap-4 pb-4 border-b border-dark-100 last:border-0 last:pb-0">
                    <div className="w-8 h-8 rounded-full bg-dark-100 flex items-center justify-center flex-shrink-0">
                      <Activity className="w-4 h-4 text-dark-500" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-dark-800">{log.action}</p>
                      <div className="flex items-center gap-4 mt-1 text-sm text-dark-500">
                        <span>{log.time}</span>
                        <span>IP: {log.ip}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default Profile
