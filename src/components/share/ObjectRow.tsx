import { CSSProperties } from 'react';
import { DownloadSimpleIcon, FileIcon, FolderIcon } from '@phosphor-icons/react';
import prettyBytes from 'pretty-bytes';
import Loader from '../Loader';
import { ShareListItem } from '../../services/public-share.service';
import { displayName } from '../../utils/displayName';
import { T } from '../../sub-account/tokens';

const rowStyle: CSSProperties = {
  display: 'grid', gridTemplateColumns: '24px 1fr 100px 40px', alignItems: 'center', gap: 10,
  padding: '0 24px', height: 48, borderBottom: `1px solid ${T.gray15}`,
};

const nameStyle: CSSProperties = {
  fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
};

const sizeStyle: CSSProperties = {
  fontSize: 13, color: T.gray60, textAlign: 'right',
};

interface ObjectRowProps {
  obj: ShareListItem;
  isDownloading: boolean;
  onOpen: () => void;
  onDownload: () => void;
}

export const ObjectRow = ({ obj, isDownloading, onOpen, onDownload }: ObjectRowProps) => {
  if (obj.isFolder) {
    return (
      <button
        type="button"
        onClick={onOpen}
        style={{
          ...rowStyle, width: '100%', textAlign: 'left', background: 'none',
          border: 'none', borderBottom: `1px solid ${T.gray15}`,
          cursor: 'pointer', fontFamily: 'inherit',
        }}
      >
        <FolderIcon size={18} color={T.primary} weight="fill" />
        <span style={{ ...nameStyle, color: T.primary, fontWeight: 500 }}>
          {displayName(obj.key)}
        </span>
        <span style={sizeStyle}>—</span>
      </button>
    );
  }

  return (
    <div style={rowStyle}>
      <FileIcon size={18} color={T.gray50} />
      <span style={{ ...nameStyle, color: T.gray80, fontWeight: 400 }}>
        {displayName(obj.key)}
      </span>
      <span style={sizeStyle}>{prettyBytes(obj.size)}</span>
      <button
        type="button"
        aria-label={`Download ${displayName(obj.key)}`}
        disabled={isDownloading}
        onClick={onDownload}
        style={{
          width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: 'none', background: 'none', borderRadius: 6,
          cursor: isDownloading ? 'default' : 'pointer', color: T.gray60,
        }}
      >
        {isDownloading ? <Loader type="spinner" size={16} /> : <DownloadSimpleIcon size={16} />}
      </button>
    </div>
  );
};
