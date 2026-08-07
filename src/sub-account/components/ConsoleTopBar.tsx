import { useEffect, useRef, useState } from 'react';
import {
  GlobeIcon,
  CaretDownIcon,
  GearSixIcon,
  SignOutIcon,
  ArrowSquareOutIcon,
} from '@phosphor-icons/react';
import { T, shadow } from '../../styles/tokens';

// ─── Types ────────────────────────────────────────────────────────────────────

interface TopBarTab {
  label: string;
  key: string;
}

export interface ConsoleTopBarProps {
  tabs: TopBarTab[];
  activeTab: string;
  onTab: (key: string) => void;
  consoleLabel: string;
  onSettings: () => void;
  onLogout: () => void;
  user: { email?: string; initials: string };
  billing?: { loading: boolean; onClick: () => void };
}

// ─── AvatarMenu ───────────────────────────────────────────────────────────────

interface AvatarMenuProps {
  user: ConsoleTopBarProps['user'];
  onSettings: () => void;
  onLogout: () => void;
}

const AvatarMenu = ({ user, onSettings, onLogout }: AvatarMenuProps) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const keyHandler = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', handler);
    document.addEventListener('keydown', keyHandler);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('keydown', keyHandler);
    };
  }, [open]);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      {/* Avatar button */}
      <button
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen(o => !o)}
        style={{
          width: 36, height: 36, borderRadius: '50%',
          background: T.primaryBg, color: T.primary,
          border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 13, fontWeight: 600,
          flexShrink: 0,
        }}
        title="Account menu"
      >
        {user.initials}
      </button>

      {/* Dropdown */}
      {open && (
        <div
          role="menu"
          style={{
            position: 'absolute', right: 0, top: 'calc(100% + 8px)',
            width: 220, zIndex: 200,
            background: T.white,
            border: `1px solid ${T.gray20}`,
            borderRadius: 12,
            boxShadow: shadow.lg,
            padding: 6,
          }}
        >
          {/* Account info header */}
          {user.email && (
            <>
              <div style={{ padding: '8px 12px 10px' }}>
                <p style={{ fontSize: 13, color: T.gray60, margin: 0, wordBreak: 'break-all' }}>
                  {user.email}
                </p>
              </div>
              <div style={{ height: 1, background: T.gray20, margin: '0 0 4px' }} />
            </>
          )}

          {/* Settings */}
          <MenuItem
            icon={<GearSixIcon size={16} />}
            label="Settings"
            onClick={() => { setOpen(false); onSettings(); }}
          />

          {/* Separator */}
          <div style={{ height: 1, background: T.gray20, margin: '4px 0' }} />

          {/* Logout */}
          <MenuItem
            icon={<SignOutIcon size={16} />}
            label="Log out"
            onClick={() => { setOpen(false); onLogout(); }}
            danger
          />
        </div>
      )}
    </div>
  );
};

interface MenuItemProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  danger?: boolean;
}

const MenuItem = ({ icon, label, onClick, danger }: MenuItemProps) => {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      role="menuitem"
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        width: '100%', height: 40, padding: '0 12px',
        background: hovered ? T.gray5 : 'transparent',
        border: 'none', borderRadius: 8, cursor: 'pointer',
        fontSize: 14, fontWeight: 500,
        color: danger ? T.red : T.gray100,
        textAlign: 'left',
      }}
    >
      {icon}
      {label}
    </button>
  );
};

// ─── ConsoleTopBar ────────────────────────────────────────────────────────────

export const ConsoleTopBar = ({
  tabs,
  activeTab,
  onTab,
  consoleLabel,
  onSettings,
  onLogout,
  user,
  billing,
}: ConsoleTopBarProps) => (
  <header style={{
    height: 56,
    background: T.white,
    borderBottom: `1px solid ${T.gray20}`,
    padding: '0 32px',
    display: 'flex',
    alignItems: 'center',
    gap: 0,
    fontFamily: '"Instrument Sans", sans-serif',
    position: 'sticky', top: 0, zIndex: 100,
  }}>
    {/* Left group */}
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <img src="/logo.svg" alt="Internxt" style={{ height: 14, filter: 'brightness(0)' }} />

      {/* Console badge */}
      <span style={{
        fontSize: 11, fontWeight: 500, textTransform: 'uppercase',
        letterSpacing: '0.06em', color: T.primary,
        background: T.primaryBg,
        padding: '3px 8px', borderRadius: 999,
        whiteSpace: 'nowrap',
      }}>
        {consoleLabel}
      </span>

      {/* Tabs */}
      <nav style={{ display: 'flex', alignItems: 'stretch', height: 56, marginLeft: 8 }}>
        {tabs.map(tab => {
          const isActive = tab.key === activeTab;
          return (
            <button
              key={tab.key}
              onClick={() => onTab(tab.key)}
              style={{
                height: '100%', padding: '0 14px',
                background: 'none', border: 'none',
                borderBottom: isActive ? `2px solid ${T.primary}` : '2px solid transparent',
                cursor: 'pointer',
                fontSize: 14, fontWeight: 500,
                color: isActive ? T.gray100 : T.gray60,
                transition: 'color 120ms, border-color 120ms',
                whiteSpace: 'nowrap',
              }}
            >
              {tab.label}
            </button>
          );
        })}
        {billing && (
          <button
            onClick={billing.onClick}
            disabled={billing.loading}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              height: '100%', padding: '0 14px',
              background: 'none', border: 'none', borderBottom: '2px solid transparent',
              cursor: billing.loading ? 'default' : 'pointer',
              fontSize: 14, fontWeight: 500, color: T.gray60,
              whiteSpace: 'nowrap', opacity: billing.loading ? 0.6 : 1,
            }}
          >
            Billing
            <ArrowSquareOutIcon size={14} />
          </button>
        )}
      </nav>
    </div>

    {/* Spacer */}
    <div style={{ flex: 1 }} />

    {/* Right group */}
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      {/* Language selector */}
      <button style={{
        display: 'flex', alignItems: 'center', gap: 6,
        height: 36, padding: '0 12px',
        background: 'none', border: `1px solid ${T.gray20}`,
        borderRadius: 8, cursor: 'pointer',
        fontSize: 13, fontWeight: 500, color: T.gray60,
      }}>
        <GlobeIcon size={15} aria-label="Language" />
        English
        <CaretDownIcon size={13} />
      </button>

      <AvatarMenu user={user} onSettings={onSettings} onLogout={onLogout} />
    </div>
  </header>
);
