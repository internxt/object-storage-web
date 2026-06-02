import { X, DownloadSimple, Copy, Trash } from '@phosphor-icons/react';
import prettyBytes from 'pretty-bytes';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { S3Object } from '../../services/s3.service';

dayjs.extend(utc);
dayjs.extend(timezone);

interface FileDetailsPanelProps {
  obj: S3Object;
  onClose: () => void;
  onDownload: (obj: S3Object) => void;
  onCopyPath: (obj: S3Object) => void;
  onDelete: (obj: S3Object) => void;
}

export const FileDetailsPanel = ({ obj, onClose, onDownload, onCopyPath, onDelete }: FileDetailsPanelProps) => {
  const filename = obj.key.split('/').filter(Boolean).pop() ?? obj.key;
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const tzAbbr = new Intl.DateTimeFormat('en', { timeZoneName: 'shortOffset', timeZone: tz })
    .formatToParts()
    .find((p) => p.type === 'timeZoneName')?.value ?? 'UTC';

  return (
    <div className='flex flex-col h-full w-80 border-l border-gray-200 bg-white'>
      <div className='flex items-center justify-between px-6 py-4 border-b border-gray-200'>
        <p className='font-semibold text-gray-900'>File Details</p>
        <button onClick={onClose} className='text-gray-400 hover:text-gray-600'>
          <X size={18} />
        </button>
      </div>

      <div className='flex flex-col gap-5 px-6 py-5 flex-1 overflow-y-auto'>
        <div className='flex flex-col gap-1'>
          <p className='text-xs text-gray-500 font-medium uppercase tracking-wide'>File Name</p>
          <p className='text-sm text-gray-900 break-all'>{filename}</p>
        </div>

        <div className='flex flex-col gap-1'>
          <p className='text-xs text-gray-500 font-medium uppercase tracking-wide'>File Size</p>
          <p className='text-sm text-gray-900'>{prettyBytes(obj.size)}</p>
        </div>

        <div className='flex flex-col gap-1'>
          <p className='text-xs text-gray-500 font-medium uppercase tracking-wide'>Last Modified</p>
          <p className='text-sm text-gray-900'>
            {dayjs(obj.lastModified).format('DD-MMM-YYYY hh:mm A')} ({tzAbbr})
          </p>
        </div>

        <div className='flex flex-col gap-1'>
          <p className='text-xs text-gray-500 font-medium uppercase tracking-wide'>Path</p>
          <p className='text-sm text-gray-500 break-all'>{obj.key}</p>
        </div>
      </div>

      <div className='flex flex-col border-t border-gray-100'>
        <button
          onClick={() => onDownload(obj)}
          className='flex items-center gap-3 px-6 py-3.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors'
        >
          <DownloadSimple size={18} className='text-gray-500' />
          Download File
        </button>
        <button
          onClick={() => onCopyPath(obj)}
          className='flex items-center gap-3 px-6 py-3.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors'
        >
          <Copy size={18} className='text-gray-500' />
          Copy Path
        </button>
        <button
          onClick={() => onDelete(obj)}
          className='flex items-center gap-3 px-6 py-3.5 text-sm text-red-600 hover:bg-red-50 transition-colors'
        >
          <Trash size={18} />
          Delete File
        </button>
      </div>
    </div>
  );
};
