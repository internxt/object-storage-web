import { CaretLeft, CaretRight } from '@phosphor-icons/react';

interface PaginationProps {
  currentPage: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

export const Pagination = ({
  currentPage,
  totalItems,
  pageSize,
  onPageChange,
}: PaginationProps) => {
  const totalPages = Math.ceil(totalItems / pageSize);

  const hasPrevPage = currentPage > 1;
  const hasNextPage = currentPage < totalPages;

  return (
    <div className='flex items-center justify-center'>
      <div className='flex items-center overflow-hidden border border-gray-10'>
        <button
          disabled={!hasPrevPage}
          onClick={() => onPageChange(currentPage - 1)}
          className={`flex items-center justify-center px-3 py-2 ${
            !hasPrevPage
              ? 'text-gray-300 cursor-not-allowed'
              : 'text-gray-500 hover:bg-gray-100'
          }`}
        >
          <CaretLeft size={14} weight='bold' />
        </button>

        <div className='flex items-center justify-center px-4 py-2 bg-primary text-white font-bold'>
          {currentPage}
        </div>

        <button
          disabled={!hasNextPage}
          onClick={() => onPageChange(currentPage + 1)}
          className={`flex items-center justify-center px-3 py-2 ${
            !hasNextPage
              ? 'text-gray-300 cursor-not-allowed'
              : 'text-gray-500 hover:bg-gray-100'
          }`}
        >
          <CaretRight size={14} weight='bold' />
        </button>
      </div>
    </div>
  );
};
