import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// Mock users for demo
const mockUsers = [
  {
    id: 1,
    username: 'admin',
    email: 'admin@club.local',
    fullName: 'Quản trị hệ thống',
    role: 'ADMIN',
    avatar: null,
  },
  {
    id: 2,
    username: 'manager',
    email: 'manager@club.local',
    fullName: 'Chủ nhiệm CLB',
    role: 'CLUB_MANAGER',
    avatar: null,
  },
  {
    id: 3,
    username: 'student',
    email: 'student@club.local',
    fullName: 'Sinh viên',
    role: 'CLUB_MEMBER',
    avatar: null,
  },
]

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (email, password) => {
        set({ isLoading: true })

        try {
          // Try API first
          const response = await fetch('http://localhost:5001/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: email, password }),
          })

          if (response.ok) {
            const data = await response.json()
            set({
              user: data.user,
              token: data.accessToken,
              isAuthenticated: true,
              isLoading: false,
            })
            return { success: true }
          }
        } catch (error) {
          // API not available, use mock login
          console.log('API not available, using mock login')
        }

        // Mock login for demo
        const mockUser = mockUsers.find(
          (u) => u.email === email || u.username === email
        )

        if (mockUser && password.length >= 6) {
          set({
            user: mockUser,
            token: 'mock-token-' + Date.now(),
            isAuthenticated: true,
            isLoading: false,
          })
          return { success: true }
        }

        set({ isLoading: false })
        return { success: false, error: 'Email hoặc mật khẩu không đúng' }
      },

      logout: () => {
        set({ user: null, token: null, isAuthenticated: false })
      },

      updateUser: (userData) => {
        set((state) => ({
          user: { ...state.user, ...userData },
        }))
      },

      hasPermission: (permission) => {
        const { user } = get()
        if (!user) return false
        if (user.role === 'ADMIN') return true
        return user.permissions?.includes(permission) || false
      },

      hasRole: (role) => {
        const { user } = get()
        if (!user) return false
        return user.role === role
      },
    }),
    {
      name: 'auth-storage',
    }
  )
)
