import { FolderIcon } from '@phosphor-icons/react';
import { ShareListItem } from '../../services/public-share.service';
import { T } from '../../sub-account/tokens';
import { CenteredMessage } from './CenteredMessage';
import { ObjectRow } from './ObjectRow';

interface FolderListingProps {
  objects: ShareListItem[];
  isLoading: boolean;
  downloadingKey: string | null;
  onOpenFolder: (key: string) => void;
  onDownload: (key: string) => void;
}

export const FolderListing = ({ objects, isLoading, downloadingKey, onOpenFolder, onDownload }: FolderListingProps) => {
  if (isLoading) {
    return (
      <div style={{ padding: '40px 20px', textAlign: 'center', color: T.gray50, fontSize: 14 }}>
        Loading objects…
      </div>
    );
  }

  if (objects.length === 0) {
    return (
      <CenteredMessage
        icon={<FolderIcon size={28} color={T.gray50} />}
        title="This folder is empty"
        subtitle="There is nothing to download here yet."
      />
    );
  }

  return (
    <div>
      {objects.map((obj) => (
        <ObjectRow
          key={obj.key}
          obj={obj}
          isDownloading={downloadingKey === obj.key}
          onOpen={() => onOpenFolder(obj.key)}
          onDownload={() => onDownload(obj.key)}
        />
      ))}
    </div>
  );
};
