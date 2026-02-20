"use client";

import React, { useState, useEffect } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { RightSidebar } from "@/components/RightSidebar";
import { BookCard, ProgressItem } from "@/components/DashboardComponents";
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
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

const progressData = [
  { name: 'Mon', progress: 10 },
  { name: 'Tue', progress: 25 },
  { name: 'Wed', progress: 45 },
  { name: 'Thu', progress: 40 },
  { name: 'Fri', progress: 65 },
  { name: 'Sat', progress: 80 },
  { name: 'Sun', progress: 85 },
];

export default function Home() {
  const [activeTab, setActiveTab] = useState("Popular");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [books, setBooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTopic, setSelectedTopic] = useState("");
  const [startIndex, setStartIndex] = useState(0);
  const [readingBook, setReadingBook] = useState<any>(null);
  const [readingProgress, setReadingProgress] = useState<Record<string, number>>({
    "Hold back the star": 64,
    "One day a novel": 45,
    "In the company of...": 52
  });
  
  const tabs = ["Popular", "Most Searched", "New"];
  const topics = [
    { name: "Technology", icon: <CpuIcon /> },
    { name: "Science", icon: <FlaskConIcon /> },
    { name: "Computer Science", icon: <CpuIcon /> },
    { name: "Business", icon: <BriefcaseIcon /> },
    { name: "Art", icon: <PaletteIcon /> },
    { name: "Philosophy", icon: <BrainIcon /> },
    { name: "History", icon: <HistoryIcon /> },
    { name: "Psychology", icon: <BrainIcon /> },
  ];

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
          const q = activeTab === "Popular" ? "bestseller" : activeTab.toLowerCase();
          queryParams = `q=${encodeURIComponent(q)}`;
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
    setSelectedTopic(""); // Clear topic when searching
    setStartIndex(0); // Reset pagination
    if (query) {
      setActiveTab(""); // Deselect tabs when searching
    } else {
      setActiveTab("Popular");
    }
  };

  const handleTabClick = (tab: string) => {
    setActiveTab(tab);
    setSearchQuery(""); // Clear search when a tab is clicked
    setSelectedTopic(""); // Clear topic when a tab is clicked
    setStartIndex(0); // Reset pagination
  };

  const handleTopicClick = (topic: string) => {
    if (selectedTopic === topic.name) {
      setSelectedTopic("");
      setActiveTab("Popular");
    } else {
      setSelectedTopic(topic.name);
      setActiveTab("");
      setSearchQuery("");
    }
    setStartIndex(0); // Reset pagination
  };

  const handleNextPage = () => {
    setStartIndex(prev => prev + 10);
  };

  const handlePrevPage = () => {
    setStartIndex(prev => Math.max(0, prev - 10));
  };

  const handleUpdateProgress = (bookTitle: string, progress: number) => {
    setReadingProgress(prev => ({
      ...prev,
      [bookTitle]: progress
    }));
  };

  return (
    <div className="flex h-screen bg-[#f1f3f6] p-0 md:p-4 text-[#2d3a4b] font-sans selection:bg-[#800000]/20 overflow-hidden transition-colors duration-300">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      {/* Main Content Area */}
      <main className="flex flex-1 flex-col overflow-hidden md:rounded-3xl bg-white shadow-2xl relative transition-colors duration-300">
        <Header onMenuClick={() => setIsSidebarOpen(true)} onSearch={handleSearch} />

        <div className="flex flex-1 overflow-hidden">
          {/* Dashboard Body */}
          <div className="flex flex-1 flex-col overflow-y-auto p-4 sm:p-8 pt-6 custom-scrollbar">
            
            {/* Reading Progress Graph Section */}
            <div className="mb-10 bg-[#800000]/5 p-6 rounded-3xl border border-[#800000]/10">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-black text-black">Weekly Reading Progress</h2>
                  <p className="text-sm text-gray-500">You're doing great this week!</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-black text-[#800000]">85%</div>
                  <div className="text-xs font-bold text-gray-400">Current Goal</div>
                </div>
              </div>
              <div className="h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={progressData}>
                    <defs>
                      <linearGradient id="colorProgress" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#800000" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#800000" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{fill: '#9ca3af', fontSize: 12, fontWeight: 600}}
                      dy={10}
                    />
                    <YAxis hide domain={[0, 100]} />
                    <Tooltip 
                      contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="progress" 
                      stroke="#800000" 
                      strokeWidth={3}
                      fillOpacity={1} 
                      fill="url(#colorProgress)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Tabs & Search Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 sticky top-0 bg-white/95 backdrop-blur-sm z-10 py-2 gap-4 sm:gap-0">
              <div className="flex items-center gap-4 sm:gap-8 text-xs sm:text-sm font-bold text-gray-400 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0 no-scrollbar">
                {tabs.map((tab) => (
                  <button
                    key={tab}
                    onClick={() => handleTabClick(tab)}
                    className={`relative transition-all duration-300 py-1 whitespace-nowrap ${
                      activeTab === tab
                        ? "text-black"
                        : "hover:text-[#800000]"
                    }`}
                  >
                    {tab}
                    {activeTab === tab && (
                      <span className="absolute -bottom-1 left-0 h-1 w-full rounded-full bg-[#800000] animate-in slide-in-from-left-2 duration-300"></span>
                    )}
                  </button>
                ))}
              </div>
              {searchQuery && (
                <div className="text-sm font-bold text-gray-500">
                  {searchQuery.startsWith("author:") ? (
                    <>Search results for author: <span className="text-[#800000]">"{searchQuery.replace("author:", "")}"</span></>
                  ) : (
                    <>Search results for: <span className="text-[#800000]">"{searchQuery}"</span></>
                  )}
                </div>
              )}
              {selectedTopic && (
                <div className="text-sm font-bold text-gray-500">
                  Results for topic: <span className="text-[#800000]">"{selectedTopic}"</span>
                </div>
              )}
              <div className="flex items-center gap-2 self-end sm:self-auto">
                {startIndex > 0 && (
                  <button 
                    onClick={handlePrevPage}
                    className="flex items-center gap-2 text-xs sm:text-sm font-black text-[#800000] hover:-translate-x-1 transition-transform bg-[#800000]/5 px-4 py-2 rounded-full"
                  >
                    <span className="rotate-180 flex"><ChevronRightIcon /></span> Prev
                  </button>
                )}
                <button 
                  onClick={handleNextPage}
                  className="flex items-center gap-2 text-xs sm:text-sm font-black text-[#800000] hover:translate-x-1 transition-transform bg-[#800000]/5 px-4 py-2 rounded-full"
                >
                  Next <ChevronRightIcon />
                </button>
              </div>
            </div>

            {/* Topics Selection */}
            <div className="mb-8 overflow-hidden">
              <h3 className="text-sm font-bold text-gray-400 mb-3">Explore Topics</h3>
              <div className="flex items-center gap-3 overflow-x-auto pb-2 no-scrollbar">
                {topics.map((topic) => (
                  <button
                    key={topic.name}
                    onClick={() => handleTopicClick(topic)}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold transition-all whitespace-nowrap active:scale-95 ${
                      selectedTopic === topic.name
                        ? "bg-[#800000] text-white shadow-lg shadow-[#800000]/20 scale-105"
                        : "bg-white border-2 border-gray-100 text-gray-500 hover:border-[#800000]/30 hover:text-[#800000]"
                    }`}
                  >
                    <span className={`${selectedTopic === topic.name ? "text-white" : "text-[#800000]"}`}>
                      {topic.icon}
                    </span>
                    {topic.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Book Grid */}
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#800000]"></div>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-8 mb-12">
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
                  />
                ))}
                {books.length === 0 && (
                  <div className="col-span-full text-center py-12 text-gray-500">
                    No books found. Try a different category.
                  </div>
                )}
              </div>
            )}

            {/* Progress Section */}
            <div className="flex flex-col gap-6 border-t border-gray-100 pt-8 mt-4">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-xl font-black text-black">Continuing Reading</h2>
                <button className="text-xs font-bold text-[#800000] hover:underline">View all progress</button>
              </div>
              <ProgressItem
                image="https://m.media-amazon.com/images/I/91j3qXF4m8L._AC_UF1000,1000_QL80_.jpg"
                title="Hold back the star"
                pages="121 page"
                progress={readingProgress["Hold back the star"] || 0}
                onRead={() => setReadingBook({
                  id: "1",
                  title: "Hold back the star",
                  author: "Katie Khan",
                  image: "https://m.media-amazon.com/images/I/91j3qXF4m8L._AC_UF1000,1000_QL80_.jpg"
                })}
              />
              <ProgressItem
                image="https://m.media-amazon.com/images/I/81Wn6VvK5FL._AC_UF1000,1000_QL80_.jpg"
                title="One day a novel"
                pages="11 page"
                progress={readingProgress["One day a novel"] || 0}
                onRead={() => setReadingBook({
                  id: "2",
                  title: "One day a novel",
                  author: "David Nicholls",
                  image: "https://m.media-amazon.com/images/I/81Wn6VvK5FL._AC_UF1000,1000_QL80_.jpg"
                })}
              />
              <ProgressItem
                image="https://m.media-amazon.com/images/I/91r6Wf9vWBL._AC_UF1000,1000_QL80_.jpg"
                title="In the company of..."
                pages="21 page"
                progress={readingProgress["In the company of..."] || 0}
                onRead={() => setReadingBook({
                  id: "3",
                  title: "In the company of...",
                  author: "Grace Bonney",
                  image: "https://m.media-amazon.com/images/I/91r6Wf9vWBL._AC_UF1000,1000_QL80_.jpg"
                })}
              />
            </div>
          </div>

          <RightSidebar />
        </div>
      </main>

      {/* Book Reader Modal */}
      {readingBook && (
        <BookReader 
          book={readingBook} 
          onClose={() => setReadingBook(null)}
          initialProgress={readingProgress[readingBook.title] || 0}
          onProgressUpdate={(progress) => handleUpdateProgress(readingBook.title, progress)}
        />
      )}
    </div>
  );
}
