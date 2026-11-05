import {
  pgTable,
  uuid,
  text,
  timestamp,
  boolean,
  integer,
  primaryKey,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";

/* ─── Identity ─────────────────────────────────────────────── */

export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    email: text("email").notNull().unique(),
    username: text("username").notNull().unique(),
    passwordHash: text("password_hash").notNull(),
    displayName: text("display_name").notNull(),
    bio: text("bio").notNull().default(""),
    avatarUrl: text("avatar_url"),
    role: text("role").notNull().default("user"), // user | admin
    status: text("status").notNull().default("active"), // active | suspended
    emailVerified: boolean("email_verified").notNull().default(false),
    interests: text("interests").array().notNull().default([]),
    likedVideosPublic: boolean("liked_videos_public").notNull().default(true),
    desktopNotifications: boolean("desktop_notifications").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("users_username_idx").on(t.username)]
);

export const sessions = pgTable(
  "sessions",
  {
    tokenHash: text("token_hash").primaryKey(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    userAgent: text("user_agent").notNull().default(""),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("sessions_user_idx").on(t.userId)]
);

export const authTokens = pgTable(
  "auth_tokens",
  {
    tokenHash: text("token_hash").primaryKey(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    kind: text("kind").notNull(), // verify_email | reset_password
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    usedAt: timestamp("used_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("auth_tokens_user_idx").on(t.userId)]
);

/** Dev mail outbox — when SMTP is not configured, mails are stored here. */
export const emailOutbox = pgTable("email_outbox", {
  id: uuid("id").defaultRandom().primaryKey(),
  toEmail: text("to_email").notNull(),
  subject: text("subject").notNull(),
  body: text("body").notNull(),
  link: text("link").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Object-storage registry — tracks ownership of every uploaded asset. */
export const mediaAssets = pgTable(
  "media_assets",
  {
    key: text("key").primaryKey(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    kind: text("kind").notNull(), // video | image | cover
    bytes: integer("bytes").notNull().default(0),
    videoId: uuid("video_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("media_user_idx").on(t.userId)]
);

/* ─── Content ──────────────────────────────────────────────── */

export const categories = pgTable("categories", {
  id: uuid("id").defaultRandom().primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  hue: text("hue").notNull().default("#287CFF"),
});

export const videos = pgTable(
  "videos",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    caption: text("caption").notNull().default(""),
    videoKey: text("video_key").notNull(),
    thumbnailKey: text("thumbnail_key"),
    durationMs: integer("duration_ms").notNull().default(0),
    width: integer("width").notNull().default(1080),
    height: integer("height").notNull().default(1920),
    sizeBytes: integer("size_bytes").notNull().default(0),
    visibility: text("visibility").notNull().default("public"), // public | followers | private
    status: text("status").notNull().default("published"), // published | draft | removed
    soundTitle: text("sound_title").notNull().default("Original sound"),
    categoryId: uuid("category_id").references(() => categories.id, { onDelete: "set null" }),
    viewCount: integer("view_count").notNull().default(0),
    shareCount: integer("share_count").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("videos_user_idx").on(t.userId),
    index("videos_status_created_idx").on(t.status, t.createdAt),
    index("videos_category_idx").on(t.categoryId),
  ]
);

export const hashtags = pgTable(
  "hashtags",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull().unique(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("hashtags_name_idx").on(t.name)]
);

export const videoHashtags = pgTable(
  "video_hashtags",
  {
    videoId: uuid("video_id").notNull().references(() => videos.id, { onDelete: "cascade" }),
    hashtagId: uuid("hashtag_id").notNull().references(() => hashtags.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.videoId, t.hashtagId] }), index("vh_hashtag_idx").on(t.hashtagId)]
);

/* ─── Social graph & interactions ──────────────────────────── */

export const likes = pgTable(
  "likes",
  {
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    videoId: uuid("video_id").notNull().references(() => videos.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.videoId] }), index("likes_video_idx").on(t.videoId)]
);

export const saves = pgTable(
  "saves",
  {
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    videoId: uuid("video_id").notNull().references(() => videos.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.videoId] }), index("saves_video_idx").on(t.videoId)]
);

export const reposts = pgTable(
  "reposts",
  {
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    videoId: uuid("video_id").notNull().references(() => videos.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.videoId] }), index("reposts_video_idx").on(t.videoId)]
);

