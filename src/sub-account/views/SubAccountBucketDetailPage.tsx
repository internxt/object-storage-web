import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { CaretRight, ArrowLeft, Trash, UploadSimple, FolderPlus } from '@phosphor-icons/react';
import { S3Object, s3Service } from '../../services/s3.service';
import notificationsService from '../../services/notifications.service';
import { ObjectsTable } from '../../components/objects/ObjectsTable';
import { UploadModal } from '../../components/objects/UploadModal';
import { FileDetailsPanel } from '../../components/objects/FileDetailsPanel';
import Modal from '../../components/Modal';
import Button from '../../components/Button';
import Dialog from '../../components/Dialog';
import { BucketPropertiesTab } from '../../components/buckets/BucketPropertiesTab';
import { useSubAccountS3Client } from '../hooks/useSubAccountS3Client';
import { useSubAccount } from '../context/SubAccountContext';
import { S3Client } from '@aws-sdk/client-s3';

export const SubAccountBucketDetailPage = () => {
  const { bucketName } = useParams<{ bucketName: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const prefix = searchParams.get('prefix') ?? '';

  const { entityId, memberId, isAdmin } = useSubAccount();
  const { credentials } = useSubAccountS3Client(entityId, memberId);
  const endpointRef = useRef(searchParams.get('endpoint'));
  const regionRef = useRef(searchParams.get('region'));
  const endpointParam = endpointRef.current;
  const regionParam = regionRef.current;
  const client = useMemo(() => {
    if (!credentials || !endpointParam) return null;
    return new S3Client({
      endpoint: `https://${endpointParam}`,
      region: regionParam ?? 'us-east-1',
      credentials: { accessKeyId: credentials.accessKeyId, secretAccessKey: credentials.secretAccessKey },
      forcePathStyle: true,
    });
  }, [credentials?.accessKeyId, endpointParam, regionParam]);
  const [activeTab, setActiveTab] = useState<'objects' | 'properties'>('objects');
  const [objects, setObjects] = useState<S3Object[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
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
    if (client && bucketName) loadObjects();
  }, [client, bucketName, prefix]);

  const loadObjects = async () => {
    if (!client || !bucketName) return;
    try {
      setIsLoading(true);
      setSelectedKeys(new Set());
      const result = await s3Service.listObjects(client, bucketName, prefix);
      setObjects(result.objects);
    } catch (err) {
      const message = (err as any)?.name === 'AccessDenied' ? 'Insufficient permissions to list this location.' : (err as Error).message;
      notificationsService.error({ text: message });
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

  const onSelectKey = (key: string, selected: boolean) => {
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      if (selected) next.add(key);
      else next.delete(key);
      return next;
    });
  };

  const onSelectAll = (selected: boolean) => {
    setSelectedKeys(selected ? new Set(objects.map((o) => o.key)) : new Set());
  };

  const onDownload = async (obj: S3Object) => {
    if (!client || !bucketName) return;
    try {
      const url = await s3Service.getDownloadUrl(client, bucketName, obj.key);
      window.location.href = url;
    } catch (err) {
      const message = (err as any)?.name === 'AccessDenied' ? 'Insufficient permissions to download this object.' : (err as Error).message;
      notificationsService.error({ text: message });
    }
  };

  const onCreateFolder = async () => {
    if (!client || !bucketName || !folderName.trim()) return;
    setIsCreatingFolder(true);
    try {
      const key = `${prefix}${folderName.trim()}/`;
      await s3Service.uploadObject(client, bucketName, key, new File([''], ''));
      notificationsService.success({ text: 'Folder created' });
      setIsCreateFolderOpen(false);
      setFolderName('');
      await loadObjects();
    } catch (err) {
      notificationsService.error({ text: (err as Error).message });
    } finally {
      setIsCreatingFolder(false);
    }
  };

  const onCopyPath = (obj: S3Object) => {
    navigator.clipboard.writeText(obj.key);
    notificationsService.success({ text: 'Path copied to clipboard' });
  };

  const onDeleteSingle = (obj: S3Object) => {
    setFileToDelete(obj);
  };

  const onConfirmDeleteSingle = async () => {
    if (!client || !bucketName || !fileToDelete) return;
    setIsDeletingSingle(true);
    try {
      await s3Service.deleteObject(client, bucketName, fileToDelete.key);
      notificationsService.success({ text: 'Object deleted' });
      setFileToDelete(null);
      if (selectedFile?.key === fileToDelete.key) setSelectedFile(null);
      await loadObjects();
    } catch (err) {
      const message = (err as any)?.name === 'AccessDenied' ? 'Insufficient permissions to delete this object.' : (err as Error).message;
      notificationsService.error({ text: message });
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
      await loadObjects();
    } catch (err) {
      const message = (err as any)?.name === 'AccessDenied' ? 'Insufficient permissions to delete objects.' : (err as Error).message;
      notificationsService.error({ text: message });
    } finally {
      setIsDeletingSelected(false);
    }
  };

  const [searchQuery, setSearchQuery] = useState('');

  const hasSelectedFolder = objects.some((o) => o.isFolder && selectedKeys.has(o.key));
  const breadcrumbParts = prefix ? prefix.split('/').filter(Boolean) : [];
  const filteredObjects = searchQuery
    ? objects.filter((o) => {
        const name = o.key.split('/').filter(Boolean).pop() ?? o.key;
        return name.toLowerCase().includes(searchQuery.toLowerCase());
      })
    : objects;

  return (
    <section className='flex flex-col p-7 w-full gap-4'>
      {/* Back nav */}
      <button
        onClick={() => navigate('/subaccount/buckets')}
        className='flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 w-fit'
      >
        <ArrowLeft size={14} />
        <span className='font-medium'>{bucketName}</span>
      </button>

      {/* Main card */}
      <div className='flex w-full bg-white rounded-md overflow-hidden' style={{ border: '1px solid #e5e7eb' }}>
        <div className='flex flex-col flex-1 min-w-0'>

          {/* Tabs */}
          <div className='flex gap-1 px-6 border-b border-gray-100'>
            {(['objects', 'properties'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-3 text-sm font-medium border-b-2 -mb-px capitalize transition-colors ${
                  activeTab === tab
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {activeTab === 'objects' && (
            <div className='flex flex-col gap-4 p-6'>
              {/* Breadcrumb + actions */}
              <div className='flex items-center justify-between'>
                <div className='flex items-center gap-2 text-sm text-gray-500'>
                  <button onClick={() => navigate('/subaccount/buckets')} className='hover:underline'>Buckets</button>
                  <CaretRight size={12} />
                  <button onClick={() => navigateToPrefix('')} className='hover:underline text-gray-700'>{bucketName}</button>
                  {breadcrumbParts.map((part, i) => {
                    const partPrefix = breadcrumbParts.slice(0, i + 1).join('/') + '/';
                    return (
                      <span key={partPrefix} className='flex items-center gap-2'>
                        <CaretRight size={12} />
                        <button onClick={() => navigateToPrefix(partPrefix)} className='hover:underline text-blue-600'>{part}</button>
                      </span>
                    );
                  })}
                </div>
                <div className='flex items-center gap-2'>
                  {selectedKeys.size > 0 && (
                    <Button
                      variant='secondary'
                      className='rounded-md flex items-center gap-2 text-red-600 border-red-200 hover:bg-red-50'
                      disabled={hasSelectedFolder}
                      onClick={() => setIsDeleteDialogOpen(true)}
                      title={hasSelectedFolder ? 'Deselect folders before deleting' : undefined}
                    >
                      <Trash size={16} />
                      Delete ({selectedKeys.size})
                    </Button>
                  )}
                  <Button className='rounded-md flex items-center gap-2' onClick={() => setIsUploadOpen(true)}>
                    <UploadSimple size={16} />
                    Upload Files
                  </Button>
                  <Button variant='secondary' className='rounded-md flex items-center gap-2' onClick={() => { setFolderName(''); setIsCreateFolderOpen(true); }}>
                    <FolderPlus size={16} />
                    Create Folder
                  </Button>
                </div>
              </div>

              {/* Search */}
              <div className='flex items-center gap-2'>
                <div className='relative flex items-center'>
                  <input
                    type='text'
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder='Search Objects by Prefix'
                    className='border border-gray-200 rounded-md pl-3 pr-8 py-1.5 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-300 w-60'
                  />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery('')} className='absolute right-2 text-gray-400 hover:text-gray-600'>
                      ✕
                    </button>
                  )}
                </div>
              </div>

              {/* Table */}
              <div className='overflow-x-auto'>
                <ObjectsTable
                  objects={filteredObjects}
                  selectedKeys={selectedKeys}
                  onSelectKey={onSelectKey}
                  onSelectAll={onSelectAll}
                  onFolderClick={navigateToPrefix}
                  onFileClick={setSelectedFile}
                  onDownload={onDownload}
                  onDelete={onDeleteSingle}
                  isLoading={isLoading}
                />
              </div>
            </div>
          )}

          {activeTab === 'properties' && client && (
            <div className='p-6'>
              <BucketPropertiesTab
                client={client}
                bucketName={bucketName!}
                onDeleted={() => navigate('/subaccount/buckets')}
              />
            </div>
          )}
        </div>

        {selectedFile && (
          <FileDetailsPanel
            obj={selectedFile}
            onClose={() => setSelectedFile(null)}
            onDownload={(obj) => { onDownload(obj); }}
            onCopyPath={onCopyPath}
            onDelete={(obj) => { setSelectedFile(null); onDeleteSingle(obj); }}
          />
        )}
      </div>

      <UploadModal
        isOpen={isUploadOpen}
        bucket={bucketName!}
        prefix={prefix}
        client={client}
        onClose={() => setIsUploadOpen(false)}
        onUploaded={loadObjects}
      />

      <Dialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onPrimaryAction={onDeleteSelected}
        onSecondaryAction={() => setIsDeleteDialogOpen(false)}
        isLoading={isDeletingSelected}
        primaryAction='Delete'
        secondaryAction='Cancel'
        primaryActionColor='danger'
        title='Delete objects'
        subtitle={`This will permanently delete ${selectedKeys.size} object(s). This action cannot be undone.`}
      />

      <Dialog
        isOpen={!!fileToDelete}
        onClose={() => setFileToDelete(null)}
        onPrimaryAction={onConfirmDeleteSingle}
        onSecondaryAction={() => setFileToDelete(null)}
        isLoading={isDeletingSingle}
        primaryAction='Delete'
        secondaryAction='Cancel'
        primaryActionColor='danger'
        title='Delete object'
        subtitle={`This will permanently delete "${fileToDelete?.key.split('/').filter(Boolean).pop()}". This action cannot be undone.`}
      />

      <Modal isOpen={isCreateFolderOpen} onClose={() => !isCreatingFolder && setIsCreateFolderOpen(false)}>
        <div className='flex flex-col gap-5 w-full min-w-[400px]'>
          <p className='text-black text-xl font-semibold'>Create Folder</p>
          <div className='flex flex-col gap-1'>
            <label className='text-sm text-gray-700'>Folder Name</label>
            <input
              type='text'
              placeholder='my-folder'
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && onCreateFolder()}
              className='w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400'
              autoFocus
            />
          </div>
          <div className='flex gap-3 justify-end'>
            <Button variant='secondary' className='rounded-md' onClick={() => setIsCreateFolderOpen(false)} disabled={isCreatingFolder}>
              Cancel
            </Button>
            <Button
              className='rounded-md'
              disabled={!folderName.trim() || isCreatingFolder}
              loading={isCreatingFolder}
              onClick={onCreateFolder}
            >
              Create
            </Button>
          </div>
        </div>
      </Modal>
    </section>
  );
};
