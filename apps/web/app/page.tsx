import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-[#0a0a0a] text-white px-6 py-20">
      <div className="w-full max-w-2xl flex flex-col items-center text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
        <p className="text-xs font-medium tracking-[0.2em] uppercase text-white/30 mb-6">
          Autonomous SEO & GEO Platform
        </p>
        <h1 className="text-4xl font-light tracking-tight text-white sm:text-5xl mb-4">
          SEO that runs{" "}
          <span className="text-white/90">itself</span>
        </h1>
        <p className="text-white/40 text-base sm:text-lg max-w-xl mb-12">
          SEOClaw autonomously tracks rankings, finds keyword gaps, and optimizes
          your content for LLM citation visibility — 24/7, no manual work required.
        </p>
        <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/auth/login"
            className="group flex items-center gap-3 px-8 py-3.5 bg-white text-black rounded-xl font-medium text-sm transition-all hover:bg-white/90"
          >
            Get Started Free
            <svg className="w-4 h-4 transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
          <Link
            href="/sandbox/demo"
            className="flex items-center gap-3 px-8 py-3.5 rounded-xl font-medium text-sm border border-white/10 text-white/70 hover:text-white hover:border-white/25 transition-all"
          >
            Try Live Demo
          </Link>
        </div>
        <div className="mt-20 grid grid-cols-1 gap-6 sm:grid-cols-3 w-full max-w-3xl">
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 text-left transition-all duration-300 hover:border-white/15 hover:bg-white/[0.04]">
            <div className="mb-3 text-2xl opacity-80">🎯</div>
            <h3 className="text-white font-medium text-sm mb-2">Keyword Intelligence</h3>
            <p className="text-white/40 text-xs leading-relaxed">
              AI-powered keyword gap analysis finds opportunities you&apos;re missing
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 text-left transition-all duration-300 hover:border-white/15 hover:bg-white/[0.04]">
            <div className="mb-3 text-2xl opacity-80">🤖</div>
            <h3 className="text-white font-medium text-sm mb-2">GEO Optimization</h3>
            <p className="text-white/40 text-xs leading-relaxed">
              Track and improve your visibility in ChatGPT, Perplexity, and Gemini
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 text-left transition-all duration-300 hover:border-white/15 hover:bg-white/[0.04]">
            <div className="mb-3 text-2xl opacity-80">📊</div>
            <h3 className="text-white font-medium text-sm mb-2">Autonomous Reports</h3>
            <p className="text-white/40 text-xs leading-relaxed">
              Weekly SEO reports delivered to Slack automatically
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
