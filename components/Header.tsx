import React from "react";
import { useRouter, usePathname } from "next/navigation";
import { SearchIcon, BellIcon, MenuIcon } from "./icons";
import { useState } from "react";

interface HeaderProps {
  onMenuClick: () => void;
  onSearch?: (query: string) => void;
}

export function Header({ onMenuClick, onSearch }: HeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isSearchFocused, setIsSearchFocused] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [isNotificationsOpen, setIsNotificationsOpen] = React.useState(false);
  const [isProfileOpen, setIsProfileOpen] = React.useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (pathname !== "/discover") {
      router.push(`/discover?q=${encodeURIComponent(query)}`);
    } else if (onSearch) {
      onSearch(query);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("isAuthenticated");
    localStorage.removeItem("userEmail");
    router.push("/signin");
  };

  return (
    <header className="flex h-20 items-center justify-between border-b border-gray-100 px-4 md:px-8 bg-white/80 backdrop-blur-md sticky top-0 z-30 transition-colors duration-300">
      <div className="flex items-center gap-4 flex-1">
        <button
          onClick={onMenuClick}
          className="lg:hidden flex items-center gap-2 p-1 rounded-lg hover:bg-gray-100 transition-colors"
          aria-label="Open sidebar"
        >
          <img src="/logo.png" alt="Logo" className="h-8 w-8 object-contain" />
        </button>
        
        <form onSubmit={handleSubmit} className="relative flex-1 max-w-lg flex items-center gap-2">
          <div className="relative flex-1">
            <div className={`pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 transition-colors ${isSearchFocused ? "text-[#800000]" : "text-gray-400"}`}>
              <SearchIcon />
            </div>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
              className="block w-full rounded-full bg-gray-50 py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#800000]/20 focus:bg-white transition-all border border-transparent focus:border-[#800000]/30 text-black"
              placeholder="Search for books, authors..."
            />
          </div>
        </form>
      </div>

      <div className="flex items-center gap-3 md:gap-8 ml-4">
        <div className="relative group">
          <button 
            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
            className="text-gray-400 transition-all hover:text-[#800000] hover:scale-110 active:scale-90"
          >
            <BellIcon />
          </button>
          <span className="absolute top-0 right-0 flex h-2.5 w-2.5 rounded-full bg-[#800000] border-2 border-white animate-bounce"></span>
          {isNotificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-100 p-4 z-50">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-lg text-black">Notifications</h3>
                <button onClick={() => setIsNotificationsOpen(false)} className="text-gray-400 hover:text-gray-600">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
              <div className="text-center text-gray-500">
                <p>No new notifications</p>
              </div>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 md:gap-3 cursor-pointer group relative">
          <button
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center gap-2 md:gap-3 hover:scale-105 transition-transform"
          >
            <div className="flex h-8 w-8 md:h-10 md:w-10 items-center justify-center overflow-hidden rounded-full border-2 border-transparent group-hover:border-[#800000] transition-all shadow-sm">
              <img
                src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"
                alt="Profile"
                className="h-full w-full object-cover"
              />
            </div>
            <span className="hidden xl:block text-sm font-bold text-black group-hover:text-[#800000] transition-colors">Felix A.</span>
          </button>
          {isProfileOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 p-2 z-50 top-full">
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors font-semibold text-sm"
              >
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
