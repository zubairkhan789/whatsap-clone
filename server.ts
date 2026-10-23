import express from 'express';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server, path: '/api/ws' });

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Database initialization & persistence
const DB_FILE = path.resolve(__dirname, 'server-data.json');

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
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
  mutedBy: Record<string, string>; // userId -> muteUntil ISO string or 'forever'
  archivedBy: string[];
  deletedFor: string[];
  createdAt: string;
  updatedAt: string;
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
  reactions: Record<string, string[]>; // emoji -> array of userIds
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
  duration: number; // in seconds
  timestamp: string;
}

interface Database {
  users: User[];
  chats: Chat[];
  messages: Message[];
  statuses: StatusUpdate[];
  callLogs: CallLog[];
}

// Initial demo seed data
const getInitialData = (): Database => {
  const now = new Date();
  const isoNow = now.toISOString();
  const fiveMinAgo = new Date(now.getTime() - 5 * 60000).toISOString();
  const oneHourAgo = new Date(now.getTime() - 60 * 60000).toISOString();
  const yesterday = new Date(now.getTime() - 24 * 3600000).toISOString();
  const tomorrow = new Date(now.getTime() + 24 * 3600000).toISOString();

  return {
    users: [
      {
        id: 'user_default',
        name: 'You (Alex)',
        email: 'alex@whatsapp.io',
        password: 'password123',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        about: 'Available | Building awesome apps ✨',
        phone: '+1 (555) 019-2834',
        isOnline: true,
        lastSeen: isoNow,
        privacy: {
          lastSeen: 'everyone',
          online: 'everyone',
          readReceipts: true,
          profilePhoto: 'everyone',
        },
        blockedUserIds: [],
      },
      {
        id: 'user_sarah',
        name: 'Sarah Connor',
        email: 'sarah@whatsapp.io',
        password: 'password123',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
        about: 'Design is intelligence made visible 🎨',
        phone: '+1 (555) 014-9921',
        isOnline: true,
        lastSeen: isoNow,
        privacy: {
          lastSeen: 'everyone',
          online: 'everyone',
          readReceipts: true,
          profilePhoto: 'everyone',
        },
        blockedUserIds: [],
      },
      {
        id: 'user_david',
        name: 'David Miller',
        email: 'david@whatsapp.io',
        password: 'password123',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
        about: 'In a meeting ☕ | Product Manager',
        phone: '+1 (555) 018-7732',
        isOnline: false,
        lastSeen: fiveMinAgo,
        privacy: {
          lastSeen: 'everyone',
          online: 'everyone',
          readReceipts: true,
          profilePhoto: 'everyone',
        },
        blockedUserIds: [],
      },
      {
        id: 'user_elena',
        name: 'Elena Rostova',
        email: 'elena@whatsapp.io',
        password: 'password123',
        avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
        about: 'Traveling the world ✈️ Next stop Tokyo',
        phone: '+1 (555) 012-3456',
        isOnline: true,
        lastSeen: isoNow,
        privacy: {
          lastSeen: 'everyone',
          online: 'everyone',
          readReceipts: true,
          profilePhoto: 'everyone',
        },
        blockedUserIds: [],
      },
      {
        id: 'user_marcus',
        name: 'Marcus Vance',
        email: 'marcus@whatsapp.io',
        password: 'password123',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
        about: 'At work 💻 Full-stack architect',
        phone: '+1 (555) 016-8844',
        isOnline: false,
        lastSeen: oneHourAgo,
        privacy: {
          lastSeen: 'everyone',
          online: 'everyone',
          readReceipts: true,
          profilePhoto: 'everyone',
        },
        blockedUserIds: [],
      },
    ],
    chats: [
      {
        id: 'chat_sarah',
        type: 'direct',
        participants: ['user_default', 'user_sarah'],
        adminIds: ['user_default'],
        pinnedBy: ['user_default'],
        mutedBy: {},
        archivedBy: [],
        deletedFor: [],
        createdAt: yesterday,
        updatedAt: isoNow,
      },
      {
        id: 'chat_group_dev',
        type: 'group',
        name: 'Engineering Team ⚡',
        avatar: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=150&auto=format&fit=crop&q=80',
        description: 'WhatsApp Web architecture, deployment syncs, and releases.',
        participants: ['user_default', 'user_sarah', 'user_david', 'user_marcus'],
        adminIds: ['user_default'],
        pinnedBy: [],
        mutedBy: {},
        archivedBy: [],
        deletedFor: [],
        createdAt: yesterday,
        updatedAt: fiveMinAgo,
      },
      {
        id: 'chat_david',
        type: 'direct',
        participants: ['user_default', 'user_david'],
        adminIds: ['user_default'],
        pinnedBy: [],
        mutedBy: {},
        archivedBy: [],
        deletedFor: [],
        createdAt: yesterday,
        updatedAt: oneHourAgo,
      },
      {
        id: 'chat_elena',
        type: 'direct',
        participants: ['user_default', 'user_elena'],
        adminIds: ['user_default'],
        pinnedBy: [],
        mutedBy: {},
        archivedBy: [],
        deletedFor: [],
        createdAt: yesterday,
        updatedAt: yesterday,
      },
    ],
    messages: [
      {
        id: 'msg_1',
        chatId: 'chat_sarah',
        senderId: 'user_sarah',
        senderName: 'Sarah Connor',
        senderAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
        type: 'text',
        content: 'Hey Alex! Just finalized the high-fidelity UI design for the WhatsApp Web clone. What do you think?',
        reactions: { '❤️': ['user_default'] },
        status: 'read',
        readBy: ['user_default'],
        deliveredTo: ['user_default'],
        createdAt: new Date(now.getTime() - 25 * 60000).toISOString(),
      },
      {
        id: 'msg_2',
        chatId: 'chat_sarah',
        senderId: 'user_sarah',
        senderName: 'Sarah Connor',
        senderAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
        type: 'image',
        content: 'Here is the preview of our clean dark mode palette 🎨',
        fileUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80',
        fileName: 'dark-theme-spec.jpg',
        fileSize: '1.2 MB',
        reactions: { '🔥': ['user_default'] },
        status: 'read',
        readBy: ['user_default'],
        deliveredTo: ['user_default'],
        createdAt: new Date(now.getTime() - 20 * 60000).toISOString(),
      },
      {
        id: 'msg_3',
        chatId: 'chat_sarah',
        senderId: 'user_default',
        senderName: 'You (Alex)',
        senderAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        type: 'text',
        content: 'Looks gorgeous! The contrast and classic WhatsApp emerald accents (#00a884) are spot on.',
        replyTo: {
          id: 'msg_2',
          senderName: 'Sarah Connor',
          content: 'Here is the preview of our clean dark mode palette 🎨',
          type: 'image',
        },
        reactions: { '👍': ['user_sarah'] },
        status: 'read',
        readBy: ['user_sarah'],
        deliveredTo: ['user_sarah'],
        createdAt: new Date(now.getTime() - 15 * 60000).toISOString(),
      },
      {
        id: 'msg_4',
        chatId: 'chat_sarah',
        senderId: 'user_sarah',
        senderName: 'Sarah Connor',
        senderAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
        type: 'text',
        content: 'Ready to test the WebRTC voice and video calls whenever you want! Just hit the call button in the header 📹📞',
        reactions: {},
        status: 'read',
        readBy: ['user_default'],
        deliveredTo: ['user_default'],
        isPinned: true,
        createdAt: new Date(now.getTime() - 2 * 60000).toISOString(),
      },
      {
        id: 'msg_g1',
        chatId: 'chat_group_dev',
        senderId: 'user_david',
        senderName: 'David Miller',
        senderAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
        type: 'text',
        content: 'Team, v1.0 release is scheduled for tomorrow morning. Please ensure all real-time event tests pass.',
        reactions: { '🚀': ['user_default', 'user_sarah', 'user_marcus'] },
        status: 'read',
        readBy: ['user_default'],
        deliveredTo: ['user_default'],
        createdAt: new Date(now.getTime() - 40 * 60000).toISOString(),
      },
      {
        id: 'msg_g2',
        chatId: 'chat_group_dev',
        senderId: 'user_marcus',
        senderName: 'Marcus Vance',
        senderAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
        type: 'text',
        content: 'WebSocket server and WebRTC STUN peer connections are benchmarked at sub-20ms latency.',
        reactions: { '👏': ['user_david'] },
        status: 'read',
        readBy: ['user_default'],
        deliveredTo: ['user_default'],
        createdAt: new Date(now.getTime() - 10 * 60000).toISOString(),
      },
      {
        id: 'msg_d1',
        chatId: 'chat_david',
        senderId: 'user_david',
        senderName: 'David Miller',
        senderAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
        type: 'document',
        content: 'Q4 Product Roadmap & Feature Specs',
        fileName: 'WhatsApp_Roadmap_2026.pdf',
        fileSize: '3.4 MB',
        fileType: 'application/pdf',
        reactions: {},
        status: 'read',
        readBy: ['user_default'],
        deliveredTo: ['user_default'],
        createdAt: oneHourAgo,
      },
      {
        id: 'msg_e1',
        chatId: 'chat_elena',
        senderId: 'user_elena',
        senderName: 'Elena Rostova',
        senderAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
        type: 'text',
        content: 'Sunset in Kyoto is magical! Sharing pictures on my Status tab. Check them out 🌇',
        reactions: { '😍': ['user_default'] },
        status: 'read',
        readBy: ['user_default'],
        deliveredTo: ['user_default'],
        createdAt: yesterday,
      },
    ],
    statuses: [
      {
        id: 'status_sarah_1',
        userId: 'user_sarah',
        userName: 'Sarah Connor',
        userAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
        type: 'text',
        content: '“Design is not just what it looks like and feels like. Design is how it works.” ✨',
        bgColor: '#005c4b',
        font: 'sans-serif',
        createdAt: new Date(now.getTime() - 2 * 3600000).toISOString(),
        expiresAt: tomorrow,
        viewers: [{ userId: 'user_default', viewedAt: isoNow, userName: 'You (Alex)' }],
      },
      {
        id: 'status_elena_1',
        userId: 'user_elena',
        userName: 'Elena Rostova',
        userAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
        type: 'image',
        mediaUrl: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=1200&auto=format&fit=crop&q=80',
        caption: 'Golden hour in Kyoto temple gardens ⛩️🇯🇵',
        createdAt: new Date(now.getTime() - 4 * 3600000).toISOString(),
        expiresAt: tomorrow,
        viewers: [],
      },
    ],
    callLogs: [
      {
        id: 'call_1',
        callerId: 'user_sarah',
        callerName: 'Sarah Connor',
        receiverId: 'user_default',
        receiverName: 'You (Alex)',
        chatId: 'chat_sarah',
        type: 'video',
        status: 'completed',
        duration: 245,
        timestamp: yesterday,
      },
    ],
  };
};

