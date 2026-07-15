import { useState } from 'react'
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Download,
  Plus,
  Search,
  Filter,
  Eye,
  CheckCircle,
  Clock,
  AlertCircle,
  DollarSign,
  Receipt,
  FileText,
} from 'lucide-react'
import {
  BarChart,
  Bar,
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
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Select from '../components/ui/Select'
import Badge from '../components/ui/Badge'
import Modal from '../components/ui/Modal'
import Table from '../components/ui/Table'
import StatCard from '../components/ui/StatCard'
import { formatCurrency, formatDate } from '../utils/helpers'

const budgetData = [
  { name: 'Tháng 1', approved: 50000000, spent: 45000000 },
  { name: 'Tháng 2', approved: 60000000, spent: 52000000 },
  { name: 'Tháng 3', approved: 55000000, spent: 48000000 },
  { name: 'Tháng 4', approved: 70000000, spent: 65000000 },
  { name: 'Tháng 5', approved: 65000000, spent: 60000000 },
  { name: 'Tháng 6', approved: 80000000, spent: 72000000 },
]

const categoryData = [
  { name: 'Văn phòng phẩm', value: 15, color: '#1e40af' },
  { name: 'Thiết bị', value: 25, color: '#3b82f6' },
  { name: 'Sự kiện', value: 35, color: '#0ea5e9' },
  { name: 'Khác', value: 25, color: '#94a3b8' },
]

const mockTransactions = [
  { id: 1, description: 'Mua văn phòng phẩm', amount: 2500000, category: 'office', clubName: 'CLB IT', date: '2024-07-10', status: 'approved', type: 'expense' },
  { id: 2, description: 'Thu ngân sách tháng', amount: 10000000, category: 'income', clubName: 'CLB IT', date: '2024-07-08', status: 'approved', type: 'income' },
  { id: 3, description: 'Thuê thiết bị sự kiện', amount: 5000000, category: 'event', clubName: 'CLB Sinh viên', date: '2024-07-12', status: 'pending', type: 'expense' },
  { id: 4, description: 'Mua phần thưởng cuộc thi', amount: 3500000, category: 'prize', clubName: 'CLB IT', date: '2024-07-05', status: 'approved', type: 'expense' },
  { id: 5, description: 'Hỗ trợ từ nhà trường', amount: 20000000, category: 'income', clubName: 'CLB Văn nghệ', date: '2024-07-01', status: 'approved', type: 'income' },
]

function Finance() {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [showBudgetModal, setShowBudgetModal] = useState(false)
  const [showTransactionModal, setShowTransactionModal] = useState(false)

  const statusOptions = [
    { value: '', label: 'Tất cả trạng thái' },
    { value: 'approved', label: 'Đã duyệt' },
    { value: 'pending', label: 'Chờ duyệt' },
    { value: 'rejected', label: 'Từ chối' },
  ]

  const transactionColumns = [
    {
      key: 'description',
      header: 'Mô tả',
      sortable: true,
    },
    {
      key: 'clubName',
      header: 'Câu lạc bộ',
      sortable: true,
    },
    {
      key: 'category',
      header: 'Danh mục',
      render: (value) => (
        <Badge variant="primary">
          {value === 'office' ? 'Văn phòng' : value === 'event' ? 'Sự kiện' : value === 'income' ? 'Thu nhập' : value === 'prize' ? 'Giải thưởng' : 'Khác'}
        </Badge>
      ),
    },
    {
      key: 'type',
      header: 'Loại',
      render: (value) => (
        <span className={`flex items-center gap-1 ${value === 'income' ? 'text-success-600' : 'text-danger-600'}`}>
          {value === 'income' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
          {value === 'income' ? 'Thu' : 'Chi'}
        </span>
      ),
    },
    {
      key: 'amount',
      header: 'Số tiền',
      sortable: true,
      render: (value, row) => (
        <span className={row.type === 'income' ? 'text-success-600 font-medium' : 'text-danger-600 font-medium'}>
          {row.type === 'income' ? '+' : '-'}{formatCurrency(value)}
        </span>
      ),
    },
    {
      key: 'date',
      header: 'Ngày',
      sortable: true,
      render: (value) => formatDate(value),
    },
    {
      key: 'status',
      header: 'Trạng thái',
      render: (value) => {
        const config = {
          approved: { variant: 'success', icon: CheckCircle, label: 'Đã duyệt' },
          pending: { variant: 'warning', icon: Clock, label: 'Chờ duyệt' },
          rejected: { variant: 'danger', icon: AlertCircle, label: 'Từ chối' },
        }
        const { variant, icon: Icon, label } = config[value] || config.pending
        return <Badge variant={variant}><Icon className="w-3 h-3 mr-1" />{label}</Badge>
      },
    },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-dark-900">Quản lý Tài chính</h1>
          <p className="text-dark-500 mt-1">Theo dõi và quản lý ngân sách các câu lạc bộ</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="secondary" leftIcon={<Download className="w-4 h-4" />}>Xuất Excel</Button>
          <Button variant="secondary" leftIcon={<Receipt className="w-4 h-4" />} onClick={() => setShowTransactionModal(true)}>Ghi nhận</Button>
          <Button leftIcon={<Plus className="w-4 h-4" />} onClick={() => setShowBudgetModal(true)}>Duyệt ngân sách</Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Tổng ngân sách" value="125.5M" icon={Wallet} trend="up" trendValue="+8%" />
        <StatCard title="Đã chi tiêu" value="89.2M" icon={TrendingDown} trend="down" trendValue="-3%" />
        <StatCard title="Còn lại" value="36.3M" icon={DollarSign} trend="up" trendValue="+12%" />
        <StatCard title="Chờ duyệt" value="8" icon={Clock} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Ngân sách theo tháng</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={budgetData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
                  <YAxis stroke="#64748b" fontSize={12} tickFormatter={(v) => `${v/1000000}M`} />
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Bar dataKey="approved" fill="#3b82f6" name="Đã duyệt" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="spent" fill="#1e40af" name="Đã chi" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Chi tiêu theo danh mục</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={categoryData} cx="50%" cy="50%" innerRadius={40} outerRadius={60} paddingAngle={5} dataKey="value">
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 space-y-2">
              {categoryData.map((item) => (
                <div key={item.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-dark-600">{item.name}</span>
                  </div>
                  <span className="font-medium text-dark-800">{item.value}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transactions Table */}
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>Danh sách giao dịch</CardTitle>
          <div className="flex items-center gap-3">
            <Input
              type="search"
              placeholder="Tìm kiếm..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftIcon={<Search className="w-4 h-4" />}
              containerClassName="w-64"
            />
            <Select
              value={statusFilter}
              onChange={setStatusFilter}
              options={statusOptions}
              className="w-40"
            />
          </div>
        </CardHeader>
        <Table columns={transactionColumns} data={mockTransactions} />
      </Card>

      {/* Budget Modal */}
      <Modal
        isOpen={showBudgetModal}
        onClose={() => setShowBudgetModal(false)}
        title="Duyệt ngân sách mới"
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowBudgetModal(false)}>Hủy</Button>
            <Button>Tạo đề xuất</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Select
            label="Câu lạc bộ"
            options={[
              { value: '1', label: 'Câu lạc bộ IT' },
              { value: '2', label: 'Câu lạc bộ Sinh viên' },
              { value: '3', label: 'Câu lạc bộ Văn nghệ' },
            ]}
            required
          />
          <Input label="Số tiền đề xuất" type="number" required placeholder="VD: 50000000" />
          <Input label="Mục đích sử dụng" required />
          <div>
            <label className="block text-sm font-medium text-dark-700 mb-1.5">Mô tả chi tiết</label>
            <textarea rows={3} className="w-full px-4 py-2.5 border border-dark-200 rounded-md focus:outline-none focus:border-primary-500" />
          </div>
        </div>
      </Modal>

      {/* Transaction Modal */}
      <Modal
        isOpen={showTransactionModal}
        onClose={() => setShowTransactionModal(false)}
        title="Ghi nhận giao dịch"
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowTransactionModal(false)}>Hủy</Button>
            <Button>Lưu giao dịch</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Select
            label="Loại giao dịch"
            options={[
              { value: 'income', label: 'Thu' },
              { value: 'expense', label: 'Chi' },
            ]}
            required
          />
          <Select
            label="Câu lạc bộ"
            options={[
              { value: '1', label: 'Câu lạc bộ IT' },
              { value: '2', label: 'Câu lạc bộ Sinh viên' },
            ]}
            required
          />
          <Input label="Số tiền" type="number" required />
          <Input label="Mô tả" required />
          <Select
            label="Danh mục"
            options={[
              { value: 'office', label: 'Văn phòng phẩm' },
              { value: 'event', label: 'Sự kiện' },
              { value: 'equipment', label: 'Thiết bị' },
              { value: 'prize', label: 'Giải thưởng' },
              { value: 'other', label: 'Khác' },
            ]}
          />
          <Input label="Ngày giao dịch" type="date" required />
        </div>
      </Modal>
    </div>
  )
}

export default Finance
