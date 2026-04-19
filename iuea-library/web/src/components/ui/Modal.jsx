import { useEffect } from 'react';
import { FiX }       from 'react-icons/fi';

export default function Modal({ title, children, onClose, size = 'md' }) {
  const widths = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-lg', xl: 'max-w-xl' };

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div
        className={`bg-white rounded-2xl shadow-xl w-full ${widths[size]} flex flex-col overflow-hidden`}
      >
        {(title || onClose) && (
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            {title && <h2 className="font-semibold text-gray-800">{title}</h2>}
            {onClose && (
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors ml-auto"
              >
                <FiX size={18} />
              </button>
            )}
          </div>
        )}
        <div className="p-5 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}
