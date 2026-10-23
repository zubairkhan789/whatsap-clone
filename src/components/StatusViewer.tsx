import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Eye, Send, Trash2 } from 'lucide-react';
import { StatusUpdate, User } from '../types';
import { formatChatListTime } from '../utils/format';

interface StatusViewerProps {
  statuses: StatusUpdate[];
  initialIndex?: number;
  currentUser: User;
  onClose: () => void;
  onReply: (status: StatusUpdate, replyText: string) => void;
  onDelete: (statusId: string) => void;
  onViewed: (statusId: string) => void;
  isDark: boolean;
}

export const StatusViewer: React.FC<StatusViewerProps> = ({
  statuses,
  initialIndex = 0,
  currentUser,
  onClose,
  onReply,
  onDelete,
  onViewed,
  isDark,
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [showViewers, setShowViewers] = useState(false);

  const currentStatus = statuses[currentIndex];
  const isOwnStatus = currentStatus?.userId === currentUser.id;

  // Mark viewed
  useEffect(() => {
    if (currentStatus) {
      onViewed(currentStatus.id);
    }
  }, [currentIndex, currentStatus]);

  // Status timer
  useEffect(() => {
    if (isPaused || showViewers) return;

    const interval = 50; // tick every 50ms
    const step = (interval / 5000) * 100; // 5000ms total = 5s per story

    const timer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          if (currentIndex < statuses.length - 1) {
            setCurrentIndex(c => c + 1);
            return 0;
          } else {
            onClose();
            return 100;
          }
        }
        return prev + step;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [currentIndex, isPaused, showViewers, statuses.length]);

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setProgress(0);
    }
  };

  const handleNext = () => {
    if (currentIndex < statuses.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setProgress(0);
    } else {
      onClose();
    }
  };

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    onReply(currentStatus, replyText.trim());
    setReplyText('');
    onClose();
  };

  if (!currentStatus) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/95 flex flex-col justify-between items-center select-none"
      onMouseDown={() => setIsPaused(true)}
      onMouseUp={() => setIsPaused(false)}
      onTouchStart={() => setIsPaused(true)}
      onTouchEnd={() => setIsPaused(false)}
    >
      {/* Top Segmented Progress Bars */}
      <div className="w-full max-w-xl px-4 pt-4 pb-2 z-20 flex gap-1.5">
        {statuses.map((_, idx) => (
          <div key={idx} className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden">
            <div
              className="h-full bg-white transition-all duration-75"
              style={{
                width:
                  idx < currentIndex
                    ? '100%'
                    : idx === currentIndex
                    ? `${progress}%`
                    : '0%',
              }}
            />
          </div>
        ))}
      </div>

      {/* Header Info */}
      <div className="w-full max-w-xl px-4 flex items-center justify-between z-20 text-white">
        <div className="flex items-center gap-3">
          <img
            src={currentStatus.userAvatar}
            alt={currentStatus.userName}
            className="w-10 h-10 rounded-full object-cover border border-white/50"
          />
          <div>
            <p className="font-semibold text-sm leading-tight">{currentStatus.userName}</p>
            <p className="text-xs text-white/70">
              {formatChatListTime(currentStatus.createdAt)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isOwnStatus && (
            <button
              onClick={() => onDelete(currentStatus.id)}
              className="p-2 rounded-full hover:bg-white/10 text-white/80 hover:text-red-400"
              title="Delete Status"
            >
              <Trash2 size={18} />
            </button>
          )}
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 text-white/80 hover:text-white"
            title="Close"
          >
            <X size={22} />
          </button>
        </div>
      </div>

      {/* Center Story Display */}
      <div className="flex-1 w-full max-w-xl relative flex items-center justify-center p-4">
        {/* Navigation tap targets */}
        <button
          onClick={handlePrev}
          disabled={currentIndex === 0}
          className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/30 hover:bg-black/60 text-white/70 hover:text-white disabled:opacity-0 transition-opacity z-10"
        >
          <ChevronLeft size={28} />
        </button>
        <button
          onClick={handleNext}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/30 hover:bg-black/60 text-white/70 hover:text-white transition-opacity z-10"
        >
          <ChevronRight size={28} />
        </button>

        {currentStatus.type === 'image' && currentStatus.mediaUrl && (
          <div className="w-full h-full flex flex-col items-center justify-center">
            <img
              src={currentStatus.mediaUrl}
              alt="Status"
              className="max-h-[65vh] max-w-full rounded-2xl object-contain shadow-2xl"
            />
            {currentStatus.caption && (
              <p className="mt-4 text-center text-white text-base bg-black/60 px-4 py-2 rounded-xl max-w-md">
                {currentStatus.caption}
              </p>
            )}
          </div>
        )}

        {currentStatus.type === 'text' && (
          <div
            className="w-full h-full max-h-[60vh] rounded-3xl flex items-center justify-center p-8 text-center shadow-2xl transition-all"
            style={{ backgroundColor: currentStatus.bgColor || '#005c4b' }}
          >
            <p className="text-white text-2xl md:text-3xl font-medium leading-relaxed font-sans max-w-md">
              {currentStatus.content}
            </p>
          </div>
        )}
      </div>

      {/* Footer / Reply or Viewers Section */}
      <div className="w-full max-w-xl px-4 pb-6 z-20">
        {isOwnStatus ? (
          <div className="flex flex-col items-center">
            <button
              onClick={() => setShowViewers(!showViewers)}
              className="flex items-center gap-2 text-white/80 hover:text-white bg-black/40 hover:bg-black/60 px-4 py-2 rounded-full text-xs font-medium transition-colors"
            >
              <Eye size={16} />
              <span>{currentStatus.viewers.length} views</span>
            </button>

            {showViewers && (
              <div className="w-full mt-3 p-3 bg-[#202c33] rounded-2xl border border-[#313d45] max-h-40 overflow-y-auto">
                <p className="text-xs text-gray-400 font-semibold mb-2">Viewed by</p>
                {currentStatus.viewers.length === 0 ? (
                  <p className="text-xs text-gray-400">No views yet</p>
                ) : (
                  currentStatus.viewers.map((viewer, i) => (
                    <div key={i} className="flex items-center justify-between py-1 text-xs text-gray-200">
                      <span>{viewer.userName || 'User'}</span>
                      <span className="text-gray-400 text-[10px]">
                        {formatChatListTime(viewer.viewedAt)}
                      </span>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={handleSendReply} className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Reply to status..."
              value={replyText}
              onChange={e => setReplyText(e.target.value)}
              className="flex-1 px-4 py-3 rounded-full bg-white/20 text-white placeholder-white/60 text-sm outline-none backdrop-blur-md focus:ring-2 focus:ring-[#00a884]"
            />
            <button
              type="submit"
              disabled={!replyText.trim()}
              className="w-11 h-11 rounded-full bg-[#00a884] hover:bg-[#02906f] disabled:opacity-50 text-white flex items-center justify-center shadow-lg transition-transform active:scale-95"
            >
              <Send size={18} />
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
