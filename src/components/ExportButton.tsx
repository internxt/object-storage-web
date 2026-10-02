import { useState } from 'react';
import { DownloadSimple } from '@phosphor-icons/react';
import notificationsService from '../services/notifications.service';
import { apiErrorMessage } from '../utils/apiError';
import { T } from '../sub-account/tokens';

interface Props {
  onExport: () => Promise<number>;
  disabled?: boolean;
}

export const ExportButton = ({ onExport, disabled = false }: Props) => {
  const [isExporting, setIsExporting] = useState(false);
  const isDisabled = disabled || isExporting;

  const handleClick = async () => {
    setIsExporting(true);
    try {
      const count = await onExport();
      notificationsService.success({ text: `Exported ${count} ${count === 1 ? 'row' : 'rows'}` });
    } catch (err) {
      notificationsService.error({ text: apiErrorMessage(err, 'Export failed') });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={isDisabled}
      title='Download as Excel (.xlsx)'
      style={{
        display: 'flex', alignItems: 'center', gap: 8,
        height: 40, padding: '0 16px',
        background: T.white, color: T.gray80,
        border: `1px solid ${T.gray20}`, borderRadius: 8,
        cursor: isDisabled ? 'not-allowed' : 'pointer',
        opacity: isDisabled ? 0.6 : 1,
        fontSize: 14, fontWeight: 500, whiteSpace: 'nowrap',
      }}
    >
      {isExporting ? (
        <span
          className='animate-spin'
          style={{
            width: 14, height: 14, borderRadius: '50%',
            border: `2px solid ${T.gray20}`, borderTopColor: T.primary,
            display: 'inline-block',
          }}
        />
      ) : (
        <DownloadSimple size={16} />
      )}
      {isExporting ? 'Exporting…' : 'Export'}
    </button>
  );
};
