import { cn } from '../../utils/cn';

/**
 * Input — pixel-perfect Stitch design.
 *
 * Props:
 *   label     — label shown above input (uppercase tracking style)
 *   icon      — React node rendered on the left
 *   error     — red error text below field
 *   hint      — gray hint text below field
 *   className — extra classes on the <input>
 */
export default function Input({
  label,
  id,
  icon,
  error,
  hint,
  className = '',
  ...props
}) {
  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={id}
          className="block text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider ml-1 mb-2"
        >
          {label}
        </label>
      )}

      <div className="relative group">
        {/* Left icon — transitions to primary on focus */}
        {icon && (
          <span className={cn(
            'absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none',
            'text-outline transition-colors duration-150',
            'group-focus-within:text-primary-container',
          )}>
            {icon}
          </span>
        )}

        <input
          id={id}
          className={cn(
            'w-full bg-surface-container-lowest border-none',
            'ring-1 ring-outline-variant/30',
            'focus:ring-2 focus:ring-primary-container',
            'rounded-xl py-4 pr-4 text-on-surface',
            'placeholder:text-outline-variant',
            'transition-all duration-150 outline-none',
            'font-body text-sm',
            error && 'ring-error focus:ring-error',
            icon ? 'pl-12' : 'pl-4',
            className,
          )}
          {...props}
        />
      </div>

      {error && (
        <p className="text-error text-[12px] mt-1 ml-1 leading-tight">{error}</p>
      )}
      {!error && hint && (
        <p className="text-on-surface-variant/60 text-[12px] mt-1 ml-1 leading-tight">{hint}</p>
      )}
    </div>
  );
}
