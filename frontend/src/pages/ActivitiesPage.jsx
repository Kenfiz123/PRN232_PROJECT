import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Modal from '../components/Modal'
import { useToast } from '../context/ToastContext'

const activitiesData = [
  { id: 1, name: 'Tech Symposium 2024', club: 'Coding Club', date: '2024-12-15', time: '09:00 AM', location: 'Main Auditorium', status: 'upcoming', attendees: 156, budget: '$3,500' },
  { id: 2, name: 'Winter Concert', club: 'Music Ensemble', date: '2024-12-18', time: '06:00 PM', location: 'Concert Hall', status: 'upcoming', attendees: 234, budget: '$5,200' },
  { id: 3, name: 'Photography Exhibition', club: 'Photography Club', date: '2024-12-20', time: '10:00 AM', location: 'Art Gallery', status: 'upcoming', attendees: 89, budget: '$1,800' },
  { id: 4, name: 'Robot Battle Championship', club: 'Robotics Club', date: '2024-12-22', time: '02:00 PM', location: 'Engineering Lab', status: 'upcoming', attendees: 312, budget: '$4,200' },
  { id: 5, name: 'Fall Debate Tournament', club: 'Debate Society', date: '2024-11-28', time: '10:00 AM', location: 'Room 301', status: 'completed', attendees: 78, budget: '$900' },
  { id: 6, name: 'Drama Performance', club: 'Drama Club', date: '2024-11-25', time: '07:00 PM', location: 'Theater', status: 'completed', attendees: 245, budget: '$6,500' },
  { id: 7, name: 'Chess Tournament', club: 'Chess Club', date: '2024-11-20', time: '01:00 PM', location: 'Library', status: 'completed', attendees: 45, budget: '$400' },
  { id: 8, name: 'Environmental Cleanup', club: 'Environmental Club', date: '2024-11-15', time: '08:00 AM', location: 'City Park', status: 'completed', attendees: 120, budget: '$600' },
  { id: 9, name: 'Basketball League', club: 'Sports Club', date: '2024-12-28', time: '03:00 PM', location: 'Sports Complex', status: 'upcoming', attendees: 180, budget: '$2,500' },
  { id: 10, name: 'Literary Festival', club: 'Literary Society', date: '2025-01-05', time: '11:00 AM', location: 'Conference Room', status: 'upcoming', attendees: 95, budget: '$1,200' }
]

