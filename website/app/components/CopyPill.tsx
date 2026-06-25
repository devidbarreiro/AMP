"use client";

import { useState, useCallback } from "react";

interface CopyPillProps {
  text: string;
  className?: string;
}

export default function CopyPill({ text, className = "" }: CopyPillProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API may not be available
    }
  }, [text]);

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={`group flex items-center gap-3 px-5 py-3 rounded-lg bg-zinc-900 border border-zinc-800 font-mono text-sm hover:border-zinc-700 transition-colors cursor-pointer ${className}`}
    >
      <span className="text-zinc-500">$</span>
      <span className="text-zinc-300">{text}</span>
      <span className="text-zinc-600 group-hover:text-zinc-400 transition-colors ml-2">
        {copied ? (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M3 8.5L6.5 12L13 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <rect x="5" y="5" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
            <path d="M3 11V3.5A.5.5 0 013.5 3H11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        )}
      </span>
    </button>
  );
}
