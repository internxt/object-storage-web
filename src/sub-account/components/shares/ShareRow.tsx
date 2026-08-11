import { useState } from 'react';
import { FileIcon, FolderIcon, TrashIcon } from '@phosphor-icons/react';
import { IconButton } from '../../../components/IconButton';
import { formatDateTime } from '../../../utils/formatDate';
import { displayName } from '../../../utils/displayName';
import { T, text } from '../../tokens';
import { ShareListItem } from '../../services/share.service';
import { LABELS, shareResourcePath, shareTypeLabel } from './constants';
import { bodyRow, ellipsis, iconTile } from './styles';

interface ShareRowProps {
  share: ShareListItem;
  canRevoke: boolean;
  onRevoke: () => void;
}

export const ShareRow = ({ share, canRevoke, onRevoke }: ShareRowProps) => {
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

      <span style={{ ...text.body, ...ellipsis }}>{share.creator || LABELS.noValue}</span>

      <span style={text.body}>{shareTypeLabel(share)}</span>

      <span style={{ ...text.body, color: T.gray60 }}>{formatDateTime(new Date(share.createdAt))}</span>
      <span style={{ display: 'flex', justifyContent: 'center' }}>
        {isRowHovered && canRevoke && (
          <IconButton title={LABELS.revokeTitle} onClick={onRevoke} style={{ color: T.gray60 }}>
            <TrashIcon size={16} />
          </IconButton>
        )}
      </span>
    </div>
  );
};
