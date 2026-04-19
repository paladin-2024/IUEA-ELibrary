import { cn } from '../../utils/cn';

/**
 * Tabs — simple controlled tab bar.
 *
 * Props:
 *   tabs      — [{ id, label }]
 *   active    — currently active id
 *   onChange  — (id) => void
 *   className
 */
export default function Tabs({ tabs = [], active, onChange, className = '' }) {
  return (
    <div className={cn('flex border-b border-gray-100', className)}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={cn(
            'px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px',
            active === tab.id
              ? 'border-primary text-primary'
              : 'border-transparent text-gray-500 hover:text-gray-800',
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
