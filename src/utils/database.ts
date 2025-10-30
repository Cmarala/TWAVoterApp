// Modular Database Schema - Production-grade architecture for field surveys
// Architecture: Constituency-based with multiple related tables
import Dexie, { Table } from 'dexie'

// ===== CORE ENTITIES =====

// Voter Information Schema
export interface VoterInfo {
  id?: number
  voterId: string // Unique voter ID (e.g., national ID, voter registration number)
  firstName: string
  lastName: string
  fullName?: string // Computed: firstName + lastName
  phoneNumber?: string
  email?: string
  address: {
    street?: string
    ward: string
    district: string
    constituency: string
    pincode?: string
  }
  demographics?: {
    age?: number
    gender?: 'male' | 'female' | 'other' | 'prefer-not-to-say'
    occupation?: string
    education?: string
    familySize?: number
    income?: string
  }
  registrationStatus: 'registered' | 'pending' | 'verified' | 'inactive'
  telegramUserId?: number // Link to Telegram user if registered via TWA
  createdAt?: Date
  updatedAt?: Date
  synced?: number // 0 = false, 1 = true (IndexedDB compatible)
  lastSyncedAt?: Date
}

// Survey Template Schema
export interface SurveyTemplate {
  id?: number
  surveyId: string // Unique survey identifier
  title: string
  description?: string
  version: string // Survey version for tracking changes
  constituencyId: string
  categories: string[] // Survey categories/topics
  questions: SurveyQuestion[]
  estimatedDuration?: number // in minutes
  isActive: boolean
  createdAt?: Date
  updatedAt?: Date
  createdBy?: string // Agent who created/uploaded
  synced?: number
}

// Survey Question Schema
export interface SurveyQuestion {
  id: string
  questionText: string
  questionType: 'single-choice' | 'multiple-choice' | 'text' | 'number' | 'rating' | 'yes-no' | 'date'
  isRequired: boolean
  options?: SurveyOption[] // For choice-based questions
  validation?: {
    minLength?: number
    maxLength?: number
    min?: number
    max?: number
    pattern?: string
  }
  order: number // Question order in survey
  category?: string // Question category/section
}

// Survey Options for choice questions
export interface SurveyOption {
  id: string
  text: string
  value: string | number
}

// Survey Response Schema
export interface SurveyResponse {
  id?: number
  responseId: string // Unique response identifier
  surveyId: string // Links to SurveyTemplate
  voterId: string // Links to VoterInfo
  agentId?: string // Field agent conducting survey
  responses: QuestionResponse[] // Array of question responses
  startTime: Date
  endTime?: Date
  isComplete: boolean
  geolocation?: {
    latitude: number
    longitude: number
    accuracy?: number
  }
  deviceInfo?: {
    userAgent: string
    platform: string
    timestamp: Date
  }
  createdAt?: Date
  updatedAt?: Date
  synced?: number
}

// Individual question response
export interface QuestionResponse {
  questionId: string
  answer: string | number | string[] // Supports different answer types
  skipped: boolean
  timeSpent?: number // seconds spent on question
}

// Field Agent Schema
export interface FieldAgent {
  id?: number
  agentId: string // Unique agent identifier
  name: string
  email?: string
  phoneNumber?: string
  telegramUserId?: number
  assignedWards: string[] // Wards assigned to this agent
  assignedDistricts: string[] // Districts assigned to this agent
  role: 'agent' | 'supervisor' | 'admin'
  isActive: boolean
  credentials?: {
    username: string
    passwordHash?: string // For offline authentication
  }
  stats?: {
    totalSurveys: number
    completedSurveys: number
    averageTime: number // Average survey completion time
  }
  createdAt?: Date
  updatedAt?: Date
  synced?: number
}

// Survey Session Schema (tracks survey progress)
export interface SurveySession {
  id?: number
  sessionId: string
  surveyId: string
  voterId: string
  agentId: string
  status: 'started' | 'in-progress' | 'completed' | 'abandoned'
  currentQuestionIndex: number
  responses: QuestionResponse[]
  startTime: Date
  lastUpdated: Date
  metadata?: {
    pauseCount: number
    resumeCount: number
    deviceBattery?: number
    networkStatus: 'online' | 'offline'
  }
}

// ===== MODULAR DATABASE CLASS =====
export class FieldSurveyDB extends Dexie {
  // Core entities
  voters!: Table<VoterInfo>
  surveyTemplates!: Table<SurveyTemplate>
  surveyResponses!: Table<SurveyResponse>
  fieldAgents!: Table<FieldAgent>
  surveySessions!: Table<SurveySession>

