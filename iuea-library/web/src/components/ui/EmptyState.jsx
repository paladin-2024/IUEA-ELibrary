import { BookOpen } from 'lucide-react';

export default function EmptyState({ title = 'Nothing here yet', message = '', icon: Icon = BookOpen }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center text-gray-400">
      <Icon size={48} className="mb-4 opacity-30" />
      <h3 className="font-semibold text-lg text-gray-600">{title}</h3>
      {message && <p className="text-sm mt-1 max-w-xs">{message}</p>}
    </div>
  );
}