function loadDatabase(): Database {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Error reading database file, resetting to initial seed:', err);
  }
  const initial = getInitialData();
  saveDatabase(initial);
  return initial;
}

function saveDatabase(db: Database) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving database:', err);
  }
}

let db = loadDatabase();

// WebSocket connection registry: userId -> Set of WebSockets (supporting multiple tabs per user)
const userSockets = new Map<string, Set<WebSocket>>();

function sendToUser(userId: string, data: any) {
  const sockets = userSockets.get(userId);
  if (sockets) {
    const payload = JSON.stringify(data);
    for (const ws of sockets) {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(payload);
      }
    }
  }
}

function broadcastToAll(data: any, excludeUserId?: string) {
  const payload = JSON.stringify(data);
  for (const [userId, sockets] of userSockets.entries()) {
    if (excludeUserId && userId === excludeUserId) continue;
    for (const ws of sockets) {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(payload);
      }
    }
  }
}

function broadcastToChat(chatId: string, data: any, excludeUserId?: string) {
  const chat = db.chats.find(c => c.id === chatId);
  if (!chat) return;
  for (const participantId of chat.participants) {
    if (excludeUserId && participantId === excludeUserId) continue;
    sendToUser(participantId, data);
  }
}

wss.on('connection', (ws: WebSocket) => {
  let authenticatedUserId: string | null = null;

  ws.on('message', (messageRaw: string) => {
    try {
      const msg = JSON.parse(messageRaw.toString());
      const { type } = msg;

      switch (type) {
        case 'auth': {
          const { userId } = msg;
          authenticatedUserId = userId;
          if (!userSockets.has(userId)) {
            userSockets.set(userId, new Set());
          }
          userSockets.get(userId)!.add(ws);

          // Mark user as online
          const user = db.users.find(u => u.id === userId);
          if (user) {
            user.isOnline = true;
            user.lastSeen = new Date().toISOString();
            saveDatabase(db);
            broadcastToAll({
              type: 'presence',
              userId,
              isOnline: true,
              lastSeen: user.lastSeen,
            });
          }
          break;
        }

        case 'typing': {
          const { chatId, isTyping } = msg;
          if (authenticatedUserId) {
            broadcastToChat(chatId, {
              type: 'typing',
              chatId,
              userId: authenticatedUserId,
              isTyping,
            }, authenticatedUserId);
          }
          break;
        }

        case 'send_message': {
          const { message } = msg;
          if (message) {
            db.messages.push(message);
            // Update chat's updatedAt
            const chat = db.chats.find(c => c.id === message.chatId);
            if (chat) {
              chat.updatedAt = message.createdAt;
            }
            saveDatabase(db);
            broadcastToChat(message.chatId, {
              type: 'new_message',
              message,
            });
          }
          break;
        }

        case 'edit_message': {
          const { messageId, chatId, newContent } = msg;
          const target = db.messages.find(m => m.id === messageId);
          if (target && target.senderId === authenticatedUserId) {
            target.content = newContent;
            target.isEdited = true;
            saveDatabase(db);
            broadcastToChat(chatId, {
              type: 'message_edited',
              messageId,
              chatId,
              newContent,
            });
          }
          break;
        }

        case 'delete_message': {
          const { messageId, chatId, forEveryone, userId } = msg;
          const target = db.messages.find(m => m.id === messageId);
          if (target) {
            if (forEveryone && target.senderId === authenticatedUserId) {
              target.deletedForEveryone = true;
              target.content = 'This message was deleted';
            } else {
              target.deletedForUsers = target.deletedForUsers || [];
              if (!target.deletedForUsers.includes(userId)) {
                target.deletedForUsers.push(userId);
              }
            }
            saveDatabase(db);
            broadcastToChat(chatId, {
              type: 'message_deleted',
              messageId,
              chatId,
              forEveryone,
              userId,
            });
          }
          break;
        }

        case 'react_message': {
          const { messageId, chatId, emoji, userId } = msg;
          const target = db.messages.find(m => m.id === messageId);
          if (target) {
            target.reactions = target.reactions || {};
            // If user already reacted with this emoji, toggle it off
            if (target.reactions[emoji]?.includes(userId)) {
              target.reactions[emoji] = target.reactions[emoji].filter(id => id !== userId);
              if (target.reactions[emoji].length === 0) {
                delete target.reactions[emoji];
              }
            } else {
              // Remove user from other emoji reactions first
              for (const em of Object.keys(target.reactions)) {
                target.reactions[em] = target.reactions[em].filter(id => id !== userId);
                if (target.reactions[em].length === 0) {
                  delete target.reactions[em];
                }
              }
              // Add reaction
              target.reactions[emoji] = target.reactions[emoji] || [];
              target.reactions[emoji].push(userId);
            }
            saveDatabase(db);
            broadcastToChat(chatId, {
              type: 'message_reaction',
              messageId,
              chatId,
              reactions: target.reactions,
            });
          }
          break;
        }

        case 'read_messages': {
          const { chatId, userId } = msg;
          let changed = false;
          for (const m of db.messages) {
            if (m.chatId === chatId && m.senderId !== userId) {
              m.readBy = m.readBy || [];
              if (!m.readBy.includes(userId)) {
                m.readBy.push(userId);
                m.status = 'read';
                changed = true;
              }
            }
          }
          if (changed) {
            saveDatabase(db);
            broadcastToChat(chatId, {
              type: 'messages_read',
              chatId,
              readerId: userId,
            });
          }
          break;
        }

        case 'pin_message': {
          const { messageId, chatId, isPinned } = msg;
          const target = db.messages.find(m => m.id === messageId);
          if (target) {
            target.isPinned = isPinned;
            saveDatabase(db);
            broadcastToChat(chatId, {
              type: 'message_pinned',
              messageId,
              chatId,
              isPinned,
            });
          }
          break;
        }

        // WebRTC Signaling
        case 'call_offer': {
          const { toUserId, fromUserId, fromUserName, fromUserAvatar, callType, offer, chatId } = msg;
          sendToUser(toUserId, {
            type: 'incoming_call',
            fromUserId,
            fromUserName,
            fromUserAvatar,
            callType,
            offer,
            chatId,
          });
          break;
        }

        case 'call_answer': {
          const { toUserId, fromUserId, answer } = msg;
          sendToUser(toUserId, {
            type: 'call_answered',
            fromUserId,
            answer,
          });
          break;
        }

        case 'call_ice': {
          const { toUserId, fromUserId, candidate } = msg;
          sendToUser(toUserId, {
            type: 'call_ice_candidate',
            fromUserId,
            candidate,
          });
          break;
        }

        case 'call_reject': {
          const { toUserId, fromUserId, reason, chatId, callType } = msg;
          sendToUser(toUserId, {
            type: 'call_rejected',
            fromUserId,
            reason: reason || 'declined',
          });

          // Log missed/declined call
          const caller = db.users.find(u => u.id === toUserId);
          const callee = db.users.find(u => u.id === fromUserId);
          if (caller && callee) {
            const callLog: CallLog = {
              id: `call_${Date.now()}`,
              callerId: toUserId,
              callerName: caller.name,
              receiverId: fromUserId,
              receiverName: callee.name,
              chatId: chatId || '',
              type: callType || 'voice',
              status: reason === 'missed' ? 'missed' : 'declined',
              duration: 0,
              timestamp: new Date().toISOString(),
            };
            db.callLogs.unshift(callLog);
            saveDatabase(db);
          }
          break;
        }

        case 'call_end': {
          const { toUserId, fromUserId, duration, chatId, callType } = msg;
          sendToUser(toUserId, {
            type: 'call_ended',
            fromUserId,
            duration,
          });

          // Log completed call
          const caller = db.users.find(u => u.id === fromUserId);
          const callee = db.users.find(u => u.id === toUserId);
          if (caller && callee) {
            const callLog: CallLog = {
              id: `call_${Date.now()}`,
              callerId: fromUserId,
              callerName: caller.name,
              receiverId: toUserId,
              receiverName: callee.name,
              chatId: chatId || '',
              type: callType || 'voice',
              status: 'completed',
              duration: duration || 0,
              timestamp: new Date().toISOString(),
            };
            db.callLogs.unshift(callLog);
            saveDatabase(db);
          }
          break;
        }
      }
    } catch (err) {
      console.error('Error handling WebSocket message:', err);
    }
  });

  ws.on('close', () => {
    if (authenticatedUserId) {
      const sockets = userSockets.get(authenticatedUserId);
      if (sockets) {
        sockets.delete(ws);
        if (sockets.size === 0) {
          userSockets.delete(authenticatedUserId);
          // Mark user as offline
          const user = db.users.find(u => u.id === authenticatedUserId);
          if (user) {
            user.isOnline = false;
            user.lastSeen = new Date().toISOString();
            saveDatabase(db);
            broadcastToAll({
              type: 'presence',
              userId: authenticatedUserId,
              isOnline: false,
              lastSeen: user.lastSeen,
            });
          }
        }
      }
    }
  });
});

