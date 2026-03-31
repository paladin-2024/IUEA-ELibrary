import { MdClose, MdCircle } from 'react-icons/md';
import useReaderStore, { READER_THEMES } from '../../store/readerStore';

export default function TableOfContents({ toc, currentCfi }) {
  const { theme, currentChapter, percentComplete, toggleTOC } = useReaderStore();
  const t = READER_THEMES[theme] || READER_THEMES.light;

  // Determine which chapters have been passed (rough heuristic: index)
  const currentIdx = toc.findIndex(
    (item) => item.label?.trim() === currentChapter
  );

  return (
    <div
      className="fixed inset-0 z-50 flex"
      style={{ background: 'rgba(0,0,0,0.4)' }}
      onClick={toggleTOC}
    >
      {/* Panel */}
      <div
        className="w-72 max-w-[80vw] h-full flex flex-col shadow-2xl overflow-hidden"
        style={{ background: t.background, color: t.color }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-4 py-3 border-b"
          style={{ borderColor: t.borderColor }}
        >
          <h3 className="font-semibold text-sm">Table of Contents</h3>
          <button onClick={toggleTOC} className="p-1 rounded-lg hover:bg-black/5">
            <MdClose size={18} />
          </button>
        </div>

        {/* Progress summary */}
        <div className="px-4 py-3" style={{ borderBottom: `1px solid ${t.borderColor}` }}>
          <div className="flex items-center justify-between text-xs opacity-60 mb-1">
            <span>Progress</span>
            <span>{percentComplete}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-gray-200/50 overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${percentComplete}%`, background: '#7B0D1E' }}
            />
          </div>
        </div>

        {/* Chapter list */}
        <div className="flex-1 overflow-y-auto py-2">
          {toc.length === 0 ? (
            <p className="text-center text-xs opacity-50 py-8">No chapters found.</p>
          ) : (
            toc.map((item, i) => {
              const isCurrent = item.label?.trim() === currentChapter;
              const isRead    = currentIdx > 0 && i < currentIdx;
              return (
                <button
                  key={item.id || i}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-black/5 transition-colors"
                  onClick={() => toggleTOC()}
                >
                  {/* Status dot */}
                  <MdCircle
                    size={8}
                    style={{
                      color:   isCurrent ? '#7B0D1E' : isRead ? '#C9A84C' : t.borderColor,
                      flexShrink: 0,
                    }}
                  />
                  <span
                    className={`text-sm line-clamp-2 ${isCurrent ? 'font-semibold' : ''}`}
                    style={{ color: isCurrent ? '#7B0D1E' : undefined, opacity: isRead ? 0.6 : 1 }}
                  >
                    {item.label?.trim() || `Chapter ${i + 1}`}
                  </span>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
