import { useEffect, useState } from 'react';
import { CheckIcon, CopyIcon } from '@phosphor-icons/react';
import { acronisIntegrationService, AcronisIntegrationStatus } from '../../services/acronis-integration.service';
import notificationsService from '../../../services/notifications.service';
import { apiErrorMessage } from '../../../utils/apiError';
import { copyToClipboard } from '../../../utils/copyToClipboard';
import Modal from '../../../components/Modal';
import Button from '../../../components/Button';
import Dialog from '../../../components/Dialog';
import { T, text } from '../../../sub-account/tokens';
import { SectionCard, Pill } from '../../views/PartnersSettingsPage';

const COPIED_RESET_MS = 2000;

export const IntegrationsTab = () => {
  const [status, setStatus] = useState<AcronisIntegrationStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [revokeOpen, setRevokeOpen] = useState(false);
  const [revoking, setRevoking] = useState(false);

  const fetchStatus = async () => {
    setLoading(true);
    try {
      setStatus(await acronisIntegrationService.getStatus());
    } catch (e) {
      notificationsService.error({ text: apiErrorMessage(e, 'Failed to load integration status') });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchStatus();
  }, []);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const { apiKey } = await acronisIntegrationService.generateApiKey();
      setGeneratedKey(apiKey);
      fetchStatus();
    } catch (e) {
      notificationsService.error({ text: apiErrorMessage(e, 'Failed to generate the API key') });
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = async () => {
    if (!generatedKey) return;
    await copyToClipboard(generatedKey);
    setCopied(true);
    setTimeout(() => setCopied(false), COPIED_RESET_MS);
  };

  const handleRevoke = async () => {
    setRevoking(true);
    try {
      await acronisIntegrationService.revokeApiKey();
      notificationsService.success({ text: 'Acronis integration disconnected' });
      setRevokeOpen(false);
      fetchStatus();
    } catch (e) {
      notificationsService.error({ text: apiErrorMessage(e, 'Failed to disconnect the integration') });
    } finally {
      setRevoking(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <SectionCard
        title="Acronis"
        subtitle="Connect Internxt Object Storage as a backup destination in Acronis Cyber Protect Cloud"
        action={
          loading ? undefined : (
            <Pill
              label={status?.connected ? 'Connected' : 'Not connected'}
              tone={status?.connected ? 'green' : 'gray'}
            />
          )
        }
      >
        <p style={{ fontSize: 14, color: T.gray60, margin: '0 0 16px' }}>
          Generate an API key and paste it into the "Internxt" app, under Integrations {'>'} Configure, in your Acronis
          Cyber Protect Cloud account.
        </p>

        {status?.connected && status.createdAt && (
          <p style={{ fontSize: 13, color: T.gray50, margin: '0 0 16px' }}>
            Key generated on{' '}
            {new Date(status.createdAt).toLocaleDateString('en-GB', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            })}
          </p>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          {status?.connected && (
            <Button variant="secondary" onClick={() => setRevokeOpen(true)}>
              Disconnect
            </Button>
          )}
          <Button onClick={handleGenerate} loading={generating} disabled={generating || loading}>
            {status?.connected ? 'Regenerate API key' : 'Generate API key'}
          </Button>
        </div>
      </SectionCard>

      {/* Reveal-once modal */}
      <Modal isOpen={!!generatedKey} onClose={() => setGeneratedKey(null)}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingTop: 4 }}>
          <p style={{ ...text.heading, margin: 0 }}>Acronis API key</p>
          <p style={{ fontSize: 13, color: T.gray60, margin: 0 }}>
            Copy this key now and paste it into Acronis — it won't be shown again. Generating a new key immediately
            invalidates this one.
          </p>
          <div
            style={{
              background: T.gray5,
              border: `1px solid ${T.gray20}`,
              borderRadius: 8,
              padding: '10px 12px',
              fontSize: 13,
              fontFamily: 'monospace',
              wordBreak: 'break-all',
              color: T.gray100,
            }}
          >
            {generatedKey}
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <Button variant="secondary" onClick={() => setGeneratedKey(null)}>
              Done
            </Button>
            <Button onClick={handleCopy}>
              {copied ? <CheckIcon size={15} /> : <CopyIcon size={15} />}
              {copied ? 'Copied' : 'Copy'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Disconnect confirmation */}
      <Dialog
        isOpen={revokeOpen}
        onClose={() => setRevokeOpen(false)}
        onPrimaryAction={handleRevoke}
        onSecondaryAction={() => setRevokeOpen(false)}
        isLoading={revoking}
        primaryAction="Disconnect"
        secondaryAction="Cancel"
        primaryActionColor="danger"
        title="Disconnect Acronis integration?"
        subtitle="Acronis will no longer be able to use the current key. Existing sub-accounts and their data are not affected."
      />
    </div>
  );
};
