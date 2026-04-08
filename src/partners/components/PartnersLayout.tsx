import { ReactNode, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { usePartners } from '../context/partnersContext';
import { SignOut, User } from '@phosphor-icons/react';

export const PartnersLayout = ({ children }: { children: ReactNode }) => {
  const { logOut } = usePartners();
  const navigate = useNavigate();
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const handleLogOut = () => {
    logOut();
    navigate('/partners/login');
  };

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `px-4 py-4 text-sm font-medium border-b-2 transition-colors ${
      isActive
        ? 'border-white text-white'
        : 'border-transparent text-blue-200 hover:text-white'
    }`;

  return (
    <div className='flex flex-col min-h-screen bg-[#f0f2f5]'>
      <header className='bg-gradient-to-br from-[#060e5c] to-[#0d2aad] text-white flex items-center justify-between px-6'>
        <div className='flex items-center gap-6'>
          <img src='/logo.svg' alt='logo' className='h-5' />
          <nav className='flex items-stretch'>
            <NavLink to='/partners/sub-accounts' className={navLinkClass}>
              Sub-Accounts
            </NavLink>
          </nav>
        </div>

        <div className='relative'>
          <button
            onClick={() => setUserMenuOpen((o) => !o)}
            className='flex items-center gap-2 text-sm text-gray-300 hover:text-white py-4'
          >
            <User size={18} />
          </button>
          {userMenuOpen && (
            <div className='absolute right-0 top-full mt-1 bg-white text-gray-800 rounded shadow-md w-40 z-50'>
              <button
                onClick={handleLogOut}
                className='flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200'
              >
                <SignOut size={16} />
                Sign out
              </button>
            </div>
          )}
        </div>
      </header>

      <main className='flex-1 p-6 overflow-auto bg-[#f0f2f5]'>{children}</main>
    </div>
  );
};
