import { useSyncExternalStore } from 'react'
import type { AuthSession } from '@/lib/types'

const storageKey = 'context-layer.console.session'

class AuthStore {
  private session: AuthSession | null
  private listeners = new Set<() => void>()

  constructor() {
    this.session = this.readFromStorage()
  }

  subscribe = (listener: () => void) => {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  getSession = () => this.session
  getAccessToken = () => this.session?.accessToken ?? null

  signIn = (session: AuthSession) => {
    this.session = session
    window.localStorage.setItem(storageKey, JSON.stringify(session))
    this.emit()
  }

  signOut = () => {
    this.session = null
    window.localStorage.removeItem(storageKey)
    this.emit()
  }

  private emit() {
    for (const listener of this.listeners) {
      listener()
    }
  }

  private readFromStorage() {
    if (typeof window === 'undefined') {
      return null
    }

    const raw = window.localStorage.getItem(storageKey)
    if (!raw) {
      return null
    }

    try {
      const parsed = JSON.parse(raw) as AuthSession
      if (new Date(parsed.expiresAtUtc).getTime() <= Date.now()) {
        window.localStorage.removeItem(storageKey)
        return null
      }

      return parsed
    } catch {
      window.localStorage.removeItem(storageKey)
      return null
    }
  }
}

export const authStore = new AuthStore()

export function useAuthSession() {
  const session = useSyncExternalStore(
    authStore.subscribe,
    authStore.getSession,
    authStore.getSession,
  )

  return {
    session,
    signIn: authStore.signIn,
    signOut: authStore.signOut,
  }
}
