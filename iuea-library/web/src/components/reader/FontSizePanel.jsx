import { FiMinus, FiPlus, FiType } from 'react-icons/fi';
import useReaderStore               from '../../store/readerStore';

const MIN_SIZE = 12;
const MAX_SIZE = 28;
const STEP     = 2;

export default function FontSizePanel({ onClose }) {
  const { fontSize, setFontSize } = useReaderStore();

  const decrease = () => setFontSize(Math.max(MIN_SIZE, fontSize - STEP));
  const increase = () => setFontSize(Math.min(MAX_SIZE, fontSize + STEP));

  return (
    <div className="bg-white rounded-card shadow-card p-4 w-64">
      <div className="flex items-center gap-2 mb-4 text-sm font-semibold text-gray-700">
        <FiType size={16} />
        Font Size
      </div>

      <div className="flex items-center justify-between gap-3">
        <button
          onClick={decrease}
          disabled={fontSize <= MIN_SIZE}
          className="w-9 h-9 flex items-center justify-center rounded-full border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition-colors"
        >
          <FiMinus size={15} />
        </button>

        <div className="flex-1 text-center">
          <span className="text-xl font-semibold text-primary">{fontSize}</span>
          <span className="text-xs text-gray-400 ml-1">px</span>
          {/* Visual scale indicator */}
          <div className="mt-1.5 h-1 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-200"
              style={{ width: `${((fontSize - MIN_SIZE) / (MAX_SIZE - MIN_SIZE)) * 100}%` }}
            />
          </div>
        </div>

        <button
          onClick={increase}
          disabled={fontSize >= MAX_SIZE}
          className="w-9 h-9 flex items-center justify-center rounded-full border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition-colors"
        >
          <FiPlus size={15} />
        </button>
      </div>

      {/* Quick presets */}
      <div className="flex gap-2 mt-4 justify-center">
        {[14, 16, 18, 22].map((size) => (
          <button
            key={size}
            onClick={() => setFontSize(size)}
            className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
              fontSize === size
                ? 'bg-primary text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {size}
          </button>
        ))}
      </div>
    </div>
  );
}
