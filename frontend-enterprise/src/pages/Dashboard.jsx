import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Users,
  UserCheck,
  FileText,
  Wallet,
  TrendingUp,
  TrendingDown,
  Calendar,
  Clock,
  ArrowRight,
  Plus,
  Eye,
} from 'lucide-react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import Card, { CardHeader, CardTitle, CardContent } from '../components/ui/Card'
import StatCard from '../components/ui/StatCard'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import Avatar from '../components/ui/Avatar'
import { formatDate, formatDateTime, formatCurrency } from '../utils/helpers'

// Mock data for dashboard
const weeklyReportsData = [
  { name: 'T2', reports: 12 },
  { name: 'T3', reports: 19 },
  { name: 'T4', reports: 15 },
  { name: 'T5', reports: 25 },
  { name: 'T6', reports: 22 },
  { name: 'T7', reports: 18 },
  { name: 'CN', reports: 8 },
]

const budgetDistribution = [
  { name: 'Văn phòng', value: 35, color: '#1e40af' },
  { name: 'Sự kiện', value: 40, color: '#3b82f6' },
  { name: 'Thiết bị', value: 15, color: '#0ea5e9' },
  { name: 'Khác', value: 10, color: '#94a3b8' },
]

const recentActivities = [
  {
    id: 1,
    user: 'Nguyen Van A',
    action: 'đã nộp báo cáo tháng 6',
    club: 'Câu lạc bộ IT',
    time: '10 phút trước',
  },
  {
    id: 2,
    user: 'Tran Thi B',
    action: 'được phê duyệt làm thành viên',
    club: 'Câu lạc bộ Sinh viên',
    time: '25 phút trước',
  },
  {
    id: 3,
    user: 'Le Van C',
    action: 'tạo hoạt động mới',
    club: 'Câu lạc bộ Văn nghệ',
    time: '1 giờ trước',
  },
  {
    id: 4,
    user: 'Pham Thi D',
    action: 'đã duyệt báo cáo',
    club: 'Câu lạc bộ Thể thao',
    time: '2 giờ trước',
  },
]

const upcomingDeadlines = [
  {
    id: 1,
    title: 'Báo cáo hoạt động tháng 7',
    club: 'Câu lạc bộ IT',
    deadline: '2024-07-20',
    status: 'pending',
  },
  {
    id: 2,
    title: 'Báo cáo tài chính Q2',
    club: 'Câu lạc bộ Sinh viên',
    deadline: '2024-07-25',
    status: 'pending',
  },
  {
    id: 3,
    title: 'Kế hoạch hoạt động tháng 8',
    club: 'Câu lạc bộ Văn nghệ',
    deadline: '2024-07-28',
    status: 'draft',
  },
]

