const sizes = { sm: 'w-7 h-7 text-xs', md: 'w-9 h-9 text-sm', lg: 'w-12 h-12 text-base', xl: 'w-16 h-16 text-xl' };

export default function Avatar({ src, name, size = 'md', className = '' }) {
  const initials = name
    ? name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()
    : '?';

  return (
    <div className={`${sizes[size]} rounded-full flex-shrink-0 overflow-hidden flex items-center justify-center bg-primary/10 ${className}`}>
      {src
        ? <img src={src} alt={name ?? 'Avatar'} className="w-full h-full object-cover" />
        : <span className="font-bold text-primary">{initials}</span>
      }
    </div>
  );
}
