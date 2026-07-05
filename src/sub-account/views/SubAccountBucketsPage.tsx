import { useEffect, useMemo, useRef, useState } from 'react';
import { useDebounce } from 'use-debounce';
import { useNavigate } from 'react-router-dom';
import {
  DotsThreeVerticalIcon,
  EyeIcon,
  HardDrivesIcon,
  PlusIcon,
  TrashIcon,
} from '@phosphor-icons/react';
import { s3Service } from '../../services/s3.service';
import notificationsService from '../../services/notifications.service';
import { SubAccountRegion } from '../../services/buckets.service';
import { isValidBucketName } from '../../utils/isBucketNameValid';
import Button from '../../components/Button';
import Input from '../../components/Input';
import Modal from '../../components/Modal';
import { Dropdown } from '../../components/Dropdown';
import { Switch } from '../../components/Switch';
import { useSubAccountS3Client } from '../hooks/useSubAccountS3Client';
import { S3Client } from '@aws-sdk/client-s3';
import { useSubAccount } from '../context/SubAccountContext';
import { T, shadow, text, form } from '../tokens';
import subAccountAxios from '../core/sub-account-axios';
import { useObjectPagination } from '../hooks/useObjectPagination';
import { Pagination } from '../../components/Pagination';
import { DeleteBucketConfirmModal } from '../components/DeleteBucketConfirmModal';

// ─── Types ───────────────────────────────────────────────────────────────────

