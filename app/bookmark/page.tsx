"use client";

import React, { useState, useEffect, Suspense } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { RightSidebar } from "@/components/RightSidebar";
import { BookCard } from "@/components/DashboardComponents";
import { BookReader } from "@/components/BookReader";
import { BookIcon, BookmarkIcon } from "@/components/icons";

// This is a placeholder for the actual bookmark hook
const useBookmark = () => {
  const [bookmarkedBooks, setBookmarkedBooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate fetching bookmarked books
    const fetchBookmarkedBooks = async () => {
      setLoading(true);
      // In a real application, you would fetch this from local storage, a context, or an API
      const storedBookmarks = JSON.parse(localStorage.getItem("bookmarkedBooks") || "[]");
      setBookmarkedBooks(storedBookmarks);
      setLoading(false);
    };

    fetchBookmarkedBooks();
  }, []);

  const removeBookmark = (bookId: string) => {
    const updatedBookmarks = bookmarkedBooks.filter((book) => book.id !== bookId);
    setBookmarkedBooks(updatedBookmarks);
    localStorage.setItem("bookmarkedBooks", JSON.stringify(updatedBookmarks));
  };

  return { bookmarkedBooks, removeBookmark, loading };
};

function BookmarkContent() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { bookmarkedBooks, removeBookmark, loading } = useBookmark();
  const [readingBook, setReadingBook] = useState<any>(null);

  return (
    <div className="flex h-screen bg-[#f1f3f6] p-0 md:p-4 text-[#2d3a4b] font-sans selection:bg-[#800000]/20 overflow-hidden transition-colors duration-300">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <main className="flex flex-1 flex-col overflow-hidden md:rounded-3xl bg-white shadow-2xl relative transition-colors duration-300">
        <Header onMenuClick={() => setIsSidebarOpen(true)} onSearch={() => {}} />

        <div className="flex flex-1 overflow-hidden">
          <div className="flex flex-1 flex-col overflow-y-auto p-4 sm:p-8 pt-6 custom-scrollbar">
            
            <div className="mb-10 flex items-end justify-between">
              <div>
                <div className="flex items-center gap-2 text-[#800000] mb-2">
                  <BookmarkIcon />
                  <span className="text-xs font-bold uppercase tracking-widest">Your Collection</span>
                </div>
                <h1 className="text-4xl font-black text-black tracking-tight">Bookmarks</h1>
                <p className="text-gray-500 font-medium">Your saved books for easy access</p>
              </div>
            </div>

            <div className="bg-gray-50/50 rounded-[40px] p-4 sm:p-8 border border-gray-100">
              {loading ? (
                <div className="flex items-center justify-center h-96">
                  <div className="relative">
                    <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-[#800000]/20"></div>
                    <div className="absolute inset-0 animate-spin rounded-full h-16 w-16 border-t-4 border-transparent border-l-4 border-[#800000]"></div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 sm:gap-10 mb-12">
                  {bookmarkedBooks.map((book) => (
                    <div key={book.id} className="relative">
                      <BookCard
                        image={book.volumeInfo.imageLinks?.thumbnail || "https://via.placeholder.com/150x200?text=No+Cover"}
                        title={book.volumeInfo.title}
                        author={book.volumeInfo.authors?.[0] || "Unknown Author"}
                        downloadUrl={book.accessInfo?.pdf?.downloadLink || book.accessInfo?.epub?.downloadLink || book.volumeInfo.previewLink}
                        onRead={() => setReadingBook({
                          id: book.id,
                          title: book.volumeInfo.title,
                          author: book.volumeInfo.authors?.[0] || "Unknown Author",
                          image: book.volumeInfo.imageLinks?.thumbnail || "https://via.placeholder.com/150x200?text=No+Cover",
                          previewLink: book.volumeInfo.previewLink
                        })}
                        onBookmark={() => removeBookmark(book.id)}
                        isBookmarked={true}
                      />
                    </div>
                  ))}
                  {bookmarkedBooks.length === 0 && (
                    <div className="col-span-full text-center py-20 bg-white rounded-[32px] border border-dashed border-gray-200">
                      <div className="text-4xl mb-4">🔖</div>
                      <h3 className="text-lg font-bold text-black mb-1">No bookmarked books</h3>
                      <p className="text-gray-400">You haven't bookmarked any books yet.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <RightSidebar />
        </div>
      </main>

      {readingBook && (
        <BookReader 
          book={readingBook} 
          onClose={() => setReadingBook(null)}
          onProgressUpdate={() => {}} 
        />
      )}
    </div>
  );
}

export default function BookmarkPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center bg-white">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-[#800000]/10"></div>
          <div className="h-4 w-32 rounded bg-gray-100"></div>
        </div>
      </div>
    }>
      <BookmarkContent />
    </Suspense>
  );
}
