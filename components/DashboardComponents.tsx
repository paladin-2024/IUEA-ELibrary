import React from "react";
import Link from "next/link";

export interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  href?: string;
}

export function NavItem({
  icon,
  label,
  active = false,
  href = "#",
}: NavItemProps) {
  return (
    <Link
      href={href}
      className={`flex cursor-pointer items-center gap-4 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 ${
        active
          ? "bg-[#800000] text-white shadow-md transform scale-[1.02]"
          : "text-gray-500 hover:bg-gray-100 hover:text-black"
      }`}
    >
      <div className={`${active ? "text-white" : "text-gray-400"}`}>
        {icon}
      </div>
      <span>{label}</span>
      {active && (
        <div className="ml-auto h-2 w-2 rounded-full bg-white animate-pulse"></div>
      )}
    </Link>
  );
}

export interface BookCardProps {
  image: string;
  title: string;
  author: string;
  downloadUrl?: string;
  onRead?: () => void;
  onBookmark?: () => void;
  isBookmarked?: boolean;
}

export function BookCard({
  image,
  title,
  author,
  downloadUrl,
  onRead,
  onBookmark,
  isBookmarked = false,
}: BookCardProps) {
  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (downloadUrl) {
      window.open(downloadUrl, "_blank");
    } else {
      alert("Download not available for this book.");
    }
  };

  const handleRead = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onRead) {
      onRead();
    }
  };

  const handleBookmark = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onBookmark) {
      onBookmark();
    }
  };

  return (
    <div className="group cursor-pointer">
      <div className="relative mb-3 overflow-hidden rounded-xl shadow-md transition-all duration-300 group-hover:-translate-y-2 group-hover:shadow-xl">
        <img
          src={image}
          alt={title}
          className="aspect-[3/4] w-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100 gap-2">
          <button 
            onClick={handleRead}
            className="rounded-full bg-[#800000] p-3 text-white shadow-lg transition-transform hover:scale-110 active:scale-95"
            title="Read now"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><path d="M5 3l14 9-14 9V3z" /></svg>
          </button>
          {downloadUrl && (
            <button 
              onClick={handleDownload}
              className="rounded-full bg-white p-3 text-[#800000] shadow-lg transition-transform hover:scale-110 active:scale-95"
              title="Download"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
            </button>
          )}
          {onBookmark && (
            <button 
              onClick={handleBookmark}
              className={`rounded-full p-3 shadow-lg transition-transform hover:scale-110 active:scale-95 ${isBookmarked ? "bg-[#800000] text-white" : "bg-white text-[#800000]"}`}
              title={isBookmarked ? "Remove from bookmarks" : "Add to bookmarks"}
            >
              <svg viewBox="0 0 24 24" fill={isBookmarked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" /></svg>
            </button>
          )}
        </div>
      </div>
      <h3 className="mb-1 text-sm font-bold text-black line-clamp-1 group-hover:text-[#800000] transition-colors">
        {title}
      </h3>
      <p className="text-xs text-gray-500 font-medium">{author}</p>
    </div>
  );
}

export interface ProgressItemProps {
  image: string;
  title: string;
  pages: string;
  progress: number;
}

export function ProgressItem({
  image,
  title,
  pages,
  progress,
  onRead,
}: ProgressItemProps & { onRead?: () => void }) {
  return (
    <div 
      onClick={onRead}
      className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 group cursor-pointer hover:bg-gray-50/50 p-2 rounded-xl transition-colors"
    >
      <div className="flex items-center gap-4 flex-1 w-full sm:w-auto">
        <img src={image} alt={title} className="h-10 w-8 rounded object-cover shadow-sm transition-transform group-hover:scale-110" />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-black group-hover:text-[#800000] transition-colors truncate">{title}</div>
          <div className="text-sm text-gray-500 font-medium sm:hidden">{pages}</div>
        </div>
      </div>
      
      <div className="hidden sm:block w-24 text-sm text-gray-500 font-medium">{pages}</div>
      
      <div className="flex items-center gap-4 w-full sm:w-auto sm:flex-1">
        <div className="flex-1">
          <div className="h-2 w-full rounded-full bg-gray-200 overflow-hidden">
            <div
              className="h-full rounded-full bg-[#800000] transition-all duration-1000 ease-out shadow-[0_0_8px_rgba(128,0,0,0.4)]"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
        <div className="w-12 sm:w-24 text-right text-xs sm:text-sm font-bold text-[#800000] whitespace-nowrap">
          {progress}% <span className="hidden xs:inline">complete</span>
        </div>
      </div>
    </div>
  );
}

export interface AuthorItemProps {
  name: string;
  following?: boolean;
}

export function AuthorItem({
  name,
  following = false,
}: AuthorItemProps) {
  const [isFollowing, setIsFollowing] = React.useState(following);

  return (
    <div className="flex items-center justify-between group">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 overflow-hidden rounded-full border-2 border-white shadow-md transition-transform group-hover:scale-110 group-hover:border-[#800000]/20">
          <img
            src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`}
            alt={name}
            className="h-full w-full object-cover"
          />
        </div>
        <span className="text-sm font-bold text-black group-hover:text-[#800000] transition-colors">{name}</span>
      </div>
      <button
        onClick={() => setIsFollowing(!isFollowing)}
        className={`rounded-xl px-4 py-2 text-xs font-bold transition-all active:scale-95 ${
          isFollowing
            ? "bg-black text-white hover:bg-[#800000] shadow-md"
            : "border-2 border-gray-100 text-gray-500 hover:border-[#800000] hover:text-[#800000] hover:bg-[#800000]/5"
        }`}
      >
        {isFollowing ? "Unfollow" : "Follow"}
      </button>
    </div>
  );
}

export interface BlogItemProps {
  image: string;
  title: string;
  author: string;
  likes: number;
  comments: number;
}

export function BlogItem({
  image,
  title,
  author,
  likes,
  comments,
}: BlogItemProps) {
  const [liked, setLiked] = React.useState(false);
  const [likeCount, setLikeCount] = React.useState(likes);

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    setLiked(!liked);
    setLikeCount(liked ? likeCount - 1 : likeCount + 1);
  };

  return (
    <div className="flex gap-4 cursor-pointer group p-2 rounded-2xl hover:bg-gray-50 transition-all duration-300">
      <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl shadow-md">
        <img
          src={image}
          alt={title}
          className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors" />
      </div>
      <div className="flex flex-col justify-between py-0.5">
        <h3 className="text-sm font-bold leading-tight text-black line-clamp-2 group-hover:text-[#800000] transition-colors">
          {title}
        </h3>
        <div>
          <p className="mb-1 text-[10px] text-gray-500 font-semibold italic">
            by <span className="text-black">{author}</span>
          </p>
          <div className="flex items-center gap-4 text-[10px] font-black">
            <button 
              onClick={handleLike}
              className={`flex items-center gap-1 transition-colors ${liked ? "text-[#800000]" : "text-gray-400 hover:text-[#800000]"}`}
            >
              <svg viewBox="0 0 24 24" fill={liked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5"><path d="M7 10v12" /><path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88Z" /></svg>
              {likeCount}
            </button>
            <span className="flex items-center gap-1 text-gray-400">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
              {comments}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
