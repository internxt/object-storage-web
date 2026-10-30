import { FormEvent, useEffect, useRef, useState } from 'react';
import axios from 'axios';
import dayjs from 'dayjs';
import Modal from '../../components/Modal';
import Button from '../../components/Button';
import Input from '../../components/Input';
import { TwoFactorCodeInput, TWO_FACTOR_CODE_LENGTH } from '../../components/two-factor/TwoFactorCodeInput';
import { apiErrorMessage, hasApiErrorStatus, isTwoFactorRequiredError } from '../../utils/apiError';
import { setReauthHandler } from '../core/management-reauth';
import { managementAuthService } from '../services/management-auth.service';
import { managementTwoFactorService } from '../services/management-two-factor.service';
import { text, form } from '../../sub-account/tokens';

const getLockedUntil = (err: unknown): string | undefined => {
  if (!axios.isAxiosError(err)) return undefined;
  const data = err.response?.data as { code?: string; lockedUntil?: string } | undefined;
  return data?.code === 'ACCOUNT_LOCKED' ? data.lockedUntil : undefined;
};

const errorMessage = (err: unknown): string => {
  if (isTwoFactorRequiredError(err)) return 'Enter the code from your authenticator app.';
  const lockedUntil = getLockedUntil(err);
  if (lockedUntil) return `Too many failed attempts. Try again at ${dayjs(lockedUntil).format('HH:mm')}.`;
  if (hasApiErrorStatus(err, 403)) return 'Incorrect password or code.';
  if (hasApiErrorStatus(err, 400)) return apiErrorMessage(err, 'Check your password and code.');
  return 'Something went wrong. Please try again.';
};

export const ReauthDialog = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [needsCode, setNeedsCode] = useState(false);
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState<string>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const resolveRef = useRef<((confirmed: boolean) => void) | null>(null);

  useEffect(() => {
    setReauthHandler(
      () =>
        new Promise<boolean>((resolve) => {
          resolveRef.current = resolve;
          setPassword('');
          setCode('');
          setError(undefined);
          setNeedsCode(false);
          setIsOpen(true);
          managementTwoFactorService
            .getStatus()
            .then((status) => setNeedsCode((current) => current || status.enabled))
            .catch(() => undefined);
        }),
    );
    return () => setReauthHandler(null);
  }, []);

  const finish = (confirmed: boolean) => {
    setIsOpen(false);
    resolveRef.current?.(confirmed);
    resolveRef.current = null;
  };

  const handleSubmit = async (event?: FormEvent) => {
    event?.preventDefault();
    if (!canSubmit) return;
    setIsSubmitting(true);
    setError(undefined);
    try {
      await managementAuthService.reauthenticate(password, needsCode ? code : undefined);
      finish(true);
    } catch (err) {
      if (hasApiErrorStatus(err, 401)) {
        finish(false);
        return;
      }
      if (isTwoFactorRequiredError(err)) setNeedsCode(true);
      setError(errorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const canSubmit = !!password && (!needsCode || code.length === TWO_FACTOR_CODE_LENGTH) && !isSubmitting;

  return (
    <Modal isOpen={isOpen} onClose={() => !isSubmitting && finish(false)}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingTop: 4 }}>
        <div>
          <p style={{ ...text.heading, margin: 0 }}>Confirm your password</p>
          <p style={{ ...text.hint, margin: '4px 0 0' }}>
            {needsCode
              ? 'For your security, enter your password and a code from your authenticator app to continue.'
              : 'For your security, enter your password to continue.'}
          </p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label style={form.label}>Password</label>
          <Input
            value={password}
            onChange={setPassword}
            variant="password"
            autofocus
            accent={error && !needsCode ? 'error' : undefined}
            message={needsCode ? undefined : error}
          />
        </div>
        {needsCode && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={form.label}>Verification code</label>
            <TwoFactorCodeInput value={code} onChange={setCode} placeholder="000000" error={error} />
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, paddingTop: 4 }}>
          <Button variant="secondary" type="button" onClick={() => finish(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={!canSubmit} loading={isSubmitting}>
            Confirm
          </Button>
        </div>
      </form>
    </Modal>
  );
};
