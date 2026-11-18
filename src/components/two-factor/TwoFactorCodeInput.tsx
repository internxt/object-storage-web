import Input from '../Input';

export const TWO_FACTOR_CODE_LENGTH = 6;

interface TwoFactorCodeInputProps {
  value: string;
  onChange: (code: string) => void;
  placeholder?: string;
  error?: string;
  autofocus?: boolean;
}

export const TwoFactorCodeInput = ({ value, onChange, placeholder, error, autofocus }: TwoFactorCodeInputProps) => (
  <Input
    autofocus={autofocus}
    value={value}
    onChange={(v) => onChange(v.replace(/\D/g, ''))}
    placeholder={placeholder}
    maxLength={TWO_FACTOR_CODE_LENGTH}
    autoComplete="off"
    variant="default"
    accent={error ? 'error' : undefined}
    message={error}
  />
);
