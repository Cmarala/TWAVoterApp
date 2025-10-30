// Zustand store for global app state (per TechStack.md)
import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { getTelegramUser } from '../utils/telegram'
import { surveyOperations, responseOperations, type Survey, type Response } from '../utils/offlineDB'

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
  
  // Survey data
  surveys: Survey[]
  responses: Response[]
  
  // UI state
  loading: boolean
  greetingCount: number
  
  // Actions
  setOnlineStatus: (status: boolean) => void
  initializeApp: () => Promise<void>
  loadSurveys: () => Promise<void>
  loadResponses: () => Promise<void>
  showGreeting: () => void
  addSurvey: (survey: Omit<Survey, 'id'>) => Promise<void>
  addResponse: (response: Omit<Response, 'id'>) => Promise<void>
}

export const useAppStore = create<AppState>()(
  devtools(
    (set, get) => ({
      // Initial state
      isOnline: navigator.onLine,
      user: null,
      surveys: [],
      responses: [],
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
          await get().loadSurveys()
          await get().loadResponses()
          
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

      loadSurveys: async () => {
        try {
          const surveys = await surveyOperations.getAll()
          set({ surveys })
          console.log(`Loaded ${surveys.length} surveys from offline DB`)
        } catch (error) {
          console.error('Failed to load surveys:', error)
        }
      },

      loadResponses: async () => {
        try {
          const responses = await responseOperations.getAll()
          set({ responses })
          console.log(`Loaded ${responses.length} responses from offline DB`)
        } catch (error) {
          console.error('Failed to load responses:', error)
        }
      },

      showGreeting: () => {
        set(state => ({ 
          greetingCount: state.greetingCount + 1 
        }))
      },

      addSurvey: async (survey: Omit<Survey, 'id'>) => {
        try {
          await surveyOperations.add(survey)
          await get().loadSurveys()
          console.log('Survey added successfully')
        } catch (error) {
          console.error('Failed to add survey:', error)
        }
      },

      addResponse: async (response: Omit<Response, 'id'>) => {
        try {
          await responseOperations.add(response)
          await get().loadResponses()
          console.log('Response added successfully')
        } catch (error) {
          console.error('Failed to add response:', error)
        }
      }
    }),
    {
      name: 'twa-voter-app-store'
    }
  )
)