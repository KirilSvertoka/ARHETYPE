import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({ currentPage, totalItems, itemsPerPage, onPageChange }: PaginationProps) {
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  
  if (totalPages <= 1) return null;

  const pages = [];
  for (let i = 1; i <= totalPages; i++) {
    if (
      i === 1 || 
      i === totalPages || 
      (i >= currentPage - 1 && i <= currentPage + 1)
    ) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== '...') {
      pages.push('...');
    }
  }

  return (
    <div className="flex items-center justify-between px-6 py-4 bg-transparent border-t border-brand-border">
      <div className="flex-1 flex justify-between sm:hidden">
        <button
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="relative inline-flex items-center px-4 py-2 border border-brand-border text-sm font-medium rounded-md text-brand-light bg-transparent hover:bg-white/5 disabled:opacity-50"
        >
          Назад
        </button>
        <button
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className="ml-3 relative inline-flex items-center px-4 py-2 border border-brand-border text-sm font-medium rounded-md text-brand-light bg-transparent hover:bg-white/5 disabled:opacity-50"
        >
          Вперед
        </button>
      </div>
      <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-brand-muted">
            Показано <span className="font-medium text-brand-light">{(currentPage - 1) * itemsPerPage + 1}</span> - <span className="font-medium text-brand-light">{Math.min(currentPage * itemsPerPage, totalItems)}</span> из <span className="font-medium text-brand-light">{totalItems}</span> результатов
          </p>
        </div>
        <div>
          <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
            <button
              onClick={() => onPageChange(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-brand-border bg-transparent text-sm font-medium text-brand-muted hover:bg-white/5 disabled:opacity-50"
            >
              <span className="sr-only">Назад</span>
              <ChevronLeft className="h-5 w-5" aria-hidden="true" />
            </button>
            {pages.map((page, idx) => (
              <button
                key={idx}
                onClick={() => typeof page === 'number' && onPageChange(page)}
                disabled={page === '...'}
                className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                  page === currentPage
                    ? 'z-10 bg-brand-light border-brand-light text-brand-bg'
                    : 'bg-transparent border-brand-border text-brand-muted hover:bg-white/5 hover:text-brand-light'
                }`}
              >
                {page}
              </button>
            ))}
            <button
              onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-brand-border bg-transparent text-sm font-medium text-brand-muted hover:bg-white/5 disabled:opacity-50"
            >
              <span className="sr-only">Вперед</span>
              <ChevronRight className="h-5 w-5" aria-hidden="true" />
            </button>
          </nav>
        </div>
      </div>
    </div>
  );
}
