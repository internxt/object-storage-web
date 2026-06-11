import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeftIcon,
  CaretRightIcon,
  DatabaseIcon,
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
import { S3Object, s3Service } from '../../services/s3.service';
import notificationsService from '../../services/notifications.service';
import { UploadModal } from '../../components/objects/UploadModal';
import { FileDetailsPanel } from '../../components/objects/FileDetailsPanel';
import Modal from '../../components/Modal';
import Button from '../../components/Button';
import Dialog from '../../components/Dialog';
import Input from '../../components/Input';
import { useSubAccountS3Client } from '../hooks/useSubAccountS3Client';
import { useSubAccount } from '../context/SubAccountContext';
import { T, shadow, text } from '../tokens';
import { S3Client } from '@aws-sdk/client-s3';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function displayName(key: string): string {
  return key.replace(/\/$/, '').split('/').filter(Boolean).pop() ?? key;
}

function fmtDate(d: Date): string {
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
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
      }}
      onMouseEnter={e => !active && (e.currentTarget.style.color = T.gray80)}
      onMouseLeave={e => !active && (e.currentTarget.style.color = T.gray50)}
    >
      {label}
    </button>
  );

  const sep = <CaretRightIcon size={12} color={T.gray50} style={{ flexShrink: 0 }} />;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
      {crumb('Buckets', false, onBuckets)}
      {sep}
      {crumb(bucketName, parts.length === 0, parts.length ? onBucket : undefined)}
      {parts.map((seg, i) => {
        const segPrefix = parts.slice(0, i + 1).join('/') + '/';
        const isLast = i === parts.length - 1;
        return (
          <span key={segPrefix} style={{ display: 'contents' }}>
            {sep}
            {crumb(seg, isLast, () => onSegment(segPrefix))}
          </span>
        );
      })}
    </div>
  );
};

// ─── ObjectRow ────────────────────────────────────────────────────────────────

const GRID_COLS = '24px 2.6fr 1fr 1.4fr 40px';

const ActionItem = ({ icon, label, danger = false, onClick }:
  { icon: React.ReactNode; label: string; danger?: boolean; onClick: () => void }) => (
  <button
    style={{
      display: 'flex', alignItems: 'center', gap: 8, width: '100%',
      padding: '9px 14px', background: 'none', border: 'none',
      cursor: 'pointer', fontSize: 13,
      color: danger ? '#E50B00' : T.gray80,
      textAlign: 'left',
    }}
    onMouseEnter={e => { e.currentTarget.style.background = danger ? '#fff5f5' : T.gray5; }}
    onMouseLeave={e => { e.currentTarget.style.background = 'none'; }}
    onClick={onClick}
  >
    {icon}{label}
  </button>
);

interface ObjectRowProps {
  obj: S3Object;
  selected: boolean;
  onSelect: (v: boolean) => void;
  onFolderClick: (prefix: string) => void;
  onFileClick: (obj: S3Object) => void;
  onDownload: (obj: S3Object) => void;
  onDelete: (obj: S3Object) => void;
  onCopyPath: (obj: S3Object) => void;
}

