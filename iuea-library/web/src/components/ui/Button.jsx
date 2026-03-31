import { clsx } from 'clsx';
import LoadingSpinner from './LoadingSpinner';

const variants = {
  primary:   'bg-primary text-white hover:bg-primary-dark active:bg-primary-dark',
  secondary: 'bg-accent text-primary font-semibold hover:bg-accent-light',
  ghost:     'bg-transparent text-primary border border-primary hover:bg-primary/5',
  danger:    'bg-red-600 text-white hover:bg-red-700',
};

const sizes = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-5 py-2.5 text-sm',
  lg: 'px-7 py-3 text-base',
};

export default function Button({
  children,
  variant  = 'primary',
  size     = 'md',
  isLoading = false,
  disabled  = false,
  className = '',
  ...props
}) {
  return (
    <button
      className={clsx(
        'rounded-btn font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary/40 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed',
        variants[variant],
        sizes[size],
        className
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && <LoadingSpinner size="sm" />}
      {children}
    </button>
  );
}
