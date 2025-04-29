import { ReactNode, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { localStorageService } from '../services/localStorage.service';
import DefaultAvatar from './Avatar';
import { GearSix, Question, SignOut } from '@phosphor-icons/react';
import { Dropdown } from './Dropdown';

export const Layout = ({ children }: { children: ReactNode }) => {
  const navigate = useNavigate();

  useEffect(() => {
    const useToken = localStorageService.getUserToken();

    if (!useToken) {
      navigate('/login', { replace: true });
    }
  }, []);

  const onSettingsClicked = () => {
    navigate('/settings/account', {
      state: { from: window.location.pathname },
      viewTransition: true,
    });
  };

  const onLogoutClicked = () => {
    localStorageService.removeUserToken();
    navigate('/login', { replace: true });
  };

  const onHelpClicked = () => {
    window.open(
      'https://help.internxt.com/en/collections/10286865-s3',
      '_blank'
    );
  };

  return (
    <div className='flex flex-col min-h-screen'>
      <div className='flex flex-row w-screen h-[60px] justify-between gap-10 items-center px-10 bg-[#091E42] fixed z-10'>
        <div className='flex flex-row items-center h-full gap-10'>
          <img
            src={
              'https://s1.cdn.cloudstoragecdn.com/market/reseller/oem_partner/__ID__/header-logo/MDNbKdpIF2aJHZzyjDaVwgEA55O97lgiWBO5WRB2XApVwAcnOc.png'
            }
            alt='Internxt Logo'
            width={120}
            height={16}
          />
          <div className='flex flex-row gap-6 h-full items-center'>
            <NavLink
              to='/buckets'
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
              to='/usage'
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
        <Dropdown
          button={<DefaultAvatar diameter={36} />}
          items={[
            {
              label: 'Settings',
              icon: <GearSix size={18} />,
              onClick: onSettingsClicked,
            },
            {
              label: 'Help',
              icon: <Question size={18} />,
              onClick: onHelpClicked,
            },
            {
              label: 'Logout',
              icon: <SignOut size={18} />,
              onClick: onLogoutClicked,
            },
          ]}
        />
      </div>
      <div className='flex py-20 w-screen items-center justify-center'>
        {children}
      </div>
    </div>
  );
};
