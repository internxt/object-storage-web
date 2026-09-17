import { useTranslation } from 'react-i18next';
import Input from '../../../components/Input';
import { T } from '../../tokens';

interface SharesCardHeaderProps {
  totalCount: number;
  search: string;
  onSearchChange: (value: string) => void;
}

export const SharesCardHeader = ({ totalCount, search, onSearchChange }: SharesCardHeaderProps) => {
  const { t } = useTranslation('subaccount');
  return (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', gap: 16 }}>
    <div>
      <p style={{ fontSize: 16, fontWeight: 600, color: T.gray100 }}>{t('shares.title')}</p>
      <p style={{ fontSize: 13, color: T.gray50, marginTop: 2 }}>{t('shares.linkCount', { count: totalCount })}</p>
    </div>
    <div style={{ width: 280 }}>
      <Input
        variant="search"
        placeholder={t('shares.searchPlaceholder')}
        value={search}
        onChange={onSearchChange}
        onClear={() => onSearchChange('')}
      />
    </div>
  </div>
  );
};
