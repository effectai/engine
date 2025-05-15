import { useState, useEffect } from "react";

interface PaginationProps {
  totalItems: number;
  itemsPerPage: number;
  currentPage: number;
  onPageChange: (page: number) => void;
}

export function Pagination({
  totalItems,
  itemsPerPage,
  currentPage,
  onPageChange,
}: PaginationProps) {
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const [visiblePages, setVisiblePages] = useState<number[]>([]);

  useEffect(() => {
    const maxVisible = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let endPage = startPage + maxVisible - 1;

    if (endPage > totalPages) {
      endPage = totalPages;
      startPage = Math.max(1, endPage - maxVisible + 1);
    }

    const pages = [];
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    setVisiblePages(pages);
  }, [currentPage, totalPages]);

  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between mt-4">
      <div className="text-sm text-muted-foreground">
        Showing {(currentPage - 1) * itemsPerPage + 1}-
        {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} tasks
      </div>
      <div className="flex gap-1">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-3 py-1 rounded border disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Previous
        </button>

        {visiblePages[0] > 1 && (
          <>
            <button
              onClick={() => onPageChange(1)}
              className={`px-3 py-1 rounded border ${currentPage === 1 ? "bg-primary text-primary-foreground" : ""}`}
            >
              1
            </button>
            {visiblePages[0] > 2 && <span className="px-3 py-1">...</span>}
          </>
        )}

        {visiblePages.map((page) => (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={`px-3 py-1 rounded border ${currentPage === page ? "bg-primary text-primary-foreground" : ""}`}
          >
            {page}
          </button>
        ))}

        {visiblePages[visiblePages.length - 1] < totalPages && (
          <>
            {visiblePages[visiblePages.length - 1] < totalPages - 1 && (
              <span className="px-3 py-1">...</span>
            )}
            <button
              onClick={() => onPageChange(totalPages)}
              className={`px-3 py-1 rounded border ${currentPage === totalPages ? "bg-primary text-primary-foreground" : ""}`}
            >
              {totalPages}
            </button>
          </>
        )}

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-3 py-1 rounded border disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
        </button>
      </div>
    </div>
  );
}
