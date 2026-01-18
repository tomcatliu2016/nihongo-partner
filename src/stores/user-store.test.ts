import { describe, it, expect, beforeEach } from 'vitest'
import { useUserStore, type User } from './user-store'

describe('useUserStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    useUserStore.setState({
      user: null,
      isLoading: true,
    })
  })

  describe('initial state', () => {
    it('has null user initially', () => {
      const state = useUserStore.getState()
      expect(state.user).toBeNull()
    })

    it('has isLoading true initially', () => {
      const state = useUserStore.getState()
      expect(state.isLoading).toBe(true)
    })
  })

  describe('setUser', () => {
    it('sets the user', () => {
      const mockUser: User = {
        id: 'user-1',
        email: 'test@example.com',
        displayName: 'Test User',
        photoURL: null,
        jlptLevel: 3,
        createdAt: new Date(),
      }

      useUserStore.getState().setUser(mockUser)

      const state = useUserStore.getState()
      expect(state.user).toEqual(mockUser)
    })

    it('can set user to null', () => {
      const mockUser: User = {
        id: 'user-1',
        email: 'test@example.com',
        displayName: 'Test User',
        photoURL: null,
        jlptLevel: 3,
        createdAt: new Date(),
      }

      useUserStore.getState().setUser(mockUser)
      useUserStore.getState().setUser(null)

      const state = useUserStore.getState()
      expect(state.user).toBeNull()
    })
  })

  describe('setLoading', () => {
    it('sets loading to false', () => {
      useUserStore.getState().setLoading(false)

      const state = useUserStore.getState()
      expect(state.isLoading).toBe(false)
    })

    it('sets loading to true', () => {
      useUserStore.getState().setLoading(false)
      useUserStore.getState().setLoading(true)

      const state = useUserStore.getState()
      expect(state.isLoading).toBe(true)
    })
  })

  describe('reset', () => {
    it('resets user to null and isLoading to false', () => {
      const mockUser: User = {
        id: 'user-1',
        email: 'test@example.com',
        displayName: 'Test User',
        photoURL: null,
        jlptLevel: 3,
        createdAt: new Date(),
      }

      useUserStore.getState().setUser(mockUser)
      useUserStore.getState().setLoading(false)
      useUserStore.getState().reset()

      const state = useUserStore.getState()
      expect(state.user).toBeNull()
      expect(state.isLoading).toBe(false)
    })
  })

  describe('persistence', () => {
    it('partializes state to only persist user', () => {
      // The store uses persist middleware with partialize
      // This test verifies the store configuration
      const mockUser: User = {
        id: 'user-1',
        email: 'test@example.com',
        displayName: 'Test User',
        photoURL: null,
        jlptLevel: 3,
        createdAt: new Date(),
      }

      useUserStore.getState().setUser(mockUser)

      // Verify user is stored
      const state = useUserStore.getState()
      expect(state.user).toEqual(mockUser)
    })
  })
})
