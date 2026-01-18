'use client'

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import { onAuthStateChange, type User } from '@/lib/firebase'
import { useUserStore } from '@/stores/user-store'

interface AuthContextType {
  user: User | null
  loading: boolean
  isEmailVerified: boolean
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isEmailVerified: false,
})

export function useAuth() {
  return useContext(AuthContext)
}

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const { setUser: setStoreUser, setLoading: setStoreLoading } = useUserStore()

  useEffect(() => {
    const unsubscribe = onAuthStateChange((firebaseUser) => {
      setUser(firebaseUser)
      setLoading(false)
      setStoreLoading(false)

      if (firebaseUser) {
        setStoreUser({
          id: firebaseUser.uid,
          email: firebaseUser.email || '',
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
          jlptLevel: 5,
          createdAt: new Date(
            firebaseUser.metadata.creationTime || Date.now()
          ),
        })
      } else {
        setStoreUser(null)
      }
    })

    return () => unsubscribe()
  }, [setStoreUser, setStoreLoading])

  const isEmailVerified = user?.emailVerified ?? false

  return (
    <AuthContext.Provider value={{ user, loading, isEmailVerified }}>
      {children}
    </AuthContext.Provider>
  )
}
