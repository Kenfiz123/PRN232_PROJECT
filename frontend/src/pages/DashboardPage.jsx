import { motion } from 'framer-motion'
import StatCard from '../components/StatCard'
import { useAuth } from '../context/AuthContext'

const recentActivities = [
  { id: 1, user: 'Sarah Miller', action: 'submitted a new report', target: 'Q4 Event Summary', time: '2 hours ago', avatar: 'SM', type: 'report' },
  { id: 2, user: 'James Wilson', action: 'approved budget for', target: 'Tech Symposium 2024', time: '4 hours ago', avatar: 'JW', type: 'finance' },
  { id: 3, user: 'Emily Chen', action: 'registered new club', target: 'AI Research Society', time: '6 hours ago', avatar: 'EC', type: 'club' },
  { id: 4, user: 'Michael Brown', action: 'completed activity', target: 'Spring Festival Setup', time: '8 hours ago', avatar: 'MB', type: 'activity' },
  { id: 5, user: 'Lisa Park', action: 'updated profile for', target: 'Drama Club', time: '1 day ago', avatar: 'LP', type: 'profile' }
]

const quickStats = [
  { label: 'Reports Today', value: '12' },
  { label: 'Pending Approval', value: '5' },
  { label: 'Active Members', value: '847' },
  { label: 'Events This Week', value: '8' }
]

const upcomingEvents = [
  { name: 'Tech Symposium 2024', date: 'Dec 15', club: 'Coding Club', attendees: 156 },
  { name: 'Winter Concert', date: 'Dec 18', club: 'Music Ensemble', attendees: 234 },
  { name: 'Photography Exhibition', date: 'Dec 20', club: 'Photography Club', attendees: 89 },
  { name: 'Robot Battle Championship', date: 'Dec 22', club: 'Robotics Club', attendees: 312 }
]

