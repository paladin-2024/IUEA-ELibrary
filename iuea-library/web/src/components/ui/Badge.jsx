const variants = {
  primary:  'bg-primary/10 text-primary',
  success:  'bg-green-50 text-green-600',
  warning:  'bg-yellow-50 text-yellow-700',
  danger:   'bg-red-50 text-red-500',
  info:     'bg-blue-50 text-blue-600',
  gray:     'bg-gray-100 text-gray-500',
  purple:   'bg-purple-50 text-purple-600',
};

export default function Badge({ children, variant = 'gray', className = '' }) {
  return (
    <span
      className={`inline-flex items-center text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wide ${variants[variant] ?? variants.gray} ${className}`}
    >
      {children}
    </span>
  );
}
