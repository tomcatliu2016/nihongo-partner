import {
  signInWithPopup,
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendEmailVerification,
  sendPasswordResetEmail,
  onAuthStateChanged,
  type User,
  type Unsubscribe,
} from 'firebase/auth'
import { getFirebaseAuth } from './config'

const googleProvider = new GoogleAuthProvider()

export async function signInWithGoogle(): Promise<User> {
  const auth = getFirebaseAuth()
  const result = await signInWithPopup(auth, googleProvider)
  return result.user
}

export async function signUpWithEmail(
  email: string,
  password: string
): Promise<User> {
  const auth = getFirebaseAuth()
  const result = await createUserWithEmailAndPassword(auth, email, password)
  // Send verification email after registration
  await sendEmailVerification(result.user)
  return result.user
}

export async function signInWithEmail(
  email: string,
  password: string
): Promise<User> {
  const auth = getFirebaseAuth()
  const result = await signInWithEmailAndPassword(auth, email, password)
  return result.user
}

export async function signOut(): Promise<void> {
  const auth = getFirebaseAuth()
  await firebaseSignOut(auth)
}

export async function sendVerificationEmail(): Promise<void> {
  const auth = getFirebaseAuth()
  if (auth.currentUser) {
    await sendEmailVerification(auth.currentUser)
  }
}

export async function resetPassword(email: string): Promise<void> {
  const auth = getFirebaseAuth()
  await sendPasswordResetEmail(auth, email)
}

export function onAuthStateChange(
  callback: (user: User | null) => void
): Unsubscribe {
  const auth = getFirebaseAuth()
  return onAuthStateChanged(auth, callback)
}

export function getCurrentUser(): User | null {
  const auth = getFirebaseAuth()
  return auth.currentUser
}

export type { User }
