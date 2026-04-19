import { MdMenuBook } from 'react-icons/md';

export default function EmptyState({ title = 'Nothing here yet', message = '', action, icon: Icon = MdMenuBook }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center text-gray-400">
      <Icon size={48} className="mb-4 opacity-30" />
      <h3 className="font-semibold text-lg text-gray-600">{title}</h3>
      {message && <p className="text-sm mt-1 max-w-xs">{message}</p>}
      {action && (
        <button
          onClick={action.onClick}
          className="mt-4 px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary-dark transition-colors"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
