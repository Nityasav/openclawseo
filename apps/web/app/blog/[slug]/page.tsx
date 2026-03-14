import { fetchFramerPost, fetchFramerPosts } from "@/lib/integrations/framer";
import { notFound } from "next/navigation";
import { formatDate } from "@/lib/utils";
import Link from "next/link";

export const revalidate = 3600;

export async function generateStaticParams() {
  const posts = await fetchFramerPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

export default async function BlogPostPage({
  params,
}: {
  params: { slug: string };
}) {
  const post = await fetchFramerPost(params.slug);

  if (!post) {
    notFound();
  }

  return (
    <main className="container mx-auto max-w-2xl px-4 py-16">
      <Link href="/blog" className="text-sm text-blue-600 hover:underline">
        ← Back to Blog
      </Link>

      <article className="mt-6">
        <h1 className="text-4xl font-bold leading-tight">{post.title}</h1>

        <div className="mt-4 flex items-center gap-4 text-sm text-gray-400">
          {post.author && <span>By {post.author}</span>}
          {post.publishedAt && <span>{formatDate(post.publishedAt)}</span>}
        </div>

        {post.coverImage && (
          <img
            src={post.coverImage}
            alt={post.title}
            className="my-8 w-full rounded-xl"
          />
        )}

        {post.content ? (
          <div
            className="prose prose-gray max-w-none"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />
        ) : (
          <p className="text-gray-600">Content not available.</p>
        )}
      </article>
    </main>
  );
}
