"use client";

import React, { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { RightSidebar } from "@/components/RightSidebar";
import { HelpCircleIcon, BookIcon } from "@/components/icons";

export default function HelpPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const faqs = [
    {
      question: "How do I read a book?",
      answer: "Navigate to the Discover page.tsx, hover over any book cover, and click the play (Read) icon. This will open our integrated e-book reader."
    },
    {
      question: "Can I download books for offline reading?",
      answer: "Yes, many books offer download options. Click the download icon on the book card to save a PDF or EPUB version if available."
    },
    {
      question: "How do I search for specific authors?",
      answer: "You can use the search bar in the header and select 'Author' from the dropdown menu, or type 'author:name' directly into the search field."
    },
    {
      question: "Is the library free to use?",
      answer: "Our platform provides access to millions of public domain and preview titles via the Google Books API."
    }
  ];

  return (
    <div className="flex h-screen bg-[#f1f3f6] p-0 md:p-4 text-[#2d3a4b] font-sans selection:bg-[#800000]/20 overflow-hidden transition-colors duration-300">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <main className="flex flex-1 flex-col overflow-hidden md:rounded-3xl bg-white shadow-2xl relative transition-colors duration-300">
        <Header onMenuClick={() => setIsSidebarOpen(true)} />

        <div className="flex flex-1 overflow-hidden">
          <div className="flex flex-1 flex-col overflow-y-auto p-4 sm:p-8 pt-6 custom-scrollbar">
            
            {/* help Header */}
            <div className="mb-10 flex items-end justify-between">
              <div>
                <div className="flex items-center gap-2 text-[#800000] mb-2">
                  <HelpCircleIcon />
                  <span className="text-xs font-bold uppercase tracking-widest">Support Center</span>
                </div>
                <h1 className="text-4xl font-black text-black tracking-tight">Help & FAQ</h1>
                <p className="text-gray-500 font-medium">Everything you need to know about using E-Library</p>
              </div>
            </div>

            {/* Content Section */}
            <div className="space-y-8">
              <section className="bg-gray-50/50 rounded-[40px] p-6 sm:p-10 border border-gray-100">
                <h2 className="text-2xl font-black text-black mb-6 flex items-center gap-3">
                  <div className="p-2 bg-[#800000]/10 rounded-xl text-[#800000]">
                    <BookIcon />
                  </div>
                  Frequently Asked Questions
                </h2>
                <div className="grid gap-6">
                  {faqs.map((faq, index) => (
                    <div key={index} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                      <h3 className="text-lg font-bold text-black mb-2">{faq.question}</h3>
                      <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
                    </div>
                  ))}
                </div>
              </section>

              <section className="bg-[#800000] rounded-[40px] p-8 sm:p-12 text-white shadow-xl shadow-[#800000]/20">
                <h2 className="text-3xl font-black mb-4">Still need help?</h2>
                <p className="text-white/80 mb-8 max-w-xl">
                  Our support team is available to help you with any technical issues or questions about our digital collection.
                </p>
                <button className="bg-white text-[#800000] px-8 py-4 rounded-2xl font-black hover:scale-105 transition-transform active:scale-95">
                  Contact Support
                </button>
              </section>
            </div>
          </div>

          <RightSidebar />
        </div>
      </main>
    </div>
  );
}
