import { ReactNode } from 'react';
import { T } from '../../sub-account/tokens';

interface CenteredMessageProps {
  icon: ReactNode;
  title: string;
  subtitle: string;
}

export const CenteredMessage = ({ icon, title, subtitle }: CenteredMessageProps) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '64px 24px' }}>
    <div style={{
      width: 56, height: 56, borderRadius: '50%', background: T.gray10,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      {icon}
    </div>
    <p style={{ fontSize: 16, fontWeight: 600, color: T.gray100, margin: 0 }}>{title}</p>
    <p style={{ fontSize: 13, color: T.gray50, margin: 0, textAlign: 'center', maxWidth: 320 }}>{subtitle}</p>
  </div>
);
