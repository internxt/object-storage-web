import { TwoFactorCard } from '../components/TwoFactorCard';
import { T } from '../../sub-account/tokens';

export const ManagementSettingsPage = () => (
  <div
    style={{
      maxWidth: 920,
      margin: '0 auto',
      padding: '32px 32px',
      display: 'flex',
      flexDirection: 'column',
      gap: 24,
    }}
  >
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 600, color: T.gray100, margin: 0 }}>Settings</h1>
      <p style={{ fontSize: 14, color: T.gray60, margin: '6px 0 0' }}>Manage your account security.</p>
    </div>
    <TwoFactorCard />
  </div>
);
