// Mirrors the backend's IsRequiredName: trimmed, non-empty, at most 255 characters.
export const NAME_MAX_LENGTH = 255;

export const requiredNameRules = (label = 'Client name') => ({
  setValueAs: (value?: string) => value?.trim() ?? '',
  validate: (value?: string) => (value ?? '').length > 0 || `${label} is required`,
  maxLength: { value: NAME_MAX_LENGTH, message: `${label} must be at most ${NAME_MAX_LENGTH} characters` },
});
