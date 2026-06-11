import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DotsThreeVerticalIcon,
  HardDrivesIcon,
  PlusIcon,
  TrashIcon,
} from '@phosphor-icons/react';
import { s3Service } from '../../services/s3.service';
import notificationsService from '../../services/notifications.service';
import { bucketsService, SubAccountRegion } from '../../services/buckets.service';
import { isValidBucketName } from '../../utils/isBucketNameValid';
import Button from '../../components/Button';
import Input from '../../components/Input';
import Modal from '../../components/Modal';
import { useSubAccountS3Client } from '../hooks/useSubAccountS3Client';
import { S3Client } from '@aws-sdk/client-s3';
import { useSubAccount } from '../context/SubAccountContext';

// ─── Types ───────────────────────────────────────────────────────────────────

interface BucketRecord {
  name: string;
  regionSlug: string;
  visibility: 'public' | 'private';
  creationDate?: Date;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtDate(d?: Date): string {
  if (!d) return '—';
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
      border: '1px solid var(--gray-20, #E5E5EB)',
      borderRadius: 12,
      boxShadow: '0 1px 2px 0 rgba(0,0,0,0.05)',
      display: 'flex',
    }}
  >
    {stats.map((s, i) => (
      <div
        key={s.label}
        style={{
          flex: 1,
          padding: '20px 24px',
          borderLeft: i > 0 ? '1px solid var(--gray-20, #E5E5EB)' : 'none',
        }}
      >
        <p
          style={{
            fontSize: 12,
            fontWeight: 500,
            color: 'var(--gray-60, #636367)',
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
            color: 'var(--gray-100, #18181B)',
            lineHeight: 1.2,
            marginBottom: 4,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {s.value}
        </p>
        <p style={{ fontSize: 13, color: 'var(--gray-50, #8E8E94)' }}>{s.hint}</p>
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
        background: isPublic ? 'rgba(0,102,255,0.08)' : 'var(--gray-10, #F3F3F8)',
        color: isPublic ? 'var(--primary, #0066FF)' : 'var(--gray-80, #3A3A3B)',
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: isPublic ? 'var(--primary, #0066FF)' : 'var(--gray-50, #8E8E94)',
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
  const [menuOpen, setMenuOpen] = useState(false);
  const [hovered, setHovered] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const close = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [menuOpen]);

  return (
    <div
      role="row"
      style={{
        display: 'grid',
        gridTemplateColumns: GRID,
        alignItems: 'center',
        padding: '0 24px',
        height: 56,
        borderBottom: '1px solid var(--gray-15, #ECECEC)',
        background: hovered ? 'var(--gray-5, #F9F9FC)' : '#fff',
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
          <HardDrivesIcon size={16} color="var(--primary, #0066FF)" weight="duotone" />
        </div>
        <span
          style={{
            fontSize: 14,
            fontWeight: 500,
            color: 'var(--primary, #0066FF)',
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
      <span style={{ fontSize: 14, color: 'var(--gray-80, #3A3A3B)' }}>{regionName}</span>

      {/* Visibility */}
      <div>
        <Pill type={bucket.visibility} />
      </div>

      {/* Created */}
      <span style={{ fontSize: 14, color: 'var(--gray-60, #636367)' }}>{fmtDate(bucket.creationDate)}</span>

      {/* Empty col for alignment (was objects/size — hidden until usage API available) */}
      <span />

      {/* Actions */}
      <div
        style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}
        onClick={(e) => e.stopPropagation()}
      >
        {(hovered || menuOpen) && (
          <button
            aria-label="Bucket actions"
            title="Bucket actions"
            style={{
              width: 32,
              height: 32,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: menuOpen ? 'var(--gray-10, #F3F3F8)' : 'transparent',
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer',
              color: 'var(--gray-60, #636367)',
            }}
            onClick={() => setMenuOpen((o) => !o)}
          >
            <DotsThreeVerticalIcon size={18} weight="bold" />
          </button>
        )}
        {menuOpen && (
          <div
            ref={menuRef}
            style={{
              position: 'absolute',
              right: 0,
              top: 36,
              zIndex: 50,
              background: '#fff',
              border: '1px solid var(--gray-20, #E5E5EB)',
              borderRadius: 8,
              boxShadow: '0 4px 6px -1px rgba(0,0,0,0.08), 0 2px 4px -1px rgba(0,0,0,0.04)',
              minWidth: 160,
              overflow: 'hidden',
            }}
          >
            {isAdmin && (
              <button
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  width: '100%',
                  padding: '10px 14px',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 14,
                  color: '#E50B00',
                  textAlign: 'left',
                  fontFamily: 'inherit',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#fff5f5'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; }}
                onClick={() => { setMenuOpen(false); onDelete(); }}
              >
                <TrashIcon size={16} />
                Delete bucket
              </button>
            )}
          </div>
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
      border: '1px solid var(--gray-20, #E5E5EB)',
      borderRadius: 12,
      boxShadow: '0 1px 2px 0 rgba(0,0,0,0.05)',
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
        <p style={{ fontSize: 16, fontWeight: 600, color: 'var(--gray-100, #18181B)' }}>Buckets</p>
        <p style={{ fontSize: 13, color: 'var(--gray-50, #8E8E94)', marginTop: 2 }}>
          {buckets.length} {buckets.length === 1 ? 'bucket' : 'buckets'} total
        </p>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 280 }}>
          <Input
            variant="search"
            placeholder="Search buckets..."
            value={search}
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
              background: 'var(--primary, #0066FF)',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
              fontSize: 14,
              fontWeight: 500,
              whiteSpace: 'nowrap',
              fontFamily: 'inherit',
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
        background: 'var(--gray-5, #F9F9FC)',
        borderTop: '1px solid var(--gray-15, #ECECEC)',
        borderBottom: '1px solid var(--gray-15, #ECECEC)',
      }}
    >
      {TABLE_HEADERS.map((h, i) => (
        <span
          key={i}
          style={{
            fontSize: 12,
            fontWeight: 500,
            color: 'var(--gray-60, #636367)',
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
      <div style={{ padding: '40px 24px', textAlign: 'center', color: 'var(--gray-50, #8E8E94)', fontSize: 14 }}>
        Loading buckets…
      </div>
    ) : buckets.length === 0 ? (
      <div style={{ padding: '56px 24px', textAlign: 'center' }}>
        <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--gray-80, #3A3A3B)' }}>No buckets found</p>
        {search && (
          <p style={{ fontSize: 13, color: 'var(--gray-50, #8E8E94)', marginTop: 4 }}>
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
  const [selectedRegion, setSelectedRegion] = useState<SubAccountRegion | null>(regions[0] ?? null);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    if (regions.length > 0 && !selectedRegion) setSelectedRegion(regions[0]);
  }, [regions]);

  const handleCreate = async () => {
    if (!selectedRegion || !isValidBucketName(bucketName) || !credentials) return;
    setIsCreating(true);
    const regionClient = new S3Client({
      endpoint: `https://${selectedRegion.endpoint}`,
      region: selectedRegion.slug,
      credentials: { accessKeyId: credentials.accessKeyId, secretAccessKey: credentials.secretAccessKey },
      forcePathStyle: true,
    });
    try {
      await s3Service.createBucket(regionClient, bucketName, selectedRegion.slug);
      setBucketName('');
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
    border: '1px solid var(--gray-20, #E5E5EB)',
    borderRadius: 8,
    fontSize: 14,
    color: 'var(--gray-100, #18181B)',
    outline: 'none',
    fontFamily: 'inherit',
    background: 'var(--gray-10, #F3F3F8)',
    width: '100%',
    boxSizing: 'border-box',
  };

  return (
    <Modal isOpen={isOpen} onClose={() => !isCreating && onClose()}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, minWidth: 400 }}>
        <p style={{ fontSize: 18, fontWeight: 600, color: 'var(--gray-100, #18181B)' }}>Create Bucket</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label htmlFor="new-bucket-name" style={{ fontSize: 13, fontWeight: 500, color: 'var(--gray-80, #3A3A3B)' }}>
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
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label htmlFor="new-bucket-region" style={{ fontSize: 13, fontWeight: 500, color: 'var(--gray-80, #3A3A3B)' }}>
            Region
          </label>
          <select
            id="new-bucket-region"
            value={selectedRegion?.slug ?? ''}
            onChange={(e) => setSelectedRegion(regions.find((r) => r.slug === e.target.value) ?? null)}
            style={{ ...inputStyle, cursor: 'pointer' }}
          >
            {regions.map((r) => (
              <option key={r.slug} value={r.slug}>
                {r.name}
              </option>
            ))}
          </select>
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
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [regions, setRegions] = useState<SubAccountRegion[]>([]);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  useEffect(() => {
    bucketsService.getSubAccountRegions().then((r) => setRegions(r)).catch(() => {});
  }, []);

  useEffect(() => {
    if (client) loadBuckets(client);
  }, [client]);

  const loadBuckets = async (s3: S3Client) => {
    setIsLoading(true);
    try {
      const list = await s3Service.listBuckets(s3);
      const enriched = await Promise.all(
        list.map(async (b) => {
          const [regionSlug, visibility] = await Promise.all([
            s3Service.getBucketLocation(s3, b.name).catch(() => ''),
            s3Service.getBucketVisibility(s3, b.name),
          ]);
          return { name: b.name, regionSlug, visibility, creationDate: b.creationDate } as BucketRecord;
        }),
      );
      setBuckets(enriched);
    } catch (err) {
      notificationsService.error({ text: (err as Error).message });
    } finally {
      setIsLoading(false);
    }
  };

  const filtered = useMemo(
    () => buckets.filter((b) => b.name.toLowerCase().includes(search.toLowerCase())),
    [buckets, search],
  );

  const stats = useMemo((): StatItem[] => {
    const uniqueRegions = new Set(buckets.map((b) => b.regionSlug).filter(Boolean));
    return [
      {
        label: 'Buckets',
        value: String(buckets.length),
        hint: `In ${uniqueRegions.size} ${uniqueRegions.size === 1 ? 'region' : 'regions'}`,
      },
      { label: 'Objects stored', value: '—', hint: 'Across all buckets' },
      { label: 'Used storage', value: '—', hint: 'Active data' },
    ];
  }, [buckets]);

  const handleOpen = (bucket: BucketRecord) => {
    const region = regions.find((r) => r.slug === bucket.regionSlug);
    const query = region ? `?endpoint=${encodeURIComponent(region.endpoint)}&region=${region.slug}` : '';
    navigate(`/subaccount/buckets/${bucket.name}${query}`);
  };

  const handleDelete = async (bucket: BucketRecord) => {
    if (!client) return;
    if (!window.confirm(`Delete bucket "${bucket.name}"? This action cannot be undone.`)) return;
    try {
      await s3Service.deleteBucket(client, bucket.name);
      setBuckets((prev) => prev.filter((b) => b.name !== bucket.name));
    } catch (err) {
      notificationsService.error({ text: (err as Error).message });
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
        buckets={filtered}
        regions={regions}
        isLoading={isLoading}
        search={search}
        onSearchChange={setSearch}
        onOpen={handleOpen}
        onDelete={handleDelete}
        onCreateOpen={() => setIsCreateOpen(true)}
        isAdmin={isAdmin}
      />
      <CreateBucketModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        regions={regions}
        credentials={credentials}
        onCreated={() => client && loadBuckets(client)}
      />
    </div>
  );
};