// REST API Endpoints

// 1. Auth routes
app.post('/api/auth/register', (req, res) => {
  const { name, email, password, avatar, about, phone } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email, and password are required' });
  }

  const existing = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    return res.status(400).json({ error: 'An account with this email already exists' });
  }

  const newUser: User = {
    id: `user_${Date.now()}`,
    name,
    email: email.toLowerCase(),
    password,
    avatar: avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`,
    about: about || 'Hey there! I am using WhatsApp.',
    phone: phone || '+1 (555) ' + Math.floor(1000000 + Math.random() * 9000000),
    isOnline: true,
    lastSeen: new Date().toISOString(),
    privacy: {
      lastSeen: 'everyone',
      online: 'everyone',
      readReceipts: true,
      profilePhoto: 'everyone',
    },
    blockedUserIds: [],
  };

  db.users.push(newUser);
  saveDatabase(db);

  const { password: _, ...userSafe } = newUser;
  res.json({ user: userSafe, token: newUser.id });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  const user = db.users.find(
    u => u.email.toLowerCase() === email?.toLowerCase() && u.password === password
  );

  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  user.isOnline = true;
  user.lastSeen = new Date().toISOString();
  saveDatabase(db);

  const { password: _, ...userSafe } = user;
  res.json({ user: userSafe, token: user.id });
});

app.post('/api/auth/reset-password', (req, res) => {
  const { email, newPassword } = req.body;
  const user = db.users.find(u => u.email.toLowerCase() === email?.toLowerCase());
  if (!user) {
    return res.status(404).json({ error: 'No user found with this email' });
  }
  user.password = newPassword;
  saveDatabase(db);
  res.json({ success: true, message: 'Password has been reset successfully' });
});

app.get('/api/auth/me', (req, res) => {
  const userId = req.headers['authorization']?.replace('Bearer ', '');
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  const user = db.users.find(u => u.id === userId);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const { password: _, ...userSafe } = user;
  res.json({ user: userSafe });
});

// 2. Users directory & profile management
app.get('/api/users', (req, res) => {
  const usersSafe = db.users.map(({ password: _, ...u }) => u);
  res.json({ users: usersSafe });
});

app.put('/api/users/profile', (req, res) => {
  const userId = req.headers['authorization']?.replace('Bearer ', '');
  const user = db.users.find(u => u.id === userId);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const { name, avatar, about, phone, privacy } = req.body;
  if (name !== undefined) user.name = name;
  if (avatar !== undefined) user.avatar = avatar;
  if (about !== undefined) user.about = about;
  if (phone !== undefined) user.phone = phone;
  if (privacy !== undefined) user.privacy = { ...user.privacy, ...privacy };

  saveDatabase(db);
  broadcastToAll({ type: 'user_updated', user });

  const { password: _, ...userSafe } = user;
  res.json({ user: userSafe });
});

app.post('/api/users/block', (req, res) => {
  const userId = req.headers['authorization']?.replace('Bearer ', '');
  const { targetUserId, block } = req.body;
  const user = db.users.find(u => u.id === userId);
  if (!user) return res.status(404).json({ error: 'User not found' });

  if (block) {
    if (!user.blockedUserIds.includes(targetUserId)) {
      user.blockedUserIds.push(targetUserId);
    }
  } else {
    user.blockedUserIds = user.blockedUserIds.filter(id => id !== targetUserId);
  }
  saveDatabase(db);
  res.json({ blockedUserIds: user.blockedUserIds });
});

// 3. Chats management
app.get('/api/chats', (req, res) => {
  const userId = req.headers['authorization']?.replace('Bearer ', '');
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  // Return chats where user is participant and not deleted
  const userChats = db.chats.filter(
    c => c.participants.includes(userId) && !c.deletedFor.includes(userId)
  );

  // Attach last message and unread count to each chat
  const enrichedChats = userChats.map(chat => {
    const chatMessages = db.messages
      .filter(m => m.chatId === chat.id && !(m.deletedForUsers || []).includes(userId))
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    const lastMessage = chatMessages[chatMessages.length - 1] || null;
    const unreadCount = chatMessages.filter(
      m => m.senderId !== userId && !(m.readBy || []).includes(userId)
    ).length;

    return {
      ...chat,
      lastMessage,
      unreadCount,
    };
  });

  res.json({ chats: enrichedChats });
});

app.post('/api/chats/create', (req, res) => {
  const userId = req.headers['authorization']?.replace('Bearer ', '');
  const { type, participantIds, name, avatar, description } = req.body;

  if (!participantIds || participantIds.length === 0) {
    return res.status(400).json({ error: 'Participants are required' });
  }

  const allParticipants = Array.from(new Set([userId, ...participantIds]));

  // If direct chat, check if one already exists
  if (type === 'direct' && allParticipants.length === 2) {
    const existing = db.chats.find(
      c =>
        c.type === 'direct' &&
        c.participants.includes(allParticipants[0]) &&
        c.participants.includes(allParticipants[1])
    );
    if (existing) {
      // Un-delete if previously deleted
      existing.deletedFor = existing.deletedFor.filter(id => id !== userId);
      saveDatabase(db);
      return res.json({ chat: existing });
    }
  }

  const newChat: Chat = {
    id: `chat_${Date.now()}`,
    type: type || 'direct',
    name: name || undefined,
    avatar: avatar || (type === 'group' ? 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=150&auto=format&fit=crop&q=80' : undefined),
    description: description || undefined,
    participants: allParticipants,
    adminIds: [userId!],
    pinnedBy: [],
    mutedBy: {},
    archivedBy: [],
    deletedFor: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  db.chats.unshift(newChat);
  saveDatabase(db);

  for (const pId of allParticipants) {
    sendToUser(pId, { type: 'chat_created', chat: newChat });
  }

  res.json({ chat: newChat });
});

app.post('/api/chats/:id/group-members', (req, res) => {
  const userId = req.headers['authorization']?.replace('Bearer ', '');
  const chatId = req.params.id;
  const { action, memberId } = req.body; // action: 'add' | 'remove' | 'make_admin'

  const chat = db.chats.find(c => c.id === chatId);
  if (!chat || chat.type !== 'group') {
    return res.status(404).json({ error: 'Group chat not found' });
  }

  if (!chat.adminIds.includes(userId!)) {
    return res.status(403).json({ error: 'Only admins can manage group members' });
  }

  if (action === 'add' && !chat.participants.includes(memberId)) {
    chat.participants.push(memberId);
  } else if (action === 'remove') {
    chat.participants = chat.participants.filter(id => id !== memberId);
    chat.adminIds = chat.adminIds.filter(id => id !== memberId);
  } else if (action === 'make_admin' && !chat.adminIds.includes(memberId)) {
    chat.adminIds.push(memberId);
  }

  chat.updatedAt = new Date().toISOString();
  saveDatabase(db);
  broadcastToChat(chat.id, { type: 'chat_updated', chat });

  res.json({ chat });
});

app.post('/api/chats/:id/action', (req, res) => {
  const userId = req.headers['authorization']?.replace('Bearer ', '');
  const chatId = req.params.id;
  const { action, value } = req.body; // action: 'pin' | 'mute' | 'archive' | 'delete'

  const chat = db.chats.find(c => c.id === chatId);
  if (!chat) return res.status(404).json({ error: 'Chat not found' });

  if (action === 'pin') {
    if (value) {
      if (!chat.pinnedBy.includes(userId!)) chat.pinnedBy.push(userId!);
    } else {
      chat.pinnedBy = chat.pinnedBy.filter(id => id !== userId);
    }
  } else if (action === 'mute') {
    if (value) {
      chat.mutedBy[userId!] = value; // timestamp or 'forever'
    } else {
      delete chat.mutedBy[userId!];
    }
  } else if (action === 'archive') {
    if (value) {
      if (!chat.archivedBy.includes(userId!)) chat.archivedBy.push(userId!);
    } else {
      chat.archivedBy = chat.archivedBy.filter(id => id !== userId);
    }
  } else if (action === 'delete') {
    if (!chat.deletedFor.includes(userId!)) chat.deletedFor.push(userId!);
  }

  saveDatabase(db);
  res.json({ chat });
});

// 4. Messages
app.get('/api/chats/:id/messages', (req, res) => {
  const userId = req.headers['authorization']?.replace('Bearer ', '');
  const chatId = req.params.id;

  const messages = db.messages
    .filter(m => m.chatId === chatId && !(m.deletedForUsers || []).includes(userId!))
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  res.json({ messages });
});

// 5. Status / Stories
app.get('/api/statuses', (req, res) => {
  const now = new Date().getTime();
  // Filter out expired statuses older than 24 hours
  const activeStatuses = db.statuses.filter(
    s => new Date(s.expiresAt).getTime() > now
  );
  res.json({ statuses: activeStatuses });
});

app.post('/api/statuses/create', (req, res) => {
  const userId = req.headers['authorization']?.replace('Bearer ', '');
  const user = db.users.find(u => u.id === userId);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const { type, content, mediaUrl, caption, bgColor, font } = req.body;
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 24 * 3600000).toISOString();

  const newStatus: StatusUpdate = {
    id: `status_${Date.now()}`,
    userId: user.id,
    userName: user.name,
    userAvatar: user.avatar,
    type: type || 'text',
    content,
    mediaUrl,
    caption,
    bgColor: bgColor || '#005c4b',
    font: font || 'sans-serif',
    createdAt: now.toISOString(),
    expiresAt,
    viewers: [],
  };

  db.statuses.unshift(newStatus);
  saveDatabase(db);
  broadcastToAll({ type: 'status_created', status: newStatus });

  res.json({ status: newStatus });
});

app.post('/api/statuses/:id/view', (req, res) => {
  const userId = req.headers['authorization']?.replace('Bearer ', '');
  const user = db.users.find(u => u.id === userId);
  const status = db.statuses.find(s => s.id === req.params.id);

  if (status && user && !status.viewers.some(v => v.userId === userId)) {
    status.viewers.push({
      userId: user.id,
      userName: user.name,
      viewedAt: new Date().toISOString(),
    });
    saveDatabase(db);
  }

  res.json({ success: true });
});

app.delete('/api/statuses/:id', (req, res) => {
  const userId = req.headers['authorization']?.replace('Bearer ', '');
  const index = db.statuses.findIndex(s => s.id === req.params.id && s.userId === userId);
  if (index !== -1) {
    db.statuses.splice(index, 1);
    saveDatabase(db);
    broadcastToAll({ type: 'status_deleted', statusId: req.params.id });
  }
  res.json({ success: true });
});

// 6. Call logs
app.get('/api/calls', (req, res) => {
  const userId = req.headers['authorization']?.replace('Bearer ', '');
  const userLogs = db.callLogs.filter(
    c => c.callerId === userId || c.receiverId === userId
  );
  res.json({ calls: userLogs });
});

// 7. Reset / Seed demo database
app.post('/api/seed/reset', (req, res) => {
  db = getInitialData();
  saveDatabase(db);
  broadcastToAll({ type: 'system_reset' });
  res.json({ success: true, message: 'Database reset to demo state' });
});

// Vite middleware in dev or static files in production
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  const PORT = 3000;
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`WhatsApp Web server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
