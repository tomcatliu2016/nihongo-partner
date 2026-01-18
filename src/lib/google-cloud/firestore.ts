import { initializeApp, getApps, cert } from 'firebase-admin/app'
import type { Firestore} from 'firebase-admin/firestore';
import { getFirestore, Timestamp } from 'firebase-admin/firestore'

let db: Firestore | null = null

function isFirestoreConfigured(): boolean {
  return !!(
    process.env.FIREBASE_CLIENT_EMAIL &&
    process.env.FIREBASE_PRIVATE_KEY &&
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
  )
}

function getDB(): Firestore | null {
  if (!isFirestoreConfigured()) {
    console.warn('Firestore not configured: missing FIREBASE_CLIENT_EMAIL or FIREBASE_PRIVATE_KEY')
    return null
  }

  if (!db) {
    if (getApps().length === 0) {
      const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')

      initializeApp({
        credential: cert({
          projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey,
        }),
      })
    }
    db = getFirestore()
  }
  return db
}

// ============================================
// User Operations
// ============================================

export interface UserData {
  id: string
  email: string
  displayName: string | null
  photoURL: string | null
  jlptLevel: number
  totalPracticeTime: number
  sessionsCompleted: number
  createdAt: Date
  updatedAt: Date
}

export async function createUser(
  userId: string,
  data: Omit<UserData, 'id' | 'createdAt' | 'updatedAt'>
): Promise<UserData | null> {
  const db = getDB()
  if (!db) return null

  const now = new Date()

  const userData: UserData = {
    ...data,
    id: userId,
    createdAt: now,
    updatedAt: now,
  }

  await db.collection('users').doc(userId).set({
    ...userData,
    createdAt: Timestamp.fromDate(now),
    updatedAt: Timestamp.fromDate(now),
  })

  return userData
}

export async function getUser(userId: string): Promise<UserData | null> {
  const db = getDB()
  if (!db) return null

  const doc = await db.collection('users').doc(userId).get()

  if (!doc.exists) {
    return null
  }

  const data = doc.data()!
  return {
    ...data,
    id: doc.id,
    createdAt: data.createdAt?.toDate() || new Date(),
    updatedAt: data.updatedAt?.toDate() || new Date(),
  } as UserData
}

export async function updateUser(
  userId: string,
  data: Partial<Omit<UserData, 'id' | 'createdAt'>>
): Promise<void> {
  const db = getDB()
  if (!db) return

  await db
    .collection('users')
    .doc(userId)
    .update({
      ...data,
      updatedAt: Timestamp.now(),
    })
}

// ============================================
// Conversation Operations
// ============================================

export interface ConversationSession {
  id: string
  userId: string
  scenario: string
  difficulty: number
  messages: Array<{
    role: 'user' | 'assistant'
    content: string
    timestamp: Date
  }>
  status: 'active' | 'completed' | 'abandoned'
  startedAt: Date
  endedAt: Date | null
}

export async function createConversation(
  data: Omit<ConversationSession, 'id' | 'startedAt' | 'endedAt'>
): Promise<ConversationSession | null> {
  const db = getDB()
  if (!db) return null

  const now = new Date()

  const docRef = db.collection('conversations').doc()
  const sessionData: ConversationSession = {
    ...data,
    id: docRef.id,
    startedAt: now,
    endedAt: null,
  }

  await docRef.set({
    ...sessionData,
    messages: data.messages.map((msg) => ({
      ...msg,
      timestamp: Timestamp.fromDate(msg.timestamp),
    })),
    startedAt: Timestamp.fromDate(now),
    endedAt: null,
  })

  return sessionData
}

export async function getConversation(
  sessionId: string
): Promise<ConversationSession | null> {
  const db = getDB()
  if (!db) return null

  const doc = await db.collection('conversations').doc(sessionId).get()

  if (!doc.exists) {
    return null
  }

  const data = doc.data()!
  return {
    ...data,
    id: doc.id,
    messages: data.messages?.map((msg: { role: string; content: string; timestamp: { toDate: () => Date } }) => ({
      ...msg,
      timestamp: msg.timestamp?.toDate() || new Date(),
    })) || [],
    startedAt: data.startedAt?.toDate() || new Date(),
    endedAt: data.endedAt?.toDate() || null,
  } as ConversationSession
}

export async function updateConversation(
  sessionId: string,
  data: Partial<Omit<ConversationSession, 'id' | 'startedAt'>>
): Promise<void> {
  const db = getDB()
  if (!db) return

  const updateData: Record<string, unknown> = { ...data }

  if (data.messages) {
    updateData.messages = data.messages.map((msg) => ({
      ...msg,
      timestamp: Timestamp.fromDate(msg.timestamp),
    }))
  }

  if (data.endedAt) {
    updateData.endedAt = Timestamp.fromDate(data.endedAt)
  }

  await db.collection('conversations').doc(sessionId).update(updateData)
}

