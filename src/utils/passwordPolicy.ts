export const passwordPolicyErrors = (password: string, minLength = 6): string[] => {
  const errors: string[] = [];
  if (!password || password.length < minLength) errors.push(`At least ${minLength} characters`);
  if (!/[a-z]/.test(password)) errors.push('At least one lowercase letter');
  if (!/[A-Z]/.test(password)) errors.push('At least one uppercase letter');
  if (!/\d/.test(password)) errors.push('At least one digit');
  if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) errors.push('At least one special character (!@#$%^&* etc)');
  return errors;
};
