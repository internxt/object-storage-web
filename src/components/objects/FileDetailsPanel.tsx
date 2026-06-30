import { useState } from 'react';
import { XIcon, DownloadSimpleIcon, CopyIcon, TrashIcon, CheckCircleIcon, PencilSimpleIcon } from '@phosphor-icons/react';
import prettyBytes from 'pretty-bytes';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { S3Object } from '../../services/s3.service';

dayjs.extend(utc);
dayjs.extend(timezone);

type RetentionMode = 'GOVERNANCE' | 'COMPLIANCE';
type RetentionChoice = RetentionMode | 'NONE';

interface ObjectRetention {
  mode?: RetentionMode;
  retainUntilDate?: Date;
}

interface FileDetailsPanelProps {
  obj: S3Object;
  retention?: ObjectRetention | null;
  isSavingRetention?: boolean;
  onClose: () => void;
  onDownload: (obj: S3Object) => void;
  onCopyPath: (obj: S3Object) => void;
  onDelete: (obj: S3Object) => void;
  onShowAllVersions: (obj: S3Object) => void;
  onSaveRetention?: (mode: RetentionMode, retainUntilDate: Date) => Promise<void>;
}

const RetentionOption = ({ title, description, badge, selected, warning, onSelect }: {
  title: string; description: string; badge?: string; selected: boolean; warning?: boolean; onSelect: () => void;
}) => (
  <label className='flex items-start gap-3 cursor-pointer select-none'>
    <input
      type='radio'
      checked={selected}
      onChange={onSelect}
      className='mt-0.5 cursor-pointer accent-gray-100'
    />
    <div className='flex flex-col gap-1'>
      <span className='flex items-center gap-2'>
        <span className='text-sm font-medium text-gray-100'>{title}</span>
        {badge && (
          <span className='text-[11px] font-semibold text-green bg-gray-5 px-2 py-0.5 rounded-full'>
            {badge}
          </span>
        )}
      </span>
      <span
        className={`text-xs ${warning ? 'text-gray-80' : 'text-gray-50'}`}
        style={warning ? { backgroundColor: '#FCE4D6' } : undefined}
      >
        {description}
      </span>
    </div>
  </label>
);

