export const PASSWORD_MIN_LENGTH = 6;
export const PASSWORD_MAX_LENGTH = 50;
export const PASSWORD_SPECIAL_CHARACTERS = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/;

export const validatePassword = (password: string): string[] => {
  const errors: string[] = [];
  if (!password || password.length < PASSWORD_MIN_LENGTH) errors.push('At least 6 characters');
  if (!/[a-z]/.test(password)) errors.push('At least one lowercase letter');
  if (!/[A-Z]/.test(password)) errors.push('At least one uppercase letter');
  if (!/\d/.test(password)) errors.push('At least one digit');
  if (!PASSWORD_SPECIAL_CHARACTERS.test(password)) errors.push('At least one special character (!@#$%^&* etc)');
  if (password.length > PASSWORD_MAX_LENGTH) errors.push(`At most ${PASSWORD_MAX_LENGTH} characters`);
  return errors;
};
