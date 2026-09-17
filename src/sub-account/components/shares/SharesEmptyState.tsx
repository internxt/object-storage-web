import { useTranslation } from 'react-i18next';
import { T, text } from '../../tokens';
import { centeredMessage } from './styles';

export const SharesEmptyState = ({ hasSearch }: { hasSearch: boolean }) => {
  const { t } = useTranslation('subaccount');
  return (
  <div style={{ ...centeredMessage, padding: '56px 24px' }}>
    <p style={{ ...text.bodyMed, color: T.gray80 }}>{hasSearch ? t('shares.emptyFiltered') : t('shares.emptyDefault')}</p>
    {hasSearch && <p style={{ fontSize: 13, color: T.gray50, marginTop: 4 }}>{t('shares.emptyFilteredHint')}</p>}
  </div>
  );
};
