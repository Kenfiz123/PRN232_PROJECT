import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Modal from '../components/Modal'
import { useToast } from '../context/ToastContext'

const reportsData = [
  { id: 1, title: 'Q4 Event Summary Report', club: 'Robotics Club', author: 'Alex Chen', date: '2024-12-10', status: 'approved', type: 'quarterly', priority: 'high' },
  { id: 2, title: 'Budget Allocation Proposal', club: 'Photography Club', author: 'Sarah Miller', date: '2024-12-09', status: 'pending', type: 'financial', priority: 'high' },
  { id: 3, title: 'Winter Concert Planning', club: 'Music Ensemble', author: 'Emily Chen', date: '2024-12-08', status: 'review', type: 'event', priority: 'medium' },
  { id: 4, title: 'Equipment Purchase Request', club: 'Coding Club', author: 'Lisa Park', date: '2024-12-07', status: 'approved', type: 'procurement', priority: 'low' },
  { id: 5, title: 'Annual Club Performance', club: 'Debate Society', author: 'James Wilson', date: '2024-12-06', status: 'pending', type: 'annual', priority: 'high' },
  { id: 6, title: 'New Member Registration', club: 'Drama Club', author: 'Michael Brown', date: '2024-12-05', status: 'approved', type: 'membership', priority: 'low' },
  { id: 7, title: 'Community Outreach Summary', club: 'Environmental Club', author: 'Emma Johnson', date: '2024-12-04', status: 'review', type: 'social', priority: 'medium' },
  { id: 8, title: 'Tech Symposium Budget', club: 'Coding Club', author: 'Lisa Park', date: '2024-12-03', status: 'pending', type: 'financial', priority: 'high' },
  { id: 9, title: 'Sports Day Report', club: 'Sports Club', author: 'Lucas Garcia', date: '2024-12-02', status: 'approved', type: 'event', priority: 'medium' },
  { id: 10, title: 'Equipment Maintenance Log', club: 'Robotics Club', author: 'Alex Chen', date: '2024-12-01', status: 'approved', type: 'maintenance', priority: 'low' }
]

