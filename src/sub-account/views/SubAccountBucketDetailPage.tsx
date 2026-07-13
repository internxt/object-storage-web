import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeftIcon,
  CaretRightIcon,
  DatabaseIcon,
  DotsThreeIcon,
  FileIcon,
  FileImageIcon,
  FileTextIcon,
  FileVideoIcon,
  FileZipIcon,
  FolderIcon,
  FolderPlusIcon,
  TrashIcon,
  UploadSimpleIcon,
  DotsThreeVerticalIcon,
  DownloadSimpleIcon,
  CopyIcon,
} from '@phosphor-icons/react';
import prettyBytes from 'pretty-bytes';
import { S3Object, s3Service, isAccessDeniedError, RetentionMode, VersioningStatus } from '../../services/s3.service';
import notificationsService from '../../services/notifications.service';
import { UploadModal } from '../../components/objects/UploadModal';
import { FileDetailsPanel } from '../../components/objects/FileDetailsPanel';
import Modal from '../../components/Modal';
import Button from '../../components/Button';
import Dialog from '../../components/Dialog';
import Loader from '../../components/Loader';
import Input from '../../components/Input';
import { Dropdown } from '../../components/Dropdown';
import { Pagination } from '../../components/Pagination';
import { VersioningControl } from '../../components/buckets/VersioningControl';
import { ObjectLockingControl } from '../../components/buckets/ObjectLockingControl';
import { BucketLoggingSetup } from '../../components/buckets/BucketLoggingSetup';
import { Switch } from '../../components/Switch';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { useSubAccountS3Client, useOnS3ClientReadyEffect } from '../hooks/useSubAccountS3Client';
import { useObjectPagination } from '../hooks/useObjectPagination';
import { useFileRetention } from '../hooks/useFileRetention';
import { useSubAccount } from '../context/SubAccountContext';
import { DeleteBucketConfirmModal } from '../components/DeleteBucketConfirmModal';
import { RetentionConfirmModal } from '../components/RetentionConfirmModal';
import { T, shadow, text } from '../tokens';
import { S3Client } from '@aws-sdk/client-s3';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function displayName(key: string): string {
  return key.replace(/\/$/, '').split('/').filter(Boolean).pop() ?? key;
}

function versionRowId(obj: S3Object): string {
  return `${obj.key}::${obj.versionId ?? ''}`;
}

function fmtDate(d: Date): string {
  const date = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  const time = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  return `${date}, ${time}`;
}

function getFileIcon(name: string) {
  const ext = name.split('.').pop()?.toLowerCase() ?? '';
  if (['mp4', 'mov', 'avi', 'mkv', 'webm'].includes(ext))
    return <FileVideoIcon size={18} color={T.gray50} />;
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'avif'].includes(ext))
    return <FileImageIcon size={18} color={T.gray50} />;
  if (['zip', 'tar', 'gz', 'rar', '7z'].includes(ext))
    return <FileZipIcon size={18} color={T.gray50} />;
  if (['txt', 'md', 'csv', 'log', 'json', 'yaml', 'yml', 'xml', 'pdf'].includes(ext))
    return <FileTextIcon size={18} color={T.gray50} />;
  return <FileIcon size={18} color={T.gray50} />;
}

// ─── Design primitives ────────────────────────────────────────────────────────

const Pill = ({ type }: { type: 'public' | 'private' }) => {
  const pub = type === 'public';
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '4px 10px', borderRadius: 999, fontSize: 12, fontWeight: 500,
      background: pub ? 'rgba(0,102,255,0.08)' : T.gray10,
      color: pub ? T.primary : T.gray80,
    }}>
      <span style={{
        width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
        background: pub ? T.primary : T.gray50,
      }} />
      {pub ? 'Public' : 'Private'}
    </span>
  );
};

const ReadField = ({ label, value, mono = false, fullWidth = false }:
  { label: string; value: string; mono?: boolean; fullWidth?: boolean }) => (
  <div style={{ gridColumn: fullWidth ? '1 / -1' : undefined, display: 'flex', flexDirection: 'column', gap: 4 }}>
    <span style={{
      fontSize: 12, fontWeight: 500, color: T.gray60,
      letterSpacing: '0.04em', textTransform: 'uppercase',
    }}>{label}</span>
    <span style={{
      fontSize: 14, color: T.gray100, lineHeight: 1.5,
      fontFamily: mono ? 'var(--font-mono,monospace)' : undefined,
      wordBreak: 'break-all',
    }}>
      {value || '—'}
    </span>
  </div>
);

const ConfigError = ({ section }: { section: string }) => (
  <div className="flex max-w-[480px] flex-col gap-2 rounded-xl border border-[#fecaca] bg-[#fef2f2] p-4">
    <span className="text-xs font-medium uppercase tracking-wider text-[var(--red,#E03131)]">
      {section}
    </span>
    <p className="m-0 text-[13px] leading-normal text-[var(--gray-60,#636367)]">
      There was an error loading the configuration for this section. Please try again.
    </p>
  </div>
);

// ─── Breadcrumb ───────────────────────────────────────────────────────────────

