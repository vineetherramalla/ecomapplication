function Pagination({ currentPage, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;

  return (
    <div className="mt-6 flex flex-wrap items-center justify-center gap-2 sm:mt-8 sm:gap-3">
      {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
        <button
          key={page}
          type="button"
          onClick={() => onPageChange(page)}
          className={`h-9 w-9 rounded-full text-xs font-semibold transition sm:h-11 sm:w-11 sm:text-sm ${page === currentPage ? 'bg-primary text-textMain' : 'bg-white text-slate-700 hover:bg-slate-100'}`}
        >
          {page}
        </button>
      ))}
    </div>
  );
}

export default Pagination;
