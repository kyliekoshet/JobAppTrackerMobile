import React, { createContext, useContext, useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase, signInWithEmail, signUpWithEmail, signOut, getCurrentUser, onAuthStateChange } from '../lib/supabase'

interface AuthContextType {
  user: User | null
  loading: boolean
  isAuthenticated: boolean
  isLoading: boolean
  signInWithEmail: (email: string, password: string) => Promise<{ error: any }>
  signUpWithEmail: (email: string, password: string) => Promise<{ error: any }>
  signOut: () => Promise<{ error: any }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: React.ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial user
    getCurrentUser().then(({ user }) => {
      setUser(user)
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event, session?.user?.email)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleSignInWithEmail = async (email: string, password: string) => {
    const { error } = await signInWithEmail(email, password)
    if (error) {
      console.error('Error signing in with email:', error)
    }
    return { error }
  }

  const handleSignUpWithEmail = async (email: string, password: string) => {
    const { error } = await signUpWithEmail(email, password)
    if (error) {
      console.error('Error signing up with email:', error)
    }
    return { error }
  }

  const handleSignOut = async () => {
    const { error } = await signOut()
    if (error) {
      console.error('Error signing out:', error)
    }
    return { error }
  }

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    isLoading: loading,
    signInWithEmail: handleSignInWithEmail,
    signUpWithEmail: handleSignUpWithEmail,
    signOut: handleSignOut
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
} 