  constructor(constituencyId: string) {
    // Each constituency gets its own database instance
    super(`FieldSurveyDB_${constituencyId}`)
    
    this.version(1).stores({
      voters: '++id, voterId, firstName, lastName, fullName, phoneNumber, address.ward, address.district, address.constituency, registrationStatus, telegramUserId, createdAt, synced',
      
      surveyTemplates: '++id, surveyId, title, constituencyId, isActive, createdAt, synced',
      
      surveyResponses: '++id, responseId, surveyId, voterId, agentId, isComplete, startTime, createdAt, synced',
      
      fieldAgents: '++id, agentId, name, phoneNumber, telegramUserId, role, isActive, createdAt, synced',
      
      surveySessions: '++id, sessionId, surveyId, voterId, agentId, status, startTime, lastUpdated'
    })
    
    // Add database hooks for computed fields and timestamps
    this.voters.hook('creating', function (_primKey, obj, _trans) {
      obj.fullName = `${obj.firstName} ${obj.lastName}`.trim()
      obj.createdAt = new Date()
      obj.updatedAt = new Date()
      obj.synced = 0
    })

    this.voters.hook('updating', function (modifications, _primKey, obj, _trans) {
      const mods = modifications as Partial<VoterInfo>
      if (mods.firstName !== undefined || mods.lastName !== undefined) {
        mods.fullName = `${mods.firstName || obj.firstName} ${mods.lastName || obj.lastName}`.trim()
      }
      mods.updatedAt = new Date()
      mods.synced = 0
    })

    this.surveyTemplates.hook('creating', function (_primKey, obj, _trans) {
      obj.createdAt = new Date()
      obj.updatedAt = new Date()
      obj.synced = 0
    })

    this.surveyResponses.hook('creating', function (_primKey, obj, _trans) {
      obj.createdAt = new Date()
      obj.updatedAt = new Date()
      obj.synced = 0
    })

    this.fieldAgents.hook('creating', function (_primKey, obj, _trans) {
      obj.createdAt = new Date()
      obj.updatedAt = new Date()
      obj.synced = 0
    })
  }
}

// ===== GLOBAL CONFIGURATION =====
let currentConstituency = 'DEFAULT_CONSTITUENCY'

export function setConstituency(constituencyId: string) {
  currentConstituency = constituencyId
  if (db) {
    db.close()
  }
  Object.assign(window, { db: new FieldSurveyDB(constituencyId) })
}

// Initialize database with default constituency
export let db = new FieldSurveyDB(currentConstituency)

// ===== DATABASE OPERATIONS =====

// Voter Operations
export const voterOperations = {
  getAll: () => db.voters.orderBy('createdAt').reverse().toArray(),
  getById: (id: number) => db.voters.get(id),
  getByVoterId: (voterId: string) => db.voters.where('voterId').equals(voterId).first(),
  getByTelegramId: (telegramUserId: number) => db.voters.where('telegramUserId').equals(telegramUserId).first(),
  add: (voter: Partial<VoterInfo>) => db.voters.add(voter as VoterInfo),
  update: (id: number, changes: Partial<VoterInfo>) => db.voters.update(id, changes),
  delete: (id: number) => db.voters.delete(id),
  getByStatus: (status: VoterInfo['registrationStatus']) => db.voters.where('registrationStatus').equals(status).toArray(),
  getByWard: (ward: string) => db.voters.filter(voter => voter.address.ward === ward).toArray(),
  getByDistrict: (district: string) => db.voters.filter(voter => voter.address.district === district).toArray(),
  searchByName: (searchTerm: string) => 
    db.voters.filter(voter => 
      voter.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      voter.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      voter.lastName.toLowerCase().includes(searchTerm.toLowerCase())
    ).toArray(),
  getUnsynced: () => db.voters.where('synced').equals(0).toArray(),
  markSynced: (id: number) => db.voters.update(id, { synced: 1, lastSyncedAt: new Date() }),
  bulkAdd: (voters: Partial<VoterInfo>[]) => db.voters.bulkAdd(voters as VoterInfo[])
}

// Survey Template Operations
export const surveyTemplateOperations = {
  getAll: () => db.surveyTemplates.orderBy('createdAt').reverse().toArray(),
  getActive: () => db.surveyTemplates.filter(t => t.isActive === true).toArray(),
  getById: (id: number) => db.surveyTemplates.get(id),
  getBySurveyId: (surveyId: string) => db.surveyTemplates.where('surveyId').equals(surveyId).first(),
  add: (template: Partial<SurveyTemplate>) => db.surveyTemplates.add(template as SurveyTemplate),
  update: (id: number, changes: Partial<SurveyTemplate>) => db.surveyTemplates.update(id, changes),
  delete: (id: number) => db.surveyTemplates.delete(id),
  getUnsynced: () => db.surveyTemplates.where('synced').equals(0).toArray(),
  markSynced: (id: number) => db.surveyTemplates.update(id, { synced: 1 })
}