const statusConfig = {
  upcoming: { bg: 'bg-cyan-500/20', text: 'text-cyan-400', border: 'border-cyan-500/50' },
  completed: { bg: 'bg-green-500/20', text: 'text-green-400', border: 'border-green-500/50' },
  cancelled: { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/50' }
}

export default function ActivitiesPage() {
  const { success } = useToast()
  const [activities, setActivities] = useState(activitiesData)
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [selectedActivity, setSelectedActivity] = useState(null)

  const filteredActivities = activities
    .filter(a => selectedStatus === 'all' || a.status === selectedStatus)
    .filter(a => a.name.toLowerCase().includes(searchQuery.toLowerCase()) || a.club.toLowerCase().includes(searchQuery.toLowerCase()))

  const handleDelete = (id) => {
    setActivities(prev => prev.filter(a => a.id !== id))
    success('Activity deleted successfully')
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
          <h2 className="font-orbitron text-2xl font-bold text-white">Activities Management</h2>
          <p className="text-gray-400 text-sm mt-1">Plan and track club activities and events</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="cyber-btn cyber-btn-primary flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Create Activity
        </button>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Activities', value: activities.length, color: 'cyan' },
          { label: 'Upcoming', value: activities.filter(a => a.status === 'upcoming').length, color: 'purple' },
          { label: 'Completed', value: activities.filter(a => a.status === 'completed').length, color: 'green' },
          { label: 'Total Attendees', value: activities.reduce((acc, a) => acc + a.attendees, 0), color: 'pink' }
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
            className="cyber-card p-4 text-center"
          >
            <p className={`font-orbitron text-2xl font-bold text-${stat.color}-400`}>{stat.value}</p>
            <p className="text-xs text-gray-500 uppercase tracking-wider mt-1">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row gap-4"
      >
        <div className="relative flex-1 max-w-md">
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search activities..."
            className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/50 transition-all"
          />
        </div>

        <div className="flex gap-2">
          {['all', 'upcoming', 'completed', 'cancelled'].map((status) => (
            <button
              key={status}
              onClick={() => setSelectedStatus(status)}
              className={`px-4 py-2 rounded-xl text-sm font-medium capitalize transition-all ${
                selectedStatus === status
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50'
                  : 'bg-white/5 text-gray-400 border border-white/10 hover:border-white/20'
              }`}
            >
              {status === 'all' ? 'All' : status}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Activities Timeline */}
      <div className="relative">
        {/* Timeline Line */}
        <div className="absolute left-8 top-0 bottom-0 w-px bg-gradient-to-b from-cyan-500 via-purple-500 to-pink-500 opacity-30" />

        <div className="space-y-6">
          <AnimatePresence mode="popLayout">
            {filteredActivities.map((activity, index) => (
              <motion.div
                key={activity.id}
                layout
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 30 }}
                transition={{ delay: index * 0.05 }}
                className="relative pl-20"
              >
                {/* Timeline Dot */}
                <div className={`absolute left-6 top-6 w-5 h-5 rounded-full border-4 ${
                  activity.status === 'upcoming' ? 'bg-cyan-400 border-cyan-400' :
                  activity.status === 'completed' ? 'bg-green-400 border-green-400' : 'bg-red-400 border-red-400'
                }`} style={{ boxShadow: '0 0 15px currentColor' }} />

                {/* Activity Card */}
                <div className="cyber-card group cursor-pointer" onClick={() => setSelectedActivity(activity)}>
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-white group-hover:text-cyan-400 transition-colors">{activity.name}</h3>
                        <span className={`cyber-badge ${activity.status === 'upcoming' ? 'cyber-badge-cyan' : 'cyber-badge-green'}`}>
                          {activity.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-400">{activity.club}</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-sm">
                      <div className="flex items-center gap-2 text-gray-400">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span>{activity.date}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-400">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>{activity.time}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-400">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span>{activity.location}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-cyan-400 font-medium">{activity.attendees} attendees</span>
                        <span className="text-green-400 font-medium">{activity.budget}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(activity.id) }}
                        className="p-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 transition-all"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Activity Detail Modal */}
      <Modal
        isOpen={!!selectedActivity}
        onClose={() => setSelectedActivity(null)}
        title="Activity Details"
        size="lg"
      >
        {selectedActivity && (
          <div className="space-y-6">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-orbitron text-xl font-bold text-white">{selectedActivity.name}</h3>
                <p className="text-gray-400 mt-1">{selectedActivity.club}</p>
              </div>
              <span className={`cyber-badge ${selectedActivity.status === 'upcoming' ? 'cyber-badge-cyan' : 'cyber-badge-green'}`}>
                {selectedActivity.status}
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-white/5">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Date</p>
                <p className="text-white font-medium">{selectedActivity.date}</p>
              </div>
              <div className="p-4 rounded-xl bg-white/5">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Time</p>
                <p className="text-white font-medium">{selectedActivity.time}</p>
              </div>
              <div className="p-4 rounded-xl bg-white/5">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Attendees</p>
                <p className="text-cyan-400 font-medium">{selectedActivity.attendees}</p>
              </div>
              <div className="p-4 rounded-xl bg-white/5">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Budget</p>
                <p className="text-green-400 font-medium">{selectedActivity.budget}</p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white/5">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Location</p>
              <p className="text-white">{selectedActivity.location}</p>
            </div>

            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <h4 className="font-semibold text-white mb-3">Description</h4>
              <p className="text-gray-300 leading-relaxed">
                This activity is organized by the {selectedActivity.club} and aims to provide an engaging experience
                for all participants. The event will feature various activities, workshops, and networking opportunities.
              </p>
            </div>

            <div className="flex gap-3 pt-4">
              <button onClick={() => setSelectedActivity(null)} className="flex-1 cyber-btn">Close</button>
              <button className="flex-1 cyber-btn cyber-btn-primary">Edit Activity</button>
            </div>
          </div>
        )}
      </Modal>

      {/* Create Activity Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Create New Activity">
        <form className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-2">Activity Name</label>
            <input type="text" className="cyber-input" placeholder="Enter activity name" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Club</label>
              <select className="cyber-input">
                <option>Select club</option>
                <option>Coding Club</option>
                <option>Music Ensemble</option>
                <option>Photography Club</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Date</label>
              <input type="date" className="cyber-input" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Time</label>
              <input type="time" className="cyber-input" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Budget</label>
              <input type="text" className="cyber-input" placeholder="$0,000" />
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-2">Location</label>
            <input type="text" className="cyber-input" placeholder="Enter location" />
          </div>
          <div className="flex gap-3 pt-4">
            <button type="button" onClick={() => setShowModal(false)} className="flex-1 cyber-btn">Cancel</button>
            <button type="button" onClick={() => { success('Activity created successfully'); setShowModal(false) }} className="flex-1 cyber-btn cyber-btn-primary">Create Activity</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
