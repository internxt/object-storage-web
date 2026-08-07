import { card } from '../../tokens';
import { ShareListItem } from '../../services/share.service';
import { COLUMNS, LABELS, toBodyState } from './constants';
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
}

export const SharesTable = ({ shares, totalCount, isLoading, search, onSearchChange }: SharesTableProps) => {
  const bodyState = toBodyState(isLoading, shares.length);

  return (
    <div style={{ ...card, overflow: 'hidden' }}>
      <SharesCardHeader totalCount={totalCount} search={search} onSearchChange={onSearchChange} />

      <div role="row" style={headerRow}>
        {COLUMNS.map((column) => (
          <span key={column.label} style={headerCell}>
            {column.label}
          </span>
        ))}
      </div>

      {bodyState === 'loading' && <div style={centeredMessage}>{LABELS.loading}</div>}
      {bodyState === 'empty' && <SharesEmptyState hasSearch={!!search} />}
      {bodyState === 'items' && shares.map((share) => <ShareRow key={share.id} share={share} />)}
    </div>
  );
};
