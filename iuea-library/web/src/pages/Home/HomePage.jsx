import { Link }     from 'react-router-dom';
import { Search, BookOpen, Mic2, Bot } from 'lucide-react';
import { useFeaturedBooks, useBooks } from '../../hooks/useBooks';
import BookCard      from '../../components/ui/BookCard';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { CATEGORIES } from '../../utils/constants';

export default function HomePage() {
  const { data: featuredData, isLoading: loadingFeatured } = useFeaturedBooks();
  const { data: recentData,   isLoading: loadingRecent   } = useBooks({ limit: 8 });

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-primary to-primary-dark text-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="font-serif text-4xl md:text-5xl font-semibold mb-4 leading-tight">
            Your Gateway to<br />
            <span className="text-accent">Knowledge & Discovery</span>
          </h1>
          <p className="text-primary-light text-lg mb-8 max-w-xl mx-auto">
            Access thousands of books, listen to academic podcasts, and chat with
            an AI assistant — in your language.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/search" className="bg-accent text-primary font-semibold px-6 py-3 rounded-btn hover:bg-accent-light transition-colors flex items-center justify-center gap-2">
              <Search size={16} /> Browse Books
            </Link>
            <Link to="/podcasts" className="border border-white text-white px-6 py-3 rounded-btn hover:bg-white/10 transition-colors flex items-center justify-center gap-2">
              <Mic2 size={16} /> Explore Podcasts
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-12 px-4 bg-white">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { icon: BookOpen, title: 'Thousands of Books', desc: 'Browse IUEA library collection — textbooks, research, fiction & more.' },
            { icon: Mic2,     title: 'Academic Podcasts',  desc: 'Listen to lectures, interviews, and educational content on the go.' },
            { icon: Bot,      title: 'AI Reading Assistant', desc: 'Chat with Gemini AI about any book in your preferred language.' },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="text-center p-6 rounded-card border border-gray-100 hover:shadow-card transition-shadow">
              <div className="inline-flex items-center justify-center bg-primary/10 text-primary p-3 rounded-full mb-4">
                <Icon size={22} />
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">{title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Categories */}
      <section className="py-10 px-4 bg-surface">
        <div className="max-w-6xl mx-auto">
          <h2 className="font-serif text-2xl font-semibold text-primary mb-6">Browse by Category</h2>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => (
              <Link
                key={cat.id}
                to={`/search?category=${cat.id}`}
                className="px-4 py-2 bg-white border border-gray-200 rounded-full text-sm text-gray-700 hover:border-primary hover:text-primary transition-colors"
              >
                {cat.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Books */}
      <section className="py-10 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-serif text-2xl font-semibold text-primary">Featured Books</h2>
            <Link to="/search" className="text-sm text-primary hover:underline">View all →</Link>
          </div>
          {loadingFeatured ? (
            <LoadingSpinner className="py-12" />
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {featuredData?.books?.map((book) => (
                <BookCard key={book._id} book={book} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Recent Additions */}
      <section className="py-10 px-4 bg-surface">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-serif text-2xl font-semibold text-primary">Recently Added</h2>
            <Link to="/search?sort=newest" className="text-sm text-primary hover:underline">View all →</Link>
          </div>
          {loadingRecent ? (
            <LoadingSpinner className="py-12" />
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {recentData?.books?.map((book) => (
                <BookCard key={book._id} book={book} />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
