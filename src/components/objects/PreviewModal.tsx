import Modal from '../Modal';
import Loader from '../Loader';
import { PreviewKind } from '../../utils/previewable';

interface PreviewModalProps {
  isOpen: boolean;
  fileName: string;
  kind: PreviewKind | null;
  url: string | null;
  isLoading: boolean;
  error: string | null;
  onClose: () => void;
}

export const PreviewModal = ({ isOpen, fileName, kind, url, isLoading, error, onClose }: PreviewModalProps) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth='max-w-3xl' width='w-full'>
      <div className='flex flex-col gap-4 w-full min-w-[320px]'>
        <p className='text-black text-lg font-semibold truncate'>{fileName}</p>

        {isLoading && (
          <div className='flex justify-center py-16'>
            <Loader type='spinner' size={28} />
          </div>
        )}

        {!isLoading && kind === null && (
          <p className='text-sm text-gray-500 text-center py-16'>
            Preview isn't available for this file type.
          </p>
        )}

        {!isLoading && kind !== null && error && (
          <p className='text-sm text-red-500 text-center py-16'>{error}</p>
        )}

        {!isLoading && kind !== null && !error && url && kind === 'image' && (
          <img src={url} alt={fileName} className='max-w-full max-h-[70vh] object-contain mx-auto' />
        )}

        {!isLoading && kind !== null && !error && url && (kind === 'pdf' || kind === 'text') && (
          <iframe src={url} title={fileName} className='w-full h-[70vh] border border-gray-200 rounded-md' />
        )}

        {!isLoading && kind !== null && !error && url && kind === 'video' && (
          <video src={url} controls className='max-w-full max-h-[70vh] mx-auto' />
        )}

        {!isLoading && kind !== null && !error && url && kind === 'audio' && (
          <audio src={url} controls className='w-full' />
        )}
      </div>
    </Modal>
  );
};
