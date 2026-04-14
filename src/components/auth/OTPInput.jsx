import { useEffect, useRef } from 'react';

const OTPInput = ({ value, onChange, length = 6, error, invalid }) => {
  const inputs = useRef([]);
  const hasError = typeof invalid === 'boolean' ? invalid : Boolean(error);
  const errorMessage = typeof error === 'string' ? error.trim() : '';

  useEffect(() => {
    // Focus first input on mount
    if (inputs.current[0]) {
      inputs.current[0].focus();
    }
  }, []);

  const handleChange = (e, index) => {
    const val = e.target.value;
    if (isNaN(val)) return;

    const newOTP = value.split('');
    newOTP[index] = val.substring(val.length - 1);
    const combinedOTP = newOTP.join('');
    onChange(combinedOTP);

    // Focus next input
    if (val && index < length - 1) {
      inputs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === 'Backspace' && !value[index] && index > 0) {
      inputs.current[index - 1].focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, length);
    if (/^\d+$/.test(pastedData)) {
      onChange(pastedData);
      const nextIndex = Math.min(pastedData.length, length - 1);
      inputs.current[nextIndex].focus();
    }
  };

  return (
    <div className="flex flex-col items-center">
      <div className="flex gap-2 sm:gap-4 justify-center" onPaste={handlePaste}>
        {Array.from({ length }).map((_, i) => (
          <input
            key={i}
            ref={(el) => (inputs.current[i] = el)}
            type="text"
            maxLength="1"
            value={value[i] || ''}
            onChange={(e) => handleChange(e, i)}
            onKeyDown={(e) => handleKeyDown(e, i)}
            aria-invalid={hasError}
            className={`h-12 w-10 rounded-2xl border bg-slate-50 text-center text-2xl font-bold text-slate-900 outline-none transition-all sm:h-16 sm:w-14 ${hasError ? 'border-red-500 focus:border-red-500' : 'border-slate-200 focus:border-primary'}`}
          />
        ))}
      </div>
      {errorMessage ? <p className="mt-4 text-sm text-red-500">{errorMessage}</p> : null}
    </div>
  );
};

export default OTPInput;
