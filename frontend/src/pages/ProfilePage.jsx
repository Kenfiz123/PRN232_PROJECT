import { useState } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'

const activityHistory = [
  { action: 'Logged in', date: '2024-12-10 09:15 AM', device: 'Chrome on Windows' },
  { action: 'Submitted report', date: '2024-12-09 03:45 PM', device: 'Chrome on Windows' },
  { action: 'Updated profile', date: '2024-12-08 11:20 AM', device: 'Safari on macOS' },
  { action: 'Approved budget', date: '2024-12-07 02:30 PM', device: 'Chrome on Windows' }
]

export default function ProfilePage() {
  const { user, updateProfile } = useAuth()
  const { success } = useToast()
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    name: user?.name || 'Alex Chen',
    email: user?.email || 'alex.chen@university.edu',
    role: user?.role || 'Club President',
    club: user?.club || 'Robotics Club',
    phone: '(555) 123-4567',
    bio: 'Passionate about robotics and technology innovation. Leading the Robotics Club to new heights.'
  })

  const handleSave = () => {
    updateProfile(formData)
    success('Profile updated successfully')
    setIsEditing(false)
  }

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h2 className="font-orbitron text-2xl font-bold text-white">Profile Settings</h2>
          <p className="text-gray-400 text-sm mt-1">Manage your account and preferences</p>
        </div>
        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            className="cyber-btn flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
            Edit Profile
          </button>
        ) : (
          <div className="flex gap-3">
            <button onClick={() => setIsEditing(false)} className="cyber-btn">Cancel</button>
            <button onClick={handleSave} className="cyber-btn cyber-btn-primary">Save Changes</button>
          </div>
        )}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          className="cyber-card text-center"
        >
          {/* Avatar */}
          <div className="relative inline-block mb-6">
            <div className="w-32 h-32 rounded-2xl bg-gradient-to-br from-cyan-500 via-purple-500 to-pink-500 p-1">
              <div className="w-full h-full rounded-xl bg-cyber-dark flex items-center justify-center">
                <span className="font-orbitron text-4xl font-bold gradient-text">
                  {user?.avatar || 'AC'}
                </span>
              </div>
            </div>
            <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-green-400 flex items-center justify-center text-white font-bold shadow-lg">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>

          <h3 className="font-orbitron text-xl font-bold text-white mb-1">{user?.name || 'Alex Chen'}</h3>
          <p className="text-cyan-400 mb-1">{user?.role || 'Club President'}</p>
          <p className="text-gray-500 text-sm">{user?.club || 'Robotics Club'}</p>

          {/* Status */}
          <div className="mt-6 pt-6 border-t border-white/10">
            <div className="flex items-center justify-center gap-2 mb-3">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-sm text-green-400">Online</span>
            </div>
            <p className="text-xs text-gray-500">Member since {user?.joinDate || 'September 2024'}</p>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-3 mt-6">
            <div className="p-3 rounded-xl bg-white/5">
              <p className="font-orbitron text-lg font-bold text-cyan-400">24</p>
              <p className="text-[10px] text-gray-500 uppercase">Reports</p>
            </div>
            <div className="p-3 rounded-xl bg-white/5">
              <p className="font-orbitron text-lg font-bold text-purple-400">8</p>
              <p className="text-[10px] text-gray-500 uppercase">Events</p>
            </div>
            <div className="p-3 rounded-xl bg-white/5">
              <p className="font-orbitron text-lg font-bold text-pink-400">156</p>
              <p className="text-[10px] text-gray-500 uppercase">Members</p>
            </div>
          </div>
        </motion.div>

        {/* Settings Form */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-2 cyber-card"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-1 h-6 bg-gradient-to-b from-cyan-400 to-purple-400 rounded-full" />
            <h3 className="font-orbitron text-lg font-bold text-white">Personal Information</h3>
          </div>

          <div className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Full Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  disabled={!isEditing}
                  className="cyber-input disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Email Address</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  disabled={!isEditing}
                  className="cyber-input disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Role</label>
                <input
                  type="text"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  disabled={!isEditing}
                  className="cyber-input disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Club</label>
                <input
                  type="text"
                  value={formData.club}
                  onChange={(e) => setFormData({ ...formData, club: e.target.value })}
                  disabled={!isEditing}
                  className="cyber-input disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">Phone Number</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                disabled={!isEditing}
                className="cyber-input disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">Bio</label>
              <textarea
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                disabled={!isEditing}
                rows={4}
                className="cyber-input disabled:opacity-50 disabled:cursor-not-allowed resize-none"
              />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Activity History */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="cyber-card"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="w-1 h-6 bg-gradient-to-b from-green-400 to-cyan-400 rounded-full" />
          <h3 className="font-orbitron text-lg font-bold text-white">Recent Activity</h3>
        </div>

        <div className="space-y-4">
          {activityHistory.map((activity, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + index * 0.1 }}
              className="flex items-center justify-between p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center">
                  <svg className="w-5 h-5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-white">{activity.action}</p>
                  <p className="text-sm text-gray-500">{activity.device}</p>
                </div>
              </div>
              <span className="text-sm text-gray-500">{activity.date}</span>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Security Section */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="cyber-card"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="w-1 h-6 bg-gradient-to-b from-pink-400 to-red-400 rounded-full" />
          <h3 className="font-orbitron text-lg font-bold text-white">Security</h3>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-white">Password</p>
                <p className="text-sm text-gray-500">Last changed 30 days ago</p>
              </div>
            </div>
            <button className="cyber-btn text-sm">Change Password</button>
          </div>

          <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-white">Two-Factor Authentication</p>
                <p className="text-sm text-gray-500">Add an extra layer of security</p>
              </div>
            </div>
            <button className="cyber-btn cyber-btn-secondary text-sm">Enable</button>
          </div>

          <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-yellow-500/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-white">Active Sessions</p>
                <p className="text-sm text-gray-500">Manage your logged-in devices</p>
              </div>
            </div>
            <button className="cyber-btn text-sm">View All</button>
          </div>
        </div>
      </motion.div>

      {/* Danger Zone */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="cyber-card border-red-500/30"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="w-1 h-6 bg-gradient-to-b from-red-500 to-pink-500 rounded-full" />
          <h3 className="font-orbitron text-lg font-bold text-red-400">Danger Zone</h3>
        </div>

        <div className="flex items-center justify-between p-4 rounded-xl bg-red-500/10 border border-red-500/30">
          <div className="flex items-center gap-4">
            <div>
              <p className="font-medium text-white">Delete Account</p>
              <p className="text-sm text-gray-500">Permanently delete your account and all data</p>
            </div>
          </div>
          <button className="cyber-btn cyber-btn-danger text-sm">Delete Account</button>
        </div>
      </motion.div>
    </div>
  )
}
