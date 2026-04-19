export default function ProgressBar({ value = 0, max = 100, showLabel = false, className = '' }) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div className={`w-full ${className}`}>
      <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
        <div
          className="bg-primary h-2 rounded-full transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
      {showLabel && (
        <p className="text-xs text-gray-400 mt-0.5 text-right">{Math.round(pct)}%</p>
      )}
    </div>
  );
}
