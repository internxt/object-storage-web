import { ReactNode, useEffect, useState } from 'react';
import axios from 'axios';
import Modal from '../../components/Modal';
import Button from '../../components/Button';
import Loader from '../../components/Loader';
import { S3Object } from '../../services/s3.service';
import { shareService } from '../services/share.service';
import { useSubAccount } from '../context/SubAccountContext';
import { displayName } from '../../utils/displayName';
import { ShareLink } from './ShareLink';
import { text } from '../tokens';

interface ShareModalProps {
  obj: S3Object;
  bucket: string;
  endpoint?: string;
  region?: string;
  onClose: () => void;
}

export const ShareModal = ({ obj, bucket, endpoint, region, onClose }: ShareModalProps) => {
  const { entityId } = useSubAccount();
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!entityId) return;
    let cancelled = false;
    const createShare = async () => {
      try {
        const share = await shareService.createShare(entityId, {
          bucket, key: obj.key, isFolder: obj.isFolder, endpoint, region,
        });
        if (!cancelled) setUrl(`${window.location.origin}/share/${share.token}`);
      } catch (err) {
        if (cancelled) return;
        const isForbidden = axios.isAxiosError(err) && err.response?.status === 403;
        setError(
          isForbidden
            ? "You don't have access to this resource."
            : 'Could not create the share link. Please try again.',
        );
      }
    };
    createShare();
    return () => {
      cancelled = true;
    };
  }, [entityId, bucket, obj.key, obj.isFolder, endpoint, region]);

  let body: ReactNode;
  if (error) {
    body = <p style={{ fontSize: 14, color: 'var(--red,#E03131)', margin: 0 }}>{error}</p>;
  } else if (!url) {
    body = (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0' }}>
        <Loader type="spinner" size={24} />
      </div>
    );
  } else {
    body = <ShareLink url={url} isFolder={obj.isFolder} />;
  }

  return (
    <Modal isOpen onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, minWidth: 440 }}>
        <p style={{ ...text.heading, margin: 0 }}>
          Share {obj.isFolder ? 'folder' : 'file'} “{displayName(obj.key)}”
        </p>

        {body}

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button variant="secondary" type="button" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};
