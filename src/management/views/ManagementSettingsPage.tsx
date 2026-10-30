import { useState } from 'react';
import { TwoFactorCard } from '../components/TwoFactorCard';
import { ManagementMembersCard } from '../components/ManagementMembersCard';
import { ManagementAuditCard } from '../components/ManagementAuditCard';
import { ChangePasswordForm } from '../../components/ChangePasswordForm';
import { ReadField, SectionCard } from '../../sub-account/components/SettingsAtoms';
import { useManagement } from '../context/useManagement';
import { managementMembersService } from '../services/management-members.service';
import { T } from '../../sub-account/tokens';

const ROLE_LABELS = { owner: 'Owner', staff: 'Staff' } as const;

const ProfileTab = () => {
  const { me } = useManagement();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {me && (
        <SectionCard title='Account'>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <ReadField label='Email' value={me.email} />
            <ReadField label='Role' value={ROLE_LABELS[me.role]} />
          </div>
        </SectionCard>
      )}

      <TwoFactorCard />

      <SectionCard title='Change password'>
        <ChangePasswordForm onSubmit={managementMembersService.changeOwnPassword} />
      </SectionCard>
    </div>
  );
};

type Tab = 'profile' | 'members' | 'audit';

const TABS: { key: Tab; label: string }[] = [
  { key: 'profile', label: 'Profile' },
  { key: 'members', label: 'Members' },
  { key: 'audit', label: 'Audit log' },
];

export const ManagementSettingsPage = () => {
  const { isOwner } = useManagement();
  const [activeTab, setActiveTab] = useState<Tab>('profile');

  return (
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
        <p style={{ fontSize: 14, color: T.gray60, margin: '6px 0 0' }}>
          {isOwner ? 'Manage your account and team.' : 'Manage your account security.'}
        </p>
      </div>

      {isOwner && (
        <div style={{ borderBottom: `1px solid ${T.gray20}` }}>
          <div style={{ display: 'flex' }}>
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                style={{
                  padding: '12px 4px',
                  margin: '0 12px',
                  fontSize: 14,
                  fontWeight: 500,
                  border: 'none',
                  borderBottom: activeTab === tab.key ? `2px solid ${T.primary}` : '2px solid transparent',
                  marginBottom: -1,
                  color: activeTab === tab.key ? T.gray100 : T.gray60,
                  background: 'transparent',
                  cursor: 'pointer',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {(!isOwner || activeTab === 'profile') && <ProfileTab />}
      {isOwner && activeTab === 'members' && <ManagementMembersCard />}
      {isOwner && activeTab === 'audit' && <ManagementAuditCard />}
    </div>
  );
};
