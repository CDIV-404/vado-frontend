"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Play, Lock } from "lucide-react";
import { Avatar } from "@/components/ui";
import { formatCount, formatDuration, avatarGradient } from "@/lib/format";
import type { VideoDTO } from "@/lib/types";

export function VideoGrid({ videos, showAuthor = true }: { videos: VideoDTO[]; showAuthor?: boolean }) {
  const [hover, setHover] = useState<string | null>(null);
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
      {videos.map((v, i) => (
        <motion.div
          key={v.id}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: Math.min(i * 0.04, 0.4) }}
        >
          <Link
            href={`/video/${v.id}`}
            className="group block relative aspect-[9/14] rounded-2xl overflow-hidden border border-white/10 bg-vado-bg2"
            onMouseEnter={() => setHover(v.id)}
            onMouseLeave={() => setHover((h) => (h === v.id ? null : h))}
          >
            {v.thumbnailUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={v.thumbnailUrl}
                alt={v.caption || "video cover"}
                className={`absolute inset-0 w-full h-full object-cover transition duration-300 group-hover:scale-105 ${hover === v.id ? "opacity-0" : "opacity-100"}`}
                loading="lazy"
              />
            ) : (
              <div className="absolute inset-0" style={{ background: avatarGradient(v.id) }} />
            )}
            {hover === v.id && (
              <video
                src={v.videoUrl}
                muted
                autoPlay
                loop
                playsInline
                className="absolute inset-0 w-full h-full object-cover"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-black/10" />
            {v.visibility !== "public" && (
              <span className="absolute top-2 right-2 glass-deep rounded-full p-1.5">
                <Lock size={11} className="text-vado-warn" />
              </span>
            )}
            <span className="absolute top-2 left-2 glass-deep rounded-full px-2 py-0.5 text-[10px] font-bold flex items-center gap-1">
              <Play size={9} fill="white" /> {formatCount(v.counts.views)}
            </span>
            {v.durationMs > 0 && (
              <span className="absolute bottom-2 right-2 glass-deep rounded-md px-1.5 py-0.5 text-[10px] font-semibold">
                {formatDuration(v.durationMs)}
              </span>
            )}
            <div className="absolute bottom-2 left-2.5 right-12">
              <p className="text-[11px] font-semibold text-white truncate">{v.caption || "Untitled"}</p>
              {showAuthor && (
                <span className="flex items-center gap-1.5 mt-1">
                  <Avatar src={v.author.avatarUrl} name={v.author.displayName} size={14} />
                  <span className="text-[10px] text-white/70 truncate">@{v.author.username}</span>
                </span>
              )}
            </div>
          </Link>
        </motion.div>
      ))}
    </div>
  );
}
