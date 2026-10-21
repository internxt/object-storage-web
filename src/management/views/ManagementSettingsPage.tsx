import { TwoFactorCard } from '../components/TwoFactorCard';
import { T } from '../../sub-account/tokens';

export const ManagementSettingsPage = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 720 }}>
    <h2 style={{ fontSize: 16, fontWeight: 600, color: T.gray100, margin: 0 }}>Settings</h2>
    <TwoFactorCard />
  </div>
);
