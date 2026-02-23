"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { RightSidebar } from "@/components/RightSidebar";
import { BookCard } from "@/components/DashboardComponents";
import { BookReader } from "@/components/BookReader";
import { 
  ChevronRightIcon, 
  CpuIcon, 
  FlaskConIcon, 
  BriefcaseIcon, 
  PaletteIcon, 
  BrainIcon, 
  HistoryIcon,
  BookIcon
} from "@/components/icons";

function DiscoverContent() {
  const searchParams = useSearchParams();
  const q = searchParams.get('q');
  
  const [activeTab, setActiveTab] = useState("Popular");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [books, setBooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(q || "");
  const [selectedTopic, setSelectedTopic] = useState("");
  const [startIndex, setStartIndex] = useState(0);
  const [readingBook, setReadingBook] = useState<any>(null);
  const [bookmarkedBooks, setBookmarkedBooks] = useState<any[]>([]);
  const [isTopicsExpanded, setIsTopicsExpanded] = useState(false);

  const tabs = ["Popular", "Most Searched", "New"];
  const topics = [
    { name: "Technology", icon: <CpuIcon /> },
    { name: "Computer Science", icon: <CpuIcon /> },
    { name: "Science", icon: <FlaskConIcon /> },
    { name: "Business", icon: <BriefcaseIcon /> },
    { name: "Art", icon: <PaletteIcon /> },
    { name: "Philosophy", icon: <BrainIcon /> },
    { name: "History", icon: <HistoryIcon /> },
    { name: "Psychology", icon: <BrainIcon /> },
  ];

  useEffect(() => {
    if (q) {
      setSearchQuery(q);
      setActiveTab("");
      setSelectedTopic("");
    }
  }, [q]);

  // Load bookmarks from localStorage on initial render
  useEffect(() => {
    const storedBookmarks = localStorage.getItem("bookmarkedBooks");
    if (storedBookmarks) {
      setBookmarkedBooks(JSON.parse(storedBookmarks));
    }
  }, []);

  // Save bookmarks to localStorage whenever bookmarkedBooks changes
  useEffect(() => {
    localStorage.setItem("bookmarkedBooks", JSON.stringify(bookmarkedBooks));
  }, [bookmarkedBooks]);

  useEffect(() => {
    const fetchBooks = async () => {
      setLoading(true);
      try {
        let queryParams = "";
        if (selectedTopic) {
          queryParams = `subject=${encodeURIComponent(selectedTopic)}`;
        } else if (searchQuery) {
          if (searchQuery.startsWith("author:")) {
            const authorName = searchQuery.replace("author:", "");
            queryParams = `author=${encodeURIComponent(authorName)}`;
          } else {
            queryParams = `q=${encodeURIComponent(searchQuery)}`;
          }
        } else {
          const qParam = activeTab === "Popular" ? "bestseller" : activeTab.toLowerCase();
          queryParams = `q=${encodeURIComponent(qParam)}`;
        }
        
        const response = await fetch(`/api/books?${queryParams}&startIndex=${startIndex}`);
        const data = await response.json();
        if (data.items) {
          setBooks(data.items);
        } else {
          setBooks([]);
        }
      } catch (error) {
        console.error("Error fetching books:", error);
        setBooks([]);
      } finally {
        setLoading(false);
      }
    };

    fetchBooks();
  }, [activeTab, searchQuery, selectedTopic, startIndex]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setSelectedTopic("");
    setStartIndex(0);
    if (query) {
      setActiveTab("");
    } else {
      setActiveTab("Popular");
    }
  };

  const handleTabClick = (tab: string) => {
    setActiveTab(tab);
    setSearchQuery("");
    setSelectedTopic("");
    setStartIndex(0);
  };

  const handleTopicClick = (topic: any) => {
    if (selectedTopic === topic.name) {
      setSelectedTopic("");
      setActiveTab("Popular");
    } else {
      setSelectedTopic(topic.name);
      setActiveTab("");
      setSearchQuery("");
    }
    setStartIndex(0);
  };

  const handleNextPage = () => {
    setStartIndex(prev => prev + 10);
  };

  const handlePrevPage = () => {
    setStartIndex(prev => Math.max(0, prev - 10));
  };

  const handleBookmarkToggle = (bookToToggle: any) => {
    setBookmarkedBooks(prevBookmarks => {
      const isBookAlreadyBookmarked = prevBookmarks.some(
        (book) => book.id === bookToToggle.id
      );

      if (isBookAlreadyBookmarked) {
        return prevBookmarks.filter((book) => book.id !== bookToToggle.id);
      } else {
        return [...prevBookmarks, bookToToggle];
      }
    });
  };

  return (
    <div className="flex h-screen bg-[#f1f3f6] p-0 md:p-4 text-[#2d3a4b] font-sans selection:bg-[#800000]/20 overflow-hidden transition-colors duration-300">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <main className="flex flex-1 flex-col overflow-hidden md:rounded-3xl bg-white shadow-2xl relative transition-colors duration-300">
        <Header onMenuClick={() => setIsSidebarOpen(true)} onSearch={handleSearch} />

        <div className="flex flex-1 overflow-hidden">
          <div className="flex flex-1 flex-col overflow-y-auto p-4 sm:p-8 pt-6 custom-scrollbar">
            
            {/* Discover Header */}
            <div className="mb-10 flex items-end justify-between">
              <div>
                <div className="flex items-center gap-2 text-[#800000] mb-2">
                  <BookIcon />
                  <span className="text-xs font-bold uppercase tracking-widest">Explore the world</span>
                </div>
                <h1 className="text-4xl font-black text-black tracking-tight">Discover</h1>
                <p className="text-gray-500 font-medium">Find your next favorite book among millions of titles</p>
              </div>
            </div>

            {/* Topics Selection Grid */}
            <div className="mb-12">
              <h3 className="text-sm font-bold text-gray-400 mb-5 uppercase tracking-wider">Popular Topics</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                {topics.map((topic, index) => (
                  <button
                    key={topic.name}
                    onClick={() => handleTopicClick(topic)}
                    className={`flex flex-col items-center justify-center gap-3 p-6 rounded-3xl text-sm font-bold transition-all active:scale-95 border-2 ${
                      selectedTopic === topic.name
                        ? "bg-[#800000] border-[#800000] text-white shadow-xl shadow-[#800000]/20 scale-[1.02]"
                        : "bg-white border-gray-100 text-gray-700 hover:border-[#800000]/30 hover:bg-[#800000]/5"
                    } ${index >= 2 && !isTopicsExpanded ? 'hidden sm:flex' : 'flex'}`}
                  >
                    <div className={`p-3 rounded-2xl ${selectedTopic === topic.name ? "bg-white/20 text-white" : "bg-[#800000]/10 text-[#800000]"}`}>
                      {topic.icon}
                    </div>
                    {topic.name}
                  </button>
                ))}
              </div>
              <div className="flex justify-center sm:hidden">
                <button 
                  onClick={() => setIsTopicsExpanded(!isTopicsExpanded)}
                  className="flex items-center gap-1 text-xs font-bold text-[#800000]"
                >
                  {isTopicsExpanded ? "Show Less" : "Show More"}
                  <ChevronRightIcon className={`w-4 h-4 transition-transform ${isTopicsExpanded ? "-rotate-90" : "rotate-90"}`} />
                </button>
              </div>
            </div>

            {/* Content Section */}
            <div className="bg-gray-50/50 rounded-[40px] p-4 sm:p-8 border border-gray-100">
              {/* Tabs & Pagination Header */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 sticky top-0 bg-transparent z-10 py-2 gap-4 sm:gap-0">
                <div className="flex items-center gap-4 sm:gap-8 text-xs sm:text-sm font-bold text-gray-400 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0 no-scrollbar">
                  {tabs.map((tab) => (
                    <button
                      key={tab}
                      onClick={() => handleTabClick(tab)}
                      className={`relative transition-all duration-300 py-1 whitespace-nowrap ${
                        activeTab === tab ? "text-black text-lg" : "hover:text-[#800000]"
                      }`}
                    >
                      {tab}
                      {activeTab === tab && (
                        <span className="absolute -bottom-1 left-0 h-1.5 w-full rounded-full bg-[#800000] animate-in slide-in-from-left-2 duration-300"></span>
                      )}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2 self-end sm:self-auto">
                  {startIndex > 0 && (
                    <button 
                      onClick={handlePrevPage}
                      className="flex items-center gap-2 text-xs sm:text-sm font-black text-[#800000] hover:-translate-x-1 transition-transform bg-white border border-[#800000]/20 px-5 py-2.5 rounded-full shadow-sm"
                    >
                      <span className="rotate-180 flex"><ChevronRightIcon /></span> Prev
                    </button>
                  )}
                  <button 
                    onClick={handleNextPage}
                    className="flex items-center gap-2 text-xs sm:text-sm font-black text-[#800000] hover:translate-x-1 transition-transform bg-white border border-[#800000]/20 px-5 py-2.5 rounded-full shadow-sm"
                  >
                    Next <ChevronRightIcon />
                  </button>
                </div>
              </div>

              {/* Search results/Topics indicators */}
              {(searchQuery || selectedTopic) && (
                <div className="mb-8 flex flex-wrap gap-2 items-center">
                  <span className="text-sm font-bold text-gray-400 mr-2">Filters:</span>
                  {searchQuery && (
                    <span className="bg-[#800000] text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md shadow-[#800000]/20 flex items-center gap-2">
                      {searchQuery.startsWith("author:") ? `Author: ${searchQuery.replace("author:", "")}` : `Search: ${searchQuery}`}
                      <button onClick={() => setSearchQuery("")} className="hover:opacity-70">×</button>
                    </span>
                  )}
                  {selectedTopic && (
                    <span className="bg-[#800000] text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md shadow-[#800000]/20 flex items-center gap-2">
                      Topic: {selectedTopic}
                      <button onClick={() => setSelectedTopic("")} className="hover:opacity-70">×</button>
                    </span>
                  )}
                  <button 
                    onClick={() => {setSearchQuery(""); setSelectedTopic(""); setActiveTab("Popular");}}
                    className="text-xs font-black text-[#800000] hover:underline ml-4"
                  >
                    Reset all
                  </button>
                </div>
              )}

              {/* Book Grid */}
              {loading ? (
                <div className="flex items-center justify-center h-96">
                  <div className="relative">
                    <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-[#800000]/20"></div>
                    <div className="absolute inset-0 animate-spin rounded-full h-16 w-16 border-t-4 border-transparent border-l-4 border-[#800000]"></div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 sm:gap-10 mb-12">
                  {books.map((book) => (
                    <BookCard
                      key={book.id}
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
                      onBookmark={() => handleBookmarkToggle({
                        id: book.id,
                        volumeInfo: book.volumeInfo,
                        accessInfo: book.accessInfo,
                      })}
                      isBookmarked={bookmarkedBooks.some((b) => b.id === book.id)}
                    />
                  ))}
                  {books.length === 0 && (
                    <div className="col-span-full text-center py-20 bg-white rounded-[32px] border border-dashed border-gray-200">
                      <div className="text-4xl mb-4">📚</div>
                      <h3 className="text-lg font-bold text-black mb-1">No books found</h3>
                      <p className="text-gray-400">Try a different search or browse another category.</p>
                      <button 
                        onClick={() => {setSearchQuery(""); setSelectedTopic(""); setActiveTab("Popular");}}
                        className="mt-6 bg-[#800000] text-white px-8 py-3 rounded-2xl font-bold shadow-lg shadow-[#800000]/20 hover:scale-105 transition-all"
                      >
                        Explore Popular
                      </button>
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

export default function DiscoverPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center bg-white">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-[#800000]/10"></div>
          <div className="h-4 w-32 rounded bg-gray-100"></div>
        </div>
      </div>
    }>
      <DiscoverContent />
    </Suspense>
  );
}
