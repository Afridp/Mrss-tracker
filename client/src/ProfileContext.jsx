import { createContext, useContext, useEffect, useState } from 'react'
import { getPeople } from './api'
import { useAuth } from './AuthContext'

const ProfileContext = createContext(null)

export function ProfileProvider({ children }) {
  const { user, isAdmin } = useAuth()
  const [profile, setProfile] = useState(null)
  const [checking, setChecking] = useState(true)
  const [tick, setTick] = useState(0)

  const refetch = () => setTick(t => t + 1)

  useEffect(() => {
    if (user === undefined) return
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
  }, [user, tick])

  return (
    <ProfileContext.Provider value={{ profile, profileId: profile?.id || null, checking, refetch }}>
      {children}
    </ProfileContext.Provider>
  )
}

export const useProfile = () => useContext(ProfileContext)
