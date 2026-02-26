import React from "react";

function FeedIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="lucide lucide-newspaper"
      aria-hidden="true"
    >
      <path d="M15 18h-5"></path>
      <path d="M18 14h-8"></path>
      <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-4 0v-9a2 2 0 0 1 2-2h2"></path>
      <rect width="8" height="4" x="10" y="6" rx="1"></rect>
    </svg>
  );
}

function SparklesIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="lucide lucide-sparkles"
      aria-hidden="true"
    >
      <path d="M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z"></path>
      <path d="M20 2v4"></path>
      <path d="M22 4h-4"></path>
      <circle cx="4" cy="20" r="2"></circle>
    </svg>
  );
}

function EarthIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="lucide lucide-earth"
      aria-hidden="true"
    >
      <path d="M21.54 15H17a2 2 0 0 0-2 2v4.54"></path>
      <path d="M7 3.34V5a3 3 0 0 0 3 3a2 2 0 0 1 2 2c0 1.1.9 2 2 2a2 2 0 0 0 2-2c0-1.1.9-2 2-2h3.17"></path>
      <path d="M11 21.95V18a2 2 0 0 0-2-2a2 2 0 0 1-2-2v-1a2 2 0 0 0-2-2H2.05"></path>
      <circle cx="12" cy="12" r="10"></circle>
    </svg>
  );
}

function BookmarkIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="lucide lucide-bookmark"
      aria-hidden="true"
    >
      <path d="M17 3a2 2 0 0 1 2 2v15a1 1 0 0 1-1.496.868l-4.512-2.578a2 2 0 0 0-1.984 0l-4.512 2.578A1 1 0 0 1 5 20V5a2 2 0 0 1 2-2z"></path>
    </svg>
  );
}

const FILTER_OPTIONS = [
  { key: "feed", label: "Feed", icon: <FeedIcon /> },
  { key: "my-posts", label: "My Posts", icon: <SparklesIcon /> },
  { key: "community", label: "Community", icon: <EarthIcon /> },
  { key: "saved", label: "Saved", icon: <BookmarkIcon /> },
];

export default function FilterPosts({ activeFilter, onFilterChange }) {
  return (
    <>
      <aside className="hidden h-fit space-y-3 xl:sticky xl:top-[84px] xl:block">
        <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
          {FILTER_OPTIONS.map((option, index) => {
            const isActive = activeFilter === option.key;
            return (
              <button
                key={option.key}
                type="button"
                onClick={() => onFilterChange(option.key)}
                aria-pressed={isActive}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm font-bold transition ${
                  isActive
                    ? "bg-[#e7f3ff] text-[#1877f2]"
                    : "text-slate-700 hover:bg-slate-100"
                } ${index > 0 ? "mt-1" : ""}`}
              >
                {option.icon}
                {option.label}
              </button>
            );
          })}
        </div>
      </aside>

      <div className="rounded-2xl border border-slate-200 bg-white p-2 shadow-sm xl:hidden">
        <div className="grid grid-cols-2 gap-2">
          {FILTER_OPTIONS.map((option) => {
            const isActive = activeFilter === option.key;
            return (
              <button
                key={`mobile-${option.key}`}
                type="button"
                onClick={() => onFilterChange(option.key)}
                aria-pressed={isActive}
                className={`flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-bold transition ${
                  isActive
                    ? "bg-[#e7f3ff] text-[#1877f2]"
                    : "bg-slate-50 text-slate-700 hover:bg-slate-100"
                }`}
              >
                {option.icon}
                {option.label}
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}
