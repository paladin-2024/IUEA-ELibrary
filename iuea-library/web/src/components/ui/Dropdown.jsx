import { useState, useRef, useEffect } from 'react';
import { FiChevronDown }               from 'react-icons/fi';
import { cn }                          from '../../utils/cn';

/**
 * Dropdown — accessible select-like dropdown.
 *
 * Props:
 *   options   — [{ value, label }]
 *   value     — currently selected value
 *   onChange  — (value) => void
 *   placeholder
 *   className
 */
export default function Dropdown({
  options     = [],
  value,
  onChange,
  placeholder = 'Select…',
  className   = '',
}) {
  const [open, setOpen]     = useState(false);
  const containerRef        = useRef(null);
  const selected            = options.find((o) => o.value === value);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={containerRef} className={cn('relative inline-block text-left', className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-input text-left text-gray-700 hover:border-primary transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20"
      >
        <span className="flex-1 truncate">
          {selected?.label ?? placeholder}
        </span>
        <FiChevronDown
          size={14}
          className={cn('shrink-0 text-gray-400 transition-transform', open && 'rotate-180')}
        />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full min-w-[10rem] bg-white border border-gray-100 rounded-card shadow-card overflow-hidden">
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => { onChange(opt.value); setOpen(false); }}
              className={cn(
                'w-full text-left px-3 py-2 text-sm transition-colors',
                opt.value === value
                  ? 'bg-primary/10 text-primary font-medium'
                  : 'text-gray-700 hover:bg-surface',
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