interface BucketRecord {
  name: string;
  regionSlug: string;
  visibility: 'public' | 'private';
  creationDate?: Date;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtDate(d?: Date): string {
  if (!d) {
    return '—';
  }
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ─── StatStrip ────────────────────────────────────────────────────────────────

interface StatItem {
  label: string;
  value: string;
  hint: string;
}

const StatStrip = ({ stats }: { stats: StatItem[] }) => (
  <div
    style={{
      background: '#fff',
      border: `1px solid ${T.gray20}`,
      borderRadius: 12,
      boxShadow: shadow.sm,
      display: 'flex',
    }}
  >
    {stats.map((s, i) => (
      <div
        key={s.label}
        style={{
          flex: 1,
          padding: '20px 24px',
          borderLeft: i > 0 ? `1px solid ${T.gray20}` : 'none',
        }}
      >
        <p
          style={{
            fontSize: 12,
            fontWeight: 500,
            color: T.gray60,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            marginBottom: 6,
          }}
        >
          {s.label}
        </p>
        <p
          style={{
            fontSize: 30,
            fontWeight: 700,
            color: T.gray100,
            lineHeight: 1.2,
            marginBottom: 4,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {s.value}
        </p>
        <p style={{ fontSize: 13, color: T.gray50 }}>{s.hint}</p>
      </div>
    ))}
  </div>
);

// ─── Pill ─────────────────────────────────────────────────────────────────────

const Pill = ({ type }: { type: 'public' | 'private' }) => {
  const isPublic = type === 'public';
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '4px 10px',
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 500,
        background: isPublic ? 'rgba(0,102,255,0.08)' : T.gray10,
        color: isPublic ? T.primary : T.gray80,
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: isPublic ? T.primary : T.gray50,
          flexShrink: 0,
        }}
      />
      {isPublic ? 'Public' : 'Private'}
    </span>
  );
};

// ─── BucketRow ────────────────────────────────────────────────────────────────

const GRID = '2fr 1.1fr 1fr 1fr 1fr 40px';

interface BucketRowProps {
  bucket: BucketRecord;
  regionName: string;
  onOpen: () => void;
  onDelete: () => void;
  isAdmin: boolean;
}

const BucketRow = ({ bucket, regionName, onOpen, onDelete, isAdmin }: BucketRowProps) => {
  const [hovered, setHovered] = useState(false);
  const [triggerHovered, setTriggerHovered] = useState(false);

  return (
    <div
      role="row"
      style={{
        display: 'grid',
        gridTemplateColumns: GRID,
        alignItems: 'center',
        padding: '0 24px',
        height: 56,
        borderBottom: `1px solid ${T.gray15}`,
        background: hovered ? T.gray5 : '#fff',
        cursor: 'pointer',
        transition: 'background 120ms',
        position: 'relative',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onOpen}
    >
      {/* Name */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            flexShrink: 0,
            background: 'linear-gradient(135deg, rgba(0,102,255,0.14) 0%, rgba(0,102,255,0.06) 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <HardDrivesIcon size={16} color={T.primary} weight="duotone" />
        </div>
        <span
          style={{
            fontSize: 14,
            fontWeight: 500,
            color: `${T.primary}`,
            textDecoration: hovered ? 'underline' : 'none',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {bucket.name}
        </span>
      </div>

      {/* Region */}
      <span style={{ fontSize: 14, color: T.gray80 }}>{regionName}</span>

      {/* Visibility */}
      <div>
        <Pill type={bucket.visibility} />
      </div>

      {/* Created */}
      <span style={{ fontSize: 14, color: T.gray60 }}>{fmtDate(bucket.creationDate)}</span>

      {/* Empty col for alignment (was objects/size — hidden until usage API available) */}
      <span />

      {/* Actions */}
      <div
        style={{ display: 'flex', justifyContent: 'center' }}
        onClick={(e) => e.stopPropagation()}
      >
        {hovered && isAdmin && (
          <Dropdown
            button={
              <span
                aria-label="Bucket actions"
                title="Bucket actions"
                onMouseEnter={() => setTriggerHovered(true)}
                onMouseLeave={() => setTriggerHovered(false)}
                style={{
                  width: 32,
                  height: 32,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: triggerHovered ? T.gray10 : 'transparent',
                  borderRadius: 6,
                  color: T.gray60,
                }}
              >
                <DotsThreeVerticalIcon size={18} weight="bold" />
              </span>
            }
            items={[
              {
                label: 'View',
                icon: <EyeIcon size={16} color={T.gray60} />,
                onClick: onOpen,
              },
              {
                label: 'Delete bucket',
                icon: <TrashIcon size={16} color="#E50B00" />,
                onClick: onDelete,
              },
            ]}
          />
        )}
      </div>
    </div>
  );
};

// ─── BucketsTable ─────────────────────────────────────────────────────────────

interface BucketsTableProps {
  buckets: BucketRecord[];
  regions: SubAccountRegion[];
  isLoading: boolean;
  search: string;
  onSearchChange: (v: string) => void;
  onOpen: (bucket: BucketRecord) => void;
  onDelete: (bucket: BucketRecord) => void;
  onCreateOpen: () => void;
  isAdmin: boolean;
}

const TABLE_HEADERS = ['Name', 'Region', 'Visibility', 'Created', '', ''];

const BucketsTable = ({
  buckets,
  regions,
  isLoading,
  search,
  onSearchChange,
  onOpen,
  onDelete,
  onCreateOpen,
  isAdmin,
}: BucketsTableProps) => (
  <div
    style={{
      background: '#fff',
      border: `1px solid ${T.gray20}`,
      borderRadius: 12,
      boxShadow: shadow.sm,
      overflow: 'hidden',
    }}
  >
    {/* Card header */}
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '20px 24px',
        gap: 16,
      }}
    >
      <div>
        <p style={{ fontSize: 16, fontWeight: 600, color: T.gray100 }}>Buckets</p>
        <p style={{ fontSize: 13, color: T.gray50, marginTop: 2 }}>
          {buckets.length} {buckets.length === 1 ? 'bucket' : 'buckets'} total
        </p>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 280 }}>
          <Input
            variant="search"
            placeholder="Search buckets..."
            value={search}
            maxLength={63}
            onChange={onSearchChange}
            onClear={() => onSearchChange('')}
          />
        </div>
        {isAdmin && (
          <button
            onClick={onCreateOpen}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              height: 40,
              padding: '0 18px',
              background: T.primary,
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
              fontSize: 14,
              fontWeight: 500,
              whiteSpace: 'nowrap',
            }}
          >
            <PlusIcon size={18} weight="bold" />
            Create bucket
          </button>
        )}
      </div>
    </div>

    {/* Table header */}
    <div
      role="row"
      style={{
        display: 'grid',
        gridTemplateColumns: GRID,
        padding: '10px 24px',
        background: T.gray5,
        borderTop: `1px solid ${T.gray15}`,
        borderBottom: `1px solid ${T.gray15}`,
      }}
    >
      {TABLE_HEADERS.map((h, i) => (
        <span
          key={i}
          style={{
            fontSize: 12,
            fontWeight: 500,
            color: T.gray60,
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
          }}
        >
          {h}
        </span>
      ))}
    </div>

    {/* Body */}
    {isLoading ? (
      <div style={{ padding: '40px 24px', textAlign: 'center', color: T.gray50, fontSize: 14 }}>
        Loading buckets…
      </div>
    ) : buckets.length === 0 ? (
      <div style={{ padding: '56px 24px', textAlign: 'center' }}>
        <p style={{ fontSize: 14, fontWeight: 500, color: T.gray80 }}>No buckets found</p>
        {search && (
          <p style={{ fontSize: 13, color: T.gray50, marginTop: 4 }}>
            Try a different search term
          </p>
        )}
      </div>
    ) : (
      buckets.map((b) => {
        const region = regions.find((r) => r.slug === b.regionSlug);
        return (
          <BucketRow
            key={b.name}
            bucket={b}
            regionName={region?.name ?? b.regionSlug ?? '—'}
            onOpen={() => onOpen(b)}
            onDelete={() => onDelete(b)}
            isAdmin={isAdmin}
          />
        );
      })
    )}
  </div>
);

