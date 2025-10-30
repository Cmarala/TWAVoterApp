// Offline Database utilities using IndexedDB + Dexie.js (per TechStack.md)
// Architecture: One app per constituency with separate offline and online databases
import Dexie, { Table } from 'dexie'

// Voter Information Schema - Core entity for constituency management
export interface VoterInfo {
  id?: number
  voterId: string // Unique voter ID (e.g., national ID, voter registration number)
  firstName: string
  lastName: string
  fullName: string // Computed: firstName + lastName
  phoneNumber?: string
  email?: string
  address: {
    street?: string
    ward: string
    district: string
    constituency: string
    pincode?: string
  }
  demographics: {
    age?: number
    gender?: 'male' | 'female' | 'other' | 'prefer-not-to-say'
    occupation?: string
    education?: string
  }
  registrationStatus: 'registered' | 'pending' | 'verified' | 'inactive'
  telegramUserId?: number // Link to Telegram user if registered via TWA
  createdAt: Date
  updatedAt: Date
  synced: number // 0 = false, 1 = true (IndexedDB compatible)
  lastSyncedAt?: Date
}

// Constituency-specific database class
export class ConstituencyVoterDB extends Dexie {
  voterInfo!: Table<VoterInfo>

  constructor(constituencyId: string) {
    // Each constituency gets its own database
    super(`VoterDB_${constituencyId}`)
    
    this.version(1).stores({
      voterInfo: '++id, voterId, firstName, lastName, fullName, phoneNumber, address.ward, address.district, address.constituency, registrationStatus, telegramUserId, createdAt, synced'
    })
    
    // Add hooks for computed fields
    this.voterInfo.hook('creating', function (_primKey, obj, _trans) {
      obj.fullName = `${obj.firstName} ${obj.lastName}`.trim()
      obj.createdAt = new Date()
      obj.updatedAt = new Date()
      obj.synced = 0 // Not synced initially
    })

    this.voterInfo.hook('updating', function (modifications, _primKey, obj, _trans) {
      const mods = modifications as Partial<VoterInfo>
      if (mods.firstName !== undefined || mods.lastName !== undefined) {
        mods.fullName = `${mods.firstName || obj.firstName} ${mods.lastName || obj.lastName}`.trim()
      }
      mods.updatedAt = new Date()
      mods.synced = 0 // Mark as unsynced when updated
    })
  }
}

// Global constituency configuration
let currentConstituency = 'DEFAULT_CONSTITUENCY'

// Set constituency for this app instance
export function setConstituency(constituencyId: string) {
  currentConstituency = constituencyId
  // Reinitialize database for new constituency
  if (db) {
    db.close()
  }
  Object.assign(window, { db: new ConstituencyVoterDB(constituencyId) })
}

// Initialize database with default constituency
export let db = new ConstituencyVoterDB(currentConstituency)

// Initialize offline database
export const initializeOfflineDB = async (): Promise<void> => {
  try {
    await db.open()
    console.log('Offline database initialized successfully')
    
    // Check if we have any existing data
    const voterCount = await db.voterInfo.count()
    
    console.log(`Offline DB status: ${voterCount} voters`)
    
    // If no voters exist, create sample voter data for testing
    if (voterCount === 0) {
      await addSampleVoterData()
    }
    
  } catch (error) {
    console.error('Failed to initialize offline database:', error)
  }
}

// Create sample voter data for testing
const addSampleVoterData = async (): Promise<void> => {
  const sampleVoters: Partial<VoterInfo>[] = [
    {
      voterId: 'VTR001',
      firstName: 'John',
      lastName: 'Doe',
      phoneNumber: '+1234567890',
      email: 'john.doe@example.com',
      address: {
        ward: 'Ward 1',
        district: 'District A',
        constituency: currentConstituency
      },
      demographics: {
        age: 35,
        gender: 'male',
        occupation: 'Engineer'
      },
      registrationStatus: 'verified',
      telegramUserId: 123456789
    },
    {
      voterId: 'VTR002', 
      firstName: 'Jane',
      lastName: 'Smith',
      phoneNumber: '+1234567891',
      email: 'jane.smith@example.com',
      address: {
        ward: 'Ward 2',
        district: 'District B',
        constituency: currentConstituency
      },
      demographics: {
        age: 28,
        gender: 'female',
        occupation: 'Teacher'
      },
      registrationStatus: 'pending',
      telegramUserId: 987654321
    }
  ]
  
  try {
    await db.voterInfo.bulkAdd(sampleVoters as VoterInfo[])
    console.log('Sample voter data added successfully')
  } catch (error) {
    console.error('Failed to add sample voter data:', error)
  }
}

// Voter database operations
export const voterOperations = {
  // Get all voters
  getAll: () => db.voterInfo.orderBy('createdAt').reverse().toArray(),
  
  // Get voter by ID
  getById: (id: number) => db.voterInfo.get(id),
  
  // Get voter by voter ID
  getByVoterId: (voterId: string) => db.voterInfo.where('voterId').equals(voterId).first(),
  
  // Get voter by Telegram user ID
  getByTelegramId: (telegramUserId: number) => 
    db.voterInfo.where('telegramUserId').equals(telegramUserId).first(),
  
  // Add new voter
  add: (voter: Partial<VoterInfo>) => db.voterInfo.add(voter as VoterInfo),
  
  // Update voter
  update: (id: number, changes: Partial<VoterInfo>) => 
    db.voterInfo.update(id, changes),
  
  // Delete voter
  delete: (id: number) => db.voterInfo.delete(id),
  
  // Get voters by status
  getByStatus: (status: VoterInfo['registrationStatus']) => 
    db.voterInfo.where('registrationStatus').equals(status).toArray(),
  
  // Get voters by ward
  getByWard: (ward: string) => 
    db.voterInfo.filter(voter => voter.address.ward === ward).toArray(),
  
  // Get voters by district
  getByDistrict: (district: string) => 
    db.voterInfo.filter(voter => voter.address.district === district).toArray(),
  
  // Search voters by name
  searchByName: (searchTerm: string) => 
    db.voterInfo.filter(voter => 
      voter.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      voter.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      voter.lastName.toLowerCase().includes(searchTerm.toLowerCase())
    ).toArray(),
  
  // Get unsynced voters
  getUnsynced: () => db.voterInfo.where('synced').equals(0).toArray(),
  
  // Mark voter as synced
  markSynced: (id: number) => db.voterInfo.update(id, { synced: 1 }),
  
  // Bulk operations
  bulkAdd: (voters: Partial<VoterInfo>[]) =>
    db.voterInfo.bulkAdd(voters as VoterInfo[])
}

// Connection status management
export const isOnline = (): boolean => navigator.onLine

// Sync operations (for when connection is restored)
export const syncOperations = {
  // Sync unsynced voter data to server
  syncVoters: async (): Promise<void> => {
    if (!isOnline()) {
      console.log('Cannot sync: offline')
      return
    }
    
    const unsyncedVoters = await voterOperations.getUnsynced()
    
    for (const voter of unsyncedVoters) {
      try {
        // TODO: Replace with actual API call
        // await api.voters.upsert(voter)
        
        // For now, just mark as synced (demo purposes)
        if (voter.id) {
          await voterOperations.markSynced(voter.id)
          console.log(`Synced voter ${voter.voterId}`)
        }
      } catch (error) {
        console.error(`Failed to sync voter ${voter.voterId}:`, error)
      }
    }
  }
}