const Breadcrumb = ({ bucketName, prefix, onBuckets, onBucket, onSegment }: {
  bucketName: string; prefix: string;
  onBuckets: () => void; onBucket: () => void; onSegment: (p: string) => void;
}) => {
  const parts = prefix ? prefix.split('/').filter(Boolean) : [];

  const crumb = (label: string, active: boolean, onClick?: () => void) => (
    <button
      key={label}
      onClick={active ? undefined : onClick}
      style={{
        fontSize: 13, fontWeight: 500, cursor: active ? 'default' : 'pointer',
        color: active ? T.gray100 : T.gray50,
        background: 'none', border: 'none', padding: 0,
        whiteSpace: 'nowrap',
      }}
      onMouseEnter={e => !active && (e.currentTarget.style.color = T.gray80)}
      onMouseLeave={e => !active && (e.currentTarget.style.color = T.gray50)}
    >
      {label}
    </button>
  );

  const sep = <CaretRightIcon size={12} color={T.gray50} style={{ flexShrink: 0 }} />;

  const segPrefixAt = (i: number) => parts.slice(0, i + 1).join('/') + '/';

  // Collapse middle segments into a dropdown once there's more than one to hide,
  // keeping the first segment after the bucket and the last two (parent + active).
  const collapse = parts.length > 3;
  const hiddenParts = collapse
    ? parts.slice(1, parts.length - 2).map((seg, idx) => ({ seg, i: idx + 1 }))
    : [];
  const visibleParts = (collapse
    ? [parts[0], parts[parts.length - 2], parts[parts.length - 1]]
    : parts
  ).map((seg, idx) => ({ seg, i: collapse ? [0, parts.length - 2, parts.length - 1][idx] : idx }));

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
      {crumb('Buckets', false, onBuckets)}
      {sep}
      {crumb(bucketName, parts.length === 0, parts.length ? onBucket : undefined)}
      {visibleParts.map(({ seg, i }, idx) => {
        const isLast = i === parts.length - 1;
        return (
          <span key={i} style={{ display: 'contents' }}>
            {sep}
            {collapse && idx === 1 && hiddenParts.length > 0 && (
              <>
                <Dropdown
                  button={
                    <span
                      aria-label="Show hidden folders"
                      title="Show hidden folders"
                      style={{
                        display: 'flex', alignItems: 'center', color: T.gray50, cursor: 'pointer',
                      }}
                    >
                      <DotsThreeIcon size={16} weight="bold" />
                    </span>
                  }
                  items={hiddenParts.map(({ seg: hSeg, i: hIdx }) => ({
                    label: hSeg,
                    onClick: () => onSegment(segPrefixAt(hIdx)),
                  }))}
                />
                {sep}
              </>
            )}
            {crumb(seg, isLast, () => onSegment(segPrefixAt(i)))}
          </span>
        );
      })}
    </div>
  );
};

// ─── ObjectRow ────────────────────────────────────────────────────────────────

const GRID_COLS = '24px 2.2fr 1.2fr 1fr 40px';
const GRID_COLS_VERSIONS = '24px 2.2fr 1.2fr 1fr 1.2fr 40px';

interface ObjectRowProps {
  obj: S3Object;
  selected: boolean;
  showVersions: boolean;
  onSelect: (v: boolean) => void;
  onFolderClick: (prefix: string) => void;
  onFileClick: (obj: S3Object) => void;
  onDownload: (obj: S3Object) => void;
  onDelete: (obj: S3Object) => void;
  onCopyPath: (obj: S3Object) => void;
}

