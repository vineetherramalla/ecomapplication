import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

const PasswordInput = ({
  label,
  name,
  value,
  onChange,
  placeholder = '••••••••',
  required = true,
  error,
  invalid,
  id,
  ...props
}) => {
  const [show, setShow] = useState(false);
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
      <div className="relative">
        <input
          id={inputId}
          type={show ? 'text' : 'password'}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          aria-invalid={hasError}
          aria-describedby={errorId}
          className={`w-full rounded-2xl border ${hasError ? 'border-red-500 focus:border-red-500' : 'border-slate-200 focus:border-primary'} bg-white px-4 py-3 pr-12 text-sm outline-none transition-all`}
          {...props}
        />
        <button
          type="button"
          onClick={() => setShow(!show)}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
        >
          {show ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
      {errorMessage ? (
        <p id={errorId} className="mt-1 text-xs text-red-500">
          {errorMessage}
        </p>
      ) : null}
    </div>
  );
};

export default PasswordInput;
