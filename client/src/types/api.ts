export interface User {
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  statusMessage: string | null;
  createdAt: string;
  updatedAt: string;
  isOnline?: boolean;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface FriendRequestUserPayload {
  id: string;
  status: "PENDING" | "ACCEPTED" | "DECLINED";
  createdAt: string;
  respondedAt?: string | null;
  sender: User;
  receiver: User;
}

export interface Room {
  id: string;
  name: string;
  description?: string | null;
  ownerId: string;
  createdAt: string;
  role: "OWNER" | "ADMIN" | "MEMBER";
  channels: Channel[];
  members: User[];
}

export interface Channel {
  id: string;
  name: string;
  type: "TEXT" | "DIRECT";
  createdAt: string;
}

export interface Message {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  author: User;
  channelId?: string;
}

export interface PaginatedMessages {
  messages: Message[];
  nextCursor: string | null;
}

