import React, { useState } from 'react';
import { X, Search, UserPlus } from 'lucide-react';
import { User } from '../types';

interface NewChatModalProps {
  users: User[];
  currentUserId: string;
  onSelectUser: (user: User) => void;
  onClose: () => void;
  isDark: boolean;
}

export const NewChatModal: React.FC<NewChatModalProps> = ({
  users,
  currentUserId,
  onSelectUser,
  onClose,
  isDark,
}) => {
  const [search, setSearch] = useState('');

  const otherUsers = users.filter(u => u.id !== currentUserId);
  const filteredUsers = otherUsers.filter(
    u =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.about.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div
        className={`w-full max-w-md rounded-3xl overflow-hidden shadow-2xl flex flex-col h-[520px] border ${
          isDark
            ? 'bg-[#111b21] border-[#313d45] text-gray-200'
            : 'bg-white border-gray-200 text-gray-800'
        }`}
      >
        {/* Header */}
        <div className={`p-4 border-b flex items-center justify-between ${isDark ? 'border-[#313d45] bg-[#202c33]' : 'border-gray-200 bg-gray-50'}`}>
          <div className="flex items-center gap-2">
            <UserPlus size={20} className="text-[#00a884]" />
            <h3 className="font-bold text-base">New Chat</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-black/10 dark:hover:bg-white/10">
            <X size={20} />
          </button>
        </div>

        {/* Search Input */}
        <div className={`p-3 border-b ${isDark ? 'border-[#313d45]' : 'border-gray-200'}`}>
          <div
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm ${
              isDark ? 'bg-[#202c33] text-white' : 'bg-gray-100 text-gray-900'
            }`}
          >
            <Search size={16} className="text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="bg-transparent flex-1 outline-none text-sm placeholder-gray-400"
              autoFocus
            />
          </div>
        </div>

        {/* Contacts Directory */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          <p className="text-[11px] font-semibold text-gray-400 px-3 py-2 uppercase tracking-wider">
            Contacts on WhatsApp ({filteredUsers.length})
          </p>
          {filteredUsers.map(user => (
            <button
              key={user.id}
              onClick={() => {
                onSelectUser(user);
                onClose();
              }}
              className={`w-full flex items-center gap-3 p-3 rounded-2xl text-left transition-colors ${
                isDark ? 'hover:bg-[#202c33]' : 'hover:bg-gray-100'
              }`}
            >
              <div className="relative">
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-12 h-12 rounded-full object-cover"
                />
                {user.isOnline && (
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-[#25d366] rounded-full border-2 border-[#111b21]" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-sm truncate">{user.name}</h4>
                  <span className="text-[11px] text-gray-400">
                    {user.isOnline ? 'Online' : 'Offline'}
                  </span>
                </div>
                <p className="text-xs text-gray-400 truncate mt-0.5">{user.about}</p>
              </div>
            </button>
          ))}

          {filteredUsers.length === 0 && (
            <div className="p-8 text-center text-sm text-gray-400">
              No contacts found matching "{search}"
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