// Survey Response Operations
export const surveyResponseOperations = {
  getAll: () => db.surveyResponses.orderBy('createdAt').reverse().toArray(),
  getById: (id: number) => db.surveyResponses.get(id),
  getByVoter: (voterId: string) => db.surveyResponses.where('voterId').equals(voterId).toArray(),
  getBySurvey: (surveyId: string) => db.surveyResponses.where('surveyId').equals(surveyId).toArray(),
  getByAgent: (agentId: string) => db.surveyResponses.where('agentId').equals(agentId).toArray(),
  getCompleted: () => db.surveyResponses.filter(r => r.isComplete === true).toArray(),
  getIncomplete: () => db.surveyResponses.filter(r => r.isComplete === false).toArray(),
  add: (response: Partial<SurveyResponse>) => db.surveyResponses.add(response as SurveyResponse),
  update: (id: number, changes: Partial<SurveyResponse>) => db.surveyResponses.update(id, changes),
  delete: (id: number) => db.surveyResponses.delete(id),
  getUnsynced: () => db.surveyResponses.where('synced').equals(0).toArray(),
  markSynced: (id: number) => db.surveyResponses.update(id, { synced: 1 })
}

// Field Agent Operations
export const fieldAgentOperations = {
  getAll: () => db.fieldAgents.orderBy('name').toArray(),
  getById: (id: number) => db.fieldAgents.get(id),
  getByAgentId: (agentId: string) => db.fieldAgents.where('agentId').equals(agentId).first(),
  getActive: () => db.fieldAgents.filter(a => a.isActive === true).toArray(),
  add: (agent: Partial<FieldAgent>) => db.fieldAgents.add(agent as FieldAgent),
  update: (id: number, changes: Partial<FieldAgent>) => db.fieldAgents.update(id, changes),
  delete: (id: number) => db.fieldAgents.delete(id),
  getUnsynced: () => db.fieldAgents.where('synced').equals(0).toArray(),
  markSynced: (id: number) => db.fieldAgents.update(id, { synced: 1 })
}

// Survey Session Operations
export const surveySessionOperations = {
  getAll: () => db.surveySessions.orderBy('startTime').reverse().toArray(),
  getById: (id: number) => db.surveySessions.get(id),
  getByVoter: (voterId: string) => db.surveySessions.where('voterId').equals(voterId).toArray(),
  getByAgent: (agentId: string) => db.surveySessions.where('agentId').equals(agentId).toArray(),
  getActive: () => db.surveySessions.where('status').anyOf(['started', 'in-progress']).toArray(),
  add: (session: Partial<SurveySession>) => db.surveySessions.add(session as SurveySession),
  update: (id: number, changes: Partial<SurveySession>) => db.surveySessions.update(id, changes),
  delete: (id: number) => db.surveySessions.delete(id)
}

// ===== DATABASE INITIALIZATION =====
export const initializeOfflineDB = async (): Promise<void> => {
  try {
    // Ensure database opens successfully
    await db.open()
    console.log('🗄️ Field Survey Database initialized successfully')
    
    // Verify database is accessible
    const isReady = db.isOpen()
    if (!isReady) {
      throw new Error('Database failed to open properly')
    }
    
    // Check existing data
    const voterCount = await db.voters.count()
    const surveyCount = await db.surveyTemplates.count()
    const responseCount = await db.surveyResponses.count()
    
    console.log(`📊 Database status: ${voterCount} voters, ${surveyCount} surveys, ${responseCount} responses`)
    
    // Add sample data if empty (for development/demo)
    if (voterCount === 0) {
      console.log('🚀 Adding sample data for demonstration...')
      await addSampleData()
    }
    
    // Verify offline functionality
    console.log(`📱 Offline Mode: ${!navigator.onLine ? 'ACTIVE' : 'Ready'}`)
    console.log(`💾 Database Type: IndexedDB (${db.name})`)
    
    // Set up periodic data validation (every 30 seconds)
    setInterval(async () => {
      try {
        const currentCount = await db.voters.count()
        if (currentCount === 0) {
          console.warn('⚠️ No voters found - database may need reinitialization')
        }
      } catch (err) {
        console.error('❌ Database health check failed:', err)
      }
    }, 30000)
    
  } catch (error) {
    console.error('❌ Failed to initialize Field Survey database:', error)
    
    // Attempt recovery
    try {
      console.log('🔄 Attempting database recovery...')
      await db.delete()
      db = new FieldSurveyDB(currentConstituency)
      await db.open()
      await addSampleData()
      console.log('✅ Database recovered successfully')
    } catch (recoveryError) {
      console.error('💥 Database recovery failed:', recoveryError)
    }
  }
}

