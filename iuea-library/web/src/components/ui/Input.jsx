import { cn } from '../../utils/cn';

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
          className="block text-[11px] font-semibold text-ink-500 uppercase tracking-wider ml-1 mb-2"
        >
          {label}
        </label>
      )}

      <div className="relative group">
        {icon && (
          <span className={cn(
            'absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none',
            'text-ink-300 transition-colors duration-150',
            'group-focus-within:text-primary',
          )}>
            {icon}
          </span>
        )}

        <input
          id={id}
          className={cn(
            'w-full bg-white border-none',
            'ring-1 ring-border-line',
            'focus:ring-2 focus:ring-primary',
            'rounded-xl py-4 pr-4 text-ink-900',
            'placeholder:text-ink-300',
            'transition-all duration-150 outline-none',
            'text-sm',
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
        <p className="text-ink-300 text-[12px] mt-1 ml-1 leading-tight">{hint}</p>
      )}
    </div>
  );
}
