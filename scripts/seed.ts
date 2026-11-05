/**
 * VADO seed — creates REAL records: downloads licensed Pexels footage into
 * object storage, inserts users/videos/interactions into PostgreSQL.
 * Idempotent: skips when the platform already has content.
 * Run: npx tsx --env-file=.env scripts/seed.ts
 */
import { db, pool } from "../src/db";
import { users, videos, categories, hashtags, videoHashtags, likes, saves, reposts, comments, follows, notifications, watchEvents, conversations, conversationParticipants, messages, mediaAssets, reports } from "../src/db/schema";
import { eq, sql } from "drizzle-orm";
import { randomBytes, scryptSync, randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";

const STORAGE_DIR = process.env.STORAGE_DIR || path.join(process.cwd(), "storage");

function hash(password: string) {
  const salt = randomBytes(16).toString("hex");
  return `${salt}:${scryptSync(password, salt, 64).toString("hex")}`;
}

async function save(folder: string, ext: string, buf: Buffer) {
  const key = `${folder}/${randomUUID()}.${ext}`;
  const full = path.join(STORAGE_DIR, key);
  await fs.mkdir(path.dirname(full), { recursive: true });
  await fs.writeFile(full, buf);
  return key;
}

async function download(url: string): Promise<Buffer | null> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(90_000) });
    if (!res.ok) return null;
    return Buffer.from(await res.arrayBuffer());
  } catch {
    return null;
  }
}

const CATS = [
  { slug: "urban", name: "Urban & Night", hue: "#287CFF" },
  { slug: "nature", name: "Nature & Ocean", hue: "#38C9FF" },
  { slug: "dance", name: "Dance & Movement", hue: "#8057FF" },
  { slug: "food", name: "Food & Craft", hue: "#FF7A59" },
  { slug: "tech", name: "Tech & Futurism", hue: "#4DE3B4" },
  { slug: "art", name: "Art & Visuals", hue: "#FF5CA8" },
  { slug: "travel", name: "Travel & Places", hue: "#FFC24B" },
  { slug: "lifestyle", name: "Lifestyle", hue: "#9D7BFF" },
];

const AVATARS = [
  "https://images.pexels.com/photos/35725749/pexels-photo-35725749.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=400&w=400",
  "https://images.pexels.com/photos/29615996/pexels-photo-29615996.png?auto=compress&cs=tinysrgb&fit=crop&h=400&w=400",
  "https://images.pexels.com/photos/26975639/pexels-photo-26975639.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=400&w=400",
  "https://images.pexels.com/photos/36271952/pexels-photo-36271952.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=400&w=400",
  "https://images.pexels.com/photos/36586364/pexels-photo-36586364.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=400&w=400",
  "https://images.pexels.com/photos/8727669/pexels-photo-8727669.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=400&w=400",
];

type SeedUser = { email: string; username: string; displayName: string; bio: string; password: string; role?: string; interests?: string[]; avatar?: number };
const USERS: SeedUser[] = [
  { email: "admin@vado.app", username: "vado.team", displayName: "VADO Team", bio: "Keeping VADO safe · official", password: "VadoAdmin#2026", role: "admin" },
  { email: "demo@vado.app", username: "demo", displayName: "Demo Explorer", bio: "Just here for the scroll ✨ (demo account)", password: "vadodemo123", interests: ["urban", "nature"], avatar: 4 },
  { email: "nova@vado.app", username: "nova.frames", displayName: "Nova Reyes", bio: "Night walks & neon rain. Filming the city while it sleeps 🌃", password: "vadocreator123", interests: ["urban", "art"], avatar: 0 },
  { email: "kai@vado.app", username: "kai.motion", displayName: "Kai Motion", bio: "Movement is language 🩰 · studio diaries", password: "vadocreator123", interests: ["dance"], avatar: 1 },
  { email: "marina@vado.app", username: "tide.loops", displayName: "Marina Tide", bio: "The ocean, on loop. Sound on 🌊", password: "vadocreator123", interests: ["nature"], avatar: 2 },
  { email: "lumiere@vado.app", username: "lumiere.kitchen", displayName: "Lumière Kitchen", bio: "Tiny kitchen, big comfort. Recipes in 30 seconds 🍳", password: "vadocreator123", interests: ["food"], avatar: 3 },
  { email: "theo@vado.app", username: "drift.city", displayName: "Theo Drift", bio: "One-way tickets & last trains 🚝", password: "vadocreator123", interests: ["travel", "urban"], avatar: 5 },
  { email: "aria@vado.app", username: "aria.waves", displayName: "Aria Waves", bio: "Salt in the air, drone in the sky", password: "vadocreator123", interests: ["nature", "travel"] },
];

