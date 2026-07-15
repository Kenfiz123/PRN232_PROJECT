import { useState } from 'react'
import { motion } from 'framer-motion'
import Modal from '../components/Modal'
import { useToast } from '../context/ToastContext'

const transactionsData = [
  { id: 1, description: 'Tech Symposium Sponsorship', club: 'Coding Club', type: 'income', amount: 5000, date: '2024-12-10', status: 'completed', category: 'Sponsorship' },
  { id: 2, description: 'Equipment Purchase - Laptops', club: 'Robotics Club', type: 'expense', amount: 3500, date: '2024-12-09', status: 'completed', category: 'Equipment' },
  { id: 3, description: 'Winter Concert Tickets', club: 'Music Ensemble', type: 'income', amount: 8500, date: '2024-12-08', status: 'pending', category: 'Tickets' },
  { id: 4, description: 'Venue Rental Fee', club: 'Drama Club', type: 'expense', amount: 2000, date: '2024-12-07', status: 'completed', category: 'Venue' },
  { id: 5, description: 'Membership Dues - Q4', club: 'Chess Club', type: 'income', amount: 850, date: '2024-12-06', status: 'completed', category: 'Membership' },
  { id: 6, description: 'Marketing Materials', club: 'Photography Club', type: 'expense', amount: 450, date: '2024-12-05', status: 'pending', category: 'Marketing' },
  { id: 7, description: 'Event Grant - Annual', club: 'Sports Club', type: 'income', amount: 12000, date: '2024-12-04', status: 'completed', category: 'Grant' },
  { id: 8, description: 'Prize Money Distribution', club: 'Debate Society', type: 'expense', amount: 1500, date: '2024-12-03', status: 'completed', category: 'Prizes' },
  { id: 9, description: 'Photography Workshop', club: 'Photography Club', type: 'income', amount: 2200, date: '2024-12-02', status: 'pending', category: 'Workshop' },
  { id: 10, description: 'Maintenance Supplies', club: 'Environmental Club', type: 'expense', amount: 380, date: '2024-12-01', status: 'completed', category: 'Maintenance' }
]

const budgetAllocation = [
  { name: 'Events & Activities', allocated: 15000, spent: 8750, color: 'cyan' },
  { name: 'Equipment & Supplies', allocated: 12000, spent: 4350, color: 'purple' },
  { name: 'Marketing & Promotion', allocated: 8000, spent: 3200, color: 'pink' },
  { name: 'Venue & Facilities', allocated: 6000, spent: 2100, color: 'green' },
  { name: 'Training & Development', allocated: 5000, spent: 2800, color: 'yellow' }
]

