export const PASSWORD_MIN_LENGTH = 6;
export const PASSWORD_MAX_LENGTH = 50;
export const PASSWORD_SPECIAL_CHARACTERS = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/;

const DEFAULT_MESSAGES = {
  minLength: 'At least 6 characters',
  lowercase: 'At least one lowercase letter',
  uppercase: 'At least one uppercase letter',
  digit: 'At least one digit',
  specialChar: 'At least one special character (!@#$%^&* etc)',
  maxLength: `At most ${PASSWORD_MAX_LENGTH} characters`,
};

export const validatePassword = (
  password: string,
  t?: (key: string, options?: Record<string, unknown>) => string
): string[] => {
  const message = (key: keyof typeof DEFAULT_MESSAGES, options?: Record<string, unknown>) =>
    t ? t(`login.passwordPolicy.${key}`, options) : DEFAULT_MESSAGES[key];

  const errors: string[] = [];
  if (!password || password.length < PASSWORD_MIN_LENGTH) errors.push(message('minLength'));
  if (!/[a-z]/.test(password)) errors.push(message('lowercase'));
  if (!/[A-Z]/.test(password)) errors.push(message('uppercase'));
  if (!/\d/.test(password)) errors.push(message('digit'));
  if (!PASSWORD_SPECIAL_CHARACTERS.test(password)) errors.push(message('specialChar'));
  if (password.length > PASSWORD_MAX_LENGTH) errors.push(message('maxLength', { count: PASSWORD_MAX_LENGTH }));
  return errors;
};
