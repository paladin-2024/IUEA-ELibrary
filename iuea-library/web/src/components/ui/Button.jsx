import { FiLoader } from 'react-icons/fi';
import { cn }       from '../../utils/cn';

/*
 * Button — pixel-perfect Stitch design system
 *
 * Variants:
 *   primary   — bg-primary-container (#5C0F1F) white text   (main CTA)
 *   secondary — white bg, primary border+text               (outline)
 *   ghost     — transparent bg, primary text                (low-emphasis)
 *   danger    — error bg (#ba1a1a), white text
 *   accent    — tertiary-container (#B8964A) gold bg
 */

const variants = {
  primary:   'bg-primary text-white hover:bg-primary-dark shadow-btn active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed',
  secondary: 'border border-border-line bg-white text-primary hover:bg-blush-100 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed',
  ghost:     'text-primary hover:bg-blush-100 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed',
  danger:    'bg-error text-white hover:opacity-90 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed',
  accent:    'bg-gold-500 text-white hover:bg-gold-700 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed',
};

const sizes = {
  sm:   'text-xs px-3 py-2 rounded-lg',
  md:   'text-sm px-5 py-3 rounded-xl',
  lg:   'text-base px-6 py-4 rounded-xl',
  full: 'text-sm px-5 py-4 rounded-xl w-full',
};

export default function Button({
  children,
  variant   = 'primary',
  size      = 'md',
  isLoading = false,
  disabled  = false,
  icon,
  className = '',
  ...props
}) {
  return (
    <button
      className={cn(
        'font-sans font-bold transition-all duration-150',
        'inline-flex items-center justify-center gap-2',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30',
        variants[variant] ?? variants.primary,
        sizes[size]       ?? sizes.md,
        className,
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading
        ? <FiLoader className="animate-spin w-4 h-4 flex-shrink-0" />
        : (icon ? <span className="flex-shrink-0">{icon}</span> : null)
      }
      {children}
    </button>
  );
}
