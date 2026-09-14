import { WholesalerPartner } from '../services/wholesalers.service';

export const PartnerStatusBadge = ({ status }: { status: WholesalerPartner['status'] }) => {
  const config = {
    ACTIVE: { bg: '#f0fdf4', border: '#bbf7d0', color: '#15803d', dot: '#22c55e', label: 'Active' },
    DELETED: { bg: '#fef2f2', border: '#fecaca', color: '#b91c1c', dot: '#f87171', label: 'Deleted' },
  }[status];

  return (
    <span
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        fontSize: 11, fontWeight: 600, letterSpacing: '0.02em',
        padding: '4px 10px', borderRadius: 999, border: '1px solid',
        background: config.bg, borderColor: config.border, color: config.color,
      }}
    >
      <span style={{ width: 6, height: 6, borderRadius: '50%', flexShrink: 0, background: config.dot }} />
      {config.label}
    </span>
  );
};
