import { createContext, useContext, useEffect, useState } from 'react'
import {
  onAuthStateChanged, signInWithPopup, GoogleAuthProvider,
  signOut, setPersistence, browserLocalPersistence
} from 'firebase/auth'
import { auth } from './firebase'

const ADMIN_EMAIL = 'afrids2nd@gmail.com'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(undefined) // undefined = still loading

  useEffect(() => {
    // Keep session alive across browser restarts
    setPersistence(auth, browserLocalPersistence).catch(() => {})
    return onAuthStateChanged(auth, setUser)
  }, [])

  const signInWithGoogle = () => signInWithPopup(auth, new GoogleAuthProvider())
  const logout = () => signOut(auth)
  const isAdmin = user?.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase()

  return (
    <AuthContext.Provider value={{ user, isAdmin, signInWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
