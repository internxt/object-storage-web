export const STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Active',
  PAID_ACCOUNT: 'Paid',
  SUSPENDED: 'Suspended',
  PENDING_DELETION: 'Pending deletion',
  DELETED: 'Deleted',
};

export const statusLabel = (status?: string | null): string =>
  status ? (STATUS_LABELS[status] ?? status) : '';
