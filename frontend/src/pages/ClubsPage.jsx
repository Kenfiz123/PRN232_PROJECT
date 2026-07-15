import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Modal from '../components/Modal'
import { useToast } from '../context/ToastContext'

const clubsData = [
  { id: 1, name: 'Robotics Club', president: 'Alex Chen', members: 45, reports: 12, status: 'active', budget: '$5,200', category: 'Technology', color: 'cyan' },
  { id: 2, name: 'Photography Club', president: 'Sarah Miller', members: 38, reports: 8, status: 'active', budget: '$3,800', category: 'Arts', color: 'purple' },
  { id: 3, name: 'Debate Society', president: 'James Wilson', members: 52, reports: 15, status: 'active', budget: '$2,500', category: 'Academic', color: 'pink' },
  { id: 4, name: 'Music Ensemble', president: 'Emily Chen', members: 67, reports: 6, status: 'active', budget: '$8,900', category: 'Arts', color: 'green' },
  { id: 5, name: 'Drama Club', president: 'Michael Brown', members: 41, reports: 9, status: 'active', budget: '$4,200', category: 'Arts', color: 'yellow' },
  { id: 6, name: 'Coding Club', president: 'Lisa Park', members: 89, reports: 21, status: 'active', budget: '$6,700', category: 'Technology', color: 'cyan' },
  { id: 7, name: 'Chess Club', president: 'David Kim', members: 28, reports: 4, status: 'inactive', budget: '$1,200', category: 'Academic', color: 'gray' },
  { id: 8, name: 'Environmental Club', president: 'Emma Johnson', members: 56, reports: 11, status: 'active', budget: '$3,500', category: 'Social', color: 'green' },
  { id: 9, name: 'Literary Society', president: 'Oliver Smith', members: 34, reports: 7, status: 'active', budget: '$2,800', category: 'Academic', color: 'purple' },
  { id: 10, name: 'Sports Club', president: 'Lucas Garcia', members: 124, reports: 18, status: 'active', budget: '$12,500', category: 'Sports', color: 'pink' }
]

const categories = ['All', 'Technology', 'Arts', 'Academic', 'Sports', 'Social']
const statusColors = {
  active: { bg: 'bg-green-500/20', text: 'text-green-400', border: 'border-green-500/50', dot: 'bg-green-400' },
  inactive: { bg: 'bg-gray-500/20', text: 'text-gray-400', border: 'border-gray-500/50', dot: 'bg-gray-400' }
}

