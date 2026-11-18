import dayjs from 'dayjs';

export type DeletableEntity = 'sub-account' | 'partner' | 'wholesaler';

export const namesMatch = (typed: string, entityName: string): boolean =>
  entityName.trim().length > 0 && typed.trim() === entityName.trim();

export const subAccountConfirmationName = (
  name: string | null | undefined,
  email: string | null | undefined,
): string | null => name?.trim() || email?.trim() || null;

const ENTITY_TITLE: Record<DeletableEntity, string> = {
  'sub-account': 'Sub-account',
  partner: 'Partner',
  wholesaler: 'Wholesaler',
};

export const DELETE_COPY = {
  title: (entity: DeletableEntity) => `Delete ${entity} permanently?`,
  checking: 'Checking your two-factor authentication…',
  checkFailed: "Couldn't check your two-factor authentication status. Please try again.",
  twoFactorRequired: (entity: DeletableEntity) =>
    `Deleting a ${entity} requires two-factor authentication. Enable it in Settings first, then try again.`,
  noName: (entity: DeletableEntity) =>
    `This ${entity} has no name or email to confirm with, so it can't be deleted here.`,
  namePromptBefore: 'To confirm, type ',
  namePromptAfter: ' below.',
  codePrompt: 'Enter the 6-digit code from your authenticator app to delete it.',
  codeLabel: 'Verification code',
  codePlaceholder: '000000',
  cancel: 'Cancel',
  close: 'Close',
  retry: 'Try again',
  goToSettings: 'Go to Settings',
  delete: 'Delete',
  confirm: 'Confirm',
  deleted: (entity: DeletableEntity) => `${ENTITY_TITLE[entity]} deleted`,
  errors: {
    invalidCode: 'Invalid code. Check your authenticator app and try again.',
    nameMismatch: "The name doesn't match. Type it exactly as shown.",
    locked: (lockedUntil?: string) =>
      lockedUntil
        ? `Too many failed attempts. Try again at ${dayjs(lockedUntil).format('HH:mm')}.`
        : 'Too many failed attempts. Try again later.',
    generic: (entity: DeletableEntity) => `Couldn't delete the ${entity}. Please try again.`,
  },
};
