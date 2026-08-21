import { useEffect, useState } from 'react';
import { CheckIcon, CopyIcon } from '@phosphor-icons/react';
import Button from '../../components/Button';
import { copyToClipboard } from '../../utils/copyToClipboard';
import notificationsService from '../../services/notifications.service';
import { T } from '../tokens';

const COPIED_RESET_MS = 2000;

interface ShareLinkProps {
  url: string;
  isFolder: boolean;
}

export const ShareLink = ({ url, isFolder }: ShareLinkProps) => {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), COPIED_RESET_MS);
    return () => clearTimeout(timer);
  }, [copied]);

  const onCopy = async () => {
    await copyToClipboard(url);
    setCopied(true);
    notificationsService.success({ text: 'Link copied to clipboard' });
  };

  return (
    <>
      <p style={{ fontSize: 13, color: T.gray60, margin: 0 }}>
        Anyone with this link can {isFolder ? 'browse and download the contents of this folder' : 'download this file'}.
      </p>
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          type="text"
          readOnly
          value={url}
          onFocus={(e) => e.target.select()}
          style={{
            flex: 1, height: 38, padding: '0 12px',
            border: `1px solid ${T.gray20}`, borderRadius: 8,
            fontSize: 13, color: T.gray80, fontFamily: 'var(--font-mono,monospace)',
          }}
        />
        <Button type="button" onClick={onCopy}>
          {copied ? <CheckIcon size={15} /> : <CopyIcon size={15} />}
          <span>{copied ? 'Copied' : 'Copy'}</span>
        </Button>
      </div>
    </>
  );
};
