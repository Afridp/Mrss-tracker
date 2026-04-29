import { createContext, useContext, useEffect, useState } from 'react'
import { getPeople } from './api'
import { useAuth } from './AuthContext'

const ProfileContext = createContext(null)

export function ProfileProvider({ children }) {
  const { user, isAdmin } = useAuth()
  const [profile, setProfile] = useState(null)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    if (user === undefined) return // auth still loading
    if (!user) {
      setProfile(null)
      setChecking(false)
      return
    }

    getPeople().then(people => {
      const match = people.find(p =>
        p.email?.toLowerCase() === user.email?.toLowerCase()
      )
      setProfile(match || null)
    }).finally(() => setChecking(false))
  }, [user])

  return (
    <ProfileContext.Provider value={{ profile, profileId: profile?.id || null, checking }}>
      {children}
    </ProfileContext.Provider>
  )
}

export const useProfile = () => useContext(ProfileContext)
