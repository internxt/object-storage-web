import dayjs from 'dayjs';

export type DeletableEntity = 'sub-account' | 'partner' | 'wholesaler';

const normalizeEmail = (email: string) => email.trim().toLowerCase();

export const emailsMatch = (typed: string, entityEmail: string): boolean =>
  normalizeEmail(entityEmail).length > 0 && normalizeEmail(typed) === normalizeEmail(entityEmail);

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
  noEmail: (entity: DeletableEntity) => `This ${entity} has no email to confirm with, so it can't be deleted here.`,
  emailPromptBefore: 'To confirm, type ',
  emailPromptAfter: ' below.',
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
    emailMismatch: "The email doesn't match. Type it as shown.",
    locked: (lockedUntil?: string) =>
      lockedUntil
        ? `Too many failed attempts. Try again at ${dayjs(lockedUntil).format('HH:mm')}.`
        : 'Too many failed attempts. Try again later.',
    generic: (entity: DeletableEntity) => `Couldn't delete the ${entity}. Please try again.`,
  },
};