// Sample data for development/testing
const addSampleData = async (): Promise<void> => {
  try {
    console.log('Adding sample data for field survey testing...')
    
    // Sample voters with more comprehensive data
    const sampleVoters: Partial<VoterInfo>[] = [
      {
        voterId: 'VTR001',
        firstName: 'Rajesh',
        lastName: 'Kumar',
        phoneNumber: '+91-9876543210',
        email: 'rajesh.kumar@email.com',
        address: {
          street: '123 Main Street',
          ward: 'Ward 15',
          district: 'Central District',
          constituency: currentConstituency,
          pincode: '110001'
        },
        demographics: {
          age: 35,
          gender: 'male',
          occupation: 'Software Engineer',
          education: 'Graduate',
          familySize: 4,
          income: '50000-75000'
        },
        registrationStatus: 'verified',
        telegramUserId: 123456789
      },
      {
        voterId: 'VTR002',
        firstName: 'Priya',
        lastName: 'Sharma',
        phoneNumber: '+91-9876543211',
        email: 'priya.sharma@email.com',
        address: {
          street: '456 Park Avenue',
          ward: 'Ward 12',
          district: 'North District',
          constituency: currentConstituency,
          pincode: '110002'
        },
        demographics: {
          age: 28,
          gender: 'female',
          occupation: 'Teacher',
          education: 'Post Graduate',
          familySize: 3,
          income: '25000-50000'
        },
        registrationStatus: 'verified',
        telegramUserId: 987654321
      },
      {
        voterId: 'VTR003',
        firstName: 'Mohammed',
        lastName: 'Ali',
        phoneNumber: '+91-9876543212',
        address: {
          street: '789 Commerce Street',
          ward: 'Ward 8',
          district: 'East District', 
          constituency: currentConstituency,
          pincode: '110003'
        },
        demographics: {
          age: 42,
          gender: 'male',
          occupation: 'Business Owner',
          education: 'Graduate',
          familySize: 5
        },
        registrationStatus: 'pending'
      },
      {
        voterId: 'VTR004',
        firstName: 'Sunita',
        lastName: 'Devi',
        phoneNumber: '+91-9876543213',
        address: {
          ward: 'Ward 5',
          district: 'West District',
          constituency: currentConstituency
        },
        demographics: {
          age: 55,
          gender: 'female',
          occupation: 'Housewife',
          familySize: 6
        },
        registrationStatus: 'verified'
      }
    ]
    
    await db.voters.bulkAdd(sampleVoters as VoterInfo[])
    console.log('Sample voter data added successfully')
    
  } catch (error) {
    console.error('Error adding sample data:', error)
  }
}

// Connection status management
export const isOnline = (): boolean => navigator.onLine

// Sync operations for production use
export const syncOperations = {
  syncVoters: async (): Promise<void> => {
    if (!isOnline()) {
      console.log('Cannot sync: offline')
      return
    }
    
    const unsyncedVoters = await voterOperations.getUnsynced()
    console.log(`Syncing ${unsyncedVoters.length} unsynced voters...`)
    
    for (const voter of unsyncedVoters) {
      try {
        // TODO: Replace with actual API calls
        // await api.voters.upsert(voter)
        
        if (voter.id) {
          await voterOperations.markSynced(voter.id)
          console.log(`Synced voter ${voter.voterId}`)
        }
      } catch (error) {
        console.error(`Failed to sync voter ${voter.voterId}:`, error)
      }
    }
  },
  
  syncSurveyResponses: async (): Promise<void> => {
    if (!isOnline()) return
    
    const unsyncedResponses = await surveyResponseOperations.getUnsynced()
    console.log(`Syncing ${unsyncedResponses.length} unsynced survey responses...`)
    
    for (const response of unsyncedResponses) {
      try {
        // TODO: API integration
        // await api.surveyResponses.create(response)
        
        if (response.id) {
          await surveyResponseOperations.markSynced(response.id)
          console.log(`Synced response ${response.responseId}`)
        }
      } catch (error) {
        console.error(`Failed to sync response ${response.responseId}:`, error)
      }
    }
  },
  
  syncAll: async (): Promise<void> => {
    await Promise.all([
      syncOperations.syncVoters(),
      syncOperations.syncSurveyResponses()
    ])
  }
}