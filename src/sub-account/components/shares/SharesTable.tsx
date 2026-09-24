import { useTranslation } from 'react-i18next';
import { card } from '../../tokens';
import { ShareListItem } from '../../services/share.service';
import { COLUMN_KEYS, toBodyState } from './constants';
import { centeredMessage, headerCell, headerRow } from './styles';
import { SharesCardHeader } from './SharesCardHeader';
import { SharesEmptyState } from './SharesEmptyState';
import { ShareRow } from './ShareRow';

interface SharesTableProps {
  shares: ShareListItem[];
  totalCount: number;
  isLoading: boolean;
  search: string;
  onSearchChange: (value: string) => void;
  onRevoke: (share: ShareListItem) => void;
}

export const SharesTable = ({
  shares,
  totalCount,
  isLoading,
  search,
  onSearchChange,
  onRevoke,
}: SharesTableProps) => {
  const { t } = useTranslation('subaccount');
  const bodyState = toBodyState(isLoading, shares.length);

  return (
    <div style={{ ...card, overflow: 'hidden' }}>
      <SharesCardHeader totalCount={totalCount} search={search} onSearchChange={onSearchChange} />

      <div role="row" style={headerRow}>
        {COLUMN_KEYS.map((column) => (
          <span key={column.key} style={headerCell}>
            {column.labelKey ? t(column.labelKey) : ''}
          </span>
        ))}
      </div>

      {bodyState === 'loading' && <div style={centeredMessage}>{t('shares.loading')}</div>}
      {bodyState === 'empty' && <SharesEmptyState hasSearch={!!search} />}
      {bodyState === 'items' &&
        shares.map((share) => (
          <ShareRow key={share.id} share={share} onRevoke={() => onRevoke(share)} />
        ))}
    </div>
  );
};
