import { useState } from 'react'
import {
  Settings,
  Bell,
  Shield,
  Palette,
  Globe,
  Database,
  Key,
  Moon,
  Sun,
  Monitor,
  Save,
  Check,
} from 'lucide-react'
import Card, { CardHeader, CardTitle, CardContent } from '../components/ui/Card'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Select from '../components/ui/Select'
import Toggle from '../components/ui/Toggle'
import { useUIStore } from '../stores/uiStore'

function SettingsPage() {
  const { theme, setTheme } = useUIStore()

  const [settings, setSettings] = useState({
    language: 'vi',
    timezone: 'Asia/Ho_Chi_Minh',
    emailNotifications: true,
    pushNotifications: true,
    weeklyDigest: true,
    marketingEmails: false,
    twoFactorAuth: false,
    sessionTimeout: '30',
    dataRetention: '90',
  })

  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    console.log('Settings saved:', settings, 'Theme:', theme)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleThemeChange = (newTheme) => {
    setTheme(newTheme)
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Cài đặt</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Quản lý cài đặt hệ thống và ứng dụng</p>
        </div>
        <Button
          leftIcon={saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          onClick={handleSave}
          variant={saved ? 'success' : 'primary'}
        >
          {saved ? 'Đã lưu!' : 'Lưu thay đổi'}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Settings Navigation */}
        <Card className="lg:col-span-1 h-fit">
          <CardContent className="p-2">
            <nav className="space-y-1">
              {[
                { icon: Palette, label: 'Giao diện', active: true },
                { icon: Bell, label: 'Thông báo', active: false },
                { icon: Shield, label: 'Bảo mật', active: false },
                { icon: Database, label: 'Dữ liệu', active: false },
              ].map((item, idx) => (
                <button
                  key={idx}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                    item.active
                      ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 border-l-4 border-primary-500'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-700'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </button>
              ))}
            </nav>
          </CardContent>
        </Card>

        {/* Settings Content */}
        <div className="lg:col-span-3 space-y-6">
          {/* Appearance */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Palette className="w-5 h-5 text-primary-600" />
                <CardTitle>Giao diện</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Chế độ giao diện
                </label>
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { value: 'light', icon: Sun, label: 'Sáng', desc: 'Chế độ sáng mặc định' },
                    { value: 'dark', icon: Moon, label: 'Tối', desc: 'Giảm mỏi mắt khi dùng đêm' },
                    { value: 'system', icon: Monitor, label: 'Hệ thống', desc: 'Theo cài đặt thiết bị' },
                  ].map((themeOption) => (
                    <button
                      key={themeOption.value}
                      onClick={() => handleThemeChange(themeOption.value)}
                      className={`relative p-4 rounded-xl border-2 transition-all duration-200 ${
                        theme === themeOption.value
                          ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30'
                          : 'border-gray-200 dark:border-dark-600 hover:border-gray-300 dark:hover:border-dark-500'
                      }`}
                    >
                      <themeOption.icon className={`w-8 h-8 mx-auto mb-2 ${
                        theme === themeOption.value ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400 dark:text-gray-500'
                      }`} />
                      <p className={`text-sm font-semibold ${
                        theme === themeOption.value ? 'text-primary-700 dark:text-primary-400' : 'text-gray-700 dark:text-gray-300'
                      }`}>
                        {themeOption.label}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {themeOption.desc}
                      </p>
                      {theme === themeOption.value && (
                        <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-primary-500 flex items-center justify-center">
                          <Check className="w-4 h-4 text-white" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Language & Region */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Globe className="w-5 h-5 text-primary-600" />
                <CardTitle>Ngôn ngữ & Vùng</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Select
                  label="Ngôn ngữ"
                  value={settings.language}
                  onChange={(val) => setSettings({ ...settings, language: val })}
                  options={[
                    { value: 'vi', label: 'Tiếng Việt' },
                    { value: 'en', label: 'English' },
                  ]}
                />
                <Select
                  label="Múi giờ"
                  value={settings.timezone}
                  onChange={(val) => setSettings({ ...settings, timezone: val })}
                  options={[
                    { value: 'Asia/Ho_Chi_Minh', label: 'Asia/Ho_Chi_Minh (GMT+7)' },
                    { value: 'Asia/Tokyo', label: 'Asia/Tokyo (GMT+9)' },
                    { value: 'UTC', label: 'UTC (GMT+0)' },
                  ]}
                />
              </div>
            </CardContent>
          </Card>

          {/* Notifications */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Bell className="w-5 h-5 text-primary-600" />
                <CardTitle>Thông báo</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-dark-700">
                  <div>
                    <p className="font-medium text-gray-800 dark:text-gray-200">Thông báo Email</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Nhận thông báo qua email</p>
                  </div>
                  <Toggle
                    checked={settings.emailNotifications}
                    onChange={(val) => setSettings({ ...settings, emailNotifications: val })}
                  />
                </div>
                <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-dark-700">
                  <div>
                    <p className="font-medium text-gray-800 dark:text-gray-200">Thông báo đẩy</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Nhận thông báo trên trình duyệt</p>
                  </div>
                  <Toggle
                    checked={settings.pushNotifications}
                    onChange={(val) => setSettings({ ...settings, pushNotifications: val })}
                  />
                </div>
                <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-dark-700">
                  <div>
                    <p className="font-medium text-gray-800 dark:text-gray-200">Tóm tắt hàng tuần</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Nhận email tóm tắt hoạt động hàng tuần</p>
                  </div>
                  <Toggle
                    checked={settings.weeklyDigest}
                    onChange={(val) => setSettings({ ...settings, weeklyDigest: val })}
                  />
                </div>
                <div className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-medium text-gray-800 dark:text-gray-200">Email marketing</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Nhận thông tin về sản phẩm và tính năng mới</p>
                  </div>
                  <Toggle
                    checked={settings.marketingEmails}
                    onChange={(val) => setSettings({ ...settings, marketingEmails: val })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Security */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-primary-600" />
                <CardTitle>Bảo mật</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-800 dark:text-gray-200">Xác thực hai yếu tố (2FA)</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Tăng cường bảo mật tài khoản của bạn</p>
                </div>
                <Toggle
                  checked={settings.twoFactorAuth}
                  onChange={(val) => setSettings({ ...settings, twoFactorAuth: val })}
                />
              </div>
              <div className="pt-4 border-t border-gray-100 dark:border-dark-700">
                <Input
                  label="Đổi mật khẩu"
                  type="password"
                  placeholder="Mật khẩu hiện tại"
                />
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <Input
                    type="password"
                    placeholder="Mật khẩu mới"
                  />
                  <Input
                    type="password"
                    placeholder="Xác nhận mật khẩu mới"
                  />
                </div>
                <Button className="mt-4" variant="secondary" leftIcon={<Key className="w-4 h-4" />}>
                  Cập nhật mật khẩu
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Data & Privacy */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Database className="w-5 h-5 text-primary-600" />
                <CardTitle>Dữ liệu & Quyền riêng tư</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Select
                  label="Thời gian chờ phiên"
                  value={settings.sessionTimeout}
                  onChange={(val) => setSettings({ ...settings, sessionTimeout: val })}
                  options={[
                    { value: '15', label: '15 phút' },
                    { value: '30', label: '30 phút' },
                    { value: '60', label: '1 giờ' },
                    { value: '120', label: '2 giờ' },
                  ]}
                />
                <Select
                  label="Lưu trữ dữ liệu"
                  value={settings.dataRetention}
                  onChange={(val) => setSettings({ ...settings, dataRetention: val })}
                  options={[
                    { value: '30', label: '30 ngày' },
                    { value: '90', label: '90 ngày' },
                    { value: '180', label: '180 ngày' },
                    { value: '365', label: '1 năm' },
                  ]}
                />
              </div>
              <div className="mt-6 p-4 bg-gray-50 dark:bg-dark-700 rounded-lg">
                <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-2">Xuất dữ liệu</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">Tải xuống bản sao dữ liệu của bạn</p>
                <Button variant="secondary" size="sm">
                  Yêu cầu xuất dữ liệu
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default SettingsPage