export default function ClubsPage() {
  const { success } = useToast()
  const [clubs, setClubs] = useState(clubsData)
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingClub, setEditingClub] = useState(null)
  const [sortBy, setSortBy] = useState('name')

  const filteredClubs = clubs
    .filter(club => selectedCategory === 'All' || club.category === selectedCategory)
    .filter(club => club.name.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name)
      if (sortBy === 'members') return b.members - a.members
      if (sortBy === 'reports') return b.reports - a.reports
      return 0
    })

  const handleAddClub = () => {
    setEditingClub(null)
    setShowModal(true)
  }

  const handleEditClub = (club) => {
    setEditingClub(club)
    setShowModal(true)
  }

  const handleDeleteClub = (clubId) => {
    setClubs(prev => prev.filter(c => c.id !== clubId))
    success('Club deleted successfully')
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
          <h2 className="font-orbitron text-2xl font-bold text-white">Clubs Management</h2>
          <p className="text-gray-400 text-sm mt-1">Manage and monitor all registered clubs</p>
        </div>
        <button
          onClick={handleAddClub}
          className="cyber-btn cyber-btn-primary flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Add New Club
        </button>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col lg:flex-row gap-4"
      >
        {/* Search */}
        <div className="relative flex-1">
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search clubs..."
            className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/50 transition-all"
          />
        </div>

        {/* Category Filter */}
        <div className="flex gap-2 flex-wrap">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                selectedCategory === category
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50'
                  : 'bg-white/5 text-gray-400 border border-white/10 hover:border-white/20'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Sort */}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-gray-300 focus:outline-none focus:border-cyan-500/50"
        >
          <option value="name">Sort by Name</option>
          <option value="members">Sort by Members</option>
          <option value="reports">Sort by Reports</option>
        </select>
      </motion.div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Clubs', value: clubs.length, color: 'cyan' },
          { label: 'Active Clubs', value: clubs.filter(c => c.status === 'active').length, color: 'green' },
          { label: 'Total Members', value: clubs.reduce((acc, c) => acc + c.members, 0), color: 'purple' },
          { label: 'Total Reports', value: clubs.reduce((acc, c) => acc + c.reports, 0), color: 'pink' }
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
            className={`cyber-card text-center p-4 border-${stat.color}-500/30`}
          >
            <p className={`font-orbitron text-2xl font-bold text-${stat.color}-400`}>{stat.value}</p>
            <p className="text-xs text-gray-500 uppercase tracking-wider mt-1">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Clubs Grid */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        <AnimatePresence mode="popLayout">
          {filteredClubs.map((club, index) => (
            <motion.div
              key={club.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ y: -5 }}
              className="cyber-card group cursor-pointer"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br from-${club.color}-500/30 to-${club.color}-500/10 border border-${club.color}-500/30 flex items-center justify-center`}>
                    <span className="font-orbitron font-bold text-white">{club.name[0]}</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-white group-hover:text-cyan-400 transition-colors">{club.name}</h3>
                    <p className="text-xs text-gray-500">{club.category}</p>
                  </div>
                </div>
                <span className={`cyber-badge cyber-badge-${club.status === 'active' ? 'green' : 'purple'}`}>
                  {club.status}
                </span>
              </div>

              {/* Info Grid */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="p-3 rounded-lg bg-white/5">
                  <p className="text-lg font-bold text-white">{club.members}</p>
                  <p className="text-xs text-gray-500">Members</p>
                </div>
                <div className="p-3 rounded-lg bg-white/5">
                  <p className="text-lg font-bold text-cyan-400">{club.reports}</p>
                  <p className="text-xs text-gray-500">Reports</p>
                </div>
              </div>

              {/* Details */}
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">President</span>
                  <span className="text-white">{club.president}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Budget</span>
                  <span className="text-green-400 font-medium">{club.budget}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 mt-4 pt-4 border-t border-white/5">
                <button
                  onClick={() => handleEditClub(club)}
                  className="flex-1 py-2 px-3 rounded-lg text-xs font-medium bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDeleteClub(club.id)}
                  className="py-2 px-3 rounded-lg text-xs font-medium bg-pink-500/10 hover:bg-pink-500/20 text-pink-400 transition-all"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      {/* Empty State */}
      {filteredClubs.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-16"
        >
          <svg className="w-16 h-16 mx-auto text-gray-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <p className="text-gray-500">No clubs found matching your criteria</p>
        </motion.div>
      )}

      {/* Add/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingClub ? 'Edit Club' : 'Add New Club'}
      >
        <form className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-2">Club Name</label>
            <input
              type="text"
              defaultValue={editingClub?.name || ''}
              className="cyber-input"
              placeholder="Enter club name"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-2">President</label>
            <input
              type="text"
              defaultValue={editingClub?.president || ''}
              className="cyber-input"
              placeholder="Enter president name"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Category</label>
              <select className="cyber-input">
                <option value="Technology">Technology</option>
                <option value="Arts">Arts</option>
                <option value="Academic">Academic</option>
                <option value="Sports">Sports</option>
                <option value="Social">Social</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Budget</label>
              <input
                type="text"
                defaultValue={editingClub?.budget || ''}
                className="cyber-input"
                placeholder="$0,000"
              />
            </div>
          </div>
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="flex-1 cyber-btn cyber-btn-secondary"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                success(editingClub ? 'Club updated successfully' : 'Club added successfully')
                setShowModal(false)
              }}
              className="flex-1 cyber-btn cyber-btn-primary"
            >
              {editingClub ? 'Update' : 'Create'} Club
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
