import { Feed } from "@/components/video/Feed";

export default async function HashtagPage({ params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  return <Feed mode="hashtag" filter={decodeURIComponent(name).toLowerCase()} />;
}
