// Zustand store for global app state (per TechStack.md)
import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { getTelegramUser } from '../utils/telegram'
import { voterOperations, type VoterInfo } from '../utils/offlineDB'

interface TelegramUser {
  id: number
  first_name: string
  last_name?: string
  username?: string
  photo_url?: string
}

interface AppState {
  // Connection state
  isOnline: boolean
  
  // User state
  user: TelegramUser | null
  currentVoter: VoterInfo | null
  
  // Voter data
  voters: VoterInfo[]
  
  // UI state
  loading: boolean
  greetingCount: number
  
  // Actions
  setOnlineStatus: (status: boolean) => void
  initializeApp: () => Promise<void>
  loadVoters: () => Promise<void>
  showGreeting: () => void
  addVoter: (voter: Partial<VoterInfo>) => Promise<void>
  updateVoter: (id: number, changes: Partial<VoterInfo>) => Promise<void>
  getCurrentVoterByTelegram: () => Promise<void>
}

export const useAppStore = create<AppState>()(
  devtools(
    (set, get) => ({
      // Initial state
      isOnline: navigator.onLine,
      user: null,
      currentVoter: null,
      voters: [],
      loading: false,
      greetingCount: 0,

      // Actions
      setOnlineStatus: (status: boolean) => {
        set({ isOnline: status })
        
        if (status) {
          console.log('Connection restored - syncing data...')
          // TODO: Implement sync logic with tRPC/REST API
        }
      },

      initializeApp: async () => {
        set({ loading: true })
        
        try {
          // Get Telegram user info
          const telegramUser = getTelegramUser()
          if (telegramUser) {
            set({ user: telegramUser })
          }
          
          // Load offline data
          await get().loadVoters()
          await get().getCurrentVoterByTelegram()
          
          // Set up online/offline listeners
          const handleOnline = () => get().setOnlineStatus(true)
          const handleOffline = () => get().setOnlineStatus(false)
          
          window.addEventListener('online', handleOnline)
          window.addEventListener('offline', handleOffline)
          
          console.log('App initialized successfully')
          
        } catch (error) {
          console.error('Failed to initialize app:', error)
        } finally {
          set({ loading: false })
        }
      },

      loadVoters: async () => {
        try {
          const voters = await voterOperations.getAll()
          set({ voters })
          console.log(`Loaded ${voters.length} voters from offline DB`)
        } catch (error) {
          console.error('Failed to load voters:', error)
        }
      },

      getCurrentVoterByTelegram: async () => {
        try {
          const { user } = get()
          if (user?.id) {
            const currentVoter = await voterOperations.getByTelegramId(user.id)
            set({ currentVoter })
            console.log('Current voter loaded:', currentVoter)
          }
        } catch (error) {
          console.error('Failed to get current voter:', error)
        }
      },

      showGreeting: () => {
        set(state => ({ 
          greetingCount: state.greetingCount + 1 
        }))
      },

      addVoter: async (voter: Partial<VoterInfo>) => {
        try {
          await voterOperations.add(voter)
          await get().loadVoters()
          console.log('Voter added successfully')
        } catch (error) {
          console.error('Failed to add voter:', error)
        }
      },

      updateVoter: async (id: number, changes: Partial<VoterInfo>) => {
        try {
          await voterOperations.update(id, changes)
          await get().loadVoters()
          
          // Update current voter if it's the same one
          const { currentVoter } = get()
          if (currentVoter?.id === id) {
            await get().getCurrentVoterByTelegram()
          }
          console.log('Voter updated successfully')
        } catch (error) {
          console.error('Failed to update voter:', error)
        }
      }
    }),
    {
      name: 'twa-voter-app-store'
    }
  )
)