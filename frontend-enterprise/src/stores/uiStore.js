import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// Apply theme to document
export function applyTheme(theme) {
  const root = document.documentElement

  if (theme === 'system') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    root.setAttribute('data-theme', prefersDark ? 'dark' : 'light')
  } else {
    root.setAttribute('data-theme', theme)
  }
}

export const useUIStore = create(
  persist(
    (set, get) => ({
      // Sidebar state
      sidebarCollapsed: false,
      sidebarMobileOpen: false,

      // Modal state
      activeModal: null,
      modalData: null,

      // Theme state
      theme: 'light', // 'light', 'dark', 'system'

      // Sidebar actions
      toggleSidebar: () => {
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed }))
      },

      toggleMobileSidebar: () => {
        set((state) => ({ sidebarMobileOpen: !state.sidebarMobileOpen }))
      },

      closeMobileSidebar: () => {
        set({ sidebarMobileOpen: false })
      },

      // Modal actions
      openModal: (modalName, data = null) => {
        set({ activeModal: modalName, modalData: data })
      },

      closeModal: () => {
        set({ activeModal: null, modalData: null })
      },

      // Theme actions
      setTheme: (theme) => {
        set({ theme })
        applyTheme(theme)
      },

      toggleTheme: () => {
        const currentTheme = get().theme
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark'
        set({ theme: newTheme })
        applyTheme(newTheme)
      },
    }),
    {
      name: 'ui-storage',
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
        theme: state.theme,
      }),
    }
  )
)

