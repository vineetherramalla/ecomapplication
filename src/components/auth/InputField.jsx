const InputField = ({
  label,
  type = 'text',
  name,
  value,
  onChange,
  placeholder,
  required = true,
  error,
  invalid,
  id,
  ...props
}) => {
  const hasError = typeof invalid === 'boolean' ? invalid : Boolean(error);
  const errorMessage = typeof error === 'string' ? error.trim() : '';
  const inputId = id || name;
  const errorId = errorMessage && inputId ? `${inputId}-error` : undefined;

  return (
    <div className="space-y-1">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-slate-700">
          {label}
        </label>
      )}
      <input
        id={inputId}
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        aria-invalid={hasError}
        aria-describedby={errorId}
        className={`w-full rounded-2xl border ${hasError ? 'border-red-500 focus:border-red-500' : 'border-slate-200 focus:border-primary'} bg-white px-4 py-3 text-sm outline-none transition-all`}
        {...props}
      />
      {errorMessage ? (
        <p id={errorId} className="mt-1 text-xs text-red-500">
          {errorMessage}
        </p>
      ) : null}
    </div>
  );
};

export default InputField;
