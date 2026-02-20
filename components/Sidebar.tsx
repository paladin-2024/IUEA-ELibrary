"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { NavItem } from "./DashboardComponents";
import { HomeIcon, CompassIcon, BookmarkIcon, SettingsIcon, HelpCircleIcon, XIcon } from "./icons";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile Overlay */}
      <div
        className={`fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity duration-300 lg:hidden ${
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={onClose}
      />

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col gap-6 bg-[#f1f3f6] p-6 transition-all duration-300 lg:static lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-2 text-xl font-bold text-[#1e293b]">
            <img src="/logo.png" alt="Logo" className="h-10 w-10 object-contain" />
            <span className="text-[#800000]">E-Library</span>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-gray-500 hover:bg-gray-200 lg:hidden"
          >
            <XIcon />
          </button>
        </div>

        <nav className="flex flex-col gap-1">
          <NavItem icon={<HomeIcon />} label="Home" href="/" active={pathname === "/"} />
          <NavItem icon={<CompassIcon />} label="Discover" href="/discover" active={pathname === "/discover"} />
          <NavItem icon={<BookmarkIcon />} label="Bookmark" href="/bookmark" active={pathname === "/bookmark"} />
          <NavItem icon={<SettingsIcon />} label="Settings" href="/settings" active={pathname === "/settings"} />
          <NavItem icon={<HelpCircleIcon />} label="Help" href="/help" active={pathname === "/help"} />
        </nav>
      </aside>
    </>
  );
}
