import React from "react";
import { UserIcon } from "./icons";

export function RightSidebar() {
  const topAuthors = [
    "James Elijah",
    "William Henry",
    "Aria Abigail",
    "Mia Evelyn",
    "Mateo Levi",
    "Sarah Jenkins",
    "Robert Frost",
    "Emily Dickinson"
  ];

  return (
    <div className="hidden lg:block w-80 overflow-y-auto border-l border-gray-100 p-8 pt-6 custom-scrollbar bg-gray-50/30 transition-colors duration-300">
      <section>
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-xl font-black text-black uppercase tracking-tighter">
            Top Authors
          </h2>
        </div>
        <div className="flex flex-col gap-4">
          {topAuthors.map((author) => (
            <div 
              key={author}
              className="group flex items-center gap-3 p-3 rounded-2xl hover:bg-white hover:shadow-sm transition-all duration-300 cursor-pointer"
            >
              <div className="h-8 w-8 rounded-full bg-[#800000]/5 flex items-center justify-center text-[#800000] group-hover:bg-[#800000] group-hover:text-white transition-all duration-300">
                <UserIcon />
              </div>
              <span className="text-sm font-bold text-gray-700 group-hover:text-[#800000] transition-colors flex-1">
                {author}
              </span>
              <div className="h-1.5 w-1.5 rounded-full bg-gray-200 group-hover:bg-[#800000] transition-colors"></div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
