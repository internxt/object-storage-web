import { ReactNode, useEffect, useRef, useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { localStorageService } from '../services/localStorage.service'
import DefaultAvatar from './Avatar'
import { GearSix, SignOut } from '@phosphor-icons/react'

export const Layout = ({ children }: { children: ReactNode }) => {
  const navigate = useNavigate()
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const toggleDropdown = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    setIsDropdownOpen(!isDropdownOpen)
  }

  useEffect(() => {
    const useToken = localStorageService.getUserToken()

    if (!useToken) {
      navigate('/login', { replace: true })
    }
  }, [])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const onSettingsClicked = () => {
    navigate('/settings/account', {
      state: { from: window.location.pathname },
      viewTransition: true,
    })
    setIsDropdownOpen(false)
  }

  const onLogoutClicked = () => {
    localStorageService.removeUserToken()
    navigate('/login', { replace: true })
    setIsDropdownOpen(false)
  }

  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex flex-row w-screen h-[60px] justify-between gap-10 items-center px-10 bg-[#091E42]">
        <div className="flex flex-row items-center h-full gap-10">
          <img
            src={
              'https://s1.cdn.cloudstoragecdn.com/market/reseller/oem_partner/__ID__/header-logo/MDNbKdpIF2aJHZzyjDaVwgEA55O97lgiWBO5WRB2XApVwAcnOc.png'
            }
            alt="Internxt Logo"
            width={120}
            height={16}
          />
          <div className="flex flex-row gap-6 h-full items-center">
            <NavLink
              to="/buckets"
              end
              className={({ isActive }) => `
            text-white text-sm font-semibold border-b-2
              ${
                isActive
                  ? 'border-white w-max h-full items-center flex justify-center'
                  : 'border-transparent'
              }
            `}
            >
              Buckets
            </NavLink>
            <NavLink
              to="/usage"
              end
              className={({ isActive }) => `
            text-white text-sm font-semibold border-b-2
              ${
                isActive
                  ? 'border-white w-max h-full items-center flex justify-center '
                  : 'border-transparent'
              }
            `}
            >
              Usage
            </NavLink>
          </div>
        </div>
        <div ref={dropdownRef} className="relative">
          <button className="flex" onClick={toggleDropdown}>
            <DefaultAvatar diameter={36} />
          </button>
          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-32 rounded-md shadow-lg bg-white z-50">
              <div className="flex flex-col items-start justify-start w-full py-0.5">
                <button
                  className="px-4 py-3 hover:bg-gray-100 cursor-pointer w-full flex flex-row items-center justify-between text-gray-600"
                  onClick={onSettingsClicked}
                >
                  <GearSix />
                  Settings
                </button>
                <button
                  className="px-4 py-3 hover:bg-gray-100 cursor-pointer w-full flex flex-row items-center justify-between text-gray-600"
                  onClick={onLogoutClicked}
                >
                  <SignOut />
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      {children}
    </div>
  )
}
