import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  ArrowLeft,
  Download,
  Send,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  MessageSquare,
  Paperclip,
  User,
  Calendar,
} from 'lucide-react'
import Card, { CardHeader, CardTitle, CardContent } from '../components/ui/Card'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import Avatar from '../components/ui/Avatar'
import Tabs from '../components/ui/Tabs'
import Textarea from '../components/ui/Textarea'
import { formatDate, formatDateTime } from '../utils/helpers'

const mockReport = {
  id: 1,
  title: 'Báo cáo hoạt động tháng 6/2024',
  clubName: 'Câu lạc bộ IT',
  type: 'activity',
  status: 'approved',
  content: `## Tổng quan hoạt động

Trong tháng 6/2024, Câu lạc bộ IT đã tổ chức thành công các hoạt động sau:

### 1. Workshop ReactJS
- Thời gian: 15/06/2024
- Số lượng tham gia: 25 sinh viên
- Địa điểm: Phòng A301
- Nội dung: Giới thiệu về ReactJS cho người mới bắt đầu

### 2. Tech Talk: AI in 2024
- Thời gian: 20/06/2024
- Số lượng tham gia: 40 sinh viên
- Địa điểm: Hội trường lớn
- Diễn giả: Anh Nguyễn Văn A - Senior Developer

### 3. Code Challenge
- Thời gian: 25/06/2024
- Số lượng tham gia: 30 sinh viên
- Địa điểm: Phòng Lab IT
- Kết quả: 10 sinh viên đạt giải

## Kết luận
Tháng 6 đã hoàn thành tốt các hoạt động đề ra, thu hút sự tham gia của đông đảo sinh viên.`,
  attachments: [
    { id: 1, name: 'Hinh_anh_Workshop.pdf', size: '2.5 MB', type: 'pdf' },
    { id: 2, name: 'Bao_cao_TechTalk.docx', size: '1.2 MB', type: 'docx' },
  ],
  submittedAt: '2024-07-01T10:30:00',
  submittedBy: {
    id: 1,
    name: 'Nguyễn Văn A',
    avatar: null,
  },
  reviewedAt: '2024-07-02T14:00:00',
  reviewer: {
    id: 2,
    name: 'Trần Admin',
    avatar: null,
  },
  comments: [
    {
      id: 1,
      user: 'Trần Admin',
      content: 'Báo cáo chi tiết và rõ ràng. Đã kiểm tra các file đính kèm.',
      createdAt: '2024-07-02T14:00:00',
    },
    {
      id: 2,
      user: 'Nguyễn Văn A',
      content: 'Cảm ơn admin đã duyệt báo cáo.',
      createdAt: '2024-07-02T14:15:00',
    },
  ],
}

function ReportDetail() {
  const { id } = useParams()
  const [newComment, setNewComment] = useState('')
  const [activeTab, setActiveTab] = useState('content')

  const tabs = [
    { value: 'content', label: 'Nội dung' },
    { value: 'attachments', label: 'File đính kèm', count: mockReport.attachments.length },
    { value: 'comments', label: 'Phản hồi', count: mockReport.comments.length },
  ]

  const handleSubmitComment = () => {
    if (newComment.trim()) {
      console.log('Submit comment:', newComment)
      setNewComment('')
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        <Link to="/reports" className="flex items-center gap-1 text-dark-400 hover:text-primary-600 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          <span>Danh sách báo cáo</span>
        </Link>
        <span className="text-dark-300">/</span>
        <span className="text-dark-600 font-medium">{mockReport.title}</span>
      </div>

      {/* Header */}
      <Card>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-dark-900">{mockReport.title}</h1>
              <Badge variant={mockReport.status === 'approved' ? 'success' : mockReport.status === 'pending' ? 'warning' : mockReport.status === 'rejected' ? 'danger' : 'default'}>
                {mockReport.status === 'approved' ? 'Đã duyệt' :
                 mockReport.status === 'pending' ? 'Chờ duyệt' :
                 mockReport.status === 'rejected' ? 'Từ chối' : 'Nháp'}
              </Badge>
            </div>
            <p className="text-dark-500">{mockReport.clubName}</p>
          </div>
          <div className="flex items-center gap-2">
            {mockReport.status === 'draft' && (
              <>
                <Button variant="secondary" leftIcon={<Edit className="w-4 h-4" />}>Chỉnh sửa</Button>
                <Button leftIcon={<Send className="w-4 h-4" />}>Nộp báo cáo</Button>
              </>
            )}
            {mockReport.status === 'pending' && (
              <>
                <Button variant="danger" leftIcon={<XCircle className="w-4 h-4" />}>Từ chối</Button>
                <Button variant="success" leftIcon={<CheckCircle className="w-4 h-4" />}>Phê duyệt</Button>
              </>
            )}
            <Button variant="secondary" leftIcon={<Download className="w-4 h-4" />}>Xuất PDF</Button>
          </div>
        </div>

        {/* Meta info */}
        <div className="flex items-center gap-6 mt-4 pt-4 border-t border-dark-100 text-sm text-dark-600">
          <span className="flex items-center gap-2">
            <User className="w-4 h-4 text-dark-400" />
            Người nộp: <span className="font-medium">{mockReport.submittedBy.name}</span>
          </span>
          <span className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-dark-400" />
            Ngày nộp: <span className="font-medium">{formatDateTime(mockReport.submittedAt)}</span>
          </span>
          {mockReport.reviewer && (
            <span className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-success-500" />
              Người duyệt: <span className="font-medium">{mockReport.reviewer.name}</span>
            </span>
          )}
        </div>
      </Card>

      {/* Tabs */}
      <Tabs tabs={tabs} defaultTab="content" onChange={setActiveTab} />

      {/* Tab Content */}
      {activeTab === 'content' && (
        <Card>
          <CardContent>
            <div className="prose prose-dark max-w-none">
              <pre className="whitespace-pre-wrap font-sans text-dark-700 bg-transparent p-0 m-0 border-0 shadow-none">
                {mockReport.content}
              </pre>
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'attachments' && (
        <Card>
          <CardContent>
            <div className="space-y-3">
              {mockReport.attachments.map((file) => (
                <div key={file.id} className="flex items-center justify-between p-4 bg-dark-50 rounded-lg hover:bg-dark-100 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                      <FileText className="w-5 h-5 text-primary-600" />
                    </div>
                    <div>
                      <p className="font-medium text-dark-800">{file.name}</p>
                      <p className="text-sm text-dark-500">{file.size}</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" leftIcon={<Download className="w-4 h-4" />}>
                    Tải xuống
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'comments' && (
        <Card>
          <CardContent>
            {/* Comment Form */}
            <div className="mb-6">
              <Textarea
                rows={3}
                placeholder="Nhập phản hồi của bạn..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
              />
              <div className="flex justify-end mt-3">
                <Button onClick={handleSubmitComment} disabled={!newComment.trim()}>
                  Gửi phản hồi
                </Button>
              </div>
            </div>

            {/* Comments List */}
            <div className="space-y-4">
              {mockReport.comments.map((comment) => (
                <div key={comment.id} className="flex gap-3">
                  <Avatar name={comment.user} size="sm" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-dark-800">{comment.user}</span>
                      <span className="text-xs text-dark-400">{formatDateTime(comment.createdAt)}</span>
                    </div>
                    <div className="p-3 bg-dark-50 rounded-lg">
                      <p className="text-dark-700">{comment.content}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default ReportDetail
