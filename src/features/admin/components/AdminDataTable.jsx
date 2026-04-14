function AdminDataTable({
  columns,
  rows,
  emptyText = 'No records found.',
  rowKey = 'id',
  minWidthClassName = 'min-w-[720px]',
  tableFixed = false,
}) {
  const safeRows = Array.isArray(rows) ? rows : [];

  return (
    <div className="table-surface">
      <div className="overflow-x-auto">
        <table className={`w-full text-left ${minWidthClassName} ${tableFixed ? 'table-fixed' : ''}`}>
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/80">
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`table-head-cell whitespace-nowrap ${column.headerClassName || ''}`}
                  style={column.width ? { width: column.width } : undefined}
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {safeRows.length ? (
              safeRows.map((row, index) => (
                <tr
                  key={row[rowKey] || row.id || index}
                  className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50/70"
                >
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className={`table-body-cell ${column.cellClassName || ''}`}
                    >
                      <div className="min-w-0">
                        {column.render ? column.render(row) : row[column.key] ?? '--'}
                      </div>
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="px-5 py-16 text-center text-sm text-slate-400">
                  {emptyText}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default AdminDataTable;
