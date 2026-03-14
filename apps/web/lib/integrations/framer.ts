export interface FramerCMSItem {
  id: string;
  slug: string;
  title: string;
  excerpt?: string;
  content?: string;
  publishedAt?: string;
  author?: string;
  coverImage?: string;
  tags?: string[];
}

export async function fetchFramerPosts(
  apiKey?: string,
  projectId?: string
): Promise<FramerCMSItem[]> {
  const key = apiKey ?? process.env.FRAMER_API_KEY;
  const pid = projectId ?? process.env.FRAMER_PROJECT_ID;

  if (!key || !pid) {
    // Return empty array if not configured
    return [];
  }

  try {
    const response = await fetch(
      `https://api.framer.com/projects/${pid}/collections/blog/items`,
      {
        headers: {
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
        },
        next: { revalidate: 3600 },
      }
    );

    if (!response.ok) {
      console.warn("Framer CMS fetch failed:", response.status);
      return [];
    }

    const data = await response.json();
    return (data.items ?? []) as FramerCMSItem[];
  } catch (error) {
    console.warn("Framer CMS error:", error);
    return [];
  }
}

export async function fetchFramerPost(
  slug: string,
  apiKey?: string,
  projectId?: string
): Promise<FramerCMSItem | null> {
  const posts = await fetchFramerPosts(apiKey, projectId);
  return posts.find((p) => p.slug === slug) ?? null;
}