export const FileDetailsPanel = ({
  obj, retention, isSavingRetention = false, onClose, onDownload, onCopyPath, onDelete, onShowAllVersions, onSaveRetention,
}: FileDetailsPanelProps) => {
  const filename = obj.key.split('/').filter(Boolean).pop() ?? obj.key;
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const tzAbbr = new Intl.DateTimeFormat('en', { timeZoneName: 'shortOffset', timeZone: tz })
    .formatToParts()
    .find((p) => p.type === 'timeZoneName')?.value ?? 'UTC';

  const [isEditing, setIsEditing] = useState(false);
  const [editChoice, setEditChoice] = useState<RetentionChoice>(retention?.mode ?? 'NONE');
  const [editDate, setEditDate] = useState(
    retention?.retainUntilDate ? dayjs(retention.retainUntilDate).format('YYYY-MM-DD') : '',
  );

  const openEdit = () => {
    setEditChoice(retention?.mode ?? 'NONE');
    setEditDate(retention?.retainUntilDate ? dayjs(retention.retainUntilDate).format('YYYY-MM-DD') : '');
    setIsEditing(true);
  };

  const handleApply = async () => {
    if (!editDate || editChoice === 'NONE' || !onSaveRetention) return;
    await onSaveRetention(editChoice, dayjs(editDate).endOf('day').toDate());
    setIsEditing(false);
  };

  const originalDate = retention?.retainUntilDate ? dayjs(retention.retainUntilDate).format('YYYY-MM-DD') : '';
  const hasChanged = editChoice !== (retention?.mode ?? 'NONE') || editDate !== originalDate;
  const canApply = editChoice !== 'NONE' && !!editDate && hasChanged;
  const isLockedCompliance = retention?.mode === 'COMPLIANCE';

  return (
    <div className='flex flex-col h-full w-80 border-l border-gray-20 bg-white'>
      <div className='flex items-center justify-between px-6 py-4 border-b border-gray-20'>
        <p className='font-semibold text-gray-100'>File Details</p>
        <button onClick={onClose} className='text-gray-40 hover:text-gray-60'>
          <XIcon size={18} />
        </button>
      </div>

      <div className='flex flex-col gap-5 px-6 py-5 flex-1 overflow-y-auto'>
        <div className='flex flex-col gap-1'>
          <p className='text-xs text-gray-50 font-medium uppercase tracking-wide'>File Name</p>
          <p className='text-sm text-gray-100 break-all'>{filename}</p>
        </div>

        <div className='flex flex-col gap-1'>
          <p className='text-xs text-gray-50 font-medium uppercase tracking-wide'>File Size</p>
          <p className='text-sm text-gray-100'>{prettyBytes(obj.size)}</p>
        </div>

        <div className='flex flex-col gap-1'>
          <p className='text-xs text-gray-50 font-medium uppercase tracking-wide'>Last Modified</p>
          <p className='text-sm text-gray-100'>
            {dayjs(obj.lastModified).format('DD-MMM-YYYY hh:mm A')} ({tzAbbr})
          </p>
        </div>

        <div className='flex flex-col gap-1'>
          <p className='text-xs text-gray-50 font-medium uppercase tracking-wide'>Path</p>
          <p className='text-sm text-gray-50 break-all'>{obj.key}</p>
        </div>

        <div className='flex flex-col gap-1'>
          <div className='flex items-center justify-between'>
            <p className='text-xs text-gray-50 font-medium uppercase tracking-wide'>Version ID</p>
            {!obj.isFolder && (
              <button
                onClick={() => onShowAllVersions(obj)}
                className='text-xs text-primary hover:underline'
              >
                Show all versions
              </button>
            )}
          </div>
          <p className='text-sm text-gray-100 break-all'>
            {!obj.isFolder && obj.versionId && obj.versionId !== 'null' ? obj.versionId : '—'}
          </p>
        </div>

        {(retention?.mode || onSaveRetention) && !isEditing && (
          <div className='flex flex-col gap-1'>
            <div className='flex items-center justify-between'>
              <p className='text-xs text-gray-50 font-medium uppercase tracking-wide flex items-center gap-1.5'>
                {retention?.mode && <CheckCircleIcon size={14} weight='fill' className='text-green' />}
                Object Locking
              </p>
              {onSaveRetention && (
                <button onClick={openEdit} className='text-xs text-primary hover:underline flex items-center gap-1'>
                  <PencilSimpleIcon size={12} /> Edit
                </button>
              )}
            </div>
            {retention?.mode && retention.retainUntilDate ? (
              <>
                <p className='text-sm text-gray-100'>Mode: {retention.mode}</p>
                <p className='text-sm text-gray-100'>
                  Retain Until: {dayjs(retention.retainUntilDate).format('DD-MMM-YYYY hh:mm A')} ({tzAbbr})
                </p>
              </>
            ) : (
              <p className='text-xs text-gray-50'>Not locked</p>
            )}
          </div>
        )}

        {isEditing && (
          <div className='flex flex-col gap-4 pt-1 border-t border-gray-10'>
            <p className='text-sm font-semibold text-gray-100 pt-4'>Object Locking</p>

            <RetentionOption
              title='Enable Governance Mode'
              badge={retention?.mode === 'GOVERNANCE' ? 'Enabled' : undefined}
              description='Objects placed in Governance Mode remain immutable until after they have reached the retain until date, unless a user has specific IAM permissions to alter the settings.'
              selected={editChoice === 'GOVERNANCE'}
              onSelect={() => setEditChoice('GOVERNANCE')}
            />
            <RetentionOption
              title='Compliance Mode'
              badge={retention?.mode === 'COMPLIANCE' ? 'Enabled' : undefined}
              description='Objects placed in Compliance Mode remain immutable until after they have reached the retain until date. This cannot be reversed for any reason, by any user, regardless of user permissions.'
              selected={editChoice === 'COMPLIANCE'}
              onSelect={() => setEditChoice('COMPLIANCE')}
            />
            <RetentionOption
              title='None'
              description='This is only used if an Object Locking Configuration exists.'
              selected={editChoice === 'NONE'}
              warning={isLockedCompliance}
              onSelect={() => setEditChoice('NONE')}
            />

            <div className='flex items-center justify-between gap-3'>
              <label className='text-sm text-gray-80 whitespace-nowrap'>Retain Until:</label>
              <input
                type='date'
                value={editDate}
                min={dayjs().format('YYYY-MM-DD')}
                onChange={(e) => setEditDate(e.target.value)}
                className='flex-1 border border-gray-20 rounded-md px-3 py-2 text-sm text-gray-80 bg-gray-5 disabled:opacity-50 focus:outline-none focus:ring-1 focus:ring-gray-30'
              />
            </div>
          </div>
        )}
      </div>

      {isEditing ? (
        <div className='flex items-center justify-end gap-2 px-6 py-4 border-t border-gray-10'>
          <button
            onClick={() => setIsEditing(false)}
            disabled={isSavingRetention}
            className='px-4 py-2 text-sm border border-gray-30 rounded-md text-gray-80 hover:bg-gray-5 transition-colors disabled:opacity-50'
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            disabled={!canApply || isSavingRetention}
            className='px-4 py-2 text-sm rounded-md bg-gray-100 text-white hover:opacity-90 transition-colors disabled:opacity-50'
          >
            {isSavingRetention ? 'Applying…' : 'Apply'}
          </button>
        </div>
      ) : (
        <div className='flex flex-col border-t border-gray-10'>
          <button
            onClick={() => onDownload(obj)}
            className='flex items-center gap-3 px-6 py-3.5 text-sm text-gray-80 hover:bg-gray-5 transition-colors'
          >
            <DownloadSimpleIcon size={18} className='text-gray-50' />
            Download File
          </button>
          <button
            onClick={() => onCopyPath(obj)}
            className='flex items-center gap-3 px-6 py-3.5 text-sm text-gray-80 hover:bg-gray-5 transition-colors'
          >
            <CopyIcon size={18} className='text-gray-50' />
            Copy Path
          </button>
          <button
            onClick={() => onDelete(obj)}
            className='flex items-center gap-3 px-6 py-3.5 text-sm text-red hover:bg-gray-5 transition-colors'
          >
            <TrashIcon size={18} />
            Delete File
          </button>
        </div>
      )}
    </div>
  );
};