const ObjectRow = ({ obj, selected, showVersions, onSelect, onFolderClick, onFileClick, onDownload, onDelete, onCopyPath }: ObjectRowProps) => {
  const [hovered, setHovered] = useState(false);
  const [triggerHovered, setTriggerHovered] = useState(false);
  const name = displayName(obj.key);

  return (
    <div
      role="row"
      style={{
        display: 'grid', gridTemplateColumns: showVersions ? GRID_COLS_VERSIONS : GRID_COLS, alignItems: 'center',
        padding: '0 16px', height: 52,
        borderBottom: `1px solid ${T.gray15}`,
        background: selected ? 'rgba(0,102,255,0.04)' : hovered ? T.gray5 : '#fff',
        transition: 'background 100ms', cursor: 'pointer', position: 'relative',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => obj.isFolder ? onFolderClick(obj.key) : onFileClick(obj)}
    >
      {/* Checkbox */}
      <div onClick={e => e.stopPropagation()} style={{ display: 'flex', alignItems: 'center' }}>
        <input
          type="checkbox" checked={selected}
          onChange={e => onSelect(e.target.checked)}
          style={{ cursor: 'pointer', width: 16, height: 16 }}
          aria-label={`Select ${name}`}
        />
      </div>

      {/* Name */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
        {obj.isFolder
          ? <FolderIcon size={18} color={T.primary} weight="fill" />
          : getFileIcon(name)
        }
        <span style={{
          fontSize: 14, fontWeight: obj.isFolder ? 500 : 400,
          color: obj.isFolder ? T.primary : T.gray80,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          textDecoration: hovered && obj.isFolder ? 'underline' : 'none',
        }}>
          {name}
        </span>
      </div>

      {/* Size */}
      <span style={{ fontSize: 13, color: T.gray60, fontVariantNumeric: 'tabular-nums' }}>
        {obj.isFolder ? '—' : prettyBytes(obj.size)}
      </span>

      {/* Last modified */}
      <span style={{ fontSize: 13, color: T.gray60 }}>
        {obj.isFolder ? '—' : fmtDate(obj.lastModified)}
      </span>

      {/* Version ID */}
      {showVersions && (
        <span style={{
          fontSize: 12, color: T.gray60, fontFamily: 'var(--font-mono,monospace)',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {!obj.isFolder && obj.versionId && obj.versionId !== 'null' ? obj.versionId : '—'}
        </span>
      )}

      {/* Actions */}
      <div
        style={{ display: 'flex', justifyContent: 'center' }}
        onClick={e => e.stopPropagation()}
      >
        {hovered && (
          <Dropdown
            button={
              <span
                aria-label="Object actions" title="Object actions"
                onMouseEnter={() => setTriggerHovered(true)}
                onMouseLeave={() => setTriggerHovered(false)}
                style={{
                  width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: triggerHovered ? T.gray10 : 'transparent',
                  borderRadius: 6, color: T.gray60,
                }}
              >
                <DotsThreeVerticalIcon size={18} weight="bold" />
              </span>
            }
            items={[
              ...(!obj.isFolder ? [{
                label: 'Download',
                icon: <DownloadSimpleIcon size={15} />,
                onClick: () => onDownload(obj),
              }] : []),
              {
                label: 'Copy path',
                icon: <CopyIcon size={15} />,
                onClick: () => onCopyPath(obj),
              },
              {
                label: 'Delete',
                icon: <TrashIcon size={15} color="#E50B00" />,
                onClick: () => onDelete(obj),
              },
            ]}
          />
        )}
      </div>
    </div>
  );
};

// ─── EmptyState ───────────────────────────────────────────────────────────────

const EmptyState = ({ searchQuery, onCreateFolder, onUpload }:
  { searchQuery: string; onCreateFolder: () => void; onUpload: () => void }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '56px 24px', gap: 12 }}>
    <div style={{
      width: 56, height: 56, borderRadius: '50%', background: T.gray10,
      display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 4,
    }}>
      <FolderIcon size={28} color={T.gray50} />
    </div>
    <p style={{ fontSize: 15, fontWeight: 600, color: T.gray100, margin: 0 }}>
      {searchQuery ? 'No matching objects' : 'This folder is empty'}
    </p>
    <p style={{ fontSize: 13, color: T.gray50, margin: 0, textAlign: 'center', maxWidth: 300 }}>
      {searchQuery
        ? `No objects matching "${searchQuery}". Try a different search term.`
        : 'Upload files or create a folder to get started.'}
    </p>
    {!searchQuery && (
      <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
        <button onClick={onCreateFolder} style={{
          display: 'flex', alignItems: 'center', gap: 6, height: 36, padding: '0 14px',
          border: `1px solid ${T.gray20}`, borderRadius: 8, background: '#fff',
          color: T.gray80, fontSize: 13, fontWeight: 500,
          cursor: 'pointer',
        }}>
          <FolderPlusIcon size={15} /> Create folder
        </button>
        <button onClick={onUpload} style={{
          display: 'flex', alignItems: 'center', gap: 6, height: 36, padding: '0 14px',
          border: 'none', borderRadius: 8, background: T.primary,
          color: '#fff', fontSize: 13, fontWeight: 500, cursor: 'pointer',
        }}>
          <UploadSimpleIcon size={15} weight="bold" /> Upload files
        </button>
      </div>
    )}
  </div>
);

// ─── Main page ────────────────────────────────────────────────────────────────

export const SubAccountBucketDetailPage = () => {
  const { bucketName } = useParams<{ bucketName: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const prefix = searchParams.get('prefix') ?? '';

  const { entityId, memberId, isAdmin } = useSubAccount();
  const { credentials } = useSubAccountS3Client(entityId, memberId);

  const endpointRef = useRef(searchParams.get('endpoint'));
  const regionRef = useRef(searchParams.get('region'));

  const client = useMemo(() => {
    if (!credentials) return null;
    const endpoint = endpointRef.current ?? new URL(credentials.endpoint).host;
    return new S3Client({
      endpoint: `https://${endpoint}`,
      region: regionRef.current ?? credentials.region ?? 'us-east-1',
      credentials: { accessKeyId: credentials.accessKeyId, secretAccessKey: credentials.secretAccessKey },
      forcePathStyle: true,
    });
  }, [credentials?.accessKeyId]);

  const [activeTab, setActiveTab] = useState<'objects' | 'properties'>('objects');
  const [objects, setObjects] = useState<S3Object[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedVersions, setSelectedVersions] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [showVersions, setShowVersions] = useLocalStorage('showVersions', false);
  const {
    state: pagination, setPageSize, goToPrevPage, goToNextPage, recordPage, reset: resetPagination,
  } = useObjectPagination();
  const [visibility, setVisibility] = useState<'public' | 'private'>('private');
  const [versioning, setVersioning] = useState<{
    status: VersioningStatus;
    isLoading: boolean;
    isChanging: boolean;
    confirmation: boolean | null;
  }>({
    status: 'Unversioned', isLoading: true, isChanging: false, confirmation: null,
  });
  const [objectLockConfig, setObjectLockConfig] = useState<{
    lockEnabledAtCreation: boolean; enabled: boolean; mode?: RetentionMode; days?: number; years?: number;
  }>({ lockEnabledAtCreation: false, enabled: false });
  const [isSavingBucketRetention, setIsSavingBucketRetention] = useState(false);
  const [pendingRetention, setPendingRetention] = useState<{
    mode: RetentionMode; scale: 'days' | 'years'; value: number;
  } | null>(null);
  const [loggingConfig, setLoggingConfig] = useState({ enabled: false, targetBucket: '', targetPrefix: '' });
  const [persistedLoggingConfig, setPersistedLoggingConfig] = useState({ enabled: false, targetBucket: '', targetPrefix: '' });
  const [isSavingLogging, setIsSavingLogging] = useState(false);
  const [bucketsList, setBucketsList] = useState<string[]>([]);
  const [configStatus, setConfigStatus] = useState<{
    versioning: 'loading' | 'error' | 'ready';
    objectLock: 'loading' | 'error' | 'ready';
    logging: 'loading' | 'error' | 'ready';
  }>({ versioning: 'loading', objectLock: 'loading', logging: 'loading' });
  const isPropertiesLoading = Object.values(configStatus).some((s) => s === 'loading');

  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeletingSelected, setIsDeletingSelected] = useState(false);
  const [selectedFile, setSelectedFile] = useState<S3Object | null>(null);
  const fileRetention = useFileRetention();
  const [fileToDelete, setFileToDelete] = useState<S3Object | null>(null);
  const [isDeletingSingle, setIsDeletingSingle] = useState(false);
  const [isDeleteBucketOpen, setIsDeleteBucketOpen] = useState(false);
  const [isDeletingBucket, setIsDeletingBucket] = useState(false);
  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
  const [folderName, setFolderName] = useState('');
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);

  useOnS3ClientReadyEffect(client, (c) => {
    if (!bucketName) {
      return;
    }
    s3Service.getBucketVisibility(c, bucketName).then(setVisibility).catch(() => {});
  }, [bucketName]);

  useOnS3ClientReadyEffect(client, (c) => {
    if (!bucketName) { 
      return; 
    }
    const handle = setTimeout(() => loadObjects(c), searchQuery ? 300 : 0);
    return () => clearTimeout(handle);
  }, [bucketName, prefix, searchQuery, showVersions, pagination.pageSize, pagination.pageNumber]);

  useOnS3ClientReadyEffect(client, (c) => {
    if (!bucketName || activeTab !== 'properties') {
      return;
    }

    let cancelled = false;
    setConfigStatus({ versioning: 'loading', objectLock: 'loading', logging: 'loading' });

    s3Service.getBucketVersioning(c, bucketName)
      .then(v => {
        if (cancelled) return;
        setVersioning(prev => ({ ...prev, status: v.status, isLoading: false }));
        setConfigStatus(prev => ({ ...prev, versioning: 'ready' }));
      })
      .catch(() => {
        if (cancelled) return;
        setVersioning(prev => ({ ...prev, isLoading: false }));
        setConfigStatus(prev => ({ ...prev, versioning: 'error' }));
        notificationsService.error({ text: 'Could not load versioning status for this bucket. Please try again.' });
      });

    s3Service.getObjectLockConfig(c, bucketName)
      .then(cfg => {
        if (cancelled) return;
        setObjectLockConfig(cfg);
        setConfigStatus(prev => ({ ...prev, objectLock: 'ready' }));
      })
      .catch(() => {
        if (cancelled) return;
        setConfigStatus(prev => ({ ...prev, objectLock: 'error' }));
        notificationsService.error({ text: 'Could not load object locking configuration for this bucket. Please try again.' });
      });

    s3Service.getBucketLogging(c, bucketName)
      .then((l) => {
        if (cancelled) return;
        const cfg = { enabled: l.enabled, targetBucket: l.targetBucket ?? '', targetPrefix: l.targetPrefix ?? '' };
        setLoggingConfig(cfg);
        setPersistedLoggingConfig(cfg);
        setConfigStatus(prev => ({ ...prev, logging: 'ready' }));
      })
      .catch(() => {
        if (cancelled) return;
        setConfigStatus(prev => ({ ...prev, logging: 'error' }));
        notificationsService.error({ text: 'Could not load logging configuration for this bucket. Please try again.' });
      });

    return () => { cancelled = true; };
  }, [bucketName, activeTab]);

  useOnS3ClientReadyEffect(client, (c) => {
    s3Service.listBuckets(c)
      .then((result) => setBucketsList(result.buckets.map((b) => b.name)))
      .catch(() => {});
  }, []);

  const requestBucketRetention = (mode: RetentionMode, scale: 'days' | 'years', value: number) => {
    if (!client || !bucketName) return;
    setPendingRetention({ mode, scale, value });
  };

  const applyBucketRetention = async () => {
    if (!client || !bucketName || !pendingRetention) return;
    const { mode, scale, value } = pendingRetention;
    setIsSavingBucketRetention(true);
    try {
      await s3Service.setObjectLockConfig(
        client, bucketName, mode, scale === 'days' ? value : undefined, scale === 'years' ? value : undefined,
      );
      setObjectLockConfig(prev => ({ ...prev, enabled: true, mode, days: scale === 'days' ? value : undefined, years: scale === 'years' ? value : undefined }));
      notificationsService.success({ text: 'Object retention updated' });
      setPendingRetention(null);
    } catch {
      notificationsService.error({ text: 'Failed to update object retention' });
    } finally {
      setIsSavingBucketRetention(false);
    }
  };

  const onDisableRetention = async () => {
    if (!client || !bucketName) return;
    setIsSavingBucketRetention(true);
    try {
      await s3Service.clearObjectLockConfig(client, bucketName);
      setObjectLockConfig(prev => ({ ...prev, enabled: false }));
      notificationsService.success({ text: 'Object retention disabled' });
    } catch {
      notificationsService.error({ text: 'Failed to disable object retention' });
    } finally {
      setIsSavingBucketRetention(false);
    }
  };

  const onFileClick = async (obj: S3Object) => {
    setSelectedFile(obj);
    fileRetention.setRetention(null);
    if (!client || !bucketName || obj.isFolder) return;
    const result = await s3Service.getObjectRetention(
      client, bucketName, obj.key, obj.versionId !== 'null' ? obj.versionId : undefined,
    );
    fileRetention.setRetention(
      result?.mode && result.retainUntilDate
        ? { mode: result.mode as RetentionMode, retainUntilDate: result.retainUntilDate }
        : null,
    );
  };

  const onSaveFileRetention = async (mode: RetentionMode, retainUntilDate: Date) => {
    if (!client || !bucketName || !selectedFile) return;
    fileRetention.setIsSaving(true);
    try {
      await s3Service.setObjectRetention(
        client, bucketName, selectedFile.key, mode, retainUntilDate,
        selectedFile.versionId !== 'null' ? selectedFile.versionId : undefined,
      );
      fileRetention.setRetention({ mode, retainUntilDate });
      notificationsService.success({ text: 'Object retention updated' });
    } catch {
      notificationsService.error({ text: 'Failed to update object retention' });
    } finally {
      fileRetention.setIsSaving(false);
    }
  };

  const onToggleVersioning = (next: boolean) => {
    if (!client || !bucketName || versioning.isLoading || versioning.isChanging || next === (versioning.status === 'Enabled')) return;
    if (!next && objectLockConfig.lockEnabledAtCreation) return;
    setVersioning(prev => ({ ...prev, confirmation: next }));
  };

  const confirmVersioningChange = async () => {
    if (!client || !bucketName || versioning.confirmation === null) return;
    const next = versioning.confirmation;
    setVersioning(prev => ({ ...prev, isChanging: true }));
    try {
      await s3Service.setBucketVersioning(client, bucketName, next);
      setVersioning(prev => ({ ...prev, status: next ? 'Enabled' : 'Suspended', confirmation: null, isChanging: false }));
      notificationsService.success({ text: `Versioning ${next ? 'enabled' : 'disabled'}` });
    } catch {
      setVersioning(prev => ({ ...prev, isChanging: false }));
      notificationsService.error({ text: 'Failed to update versioning' });
    }
  };

  const cancelVersioningChange = () => setVersioning(prev => ({ ...prev, confirmation: null }));

  const onSaveLogging = async () => {
    if (!client || !bucketName) return;
    setIsSavingLogging(true);
    try {
      await s3Service.setBucketLogging(
        client, bucketName, loggingConfig.enabled, loggingConfig.targetBucket, loggingConfig.targetPrefix,
      );
      setPersistedLoggingConfig(loggingConfig);
      notificationsService.success({ text: `Logging ${loggingConfig.enabled ? 'enabled' : 'disabled'}` });
    } catch {
      notificationsService.error({ text: 'Failed to update logging' });
    } finally {
      setIsSavingLogging(false);
    }
  };

  const loadObjects = async (s3: S3Client) => {
    if (!bucketName) return;
    setIsLoading(true);
    setSelectedVersions(new Set());
    try {
      if (showVersions) {
        const result = await s3Service.listObjectVersions(
          s3, bucketName, prefix + searchQuery,
          pagination.pageMarker?.keyMarker, pagination.pageMarker?.versionIdMarker, pagination.pageSize,
        );
        setObjects(result.objects);
        recordPage(result);
      } else {
        const result = await s3Service.listObjects(
          s3, bucketName, prefix + searchQuery, pagination.pageMarker?.continuationToken, pagination.pageSize,
        );
        setObjects(result.objects);
        recordPage(result);
      }
    } catch (err) {
      const msg = isAccessDeniedError(err)
        ? 'Insufficient permissions to list this location.'
        : (err as Error).message;
      notificationsService.error({ text: msg });
    } finally {
      setIsLoading(false);
    }
  };

  const navigateToPrefix = (newPrefix: string) => {
    const next: Record<string, string> = {};
    if (endpointRef.current) next.endpoint = endpointRef.current;
    if (regionRef.current) next.region = regionRef.current;
    if (newPrefix) next.prefix = newPrefix;
    setSearchParams(next);
    setSearchQuery('');
    resetPagination();
  };

  const displayObjects = objects;

  const allSelected = displayObjects.length > 0 && displayObjects.every(o => selectedVersions.has(versionRowId(o)));
  const selectionHasFolder = displayObjects.some(o => o.isFolder && selectedVersions.has(versionRowId(o)));

  const [isCheckingFolderEmptiness, setIsCheckingFolderEmptiness] = useState(false);
  const [selectionHasNonEmptyFolder, setSelectionHasNonEmptyFolder] = useState(false);

  useEffect(() => {
    const folderKeys = displayObjects
      .filter(o => o.isFolder && selectedVersions.has(versionRowId(o)))
      .map(o => o.key);

    if (!client || !bucketName || folderKeys.length === 0) {
      setSelectionHasNonEmptyFolder(false);
      return;
    }

    let cancelled = false;
    setIsCheckingFolderEmptiness(true);
    Promise.all(folderKeys.map(key => s3Service.listObjects(client, bucketName, key, undefined, 1)))
      .then(results => {
        if (!cancelled) setSelectionHasNonEmptyFolder(results.some(r => r.objects.length > 0));
      })
      .catch(() => {
        if (!cancelled) setSelectionHasNonEmptyFolder(true);
      })
      .finally(() => {
        if (!cancelled) setIsCheckingFolderEmptiness(false);
      });

    return () => { cancelled = true; };
  }, [client, bucketName, selectedVersions, displayObjects]);

  const isDeleteSelectedDisabled = selectionHasFolder && (isCheckingFolderEmptiness || selectionHasNonEmptyFolder);

  const onSelectAll = (v: boolean) =>
    setSelectedVersions(v ? new Set(displayObjects.map(versionRowId)) : new Set());

  const onSelectKey = (rowId: string, v: boolean) =>
    setSelectedVersions(prev => {
      const s = new Set(prev);
      if (v) s.add(rowId); else s.delete(rowId);
      return s;
    });

  const onDownload = async (obj: S3Object) => {
    if (!client || !bucketName) return;
    try {
      const url = await s3Service.getDownloadUrl(client, bucketName, obj.key, obj.versionId);
      window.location.href = url;
    } catch {
      notificationsService.error({ text: 'Could not generate download link.' });
    }
  };

  const onCopyPath = (obj: S3Object) => {
    navigator.clipboard.writeText(obj.key);
    notificationsService.success({ text: 'Path copied to clipboard' });
  };

  const onShowAllVersions = (obj: S3Object) => {
    setShowVersions(true);
    setSearchQuery(displayName(obj.key));
    resetPagination();
  };

  const onSearchQueryChange = (v: string) => {
    setSearchQuery(v);
    resetPagination();
  };

  const onShowVersionsChange = (v: boolean) => {
    setShowVersions(v);
    resetPagination();
  };

  const onDeleteSingle = (obj: S3Object) => setFileToDelete(obj);

  const onConfirmDeleteSingle = async () => {
    if (!client || !bucketName || !fileToDelete) return;
    setIsDeletingSingle(true);
    try {
      await s3Service.deleteObject(client, bucketName, fileToDelete.key, fileToDelete.versionId);
      notificationsService.success({ text: 'Object deleted' });
      setFileToDelete(null);
      if (selectedFile?.key === fileToDelete.key) setSelectedFile(null);
      await loadObjects(client);
    } catch {
      notificationsService.error({ text: 'Delete failed.' });
    } finally {
      setIsDeletingSingle(false);
    }
  };

  const onConfirmDeleteBucket = async () => {
    if (!client || !bucketName) return;
    setIsDeletingBucket(true);
    try {
      await s3Service.deleteBucket(client, bucketName);
      navigate('/subaccount/buckets');
    } catch (err) {
      notificationsService.error({ text: (err as Error).message });
    } finally {
      setIsDeletingBucket(false);
    }
  };

  const onDeleteSelected = async () => {
    if (!client || !bucketName || selectedVersions.size === 0 || isDeleteSelectedDisabled) return;
    setIsDeletingSelected(true);
    try {
      const items = displayObjects
        .filter(o => selectedVersions.has(versionRowId(o)))
        .map(o => ({ key: o.key, versionId: o.versionId }));
      await s3Service.deleteObjects(client, bucketName, items);
      notificationsService.success({ text: `${selectedVersions.size} object(s) deleted` });
      setIsDeleteDialogOpen(false);
      await loadObjects(client);
    } catch {
      notificationsService.error({ text: 'Delete failed.' });
    } finally {
      setIsDeletingSelected(false);
    }
  };

  const onCreateFolder = async () => {
    if (!client || !bucketName || !folderName.trim()) return;
    setIsCreatingFolder(true);
    try {
      await s3Service.uploadObject(client, bucketName, `${prefix}${folderName.trim()}/`, new File([''], ''));
      notificationsService.success({ text: 'Folder created' });
      setIsCreateFolderOpen(false);
      setFolderName('');
      await loadObjects(client);
    } catch (err) {
      notificationsService.error({
        text: isAccessDeniedError(err) ? 'You do not have enough access to this bucket.' : 'Could not create folder.',
      });
    } finally {
      setIsCreatingFolder(false);
    }
  };

  const region = regionRef.current ?? '—';
  const endpoint = endpointRef.current ?? '';

  const inputShared: React.CSSProperties = {
    height: 40, padding: '0 12px',
    border: `1px solid ${T.gray20}`, borderRadius: 8,
    fontSize: 14, color: T.gray100, outline: 'none', background: T.gray10,
    width: '100%', boxSizing: 'border-box',
  };

  const isLoggingDirty =
    loggingConfig.enabled !== persistedLoggingConfig.enabled ||
    loggingConfig.targetBucket !== persistedLoggingConfig.targetBucket ||
    loggingConfig.targetPrefix !== persistedLoggingConfig.targetPrefix;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 1200,
      margin: '0 auto', width: '100%', padding: '8px 0 32px' }}>

      {/* ── Bucket header ──────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <button
          onClick={() => navigate('/subaccount/buckets')}
          aria-label="Back to buckets" title="Back to buckets"
          style={{
            width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: `1px solid ${T.gray20}`, borderRadius: 8,
            background: '#fff', cursor: 'pointer', color: T.gray80, flexShrink: 0,
          }}
        >
          <ArrowLeftIcon size={18} />
        </button>

        <div style={{
          width: 40, height: 40, borderRadius: 8, flexShrink: 0,
          background: 'rgba(0,102,255,0.08)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <DatabaseIcon size={20} color={T.primary} weight="duotone" />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <h1 style={{ fontSize: 22, fontWeight: 600, color: T.gray100, margin: 0, lineHeight: 1.2 }}>
            {bucketName}
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 13, color: T.gray50 }}>{region}</span>
            <span style={{ width: 3, height: 3, borderRadius: '50%', background: T.gray50, flexShrink: 0 }} />
            <Pill type={visibility} />
          </div>
        </div>
      </div>

      {/* ── Main card ──────────────────────────────────────────────────────── */}
      <div style={{
        display: 'flex',
        background: '#fff',
        border: `1px solid ${T.gray20}`,
        borderRadius: 12,
        boxShadow: shadow.sm,
        overflow: 'hidden',
        height: 'calc(100vh - 220px)',
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0, overflowY: 'auto' }}>

          {/* Tabs */}
          <div style={{ display: 'flex', borderBottom: `1px solid ${T.gray15}`, padding: '0 20px' }}>
            {(['objects', 'properties'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => {
                  // TODO: use suspend for properties tab to avoid flicker
                  if (tab === 'properties' && activeTab !== 'properties') {
                    setConfigStatus({ versioning: 'loading', objectLock: 'loading', logging: 'loading' });
                  }
                  setActiveTab(tab);
                }}
                style={{
                  padding: '14px 16px', fontSize: 14, fontWeight: 500, cursor: 'pointer',
                  background: 'none', border: 'none', borderBottom: '2px solid', marginBottom: -1,
                  borderBottomColor: activeTab === tab ? T.primary : 'transparent',
                  color: activeTab === tab ? T.primary : T.gray50,
                  transition: 'color 120ms, border-color 120ms',
                }}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {/* ── Objects tab ──────────────────────────────────────────────── */}
          {activeTab === 'objects' && (
            <div style={{ display: 'flex', flexDirection: 'column' }}>

              {/* Toolbar */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '14px 20px', gap: 12, borderBottom: `1px solid ${T.gray15}`,
                flexWrap: 'wrap',
              }}>
                <Breadcrumb
                  bucketName={bucketName!}
                  prefix={prefix}
                  onBuckets={() => navigate('/subaccount/buckets')}
                  onBucket={() => navigateToPrefix('')}
                  onSegment={navigateToPrefix}
                />
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                  {selectedVersions.size > 0 && (
                    <button
                      onClick={() => setIsDeleteDialogOpen(true)}
                      disabled={isDeleteSelectedDisabled}
                      title={isDeleteSelectedDisabled ? 'Non-empty folders cannot be deleted from this view' : undefined}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 6, height: 36, padding: '0 14px',
                        border: '1px solid #fca5a5', borderRadius: 8, background: '#fff5f5',
                        color: '#E50B00', fontSize: 13, fontWeight: 500,
                        cursor: isDeleteSelectedDisabled ? 'not-allowed' : 'pointer',
                        opacity: isDeleteSelectedDisabled ? 0.5 : 1,
                      }}
                    >
                      <TrashIcon size={15} /> Delete ({selectedVersions.size})
                    </button>
                  )}
                  <button
                    onClick={() => { setFolderName(''); setIsCreateFolderOpen(true); }}
                    title="Create folder"
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6, height: 36, padding: '0 14px',
                      border: `1px solid ${T.gray20}`, borderRadius: 8, background: '#fff',
                      color: T.gray80, fontSize: 13, fontWeight: 500,
                      cursor: 'pointer', whiteSpace: 'nowrap',
                    }}
                  >
                    <FolderPlusIcon size={16} /> Create folder
                  </button>
                  <button
                    onClick={() => setIsUploadOpen(true)}
                    title="Upload files"
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6, height: 36, padding: '0 14px',
                      border: 'none', borderRadius: 8, background: T.primary,
                      color: '#fff', fontSize: 13, fontWeight: 500,
                      cursor: 'pointer', whiteSpace: 'nowrap',
                    }}
                  >
                    <UploadSimpleIcon size={16} weight="bold" /> Upload files
                  </button>
                </div>
              </div>

              {/* Search + count */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '12px 20px', gap: 12, borderBottom: `1px solid ${T.gray15}`,
              }}>
                <div style={{ width: 340 }}>
                  <Input
                    variant="search"
                    placeholder="Search objects by prefix…"
                    value={searchQuery}
                    onChange={onSearchQueryChange}
                    onClear={() => onSearchQueryChange('')}
                  />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <span style={{
                    fontSize: 13, color: T.gray50,
                    whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums',
                  }}>
                    {displayObjects.length} {displayObjects.length === 1 ? 'object' : 'objects'}
                  </span>
                  <Switch label="Show Versions" checked={showVersions} onChange={onShowVersionsChange} />
                </div>
              </div>

              {/* Pagination */}
              <Pagination
                pageSize={pagination.pageSize}
                pageSizeOptions={[25, 50, 100]}
                onPageSizeChange={setPageSize}
                pageNumber={pagination.pageNumber}
                hasPrevPage={pagination.hasPrevPage}
                hasNextPage={pagination.hasNextPage}
                onPrev={goToPrevPage}
                onNext={goToNextPage}
              />

              {/* Table header */}
              <div role="row" style={{
                display: 'grid', gridTemplateColumns: showVersions ? GRID_COLS_VERSIONS : GRID_COLS,
                padding: '10px 16px',
                background: T.gray5,
                borderBottom: `1px solid ${T.gray15}`,
              }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <input
                    type="checkbox" checked={allSelected}
                    onChange={e => onSelectAll(e.target.checked)}
                    style={{ cursor: 'pointer', width: 16, height: 16 }}
                    aria-label="Select all"
                  />
                </div>
                {(showVersions
                  ? ['Name', 'Size', 'Last modified', 'Version ID', '']
                  : ['Name', 'Size', 'Last modified', '']
                ).map((h, i) => (
                  <span key={i} style={{
                    fontSize: 12, fontWeight: 500, color: T.gray60,
                    textTransform: 'uppercase', letterSpacing: '0.04em',
                  }}>{h}</span>
                ))}
              </div>

              {/* Rows / states */}
              {isLoading ? (
                <div style={{ padding: '40px 20px', textAlign: 'center', color: T.gray50, fontSize: 14 }}>
                  Loading objects…
                </div>
              ) : displayObjects.length === 0 ? (
                <EmptyState
                  searchQuery={searchQuery}
                  onCreateFolder={() => { setFolderName(''); setIsCreateFolderOpen(true); }}
                  onUpload={() => setIsUploadOpen(true)}
                />
              ) : (
                displayObjects.map(obj => (
                  <ObjectRow
                    key={versionRowId(obj)}
                    obj={obj}
                    selected={selectedVersions.has(versionRowId(obj))}
                    showVersions={showVersions}
                    onSelect={v => onSelectKey(versionRowId(obj), v)}
                    onFolderClick={navigateToPrefix}
                    onFileClick={onFileClick}
                    onDownload={onDownload}
                    onDelete={onDeleteSingle}
                    onCopyPath={onCopyPath}
                  />
                ))
              )}
            </div>
          )}

          {/* ── Properties tab ──────────────────────────────────────────── */}
          {activeTab === 'properties' && (
            isPropertiesLoading ? (
              <div className="flex justify-center px-6 py-24">
                <Loader
                  type="spinner"
                  size={32}
                  text="Loading bucket configuration…"
                  classNameContainer="flex flex-col items-center gap-3 text-[var(--gray-60,#636367)]"
                  classNameText="m-0 text-sm"
                />
              </div>
            ) : (
            <div className="flex flex-col gap-6 px-6 pt-6 pb-8">
              <div className="grid grid-cols-2 gap-x-8 gap-y-5">
                <ReadField label="Bucket name" value={bucketName!} mono />
                <ReadField label="Region" value={region} />
                <ReadField label="Visibility" value={visibility === 'public' ? 'Public' : 'Private'} />
                <ReadField label="Endpoint" value={endpoint ? `https://${endpoint}` : '—'} mono fullWidth />
                <div className="col-span-full flex flex-wrap items-start gap-12">
                    {configStatus.versioning === 'error' ? (
                      <ConfigError section="versioning" />
                    ) : (
                      <VersioningControl
                        status={versioning.status}
                        loading={versioning.isLoading}
                        disabled={versioning.isLoading || versioning.isChanging || objectLockConfig.lockEnabledAtCreation}
                        onChange={onToggleVersioning}
                      />
                    )}
                    {configStatus.objectLock === 'error' ? (
                      <ConfigError section="object locking" />
                    ) : (
                      <ObjectLockingControl
                        lockEnabledAtCreation={objectLockConfig.lockEnabledAtCreation}
                        retentionConfig={objectLockConfig}
                        isSaving={isSavingBucketRetention}
                        onSave={requestBucketRetention}
                        onDisable={onDisableRetention}
                      />
                    )}
                    {configStatus.logging === 'error' ? (
                      <ConfigError section="logging" />
                    ) : (
                      <div className="flex max-w-[480px] flex-col gap-3.5">
                        <span className="text-xs font-medium uppercase tracking-wider text-[var(--gray-60,#636367)]">
                          Logging
                        </span>
                        <BucketLoggingSetup
                          enabled={loggingConfig.enabled}
                          prefix={loggingConfig.targetPrefix}
                          target={loggingConfig.targetBucket}
                          buckets={bucketsList.filter((name) => name !== bucketName)}
                          onEnabledChange={(enabled) => setLoggingConfig((prev) => ({ ...prev, enabled }))}
                          onPrefixChange={(targetPrefix) => setLoggingConfig((prev) => ({ ...prev, targetPrefix }))}
                          onTargetChange={(targetBucket) => setLoggingConfig((prev) => ({ ...prev, targetBucket }))}
                        />
                        <div className="flex justify-end">
                          <Button
                            type="button"
                            disabled={
                              !isLoggingDirty ||
                              (loggingConfig.enabled && (!loggingConfig.targetBucket || !loggingConfig.targetPrefix))
                            }
                            loading={isSavingLogging}
                            onClick={onSaveLogging}
                          >
                            Update
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

              {isAdmin && (
                <div className="flex items-center justify-between gap-4 rounded-xl border border-[#fecaca] bg-[#fef2f2] p-5">
                  <div>
                    <p className="m-0 text-sm font-semibold text-[var(--gray-100,#18181B)]">Delete this bucket</p>
                    <p className="mt-0.5 text-[13px] text-[var(--gray-60,#636367)]">
                      Permanently delete this bucket and all of its contents. This action cannot be undone.
                    </p>
                  </div>
                  <button
                    onClick={() => setIsDeleteBucketOpen(true)}
                    className="h-10 cursor-pointer whitespace-nowrap rounded-lg border-none bg-[var(--red,#E03131)] px-4 text-sm font-medium text-white"
                  >
                    Delete bucket
                  </button>
                </div>
              )}
            </div>
            )
          )}
        </div>

        {/* Side panel */}
        {selectedFile && (
          <FileDetailsPanel
            key={selectedFile.key + selectedFile.versionId}
            obj={selectedFile}
            retention={fileRetention.retention}
            isSavingRetention={fileRetention.isSaving}
            onClose={() => setSelectedFile(null)}
            onDownload={onDownload}
            onCopyPath={onCopyPath}
            onDelete={obj => { setSelectedFile(null); onDeleteSingle(obj); }}
            onShowAllVersions={onShowAllVersions}
            onSaveRetention={objectLockConfig.enabled ? onSaveFileRetention : undefined}
          />
        )}
      </div>

      {/* ── Modals ─────────────────────────────────────────────────────────── */}
      <UploadModal
        isOpen={isUploadOpen}
        bucket={bucketName!}
        prefix={prefix}
        client={client}
        onClose={() => setIsUploadOpen(false)}
        onUploaded={() => client && loadObjects(client)}
      />

      <Dialog
        isOpen={versioning.confirmation !== null}
        onClose={cancelVersioningChange}
        onPrimaryAction={confirmVersioningChange}
        onSecondaryAction={cancelVersioningChange}
        isLoading={versioning.isChanging}
        primaryAction="Confirm"
        secondaryAction="Cancel"
        primaryActionColor="primary"
        title={versioning.confirmation ? 'Enable Versioning' : 'Suspend Versioning'}
        subtitle={versioning.confirmation
          ? 'Versioning-enabled buckets store all versions of your object by default.\n\nAre you sure you want to enable versioning for the selected bucket?'
          : 'Suspending versioning will suspend the creation of object versions for all operations but keeps any existing object versions.\n\nAre you sure you want to suspend versioning for the selected bucket?'}
      />

      <RetentionConfirmModal
        isOpen={pendingRetention !== null}
        mode={pendingRetention?.mode ?? RetentionMode.COMPLIANCE}
        scale={pendingRetention?.scale ?? 'days'}
        value={pendingRetention?.value ?? 0}
        isSaving={isSavingBucketRetention}
        onConfirm={applyBucketRetention}
        onClose={() => setPendingRetention(null)}
      />

      <Dialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onPrimaryAction={onDeleteSelected}
        onSecondaryAction={() => setIsDeleteDialogOpen(false)}
        isLoading={isDeletingSelected}
        primaryAction="Delete"
        secondaryAction="Cancel"
        primaryActionColor="danger"
        title="Delete objects"
        subtitle={`This will permanently delete ${selectedVersions.size} object(s). This action cannot be undone.`}
      />

      <Dialog
        isOpen={!!fileToDelete}
        onClose={() => setFileToDelete(null)}
        onPrimaryAction={onConfirmDeleteSingle}
        onSecondaryAction={() => setFileToDelete(null)}
        isLoading={isDeletingSingle}
        primaryAction="Delete"
        secondaryAction="Cancel"
        primaryActionColor="danger"
        title="Delete object"
        subtitle={`Permanently delete "${fileToDelete ? displayName(fileToDelete.key) : ''}"? This cannot be undone.`}
      />

      <DeleteBucketConfirmModal
        isOpen={isDeleteBucketOpen}
        bucketName={bucketName ?? ''}
        isDeleting={isDeletingBucket}
        onConfirm={onConfirmDeleteBucket}
        onClose={() => !isDeletingBucket && setIsDeleteBucketOpen(false)}
      />

      <Modal isOpen={isCreateFolderOpen} onClose={() => !isCreatingFolder && setIsCreateFolderOpen(false)}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, minWidth: 400 }}>
          <p style={{ ...text.heading, margin: 0 }}>
            Create folder
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label htmlFor="folder-name" style={{ ...text.label }}>
              Folder name
            </label>
            <input
              id="folder-name" type="text" placeholder="my-folder"
              value={folderName}
              onChange={e => setFolderName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && onCreateFolder()}
              autoFocus
              style={inputShared}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <Button variant="secondary" type="button" onClick={() => setIsCreateFolderOpen(false)} disabled={isCreatingFolder}>
              Cancel
            </Button>
            <Button type="button" disabled={!folderName.trim() || isCreatingFolder} loading={isCreatingFolder} onClick={onCreateFolder}>
              Create
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
