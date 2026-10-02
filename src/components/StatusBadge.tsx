import { T } from '../sub-account/tokens';
import { STATUS_LABELS } from '../utils/statusLabel';

type Tone = 'green' | 'red' | 'gray' | 'amber';

const TONES: Record<Tone, { bg: string; border: string; color: string; dot: string }> = {
  green: { bg: '#f0fdf4', border: '#bbf7d0', color: '#15803d', dot: '#22c55e' },
  red: { bg: '#fef2f2', border: '#fecaca', color: '#b91c1c', dot: '#f87171' },
  gray: { bg: '#f4f4f5', border: '#d4d4d8', color: '#52525b', dot: '#a1a1aa' },
  amber: { bg: '#fffbeb', border: '#fde68a', color: '#b45309', dot: '#f59e0b' },
};

const STATUS_TONES: Record<string, Tone> = {
  ACTIVE: 'green',
  PAID_ACCOUNT: 'green',
  SUSPENDED: 'gray',
  PENDING_DELETION: 'amber',
  DELETED: 'red',
};

export const StatusBadge = ({ status }: { status?: string | null }) => {
  if (!status) return null;

  const label = STATUS_LABELS[status];
  if (!label) return <span style={{ fontSize: 12, color: T.gray50 }}>{status}</span>;

  const tone = TONES[STATUS_TONES[status]];

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: '0.02em',
        padding: '4px 10px',
        borderRadius: 999,
        border: '1px solid',
        background: tone.bg,
        borderColor: tone.border,
        color: tone.color,
      }}
    >
      <span style={{ width: 6, height: 6, borderRadius: '50%', flexShrink: 0, background: tone.dot }} />
      {label}
    </span>
  );
};
