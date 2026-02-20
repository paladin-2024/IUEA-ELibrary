"use client";

import React, { useState, useEffect, useRef } from "react";
import { X, Maximize2, Minimize2, ChevronLeft, ChevronRight, BookOpen } from "lucide-react";

declare global {
  interface Window {
    google: any;
  }
}

interface BookReaderProps {
  book: {
    id: string;
    title: string;
    author: string;
    image: string;
    previewLink?: string;
  };
  onClose: () => void;
  onProgressUpdate: (progress: number) => void;
  initialProgress?: number;
}

export function BookReader({ book, onClose, onProgressUpdate, initialProgress = 0 }: BookReaderProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [totalPages, setTotalPages] = useState(300);
  const [currentPage, setCurrentPage] = useState(1);
  const viewerRef = useRef<any>(null);
  const viewerDivRef = useRef<HTMLDivElement>(null);

  // Load Google Books Embedded Viewer API
  useEffect(() => {
    if (!book?.previewLink) return;

    const scriptId = "google-books-api-script";
    let script = document.getElementById(scriptId) as HTMLScriptElement;
    let interval: any;

    const initializeViewer = () => {
      if (window.google && window.google.books && viewerDivRef.current) {
        window.google.books.load();
        window.google.books.setOnLoadCallback(() => {
          const viewer = new window.google.books.DefaultViewer(viewerDivRef.current);
          viewer.load(book.id, (success: boolean) => {
            if (success) {
              viewerRef.current = viewer;
              
              // Jump to initial page.tsx after a short delay to ensure viewer is ready
              setTimeout(() => {
                const startPage = Math.max(1, Math.round((initialProgress / 100) * totalPages) || 1);
                viewer.goToPage(startPage);
                setCurrentPage(startPage);
              }, 1500);

              // Set up an interval to poll the current page.tsx number from the viewer
              // This handles scrolling and native navigation within the viewer
              interval = setInterval(() => {
                if (viewerRef.current) {
                  const pageNum = viewerRef.current.getPageNumber();
                  if (pageNum && pageNum > 0) {
                    setCurrentPage(prev => {
                      if (prev !== pageNum) return pageNum;
                      return prev;
                    });
                  }
                }
              }, 1000);
            }
          });
        });
      }
    };

    if (!script) {
      script = document.createElement("script");
      script.id = scriptId;
      script.src = "https://www.google.com/jsapi";
      script.onload = () => {
        if (window.google) {
          window.google.load("books", "0", {
            callback: initializeViewer
          });
        }
      };
      document.head.appendChild(script);
    } else if (window.google && window.google.books) {
      initializeViewer();
    } else if (window.google) {
      window.google.load("books", "0", {
        callback: initializeViewer
      });
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [book?.id, book?.previewLink, totalPages]);

  // Fetch real page.tsx count from Google Books API
  useEffect(() => {
    let active = true;
    async function loadMeta() {
      try {
        if (!book?.id) return;
        const res = await fetch(`https://www.googleapis.com/books/v1/volumes/${book.id}`);
        if (!res.ok) return;
        const data = await res.json();
        const pages = data?.volumeInfo?.pageCount;
        if (active && typeof pages === 'number' && pages > 0) {
          setTotalPages(pages);
          const startPage = Math.max(1, Math.round((initialProgress / 100) * pages) || 1);
          setCurrentPage(startPage);
        }
      } catch {}
    }
    loadMeta();
    return () => { active = false; };
  }, [book?.id, initialProgress]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white animate-in fade-in duration-300">
      {/* Reader Header */}
      <header className="flex h-16 items-center justify-between border-b border-gray-100 px-6 bg-white/80 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500"
          >
            <X size={20} />
          </button>
          <div className="flex items-center gap-3">
            <div className="h-8 w-6 overflow-hidden rounded shadow-sm">
              <img src={book.image} alt={book.title} className="h-full w-full object-cover" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-black line-clamp-1">{book.title}</h2>
              <p className="text-[10px] text-gray-500 font-medium">{book.author}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <button 
              onClick={toggleFullscreen}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500"
              title="Toggle Fullscreen"
            >
              {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
            </button>
          </div>
        </div>
      </header>

      {/* Reader Content */}
      <main className="flex-1 overflow-hidden relative bg-[#f8f9fa] flex flex-col md:flex-row">
        {/* Book Content / Iframe */}
        <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-8 overflow-y-auto custom-scrollbar">
          {book.previewLink ? (
            <div className="w-full h-full max-w-6xl bg-white shadow-2xl rounded-xl overflow-hidden relative border border-gray-100">
              <div 
                ref={viewerDivRef} 
                className="w-full h-full"
                id="viewerCanvas"
              >
                {/* Fallback to iframe if API fails or is loading */}
                <iframe 
                  src={`${book.previewLink}&output=embed`} 
                  className="w-full h-full border-none"
                  title={book.title}
                />
              </div>
            </div>
          ) : (
            <div className="w-full max-w-2xl bg-white shadow-xl rounded-2xl p-8 md:p-12 min-h-[80vh] flex flex-col gap-6">
              <div className="flex items-center gap-2 text-[#800000] mb-4">
                <BookOpen size={24} />
                <span className="font-bold uppercase tracking-wider text-sm">Chapter {Math.floor(currentPage / 20) + 1}</span>
              </div>
              <h1 className="text-3xl font-black text-black mb-4">Sample Content for {book.title}</h1>
              <div className="space-y-6 text-gray-700 leading-relaxed text-lg font-serif">
                <p>
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. 
                  Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
                </p>
                <p>
                  Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. 
                  Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
                </p>
                <p>
                  Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, 
                  totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.
                </p>
                <p>
                  Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Reader Controls (Sticky at bottom or floating) */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-white/90 backdrop-blur-md px-8 py-3 rounded-full shadow-2xl border border-gray-100 z-10">
          <div className="flex flex-col items-center min-w-[120px]">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-tighter">Total Pages</span>
            <span className="text-lg font-black text-black">{totalPages}</span>
          </div>
        </div>
      </main>
    </div>
  );
}
