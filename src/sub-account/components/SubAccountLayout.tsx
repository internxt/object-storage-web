import { ReactNode, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useSubAccount } from '../context/SubAccountContext';
import { SignOut, User, GearSix } from '@phosphor-icons/react';

export const SubAccountLayout = ({ children }: { children: ReactNode }) => {
  const { logOut, isAdmin } = useSubAccount();
  const navigate = useNavigate();
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const handleLogOut = () => {
    logOut();
    navigate('/subaccount/login');
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
            <NavLink to='/subaccount/buckets' className={navLinkClass}>
              Buckets
            </NavLink>
            {isAdmin && (
              <NavLink to='/subaccount/usage' className={navLinkClass}>
                Usage
              </NavLink>
            )}
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
            <div className='absolute right-0 top-full mt-1 bg-white rounded shadow-md w-44 z-50' style={{ color: '#374151' }}>
              {[
                ...(isAdmin
                  ? [
                      {
                        label: 'Settings',
                        icon: <GearSix size={16} />,
                        onClick: () => { setUserMenuOpen(false); navigate('/subaccount/settings'); },
                        extraClass: 'rounded-t',
                      },
                    ]
                  : []),
                {
                  label: 'Sign out',
                  icon: <SignOut size={16} />,
                  onClick: handleLogOut,
                  extraClass: isAdmin ? 'border-t border-gray-200 rounded-b' : 'rounded',
                },
              ].map(({ label, icon, onClick, extraClass }) => (
                <button
                  key={label}
                  onClick={onClick}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#1f2937'; e.currentTarget.style.color = 'white'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = ''; e.currentTarget.style.color = ''; }}
                  className={`flex items-center gap-2 w-full px-4 py-2 text-sm transition-colors ${extraClass}`}
                >
                  {icon}
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>
      </header>

      <main className='flex-1 p-6 overflow-auto bg-[#f0f2f5]'>{children}</main>
    </div>
  );
};
