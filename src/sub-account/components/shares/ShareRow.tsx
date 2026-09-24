import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FileIcon, FolderIcon, TrashIcon } from '@phosphor-icons/react';
import { IconButton } from '../../../components/IconButton';
import { formatDateTime } from '../../../utils/formatDate';
import { displayName } from '../../../utils/displayName';
import { T, text } from '../../tokens';
import { ShareListItem } from '../../services/share.service';
import { NO_VALUE, shareResourcePath, shareTypeLabelKey } from './constants';
import { bodyRow, ellipsis, iconTile } from './styles';

interface ShareRowProps {
  share: ShareListItem;
  onRevoke: () => void;
}

export const ShareRow = ({ share, onRevoke }: ShareRowProps) => {
  const { t } = useTranslation('subaccount');
  const [isRowHovered, setIsRowHovered] = useState(false);
  const Icon = share.isFolder ? FolderIcon : FileIcon;
  const path = shareResourcePath(share);

  return (
    <div
      role="row"
      style={{ ...bodyRow, background: isRowHovered ? T.gray5 : T.white }}
      onMouseEnter={() => setIsRowHovered(true)}
      onMouseLeave={() => setIsRowHovered(false)}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
        <div style={iconTile}>
          <Icon size={16} color={T.primary} weight="duotone" />
        </div>
        <div style={{ minWidth: 0 }}>
          <p style={{ ...text.bodyMed, ...ellipsis }} title={path}>
            {displayName(share.objectKey)}
          </p>
          <p style={{ ...text.caption, ...ellipsis }}>{path}</p>
        </div>
      </div>

      <span style={{ ...text.body, ...ellipsis }}>{share.creator || NO_VALUE}</span>

      <span style={text.body}>{t(shareTypeLabelKey(share))}</span>

      <span style={{ ...text.body, color: T.gray60 }}>{formatDateTime(new Date(share.createdAt))}</span>
      <span style={{ display: 'flex', justifyContent: 'center' }}>
        {isRowHovered && (
          <IconButton title={t('shares.revokeTitle')} onClick={onRevoke} style={{ color: T.gray60 }}>
            <TrashIcon size={16} />
          </IconButton>
        )}
      </span>
    </div>
  );
};
