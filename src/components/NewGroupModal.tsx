import React, { useState } from 'react';
import { X, Users, Check, ArrowRight } from 'lucide-react';
import { User } from '../types';

interface NewGroupModalProps {
  users: User[];
  currentUserId: string;
  onCreateGroup: (name: string, participantIds: string[], description?: string) => void;
  onClose: () => void;
  isDark: boolean;
}

export const NewGroupModal: React.FC<NewGroupModalProps> = ({
  users,
  currentUserId,
  onCreateGroup,
  onClose,
  isDark,
}) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');

  const otherUsers = users.filter(u => u.id !== currentUserId);

  const toggleUser = (userId: string) => {
    if (selectedUserIds.includes(userId)) {
      setSelectedUserIds(selectedUserIds.filter(id => id !== userId));
    } else {
      setSelectedUserIds([...selectedUserIds, userId]);
    }
  };

  const handleCreate = () => {
    if (!groupName.trim() || selectedUserIds.length === 0) return;
    onCreateGroup(groupName.trim(), selectedUserIds, groupDescription.trim() || undefined);
    onClose();
  };

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
            <Users size={20} className="text-[#00a884]" />
            <h3 className="font-bold text-base">
              {step === 1 ? 'Add Group Participants' : 'New Group Info'}
            </h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-black/10 dark:hover:bg-white/10">
            <X size={20} />
          </button>
        </div>

        {step === 1 ? (
          <>
            {/* Selected Pills */}
            {selectedUserIds.length > 0 && (
              <div className={`p-3 border-b flex items-center gap-2 overflow-x-auto ${isDark ? 'border-[#313d45] bg-[#1a242a]' : 'border-gray-200 bg-gray-100'}`}>
                {selectedUserIds.map(id => {
                  const user = users.find(u => u.id === id);
                  if (!user) return null;
                  return (
                    <span
                      key={id}
                      onClick={() => toggleUser(id)}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#00a884] text-white text-xs font-medium cursor-pointer shadow-sm hover:bg-red-500 transition-colors"
                    >
                      <img src={user.avatar} alt={user.name} className="w-4 h-4 rounded-full object-cover" />
                      <span>{user.name.split(' ')[0]}</span>
                      <X size={12} />
                    </span>
                  );
                })}
              </div>
            )}

            {/* User List */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {otherUsers.map(user => {
                const isSelected = selectedUserIds.includes(user.id);
                return (
                  <button
                    key={user.id}
                    onClick={() => toggleUser(user.id)}
                    className={`w-full flex items-center justify-between p-3 rounded-2xl text-left transition-colors ${
                      isSelected
                        ? isDark
                          ? 'bg-[#202c33]'
                          : 'bg-emerald-50'
                        : isDark
                        ? 'hover:bg-[#202c33]'
                        : 'hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <img src={user.avatar} alt={user.name} className="w-11 h-11 rounded-full object-cover" />
                      <div>
                        <h4 className="font-semibold text-sm">{user.name}</h4>
                        <p className="text-xs text-gray-400 truncate max-w-[220px]">{user.about}</p>
                      </div>
                    </div>
                    <div
                      className={`w-6 h-6 rounded-full border flex items-center justify-center ${
                        isSelected
                          ? 'bg-[#00a884] border-[#00a884] text-white'
                          : isDark
                          ? 'border-gray-500'
                          : 'border-gray-300'
                      }`}
                    >
                      {isSelected && <Check size={14} />}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Footer Next Button */}
            <div className={`p-4 border-t flex justify-end ${isDark ? 'border-[#313d45] bg-[#1a242a]' : 'border-gray-200 bg-gray-50'}`}>
              <button
                onClick={() => setStep(2)}
                disabled={selectedUserIds.length === 0}
                className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#00a884] hover:bg-[#02906f] disabled:opacity-50 text-white font-semibold text-sm shadow-md transition-transform active:scale-95"
              >
                <span>Next ({selectedUserIds.length})</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </>
        ) : (
          <div className="flex-1 p-6 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex justify-center mb-2">
                <div className="w-20 h-20 rounded-full bg-[#00a884] text-white flex items-center justify-center shadow-lg">
                  <Users size={36} />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1">Group Subject / Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Project Launch 🚀"
                  value={groupName}
                  onChange={e => setGroupName(e.target.value)}
                  className={`w-full px-4 py-2.5 rounded-xl text-sm outline-none border ${
                    isDark
                      ? 'bg-[#202c33] border-[#313d45] text-white focus:border-[#00a884]'
                      : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-[#00a884]'
                  }`}
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1">Group Description (Optional)</label>
                <textarea
                  placeholder="What is this group about?"
                  value={groupDescription}
                  onChange={e => setGroupDescription(e.target.value)}
                  rows={3}
                  className={`w-full px-4 py-2.5 rounded-xl text-sm outline-none resize-none border ${
                    isDark
                      ? 'bg-[#202c33] border-[#313d45] text-white focus:border-[#00a884]'
                      : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-[#00a884]'
                  }`}
                />
              </div>

              <p className="text-xs text-gray-400">
                {selectedUserIds.length} member{selectedUserIds.length > 1 ? 's' : ''} will be added to this group.
              </p>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-[#313d45]">
              <button
                onClick={() => setStep(1)}
                className="text-xs font-semibold text-gray-400 hover:text-gray-200"
              >
                Back
              </button>
              <button
                onClick={handleCreate}
                disabled={!groupName.trim()}
                className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#00a884] hover:bg-[#02906f] disabled:opacity-50 text-white font-semibold text-sm shadow-md transition-transform active:scale-95"
              >
                <Check size={16} />
                <span>Create Group</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