export async function getUserConversations(
  userId: string,
  limit = 10
): Promise<ConversationSession[]> {
  const db = getDB()
  if (!db) return []

  const snapshot = await db
    .collection('conversations')
    .where('userId', '==', userId)
    .orderBy('startedAt', 'desc')
    .limit(limit)
    .get()

  return snapshot.docs.map((doc) => {
    const data = doc.data()
    return {
      ...data,
      id: doc.id,
      messages: data.messages?.map((msg: { role: string; content: string; timestamp: { toDate: () => Date } }) => ({
        ...msg,
        timestamp: msg.timestamp?.toDate() || new Date(),
      })) || [],
      startedAt: data.startedAt?.toDate() || new Date(),
      endedAt: data.endedAt?.toDate() || null,
    } as ConversationSession
  })
}

// ============================================
// Analysis Operations
// ============================================

export interface AnalysisReport {
  id: string
  userId: string
  conversationId: string
  score: number
  errors: Array<{
    type: string
    original: string
    correction: string
    explanation: string
  }>
  suggestions: string[]
  createdAt: Date
}

export async function createAnalysis(
  data: Omit<AnalysisReport, 'id' | 'createdAt'>
): Promise<AnalysisReport | null> {
  const db = getDB()
  if (!db) return null

  const now = new Date()

  const docRef = db.collection('analysis').doc()
  const analysisData: AnalysisReport = {
    ...data,
    id: docRef.id,
    createdAt: now,
  }

  await docRef.set({
    ...analysisData,
    createdAt: Timestamp.fromDate(now),
  })

  return analysisData
}

export async function getAnalysis(
  analysisId: string
): Promise<AnalysisReport | null> {
  const db = getDB()
  if (!db) return null

  const doc = await db.collection('analysis').doc(analysisId).get()

  if (!doc.exists) {
    return null
  }

  const data = doc.data()!
  return {
    ...data,
    id: doc.id,
    createdAt: data.createdAt?.toDate() || new Date(),
  } as AnalysisReport
}

export async function getUserAnalyses(
  userId: string,
  limit = 10
): Promise<AnalysisReport[]> {
  const db = getDB()
  if (!db) return []

  const snapshot = await db
    .collection('analysis')
    .where('userId', '==', userId)
    .orderBy('createdAt', 'desc')
    .limit(limit)
    .get()

  return snapshot.docs.map((doc) => {
    const data = doc.data()
    return {
      ...data,
      id: doc.id,
      createdAt: data.createdAt?.toDate() || new Date(),
    } as AnalysisReport
  })
}

// ============================================
// Material Operations
// ============================================

export interface LearningMaterial {
  id: string
  userId: string
  analysisId: string
  errorType: string
  grammarPoint: string
  explanation: string
  examples: string[]
  exercises: Array<{
    question: string
    options: string[]
    correctIndex: number
  }>
  createdAt: Date
}

export async function createMaterial(
  data: Omit<LearningMaterial, 'id' | 'createdAt'>
): Promise<LearningMaterial | null> {
  const db = getDB()
  if (!db) return null

  const now = new Date()

  const docRef = db.collection('materials').doc()
  const materialData: LearningMaterial = {
    ...data,
    id: docRef.id,
    createdAt: now,
  }

  await docRef.set({
    ...materialData,
    createdAt: Timestamp.fromDate(now),
  })

  return materialData
}

export async function getMaterial(
  materialId: string
): Promise<LearningMaterial | null> {
  const db = getDB()
  if (!db) return null

  const doc = await db.collection('materials').doc(materialId).get()

  if (!doc.exists) {
    return null
  }

  const data = doc.data()!
  return {
    ...data,
    id: doc.id,
    createdAt: data.createdAt?.toDate() || new Date(),
  } as LearningMaterial
}

export async function getUserMaterials(
  userId: string,
  limit = 20
): Promise<LearningMaterial[]> {
  const db = getDB()
  if (!db) return []

  const snapshot = await db
    .collection('materials')
    .where('userId', '==', userId)
    .orderBy('createdAt', 'desc')
    .limit(limit)
    .get()

  return snapshot.docs.map((doc) => {
    const data = doc.data()
    return {
      ...data,
      id: doc.id,
      createdAt: data.createdAt?.toDate() || new Date(),
    } as LearningMaterial
  })
}
