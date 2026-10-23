import React, { useState } from 'react';
import {
  MessageSquare,
  Users,
  MoreVertical,
  Search,
  Filter,
  Pin,
  VolumeX,
  Archive,
  Trash2,
  Settings,
  LogOut,
  RefreshCw,
  Plus,
  CheckCheck,
  Check,
  Camera,
  Mic,
  FileText,
  UserCheck,
  Sparkles,
} from 'lucide-react';
import { Chat, User, StatusUpdate, Message } from '../types';
import { formatChatListTime } from '../utils/format';

interface SidebarProps {
  currentUser: User;
  allUsers: User[];
  chats: Chat[];
  activeChatId: string | null;
  onSelectChat: (chatId: string) => void;
  onOpenNewChat: () => void;
  onOpenNewGroup: () => void;
  onOpenSettings: () => void;
  onOpenNewStatus: () => void;
  onOpenStatusViewer: (userStatuses: StatusUpdate[]) => void;
  statuses: StatusUpdate[];
  onChatAction: (chatId: string, action: 'pin' | 'mute' | 'archive' | 'delete', value: any) => void;
  onLogout: () => void;
  onSwitchUser: (userId: string) => void;
  onResetDemoData: () => void;
  typingMap: Record<string, string[]>; // chatId -> userIds typing
  isDark: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentUser,
  allUsers,
  chats,
  activeChatId,
  onSelectChat,
  onOpenNewChat,
  onOpenNewGroup,
  onOpenSettings,
  onOpenNewStatus,
  onOpenStatusViewer,
  statuses,
  onChatAction,
  onLogout,
  onSwitchUser,
  onResetDemoData,
  typingMap,
  isDark,
}) => {
  const [search, setSearch] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const [showAccountSwitcher, setShowAccountSwitcher] = useState(false);
  const [filterUnread, setFilterUnread] = useState(false);
  const [viewArchived, setViewArchived] = useState(false);
  const [contextMenuChatId, setContextMenuChatId] = useState<string | null>(null);

  // Group statuses by user
  const now = new Date().getTime();
  const validStatuses = statuses.filter(s => new Date(s.expiresAt).getTime() > now);
  
  // Own statuses
  const myStatuses = validStatuses.filter(s => s.userId === currentUser.id);

  // Contacts statuses
  const contactStatusesMap = new Map<string, StatusUpdate[]>();
  validStatuses
    .filter(s => s.userId !== currentUser.id)
    .forEach(s => {
      const list = contactStatusesMap.get(s.userId) || [];
      list.push(s);
      contactStatusesMap.set(s.userId, list);
    });

  // Filter chats
  const visibleChats = chats.filter(chat => {
    const isArchived = chat.archivedBy.includes(currentUser.id);
    if (viewArchived) return isArchived;
    if (isArchived) return false;

    if (filterUnread && (chat.unreadCount || 0) === 0) return false;

    if (search.trim()) {
      const q = search.toLowerCase();
      if (chat.type === 'group' && chat.name?.toLowerCase().includes(q)) return true;
      if (chat.type === 'direct') {
        const otherUserId = chat.participants.find(p => p !== currentUser.id);
        const otherUser = allUsers.find(u => u.id === otherUserId);
        if (otherUser?.name.toLowerCase().includes(q)) return true;
      }
      if (chat.lastMessage?.content?.toLowerCase().includes(q)) return true;
      return false;
    }

    return true;
  });

  // Sort chats: pinned first, then by last updated/message timestamp
  visibleChats.sort((a, b) => {
    const aPinned = a.pinnedBy.includes(currentUser.id) ? 1 : 0;
    const bPinned = b.pinnedBy.includes(currentUser.id) ? 1 : 0;
    if (aPinned !== bPinned) return bPinned - aPinned;

    const aTime = new Date(a.updatedAt || a.createdAt).getTime();
    const bTime = new Date(b.updatedAt || b.createdAt).getTime();
    return bTime - aTime;
  });

  const getChatDetails = (chat: Chat) => {
    if (chat.type === 'group') {
      return {
        name: chat.name || 'Group Chat',
        avatar: chat.avatar || 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=150&auto=format&fit=crop&q=80',
        isOnline: false,
      };
    }
    const otherUserId = chat.participants.find(p => p !== currentUser.id);
    const otherUser = allUsers.find(u => u.id === otherUserId);
    return {
      name: otherUser?.name || 'WhatsApp Contact',
      avatar: otherUser?.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=user',
      isOnline: otherUser?.isOnline || false,
    };
  };

  const archivedCount = chats.filter(c => c.archivedBy.includes(currentUser.id)).length;

  return (
    <div
      className={`h-full flex flex-col border-r select-none relative ${
        isDark ? 'bg-[#111b21] border-[#222d34] text-gray-200' : 'bg-white border-gray-200 text-gray-800'
      }`}
    >
      {/* Sidebar Header */}
      <div
        className={`h-16 px-4 flex items-center justify-between border-b ${
          isDark ? 'bg-[#202c33] border-[#222d34]' : 'bg-[#f0f2f5] border-gray-200'
        }`}
      >
        {/* User Profile Avatar with Click for Settings */}
        <div className="flex items-center gap-3">
          <div
            onClick={onOpenSettings}
            className="relative cursor-pointer group"
            title="Open Profile Settings"
          >
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              className="w-10 h-10 rounded-full object-cover ring-2 ring-[#00a884] group-hover:opacity-85 transition-opacity"
            />
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-[#25d366] rounded-full border-2 border-[#111b21]" />
          </div>
          <div className="hidden lg:block leading-tight">
            <h3 className="font-semibold text-xs truncate max-w-[110px]">{currentUser.name}</h3>
            <p className="text-[10px] text-gray-400">Online</p>
          </div>
        </div>

        {/* Action Icons */}
        <div className="flex items-center gap-1.5 text-gray-400">
          {/* Quick Account Switcher */}
          <button
            onClick={() => setShowAccountSwitcher(!showAccountSwitcher)}
            className="p-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10 text-[#00a884] transition-colors relative"
            title="Switch User Account"
          >
            <UserCheck size={20} />
          </button>

          {/* New Chat */}
          <button
            onClick={onOpenNewChat}
            className="p-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
            title="New Chat"
          >
            <MessageSquare size={20} />
          </button>

          {/* Three Dots Menu */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
              title="Menu"
            >
              <MoreVertical size={20} />
            </button>

            {showMenu && (
              <div
                className={`absolute right-0 top-12 w-52 rounded-2xl shadow-2xl py-2 z-50 border ${
                  isDark ? 'bg-[#202c33] border-[#313d45] text-gray-200' : 'bg-white border-gray-200 text-gray-800'
                }`}
              >
                <button
                  onClick={() => {
                    onOpenNewGroup();
                    setShowMenu(false);
                  }}
                  className="w-full px-4 py-2.5 text-left text-xs font-medium hover:bg-[#00a884]/15 flex items-center gap-2.5"
                >
                  <Users size={16} className="text-[#00a884]" />
                  <span>New Group</span>
                </button>
                <button
                  onClick={() => {
                    setViewArchived(!viewArchived);
                    setShowMenu(false);
                  }}
                  className="w-full px-4 py-2.5 text-left text-xs font-medium hover:bg-[#00a884]/15 flex items-center gap-2.5"
                >
                  <Archive size={16} className="text-[#00a884]" />
                  <span>{viewArchived ? 'Back to All Chats' : `Archived (${archivedCount})`}</span>
                </button>
                <button
                  onClick={() => {
                    onOpenSettings();
                    setShowMenu(false);
                  }}
                  className="w-full px-4 py-2.5 text-left text-xs font-medium hover:bg-[#00a884]/15 flex items-center gap-2.5"
                >
                  <Settings size={16} className="text-[#00a884]" />
                  <span>Settings</span>
                </button>
                <div className="border-t border-[#313d45] my-1" />
                <button
                  onClick={() => {
                    onResetDemoData();
                    setShowMenu(false);
                  }}
                  className="w-full px-4 py-2.5 text-left text-xs font-medium text-amber-500 hover:bg-amber-500/10 flex items-center gap-2.5"
                >
                  <RefreshCw size={16} />
                  <span>Reset Demo Data</span>
                </button>
                <button
                  onClick={() => {
                    onLogout();
                    setShowMenu(false);
                  }}
                  className="w-full px-4 py-2.5 text-left text-xs font-medium text-red-500 hover:bg-red-500/10 flex items-center gap-2.5"
                >
                  <LogOut size={16} />
                  <span>Log Out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Account Switcher Dropdown */}
      {showAccountSwitcher && (
        <div
          className={`p-3 border-b ${
            isDark ? 'bg-[#182229] border-[#222d34]' : 'bg-emerald-50 border-emerald-200'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-[#00a884] uppercase tracking-wider flex items-center gap-1">
              <Sparkles size={12} />
              <span>Switch Active User</span>
            </span>
            <button
              onClick={() => setShowAccountSwitcher(false)}
              className="text-xs text-gray-400 hover:text-gray-200"
            >
              ✕
            </button>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {allUsers.map(u => (
              <button
                key={u.id}
                onClick={() => {
                  onSwitchUser(u.id);
                  setShowAccountSwitcher(false);
                }}
                className={`p-1.5 rounded-xl border flex items-center gap-2 text-left transition-colors ${
                  u.id === currentUser.id
                    ? 'border-[#00a884] bg-[#00a884]/20'
                    : isDark
                    ? 'border-[#313d45] hover:bg-[#202c33]'
                    : 'border-gray-200 hover:bg-white'
                }`}
              >
                <img src={u.avatar} alt={u.name} className="w-6 h-6 rounded-full object-cover" />
                <span className="text-xs font-medium truncate">{u.name.split(' ')[0]}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* WhatsApp Status Stories Horizontal Bar */}
      <div
        className={`px-3 py-2.5 border-b flex items-center gap-3 overflow-x-auto ${
          isDark ? 'bg-[#111b21] border-[#222d34]' : 'bg-white border-gray-100'
        }`}
      >
        {/* My Status Button */}
        <div
          onClick={() => {
            if (myStatuses.length > 0) {
              onOpenStatusViewer(myStatuses);
            } else {
              onOpenNewStatus();
            }
          }}
          className="flex flex-col items-center gap-1 cursor-pointer flex-shrink-0 group"
          title={myStatuses.length > 0 ? 'View your status' : 'Add status'}
        >
          <div className="relative">
            <img
              src={currentUser.avatar}
              alt="My Status"
              className={`w-12 h-12 rounded-full object-cover p-0.5 ${
                myStatuses.length > 0 ? 'ring-2 ring-[#00a884]' : 'ring-1 ring-gray-400'
              }`}
            />
            <button
              onClick={e => {
                e.stopPropagation();
                onOpenNewStatus();
              }}
              className="absolute -bottom-1 -right-1 w-5 h-5 bg-[#00a884] text-white rounded-full flex items-center justify-center text-xs shadow-md group-hover:scale-110 transition-transform"
              title="Add status update"
            >
              <Plus size={14} />
            </button>
          </div>
          <span className="text-[11px] font-medium truncate max-w-[64px] text-center">My Status</span>
        </div>

        {/* Contacts Statuses */}
        {Array.from(contactStatusesMap.entries()).map(([userId, userStatuses]) => {
          const user = allUsers.find(u => u.id === userId);
          if (!user) return null;
          return (
            <div
              key={userId}
              onClick={() => onOpenStatusViewer(userStatuses)}
              className="flex flex-col items-center gap-1 cursor-pointer flex-shrink-0 group"
              title={`View status by ${user.name}`}
            >
              <div className="w-12 h-12 rounded-full p-0.5 ring-2 ring-[#00a884] group-hover:ring-[#25d366] transition-all">
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-full h-full rounded-full object-cover"
                />
              </div>
              <span className="text-[11px] font-medium truncate max-w-[64px] text-center">
                {user.name.split(' ')[0]}
              </span>
            </div>
          );
        })}
      </div>

      {/* Search Bar & Unread Filter */}
      <div className={`p-2.5 flex items-center gap-2 ${isDark ? 'bg-[#111b21]' : 'bg-white'}`}>
        <div
          className={`flex-1 flex items-center gap-2 px-3 py-2 rounded-xl text-sm ${
            isDark ? 'bg-[#202c33] text-gray-200' : 'bg-[#f0f2f5] text-gray-800'
          }`}
        >
          <Search size={16} className="text-gray-400" />
          <input
            type="text"
            placeholder="Search or start new chat"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="bg-transparent flex-1 outline-none text-xs placeholder-gray-400"
          />
        </div>
        <button
          onClick={() => setFilterUnread(!filterUnread)}
          className={`p-2 rounded-xl transition-colors ${
            filterUnread
              ? 'bg-[#00a884] text-white'
              : isDark
              ? 'bg-[#202c33] text-gray-400 hover:text-gray-200'
              : 'bg-[#f0f2f5] text-gray-500 hover:text-gray-800'
          }`}
          title="Filter Unread Chats"
        >
          <Filter size={16} />
        </button>
      </div>

      {/* Archived Banner (if in archived view) */}
      {viewArchived && (
        <div className={`px-4 py-2 border-b flex items-center justify-between text-xs ${isDark ? 'bg-[#182229] border-[#222d34]' : 'bg-gray-100 border-gray-200'}`}>
          <span className="font-semibold flex items-center gap-2">
            <Archive size={14} className="text-[#00a884]" />
            <span>Archived Chats</span>
          </span>
          <button
            onClick={() => setViewArchived(false)}
            className="text-[#00a884] font-medium hover:underline"
          >
            Show All
          </button>
        </div>
      )}

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto divide-y divide-black/5 dark:divide-white/5">
        {visibleChats.map(chat => {
          const { name, avatar, isOnline } = getChatDetails(chat);
          const isSelected = chat.id === activeChatId;
          const isPinned = chat.pinnedBy.includes(currentUser.id);
          const isMuted = !!chat.mutedBy[currentUser.id];
          const isArchived = chat.archivedBy.includes(currentUser.id);
          const typingUsers = typingMap[chat.id] || [];
          const isTyping = typingUsers.length > 0;

          const lastMsg = chat.lastMessage;
          const isLastMsgFromMe = lastMsg?.senderId === currentUser.id;

          return (
            <div
              key={chat.id}
              onClick={() => onSelectChat(chat.id)}
              onContextMenu={e => {
                e.preventDefault();
                setContextMenuChatId(contextMenuChatId === chat.id ? null : chat.id);
              }}
              className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors relative group ${
                isSelected
                  ? isDark
                    ? 'bg-[#2a3942]'
                    : 'bg-[#f0f2f5]'
                  : isDark
                  ? 'hover:bg-[#202c33]'
                  : 'hover:bg-gray-50'
              }`}
            >
              {/* Avatar */}
              <div className="relative flex-shrink-0">
                <img src={avatar} alt={name} className="w-12 h-12 rounded-full object-cover" />
                {chat.type === 'direct' && isOnline && (
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-[#25d366] rounded-full border-2 border-[#111b21]" />
                )}
              </div>

              {/* Chat Text Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-semibold text-sm truncate leading-none">{name}</h4>
                  <span
                    className={`text-[11px] ${
                      (chat.unreadCount || 0) > 0 ? 'text-[#25d366] font-semibold' : 'text-gray-400'
                    }`}
                  >
                    {lastMsg ? formatChatListTime(lastMsg.createdAt) : ''}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-xs text-gray-400 truncate flex items-center gap-1 max-w-[190px]">
                    {isTyping ? (
                      <span className="text-[#25d366] font-medium flex items-center gap-1">
                        typing...
                      </span>
                    ) : lastMsg ? (
                      <>
                        {isLastMsgFromMe && (
                          lastMsg.status === 'read' ? (
                            <CheckCheck size={14} className="text-[#53bdeb] flex-shrink-0" />
                          ) : lastMsg.status === 'delivered' ? (
                            <CheckCheck size={14} className="text-gray-400 flex-shrink-0" />
                          ) : (
                            <Check size={14} className="text-gray-400 flex-shrink-0" />
                          )
                        )}
                        {lastMsg.type === 'image' && <Camera size={13} className="flex-shrink-0" />}
                        {lastMsg.type === 'audio' && <Mic size={13} className="flex-shrink-0" />}
                        {lastMsg.type === 'document' && <FileText size={13} className="flex-shrink-0" />}
                        <span className="truncate">{lastMsg.content}</span>
                      </>
                    ) : (
                      <span className="italic text-gray-400">No messages yet</span>
                    )}
                  </div>

                  {/* Badges / Pin / Mute indicators */}
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {isMuted && <VolumeX size={14} className="text-gray-400" />}
                    {isPinned && <Pin size={14} className="text-gray-400 fill-gray-400 rotate-45" />}
                    {(chat.unreadCount || 0) > 0 && (
                      <span className="w-5 h-5 rounded-full bg-[#25d366] text-black text-[11px] font-bold flex items-center justify-center">
                        {chat.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Context menu toggle on hover */}
              <button
                onClick={e => {
                  e.stopPropagation();
                  setContextMenuChatId(contextMenuChatId === chat.id ? null : chat.id);
                }}
                className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-white transition-opacity"
              >
                <MoreVertical size={14} />
              </button>

              {/* Chat Actions Context Menu */}
              {contextMenuChatId === chat.id && (
                <div
                  onClick={e => e.stopPropagation()}
                  className={`absolute right-4 top-10 w-44 rounded-xl shadow-2xl py-1.5 z-40 border ${
                    isDark ? 'bg-[#202c33] border-[#313d45] text-gray-200' : 'bg-white border-gray-200 text-gray-800'
                  }`}
                >
                  <button
                    onClick={() => {
                      onChatAction(chat.id, 'pin', !isPinned);
                      setContextMenuChatId(null);
                    }}
                    className="w-full px-3 py-2 text-left text-xs hover:bg-[#00a884]/15 flex items-center gap-2"
                  >
                    <Pin size={14} />
                    <span>{isPinned ? 'Unpin chat' : 'Pin chat'}</span>
                  </button>
                  <button
                    onClick={() => {
                      onChatAction(chat.id, 'mute', isMuted ? null : 'forever');
                      setContextMenuChatId(null);
                    }}
                    className="w-full px-3 py-2 text-left text-xs hover:bg-[#00a884]/15 flex items-center gap-2"
                  >
                    <VolumeX size={14} />
                    <span>{isMuted ? 'Unmute chat' : 'Mute notifications'}</span>
                  </button>
                  <button
                    onClick={() => {
                      onChatAction(chat.id, 'archive', !isArchived);
                      setContextMenuChatId(null);
                    }}
                    className="w-full px-3 py-2 text-left text-xs hover:bg-[#00a884]/15 flex items-center gap-2"
                  >
                    <Archive size={14} />
                    <span>{isArchived ? 'Unarchive chat' : 'Archive chat'}</span>
                  </button>
                  <button
                    onClick={() => {
                      onChatAction(chat.id, 'delete', true);
                      setContextMenuChatId(null);
                    }}
                    className="w-full px-3 py-2 text-left text-xs text-red-500 hover:bg-red-500/10 flex items-center gap-2"
                  >
                    <Trash2 size={14} />
                    <span>Delete chat</span>
                  </button>
                </div>
              )}
            </div>
          );
        })}

        {visibleChats.length === 0 && (
          <div className="p-8 text-center text-sm text-gray-400">
            {filterUnread
              ? 'No unread chats'
              : viewArchived
              ? 'No archived chats'
              : 'No conversations found'}
          </div>
        )}
      </div>
    </div>
  );
};
