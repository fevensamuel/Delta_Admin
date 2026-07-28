import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems?: number;
  pageSize?: number;
  onPageChange: (page: number) => void;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  totalItems,
  pageSize = 10,
  onPageChange,
}) => {
  if (totalPages <= 1) return null;

  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems || currentPage * pageSize);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 bg-white border-t border-[#E2E8F0] text-xs font-semibold text-[#2D3748]">
      <div>
        {totalItems ? (
          <span>
            Showing <strong className="text-[#111827]">{startItem}</strong> to{' '}
            <strong className="text-[#111827]">{endItem}</strong> of{' '}
            <strong className="text-[#111827]">{totalItems}</strong> items
          </span>
        ) : (
          <span>
            Page <strong className="text-[#111827]">{currentPage}</strong> of{' '}
            <strong className="text-[#111827]">{totalPages}</strong>
          </span>
        )}
      </div>

      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-3 py-1.5 rounded-lg border border-[#E2E8F0] bg-white hover:bg-[#F8FAFC] disabled:opacity-40 disabled:hover:bg-white text-[#111827] font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
        >
          <ChevronLeft className="w-3.5 h-3.5" /> Previous
        </button>

        {/* Page numbers */}
        <div className="flex items-center gap-1">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
            if (
              p === 1 ||
              p === totalPages ||
              (p >= currentPage - 1 && p <= currentPage + 1)
            ) {
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => onPageChange(p)}
                  className={`w-7 h-7 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                    p === currentPage
                      ? 'bg-[#2D7D6B] text-white shadow-xs'
                      : 'hover:bg-[#F1F5F9] text-[#2D3748]'
                  }`}
                >
                  {p}
                </button>
              );
            }
            if (p === 2 && currentPage > 3) {
              return <span key="dots1" className="px-1 text-[#718096]">...</span>;
            }
            if (p === totalPages - 1 && currentPage < totalPages - 2) {
              return <span key="dots2" className="px-1 text-[#718096]">...</span>;
            }
            return null;
          })}
        </div>

        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-3 py-1.5 rounded-lg border border-[#E2E8F0] bg-white hover:bg-[#F8FAFC] disabled:opacity-40 disabled:hover:bg-white text-[#111827] font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
        >
          Next <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
