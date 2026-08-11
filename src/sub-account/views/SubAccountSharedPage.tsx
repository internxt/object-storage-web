import { useEffect, useMemo, useState } from 'react';
import notificationsService from '../../services/notifications.service';
import { apiErrorMessage } from '../../utils/apiError';
import Dialog from '../../components/Dialog';
import { Pagination } from '../../components/Pagination';
import { useSubAccount } from '../context/SubAccountContext';
import { shareService, ShareListItem } from '../services/share.service';
import { SharesTable } from '../components/shares/SharesTable';
import { LABELS, shareResourcePath } from '../components/shares/constants';

const PAGE_SIZE_OPTIONS = [25, 50, 100];
const DEFAULT_PAGE_SIZE = 100;
const LOAD_ERROR_MESSAGE = 'Could not load shared links';

export const SubAccountSharedPage = () => {
  const { entityId, memberId, isAdmin } = useSubAccount();

  const [shares, setShares] = useState<ShareListItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [shareToRevoke, setShareToRevoke] = useState<ShareListItem | null>(null);
  const [isRevoking, setIsRevoking] = useState(false);

  const confirmRevoke = async () => {
    if (!shareToRevoke || !entityId) return;
    setIsRevoking(true);
    try {
      await shareService.revokeShare(entityId, shareToRevoke.id);
      setShares((prev) => prev.filter((share) => share.id !== shareToRevoke.id));
      notificationsService.success({ text: LABELS.revokeSuccess });
      setShareToRevoke(null);
    } catch (err) {
      notificationsService.error({ text: apiErrorMessage(err, LABELS.revokeError) });
    } finally {
      setIsRevoking(false);
    }
  };

  useEffect(() => {
    if (!entityId) return;
    setIsLoading(true);
    shareService
      .listShares(entityId)
      .then(setShares)
      .catch((err) => {
        notificationsService.error({ text: apiErrorMessage(err, LOAD_ERROR_MESSAGE) });
      })
      .finally(() => setIsLoading(false));
  }, [entityId]);

  const onSearchChange = (value: string) => {
    setSearch(value);
    setPageNumber(1);
  };

  const onPageSizeChange = (size: number) => {
    setPageSize(size);
    setPageNumber(1);
  };

  const filteredShares = useMemo(() => {
    const query = search.toLowerCase().trim();
    if (!query) return shares;
    return shares.filter(
      (share) =>
        shareResourcePath(share).toLowerCase().includes(query) || share.creator.toLowerCase().includes(query),
    );
  }, [shares, search]);

  const pageCount = Math.max(1, Math.ceil(filteredShares.length / pageSize));

  useEffect(() => {
    if (pageNumber > pageCount) {
      setPageNumber(pageCount);
    }
  }, [pageNumber, pageCount]);

  const pagedShares = useMemo(
    () => filteredShares.slice((pageNumber - 1) * pageSize, pageNumber * pageSize),
    [filteredShares, pageNumber, pageSize],
  );

  const revokeTargetPath = shareToRevoke ? shareResourcePath(shareToRevoke) : '';

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        maxWidth: 1200,
        margin: '0 auto',
        width: '100%',
        padding: '8px 0 32px',
      }}
    >
      <SharesTable
        shares={pagedShares}
        totalCount={filteredShares.length}
        isLoading={isLoading}
        search={search}
        onSearchChange={onSearchChange}
        currentMemberId={memberId}
        isAdmin={isAdmin}
        onRevoke={setShareToRevoke}
      />
      <Pagination
        pageSize={pageSize}
        pageSizeOptions={PAGE_SIZE_OPTIONS}
        onPageSizeChange={onPageSizeChange}
        pageNumber={pageNumber}
        hasPrevPage={pageNumber > 1}
        hasNextPage={pageNumber < pageCount}
        onPrev={() => setPageNumber((n) => Math.max(1, n - 1))}
        onNext={() => setPageNumber((n) => Math.min(pageCount, n + 1))}
        isLoading={isLoading}
      />
      <Dialog
        isOpen={!!shareToRevoke}
        onClose={() => setShareToRevoke(null)}
        onPrimaryAction={confirmRevoke}
        onSecondaryAction={() => setShareToRevoke(null)}
        isLoading={isRevoking}
        primaryAction={LABELS.revokeConfirm}
        secondaryAction="Cancel"
        primaryActionColor="danger"
        title={LABELS.revokeTitle}
        subtitle={`The public link for ${revokeTargetPath} will stop working immediately.`}
      />
    </div>
  );
};
