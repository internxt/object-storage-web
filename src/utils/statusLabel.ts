export type StatusTone = 'green' | 'red' | 'gray' | 'amber';

export const STATUSES: Record<string, { tone: StatusTone; label: string }> = {
  ACTIVE: { tone: 'green', label: 'Active' },
  PAID_ACCOUNT: { tone: 'green', label: 'Paid' },
  SUSPENDED: { tone: 'gray', label: 'Suspended' },
  PENDING_DELETION: { tone: 'amber', label: 'Pending deletion' },
  DELETED: { tone: 'red', label: 'Deleted' },
};

export const statusLabel = (status?: string | null): string =>
  status ? (STATUSES[status]?.label ?? status) : '';

export const toConsoleStatus = (status: string): 'PAID_ACCOUNT' | 'SUSPENDED' | 'PENDING_DELETION' | 'DELETED' =>
  status === 'SUSPENDED' || status === 'PENDING_DELETION' || status === 'DELETED' ? status : 'PAID_ACCOUNT';
