import { createContext, useContext, useEffect, useState } from 'react'
import { getPeople } from './api'

const ProfileContext = createContext(null)

export function ProfileProvider({ children }) {
  const [profileId, setProfileIdState] = useState(() => localStorage.getItem('profileId'))
  const [profile, setProfile] = useState(null)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function verify() {
      if (!profileId) {
        setProfile(null)
        setChecking(false)
        return
      }
      try {
        const people = await getPeople()
        if (cancelled) return
        const p = people.find(x => x.id === profileId)
        if (p) {
          setProfile(p)
        } else {
          localStorage.removeItem('profileId')
          setProfileIdState(null)
          setProfile(null)
        }
      } finally {
        if (!cancelled) setChecking(false)
      }
    }
    verify()
    return () => { cancelled = true }
  }, [profileId])

  function setProfileId(id) {
    if (id) localStorage.setItem('profileId', id)
    else localStorage.removeItem('profileId')
    setProfileIdState(id)
    setChecking(true)
  }

  return (
    <ProfileContext.Provider value={{ profileId, profile, checking, setProfileId }}>
      {children}
    </ProfileContext.Provider>
  )
}

export const useProfile = () => useContext(ProfileContext)