export default function DashboardPage() {
  const { user } = useAuth()

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8"
    >
      {/* Welcome Section */}
      <motion.div variants={itemVariants} className="flex items-center justify-between">
        <div>
          <h2 className="font-orbitron text-3xl font-bold text-white mb-2">
            Welcome back, <span className="gradient-text">{user?.name?.split(' ')[0] || 'Commander'}</span>
          </h2>
          <p className="text-gray-400">Here's what's happening in your club network today.</p>
        </div>
        <div className="hidden md:flex items-center gap-4">
          <div className="flex -space-x-2">
            {['SM', 'JW', 'EC', 'MB', 'LP'].map((avatar, i) => (
              <div
                key={i}
                className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center text-xs font-bold text-white border-2 border-cyber-dark"
                style={{ zIndex: 5 - i }}
              >
                {avatar}
              </div>
            ))}
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-white">24 Online</p>
            <p className="text-xs text-gray-500">3 pending approvals</p>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Reports"
          value="1,247"
          change="+12.5%"
          changeType="positive"
          color="cyan"
          delay={0}
          icon={
            <svg className="w-6 h-6 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          }
        />
        <StatCard
          title="Active Clubs"
          value="28"
          change="+2"
          changeType="positive"
          color="purple"
          delay={0.1}
          icon={
            <svg className="w-6 h-6 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          }
        />
        <StatCard
          title="Total Budget"
          value="$45.2K"
          change="+8.3%"
          changeType="positive"
          color="pink"
          delay={0.2}
          icon={
            <svg className="w-6 h-6 text-pink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatCard
          title="Activities"
          value="89"
          change="-3.2%"
          changeType="negative"
          color="green"
          delay={0.3}
          icon={
            <svg className="w-6 h-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          }
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <motion.div variants={itemVariants} className="lg:col-span-2 cyber-card">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-1 h-6 bg-gradient-to-b from-cyan-400 to-purple-400 rounded-full" />
              <h3 className="font-orbitron text-lg font-bold text-white">Recent Activity</h3>
            </div>
            <button className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors">View All</button>
          </div>

          <div className="space-y-4">
            {recentActivities.map((activity, index) => (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center gap-4 p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-cyan-500/30 transition-all group"
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${
                  activity.type === 'report' ? 'bg-cyan-500/20 text-cyan-400' :
                  activity.type === 'finance' ? 'bg-pink-500/20 text-pink-400' :
                  activity.type === 'club' ? 'bg-purple-500/20 text-purple-400' :
                  'bg-green-500/20 text-green-400'
                }`}>
                  {activity.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-300">
                    <span className="font-semibold text-white">{activity.user}</span>
                    {' '}{activity.action}{' '}
                    <span className="text-cyan-400">{activity.target}</span>
                  </p>
                  <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                </div>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Quick Stats & Upcoming */}
        <motion.div variants={itemVariants} className="space-y-6">
          {/* Quick Stats */}
          <div className="cyber-card">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-1 h-6 bg-gradient-to-b from-pink-400 to-purple-400 rounded-full" />
              <h3 className="font-orbitron text-lg font-bold text-white">Quick Stats</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {quickStats.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                  className="p-4 rounded-xl bg-white/5 border border-white/5 text-center group hover:border-cyan-500/30 transition-all"
                >
                  <p className="font-orbitron text-2xl font-bold text-cyan-400">{stat.value}</p>
                  <p className="text-xs text-gray-500 mt-1 uppercase tracking-wider">{stat.label}</p>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Upcoming Events */}
          <div className="cyber-card">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-1 h-6 bg-gradient-to-b from-green-400 to-cyan-400 rounded-full" />
              <h3 className="font-orbitron text-lg font-bold text-white">Upcoming Events</h3>
            </div>
            <div className="space-y-3">
              {upcomingEvents.map((event, index) => (
                <motion.div
                  key={event.name}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 + index * 0.1 }}
                  className="flex items-center gap-4 p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-green-500/30 transition-all group"
                >
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500/20 to-cyan-500/20 border border-green-500/30 flex flex-col items-center justify-center">
                    <span className="text-xs text-green-400 font-bold uppercase">{event.date.split(' ')[0]}</span>
                    <span className="text-lg font-orbitron font-bold text-white">{event.date.split(' ')[1]}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{event.name}</p>
                    <p className="text-xs text-gray-500">{event.club}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-cyan-400">{event.attendees}</p>
                    <p className="text-[10px] text-gray-500 uppercase">Attendees</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Charts Section */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Report Trends */}
        <div className="cyber-card">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-1 h-6 bg-gradient-to-b from-cyan-400 to-pink-400 rounded-full" />
              <h3 className="font-orbitron text-lg font-bold text-white">Report Trends</h3>
            </div>
            <div className="flex gap-2">
              {['Week', 'Month', 'Year'].map((period, i) => (
                <button
                  key={period}
                  className={`px-3 py-1 text-xs font-medium rounded-lg transition-all ${
                    i === 1 ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50' : 'text-gray-500 hover:text-white'
                  }`}
                >
                  {period}
                </button>
              ))}
            </div>
          </div>

          {/* CSS Chart */}
          <div className="h-48 flex items-end justify-between gap-2 px-2">
            {[65, 45, 78, 52, 88, 67, 92, 73, 85, 60, 76, 95].map((value, i) => (
              <motion.div
                key={i}
                initial={{ height: 0 }}
                animate={{ height: `${value}%` }}
                transition={{ duration: 0.8, delay: i * 0.05 }}
                className="flex-1 rounded-t-lg bg-gradient-to-t from-cyan-500 to-purple-500 relative group"
              >
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-cyber-darker rounded text-xs text-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  {value}%
                </div>
              </motion.div>
            ))}
          </div>
          <div className="flex justify-between mt-4 text-xs text-gray-500">
            <span>Jan</span>
            <span>Feb</span>
            <span>Mar</span>
            <span>Apr</span>
            <span>May</span>
            <span>Jun</span>
            <span>Jul</span>
            <span>Aug</span>
            <span>Sep</span>
            <span>Oct</span>
            <span>Nov</span>
            <span>Dec</span>
          </div>
        </div>

        {/* Budget Allocation */}
        <div className="cyber-card">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-1 h-6 bg-gradient-to-b from-pink-400 to-yellow-400 rounded-full" />
              <h3 className="font-orbitron text-lg font-bold text-white">Budget Allocation</h3>
            </div>
          </div>

          {/* Donut Chart */}
          <div className="flex items-center gap-8">
            <div className="relative w-40 h-40">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                {/* Background circle */}
                <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="12" />
                {/* Segments */}
                <motion.circle
                  cx="50" cy="50" r="40" fill="none"
                  stroke="url(#gradient1)" strokeWidth="12"
                  strokeDasharray="75.4 251.2"
                  strokeDashoffset="0"
                  strokeLinecap="round"
                  initial={{ strokeDasharray: "0 251.2" }}
                  animate={{ strokeDasharray: "75.4 251.2" }}
                  transition={{ duration: 1, delay: 0.2 }}
                />
                <motion.circle
                  cx="50" cy="50" r="40" fill="none"
                  stroke="url(#gradient2)" strokeWidth="12"
                  strokeDasharray="62.8 251.2"
                  strokeDashoffset="-75.4"
                  strokeLinecap="round"
                  initial={{ strokeDasharray: "0 251.2" }}
                  animate={{ strokeDasharray: "62.8 251.2" }}
                  transition={{ duration: 1, delay: 0.4 }}
                />
                <motion.circle
                  cx="50" cy="50" r="40" fill="none"
                  stroke="url(#gradient3)" strokeWidth="12"
                  strokeDasharray="50.3 251.2"
                  strokeDashoffset="-138.2"
                  strokeLinecap="round"
                  initial={{ strokeDasharray: "0 251.2" }}
                  animate={{ strokeDasharray: "50.3 251.2" }}
                  transition={{ duration: 1, delay: 0.6 }}
                />
                <motion.circle
                  cx="50" cy="50" r="40" fill="none"
                  stroke="url(#gradient4)" strokeWidth="12"
                  strokeDasharray="62.8 251.2"
                  strokeDashoffset="-188.5"
                  strokeLinecap="round"
                  initial={{ strokeDasharray: "0 251.2" }}
                  animate={{ strokeDasharray: "62.8 251.2" }}
                  transition={{ duration: 1, delay: 0.8 }}
                />
                <defs>
                  <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#00f5ff" />
                    <stop offset="100%" stopColor="#00f5ff" />
                  </linearGradient>
                  <linearGradient id="gradient2" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#bf00ff" />
                    <stop offset="100%" stopColor="#bf00ff" />
                  </linearGradient>
                  <linearGradient id="gradient3" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#ff006e" />
                    <stop offset="100%" stopColor="#ff006e" />
                  </linearGradient>
                  <linearGradient id="gradient4" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#00ff88" />
                    <stop offset="100%" stopColor="#00ff88" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-orbitron text-2xl font-bold text-white">$45.2K</span>
                <span className="text-xs text-gray-500">Total Budget</span>
              </div>
            </div>

            {/* Legend */}
            <div className="flex-1 space-y-3">
              {[
                { name: 'Events', value: '30%', color: 'cyan' },
                { name: 'Equipment', value: '25%', color: 'purple' },
                { name: 'Marketing', value: '20%', color: 'pink' },
                { name: 'Operations', value: '25%', color: 'green' }
              ].map((item, i) => (
                <motion.div
                  key={item.name}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.8 + i * 0.1 }}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-sm bg-${item.color}-500`} />
                    <span className="text-sm text-gray-300">{item.name}</span>
                  </div>
                  <span className={`font-semibold text-${item.color}-400`}>{item.value}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
