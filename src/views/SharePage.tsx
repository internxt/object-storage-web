import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { HttpStatusCode } from 'axios';
import { DownloadSimpleIcon, FileIcon, FolderIcon, LinkBreakIcon } from '@phosphor-icons/react';
import Button from '../components/Button';
import Loader from '../components/Loader';
import { Pagination } from '../components/Pagination';
import { Breadcrumb, ROOT_SEGMENT_INDEX } from '../components/share/Breadcrumb';
import { CenteredMessage } from '../components/share/CenteredMessage';
import { FolderListing } from '../components/share/FolderListing';
import { useObjectPagination } from '../sub-account/hooks/useObjectPagination';
import {
  shareService,
  ShareListItem,
  ShareMetadata,
} from '../services/share.service';
import { subAccountAuthService } from '../sub-account/services/sub-account-auth.service';
import { hasApiErrorStatus } from '../utils/apiError';
import { T, card } from '../sub-account/tokens';

const PAGE_VERTICAL_PADDING = 48;

const isFolderShare = (meta: ShareMetadata) => meta.type === 'folder';

export const SharePage = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [metadata, setMetadata] = useState<ShareMetadata | null>(null);
  const [isNotFound, setIsNotFound] = useState(false);
  const [objects, setObjects] = useState<ShareListItem[]>([]);
  const [currentPrefix, setCurrentPrefix] = useState<string | null>(null);
  const [isListLoading, setIsListLoading] = useState(false);
  const {
    state: pagination, goToPrevPage, goToNextPage, recordPage, reset: resetPagination,
  } = useObjectPagination();

  const onShareError = (err: unknown) => {
    if (hasApiErrorStatus(err, HttpStatusCode.Forbidden)) {
      subAccountAuthService.logOut();
      const redirect = encodeURIComponent(`/share/${token}`);
      navigate(`/subaccount/login?redirect=${redirect}`, { replace: true });
      return;
    }
    setIsNotFound(true);
  };

  useEffect(() => {
    if (!token) return;
    const fetchMetadata = async () => {
      try {
        const meta = await shareService.getMetadata(token);
        setMetadata(meta);
        if (isFolderShare(meta)) setCurrentPrefix(meta.prefix ?? null);
      } catch (err) {
        onShareError(err);
      }
    };
    fetchMetadata();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const loadList = async (prefix: string, cursor?: string) => {
    if (!token) return;
    setIsListLoading(true);
    try {
      const result = await shareService.list(token, prefix, cursor);
      setObjects(result.objects);
      recordPage({
        isTruncated: result.nextCursor !== null,
        continuationToken: result.nextCursor ?? undefined,
      });
    } catch (err) {
      onShareError(err);
    } finally {
      setIsListLoading(false);
    }
  };

  // Changing pageNumber selects a different pageMarker, so it is what triggers fetching
  // prev/next pages. `loadList` is intentionally omitted: it is recreated every render.
  useEffect(() => {
    if (currentPrefix !== null) loadList(currentPrefix, pagination.pageMarker?.continuationToken);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPrefix, pagination.pageNumber]);

  const openFolder = (key: string) => {
    resetPagination();
    setCurrentPrefix(key);
  };

  const onDownload = async (key?: string) => {
    if (!token) return;
    try {
      const url = await shareService.download(token, key);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.click();
    } catch (err) {
      onShareError(err);
    }
  };

  const sharedRoot = metadata?.prefix ?? '';
  const relativeSegments =
    currentPrefix !== null && currentPrefix.length > sharedRoot.length
      ? currentPrefix.slice(sharedRoot.length).split('/').filter(Boolean)
      : [];

  const goToSegment = (index: number) => {
    if (index === ROOT_SEGMENT_INDEX) {
      openFolder(sharedRoot);
      return;
    }
    const path = relativeSegments.slice(0, index + 1).join('/');
    openFolder(`${sharedRoot}${path}/`);
  };

  let body: React.ReactNode;
  if (isNotFound) {
    body = (
      <CenteredMessage
        icon={<LinkBreakIcon size={28} color={T.gray50} />}
        title="This link doesn't exist"
        subtitle="The share link is invalid, was revoked or is no longer available."
      />
    );
  } else if (!metadata) {
    body = (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '64px 0' }}>
        <Loader type="spinner" size={28} />
      </div>
    );
  } else if (!isFolderShare(metadata)) {
    body = (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, padding: '48px 24px' }}>
        <p style={{ fontSize: 14, color: T.gray60, margin: 0 }}>You have been given access to download this file.</p>
        <Button type="button" onClick={() => onDownload()}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <DownloadSimpleIcon size={16} weight="bold" />
            Download
          </span>
        </Button>
      </div>
    );
  } else {
    body = (
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        {relativeSegments.length > 0 && (
          <Breadcrumb rootName={metadata.name} segments={relativeSegments} onNavigate={goToSegment} />
        )}
        <Pagination
          pageNumber={pagination.pageNumber}
          hasPrevPage={pagination.hasPrevPage}
          hasNextPage={pagination.hasNextPage}
          onPrev={goToPrevPage}
          onNext={goToNextPage}
          isLoading={isListLoading}
        />
        <div style={{ overflowY: 'auto' }}>
          <FolderListing
            objects={objects}
            isLoading={isListLoading}
            onOpenFolder={openFolder}
            onDownload={onDownload}
          />
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: T.gray5, padding: `${PAGE_VERTICAL_PADDING}px 16px` }}>
      <div style={{
        ...card, maxWidth: 720, margin: '0 auto', padding: 0, overflow: 'hidden',
        display: 'flex', flexDirection: 'column', maxHeight: `calc(100vh - ${PAGE_VERTICAL_PADDING * 2}px)`,
      }}>
        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: `1px solid ${T.gray15}`, display: 'flex', alignItems: 'center', gap: 12 }}>
          {metadata && isFolderShare(metadata)
            ? <FolderIcon size={22} color={T.primary} weight="fill" />
            : <FileIcon size={22} color={T.gray50} />}
          <div style={{ minWidth: 0 }}>
            <p style={{ fontSize: 15, fontWeight: 600, color: T.gray100, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {metadata?.name ?? 'Shared content'}
            </p>
            <p style={{ fontSize: 12, color: T.gray50, margin: 0 }}>Shared via Internxt Object Storage</p>
          </div>
        </div>

        {body}
      </div>
    </div>
  );
};
