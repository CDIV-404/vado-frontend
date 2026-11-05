/* Shared client/server DTO types (no runtime imports). */

export type Author = { id: string; username: string; displayName: string; avatarUrl: string | null };

export type VideoDTO = {
  id: string;
  caption: string;
  hashtags: string[];
  videoUrl: string;
  thumbnailUrl: string | null;
  durationMs: number;
  width: number;
  height: number;
  visibility: string;
  status: string;
  soundTitle: string;
  category: { slug: string; name: string } | null;
  counts: { likes: number; comments: number; saves: number; reposts: number; shares: number; views: number };
  viewer: { liked: boolean; saved: boolean; reposted: boolean; followingAuthor: boolean };
  author: Author;
  createdAt: string;
};

export type MeUser = {
  id: string;
  username: string;
  displayName: string;
  bio: string;
  avatarUrl: string | null;
  role: string;
  email: string;
  emailVerified: boolean;
  interests: string[];
  likedVideosPublic: boolean;
  desktopNotifications: boolean;
  createdAt: string;
};

export type CommentDTO = {
  id: string;
  body: string;
  createdAt: string;
  parentId: string | null;
  canDelete: boolean;
  user: Author;
  replies: CommentDTO[];
};

export type ProfileDTO = {
  id: string;
  username: string;
  displayName: string;
  bio: string;
  avatarUrl: string | null;
  likedVideosPublic: boolean;
  createdAt: string;
  counts: { followers: number; following: number; videos: number; likesReceived: number };
  viewer: { isSelf: boolean; following: boolean; followsYou: boolean; blocked: boolean };
};

export type NotificationDTO = {
  id: string;
  kind: string;
  body: string;
  read: boolean;
  createdAt: string;
  videoId: string | null;
  videoThumb: string | null;
  conversationId: string | null;
  actor: { username: string; displayName: string; avatarUrl: string | null } | null;
};

export type ConversationDTO = {
  id: string;
  isGroup: boolean;
  title: string;
  lastMessageAt: string;
  lastBody: string;
  lastSenderIsMe: boolean;
  unread: number;
  seenThrough: string;
  members: Author[];
};

export type MessageDTO = {
  id: string;
  body: string;
  senderId: string;
  mine: boolean;
  createdAt: string;
  video: { id: string; caption: string; thumbnailUrl: string | null } | null;
};

export type DraftDTO = {
  id: string;
  caption: string;
  videoUrl: string;
  thumbnailUrl: string | null;
  durationMs: number;
  visibility: string;
  soundTitle: string;
  updatedAt: string;
};

export type SearchUser = Author & { bio: string; followers: number; viewerFollowing: boolean };
export type SearchTag = { name: string; uses: number; sampleVideoId: string | null };
export type SearchSound = { title: string; uses: number; sampleVideoId: string };