const ObjectRow = ({ obj, selected, onSelect, onFolderClick, onFileClick, onDownload, onDelete, onCopyPath }: ObjectRowProps) => {
  const [hovered, setHovered] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const name = displayName(obj.key);

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
        display: 'grid', gridTemplateColumns: GRID_COLS, alignItems: 'center',
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

      {/* Actions */}
      <div
        style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}
        onClick={e => e.stopPropagation()}
      >
        {(hovered || menuOpen) && (
          <button
            aria-label="Object actions" title="Object actions"
            style={{
              width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: menuOpen ? T.gray10 : 'transparent',
              border: 'none', borderRadius: 6, cursor: 'pointer', color: T.gray60,
            }}
            onClick={() => setMenuOpen(o => !o)}
          >
            <DotsThreeVerticalIcon size={18} weight="bold" />
          </button>
        )}
        {menuOpen && (
          <div ref={menuRef} style={{
            position: 'absolute', right: 0, top: 36, zIndex: 50,
            background: '#fff', border: `1px solid ${T.gray20}`,
            borderRadius: 8, boxShadow: shadow.md,
            minWidth: 168, overflow: 'hidden',
          }}>
            {!obj.isFolder && (
              <ActionItem icon={<DownloadSimpleIcon size={15} />} label="Download"
                onClick={() => { setMenuOpen(false); onDownload(obj); }} />
            )}
            <ActionItem icon={<CopyIcon size={15} />} label="Copy path"
              onClick={() => { setMenuOpen(false); onCopyPath(obj); }} />
            <ActionItem icon={<TrashIcon size={15} />} label="Delete" danger
              onClick={() => { setMenuOpen(false); onDelete(obj); }} />
          </div>
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

  const { entityId, memberId } = useSubAccount();
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
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [visibility, setVisibility] = useState<'public' | 'private'>('private');
  const [versioningEnabled, setVersioningEnabled] = useState(false);

  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeletingSelected, setIsDeletingSelected] = useState(false);
  const [selectedFile, setSelectedFile] = useState<S3Object | null>(null);
  const [fileToDelete, setFileToDelete] = useState<S3Object | null>(null);
  const [isDeletingSingle, setIsDeletingSingle] = useState(false);
  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
  const [folderName, setFolderName] = useState('');
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);

  useEffect(() => {
    if (client && bucketName) {
      loadObjects(client);
      s3Service.getBucketVisibility(client, bucketName).then(setVisibility).catch(() => {});
    }
  }, [client, bucketName, prefix]);

  useEffect(() => {
    if (client && bucketName && activeTab === 'properties') {
      s3Service.getBucketVersioning(client, bucketName)
        .then(v => setVersioningEnabled(v.enabled))
        .catch(() => {});
    }
  }, [client, bucketName, activeTab]);

  const loadObjects = async (s3: S3Client) => {
    if (!bucketName) return;
    setIsLoading(true);
    setSelectedKeys(new Set());
    try {
      const result = await s3Service.listObjects(s3, bucketName, prefix);
      setObjects(result.objects);
    } catch (err) {
      const msg = (err as any)?.name === 'AccessDenied'
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
  };

  const displayObjects = useMemo(() => {
    if (!searchQuery) return objects;
    return objects.filter(o => displayName(o.key).toLowerCase().includes(searchQuery.toLowerCase()));
  }, [objects, searchQuery]);

  const allSelected = displayObjects.length > 0 && displayObjects.every(o => selectedKeys.has(o.key));

  const onSelectAll = (v: boolean) =>
    setSelectedKeys(v ? new Set(displayObjects.map(o => o.key)) : new Set());

  const onSelectKey = (key: string, v: boolean) =>
    setSelectedKeys(prev => { const s = new Set(prev); v ? s.add(key) : s.delete(key); return s; });

  const onDownload = async (obj: S3Object) => {
    if (!client || !bucketName) return;
    try {
      const url = await s3Service.getDownloadUrl(client, bucketName, obj.key);
      window.location.href = url;
    } catch {
      notificationsService.error({ text: 'Could not generate download link.' });
    }
  };

  const onCopyPath = (obj: S3Object) => {
    navigator.clipboard.writeText(obj.key);
    notificationsService.success({ text: 'Path copied to clipboard' });
  };

  const onDeleteSingle = (obj: S3Object) => setFileToDelete(obj);

  const onConfirmDeleteSingle = async () => {
    if (!client || !bucketName || !fileToDelete) return;
    setIsDeletingSingle(true);
    try {
      await s3Service.deleteObject(client, bucketName, fileToDelete.key);
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

  const onDeleteSelected = async () => {
    if (!client || !bucketName || selectedKeys.size === 0) return;
    setIsDeletingSelected(true);
    try {
      await s3Service.deleteObjects(client, bucketName, Array.from(selectedKeys));
      notificationsService.success({ text: `${selectedKeys.size} object(s) deleted` });
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
    } catch {
      notificationsService.error({ text: 'Could not create folder.' });
    } finally {
      setIsCreatingFolder(false);
    }
  };

  const region = regionRef.current ?? '—';
  const endpoint = endpointRef.current ?? '';
  const fileObjects = displayObjects.filter(o => !o.isFolder);

  const inputShared: React.CSSProperties = {
    height: 40, padding: '0 12px',
    border: `1px solid ${T.gray20}`, borderRadius: 8,
    fontSize: 14, color: T.gray100, outline: 'none', background: T.gray10,
    width: '100%', boxSizing: 'border-box',
  };

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
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>

          {/* Tabs */}
          <div style={{ display: 'flex', borderBottom: `1px solid ${T.gray15}`, padding: '0 20px' }}>
            {(['objects', 'properties'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
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
                  {selectedKeys.size > 0 && (
                    <button
                      onClick={() => setIsDeleteDialogOpen(true)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 6, height: 36, padding: '0 14px',
                        border: '1px solid #fca5a5', borderRadius: 8, background: '#fff5f5',
                        color: '#E50B00', fontSize: 13, fontWeight: 500, cursor: 'pointer',
                      }}
                    >
                      <TrashIcon size={15} /> Delete ({selectedKeys.size})
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
                    onChange={setSearchQuery}
                    onClear={() => setSearchQuery('')}
                  />
                </div>
                <span style={{
                  fontSize: 13, color: T.gray50,
                  whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums',
                }}>
                  {displayObjects.length} {displayObjects.length === 1 ? 'object' : 'objects'}
                </span>
              </div>

              {/* Table header */}
              <div role="row" style={{
                display: 'grid', gridTemplateColumns: GRID_COLS,
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
                {['Name', 'Size', 'Last modified', ''].map((h, i) => (
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
                    key={obj.key}
                    obj={obj}
                    selected={selectedKeys.has(obj.key)}
                    onSelect={v => onSelectKey(obj.key, v)}
                    onFolderClick={navigateToPrefix}
                    onFileClick={setSelectedFile}
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
            <div style={{ padding: '24px 24px 32px', display: 'flex', flexDirection: 'column', gap: 24 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px 32px' }}>
                <ReadField label="Bucket name" value={bucketName!} mono />
                <ReadField label="Region" value={region} />
                <ReadField label="Visibility" value={visibility === 'public' ? 'Public' : 'Private'} />
                <ReadField label="Objects" value={fileObjects.length ? String(fileObjects.length) : '—'} />
                <ReadField label="Endpoint" value={endpoint ? `https://${endpoint}` : '—'} mono fullWidth />
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 48, gridColumn: '1 / -1' }}>
                  <ReadField label="Versioning" value={versioningEnabled ? 'Enabled' : 'Disabled'} />
                  <ReadField label="Encryption" value="AES-256 · Zero-knowledge" />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Side panel */}
        {selectedFile && (
          <FileDetailsPanel
            obj={selectedFile}
            onClose={() => setSelectedFile(null)}
            onDownload={onDownload}
            onCopyPath={onCopyPath}
            onDelete={obj => { setSelectedFile(null); onDeleteSingle(obj); }}
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
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onPrimaryAction={onDeleteSelected}
        onSecondaryAction={() => setIsDeleteDialogOpen(false)}
        isLoading={isDeletingSelected}
        primaryAction="Delete"
        secondaryAction="Cancel"
        primaryActionColor="danger"
        title="Delete objects"
        subtitle={`This will permanently delete ${selectedKeys.size} object(s). This action cannot be undone.`}
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