type SeedVideo = { url: string; thumb: string; dur: number; user: string; cat: string; hoursAgo: number; caption: string; sound: string; w?: number; h?: number };
const V = (id: number, file: string, thumbFile: string, dur: number, user: string, cat: string, hoursAgo: number, caption: string, sound: string): SeedVideo => ({
  url: `https://videos.pexels.com/video-files/${id}/${file}`,
  thumb: `https://images.pexels.com/videos/${id}/${thumbFile}?auto=compress&cs=tinysrgb&fit=crop&h=960&w=540`,
  dur, user, cat, hoursAgo, caption, sound,
});

const VIDEOS: SeedVideo[] = [
  V(17243363, "17243363-hd_1080_1920_24fps.mp4", "after-rain-brazil-buildings-cars-17243363.jpeg", 11, "nova.frames", "urban", 5, "Neon rain hits different at 2AM 🌧️ #citynights #neon #rain", "Midnight Drive — lo-fi tape"),
  V(12339462, "12339462-hd_1080_1920_60fps.mp4", "pexels-photo-12339462.jpeg", 11, "tide.loops", "nature", 9, "The ocean writes in cursive 🌊 #ocean #waves #calm", "Original sound — tide.loops"),
  V(5124216, "5124216-hd_1080_1920_25fps.mp4", "pexels-photo-5124216.jpeg", 30, "kai.motion", "dance", 14, "Studio hours: the 6am club 🩰 #ballet #dance #practice", "Clair de Lune — piano rework"),
  V(6288814, "6288814-hd_1080_1920_25fps.mp4", "pexels-photo-6288814.jpeg", 7, "lumiere.kitchen", "food", 20, "Step 1: confidence. Step 2: egg. #cooking #asmr #kitchen", "Original sound — lumiere.kitchen"),
  V(12871514, "12871514-hd_1080_1920_30fps.mp4", "architecture-beautiful-big-city-blinking-12871514.jpeg", 10, "drift.city", "urban", 26, "The skyline never sleeps #skyline #architecture #night", "Glass Towers — synthwave"),
  V(8088335, "8088335-hd_1080_1920_24fps.mp4", "drone-video-mediterranean-sea-8088335.jpeg", 24, "aria.waves", "nature", 33, "Blue on blue on blue #mediterranean #drone #summer", "Aegean — ambient mix"),
  V(6939968, "6939968-hd_1080_1920_30fps.mp4", "pexels-photo-6939968.jpeg", 18, "kai.motion", "dance", 41, "One take. No edits. #contemporary #movement #onetake", "Breath — ambient strings"),
  V(17243368, "17243368-hd_1080_1920_24fps.mp4", "after-rain-brazil-buildings-bus-17243368.jpeg", 7, "nova.frames", "urban", 50, "Rush hour, but make it cinema #traffic #moody #filmlook", "Midnight Drive — lo-fi tape"),
  V(8820114, "8820114-hd_1080_1920_25fps.mp4", "abstract-aerial-footage-aerial-video-aerial-view-8820114.jpeg", 11, "tide.loops", "nature", 62, "Textures you can hear #aerial #ocean #satisfying", "Original sound — tide.loops"),
  V(6286088, "6286088-hd_1080_1920_25fps.mp4", "pexels-photo-6286088.jpeg", 11, "lumiere.kitchen", "food", 75, "Snow day (in my kitchen) #baking #flour #satisfying", "Butter & Dust — kitchen beats"),
  V(13581912, "13581912-hd_1080_1920_24fps.mp4", "beach-waves-big-wave-13581912.jpeg", 13, "aria.waves", "nature", 90, "Shoreline therapy, day 214 #beach #reset #waves", "Aegean — ambient mix"),
  V(12055799, "12055799-hd_1080_1920_60fps.mp4", "pexels-photo-12055799.jpeg", 43, "drift.city", "travel", 110, "POV: last train home #city #pov #latenight", "Last Train — night garage"),
  V(9921064, "9921064-hd_1080_1920_30fps.mp4", "pexels-photo-9921064.jpeg", 15, "nova.frames", "urban", 130, "Umbrella weather supremacy ☔ #rain #cityscape #nightwalk", "Midnight Drive — lo-fi tape"),
  V(7326296, "7326296-hd_1080_1920_25fps.mp4", "pexels-photo-7326296.jpeg", 33, "kai.motion", "art", 150, "Gravity is a suggestion #ballet #art #slowmotion", "Clair de Lune — piano rework"),
];

