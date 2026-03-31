import { clsx } from 'clsx';

export default function Input({
  label,
  error,
  className = '',
  ...props
}) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      )}
      <input
        className={clsx(
          'w-full rounded-input border px-3 py-2.5 text-sm outline-none transition-colors',
          'border-gray-300 focus:border-primary focus:ring-1 focus:ring-primary/30',
          'placeholder-gray-400 disabled:bg-gray-50 disabled:text-gray-400',
          error && 'border-red-500 focus:border-red-500',
          className
        )}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}
