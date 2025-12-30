export type User = {
  id: string;
  name: string | null;
  email: string | null;
  emailVerified: Date | null;
  image: string | null;
  createdAt: Date;
};

export type Account = {
  id: string;
  userId: string;
  type: string;
  provider: string;
  providerAccountId: string;
  refresh_token: string | null;
  access_token: string | null;
  expires_at: number | null;
  token_type: string | null;
  scope: string | null;
  id_token: string | null;
  session_state: string | null;
  oauth_token_secret: string | null;
  oauth_token: string | null;
};

export type Session = {
  id: string;
  sessionToken: string;
  userId: string;
  expires: Date;
};

export type VerificationToken = {
  identifier: string;
  token: string;
  expires: Date;
};

export type UserProviderToken = {
  id: string;
  userId: string;
  provider: string;
  refreshTokenEncrypted: string | null;
  accessTokenEncrypted: string | null;
  tokenExpiresAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type ExportJob = {
  id: string;
  snapshotId: string;
  userId: string;
  provider: string;
  status: string;
  attemptCount: number;
  maxAttempts: number;
  nextAttemptAt: Date;
  lastError: string | null;
  result: any | null;
  createdAt: Date;
  updatedAt: Date;
};

export type Group = {
  id: string;
  name: string;
  description: string | null;
  isPublic: boolean;
  createdAt: Date;
};

export type GroupMember = {
  id: string;
  groupId: string;
  userId: string;
  role: string;
  joinedAt: Date;
};

export type InviteLink = {
  id: string;
  groupId: string;
  code: string;
  createdById: string;
  expiresAt: Date | null;
  createdAt: Date;
  oneTimeUse: boolean;
  valid: boolean;
};

export type JoinRequest = {
  id: string;
  groupId: string;
  userId: string;
  message: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
};

export type Post = {
  id: string;
  groupId: string;
  authorId: string;
  spotifyUri: string | null;
  youtubeId: string | null;
  title: string | null;
  caption: string | null;
  highlightStartSeconds: number | null;
  highlightEndSeconds: number | null;
  createdAt: Date;
  updatedAt: Date;
  deleted: boolean;
};

export type ChatMessage = {
  id: string;
  groupId: string;
  authorId: string;
  text: string | null;
  postId: string | null;
  replyToId: string | null;
  spotifyUri: string | null;
  youtubeId: string | null;
  createdAt: Date;
  editedAt: Date | null;
};

export type Reaction = {
  id: string;
  userId: string;
  targetType: string;
  targetId: string;
  reaction: string;
  metadata: any | null;
  createdAt: Date;
};

export type GroupPlaylistItem = {
  id: string;
  groupId: string;
  addedById: string;
  spotifyUri: string | null;
  youtubeId: string | null;
  title: string | null;
  note: string | null;
  position: string | null;
  createdAt: Date;
  updatedAt: Date;
  postId: string | null;
};

export type Snapshot = {
  id: string;
  groupId: string;
  name: string;
  description: string | null;
  createdById: string;
  createdAt: Date;
};

export type SnapshotItem = {
  id: string;
  snapshotId: string;
  postId: string | null;
  spotifyUri: string | null;
  youtubeId: string | null;
  position: number;
  createdAt: Date;
};

export type TrackMetadata = {
  id: string;
  spotifyUri: string | null;
  youtubeId: string | null;
  title: string | null;
  artist: string | null;
  durationSec: number | null;
  thumbnailUrl: string | null;
  rawProviders: any | null;
  lastFetchedAt: Date | null;
  createdAt: Date;
};

export type PlayEvent = {
  id: string;
  groupId: string;
  postId: string | null;
  playlistItemId: string | null;
  playedById: string;
  startedAt: Date;
  endedAt: Date | null;
  durationSeconds: number | null;
  createdAt: Date;
};