const COMMENTS = [
  ["nova.frames", "tide.loops", 1, "This is unreal. What time did you shoot this?"],
  ["tide.loops", "nova.frames", 1, "Around 2am — the rain did all the work 🌧️"],
  ["kai.motion", "nova.frames", 1, "The reflections?? Cinema."],
  ["demo", "nova.frames", 1, "Okay this is my new wallpaper"],
  ["aria.waves", "tide.loops", 2, "I can HEAR this video"],
  ["demo", "tide.loops", 2, "Instant calm. Saving this one."],
  ["nova.frames", "kai.motion", 3, "The control!! Teach me 🩰"],
  ["lumiere.kitchen", "kai.motion", 3, "6am club respect"],
  ["kai.motion", "lumiere.kitchen", 4, "The confidence is the recipe honestly"],
  ["demo", "lumiere.kitchen", 4, "Me watching this at 1am hungry"],
  ["nova.frames", "drift.city", 5, "Those window lights are hypnotic"],
  ["tide.loops", "aria.waves", 6, "That blue doesn't look real 💙"],
  ["aria.waves", "tide.loops", 6, "Mediterranean summer is a personality trait"],
  ["demo", "kai.motion", 7, "ONE TAKE?! Insane"],
  ["drift.city", "nova.frames", 8, "This is the mood for the whole week"],
  ["lumiere.kitchen", "tide.loops", 9, "Oddly satisfying level: maximum"],
  ["kai.motion", "lumiere.kitchen", 10, "The flour drop in slow-mo 🤌"],
  ["demo", "aria.waves", 11, "Day 214 of therapy and it's working"],
  ["nova.frames", "drift.city", 12, "Last train hits different with this sound"],
  ["tide.loops", "nova.frames", 13, "Umbrella gang ☔"],
  ["aria.waves", "kai.motion", 14, "Gravity who? Stunning."],
] as const;

