// Offline Database utilities using IndexedDB + Dexie.js (per TechStack.md)
import Dexie, { Table } from 'dexie'

// Define the database schema for voter surveys
export interface Survey {
  id?: number
  title: string
  description: string
  questions: Question[]
  createdAt: Date
  updatedAt: Date
  status: 'draft' | 'active' | 'completed'
  constituencyId: string
}

export interface Question {
  id: string
  text: string
  type: 'multiple-choice' | 'text' | 'rating' | 'yes-no'
  options?: string[]
  required: boolean
}

export interface Response {
  id?: number
  surveyId: number
  userId: string
  userName: string
  answers: Record<string, any>
  submittedAt: Date
  synced: number // 0 = false, 1 = true (IndexedDB compatible)
}

// Dexie database class
export class VoterSurveyDB extends Dexie {
  surveys!: Table<Survey>
  responses!: Table<Response>

  constructor() {
    super('VoterSurveyDB')
    
    this.version(1).stores({
      surveys: '++id, title, status, constituencyId, createdAt',
      responses: '++id, surveyId, userId, submittedAt, synced'
    })
  }
}

// Global database instance
export const db = new VoterSurveyDB()

// Initialize offline database
export const initializeOfflineDB = async (): Promise<void> => {
  try {
    await db.open()
    console.log('Offline database initialized successfully')
    
    // Check if we have any existing data
    const surveyCount = await db.surveys.count()
    const responseCount = await db.responses.count()
    
    console.log(`Offline DB status: ${surveyCount} surveys, ${responseCount} responses`)
    
    // If no surveys exist, create a sample survey for testing
    if (surveyCount === 0) {
      await createSampleSurvey()
    }
    
  } catch (error) {
    console.error('Failed to initialize offline database:', error)
  }
}

// Create a sample survey for testing
const createSampleSurvey = async (): Promise<void> => {
  const sampleSurvey: Survey = {
    title: 'Sample Voter Survey',
    description: 'A sample survey to test the TWA functionality',
    questions: [
      {
        id: 'q1',
        text: 'How would you rate the current government performance?',
        type: 'rating',
        required: true
      },
      {
        id: 'q2',
        text: 'Which party do you support?',
        type: 'multiple-choice',
        options: ['Party A', 'Party B', 'Party C', 'Independent'],
        required: true
      },
      {
        id: 'q3',
        text: 'Any additional comments?',
        type: 'text',
        required: false
      }
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
    status: 'active',
    constituencyId: 'sample-constituency'
  }
  
  try {
    await db.surveys.add(sampleSurvey)
    console.log('Sample survey created for testing')
  } catch (error) {
    console.error('Failed to create sample survey:', error)
  }
}

// Database operations
export const surveyOperations = {
  // Get all surveys
  getAll: () => db.surveys.orderBy('createdAt').reverse().toArray(),
  
  // Get survey by ID
  getById: (id: number) => db.surveys.get(id),
  
  // Add new survey
  add: (survey: Omit<Survey, 'id'>) => db.surveys.add(survey),
  
  // Update survey
  update: (id: number, changes: Partial<Survey>) => 
    db.surveys.update(id, { ...changes, updatedAt: new Date() }),
  
  // Delete survey
  delete: (id: number) => db.surveys.delete(id),
  
  // Get surveys by status
  getByStatus: (status: Survey['status']) => 
    db.surveys.where('status').equals(status).toArray()
}

export const responseOperations = {
  // Add new response
  add: (response: Omit<Response, 'id'>) => db.responses.add({
    ...response,
    synced: response.synced || 0
  }),
  
  // Get responses for a survey
  getBySurvey: (surveyId: number) => 
    db.responses.where('surveyId').equals(surveyId).toArray(),
  
  // Get unsynced responses
  getUnsynced: () => db.responses.where('synced').equals(0).toArray(),
  
  // Mark response as synced
  markSynced: (id: number) => db.responses.update(id, { synced: 1 }),
  
  // Get all responses
  getAll: () => db.responses.orderBy('submittedAt').reverse().toArray()
}

// Connection status management
export const isOnline = (): boolean => navigator.onLine

// Sync operations (for when connection is restored)
export const syncOperations = {
  // Sync unsynced responses to server
  syncResponses: async (): Promise<void> => {
    if (!isOnline()) {
      console.log('Cannot sync: offline')
      return
    }
    
    const unsyncedResponses = await responseOperations.getUnsynced()
    
    for (const response of unsyncedResponses) {
      try {
        // TODO: Replace with actual API call using tRPC/REST
        // await api.responses.create(response)
        
        // For now, just mark as synced (demo purposes)
        if (response.id) {
          await responseOperations.markSynced(response.id)
          console.log(`Synced response ${response.id}`)
        }
      } catch (error) {
        console.error(`Failed to sync response ${response.id}:`, error)
      }
    }
  }
}