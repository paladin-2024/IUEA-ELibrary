import { useEffect } from 'react';
import { Link }       from 'react-router-dom';
import { FiArrowRight } from 'react-icons/fi';
import useBookStore    from '../../store/bookStore';
import useAuthStore    from '../../store/authStore';
import BookCard        from '../../components/ui/BookCard';

// ── Skeleton card ─────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="w-32 shrink-0 animate-pulse">
      <div className="aspect-[2/3] bg-gray-200 rounded-card" />
      <div className="mt-2 h-3 bg-gray-200 rounded w-4/5" />
      <div className="mt-1 h-2 bg-gray-200 rounded w-3/5" />
    </div>
  );
}

// ── Section header ────────────────────────────────────────────────────────────
function SectionHeader({ title, to }) {
  return (
    <div className="flex items-center justify-between mb-3 px-4">
      <h2 className="font-serif text-lg font-semibold text-primary">{title}</h2>
      <Link
        to={to}
        className="text-xs text-primary flex items-center gap-1 hover:underline"
      >
        See all <FiArrowRight size={12} />
      </Link>
    </div>
  );
}

// ── Horizontal scroll row ─────────────────────────────────────────────────────
function HScrollRow({ books, isLoading, showProgress = false }) {
  if (isLoading) {
    return (
      <div className="flex gap-3 overflow-x-auto px-4 pb-2 scrollbar-hide">
        {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
      </div>
    );
  }
  if (!books.length) return null;
  return (
    <div className="flex gap-3 overflow-x-auto px-4 pb-2 scrollbar-hide">
      {books.map((book) => (
        <div key={book._id} className="w-32 shrink-0">
          <BookCard book={book} showProgress={showProgress} size="sm" />
        </div>
      ))}
    </div>
  );
}

const FACULTIES = [
  'Law', 'Medicine', 'Engineering', 'Business',
  'IT', 'Education', 'Arts', 'Science',
];

export default function HomePage() {
  const { user }      = useAuthStore();
  const {
    continueReading, newestBooks, popularBooks, isLoading,
    fetchFeatured, fetchContinueReading, fetchNewest, fetchPopular,
  } = useBookStore();

  useEffect(() => {
    fetchFeatured();
    fetchContinueReading();
    fetchNewest();
    fetchPopular();
  }, []);

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  })();

  const firstName = user?.name?.split(' ')[0] ?? 'Scholar';

  return (
    <div className="min-h-screen bg-surface pb-10">
      {/* ── Welcome banner ─────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-br from-primary to-[#4A0810] text-white px-4 pt-8 pb-6">
        <p className="font-serif text-2xl font-semibold leading-snug">
          {greeting}, {firstName}
        </p>
        <p className="text-white/70 text-sm mt-1">What will you read today?</p>

        {/* Faculty filter pills */}
        <div className="flex gap-2 overflow-x-auto mt-4 pb-1 scrollbar-hide">
          {FACULTIES.map((f) => (
            <Link
              key={f}
              to={`/search?faculty=${f}`}
              className="shrink-0 text-xs px-3 py-1.5 rounded-full border border-white/30
                         text-white/80 hover:bg-white/10 transition-colors"
            >
              {f}
            </Link>
          ))}
        </div>
      </div>

      <div className="mt-6 space-y-6">
        {/* ── Continue Reading ─────────────────────────────────────────────── */}
        {(continueReading.length > 0 || isLoading) && (
          <section>
            <SectionHeader title="Continue Reading" to="/library" />
            <HScrollRow books={continueReading} isLoading={isLoading} showProgress />
          </section>
        )}

        {/* ── New in the Library ───────────────────────────────────────────── */}
        <section>
          <SectionHeader title="New in the Library" to="/search?sort=newest" />
          <HScrollRow books={newestBooks} isLoading={isLoading} />
        </section>

        {/* ── Popular this week ────────────────────────────────────────────── */}
        <section>
          <SectionHeader title="Popular This Week" to="/search?sort=popular" />
          <HScrollRow books={popularBooks} isLoading={isLoading} />
        </section>
      </div>
    </div>
  );
}
