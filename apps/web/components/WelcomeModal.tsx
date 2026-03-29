"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { X } from "lucide-react";

// 👇 Replace with your actual YouTube video ID
const YOUTUBE_VIDEO_ID = "NyraQUcNLC8";

export default function WelcomeModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // Small delay so it doesn't feel jarring on page load
    const timer = setTimeout(() => setOpen(true), 600);
    return () => clearTimeout(timer);
  }, []);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="welcome-modal-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        style={{ animation: "fadeIn 0.3s ease" }}
        onClick={() => setOpen(false)}
      />

      {/* Modal panel */}
      <div
        className="relative w-full max-w-2xl rounded-2xl border border-white/10 bg-[#0f0f0f] shadow-2xl overflow-hidden"
        style={{ animation: "scaleIn 0.35s cubic-bezier(0.16, 1, 0.3, 1)" }}
      >
        {/* Close button */}
        <button
          onClick={() => setOpen(false)}
          className="absolute right-4 top-4 z-10 rounded-lg p-1.5 text-white/40 transition-colors hover:bg-white/10 hover:text-white"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="p-8">
          {/* Badge */}
          <p className="mb-4 text-xs font-medium tracking-[0.2em] uppercase text-white/30">
            Demo Preview
          </p>

          {/* Title */}
          <h2
            id="welcome-modal-title"
            className="mb-6 text-xl font-light leading-snug tracking-tight text-white sm:text-2xl"
          >
            Hey Wealthsimple! Here is a small demo, and you can try it yourself
            as well by clicking get started!{" "}
            <span className="text-white/50">:)</span>
          </h2>

          {/* YouTube embed */}
          <div className="mb-6 overflow-hidden rounded-xl border border-white/10 bg-white/[0.03]">
            <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
              <iframe
                src={`https://www.youtube.com/embed/${YOUTUBE_VIDEO_ID}?rel=0&modestbranding=1`}
                title="Crawl Demo"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="absolute inset-0 h-full w-full"
              />
            </div>
          </div>

          {/* CTA */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-white/30">
              No credit card required
            </p>
            <Link
              href="/auth/login"
              onClick={() => setOpen(false)}
              className="group flex items-center gap-3 rounded-xl bg-white px-6 py-3 text-sm font-medium text-black transition-all hover:bg-white/90"
            >
              Get Started Free
              <svg
                className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </Link>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.96) translateY(8px); }
          to   { opacity: 1; transform: scale(1)    translateY(0);   }
        }
      `}</style>
    </div>
  );
}
