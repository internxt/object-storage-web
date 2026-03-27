import { ReactNode } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useManagement } from '../context/managementContext';
import { SignOut, User } from '@phosphor-icons/react';
import { useState } from 'react';

export const ManagementLayout = ({ children }: { children: ReactNode }) => {
  const { logOut } = useManagement();
  const navigate = useNavigate();
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const handleLogOut = () => {
    logOut();
    navigate('/management/login');
  };

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `px-4 py-4 text-sm font-medium border-b-2 transition-colors ${
      isActive
        ? 'border-green-500 text-green-400'
        : 'border-transparent text-gray-300 hover:text-white'
    }`;

  return (
    <div className='flex flex-col min-h-screen bg-gray-50'>
      <header className='bg-[#1a1f2e] text-white flex items-center justify-between px-6'>
        <div className='flex items-center gap-6'>
          <img
            src='https://s1.cdn.cloudstoragecdn.com/market/reseller/oem_partner/__ID__/logo/ZDNLcqHNzXS64lR9RoAUOZRugDNRoPzsjSdiODTYoMpVNq5qUD.png'
            alt='logo'
            className='h-8 brightness-0 invert'
          />
          <nav className='flex items-stretch'>
            <NavLink to='/management/accounts' className={navLinkClass}>
              Accounts
            </NavLink>
            <NavLink to='/management/invoices' className={navLinkClass}>
              Invoices
            </NavLink>
            <NavLink to='/management/integrations' className={navLinkClass}>
              Integrations
            </NavLink>
          </nav>
        </div>

        <div className='relative'>
          <button
            onClick={() => setUserMenuOpen((o) => !o)}
            className='flex items-center gap-2 text-sm text-gray-300 hover:text-white py-4'
          >
            <User size={18} />
            <span>IU</span>
          </button>
          {userMenuOpen && (
            <div className='absolute right-0 top-full mt-1 bg-white text-gray-800 rounded shadow-md w-40 z-50'>
              <button
                onClick={handleLogOut}
                className='flex items-center gap-2 w-full px-4 py-2 text-sm hover:bg-gray-100'
              >
                <SignOut size={16} />
                Sign out
              </button>
            </div>
          )}
        </div>
      </header>

      <main className='flex-1 p-6 overflow-auto'>{children}</main>
    </div>
  );
};
