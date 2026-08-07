import { ReactNode, useEffect, useRef, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useManagement } from '../context/managementContext';
import { SignOutIcon } from '@phosphor-icons/react';
import { T, shadow } from '../../styles/tokens';

const AvatarMenu = ({ onLogout }: { onLogout: () => void }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        aria-haspopup='menu'
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        style={{
          width: 36, height: 36, borderRadius: '50%',
          background: T.primaryBg, color: T.primary,
          border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 13, fontWeight: 600,
          flexShrink: 0,
        }}
        title='Account menu'
      >
        IU
      </button>

      {open && (
        <div
          role='menu'
          style={{
            position: 'absolute', right: 0, top: 'calc(100% + 8px)',
            width: 180, zIndex: 200,
            background: T.white,
            border: `1px solid ${T.gray20}`,
            borderRadius: 12,
            boxShadow: shadow.lg,
            padding: 6,
          }}
        >
          <button
            role='menuitem'
            onClick={onLogout}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              width: '100%', height: 40, padding: '0 12px',
              background: 'transparent',
              border: 'none', borderRadius: 8, cursor: 'pointer',
              fontSize: 14, fontWeight: 500,
              color: T.red,
              textAlign: 'left',
            }}
          >
            <SignOutIcon size={16} />
            Sign out
          </button>
        </div>
      )}
    </div>
  );
};

export const ManagementLayout = ({ children }: { children: ReactNode }) => {
  const { logOut } = useManagement();
  const navigate = useNavigate();

  const handleLogOut = () => {
    logOut();
    navigate('/management/login');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: T.gray5 }}>
      <header style={{
        height: 56,
        background: T.white,
        borderBottom: `1px solid ${T.gray20}`,
        padding: '0 32px',
        display: 'flex',
        alignItems: 'center',
        fontFamily: '"Instrument Sans", sans-serif',
        position: 'sticky', top: 0, zIndex: 100,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <img src='/logo.svg' alt='logo' style={{ height: 14, filter: 'brightness(0)' }} />

          <span style={{
            fontSize: 11, fontWeight: 500, textTransform: 'uppercase',
            letterSpacing: '0.06em', color: T.primary,
            background: T.primaryBg,
            padding: '3px 8px', borderRadius: 999,
            whiteSpace: 'nowrap',
          }}>
            Management
          </span>

          <nav style={{ display: 'flex', alignItems: 'stretch', height: 56, marginLeft: 8 }}>
            <NavLink
              to='/management/accounts'
              style={({ isActive }) => ({
                height: '100%', padding: '0 14px',
                display: 'flex', alignItems: 'center',
                borderBottom: isActive ? `2px solid ${T.primary}` : '2px solid transparent',
                fontSize: 14, fontWeight: 500,
                color: isActive ? T.gray100 : T.gray60,
                textDecoration: 'none',
                whiteSpace: 'nowrap',
              })}
            >
              Accounts
            </NavLink>
            <NavLink
              to='/management/partners'
              style={({ isActive }) => ({
                height: '100%', padding: '0 14px',
                display: 'flex', alignItems: 'center',
                borderBottom: isActive ? `2px solid ${T.primary}` : '2px solid transparent',
                fontSize: 14, fontWeight: 500,
                color: isActive ? T.gray100 : T.gray60,
                textDecoration: 'none',
                whiteSpace: 'nowrap',
              })}
            >
              Partners
            </NavLink>
          </nav>
        </div>

        <div style={{ flex: 1 }} />

        <AvatarMenu onLogout={handleLogOut} />
      </header>

      <main style={{ flex: 1, padding: 24, overflow: 'auto', background: T.gray5 }}>{children}</main>
    </div>
  );
};