function Dashboard() {
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1000)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Tổng quan về hệ thống ClubReportHub</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="secondary" leftIcon={<Eye className="w-4 h-4" />}>
            Xem chi tiết
          </Button>
          <Button leftIcon={<Plus className="w-4 h-4" />}>
            Tạo mới
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Tổng số CLB"
          value="24"
          icon={Users}
          trend="up"
          trendValue="+2"
          description="so với tháng trước"
          loading={isLoading}
        />
        <StatCard
          title="Thành viên hoạt động"
          value="1,847"
          icon={UserCheck}
          trend="up"
          trendValue="+12%"
          description="so với tháng trước"
          loading={isLoading}
        />
        <StatCard
          title="Báo cáo đã nộp"
          value="186"
          icon={FileText}
          trend="down"
          trendValue="-5%"
          description="so với tháng trước"
          loading={isLoading}
        />
        <StatCard
          title="Ngân sách tháng"
          value="125.5M"
          icon={Wallet}
          trend="up"
          trendValue="+8%"
          description="so với tháng trước"
          loading={isLoading}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly Reports Chart */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle>Báo cáo theo tuần</CardTitle>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Số lượng báo cáo được nộp trong tuần</p>
            </div>
            <select className="px-3 py-1.5 text-sm border border-gray-200 dark:border-dark-600 rounded-md bg-white dark:bg-dark-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:border-primary-500">
              <option>Tuần này</option>
              <option>Tuần trước</option>
              <option>Tháng này</option>
            </select>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={weeklyReportsData}>
                  <defs>
                    <linearGradient id="colorReports" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1e40af" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#1e40af" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
                  <YAxis stroke="#64748b" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--card-bg)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="reports"
                    stroke="#1e40af"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorReports)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Budget Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Phân bổ ngân sách</CardTitle>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Tỷ lệ ngân sách theo danh mục</p>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={budgetDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {budgetDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 space-y-2">
              {budgetDistribution.map((item) => (
                <div key={item.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-gray-600 dark:text-gray-400">{item.name}</span>
                  </div>
                  <span className="font-medium text-gray-800 dark:text-gray-200">{item.value}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activities */}
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Hoạt động gần đây</CardTitle>
            <Link
              to="/activities"
              className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300 flex items-center gap-1 font-medium"
            >
              Xem tất cả <ArrowRight className="w-4 h-4" />
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors">
                  <Avatar name={activity.user} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-800 dark:text-gray-200">
                      <span className="font-medium">{activity.user}</span>
                      {' '}{activity.action}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{activity.club}</p>
                  </div>
                  <span className="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap">{activity.time}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Deadlines */}
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Deadline sắp tới</CardTitle>
            <Link
              to="/reports"
              className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300 flex items-center gap-1 font-medium"
            >
              Xem tất cả <ArrowRight className="w-4 h-4" />
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {upcomingDeadlines.map((deadline) => (
                <div
                  key={deadline.id}
                  className="flex items-center gap-4 p-3 rounded-lg border border-gray-100 dark:border-dark-700 hover:border-primary-200 dark:hover:border-primary-700 hover:bg-primary-50/30 dark:hover:bg-primary-900/10 transition-colors cursor-pointer"
                >
                  <div className="w-12 h-12 rounded-lg bg-warning-100 dark:bg-warning-900/30 flex flex-col items-center justify-center">
                    <span className="text-xs font-medium text-warning-800 dark:text-warning-400">
                      {new Date(deadline.deadline).getDate()}
                    </span>
                    <span className="text-[10px] text-warning-600 dark:text-warning-500">
                      {new Date(deadline.deadline).toLocaleDateString('vi', { month: 'short' })}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{deadline.title}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{deadline.club}</p>
                  </div>
                  <Badge variant={deadline.status === 'pending' ? 'warning' : 'default'}>
                    {deadline.status === 'pending' ? 'Chờ nộp' : 'Nháp'}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Thao tác nhanh</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {[
              { icon: Users, label: 'Tạo CLB mới', color: 'bg-primary-100 dark:bg-primary-900/40 text-primary-600 dark:text-primary-400' },
              { icon: FileText, label: 'Tạo báo cáo', color: 'bg-success-100 dark:bg-success-900/40 text-success-600 dark:text-success-400' },
              { icon: Calendar, label: 'Tạo hoạt động', color: 'bg-warning-100 dark:bg-warning-900/40 text-warning-600 dark:text-warning-400' },
              { icon: Wallet, label: 'Duyệt ngân sách', color: 'bg-accent-100 dark:bg-accent-900/40 text-accent-600 dark:text-accent-400' },
              { icon: UserCheck, label: 'Thêm thành viên', color: 'bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400' },
              { icon: Clock, label: 'Xem lịch sử', color: 'bg-gray-100 dark:bg-dark-600 text-gray-600 dark:text-gray-400' },
            ].map((action, index) => (
              <button
                key={index}
                className="flex flex-col items-center gap-2 p-4 rounded-lg border border-gray-100 dark:border-dark-700 hover:border-primary-200 dark:hover:border-primary-700 hover:bg-primary-50/30 dark:hover:bg-primary-900/10 transition-all group"
              >
                <div className={`w-10 h-10 rounded-lg ${action.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                  <action.icon className="w-5 h-5" />
                </div>
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400 text-center">{action.label}</span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default Dashboard
