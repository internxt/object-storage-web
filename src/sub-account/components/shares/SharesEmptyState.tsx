import { T, text } from '../../tokens';
import { LABELS } from './constants';
import { centeredMessage } from './styles';

export const SharesEmptyState = ({ hasSearch }: { hasSearch: boolean }) => (
  <div style={{ ...centeredMessage, padding: '56px 24px' }}>
    <p style={{ ...text.bodyMed, color: T.gray80 }}>{hasSearch ? LABELS.emptyFiltered : LABELS.emptyDefault}</p>
    {hasSearch && <p style={{ fontSize: 13, color: T.gray50, marginTop: 4 }}>{LABELS.emptyFilteredHint}</p>}
  </div>
);
