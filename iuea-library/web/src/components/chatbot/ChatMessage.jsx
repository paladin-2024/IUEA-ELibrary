import { FiUser } from 'react-icons/fi';
import { MdMenuBook } from 'react-icons/md';
import { cn }        from '../../utils/cn';

/**
 * ChatMessage — renders a single chat turn.
 *
 * Props:
 *   role    — 'user' | 'assistant'
 *   content — string
 */
export default function ChatMessage({ role, content }) {
  const isUser = role === 'user';

  return (
    <div className={cn('flex gap-2.5', isUser && 'flex-row-reverse')}>
      {/* Avatar */}
      <div
        className={cn(
          'shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-white text-xs',
          isUser ? 'bg-primary' : 'bg-accent',
        )}
      >
        {isUser ? <FiUser size={13} /> : <MdMenuBook size={14} />}
      </div>

      {/* Bubble */}
      <div
        className={cn(
          'max-w-[75%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap',
          isUser
            ? 'bg-primary text-white rounded-tr-sm'
            : 'bg-white border border-gray-100 text-gray-800 rounded-tl-sm shadow-sm',
        )}
      >
        {content}
      </div>
    </div>
  );
}
