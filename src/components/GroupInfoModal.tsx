import React, { useState } from 'react';
import { X, Users, Shield, UserMinus, UserPlus, LogOut, Trash2 } from 'lucide-react';
import { Chat, User } from '../types';

interface GroupInfoModalProps {
  chat: Chat;
  allUsers: User[];
  currentUserId: string;
  onUpdateMember: (action: 'add' | 'remove' | 'make_admin', memberId: string) => void;
  onClose: () => void;
  isDark: boolean;
}

export const GroupInfoModal: React.FC<GroupInfoModalProps> = ({
  chat,
  allUsers,
  currentUserId,
  onUpdateMember,
  onClose,
  isDark,
}) => {
  const [showAddMember, setShowAddMember] = useState(false);
  const isAdmin = chat.adminIds.includes(currentUserId);

  const participantUsers = allUsers.filter(u => chat.participants.includes(u.id));
  const nonParticipantUsers = allUsers.filter(u => !chat.participants.includes(u.id));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div
        className={`w-full max-w-md rounded-3xl overflow-hidden shadow-2xl flex flex-col h-[560px] border ${
          isDark
            ? 'bg-[#111b21] border-[#313d45] text-gray-200'
            : 'bg-white border-gray-200 text-gray-800'
        }`}
      >
        {/* Header */}
        <div className={`p-4 border-b flex items-center justify-between ${isDark ? 'border-[#313d45] bg-[#202c33]' : 'border-gray-200 bg-gray-50'}`}>
          <h3 className="font-bold text-base">Group Info</h3>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-black/10 dark:hover:bg-white/10">
            <X size={20} />
          </button>
        </div>

        {/* Group Hero Details */}
        <div className="p-6 flex flex-col items-center border-b border-[#313d45] text-center">
          <img
            src={chat.avatar || 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=150&auto=format&fit=crop&q=80'}
            alt={chat.name}
            className="w-24 h-24 rounded-full object-cover shadow-lg mb-3"
          />
          <h2 className="text-xl font-bold">{chat.name}</h2>
          <p className="text-xs text-gray-400 mt-1">Group • {chat.participants.length} participants</p>
          {chat.description && (
            <p className="text-xs text-gray-300 mt-2 bg-black/20 p-2.5 rounded-xl max-w-sm">
              {chat.description}
            </p>
          )}
        </div>

        {/* Participants Header & Add Button */}
        <div className="p-3 px-4 flex items-center justify-between">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            {chat.participants.length} Participants
          </span>
          {isAdmin && (
            <button
              onClick={() => setShowAddMember(!showAddMember)}
              className="text-xs font-semibold text-[#00a884] hover:underline flex items-center gap-1"
            >
              <UserPlus size={14} />
              <span>{showAddMember ? 'Cancel' : 'Add member'}</span>
            </button>
          )}
        </div>

        {/* Add Member Drawer */}
        {showAddMember && (
          <div className={`p-3 border-b max-h-36 overflow-y-auto ${isDark ? 'bg-[#1a242a] border-[#313d45]' : 'bg-gray-100 border-gray-200'}`}>
            <p className="text-[11px] text-gray-400 mb-2">Select contact to add to group:</p>
            {nonParticipantUsers.map(user => (
              <div key={user.id} className="flex items-center justify-between py-1.5">
                <div className="flex items-center gap-2">
                  <img src={user.avatar} alt={user.name} className="w-6 h-6 rounded-full" />
                  <span className="text-xs font-medium">{user.name}</span>
                </div>
                <button
                  onClick={() => onUpdateMember('add', user.id)}
                  className="px-2.5 py-1 rounded-lg bg-[#00a884] text-white text-[11px] font-semibold hover:bg-[#02906f]"
                >
                  Add
                </button>
              </div>
            ))}
            {nonParticipantUsers.length === 0 && (
              <p className="text-xs text-gray-400 py-2">All contacts are already in this group.</p>
            )}
          </div>
        )}

        {/* Participants List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {participantUsers.map(user => {
            const isUserAdmin = chat.adminIds.includes(user.id);
            const isSelf = user.id === currentUserId;

            return (
              <div
                key={user.id}
                className={`flex items-center justify-between p-3 rounded-2xl ${
                  isDark ? 'hover:bg-[#202c33]' : 'hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center gap-3">
                  <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full object-cover" />
                  <div>
                    <h4 className="font-semibold text-sm flex items-center gap-2">
                      <span>{isSelf ? 'You' : user.name}</span>
                      {isUserAdmin && (
                        <span className="text-[10px] bg-[#00a884]/20 text-[#00a884] px-1.5 py-0.5 rounded font-medium">
                          Group Admin
                        </span>
                      )}
                    </h4>
                    <p className="text-xs text-gray-400 truncate max-w-[200px]">{user.about}</p>
                  </div>
                </div>

                {isAdmin && !isSelf && (
                  <div className="flex items-center gap-1">
                    {!isUserAdmin && (
                      <button
                        onClick={() => onUpdateMember('make_admin', user.id)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-[#00a884] hover:bg-black/10 dark:hover:bg-white/10"
                        title="Make Group Admin"
                      >
                        <Shield size={16} />
                      </button>
                    )}
                    <button
                      onClick={() => onUpdateMember('remove', user.id)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-black/10 dark:hover:bg-white/10"
                      title="Remove from group"
                    >
                      <UserMinus size={16} />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer Leave Group */}
        <div className={`p-4 border-t ${isDark ? 'border-[#313d45] bg-[#1a242a]' : 'border-gray-200 bg-gray-50'}`}>
          <button
            onClick={() => {
              onUpdateMember('remove', currentUserId);
              onClose();
            }}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-red-500 hover:bg-red-500/10 text-xs font-semibold transition-colors"
          >
            <LogOut size={16} />
            <span>Exit Group</span>
          </button>
        </div>
      </div>
    </div>
  );
};
