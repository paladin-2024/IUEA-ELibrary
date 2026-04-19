/**
 * SuggestionChips — horizontally scrolling quick-reply chips shown below
 * the chat input when the conversation is empty or the AI offers follow-ups.
 *
 * Props:
 *   suggestions — string[]
 *   onSelect    — (suggestion: string) => void
 */
export default function SuggestionChips({ suggestions = [], onSelect }) {
  if (!suggestions.length) return null;

  return (
    <div className="flex gap-2 overflow-x-auto py-1 scrollbar-none">
      {suggestions.map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => onSelect(s)}
          className="shrink-0 px-3 py-1.5 rounded-full border border-primary/30 text-primary text-xs font-medium bg-primary/5 hover:bg-primary/10 transition-colors whitespace-nowrap"
        >
          {s}
        </button>
      ))}
    </div>
  );
}
