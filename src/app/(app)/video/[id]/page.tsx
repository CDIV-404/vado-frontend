import Link from "next/link";
import type { Metadata } from "next";
import { VideoOff } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { getVideoById } from "@/lib/videos";
import { Feed } from "@/components/video/Feed";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const viewer = await getCurrentUser();
  const video = await getVideoById(id, viewer?.id ?? null);
  return {
    title: video ? `${video.author.displayName} on VADO — ${video.caption.slice(0, 60) || "Watch"}` : "Video on VADO",
  };
}

export default async function VideoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const viewer = await getCurrentUser();
  const video = await getVideoById(id, viewer?.id ?? null);

  if (!video) {
    return (
      <div className="h-dvh flex items-center justify-center px-6">
        <div className="glass rounded-3xl px-10 py-12 text-center max-w-md">
          <span className="mx-auto w-16 h-16 rounded-2xl glass-soft flex items-center justify-center mb-4">
            <VideoOff size={28} className="text-vado-danger" />
          </span>
          <h1 className="font-bold text-xl mb-2">This video is unavailable</h1>
          <p className="text-sm text-vado-sub mb-6">It may have been removed, made private, or the link is wrong.</p>
          <Link href="/feed" className="btn-primary rounded-xl px-6 py-2.5 text-sm font-bold text-white inline-block">
            Back to the feed
          </Link>
        </div>
      </div>
    );
  }

  return <Feed mode="single" initialVideo={video} />;
}
