import { useRef, useState } from 'react';
import { UploadSimple, X, CheckCircle, Warning } from '@phosphor-icons/react';
import prettyBytes from 'pretty-bytes';
import { S3Client } from '@aws-sdk/client-s3';
import Modal from '../Modal';
import Button from '../Button';
import { s3Service } from '../../services/s3.service';
import { useS3Client } from '../../hooks/useS3Client';
import notificationsService from '../../services/notifications.service';

interface FileUploadState {
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'done' | 'error';
  error?: string;
}

interface UploadModalProps {
  isOpen: boolean;
  bucket: string;
  prefix: string;
  client?: S3Client | null;
  onClose: () => void;
  onUploaded: () => void;
}

export const UploadModal = ({ isOpen, bucket, prefix, client: clientProp, onClose, onUploaded }: UploadModalProps) => {
  const { client: hookClient } = useS3Client();
  const client = clientProp ?? hookClient;
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<FileUploadState[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const addFiles = (incoming: FileList | null) => {
    if (!incoming) return;
    const newFiles: FileUploadState[] = Array.from(incoming).map((file) => ({
      file,
      progress: 0,
      status: 'pending',
    }));
    setFiles((prev) => [...prev, ...newFiles]);
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    addFiles(e.dataTransfer.files);
  };

  const handleClose = () => {
    if (!isUploading) {
      setFiles([]);
      onClose();
    }
  };

  const uploadAll = async () => {
    if (!client || files.length === 0) return;
    setIsUploading(true);

    let anyError = false;
    for (let i = 0; i < files.length; i++) {
      const { file } = files[i];
      const key = prefix + file.name;

      setFiles((prev) => prev.map((f, idx) => idx === i ? { ...f, status: 'uploading' } : f));

      try {
        await s3Service.uploadObject(client, bucket, key, file, (progress) => {
          setFiles((prev) => prev.map((f, idx) => idx === i ? { ...f, progress } : f));
        });
        setFiles((prev) => prev.map((f, idx) => idx === i ? { ...f, status: 'done', progress: 100 } : f));
      } catch (err) {
        anyError = true;
        setFiles((prev) =>
          prev.map((f, idx) => idx === i ? { ...f, status: 'error', error: (err as Error).message } : f),
        );
      }
    }

    setIsUploading(false);

    if (!anyError) {
      notificationsService.success({ text: `${files.length} file(s) uploaded` });
      setFiles([]);
      onUploaded();
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose}>
      <div className='flex flex-col gap-5 w-full min-w-[480px]'>
        <p className='text-black text-xl font-semibold'>Upload Files</p>

        {/* Drop zone */}
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
          }`}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
        >
          <UploadSimple size={32} className='mx-auto text-gray-400 mb-2' />
          <p className='text-sm text-gray-500'>
            Drag & drop files here, or <span className='text-blue-600 font-medium'>browse</span>
          </p>
          <input
            ref={inputRef}
            type='file'
            multiple
            className='hidden'
            onChange={(e) => addFiles(e.target.files)}
          />
        </div>

        {/* File list */}
        {files.length > 0 && (
          <div className='flex flex-col gap-2 max-h-60 overflow-y-auto'>
            {files.map((f, i) => (
              <div key={i} className='flex items-center gap-3 text-sm'>
                <div className='flex-1 min-w-0'>
                  <div className='flex justify-between mb-1'>
                    <span className='truncate text-gray-700'>{f.file.name}</span>
                    <span className='text-gray-400 ml-2 shrink-0'>{prettyBytes(f.file.size)}</span>
                  </div>
                  {f.status !== 'error' && (
                    <div className='h-1.5 bg-gray-100 rounded-full overflow-hidden'>
                      <div
                        className='h-full transition-all duration-300'
                        style={{
                          width: f.status === 'done' ? '100%' : `${f.progress}%`,
                          backgroundColor: f.status === 'done' ? '#22c55e' : '#3b82f6',
                        }}
                      />
                    </div>
                  )}
                  {f.status === 'error' && (
                    <p className='text-red-500 text-xs'>{f.error}</p>
                  )}
                </div>
                {f.status === 'done' && <CheckCircle size={18} className='text-green-500 shrink-0' />}
                {f.status === 'error' && <Warning size={18} className='text-red-500 shrink-0' />}
                {f.status === 'pending' && (
                  <button onClick={() => removeFile(i)} className='shrink-0 hover:text-red-500'>
                    <X size={16} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        <div className='flex gap-3 justify-end'>
          <Button variant='secondary' className='rounded-md' onClick={handleClose} disabled={isUploading}>
            Cancel
          </Button>
          <Button
            className='rounded-md'
            disabled={files.length === 0 || isUploading}
            loading={isUploading}
            onClick={uploadAll}
          >
            Upload {files.length > 0 ? `(${files.length})` : ''}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
