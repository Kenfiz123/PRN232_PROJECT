import { motion } from 'framer-motion'

export default function StatCard({ title, value, change, changeType, icon, color = 'cyan', delay = 0 }) {
  const colorVariants = {
    cyan: {
      bg: 'from-cyan-500/20 to-cyan-500/5',
      border: 'border-cyan-500/30',
      text: 'text-cyan-400',
      glow: 'shadow-neon-cyan'
    },
    purple: {
      bg: 'from-purple-500/20 to-purple-500/5',
      border: 'border-purple-500/30',
      text: 'text-purple-400',
      glow: 'shadow-neon-purple'
    },
    pink: {
      bg: 'from-pink-500/20 to-pink-500/5',
      border: 'border-pink-500/30',
      text: 'text-pink-400',
      glow: 'shadow-neon-pink'
    },
    green: {
      bg: 'from-green-500/20 to-green-500/5',
      border: 'border-green-500/30',
      text: 'text-green-400',
      glow: 'shadow-neon-green'
    }
  }

  const variant = colorVariants[color]

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ y: -5, scale: 1.02 }}
      className={`relative p-6 rounded-2xl bg-gradient-to-br ${variant.bg} border ${variant.border} backdrop-blur-sm overflow-hidden group cursor-pointer transition-all duration-300 hover:shadow-2xl`}
    >
      {/* Animated Border */}
      <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500">
        <div className="absolute inset-0 rounded-2xl border-2 border-transparent animate-spin-slow" style={{
          background: 'linear-gradient(var(--bg-primary), var(--bg-primary)) padding-box, linear-gradient(90deg, var(--neon-cyan), var(--neon-purple), var(--neon-pink)) border-box'
        }} />
      </div>

      {/* Glow Effect */}
      <div className={`absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br ${variant.text} opacity-0 group-hover:opacity-20 blur-3xl transition-opacity duration-500`} />

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-sm text-gray-400 uppercase tracking-wider mb-1">{title}</p>
            <h3 className={`text-3xl font-orbitron font-bold ${variant.text}`}>{value}</h3>
          </div>
          <div className={`p-3 rounded-xl bg-gradient-to-br ${variant.bg} border ${variant.border}`}>
            {icon}
          </div>
        </div>

        {/* Change Indicator */}
        {change && (
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium ${
              changeType === 'positive'
                ? 'bg-green-500/20 text-green-400'
                : 'bg-red-500/20 text-red-400'
            }`}>
              {changeType === 'positive' ? (
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
              ) : (
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              )}
              {change}
            </span>
            <span className="text-xs text-gray-500">vs last month</span>
          </div>
        )}

        {/* Mini Chart Placeholder */}
        <div className="mt-4 h-12 flex items-end gap-1">
          {[40, 65, 45, 80, 55, 90, 70].map((h, i) => (
            <motion.div
              key={i}
              initial={{ height: 0 }}
              animate={{ height: `${h}%` }}
              transition={{ duration: 0.5, delay: 0.3 + i * 0.05 }}
              className={`flex-1 rounded-t-sm bg-gradient-to-t ${variant.text} opacity-60 group-hover:opacity-100`}
            />
          ))}
        </div>
      </div>
    </motion.div>
  )
}
