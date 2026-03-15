import { fetchFramerPosts } from "@/lib/integrations/framer";
import Link from "next/link";
import { formatDate } from "@/lib/utils";

export const revalidate = 3600;

export default async function BlogPage() {
  const posts = await fetchFramerPosts();

  return (
    <main className="container mx-auto max-w-4xl px-4 py-16">
      <h1 className="mb-2 text-4xl font-bold">SEO & GEO Insights</h1>
      <p className="mb-12 text-lg text-gray-600">
        Tips, strategies, and updates from the Crawl team.
      </p>

      {posts.length === 0 ? (
        <div className="rounded-xl border border-dashed p-12 text-center text-gray-400">
          <p>Blog posts will appear here once Framer CMS is connected.</p>
          <p className="mt-2 text-sm">Configure your Framer API key in Settings.</p>
        </div>
      ) : (
        <div className="grid gap-8">
          {posts.map((post) => (
            <article key={post.id} className="group">
              <Link href={`/blog/${post.slug}`}>
                <div className="rounded-xl border bg-white p-6 transition-shadow hover:shadow-md">
                  {post.coverImage && (
                    <img
                      src={post.coverImage}
                      alt={post.title}
                      className="mb-4 h-48 w-full rounded-lg object-cover"
                    />
                  )}
                  <h2 className="text-xl font-bold group-hover:text-blue-600">{post.title}</h2>
                  {post.excerpt && (
                    <p className="mt-2 text-gray-600">{post.excerpt}</p>
                  )}
                  <div className="mt-4 flex items-center gap-4 text-sm text-gray-400">
                    {post.author && <span>By {post.author}</span>}
                    {post.publishedAt && <span>{formatDate(post.publishedAt)}</span>}
                  </div>
                </div>
              </Link>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
