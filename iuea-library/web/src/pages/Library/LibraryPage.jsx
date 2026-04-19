import { useState, useMemo }     from 'react';
import { useQuery }              from '@tanstack/react-query';
import { useNavigate }           from 'react-router-dom';
import { getAllProgress }        from '../../services/progress.service';

/* ── Static book data from HTML ──────────────────────────────────────────── */
const STATIC_BOOKS = [
  { img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBzG8QoMyA5MOhAVH-BTJ60kGXPqscfNPeAjCwSPBurTp3GAiaPXWpjlsD_yE95xQwk2wiXEQYq0x8iAVq0Wd8ykckTBbCuibMfsJhNdKGP2q8vhbkAnl9cq5x_JvHqVFF3SKqEw4t2k_UqQlutsPc74pREDaR1yPp7mBQu48KcM8UIL3MpXXHiizggAjF3ExaxCNCKUiYCjtfTPhYqilpF2eUp9u6z3o0bo5Lp9dqL2Wnraj6kY3M8uAS80GVKyYgYy0tIv0_z3xg', badge: 'Fiction',  badgeBg: '#7b0d1e', badgeColor: '#fff', title: 'The Silent Patient',      author: 'Alex Michaelides',  progress: 65,  pages: '212 / 325' },
  { img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBZSEQ_BdzQc8jMXlSnf5q0A2lq7icY98carj-Iw9QU96q3yLOyLkXtRX_Rle8NL-bUUhMsx7mp3Fv-S9PvwfgeeEYgYzZPo2FN_3mPAzLJ3bcJmbNs8X-rDKNVecwNaLFg9LkYfEp8DzJArwRkYMyw4AasmVolu-Pev2O_XwQst6FscKaod4rPqHp2DimTr9HG9kgekRDy8hGF6Qt7VUGpDAkVd7yWst18LwgQmKYcPtCTgYToKH2hgUjHqVfz8UaBtNbPw_W6Wmw', badge: 'History',  badgeBg: '#7b0d1e', badgeColor: '#fff', title: 'Sapiens: A Brief History',   author: 'Yuval Noah Harari',  progress: 12,  pages: '45 / 443'  },
  { img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCec8sMdqulMb1jtJiUkXybIP6J_jnC2u8HweSEnQOYmYa2WfeKyuW47UXf9kMAN3z7SpM20F4BYOGI70KKLQ_VVkViXEmH07u-bnGaat5ykQrzNlsUWDGhjQPMYmFxsMrn5g3GpFB5aIiuSNbs0CNBM7EcZSg_5DNNfKiGjDM_2adZHgFyVtqjoMMnW_4HR918VHFQBJUIaoQUbadxmi49bWzYqKeQVyCwt-RqZ2qfAzMFozXXtusprE1eNZPu0TNgBF9vonRfkcw', badge: 'Premium',  badgeBg: '#c9a84c', badgeColor: '#503d00', title: 'The Alchemist',              author: 'Paulo Coelho',       progress: 95,  pages: '188 / 197' },
  { img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAA7c0ZKYkJxGdEQfPYnKK7D1-QzirI7ezMlv2F2yyIOs1gj2ct3qCe2xVmdUOMA2yBkR4s5Zh7rCRH-ZQ4QyDsJUd61zTqjT7BArU3c-T9ytQ6APvKoiWVcc-wcYeT9G9IFgOrYMKKnxvOxN5W2nRuKG1sLm_WHsyz2UX1I4kBZbXO8JL_YISIUotl_nOYsVhrN41_FbpfsfvZZ0glBxbQHJjir0kCw_iChs3mjcvTdm5zlsETV8_bpfwpHXFL9EBYY5cROGEvRu4', badge: 'Design',   badgeBg: '#7b0d1e', badgeColor: '#fff', title: "Digital Curator's Guide",  author: 'IUEA Editorial',     progress: null, pages: null },
  { img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA6bSGmeLFnBhxONODIQEkzrMN2KaGsHDxZGXQkQuIZewppP5EVx3AFZyP_hpbg7lp5t55SZQvHglPRbleVvAQ7WlKkNF_VNdbRYotdeHT9XcjdRV5JiTc8wFHmDo6OxlM4OYYL8XQLAFHQQ45ZFrBDOEdGPNVqztDY5l_7X1xR_pwHhzR9YUzJupvc8XIOI19MNJLbnjaL8A6ajxsSCPvV_NNtXa7i8-0GN0p4RvffsCk3cCY8OxjqH1GSJ0w15QLzA5aLm_IUva0', badge: 'Classic',  badgeBg: '#7b0d1e', badgeColor: '#fff', title: 'Great Expectations',        author: 'Charles Dickens',    progress: 30,  pages: '150 / 500' },
  { img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAxKX8hCAWF_ZGPpnqttLDF4gmTKqHM1yMJFSGJzAyIZ6AXdFUWkkvIprsAz4_SS2Hye25pY3QBXwXNsT-tqklhXqfuyNjeJmVwlCBh-ZCn4CJR83zoyVErJYrXgR1iX028gahPRh_PmEt0rU4RLYHukyBofpAv5hpT7JXYs8IngBmU6ANjOWvCmqg0zPUArQjpGuPpjKxpUmK4IF8EwBFdKvbVWogOoVIFm6p2hg80jy8brYAAt5uX2c2YcS3YZBM3vvcX-IDFDJY', badge: 'Tech',     badgeBg: '#7b0d1e', badgeColor: '#fff', title: 'The Age of AI',              author: 'Henry Kissinger',    progress: null, pages: null },
  { img: null, add: true },
];

const TABS = ['All Books', 'Reading', 'Completed', 'Wishlist'];

export default function LibraryPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('All Books');

  const { data: progressData } = useQuery({
    queryKey: ['progress'],
    queryFn: getAllProgress,
    staleTime: 60_000,
  });

  const allRealBooks = useMemo(() => {
    const list = progressData?.progress ?? [];
    return list.map(p => ({
      _id:      p.book?.id ?? p.bookId,
      img:      p.book?.coverUrl ?? null,
      badge:    p.book?.category ?? 'General',
      badgeBg:  p.isCompleted ? '#c9a84c' : '#7b0d1e',
      badgeColor: p.isCompleted ? '#503d00' : '#fff',
      title:    p.book?.title ?? 'Unknown',
      author:   p.book?.author ?? '',
      progress: Math.round(p.percentComplete ?? 0),
      pages:    p.currentPage && p.book?.pageCount
                  ? `${p.currentPage} / ${p.book.pageCount}`
                  : null,
      isCompleted: p.isCompleted,
      isSaved:     p.isSaved,
    }));
  }, [progressData]);

  const books = useMemo(() => {
    let filtered = allRealBooks;
    if (activeTab === 'Reading')   filtered = allRealBooks.filter(b => b.progress > 0 && !b.isCompleted);
    if (activeTab === 'Completed') filtered = allRealBooks.filter(b => b.isCompleted);
    if (activeTab === 'Wishlist')  filtered = allRealBooks.filter(b => b.isSaved);
    return [...filtered, { add: true }];
  }, [allRealBooks, activeTab]);

  return (
    <>
      <style>{`
        .lp-topbar {
          position: sticky; top: 0; width: 100%; z-index: 40;
          height: 80px; background: #fff0f0;
          display: flex; justify-content: space-between; align-items: center;
          padding: 0 2rem;
        }
        .lp-search-wrap {
          position: relative; width: 100%;
        }
        .lp-search-icon {
          position: absolute; left: 1rem; top: 50%; transform: translateY(-50%);
          color: rgba(88,65,65,0.6); transition: color 0.2s; pointer-events: none;
        }
        .lp-search-wrap:focus-within .lp-search-icon { color: #56000f; }
        .lp-search-input {
          width: 100%; background: #ffffff; border: none;
          border-radius: 0.75rem; padding: 0.75rem 1rem 0.75rem 3rem;
          font-family: Inter, sans-serif; font-size: 0.875rem; color: #2d1418;
          outline: none; box-shadow: 0 1px 4px rgba(0,0,0,0.06);
          transition: box-shadow 0.2s;
        }
        .lp-search-input:focus { box-shadow: 0 0 0 2px rgba(123,13,30,0.2); }
        .lp-book-card {
          display: flex; flex-direction: column; cursor: pointer;
        }
        .lp-book-img {
          aspect-ratio: 3/4; border-radius: 0.75rem; overflow: hidden;
          box-shadow: 0 8px 24px rgba(0,0,0,0.12);
          background: #fff; transition: box-shadow 0.3s, transform 0.3s;
        }
        .lp-book-card:hover .lp-book-img {
          box-shadow: 0 16px 48px rgba(0,0,0,0.2);
          transform: translateY(-8px);
        }
        .lp-book-img img { width: 100%; height: 100%; object-fit: cover; }
        .lp-add-card {
          aspect-ratio: 3/4; border-radius: 0.75rem;
          border: 2px dashed rgba(223,191,190,0.5);
          display: flex; flex-direction: column; align-items: center;
          justify-content: center; gap: 1rem; cursor: pointer;
          transition: all 0.2s;
        }
        .lp-add-card:hover {
          background: #ffe1e3;
          border-color: rgba(123,13,30,0.3);
        }
        .lp-tab-btn {
          background: none; border: none; cursor: pointer;
          font-family: Inter, sans-serif; font-size: 0.875rem;
          padding: 0 0 8px 0;
          transition: color 0.2s;
        }
      `}</style>

      {/* ── Top bar ── */}
      <header className="lp-topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1, maxWidth: '40rem' }}>
          <div className="lp-search-wrap">
            <span className="material-symbols-outlined lp-search-icon">search</span>
            <input className="lp-search-input" type="text" placeholder="Search your private collection..." />
          </div>
          <button style={{ background: '#fff', border: 'none', borderRadius: '0.75rem', padding: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7b0d1e', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', cursor: 'pointer' }}>
            <span className="material-symbols-outlined">filter_list</span>
          </button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginLeft: '2rem' }}>
          <button style={{ position: 'relative', background: 'none', border: 'none', cursor: 'pointer', color: '#7b0d1e' }}>
            <span className="material-symbols-outlined">notifications</span>
            <span style={{ position: 'absolute', top: 0, right: 0, width: 8, height: 8, background: '#ba1a1a', borderRadius: '50%', border: '2px solid #fff0f0' }} />
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', paddingLeft: '1.5rem', borderLeft: '1px solid #ffb3b3' }}>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: '12px', fontWeight: 700, color: '#56000f', fontFamily: 'Inter, sans-serif' }}>Dr. Julianne V.</p>
              <p style={{ fontSize: '10px', color: '#584141', fontWeight: 500 }}>Senior Librarian</p>
            </div>
            <div style={{ width: 40, height: 40, borderRadius: '50%', overflow: 'hidden', border: '2px solid #fff', background: '#c9a84c' }}>
              <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuDEADphlW1CUsAtR4hvq1m14l8kaMKJggsbzqU131rNTKvl_nbLtHeg_v9vCvGSceCcyxmUd6_jGaAtlOCjjGBe71_dZgMpVnwX08pyih-oMl3N8aRgy0ieviKkScNf4seF9B4AzsgnatlpD6gK9sJECuiE-bNjJ9kPsTPN6L2U6QXBoG3Qk53eKb1qKwNCeXpLdQc9K_T2A_Od0bu82mPwnSBSCTWHsS0w9Www6hrR5tuno2lygxYueA6vNNydKhPy8Z12b4FzUA4"
                alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          </div>
        </div>
      </header>

      {/* ── Main content ── */}
      <section style={{ padding: '2.5rem 2rem 5rem' }}>

        {/* Heading + Tabs */}
        <div style={{ marginBottom: '3rem' }}>
          <h2 style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: '2.5rem', fontWeight: 700, color: '#56000f', marginBottom: '0.5rem' }}>
            My Library
          </h2>
          <div style={{ display: 'flex', gap: '1.5rem', marginTop: '1.5rem' }}>
            {TABS.map(tab => (
              <button key={tab} className="lp-tab-btn"
                onClick={() => setActiveTab(tab)}
                style={{
                  color: activeTab === tab ? '#56000f' : 'rgba(88,65,65,0.6)',
                  fontWeight: activeTab === tab ? 700 : 400,
                  borderBottom: activeTab === tab ? '2px solid #7b0d1e' : '2px solid transparent',
                }}>
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Books Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(1,1fr)', gap: '2rem 2rem' }} className="lp-books-grid">
          <style>{`
            @media (min-width: 640px)  { .lp-books-grid { grid-template-columns: repeat(2,1fr); } }
            @media (min-width: 1024px) { .lp-books-grid { grid-template-columns: repeat(4,1fr); } }
            @media (min-width: 1280px) { .lp-books-grid { grid-template-columns: repeat(5,1fr); } }
          `}</style>

          {books.map((book, i) => (
            <div key={i} className="lp-book-card" onClick={() => !book.add && book._id && navigate(`/home/books/${book._id}`)} style={{ cursor: book.add ? 'default' : 'pointer' }}>
              {book.add ? (
                <div className="lp-add-card" onClick={() => navigate('/home/search')}>
                  <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(123,13,30,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7b0d1e', transition: 'transform 0.2s' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '2rem' }}>add</span>
                  </div>
                  <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, color: 'rgba(86,0,15,0.6)', fontSize: '0.875rem' }}>Add New Title</p>
                </div>
              ) : (
                <>
                  <div className="lp-book-img">
                    <img src={book.img} alt={book.title} />
                  </div>
                  <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <span style={{ display: 'inline-block', background: book.badgeBg, color: book.badgeColor, fontSize: '10px', padding: '2px 8px', borderRadius: 9999, fontFamily: 'Inter, sans-serif', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', width: 'fit-content' }}>
                      {book.badge}
                    </span>
                    <h3 style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: '1.125rem', fontWeight: 700, color: '#56000f', lineHeight: 1.3 }}>{book.title}</h3>
                    <p style={{ fontSize: '12px', color: 'rgba(88,65,65,0.7)', fontWeight: 500, fontFamily: 'Inter, sans-serif' }}>{book.author}</p>
                    {book.progress != null ? (
                      <div style={{ paddingTop: '0.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: '10px', fontWeight: 700, color: '#56000f', fontFamily: 'Inter, sans-serif' }}>
                          <span>{book.progress}% Read</span>
                          <span>{book.pages} pages</span>
                        </div>
                        <div style={{ width: '100%', height: 6, background: 'rgba(255,150,151,0.2)', borderRadius: 9999, overflow: 'hidden' }}>
                          <div style={{ height: '100%', background: '#7b0d1e', borderRadius: 9999, width: `${book.progress}%` }} />
                        </div>
                      </div>
                    ) : (
                      <div style={{ paddingTop: '0.5rem', display: 'flex', alignItems: 'center', gap: 8, fontSize: '10px', fontWeight: 700, color: 'rgba(88,65,65,0.4)', fontStyle: 'italic', fontFamily: 'Inter, sans-serif' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '0.875rem' }}>schedule</span>
                        <span>Not Started</span>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        <footer style={{ marginTop: '6rem', borderTop: '1px solid rgba(223,191,190,0.2)', paddingTop: '3rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ display: 'flex', gap: '2rem' }}>
            {['Privacy', 'Terms', 'Translate', 'Books API'].map(t => (
              <a key={t} href="#" style={{ fontFamily: 'Inter, sans-serif', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'rgba(86,0,15,0.4)', textDecoration: 'none' }}
                onMouseEnter={e => (e.target.style.color = '#7b0d1e')}
                onMouseLeave={e => (e.target.style.color = 'rgba(86,0,15,0.4)')}>
                {t}
              </a>
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, opacity: 0.3, transition: 'opacity 0.5s' }}
            onMouseEnter={e => (e.currentTarget.style.opacity = 1)}
            onMouseLeave={e => (e.currentTarget.style.opacity = 0.3)}>
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.2em', fontWeight: 700, color: '#56000f' }}>Powered by</span>
            <svg style={{ height: 16 }} viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
          </div>
        </footer>
      </section>

      {/* FAB */}
      <button onClick={() => navigate('/home/search')} style={{ position: 'fixed', right: '2rem', bottom: '2rem', width: 56, height: 56, background: '#7b0d1e', color: '#fff', borderRadius: '50%', boxShadow: '0 8px 32px rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer', zIndex: 50, transition: 'transform 0.2s' }}
        title="Browse books"
        onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.1)')}
        onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}>
        <span className="material-symbols-outlined" style={{ fontSize: '1.5rem' }}>add</span>
      </button>
    </>
  );
}
