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
} as const;

export const COLUMNS = [
  { label: 'Resource', width: '2.4fr' },
  { label: 'Creator', width: '1.4fr' },
  { label: 'Type', width: '0.8fr' },
  { label: 'Created', width: '1fr' },
] as const;

export const GRID_TEMPLATE = COLUMNS.map((column) => column.width).join(' ');

export const shareResourcePath = (share: ShareListItem) => `${share.bucket}/${share.objectKey}`;

export const shareTypeLabel = (share: ShareListItem) => (share.isFolder ? LABELS.folder : LABELS.file);

export const linkCountLabel = (count: number) => `${count} active ${count === 1 ? 'link' : 'links'}`;

export const toBodyState = (isLoading: boolean, count: number): BODY_STATE => {
  if (isLoading) return 'loading';
  return count === 0 ? 'empty' : 'items';
};
