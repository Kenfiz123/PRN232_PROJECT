import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'

const clubs = [
  'Robotics Club',
  'Photography Club',
  'Debate Society',
  'Music Ensemble',
  'Drama Club',
  'Coding Club',
  'Chess Club',
  'Environmental Club',
  'Literary Society',
  'Sports Club'
]

export default function RegisterPage() {
  const navigate = useNavigate()
  const { register } = useAuth()
  const { success, error } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    club: ''
  })
  const [errors, setErrors] = useState({})
  const [step, setStep] = useState(1)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    setErrors(prev => ({ ...prev, [name]: '' }))
  }

  const validateStep = (currentStep) => {
    const newErrors = {}

    if (currentStep === 1) {
      if (!formData.name.trim()) {
        newErrors.name = 'Full name is required'
      } else if (formData.name.trim().length < 2) {
        newErrors.name = 'Name must be at least 2 characters'
      }
      if (!formData.email) {
        newErrors.email = 'Email is required'
      } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
        newErrors.email = 'Invalid email format'
      }
    }

    if (currentStep === 2) {
      if (!formData.password) {
        newErrors.password = 'Password is required'
      } else if (formData.password.length < 8) {
        newErrors.password = 'Password must be at least 8 characters'
      }
      if (!formData.confirmPassword) {
        newErrors.confirmPassword = 'Please confirm your password'
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match'
      }
    }

    if (currentStep === 3 && !formData.club) {
      newErrors.club = 'Please select a club'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const nextStep = () => {
    if (validateStep(step)) {
      setStep(prev => prev + 1)
    }
  }

  const prevStep = () => {
    setStep(prev => prev - 1)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateStep(3)) return

    setIsLoading(true)
    try {
      await register(formData.name, formData.email, formData.password, formData.club)
      success('Account created successfully! Welcome to ClubReportHub.')
      navigate('/dashboard')
    } catch (err) {
      error('Registration failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-cyber-dark flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 grid-pattern opacity-20" />

        <motion.div
          animate={{ scale: [1, 1.2, 1], x: [0, 30, 0] }}
          transition={{ duration: 12, repeat: Infinity }}
          className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-500/15 rounded-full blur-3xl"
        />
        <motion.div
          animate={{ scale: [1, 1.3, 1], x: [0, -30, 0] }}
          transition={{ duration: 10, repeat: Infinity }}
          className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-cyan-500/15 rounded-full blur-3xl"
        />
      </div>

      {/* Registration Card */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-full max-w-lg"
      >
        {/* Glow */}
        <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 rounded-2xl blur-xl opacity-25" />

        <div className="relative bg-cyber-darker/90 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden">
          {/* Header */}
          <div className="px-8 pt-8 pb-6 text-center border-b border-white/5">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="relative inline-block mb-4"
            >
              <div className="w-16 h-16 mx-auto rounded-xl bg-gradient-to-br from-cyan-500 via-purple-500 to-pink-500 p-1">
                <div className="w-full h-full rounded-xl bg-cyber-dark flex items-center justify-center">
                  <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                </div>
              </div>
            </motion.div>

            <h1 className="font-orbitron text-2xl font-bold gradient-text mb-2">
              Create Account
            </h1>
            <p className="text-gray-400 text-sm">
              Join the ClubReportHub network
            </p>

            {/* Progress Steps */}
            <div className="flex items-center justify-center gap-2 mt-6">
              {[1, 2, 3].map((s) => (
                <div key={s} className="flex items-center">
                  <motion.div
                    initial={false}
                    animate={{
                      backgroundColor: s <= step ? '#00f5ff' : 'rgba(255,255,255,0.1)',
                      borderColor: s <= step ? '#00f5ff' : 'rgba(255,255,255,0.2)'
                    }}
                    className="w-8 h-8 rounded-lg border-2 flex items-center justify-center font-orbitron text-xs font-bold transition-all"
                  >
                    {s < step ? (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : s}
                  </motion.div>
                  {s < 3 && (
                    <div className={`w-12 h-0.5 mx-1 ${s < step ? 'bg-cyan-500' : 'bg-white/10'}`} />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-8 py-6">
            {/* Step 1: Personal Info */}
            {step === 1 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-5"
              >
                <div>
                  <label className="block text-xs text-gray-400 uppercase tracking-wider mb-2">Full Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Alex Chen"
                    className={`w-full px-4 py-3.5 bg-white/5 border rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/50 transition-all ${errors.name ? 'border-red-500' : 'border-white/10'}`}
                  />
                  {errors.name && <p className="mt-2 text-xs text-red-400">{errors.name}</p>}
                </div>

                <div>
                  <label className="block text-xs text-gray-400 uppercase tracking-wider mb-2">Email Address</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="alex@university.edu"
                    className={`w-full px-4 py-3.5 bg-white/5 border rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/50 transition-all ${errors.email ? 'border-red-500' : 'border-white/10'}`}
                  />
                  {errors.email && <p className="mt-2 text-xs text-red-400">{errors.email}</p>}
                </div>

                <button
                  type="button"
                  onClick={nextStep}
                  className="w-full py-4 font-orbitron font-bold text-white rounded-xl bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 hover:opacity-90 transition-opacity"
                >
                  Continue
                </button>
              </motion.div>
            )}

            {/* Step 2: Password */}
            {step === 2 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-5"
              >
                <div>
                  <label className="block text-xs text-gray-400 uppercase tracking-wider mb-2">Password</label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Min. 8 characters"
                    className={`w-full px-4 py-3.5 bg-white/5 border rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/50 transition-all ${errors.password ? 'border-red-500' : 'border-white/10'}`}
                  />
                  {errors.password && <p className="mt-2 text-xs text-red-400">{errors.password}</p>}
                </div>

                <div>
                  <label className="block text-xs text-gray-400 uppercase tracking-wider mb-2">Confirm Password</label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Re-enter your password"
                    className={`w-full px-4 py-3.5 bg-white/5 border rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/50 transition-all ${errors.confirmPassword ? 'border-red-500' : 'border-white/10'}`}
                  />
                  {errors.confirmPassword && <p className="mt-2 text-xs text-red-400">{errors.confirmPassword}</p>}
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={prevStep}
                    className="flex-1 py-4 font-orbitron font-bold text-white rounded-xl border border-white/20 hover:bg-white/5 transition-colors"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={nextStep}
                    className="flex-1 py-4 font-orbitron font-bold text-white rounded-xl bg-gradient-to-r from-cyan-500 to-purple-500 hover:opacity-90 transition-opacity"
                  >
                    Continue
                  </button>
                </div>
              </motion.div>
            )}

            {/* Step 3: Club Selection */}
            {step === 3 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-5"
              >
                <div>
                  <label className="block text-xs text-gray-400 uppercase tracking-wider mb-2">Select Your Club</label>
                  <select
                    name="club"
                    value={formData.club}
                    onChange={handleChange}
                    className={`w-full px-4 py-3.5 bg-white/5 border rounded-xl text-white focus:outline-none focus:border-cyan-500/50 transition-all ${errors.club ? 'border-red-500' : 'border-white/10'}`}
                  >
                    <option value="" className="bg-cyber-dark">Choose a club...</option>
                    {clubs.map((club) => (
                      <option key={club} value={club} className="bg-cyber-dark">{club}</option>
                    ))}
                  </select>
                  {errors.club && <p className="mt-2 text-xs text-red-400">{errors.club}</p>}
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={prevStep}
                    className="flex-1 py-4 font-orbitron font-bold text-white rounded-xl border border-white/20 hover:bg-white/5 transition-colors"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 py-4 font-orbitron font-bold text-white rounded-xl bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <>
                        <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Creating...
                      </>
                    ) : 'Create Account'}
                  </button>
                </div>
              </motion.div>
            )}
          </form>

          {/* Footer */}
          <div className="px-8 pb-8 text-center border-t border-white/5 pt-6">
            <p className="text-sm text-gray-500">
              Already have an account?{' '}
              <Link to="/login" className="text-cyan-500 hover:text-cyan-400 font-medium transition-colors">
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
