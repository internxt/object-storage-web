import { FormEvent, ReactNode, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import Modal from '../Modal';
import Button from '../Button';
import Input from '../Input';
import { TwoFactorCodeInput, TWO_FACTOR_CODE_LENGTH } from '../two-factor/TwoFactorCodeInput';
import notificationsService from '../../services/notifications.service';
import { text, form } from '../../sub-account/tokens';
import { apiErrorCode, getLockedUntil } from '../../utils/apiError';
import { DeleteConfirmation } from '../../utils/deleteConfirmation';
import { DELETE_COPY, DeletableEntity, namesMatch } from './deleteConfirmation';

export interface DeleteConfirmationDialogProps {
  isOpen: boolean;
  entity: DeletableEntity;
  entityName: string | null | undefined;
  description?: ReactNode;
  getTwoFactorStatus: () => Promise<{ enabled: boolean }>;
  settingsPath: string;
  onDelete: (confirmation: DeleteConfirmation) => Promise<void>;
  onDeleted: () => void;
  onClose: () => void;
}

type Step = 'checking' | 'check-failed' | 'two-factor-off' | 'no-name' | 'name' | 'code';

export const DeleteConfirmationDialog = (props: DeleteConfirmationDialogProps) =>
  props.isOpen ? <DeleteConfirmationSteps {...props} /> : null;

const DeleteConfirmationSteps = ({
  entity,
  entityName,
  description,
  getTwoFactorStatus,
  settingsPath,
  onDelete,
  onDeleted,
  onClose,
}: DeleteConfirmationDialogProps) => {
  const navigate = useNavigate();
  const expectedName = entityName?.trim() ?? '';
  const [step, setStep] = useState<Step>('checking');
  const [checkAttempt, setCheckAttempt] = useState(0);
  const [typedName, setTypedName] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState<string>();
  const [lock, setLock] = useState<{ until?: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getTwoFactorStatus()
      .then(({ enabled }) => {
        if (cancelled) return;
        if (!enabled) setStep('two-factor-off');
        else setStep(expectedName ? 'name' : 'no-name');
      })
      .catch(() => {
        if (!cancelled) setStep('check-failed');
      });
    return () => {
      cancelled = true;
    };
  }, [getTwoFactorStatus, expectedName, checkAttempt]);

  useEffect(() => {
    if (!lock?.until) return;
    const timeout = setTimeout(
      () => {
        setLock(null);
        setError(undefined);
      },
      Math.max(dayjs(lock.until).diff(dayjs()), 0),
    );
    return () => clearTimeout(timeout);
  }, [lock]);

  const close = () => {
    if (!isSubmitting) onClose();
  };

  const nameMatches = namesMatch(typedName, expectedName);
  const canConfirm = code.length === TWO_FACTOR_CODE_LENGTH && !lock && !isSubmitting;

  const submitName = (event: FormEvent) => {
    event.preventDefault();
    if (!nameMatches) return;
    setError(undefined);
    setStep('code');
  };

  const submitCode = async (event: FormEvent) => {
    event.preventDefault();
    if (!canConfirm) return;
    setIsSubmitting(true);
    setError(undefined);
    try {
      await onDelete({ name: typedName.trim(), code });
    } catch (err) {
      setIsSubmitting(false);
      setCode('');
      switch (apiErrorCode(err)) {
        case 'TWO_FACTOR_NOT_ENABLED':
          setStep('two-factor-off');
          return;
        case 'TWO_FACTOR_INVALID_CODE':
          setError(DELETE_COPY.errors.invalidCode);
          return;
        case 'ACCOUNT_LOCKED': {
          const lockedUntil = getLockedUntil(err);
          setLock({ until: lockedUntil });
          setError(DELETE_COPY.errors.locked(lockedUntil));
          return;
        }
        case 'DELETE_NAME_MISMATCH':
          setStep('name');
          setError(DELETE_COPY.errors.nameMismatch);
          return;
        default:
          notificationsService.error({ text: DELETE_COPY.errors.generic(entity) });
          onClose();
          return;
      }
    }
    notificationsService.success({ text: DELETE_COPY.deleted(entity) });
    onClose();
    onDeleted();
  };

  const header = (hint?: ReactNode) => (
    <div>
      <p style={{ ...text.heading, margin: 0 }}>{DELETE_COPY.title(entity)}</p>
      {hint && <div style={{ ...text.hint, margin: '4px 0 0' }}>{hint}</div>}
    </div>
  );

  const actions = (primary?: ReactNode, cancelLabel: string = DELETE_COPY.cancel) => (
    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, paddingTop: 4 }}>
      <Button variant="secondary" type="button" onClick={close} disabled={isSubmitting}>
        {cancelLabel}
      </Button>
      {primary}
    </div>
  );

  const layout = { display: 'flex', flexDirection: 'column', gap: 20, paddingTop: 4 } as const;

  const renderStep = () => {
    switch (step) {
      case 'checking':
        return (
          <div style={layout}>
            {header(DELETE_COPY.checking)}
            {actions()}
          </div>
        );
      case 'check-failed':
        return (
          <div style={layout}>
            {header(DELETE_COPY.checkFailed)}
            {actions(
              <Button
                type="button"
                onClick={() => {
                  setStep('checking');
                  setCheckAttempt((n) => n + 1);
                }}
              >
                {DELETE_COPY.retry}
              </Button>,
            )}
          </div>
        );
      case 'two-factor-off':
        return (
          <div style={layout}>
            {header(DELETE_COPY.twoFactorRequired(entity))}
            {actions(
              <Button
                type="button"
                onClick={() => {
                  onClose();
                  navigate(settingsPath);
                }}
              >
                {DELETE_COPY.goToSettings}
              </Button>,
            )}
          </div>
        );
      case 'no-name':
        return (
          <div style={layout}>
            {header(DELETE_COPY.noName(entity))}
            {actions(undefined, DELETE_COPY.close)}
          </div>
        );
      case 'name':
        return (
          <form onSubmit={submitName} style={layout}>
            {header(description)}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={form.label}>
                {DELETE_COPY.namePromptBefore}
                <span style={{ fontWeight: 600, color: 'inherit', wordBreak: 'break-all' }}>{expectedName}</span>
                {DELETE_COPY.namePromptAfter}
              </label>
              <Input
                value={typedName}
                onChange={(value) => {
                  setTypedName(value);
                  setError(undefined);
                }}
                autofocus
                autoComplete="off"
                accent={error ? 'error' : undefined}
                message={error}
              />
            </div>
            {actions(
              <Button variant="destructive" type="submit" disabled={!nameMatches}>
                {DELETE_COPY.delete}
              </Button>,
            )}
          </form>
        );
      case 'code':
        return (
          <form onSubmit={submitCode} style={layout}>
            {header(DELETE_COPY.codePrompt)}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={form.label}>{DELETE_COPY.codeLabel}</label>
              <TwoFactorCodeInput
                value={code}
                onChange={(value) => {
                  setCode(value);
                  if (!lock) setError(undefined);
                }}
                placeholder={DELETE_COPY.codePlaceholder}
                error={error}
                autofocus
              />
            </div>
            {actions(
              <Button variant="destructive" type="submit" disabled={!canConfirm} loading={isSubmitting}>
                {DELETE_COPY.confirm}
              </Button>,
            )}
          </form>
        );
    }
  };

  return createPortal(
    <Modal isOpen onClose={close} preventClosing={isSubmitting}>
      {renderStep()}
    </Modal>,
    document.body,
  );
};
