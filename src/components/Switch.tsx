import { T } from '../styles/tokens';

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
}

export const Switch = ({ checked, onChange, label, disabled = false }: SwitchProps) => (
  <label style={{
    display: 'flex', alignItems: 'center', gap: 8,
    cursor: disabled ? 'default' : 'pointer',
    fontSize: 13, color: T.gray60, whiteSpace: 'nowrap',
  }}>
    {label}
    <span
      role="switch"
      aria-checked={checked}
      onClick={() => !disabled && onChange(!checked)}
      style={{
        width: 36, height: 20, borderRadius: 10, position: 'relative',
        background: checked ? T.primary : T.gray20,
        opacity: disabled ? 0.5 : 1,
        transition: 'background 120ms', flexShrink: 0,
      }}
    >
      <span style={{
        position: 'absolute', top: 2, left: checked ? 18 : 2,
        width: 16, height: 16, borderRadius: '50%', background: '#fff',
        transition: 'left 120ms', boxShadow: '0 1px 2px rgba(0,0,0,0.2)',
      }} />
    </span>
  </label>
);
