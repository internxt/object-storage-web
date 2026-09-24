import { ShieldWarningIcon } from '@phosphor-icons/react';
import { useWholesalers } from '../context/wholesalersContext';
import { WholesalersTwoFactorSetupForm } from './WholesalersTwoFactorSetupForm';
import { T, text, card } from '../../sub-account/tokens';

export const WholesalersForcedTwoFactorSetup = () => {
  const { clearTwoFactorSetupRequired } = useWholesalers();

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: T.gray5,
        padding: 24,
      }}
    >
      <div style={{ ...card, borderRadius: 16, padding: 32, width: '100%', maxWidth: 440 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(239,68,68,0.1)',
                color: T.red,
              }}
            >
              <ShieldWarningIcon size={20} weight='fill' />
            </div>
            <p style={{ ...text.heading, margin: 0 }}>Set up two-factor authentication</p>
            <p style={{ fontSize: 13, color: T.gray60, margin: 0 }}>
              Your administrator reset two-factor authentication on this account. You must set it up again before you
              can continue.
            </p>
          </div>

          <WholesalersTwoFactorSetupForm onComplete={clearTwoFactorSetupRequired} />
        </div>
      </div>
    </div>
  );
};
