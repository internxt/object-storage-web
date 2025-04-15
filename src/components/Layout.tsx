import { ReactNode, useEffect } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { localStorageService } from '../services/localStorage.service'

export const Layout = ({ children }: { children: ReactNode }) => {
  const navigate = useNavigate()

  useEffect(() => {
    const useToken = localStorageService.getUserToken()

    if (!useToken) {
      navigate('/login', { replace: true })
    }
  }, [])

  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex flex-row w-screen h-[60px] gap-10 items-center px-10 bg-[#091E42]">
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
      {children}
    </div>
  )
}
