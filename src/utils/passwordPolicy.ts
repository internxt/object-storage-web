export const passwordPolicyErrors = (password: string): string[] => {
  const errors: string[] = [];
  if (password.length < 6) errors.push('At least 6 characters');
  if (!/[a-z]/.test(password)) errors.push('At least one lowercase letter');
  if (!/[A-Z]/.test(password)) errors.push('At least one uppercase letter');
  if (!/\d/.test(password)) errors.push('At least one digit');
  if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) errors.push('At least one special character');
  return errors;
};
