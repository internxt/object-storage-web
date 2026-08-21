import type { BODY_STATE } from '../../../components/settings/MembersTable';
import { ShareListItem } from '../../services/share.service';

export const LABELS = {
  title: 'Shared',
  searchPlaceholder: 'Search shared links...',
  loading: 'Loading shared links…',
  emptyDefault: 'No shared links yet',
  emptyFiltered: 'No shared links found',
  emptyFilteredHint: 'Try a different search term',
  folder: 'Folder',
  file: 'File',
  noValue: '—',
  revokeTitle: 'Revoke share link',
  revokeConfirm: 'Revoke',
  revokeSuccess: 'Share link revoked',
  revokeError: 'Could not revoke the share link',
} as const;

export const COLUMNS = [
  { key: 'resource', label: 'Resource', width: '2.4fr' },
  { key: 'creator', label: 'Creator', width: '1.4fr' },
  { key: 'type', label: 'Type', width: '0.8fr' },
  { key: 'created', label: 'Created', width: '1fr' },
  { key: 'actions', label: '', width: '48px' },
] as const;

export const GRID_TEMPLATE = COLUMNS.map((column) => column.width).join(' ');

export const shareResourcePath = (share: ShareListItem) => `${share.bucket}/${share.objectKey}`;

export const shareTypeLabel = (share: ShareListItem) => (share.isFolder ? LABELS.folder : LABELS.file);

export const linkCountLabel = (count: number) => `${count} active ${count === 1 ? 'link' : 'links'}`;

export const toBodyState = (isLoading: boolean, count: number): BODY_STATE => {
  if (isLoading) return 'loading';
  return count === 0 ? 'empty' : 'items';
};