// ─── CreateBucketModal ────────────────────────────────────────────────────────

interface CreateBucketModalProps {
  isOpen: boolean;
  onClose: () => void;
  regions: SubAccountRegion[];
  credentials: { accessKeyId: string; secretAccessKey: string } | null;
  onCreated: () => void;
}

const CreateBucketModal = ({ isOpen, onClose, regions, credentials, onCreated }: CreateBucketModalProps) => {
  const [bucketName, setBucketName] = useState('');
  const [selectedSlug, setSelectedSlug] = useState('');
  const [versioningEnabled, setVersioningEnabled] = useState(false);
  const [objectLockEnabled, setObjectLockEnabled] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const onToggleVersioning = (next: boolean) => {
    setVersioningEnabled(next);
    if (!next) {
      setObjectLockEnabled(false);
    }
  };

  const selectedRegion = useMemo(
    () => regions.find((r) => r.slug === selectedSlug) ?? regions[0] ?? null,
    [regions, selectedSlug],
  );

  const handleCreate = async () => {
    if (!selectedRegion || !isValidBucketName(bucketName) || !credentials) {
      return;
    }
    setIsCreating(true);
    const regionClient = new S3Client({
      endpoint: `https://${selectedRegion.endpoint}`,
      region: selectedRegion.slug,
      credentials: { accessKeyId: credentials.accessKeyId, secretAccessKey: credentials.secretAccessKey },
      forcePathStyle: true,
    });
    try {
      await s3Service.createBucket(regionClient, bucketName, selectedRegion.slug, objectLockEnabled);
      if (versioningEnabled) {
        try {
          await s3Service.setBucketVersioning(regionClient, bucketName, true);
        } catch (err) {
          notificationsService.error({ text: (err as Error).message });
        }
      }
      setBucketName('');
      setVersioningEnabled(false);
      setObjectLockEnabled(false);
      onCreated();
      onClose();
    } catch (err) {
      notificationsService.error({ text: (err as Error).message });
    } finally {
      regionClient.destroy();
      setIsCreating(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    height: 40,
    padding: '0 12px',
    border: `1px solid ${T.gray20}`,
    borderRadius: 8,
    fontSize: 14,
    color: T.gray100,
    outline: 'none',
    background: T.gray10,
    width: '100%',
    boxSizing: 'border-box',
  };

  return (
    <Modal isOpen={isOpen} onClose={() => !isCreating && onClose()}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, minWidth: 400 }}>
        <p style={{ ...text.heading }}>Create Bucket</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label htmlFor="new-bucket-name" style={{ ...text.label }}>
            Bucket name
          </label>
          <input
            id="new-bucket-name"
            type="text"
            placeholder="my-bucket"
            value={bucketName}
            onChange={(e) => setBucketName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            autoFocus
            style={inputStyle}
          />
          <p style={{ ...form.hint, marginTop: 0, color: bucketName && !isValidBucketName(bucketName) ? T.red : form.hint.color }}>
            3-63 characters, lowercase letters, numbers, dots and hyphens. Must start and end with a letter or number.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label htmlFor="new-bucket-region" style={{ ...text.label }}>
            Region
          </label>
          <select
            id="new-bucket-region"
            value={selectedRegion?.slug ?? ''}
            onChange={(e) => setSelectedSlug(e.target.value)}
            style={{ ...inputStyle, cursor: 'pointer' }}
          >
            {regions.map((r) => (
              <option key={r.slug} value={r.slug}>
                {r.name}
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ ...text.label }}>Bucket Versioning</span>
            <Switch checked={versioningEnabled} onChange={onToggleVersioning} disabled={isCreating} />
          </div>
          <p style={{ fontSize: 13, color: T.gray60, margin: 0 }}>
            When versioning is enabled, you can then retrieve and restore any previous version of an object in the
            bucket. Note: versions of objects are added to your total data storage costs.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ ...text.label }}>Object Locking</span>
            <Switch
              checked={objectLockEnabled}
              onChange={setObjectLockEnabled}
              disabled={isCreating || !versioningEnabled}
            />
          </div>
          <p style={{ fontSize: 13, color: T.gray60, margin: 0 }}>
            {!versioningEnabled
              ? '(Versioning must be enabled) '
              : ''}
            Enabling Object lock will allow you to prevent objects from being overwritten or deleted for a fixed
            amount of time. Toggling this box will permanently enable Object lock functionality for the duration of
            the bucket's existence.
          </p>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <Button variant="secondary" type="button" onClick={onClose} disabled={isCreating}>
            Cancel
          </Button>
          <Button
            type="button"
            disabled={!isValidBucketName(bucketName) || !selectedRegion || isCreating}
            loading={isCreating}
            onClick={handleCreate}
          >
            Create
          </Button>
        </div>
      </div>
    </Modal>
  );
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export const SubAccountBucketsPage = () => {
  const navigate = useNavigate();
  const { entityId, memberId, isAdmin } = useSubAccount();
  const { client, credentials } = useSubAccountS3Client(entityId, memberId);

  const [buckets, setBuckets] = useState<BucketRecord[]>([]);
  const [bucketStats, setBucketStats] = useState({ bucketCount: 0, regionCount: 0 });
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [debouncedSearch] = useDebounce(search, 400);
  const [regions, setRegions] = useState<SubAccountRegion[]>([]);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [bucketToDelete, setBucketToDelete] = useState<BucketRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const loadBucketsAbortRef = useRef<AbortController | null>(null);
  const {
    state: pagination, setPageSize, goToPrevPage, goToNextPage, recordPage, reset: resetPagination,
  } = useObjectPagination();

  const onSearchChange = (v: string) => {
    setSearch(v);
    resetPagination();
  };

  const fetchRegions = () =>
    subAccountAxios.get<SubAccountRegion[]>('/subaccount/regions')
      .then((r) => setRegions(r.data))
      .catch(() => {});

  useEffect(() => { fetchRegions(); }, []);

  const openCreateModal = () => {
    setIsCreateOpen(true);
    fetchRegions();
  };

  useEffect(() => {
    if (client) {
      loadBuckets(client);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [client, pagination.pageSize, pagination.pageNumber, debouncedSearch]);

  useEffect(() => {
    if (client) {
      loadBucketsGeneralStats(client);
    }
  }, [client]);

  const loadBuckets = async (s3: S3Client) => {
    loadBucketsAbortRef.current?.abort();
    const controller = new AbortController();
    loadBucketsAbortRef.current = controller;

    setIsLoading(true);
    try {
      const result = await s3Service.listBuckets(
        s3, pagination.pageMarker?.continuationToken, pagination.pageSize, debouncedSearch || undefined, controller.signal,
      );
      // If the current page has no buckets, go back to the previous page
      // This can happen if the user deletes buckets and the current page becomes empty
      if (result.buckets.length === 0 && pagination.pageNumber > 1) {
        goToPrevPage();
        return;
      }

      recordPage(result);
      setBuckets(await Promise.all(result.buckets.map(async (b) => ({
        name: b.name,
        regionSlug: b.region ?? '',
        creationDate: b.creationDate,
        visibility: await s3Service.getBucketVisibility(s3, b.name, controller.signal),
      }))));
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        notificationsService.error({ text: (err as Error).message });
      }
    } finally {
      if (loadBucketsAbortRef.current === controller) {
        setIsLoading(false);
      }
    }
  };

  const loadBucketsGeneralStats = async (s3: S3Client) => {
    try {
      const regionSlugs = new Set<string>();
      let bucketCount = 0;
      let continuationToken: string | undefined;
      let hasMore = true;
      while (hasMore) {
        const result = await s3Service.listBuckets(s3, continuationToken, 1000);
        bucketCount += result.buckets.length;
        result.buckets.forEach((b) => {
          if (b.region) {
            regionSlugs.add(b.region);
          }
        });
        hasMore = !!result.isTruncated && !!result.continuationToken;
        continuationToken = result.continuationToken;
      }
      setBucketStats({ bucketCount, regionCount: regionSlugs.size });
    } catch (err) {
      notificationsService.error({ text: (err as Error).message });
    }
  };

  const stats: StatItem[] = [
    {
      label: 'Buckets',
      value: String(bucketStats.bucketCount),
      hint: `In ${bucketStats.regionCount} ${bucketStats.regionCount === 1 ? 'region' : 'regions'}`,
    },
    { label: 'Objects stored', value: '—', hint: 'Across all buckets' },
    { label: 'Used storage', value: '—', hint: 'Active data' },
  ];

  const handleOpen = (bucket: BucketRecord) => {
    const region = regions.find((r) => r.slug === bucket.regionSlug);
    const query = region ? `?endpoint=${encodeURIComponent(region.endpoint)}&region=${region.slug}` : '';
    navigate(`/subaccount/buckets/${bucket.name}${query}`);
  };

  const handleDelete = (bucket: BucketRecord) => setBucketToDelete(bucket);

  const confirmDelete = async () => {
    if (!credentials || !bucketToDelete) {
      return;
    }
    const region = regions.find((r) => r.slug === bucketToDelete.regionSlug);
    const regionClient = new S3Client({
      endpoint: `https://${region?.endpoint ?? credentials.endpoint}`,
      region: bucketToDelete.regionSlug,
      credentials: { accessKeyId: credentials.accessKeyId, secretAccessKey: credentials.secretAccessKey },
      forcePathStyle: true,
    });
    setIsDeleting(true);
    try {
      await s3Service.deleteBucket(regionClient, bucketToDelete.name);
      setBuckets((prev) => prev.filter((b) => b.name !== bucketToDelete.name));
      if (client) {
        loadBucketsGeneralStats(client);
      }
      setBucketToDelete(null);
    } catch (err) {
      notificationsService.error({ text: (err as Error).message });
    } finally {
      setIsDeleting(false);
    }
  };

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
      <StatStrip stats={stats} />
      <BucketsTable
        buckets={buckets}
        regions={regions}
        isLoading={isLoading}
        search={search}
        onSearchChange={onSearchChange}
        onOpen={handleOpen}
        onDelete={handleDelete}
        onCreateOpen={openCreateModal}
        isAdmin={isAdmin}
      />
      <Pagination
        pageSize={pagination.pageSize}
        pageSizeOptions={[25, 50, 100]}
        onPageSizeChange={setPageSize}
        pageNumber={pagination.pageNumber}
        hasPrevPage={pagination.hasPrevPage}
        hasNextPage={pagination.hasNextPage}
        onPrev={goToPrevPage}
        onNext={goToNextPage}
        isLoading={isLoading}
      />
      <CreateBucketModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        regions={regions}
        credentials={credentials}
        onCreated={() => {
          if (!client) {
            return;
          }
          loadBuckets(client);
          loadBucketsGeneralStats(client);
        }}
      />
      <DeleteBucketConfirmModal
        isOpen={!!bucketToDelete}
        bucketName={bucketToDelete?.name ?? ''}
        isDeleting={isDeleting}
        onConfirm={confirmDelete}
        onClose={() => !isDeleting && setBucketToDelete(null)}
      />
    </div>
  );
};
