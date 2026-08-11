import { useEffect, useRef, useState } from 'react';
import { WarningCircleIcon } from '@phosphor-icons/react';
import Modal from '../Modal';
import Input from '../Input';
import Button from '../Button';
import { T, text, form } from '../../sub-account/tokens';
import {
  SsoCancelledError,
  SsoMemberNotFoundError,
  SsoNotConfiguredError,
  SsoPopupBlockedError,
  subAccountSsoService,
} from '../../sub-account/services/sub-account-sso.service';

const SSO_ORG_KEY = 'subAccountSsoOrg';

interface SsoLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  logInWithSso: (organizationName: string) => Promise<void>;
}

export const SsoLoginModal = ({ isOpen, onClose, logInWithSso }: SsoLoginModalProps) => {
  const [organizationName, setOrganizationName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<{ kind: 'warning' | 'error'; message: string } | null>(null);
  // Bumped every time the modal opens, so a stale response from an attempt left
  // hanging in a previous, interrupted popup can't clobber a fresh one's state.
  const attemptIdRef = useRef(0);

  useEffect(() => {
    if (isOpen) {
      attemptIdRef.current += 1;
      setOrganizationName(localStorage.getItem(SSO_ORG_KEY) ?? '');
      setError(null);
      setIsLoading(false);
      // Start every attempt from a clean slate, even if the previous one was
      // interrupted mid-popup and left MSAL's client-side state stuck.
      subAccountSsoService.resetSsoLoginState();
    }
  }, [isOpen]);

  const canSubmit = !!organizationName.trim() && !isLoading;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    const attemptId = attemptIdRef.current;
    setError(null);
    setIsLoading(true);
    try {
      await logInWithSso(organizationName);
      if (attemptId !== attemptIdRef.current) return;
      localStorage.setItem(SSO_ORG_KEY, organizationName.trim().toLowerCase());
      onClose();
    } catch (err) {
      if (attemptId !== attemptIdRef.current) return;
      if (err instanceof SsoNotConfiguredError) {
        setError({
          kind: 'warning',
          message: 'SSO is not configured for this organization. Contact your administrator or sign in with email and password.',
        });
      } else if (err instanceof SsoMemberNotFoundError) {
        setError({
          kind: 'error',
          message: `The Microsoft account ${err.azureEmail || 'used'} is not a member of this organization.`,
        });
      } else if (err instanceof SsoPopupBlockedError) {
        setError({
          kind: 'error',
          message: 'Your browser blocked the sign-in window. Allow pop-ups for this site and try again.',
        });
      } else if (err instanceof SsoCancelledError) {
        setError({
          kind: 'error',
          message: 'The sign-in window was closed before completing. Try again.',
        });
      } else {
        setError({ kind: 'error', message: 'Something went wrong while signing in with SSO. Try again.' });
      }
    } finally {
      if (attemptId === attemptIdRef.current) setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingTop: 4 }}>
        <div>
          <p style={{ ...text.heading, margin: 0 }}>Sign in with SSO</p>
          <p style={{ ...text.hint, margin: '6px 0 0' }}>
            Enter your organization name to continue with your Microsoft account.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label style={form.label}>Organization name</label>
          <Input value={organizationName} onChange={setOrganizationName} placeholder='your-organization' autofocus />
        </div>

        {error && (
          <div
            style={{
              display: 'flex', alignItems: 'flex-start', gap: 8, padding: '10px 12px', borderRadius: 8,
              background: error.kind === 'warning' ? '#FFF7E6' : '#FDECEC',
              color: error.kind === 'warning' ? '#8A5A00' : T.red,
            }}
          >
            <WarningCircleIcon size={18} weight='fill' style={{ flexShrink: 0, marginTop: 1 }} />
            <span style={{ fontSize: 13, lineHeight: 1.45 }}>{error.message}</span>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, paddingTop: 4 }}>
          <Button variant='secondary' type='button' onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type='submit' disabled={!canSubmit} loading={isLoading}>
            Continue with Microsoft
          </Button>
        </div>
      </form>
    </Modal>
  );
};