export default function FinancePage() {
  const { success } = useToast()
  const [transactions] = useState(transactionsData)
  const [selectedType, setSelectedType] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [showModal, setShowModal] = useState(false)

  const filteredTransactions = transactions
    .filter(t => selectedType === 'all' || t.type === selectedType)
    .filter(t => t.description.toLowerCase().includes(searchQuery.toLowerCase()) || t.club.toLowerCase().includes(searchQuery.toLowerCase()))

  const totalIncome = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0)
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0)
  const balance = totalIncome - totalExpense

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4"
      >
        <div>
          <h2 className="font-orbitron text-2xl font-bold text-white">Finance Management</h2>
          <p className="text-gray-400 text-sm mt-1">Track income, expenses, and budget allocations</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="cyber-btn cyber-btn-primary flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Add Transaction
        </button>
      </motion.div>

      {/* Financial Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="cyber-card relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 rounded-full blur-2xl" />
          <div className="relative">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-xl bg-green-500/20">
                <svg className="w-6 h-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-400">Total Income</p>
                <p className="font-orbitron text-2xl font-bold text-green-400">${totalIncome.toLocaleString()}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="px-2 py-1 rounded bg-green-500/20 text-green-400">+12.5%</span>
              <span className="text-gray-500">vs last month</span>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="cyber-card relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-full blur-2xl" />
          <div className="relative">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-xl bg-red-500/20">
                <svg className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-400">Total Expenses</p>
                <p className="font-orbitron text-2xl font-bold text-red-400">${totalExpense.toLocaleString()}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="px-2 py-1 rounded bg-red-500/20 text-red-400">+5.2%</span>
              <span className="text-gray-500">vs last month</span>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="cyber-card relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl" />
          <div className="relative">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-xl bg-cyan-500/20">
                <svg className="w-6 h-6 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-400">Current Balance</p>
                <p className="font-orbitron text-2xl font-bold text-cyan-400">${balance.toLocaleString()}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="px-2 py-1 rounded bg-cyan-500/20 text-cyan-400">Healthy</span>
              <span className="text-gray-500">Financial status</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Budget Allocation */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="cyber-card"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-1 h-6 bg-gradient-to-b from-purple-400 to-pink-400 rounded-full" />
            <h3 className="font-orbitron text-lg font-bold text-white">Budget Allocation</h3>
          </div>
          <button className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors">View All</button>
        </div>

        <div className="space-y-6">
          {budgetAllocation.map((item, index) => {
            const percentage = (item.spent / item.allocated) * 100
            return (
              <div key={item.name}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-300">{item.name}</span>
                  <span className="text-sm font-medium">
                    <span className={`text-${item.color}-400`}>${item.spent.toLocaleString()}</span>
                    <span className="text-gray-500"> / ${item.allocated.toLocaleString()}</span>
                  </span>
                </div>
                <div className="h-3 bg-white/5 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ duration: 1, delay: 0.5 + index * 0.1 }}
                    className={`h-full rounded-full bg-gradient-to-r ${
                      item.color === 'cyan' ? 'from-cyan-500 to-cyan-400' :
                      item.color === 'purple' ? 'from-purple-500 to-purple-400' :
                      item.color === 'pink' ? 'from-pink-500 to-pink-400' :
                      item.color === 'green' ? 'from-green-500 to-green-400' :
                      'from-yellow-500 to-yellow-400'
                    }`}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">{percentage.toFixed(0)}% utilized</p>
              </div>
            )
          })}
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between"
      >
        <div className="relative flex-1 max-w-md">
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search transactions..."
            className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/50 transition-all"
          />
        </div>

        <div className="flex gap-2">
          {['all', 'income', 'expense'].map((type) => (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              className={`px-4 py-2 rounded-xl text-sm font-medium capitalize transition-all ${
                selectedType === type
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50'
                  : 'bg-white/5 text-gray-400 border border-white/10 hover:border-white/20'
              }`}
            >
              {type === 'income' ? 'Income' : type === 'expense' ? 'Expense' : 'All'}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Transactions Table */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="cyber-card overflow-hidden p-0"
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="px-6 py-4 text-left text-xs font-orbitron font-semibold text-gray-400 uppercase tracking-wider">Description</th>
                <th className="px-6 py-4 text-left text-xs font-orbitron font-semibold text-gray-400 uppercase tracking-wider">Club</th>
                <th className="px-6 py-4 text-left text-xs font-orbitron font-semibold text-gray-400 uppercase tracking-wider">Category</th>
                <th className="px-6 py-4 text-left text-xs font-orbitron font-semibold text-gray-400 uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 text-left text-xs font-orbitron font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-right text-xs font-orbitron font-semibold text-gray-400 uppercase tracking-wider">Amount</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.map((transaction, index) => (
                <motion.tr
                  key={transaction.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className="border-b border-white/5 hover:bg-white/5 transition-colors group"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        transaction.type === 'income' ? 'bg-green-500/20' : 'bg-red-500/20'
                      }`}>
                        {transaction.type === 'income' ? (
                          <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                          </svg>
                        )}
                      </div>
                      <span className="font-medium text-white group-hover:text-cyan-400 transition-colors">{transaction.description}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-400">{transaction.club}</td>
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 rounded-lg text-xs font-medium bg-white/5 text-gray-300">
                      {transaction.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-400">{transaction.date}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium ${
                      transaction.status === 'completed'
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        transaction.status === 'completed' ? 'bg-green-400' : 'bg-yellow-400'
                      }`} />
                      {transaction.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className={`font-bold ${
                      transaction.type === 'income' ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {transaction.type === 'income' ? '+' : '-'}${transaction.amount.toLocaleString()}
                    </span>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredTransactions.length === 0 && (
          <div className="text-center py-16">
            <p className="text-gray-500">No transactions found</p>
          </div>
        )}
      </motion.div>

      {/* Add Transaction Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Add New Transaction">
        <form className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-2">Description</label>
            <input type="text" className="cyber-input" placeholder="Enter description" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Club</label>
              <select className="cyber-input">
                <option>Select club</option>
                <option>Coding Club</option>
                <option>Robotics Club</option>
                <option>Music Ensemble</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Type</label>
              <select className="cyber-input">
                <option value="income">Income</option>
                <option value="expense">Expense</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Amount</label>
              <input type="number" className="cyber-input" placeholder="0.00" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Category</label>
              <select className="cyber-input">
                <option>Select category</option>
                <option>Sponsorship</option>
                <option>Equipment</option>
                <option>Membership</option>
                <option>Grant</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-2">Date</label>
            <input type="date" className="cyber-input" />
          </div>
          <div className="flex gap-3 pt-4">
            <button type="button" onClick={() => setShowModal(false)} className="flex-1 cyber-btn">Cancel</button>
            <button type="button" onClick={() => { success('Transaction added successfully'); setShowModal(false) }} className="flex-1 cyber-btn cyber-btn-primary">Add Transaction</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
