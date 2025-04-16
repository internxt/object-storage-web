import { User, userService } from '../services/user.service'
import {
  createContext,
  useState,
  ReactNode,
  useContext,
  useMemo,
  useEffect,
} from 'react'

interface UserContextType {
  user: User | null
  setUser: (user: User | null) => void
}

const UserContext = createContext<UserContextType | undefined>(undefined)

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    userService
      .getUserData()
      .then((userData) => {
        setUser(userData)
      })
      .catch((error) => {
        console.error('Error fetching user data:', error)
        setUser(null)
      })
  }, [])

  const memoizedUser = useMemo(
    () => ({
      user,
      setUser,
    }),
    [user, setUser]
  )

  return (
    <UserContext.Provider value={memoizedUser}>{children}</UserContext.Provider>
  )
}

export const useUser = (): UserContextType => {
  const context = useContext(UserContext)
  if (!context) {
    throw new Error('useUser must be used within a UserProvider')
  }
  return context
}
