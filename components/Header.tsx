import React from "react";
import { SearchIcon, BellIcon, MenuIcon } from "./icons";

interface HeaderProps {
  onMenuClick: () => void;
  onSearch?: (query: string) => void;
}

export function Header({ onMenuClick, onSearch }: HeaderProps) {
  const [isSearchFocused, setIsSearchFocused] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [searchType, setSearchType] = React.useState<"all" | "author">("all");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(searchType === "author" ? `author:${query}` : query);
    }
  };

  return (
    <header className="flex h-20 items-center justify-between border-b border-gray-100 px-4 md:px-8 bg-white/80 backdrop-blur-md sticky top-0 z-30 transition-colors duration-300">
      <div className="flex items-center gap-4 flex-1">
        <button
          onClick={onMenuClick}
          className="lg:hidden flex items-center gap-2 p-1 rounded-lg hover:bg-gray-100 transition-colors text-gray-600"
          aria-label="Open sidebar"
        >
          <MenuIcon />
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
              placeholder={searchType === "all" ? "Search for books, authors..." : "Search for author name..."}
            />
          </div>
          <select 
            value={searchType}
            onChange={(e) => setSearchType(e.target.value as "all" | "author")}
            className="text-xs font-bold bg-gray-50 border-none rounded-full px-3 py-2.5 focus:ring-2 focus:ring-[#800000]/20 outline-none text-[#800000] cursor-pointer hover:bg-gray-100 transition-colors"
          >
            <option value="all">All</option>
            <option value="author">Author</option>
          </select>
        </form>
      </div>

      <div className="flex items-center gap-3 md:gap-8 ml-4">
        <div className="relative group hidden sm:block">
          <button className="text-gray-400 transition-all hover:text-[#800000] hover:scale-110 active:scale-90">
            <BellIcon />
          </button>
          <span className="absolute top-0 right-0 flex h-2.5 w-2.5 rounded-full bg-[#800000] border-2 border-white animate-bounce"></span>
        </div>
        <div className="flex items-center gap-2 md:gap-3 cursor-pointer group">
          <div className="flex h-8 w-8 md:h-10 md:w-10 items-center justify-center overflow-hidden rounded-full border-2 border-transparent group-hover:border-[#800000] transition-all shadow-sm">
            <img
              src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"
              alt="Profile"
              className="h-full w-full object-cover"
            />
          </div>
          <span className="hidden xl:block text-sm font-bold text-black group-hover:text-[#800000] transition-colors">Felix A.</span>
        </div>
      </div>
    </header>
  );
}
