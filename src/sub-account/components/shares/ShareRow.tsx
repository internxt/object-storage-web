import { useState } from 'react';
import { FileIcon, FolderIcon } from '@phosphor-icons/react';
import { formatDateTime } from '../../../utils/formatDate';
import { displayName } from '../../../utils/displayName';
import { T, text } from '../../tokens';
import { ShareListItem } from '../../services/share.service';
import { LABELS, shareResourcePath, shareTypeLabel } from './constants';
import { bodyRow, ellipsis, iconTile } from './styles';

export const ShareRow = ({ share }: { share: ShareListItem }) => {
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
    </div>
  );
};
