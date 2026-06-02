import { Folder, File, ArrowDown, Trash } from '@phosphor-icons/react';
import prettyBytes from 'pretty-bytes';
import dayjs from 'dayjs';
import { S3Object } from '../../services/s3.service';
import { LoadingRowSkeleton } from '../LoadingSkeleton';

interface ObjectsTableProps {
  objects: S3Object[];
  selectedKeys: Set<string>;
  onSelectKey: (key: string, selected: boolean) => void;
  onSelectAll: (selected: boolean) => void;
  onFolderClick: (prefix: string) => void;
  onFileClick?: (obj: S3Object) => void;
  onDownload: (obj: S3Object) => void;
  onDelete: (obj: S3Object) => void;
  isLoading: boolean;
}

export const ObjectsTable = ({
  objects,
  selectedKeys,
  onSelectKey,
  onSelectAll,
  onFolderClick,
  onFileClick,
  onDownload,
  onDelete,
  isLoading,
}: ObjectsTableProps) => {
  const allSelected = objects.length > 0 && objects.every((o) => selectedKeys.has(o.key));

  if (isLoading) {
    return (
      <table className='w-full'>
        <thead>
          <tr className='w-full h-12 bg-gray-10 text-black text-sm'>
            <th className='w-8 px-3' />
            <th className='px-5 text-left'>Name</th>
            <th className='px-5 text-left w-32'>Size</th>
            <th className='px-5 text-left w-52'>Last Modified</th>
            <th className='w-20' />
          </tr>
        </thead>
        <tbody>
          <LoadingRowSkeleton numberOfColumns={5} numberOfRows={5} />
        </tbody>
      </table>
    );
  }

  return (
    <table className='w-full'>
      <thead className='sticky top-0 z-10'>
        <tr className='w-full h-12 bg-gray-10 text-black text-sm'>
          <th className='w-8 px-3'>
            <input
              type='checkbox'
              checked={allSelected}
              onChange={(e) => onSelectAll(e.target.checked)}
              className='cursor-pointer'
            />
          </th>
          <th className='px-5 text-left'>Name</th>
          <th className='px-5 text-left w-32'>Size</th>
          <th className='px-5 text-left w-52'>Last Modified</th>
          <th className='w-20' />
        </tr>
      </thead>
      <tbody>
        {objects.length === 0 ? (
          <tr>
            <td colSpan={5} className='text-center py-8 text-gray-400 text-sm'>
              This folder is empty
            </td>
          </tr>
        ) : (
          objects.map((obj) => {
            const displayName = obj.key.split('/').filter(Boolean).pop() ?? obj.key;
            return (
              <tr key={obj.key} className='h-12 text-sm text-gray-600 hover:bg-gray-5 border-b border-gray-10'>
                <td className='px-3'>
                  <input
                    type='checkbox'
                    checked={selectedKeys.has(obj.key)}
                    onChange={(e) => onSelectKey(obj.key, e.target.checked)}
                    className='cursor-pointer'
                  />
                </td>
                <td className='px-5'>
                  {obj.isFolder ? (
                    <button
                      className='flex items-center gap-2 hover:underline'
                      onClick={() => onFolderClick(obj.key)}
                    >
                      <Folder size={18} className='text-yellow-500' weight='fill' />
                      <span>{displayName}/</span>
                    </button>
                  ) : (
                    <button
                      className='flex items-center gap-2 hover:underline text-left'
                      style={{ color: '#1d4ed8' }}
                      onClick={() => onFileClick?.(obj)}
                    >
                      <File size={18} style={{ color: '#1d4ed8' }} />
                      <span>{displayName}</span>
                    </button>
                  )}
                </td>
                <td className='px-5 text-gray-400'>
                  {obj.isFolder ? '—' : prettyBytes(obj.size)}
                </td>
                <td className='px-5 text-gray-400'>
                  {obj.isFolder ? '—' : dayjs(obj.lastModified).format('DD MMM YYYY HH:mm')}
                </td>
                <td className='px-3'>
                  {!obj.isFolder && (
                    <div className='flex items-center gap-1'>
                      <button
                        onClick={() => onDownload(obj)}
                        className='p-1 hover:bg-gray-20 rounded'
                        title='Download'
                      >
                        <ArrowDown size={16} />
                      </button>
                      <button
                        onClick={() => onDelete(obj)}
                        className='p-1 hover:bg-red-50 rounded text-red-500'
                        title='Delete'
                      >
                        <Trash size={16} />
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            );
          })
        )}
      </tbody>
    </table>
  );
};
