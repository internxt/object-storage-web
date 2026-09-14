import { useEffect, useState } from 'react';
import { wholesalersService } from '../services/wholesalers.service';
import notificationsService from '../../services/notifications.service';
import Input from '../../components/Input';
import Button from '../../components/Button';
import { T, text } from '../../sub-account/tokens';
import { apiErrorMessage } from '../../utils/apiError';

const CODE_LENGTH = 6;

export const WholesalersTwoFactorSetupForm = ({
  onComplete,
  onCancel,
}: {
  onComplete: () => void;
  onCancel?: () => void;
}) => {
  const [setup, setSetup] = useState<{ secret: string; qrCode: string } | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [code, setCode] = useState('');
  const [isConfirming, setIsConfirming] = useState(false);

  useEffect(() => {
    wholesalersService
      .getTwoFactorSetup()
      .then(setSetup)
      .catch((err) => {
        notificationsService.error({ text: apiErrorMessage(err, 'Failed to load the setup information') });
        setLoadFailed(true);
      });
  }, []);

  const handleConfirm = async () => {
    setIsConfirming(true);
    try {
      await wholesalersService.enableTwoFactor(code);
      notificationsService.success({ text: 'Two-factor authentication enabled' });
      onComplete();
    } catch (err) {
      notificationsService.error({ text: apiErrorMessage(err, 'Invalid code') });
    } finally {
      setIsConfirming(false);
    }
  };

  if (loadFailed) {
    return <p style={{ fontSize: 13, color: T.red, margin: 0 }}>Failed to load the setup information.</p>;
  }

  if (!setup) {
    return <p style={{ fontSize: 13, color: T.gray50, margin: 0 }}>Loading…</p>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <p style={{ fontSize: 13, color: T.gray60, margin: 0 }}>
        Scan this QR code with your authenticator app (Google Authenticator, Authy, …).
      </p>

      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <img src={setup.qrCode} alt='Two-factor authentication QR code' width={180} height={180} />
      </div>

      <div>
        <p style={{ ...text.label, marginBottom: 6 }}>Or enter this code manually</p>
        <div
          style={{
            background: T.gray5,
            border: `1px solid ${T.gray20}`,
            borderRadius: 8,
            padding: '8px 12px',
            fontSize: 13,
            color: T.gray80,
            fontFamily: 'monospace',
            wordBreak: 'break-all',
            userSelect: 'all',
          }}
        >
          {setup.secret}
        </div>
      </div>

      <div>
        <p style={{ ...text.label, marginBottom: 6 }}>Enter the 6-digit code</p>
        <Input value={code} onChange={setCode} placeholder='123456' maxLength={CODE_LENGTH} variant='default' />
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, paddingTop: 4 }}>
        {onCancel && (
          <Button variant='secondary' type='button' onClick={onCancel} disabled={isConfirming}>
            Cancel
          </Button>
        )}
        <Button
          type='button'
          onClick={handleConfirm}
          disabled={isConfirming || code.length !== CODE_LENGTH}
          loading={isConfirming}
        >
          Confirm
        </Button>
      </div>
    </div>
  );
};
