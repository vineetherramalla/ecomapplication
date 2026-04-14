import { useEffect } from 'react';
import { X } from 'lucide-react';

function Modal({ isOpen, onClose, title, children }) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-start justify-center bg-black/50 p-4 overflow-y-auto sm:items-center text-left">
      <div
        className="relative w-full h-auto bg-white rounded-lg shadow-2xl overflow-hidden max-w-md sm:max-w-lg my-8"
        role="dialog"
        aria-modal="true"
      >
        <div className="p-6 sm:p-8">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors z-20"
            aria-label="Close"
          >
            <X size={24} />
          </button>
          
          {title && (
            <h2 className="mb-6 text-xl font-black uppercase tracking-tighter text-textMain border-b border-primary pb-3 inline-block">
              {title}
            </h2>
          )}
          
          {children}
        </div>
      </div>
    </div>
  );
}

export default Modal;
