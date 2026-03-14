import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container max-w-4xl px-4 py-16 text-center">
        <div className="mb-8 inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-4 py-1.5 text-sm text-blue-700 dark:border-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
          🚀 Autonomous SEO & GEO Platform
        </div>
        <h1 className="mb-6 text-5xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-6xl">
          SEO that runs{" "}
          <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            itself
          </span>
        </h1>
        <p className="mb-10 text-xl text-gray-600 dark:text-gray-300">
          SEOClaw autonomously tracks rankings, finds keyword gaps, and optimizes
          your content for LLM citation visibility — 24/7, no manual work required.
        </p>
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Button asChild size="lg" className="px-8">
            <Link href="/auth/login">Get Started Free</Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="px-8">
            <Link href="/sandbox/demo">Try Live Demo</Link>
          </Button>
        </div>
        <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-3">
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <div className="mb-3 text-3xl">🎯</div>
            <h3 className="mb-2 font-semibold">Keyword Intelligence</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              AI-powered keyword gap analysis finds opportunities you&apos;re missing
            </p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <div className="mb-3 text-3xl">🤖</div>
            <h3 className="mb-2 font-semibold">GEO Optimization</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Track and improve your visibility in ChatGPT, Perplexity, and Gemini
            </p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <div className="mb-3 text-3xl">📊</div>
            <h3 className="mb-2 font-semibold">Autonomous Reports</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Weekly SEO reports delivered to Slack automatically
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
