export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  about: string;
  phone: string;
  isOnline: boolean;
  lastSeen: string;
  privacy: {
    lastSeen: 'everyone' | 'contacts' | 'nobody';
    online: 'everyone' | 'nobody';
    readReceipts: boolean;
    profilePhoto: 'everyone' | 'contacts' | 'nobody';
  };
  blockedUserIds: string[];
}

export interface Chat {
  id: string;
  type: 'direct' | 'group';
  name?: string;
  avatar?: string;
  description?: string;
  participants: string[];
  adminIds: string[];
  pinnedBy: string[];
  mutedBy: Record<string, string>;
  archivedBy: string[];
  deletedFor: string[];
  createdAt: string;
  updatedAt: string;
  lastMessage?: Message | null;
  unreadCount?: number;
}

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  type: 'text' | 'image' | 'audio' | 'video' | 'document';
  content: string;
  fileUrl?: string;
  fileName?: string;
  fileSize?: string;
  fileType?: string;
  duration?: number;
  replyTo?: {
    id: string;
    senderName: string;
    content: string;
    type: string;
  };
  reactions: Record<string, string[]>;
  status: 'sent' | 'delivered' | 'read';
  readBy: string[];
  deliveredTo: string[];
  isPinned?: boolean;
  isEdited?: boolean;
  createdAt: string;
  deletedForEveryone?: boolean;
  deletedForUsers?: string[];
}

export interface StatusUpdate {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  type: 'text' | 'image' | 'video';
  content?: string;
  mediaUrl?: string;
  caption?: string;
  bgColor?: string;
  font?: string;
  createdAt: string;
  expiresAt: string;
  viewers: { userId: string; viewedAt: string; userName?: string }[];
}

export interface CallLog {
  id: string;
  callerId: string;
  callerName: string;
  receiverId: string;
  receiverName: string;
  chatId: string;
  type: 'voice' | 'video';
  status: 'missed' | 'completed' | 'declined';
  duration: number;
  timestamp: string;
}

export interface ActiveCall {
  callId: string;
  chatId: string;
  otherUser: {
    id: string;
    name: string;
    avatar: string;
  };
  type: 'voice' | 'video';
  direction: 'incoming' | 'outgoing';
  status: 'ringing' | 'connected' | 'ended';
  duration: number;
  isMuted: boolean;
  isVideoOff: boolean;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  peerConnection: RTCPeerConnection | null;
  pendingOffer?: any;
}
