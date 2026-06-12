import { useEffect, useState } from 'react';
import { S3Client } from '@aws-sdk/client-s3';
import { s3Service, S3Bucket } from '../../services/s3.service';
import notificationsService from '../../services/notifications.service';
import Button from '../Button';
import Dialog from '../Dialog';

interface BucketPropertiesTabProps {
  client: S3Client;
  bucketName: string;
  onDeleted: () => void;
}

const Toggle = ({ enabled, onChange }: { enabled: boolean; onChange: (v: boolean) => void }) => (
  <button
    type='button'
    onClick={() => onChange(!enabled)}
    style={{ backgroundColor: enabled ? '#1f2937' : '#d1d5db', minWidth: '44px' }}
    className='relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none cursor-pointer'
  >
    <span
      style={{ transform: enabled ? 'translateX(20px)' : 'translateX(0px)' }}
      className='inline-block h-5 w-5 rounded-full bg-white shadow transition-transform duration-200'
    />
  </button>
);

export const BucketPropertiesTab = ({ client, bucketName, onDeleted }: BucketPropertiesTabProps) => {
  const [isSavingVersioning, setIsSavingVersioning] = useState(false);
  const [isSavingLogging, setIsSavingLogging] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [versioningEnabled, setVersioningEnabled] = useState(false);
  const [versioningLoaded, setVersioningLoaded] = useState(false);

  const [loggingEnabled, setLoggingEnabled] = useState(false);
  const [loggingTarget, setLoggingTarget] = useState('');
  const [loggingPrefix, setLoggingPrefix] = useState('');
  const [loggingLoaded, setLoggingLoaded] = useState(false);

  const [lockEnabled, setLockEnabled] = useState(false);
  const [lockLoaded, setLockLoaded] = useState(false);

  const [buckets, setBuckets] = useState<S3Bucket[]>([]);

  useEffect(() => {
    s3Service.listBuckets(client).then(setBuckets).catch(() => {});

    s3Service.getBucketVersioning(client, bucketName)
      .then((v) => { setVersioningEnabled(v.enabled); setVersioningLoaded(true); })
      .catch(() => setVersioningLoaded(true));

    s3Service.getBucketLogging(client, bucketName)
      .then((l) => {
        setLoggingEnabled(l.enabled);
        setLoggingTarget(l.targetBucket ?? '');
        setLoggingPrefix(l.targetPrefix ?? '');
        setLoggingLoaded(true);
      })
      .catch(() => setLoggingLoaded(true));

    s3Service.getObjectLockConfig(client, bucketName)
      .then((l) => { setLockEnabled(l.enabled); setLockLoaded(true); })
      .catch(() => setLockLoaded(true));
  }, [client, bucketName]);

  const saveVersioning = async () => {
    setIsSavingVersioning(true);
    try {
      await s3Service.setBucketVersioning(client, bucketName, versioningEnabled);
      notificationsService.success({ text: 'Versioning updated' });
    } catch (err) {
      notificationsService.error({ text: (err as Error).message });
    } finally {
      setIsSavingVersioning(false);
    }
  };

  const saveLogging = async () => {
    setIsSavingLogging(true);
    try {
      await s3Service.setBucketLogging(client, bucketName, loggingEnabled, loggingTarget, loggingPrefix);
      notificationsService.success({ text: 'Logging updated' });
    } catch (err) {
      notificationsService.error({ text: (err as Error).message });
    } finally {
      setIsSavingLogging(false);
    }
  };

  const deleteBucket = async () => {
    setIsDeleting(true);
    try {
      await s3Service.deleteBucket(client, bucketName);
      notificationsService.success({ text: `Bucket "${bucketName}" deleted` });
      setIsDeleteDialogOpen(false);
      onDeleted();
    } catch (err) {
      notificationsService.error({ text: (err as Error).message });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      {/* 3-column cards */}
      <div className='grid grid-cols-3 gap-4'>

        {/* Versioning */}
        <div className='bg-white rounded-lg p-6 flex flex-col gap-4' style={{ border: '1px solid #e5e7eb' }}>
          <p className='font-semibold text-gray-900'>Bucket Versioning</p>

          <label className='flex items-start gap-3 cursor-pointer select-none'>
            <input
              type='radio'
              name='versioning'
              checked={!versioningEnabled}
              disabled={!versioningLoaded}
              onChange={() => setVersioningEnabled(false)}
              className='mt-0.5 cursor-pointer accent-gray-800'
            />
            <div>
              <p className='text-sm font-medium text-gray-900'>Unversioned</p>
              <p className='text-xs text-gray-500 mt-1'>
                This is the default setting. After a bucket is versioned, versioning can be suspended but never be returned to an unversioned state.
              </p>
            </div>
          </label>

          <label className='flex items-start gap-3 cursor-pointer select-none'>
            <input
              type='radio'
              name='versioning'
              checked={versioningEnabled}
              disabled={!versioningLoaded}
              onChange={() => setVersioningEnabled(true)}
              className='mt-0.5 cursor-pointer accent-gray-800'
            />
            <div>
              <p className='text-sm font-medium text-gray-900'>Enable Versioning</p>
              <p className='text-xs text-gray-500 mt-1'>
                Versioning is a means of keeping multiple variants of an object in the same bucket. You can use versioning to preserve, retrieve, and restore every version of every object stored in your bucket.
              </p>
            </div>
          </label>

          <div className='flex justify-end mt-auto pt-1'>
            <Button className='rounded-md' loading={isSavingVersioning} disabled={!versioningLoaded} onClick={saveVersioning}>
              Update
            </Button>
          </div>
        </div>

        {/* Logging */}
        <div className='bg-white rounded-lg p-6 flex flex-col gap-5' style={{ border: '1px solid #e5e7eb' }}>
          <p className='font-semibold text-gray-900'>Bucket Logging</p>
          <p className='text-sm text-gray-500'>
            When logging is enabled a text log file of all access to a bucket is created in the bucket specified.
          </p>

          <div className='flex items-center justify-between'>
            <p className='text-sm text-gray-700'>Enable Bucket Logging</p>
            <Toggle enabled={loggingEnabled} onChange={setLoggingEnabled} />
          </div>

          <div className='flex flex-col gap-3'>
            <input
              type='text'
              value={loggingPrefix}
              onChange={(e) => setLoggingPrefix(e.target.value)}
              disabled={!loggingEnabled}
              placeholder='Logging Prefix'
              className='w-full border border-gray-200 rounded-md px-3 py-2 text-sm text-gray-700 placeholder-gray-400 bg-gray-50 disabled:opacity-50 focus:outline-none focus:ring-1 focus:ring-gray-300'
            />
            <select
              value={loggingTarget}
              onChange={(e) => setLoggingTarget(e.target.value)}
              disabled={!loggingEnabled}
              className='w-full border border-gray-200 rounded-md px-3 py-2 text-sm text-gray-700 bg-gray-50 disabled:opacity-50 focus:outline-none focus:ring-1 focus:ring-gray-300'
            >
              <option value=''>Select bucket for logs</option>
              {buckets.map((b) => (
                <option key={b.name} value={b.name}>{b.name}</option>
              ))}
            </select>
          </div>

          <div className='flex justify-end mt-auto'>
            <Button className='rounded-md' loading={isSavingLogging} disabled={!loggingLoaded} onClick={saveLogging}>
              Update
            </Button>
          </div>
        </div>

        {/* Object Locking */}
        <div className='bg-white rounded-lg p-6 flex flex-col gap-4' style={{ border: '1px solid #e5e7eb' }}>
          <p className='font-semibold text-gray-900'>Object Locking</p>
          <p className='text-sm text-gray-500'>
            Object Lock must be enabled at the time a bucket is created. Buckets using Object Lock must also have Versioning enabled.
          </p>
          {lockLoaded && (
            <p className='text-sm font-medium text-gray-700'>
              Status: <span className={lockEnabled ? 'text-green-600' : 'text-gray-400'}>{lockEnabled ? 'Enabled' : 'Not enabled'}</span>
            </p>
          )}
        </div>
      </div>

      {/* Delete bucket bar */}
      <div className='flex items-center justify-between bg-white rounded-lg px-6 py-4' style={{ border: '1px solid #e5e7eb' }}>
        <p className='font-semibold text-gray-900'>Delete Bucket</p>
        <button
          onClick={() => setIsDeleteDialogOpen(true)}
          className='px-4 py-2 text-sm border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors'
        >
          Delete
        </button>
      </div>

      <Dialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onPrimaryAction={deleteBucket}
        onSecondaryAction={() => setIsDeleteDialogOpen(false)}
        isLoading={isDeleting}
        primaryAction='Delete'
        secondaryAction='Cancel'
        primaryActionColor='danger'
        title={`Delete "${bucketName}"`}
        subtitle='This will permanently delete the bucket and all its contents. This action cannot be undone.'
      />
    </>
  );
};
