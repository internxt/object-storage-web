import { useEffect, useState } from 'react';
import { WarningCircleIcon } from '@phosphor-icons/react';
import Modal from '../Modal';
import Input from '../Input';
import Button from '../Button';
import { T, text, form } from '../../sub-account/tokens';
import {
  SSO_ERROR_CODES,
  SsoConfig,
  getSsoErrorCode,
} from '../../sub-account/services/sub-account-sso.service';

const ORG_NAME_REGEX = /^[a-z0-9][a-z0-9-]{2,62}$/;
const GUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface ConfigureSsoModalProps {
  isOpen: boolean;
  configure: (config: { organizationName: string; tenantId: string; clientId: string }) => Promise<SsoConfig>;
  hasOtherMembers: boolean;
  onClose: () => void;
  onConfigured: (config: SsoConfig) => void;
}

export const ConfigureSsoModal = ({ isOpen, configure, hasOtherMembers, onClose, onConfigured }: ConfigureSsoModalProps) => {
  const [organizationName, setOrganizationName] = useState('');
  const [tenantId, setTenantId] = useState('');
  const [clientId, setClientId] = useState('');
  const [acknowledged, setAcknowledged] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [orgNameError, setOrgNameError] = useState<string>();
  const [submitError, setSubmitError] = useState<string>();

  useEffect(() => {
    if (!isOpen) {
      setOrganizationName('');
      setTenantId('');
      setClientId('');
      setAcknowledged(false);
      setOrgNameError(undefined);
      setSubmitError(undefined);
    }
  }, [isOpen]);

  const orgNameValid = ORG_NAME_REGEX.test(organizationName);
  const tenantIdValid = GUID_REGEX.test(tenantId.trim());
  const clientIdValid = GUID_REGEX.test(clientId.trim());
  const canSubmit = orgNameValid && tenantIdValid && clientIdValid && acknowledged && !isLoading;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setOrgNameError(undefined);
    setSubmitError(undefined);
    setIsLoading(true);
    try {
      const config = await configure({ organizationName, tenantId, clientId });
      onConfigured(config);
    } catch (err) {
      const code = getSsoErrorCode(err);
      if (code === SSO_ERROR_CODES.ORGANIZATION_NAME_TAKEN) {
        setOrgNameError('This organization name is already in use');
      } else if (code === SSO_ERROR_CODES.SSO_ALREADY_CONFIGURED) {
        setSubmitError('SSO is already configured for this account.');
      } else {
        setSubmitError('Failed to save the SSO configuration. Try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingTop: 4 }}>
        <div>
          <p style={{ ...text.heading, margin: 0 }}>Configure SSO</p>
          <p style={{ ...text.hint, margin: '6px 0 0' }}>
            Connect this account to Microsoft Entra ID (Azure AD) so members sign in with their Microsoft account.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label style={form.label}>Organization name</label>
          <Input
            value={organizationName}
            onChange={(v) => setOrganizationName(v.toLowerCase())}
            placeholder='your-organization'
            accent={orgNameError ? 'error' : undefined}
            message={orgNameError}
          />
          <p style={form.hint}>
            Members will enter this name when signing in with SSO. Lowercase letters, numbers and hyphens (3–63 characters).
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label style={form.label}>Provider</label>
          <select value='azure-ad' disabled style={{ ...form.select, color: T.gray60 }}>
            <option value='azure-ad'>Microsoft Entra ID (Azure AD)</option>
          </select>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label style={form.label}>Directory (tenant) ID</label>
          <Input value={tenantId} onChange={setTenantId} placeholder='00000000-0000-0000-0000-000000000000' />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label style={form.label}>Application (client) ID</label>
          <Input value={clientId} onChange={setClientId} placeholder='00000000-0000-0000-0000-000000000000' />
          <p style={form.hint}>
            In your Azure app registration, add a Single-page application redirect URI:{' '}
            <span style={{ fontFamily: 'monospace' }}>{`${window.location.origin}/subaccount/login`}</span>
          </p>
        </div>

        {hasOtherMembers && (
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '10px 12px', borderRadius: 8, background: '#FFF7E6', color: '#8A5A00' }}>
            <WarningCircleIcon size={18} weight='fill' style={{ flexShrink: 0, marginTop: 1 }} />
            <span style={{ fontSize: 13, lineHeight: 1.45 }}>
              This account already has members. Once SSO is enabled, their passwords will stop working and they will have to sign in with SSO.
            </span>
          </div>
        )}

        <label style={{ display: 'flex', alignItems: 'flex-start', gap: 8, cursor: 'pointer' }}>
          <input
            type='checkbox'
            checked={acknowledged}
            onChange={(e) => setAcknowledged(e.target.checked)}
            style={{ marginTop: 2 }}
          />
          <span style={{ ...text.body, fontSize: 13 }}>
            I understand SSO settings cannot be modified after saving.
          </span>
        </label>

        {submitError && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: T.red }}>
            <WarningCircleIcon size={16} weight='fill' style={{ flexShrink: 0 }} />
            <span style={{ fontSize: 13 }}>{submitError}</span>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, paddingTop: 4 }}>
          <Button variant='secondary' type='button' onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type='submit' disabled={!canSubmit} loading={isLoading}>
            Save configuration
          </Button>
        </div>
      </form>
    </Modal>
  );
};
