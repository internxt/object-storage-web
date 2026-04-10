import { ReactNode, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { usePartners } from '../context/partnersContext';
import { SignOut, User, LockKey, ArrowSquareOut } from '@phosphor-icons/react';
import { ChangePasswordModal } from './ChangePasswordModal';
import { partnersService } from '../services/partners.service';
import notificationsService from '../../services/notifications.service';

export const PartnersLayout = ({ children }: { children: ReactNode }) => {
  const { logOut } = usePartners();
  const navigate = useNavigate();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [billingLoading, setBillingLoading] = useState(false);

  const openBilling = async () => {
    setBillingLoading(true);
    try {
      const { url } = await partnersService.createBillingPortalSession();
      window.open(url, '_blank');
    } catch {
      notificationsService.error({ text: 'Failed to open billing portal' });
    } finally {
      setBillingLoading(false);
    }
  };

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
            <button
              onClick={openBilling}
              disabled={billingLoading}
              className='flex items-center gap-1.5 px-4 py-4 text-sm font-medium border-b-2 border-transparent text-blue-200 hover:text-white transition-colors disabled:opacity-50'
            >
              Billing
              <ArrowSquareOut size={14} />
            </button>
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
                { label: 'Change Password', icon: <LockKey size={16} />, onClick: () => { setUserMenuOpen(false); setChangePasswordOpen(true); }, extraClass: 'rounded-t' },
                { label: 'Sign out', icon: <SignOut size={16} />, onClick: handleLogOut, extraClass: 'border-t border-gray-200 rounded-b' },
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

      <ChangePasswordModal isOpen={changePasswordOpen} onClose={() => setChangePasswordOpen(false)} />
    </div>
  );
};