export const comments = pgTable(
  "comments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    videoId: uuid("video_id").notNull().references(() => videos.id, { onDelete: "cascade" }),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    parentId: uuid("parent_id"),
    body: text("body").notNull(),
    status: text("status").notNull().default("visible"), // visible | removed
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("comments_video_idx").on(t.videoId), index("comments_parent_idx").on(t.parentId)]
);

export const follows = pgTable(
  "follows",
  {
    followerId: uuid("follower_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    followeeId: uuid("followee_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.followerId, t.followeeId] }), index("follows_followee_idx").on(t.followeeId)]
);

export const blocks = pgTable(
  "blocks",
  {
    blockerId: uuid("blocker_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    blockedId: uuid("blocked_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.blockerId, t.blockedId] })]
);

export const watchEvents = pgTable(
  "watch_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
    videoId: uuid("video_id").notNull().references(() => videos.id, { onDelete: "cascade" }),
    watchedMs: integer("watched_ms").notNull().default(0),
    durationMs: integer("duration_ms").notNull().default(0),
    completed: boolean("completed").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("watch_user_idx").on(t.userId), index("watch_video_idx").on(t.videoId)]
);

/* ─── Notifications ────────────────────────────────────────── */

export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    actorId: uuid("actor_id").references(() => users.id, { onDelete: "cascade" }),
    kind: text("kind").notNull(), // like | comment | reply | follow | mention | message | system
    videoId: uuid("video_id").references(() => videos.id, { onDelete: "cascade" }),
    commentId: uuid("comment_id").references(() => comments.id, { onDelete: "cascade" }),
    conversationId: uuid("conversation_id"),
    body: text("body").notNull().default(""),
    read: boolean("read").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("notif_user_idx").on(t.userId, t.read, t.createdAt)]
);

/* ─── Moderation ───────────────────────────────────────────── */

export const reports = pgTable(
  "reports",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    reporterId: uuid("reporter_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    targetType: text("target_type").notNull(), // video | comment | user
    targetId: uuid("target_id").notNull(),
    reason: text("reason").notNull(),
    details: text("details").notNull().default(""),
    status: text("status").notNull().default("open"), // open | resolved | dismissed
    resolution: text("resolution").notNull().default(""),
    resolvedBy: uuid("resolved_by").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    resolvedAt: timestamp("resolved_at", { withTimezone: true }),
  },
  (t) => [index("reports_status_idx").on(t.status, t.createdAt)]
);

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    adminId: uuid("admin_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    action: text("action").notNull(),
    targetType: text("target_type").notNull().default(""),
    targetId: uuid("target_id"),
    details: text("details").notNull().default(""),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("audit_created_idx").on(t.createdAt)]
);

/* ─── Messaging (Phase 2 core: 1-to-1 + group text) ────────── */

export const conversations = pgTable("conversations", {
  id: uuid("id").defaultRandom().primaryKey(),
  isGroup: boolean("is_group").notNull().default(false),
  title: text("title").notNull().default(""),
  lastMessageAt: timestamp("last_message_at", { withTimezone: true }).notNull().defaultNow(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const conversationParticipants = pgTable(
  "conversation_participants",
  {
    conversationId: uuid("conversation_id").notNull().references(() => conversations.id, { onDelete: "cascade" }),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    lastReadAt: timestamp("last_read_at", { withTimezone: true }).notNull().defaultNow(),
    joinedAt: timestamp("joined_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.conversationId, t.userId] }), index("cp_user_idx").on(t.userId)]
);

export const messages = pgTable(
  "messages",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    conversationId: uuid("conversation_id").notNull().references(() => conversations.id, { onDelete: "cascade" }),
    senderId: uuid("sender_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    body: text("body").notNull().default(""),
    mediaKey: text("media_key"),
    mediaKind: text("media_kind"), // image | video | audio
    videoId: uuid("video_id").references(() => videos.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("messages_convo_idx").on(t.conversationId, t.createdAt)]
);

export type User = typeof users.$inferSelect;
export type Video = typeof videos.$inferSelect;
export type Comment = typeof comments.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
export type Message = typeof messages.$inferSelect;