const statusConfig = {
  approved: { bg: 'bg-green-500/20', text: 'text-green-400', border: 'border-green-500/50', label: 'Approved' },
  pending: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', border: 'border-yellow-500/50', label: 'Pending' },
  review: { bg: 'bg-purple-500/20', text: 'text-purple-400', border: 'border-purple-500/50', label: 'In Review' },
  rejected: { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/50', label: 'Rejected' }
}

const priorityConfig = {
  high: { color: 'text-red-400', bg: 'bg-red-500/20' },
  medium: { color: 'text-yellow-400', bg: 'bg-yellow-500/20' },
  low: { color: 'text-green-400', bg: 'bg-green-500/20' }
}

export default function ReportsPage() {
  const { success, error } = useToast()
  const [reports, setReports] = useState(reportsData)
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [viewingReport, setViewingReport] = useState(null)
  const [selectedReports, setSelectedReports] = useState([])

  const filteredReports = reports
    .filter(report => selectedStatus === 'all' || report.status === selectedStatus)
    .filter(report => report.title.toLowerCase().includes(searchQuery.toLowerCase()) || report.club.toLowerCase().includes(searchQuery.toLowerCase()))

  const handleApprove = (reportId) => {
    setReports(prev => prev.map(r => r.id === reportId ? { ...r, status: 'approved' } : r))
    success('Report approved successfully')
  }

  const handleReject = (reportId) => {
    setReports(prev => prev.map(r => r.id === reportId ? { ...r, status: 'rejected' } : r))
    error('Report rejected')
  }

  const handleBulkAction = (action) => {
    if (selectedReports.length === 0) return
    setReports(prev => prev.map(r =>
      selectedReports.includes(r.id) ? { ...r, status: action === 'approve' ? 'approved' : 'rejected' } : r
    ))
    success(`${selectedReports.length} reports ${action}d successfully`)
    setSelectedReports([])
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4"
      >
        <div>
          <h2 className="font-orbitron text-2xl font-bold text-white">Reports Management</h2>
          <p className="text-gray-400 text-sm mt-1">Review and manage club reports</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="cyber-btn cyber-btn-primary flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Create Report
        </button>
      </motion.div>

      {/* Filters & Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between"
      >
        {/* Search & Filters */}
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
          <div className="relative flex-1 max-w-md">
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search reports..."
              className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/50 transition-all"
            />
          </div>

          <div className="flex gap-2">
            {['all', 'pending', 'review', 'approved', 'rejected'].map((status) => (
              <button
                key={status}
                onClick={() => setSelectedStatus(status)}
                className={`px-4 py-2 rounded-xl text-sm font-medium capitalize transition-all ${
                  selectedStatus === status
                    ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50'
                    : 'bg-white/5 text-gray-400 border border-white/10 hover:border-white/20'
                }`}
              >
                {status === 'all' ? 'All' : status === 'review' ? 'In Review' : status}
              </button>
            ))}
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedReports.length > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-3"
          >
            <span className="text-sm text-gray-400">{selectedReports.length} selected</span>
            <button
              onClick={() => handleBulkAction('approve')}
              className="px-4 py-2 rounded-lg bg-green-500/20 text-green-400 border border-green-500/50 hover:bg-green-500/30 transition-all text-sm font-medium"
            >
              Approve All
            </button>
            <button
              onClick={() => handleBulkAction('reject')}
              className="px-4 py-2 rounded-lg bg-red-500/20 text-red-400 border border-red-500/50 hover:bg-red-500/30 transition-all text-sm font-medium"
            >
              Reject All
            </button>
          </motion.div>
        )}
      </motion.div>

      {/* Reports Table */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="cyber-card overflow-hidden p-0"
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="px-6 py-4 text-left">
                  <input
                    type="checkbox"
                    checked={selectedReports.length === filteredReports.length && filteredReports.length > 0}
                    onChange={(e) => setSelectedReports(e.target.checked ? filteredReports.map(r => r.id) : [])}
                    className="w-4 h-4 rounded border-white/20 bg-white/5 text-cyan-500 focus:ring-cyan-500/50"
                  />
                </th>
                <th className="px-6 py-4 text-left text-xs font-orbitron font-semibold text-gray-400 uppercase tracking-wider">Report</th>
                <th className="px-6 py-4 text-left text-xs font-orbitron font-semibold text-gray-400 uppercase tracking-wider">Club</th>
                <th className="px-6 py-4 text-left text-xs font-orbitron font-semibold text-gray-400 uppercase tracking-wider">Author</th>
                <th className="px-6 py-4 text-left text-xs font-orbitron font-semibold text-gray-400 uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 text-left text-xs font-orbitron font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-left text-xs font-orbitron font-semibold text-gray-400 uppercase tracking-wider">Priority</th>
                <th className="px-6 py-4 text-left text-xs font-orbitron font-semibold text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence mode="popLayout">
                {filteredReports.map((report, index) => (
                  <motion.tr
                    key={report.id}
                    layout
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: index * 0.03 }}
                    className="border-b border-white/5 hover:bg-white/5 transition-colors group"
                  >
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedReports.includes(report.id)}
                        onChange={(e) => setSelectedReports(prev =>
                          e.target.checked ? [...prev, report.id] : prev.filter(id => id !== report.id)
                        )}
                        className="w-4 h-4 rounded border-white/20 bg-white/5 text-cyan-500 focus:ring-cyan-500/50"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-white group-hover:text-cyan-400 transition-colors cursor-pointer">{report.title}</p>
                        <p className="text-xs text-gray-500 capitalize mt-1">{report.type.replace('-', ' ')}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-300">{report.club}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500/30 to-purple-500/30 flex items-center justify-center text-xs font-bold text-white">
                          {report.author.split(' ').map(n => n[0]).join('')}
                        </div>
                        <span className="text-sm text-gray-300">{report.author}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400">{report.date}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium border ${statusConfig[report.status].bg} ${statusConfig[report.status].text} ${statusConfig[report.status].border}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${{ approved: 'bg-green-400', pending: 'bg-yellow-400', review: 'bg-purple-400', rejected: 'bg-red-400' }[report.status]}`} />
                        {statusConfig[report.status].label}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 rounded text-xs font-medium capitalize ${priorityConfig[report.priority].bg} ${priorityConfig[report.priority].color}`}>
                        {report.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => setViewingReport(report)}
                          className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all"
                          title="View"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                        {report.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleApprove(report.id)}
                              className="p-2 rounded-lg bg-green-500/20 hover:bg-green-500/30 text-green-400 transition-all"
                              title="Approve"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleReject(report.id)}
                              className="p-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 transition-all"
                              title="Reject"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>

        {/* Empty State */}
        {filteredReports.length === 0 && (
          <div className="text-center py-16">
            <svg className="w-16 h-16 mx-auto text-gray-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-gray-500">No reports found</p>
          </div>
        )}

        {/* Pagination */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-white/10">
          <p className="text-sm text-gray-500">Showing {filteredReports.length} of {reports.length} reports</p>
          <div className="flex items-center gap-2">
            <button className="px-3 py-1 rounded-lg bg-white/5 text-gray-400 hover:text-white disabled:opacity-50 transition-all">Previous</button>
            <button className="px-3 py-1 rounded-lg bg-cyan-500/20 text-cyan-400">1</button>
            <button className="px-3 py-1 rounded-lg bg-white/5 text-gray-400 hover:text-white">2</button>
            <button className="px-3 py-1 rounded-lg bg-white/5 text-gray-400 hover:text-white">3</button>
            <button className="px-3 py-1 rounded-lg bg-white/5 text-gray-400 hover:text-white">Next</button>
          </div>
        </div>
      </motion.div>

      {/* View Report Modal */}
      <Modal
        isOpen={!!viewingReport}
        onClose={() => setViewingReport(null)}
        title="Report Details"
        size="lg"
      >
        {viewingReport && (
          <div className="space-y-6">
            <div>
              <h3 className="font-orbitron text-xl font-bold text-white mb-2">{viewingReport.title}</h3>
              <div className="flex items-center gap-4 text-sm text-gray-400">
                <span>{viewingReport.club}</span>
                <span>|</span>
                <span>By {viewingReport.author}</span>
                <span>|</span>
                <span>{viewingReport.date}</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-white/5">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Status</p>
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-sm font-medium border ${statusConfig[viewingReport.status].bg} ${statusConfig[viewingReport.status].text} ${statusConfig[viewingReport.status].border}`}>
                  {statusConfig[viewingReport.status].label}
                </span>
              </div>
              <div className="p-4 rounded-xl bg-white/5">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Type</p>
                <p className="text-white font-medium capitalize">{viewingReport.type.replace('-', ' ')}</p>
              </div>
              <div className="p-4 rounded-xl bg-white/5">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Priority</p>
                <span className={`inline-flex px-2 py-1 rounded text-sm font-medium capitalize ${priorityConfig[viewingReport.priority].bg} ${priorityConfig[viewingReport.priority].color}`}>
                  {viewingReport.priority}
                </span>
              </div>
            </div>

            <div className="p-6 rounded-xl bg-white/5 border border-white/10">
              <h4 className="font-semibold text-white mb-4">Report Content</h4>
              <p className="text-gray-300 leading-relaxed">
                This is a detailed report covering all aspects of {viewingReport.title.toLowerCase()}.
                The report includes comprehensive analysis, data visualizations, and actionable recommendations
                for the {viewingReport.club}. All figures have been verified and approved by the respective department heads.
              </p>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                onClick={() => setViewingReport(null)}
                className="flex-1 cyber-btn"
              >
                Close
              </button>
              {viewingReport.status === 'pending' && (
                <>
                  <button
                    onClick={() => {
                      handleReject(viewingReport.id)
                      setViewingReport(null)
                    }}
                    className="flex-1 cyber-btn cyber-btn-danger"
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => {
                      handleApprove(viewingReport.id)
                      setViewingReport(null)
                    }}
                    className="flex-1 cyber-btn cyber-btn-primary"
                  >
                    Approve
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Create Report Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Create New Report"
      >
        <form className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-2">Report Title</label>
            <input type="text" className="cyber-input" placeholder="Enter report title" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Club</label>
              <select className="cyber-input">
                <option>Select club</option>
                <option>Robotics Club</option>
                <option>Photography Club</option>
                <option>Music Ensemble</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Report Type</label>
              <select className="cyber-input">
                <option>Quarterly</option>
                <option>Event</option>
                <option>Financial</option>
                <option>Annual</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Priority</label>
              <select className="cyber-input">
                <option>Low</option>
                <option>Medium</option>
                <option>High</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Date</label>
              <input type="date" className="cyber-input" />
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-2">Description</label>
            <textarea className="cyber-input min-h-[120px]" placeholder="Enter report description..." />
          </div>
          <div className="flex gap-3 pt-4">
            <button type="button" onClick={() => setShowModal(false)} className="flex-1 cyber-btn">Cancel</button>
            <button type="button" onClick={() => { success('Report created successfully'); setShowModal(false) }} className="flex-1 cyber-btn cyber-btn-primary">Create Report</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
