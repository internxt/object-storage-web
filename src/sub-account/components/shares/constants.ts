import type { BODY_STATE } from '../../../components/settings/MembersTable';
import { ShareListItem } from '../../services/share.service';

export const NO_VALUE = '—';

export const COLUMN_KEYS = [
  { key: 'resource', labelKey: 'shares.columnResource', width: '2.4fr' },
  { key: 'creator', labelKey: 'shares.columnCreator', width: '1.4fr' },
  { key: 'type', labelKey: 'shares.columnType', width: '0.8fr' },
  { key: 'created', labelKey: 'shares.columnCreated', width: '1fr' },
  { key: 'actions', labelKey: null, width: '48px' },
] as const;

export const GRID_TEMPLATE = COLUMN_KEYS.map((column) => column.width).join(' ');

export const shareResourcePath = (share: ShareListItem) => `${share.bucket}/${share.objectKey}`;

export const shareTypeLabelKey = (share: ShareListItem) => (share.isFolder ? 'shares.folder' : 'shares.file');

export const toBodyState = (isLoading: boolean, count: number): BODY_STATE => {
  if (isLoading) return 'loading';
  return count === 0 ? 'empty' : 'items';
};