async function main() {
  const existing = await db.select({ n: sql<number>`COUNT(*)::int` }).from(videos);
  if ((existing[0]?.n ?? 0) > 0) {
    console.log("Seed skipped — platform already has content.");
    await pool.end();
    return;
  }
  console.log("Seeding categories…");
  for (const c of CATS) await db.insert(categories).values(c).onConflictDoNothing();
  const catRows = await db.select().from(categories);
  const catId = new Map(catRows.map((c) => [c.slug, c.id]));

  console.log("Seeding users…");
  const userIds = new Map<string, string>();
  let ai = 0;
  for (const u of USERS) {
    let avatarKey: string | null = null;
    if (u.avatar !== undefined) {
      const buf = await download(AVATARS[u.avatar]);
      if (buf) avatarKey = await save("avatars", "jpg", buf);
      ai++;
    }
    const [row] = await db.insert(users).values({
      email: u.email, username: u.username, displayName: u.displayName, bio: u.bio,
      passwordHash: hash(u.password), role: u.role ?? "user", emailVerified: true,
      interests: u.interests ?? [], avatarUrl: avatarKey,
      createdAt: new Date(Date.now() - (20 - ai) * 86400_000),
    }).returning();
    userIds.set(u.username, row.id);
    if (avatarKey) await db.insert(mediaAssets).values({ key: avatarKey, userId: row.id, kind: "image" });
  }

  console.log("Downloading footage & seeding videos…");
  const videoIds: string[] = [];
  const videoOwners: string[] = [];
  for (const sv of VIDEOS) {
    let buf = await download(sv.url);
    if (!buf) {
      console.log(`  primary failed for ${sv.url}, trying fallback…`);
      buf = await download(sv.url.replace(/hd_\d+_\d+/, "sd_540_960"));
    }
    if (!buf) { console.log(`  SKIP ${sv.url}`); continue; }
    const key = await save("videos", "mp4", buf);
    let thumbKey: string | null = null;
    const tbuf = await download(sv.thumb);
    if (tbuf) thumbKey = await save("thumbnails", "jpg", tbuf);
    const uid = userIds.get(sv.user)!;
    const [row] = await db.insert(videos).values({
      userId: uid, caption: sv.caption, videoKey: key, thumbnailKey: thumbKey,
      durationMs: sv.dur * 1000, width: 1080, height: 1920, sizeBytes: buf.length,
      soundTitle: sv.sound, categoryId: catId.get(sv.cat) ?? null,
      createdAt: new Date(Date.now() - sv.hoursAgo * 3600_000),
      updatedAt: new Date(Date.now() - sv.hoursAgo * 3600_000),
    }).returning();
    videoIds.push(row.id);
    videoOwners.push(uid);
    await db.insert(mediaAssets).values({ key, userId: uid, kind: "video", bytes: buf.length, videoId: row.id });
    if (thumbKey) await db.insert(mediaAssets).values({ key: thumbKey, userId: uid, kind: "cover", videoId: row.id });
    const tags = [...new Set((sv.caption.match(/#([\p{L}\p{N}_]+)/gu) || []).map((t) => t.slice(1).toLowerCase()))];
    for (const name of tags) {
      await db.insert(hashtags).values({ name }).onConflictDoNothing();
      const [h] = await db.select().from(hashtags).where(eq(hashtags.name, name)).limit(1);
      await db.insert(videoHashtags).values({ videoId: row.id, hashtagId: h.id }).onConflictDoNothing();
    }
    console.log(`  ✓ ${sv.user}: ${sv.caption.slice(0, 40)}… (${(buf.length / 1048576).toFixed(1)} MB)`);
  }

  console.log("Seeding social graph…");
  const followPairs: [string, string][] = [
    ["demo", "nova.frames"], ["demo", "kai.motion"], ["demo", "tide.loops"],
    ["nova.frames", "drift.city"], ["nova.frames", "kai.motion"], ["kai.motion", "nova.frames"],
    ["tide.loops", "aria.waves"], ["aria.waves", "tide.loops"], ["lumiere.kitchen", "kai.motion"],
    ["drift.city", "nova.frames"], ["demo", "lumiere.kitchen"], ["aria.waves", "nova.frames"],
    ["lumiere.kitchen", "tide.loops"], ["drift.city", "aria.waves"], ["kai.motion", "tide.loops"],
  ];
  for (const [a, b] of followPairs) {
    await db.insert(follows).values({ followerId: userIds.get(a)!, followeeId: userIds.get(b)! }).onConflictDoNothing();
    if (a !== b) await db.insert(notifications).values({ userId: userIds.get(b)!, actorId: userIds.get(a)!, kind: "follow", createdAt: new Date(Date.now() - Math.random() * 40 * 3600_000) });
  }

  const creators = ["nova.frames", "kai.motion", "tide.loops", "lumiere.kitchen", "drift.city", "aria.waves", "demo"];
  let vi = 0;
  for (const vid of videoIds) {
    const owner = videoOwners[vi];
    const likers = creators.filter((c) => userIds.get(c) !== owner && (vi + c.length) % 3 !== 0);
    for (const c of likers) {
      await db.insert(likes).values({ userId: userIds.get(c)!, videoId: vid }).onConflictDoNothing();
      await db.insert(notifications).values({ userId: owner, actorId: userIds.get(c)!, kind: "like", videoId: vid, createdAt: new Date(Date.now() - Math.random() * 30 * 3600_000) });
    }
    const viewBase = 14 + ((vi * 37) % 55);
    await db.update(videos).set({ viewCount: viewBase, shareCount: (vi * 7) % 9 }).where(eq(videos.id, vid));
    for (let k = 0; k < viewBase; k++) {
      const watcher = k % 3 === 0 ? null : userIds.get(creators[k % creators.length])!;
      await db.insert(watchEvents).values({
        userId: watcher, videoId: vid,
        watchedMs: 2000 + ((k * 971) % 9000), durationMs: VIDEOS[vi]?.dur ? VIDEOS[vi].dur * 1000 : 10000,
        completed: k % 4 === 0,
        createdAt: new Date(Date.now() - Math.random() * 48 * 3600_000),
      });
    }
    vi++;
  }

  console.log("Seeding comments & saves…");
  for (const [author, target, idx, body] of COMMENTS) {
    const vid = videoIds[idx - 1];
    if (!vid) continue;
    const [c] = await db.insert(comments).values({
      videoId: vid, userId: userIds.get(author)!, body,
      createdAt: new Date(Date.now() - Math.random() * 24 * 3600_000),
    }).returning();
    const owner = videoOwners[idx - 1];
    if (owner !== userIds.get(author)) {
      await db.insert(notifications).values({ userId: owner, actorId: userIds.get(author)!, kind: "comment", videoId: vid, commentId: c.id, body: body.slice(0, 140) });
    }
  }
  // A threaded reply
  if (videoIds[0]) {
    const root = await db.select().from(comments).where(eq(comments.videoId, videoIds[0])).limit(1);
    if (root[0]) {
      await db.insert(comments).values({ videoId: videoIds[0], userId: userIds.get("demo")!, parentId: root[0].id, body: "Seconding this — the grade is gorgeous" });
    }
  }
  const savePairs: [string, number][] = [["demo", 2], ["demo", 3], ["nova.frames", 6], ["kai.motion", 11], ["tide.loops", 1], ["lumiere.kitchen", 9]];
  for (const [u, idx] of savePairs) {
    if (videoIds[idx - 1]) await db.insert(saves).values({ userId: userIds.get(u)!, videoId: videoIds[idx - 1] }).onConflictDoNothing();
  }
  if (videoIds[1]) await db.insert(reposts).values({ userId: userIds.get("kai.motion")!, videoId: videoIds[1] }).onConflictDoNothing();
  if (videoIds[0]) await db.insert(reposts).values({ userId: userIds.get("demo")!, videoId: videoIds[0] }).onConflictDoNothing();

  console.log("Seeding conversations…");
  const [convo] = await db.insert(conversations).values({ isGroup: false }).returning();
  await db.insert(conversationParticipants).values([
    { conversationId: convo.id, userId: userIds.get("demo")! },
    { conversationId: convo.id, userId: userIds.get("nova.frames")! },
  ]);
  const dm: [string, string, number][] = [
    ["nova.frames", "Hey! Saw you saved the neon rain clip 🌧️", 26],
    ["demo", "It's unreal. What do you shoot on?", 25],
    ["nova.frames", "Just my phone + a lot of puddles honestly", 24],
    ["nova.frames", "New drop tonight — first one gets the behind the scenes 👀", 3],
  ];
  for (const [u, body, h] of dm) {
    await db.insert(messages).values({ conversationId: convo.id, senderId: userIds.get(u)!, body, createdAt: new Date(Date.now() - h * 3600_000) });
  }
  await db.insert(notifications).values({ userId: userIds.get("demo")!, actorId: userIds.get("nova.frames")!, kind: "message", conversationId: convo.id, body: "New drop tonight — first one gets the behind the scenes 👀", createdAt: new Date(Date.now() - 3 * 3600_000) });

  // One open report so moderators have a real queue item.
  if (videoIds[11]) {
    await db.insert(reports).values({
      reporterId: userIds.get("aria.waves")!, targetType: "video", targetId: videoIds[11],
      reason: "Misleading information", details: "Caption claims this is a real last train — pretty sure it's staged.",
    });
  }

  console.log(`\nSeed complete: ${userIds.size} users, ${videoIds.length} videos, real interactions.`);
  console.log("Accounts → admin@vado.app / VadoAdmin#2026 · demo@vado.app / vadodemo123");
  await pool.end();
}

main().catch(async (e) => {
  console.error(e);
  await pool.end();
  process.exit(1);
});
