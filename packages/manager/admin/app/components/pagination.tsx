import { Link, useLocation } from "@remix-run/react";
import { useState, useEffect } from "react";

interface PaginationProps {
  totalItems: number;
  currentPage: number;
  itemsPerPage: number;
  maxVisiblePages?: number;
  queryParam?: string;
  onPageChange?: (page: number) => void;
}

export function Pagination({
  totalItems,
  currentPage,
  itemsPerPage,
  maxVisiblePages = 5,
  queryParam = "page",
  onPageChange,
}: PaginationProps) {
  const location = useLocation();
  const [pages, setPages] = useState<number[]>([]);
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  // Calculate visible page numbers
  useEffect(() => {
    if (totalPages <= 1) {
      setPages([]);
      return;
    }

    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = startPage + maxVisiblePages - 1;

    if (endPage > totalPages) {
      endPage = totalPages;
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    const visiblePages = [];
    for (let i = startPage; i <= endPage; i++) {
      visiblePages.push(i);
    }

    setPages(visiblePages);
  }, [currentPage, totalPages, maxVisiblePages]);

  if (totalPages <= 1) return null;

  const handlePageClick = (page: number) => {
    if (onPageChange) {
      onPageChange(page);
    }
  };

  const buildPageUrl = (page: number) => {
    const searchParams = new URLSearchParams(location.search);
    searchParams.set(queryParam, page.toString());
    console.log(searchParams.toString());
    return `${location.pathname}?${searchParams.toString()}`;
  };

  return (
    <nav className="flex items-center justify-between border-t border-gray-200 px-4 py-3 sm:px-6">
      <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-gray-700">
            Showing{" "}
            <span className="font-medium">
              {(currentPage - 1) * itemsPerPage + 1}
            </span>{" "}
            to{" "}
            <span className="font-medium">
              {Math.min(currentPage * itemsPerPage, totalItems)}
            </span>{" "}
            of <span className="font-medium">{totalItems}</span> results
          </p>
        </div>
        <div>
          <ul className="flex items-center -space-x-px">
            {/* Previous Button */}
            <li>
              {currentPage > 1 ? (
                onPageChange ? (
                  <button
                    onClick={() => handlePageClick(currentPage - 1)}
                    className="px-3 py-1 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                  >
                    Previous
                  </button>
                ) : (
                  <Link
                    to={buildPageUrl(currentPage - 1)}
                    className="px-3 py-1 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                  >
                    Previous
                  </Link>
                )
              ) : (
                <span className="px-3 py-1 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-300 cursor-not-allowed">
                  Previous
                </span>
              )}
            </li>

            {pages[0] > 1 && (
              <>
                <li>
                  {onPageChange ? (
                    <button
                      onClick={() => handlePageClick(1)}
                      className={`px-3 py-1 border border-gray-300 bg-white text-sm font-medium ${
                        1 === currentPage
                          ? "text-primary-600 bg-primary-50"
                          : "text-gray-500 hover:bg-gray-50"
                      }`}
                    >
                      1
                    </button>
                  ) : (
                    <Link
                      to={buildPageUrl(1)}
                      className={`px-3 py-1 border border-gray-300 bg-white text-sm font-medium ${
                        1 === currentPage
                          ? "text-primary-600 bg-primary-50"
                          : "text-gray-500 hover:bg-gray-50"
                      }`}
                    >
                      1
                    </Link>
                  )}
                </li>
                {pages[0] > 2 && (
                  <li>
                    <span className="px-3 py-1 border border-gray-300 bg-white text-sm font-medium text-gray-500">
                      ...
                    </span>
                  </li>
                )}
              </>
            )}

            {/* Visible Pages */}
            {pages.map((page) => (
              <li key={page}>
                {onPageChange ? (
                  <button
                    onClick={() => handlePageClick(page)}
                    className={`px-3 py-1 border border-gray-300 text-sm font-medium ${
                      page === currentPage
                        ? "text-primary-600 bg-primary-50"
                        : "bg-white text-gray-500 hover:bg-gray-50"
                    }`}
                  >
                    {page}
                  </button>
                ) : (
                  <Link
                    to={buildPageUrl(page)}
                    className={`px-3 py-1 border border-gray-300 text-sm font-medium ${
                      page === currentPage
                        ? "text-primary-600 bg-primary-50"
                        : "bg-white text-gray-500 hover:bg-gray-50"
                    }`}
                  >
                    {page}
                  </Link>
                )}
              </li>
            ))}

            {/* Last Page */}
            {pages[pages.length - 1] < totalPages && (
              <>
                {pages[pages.length - 1] < totalPages - 1 && (
                  <li>
                    <span className="px-3 py-1 border border-gray-300 bg-white text-sm font-medium text-gray-500">
                      ...
                    </span>
                  </li>
                )}
                <li>
                  {onPageChange ? (
                    <button
                      onClick={() => handlePageClick(totalPages)}
                      className={`px-3 py-1 border border-gray-300 bg-white text-sm font-medium ${
                        totalPages === currentPage
                          ? "text-primary-600 bg-primary-50"
                          : "text-gray-500 hover:bg-gray-50"
                      }`}
                    >
                      {totalPages}
                    </button>
                  ) : (
                    <Link
                      to={buildPageUrl(totalPages)}
                      className={`px-3 py-1 border border-gray-300 bg-white text-sm font-medium ${
                        totalPages === currentPage
                          ? "text-primary-600 bg-primary-50"
                          : "text-gray-500 hover:bg-gray-50"
                      }`}
                    >
                      {totalPages}
                    </Link>
                  )}
                </li>
              </>
            )}

            {/* Next Button */}
            <li>
              {currentPage < totalPages ? (
                onPageChange ? (
                  <button
                    onClick={() => handlePageClick(currentPage + 1)}
                    className="px-3 py-1 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                  >
                    Next
                  </button>
                ) : (
                  <Link
                    to={buildPageUrl(currentPage + 1)}
                    className="px-3 py-1 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                  >
                    Next
                  </Link>
                )
              ) : (
                <span className="px-3 py-1 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-300 cursor-not-allowed">
                  Next
                </span>
              )}
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
}
