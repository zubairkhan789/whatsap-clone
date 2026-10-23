import React from 'react';
import { Phone, PhoneOff, Video } from 'lucide-react';

interface IncomingCallBannerProps {
  callerName: string;
  callerAvatar: string;
  callType: 'voice' | 'video';
  onAccept: () => void;
  onDecline: () => void;
  isDark: boolean;
}

export const IncomingCallBanner: React.FC<IncomingCallBannerProps> = ({
  callerName,
  callerAvatar,
  callType,
  onAccept,
  onDecline,
  isDark,
}) => {
  return (
    <div className="fixed top-6 right-6 z-50 animate-bounce duration-1000">
      <div
        className={`w-96 rounded-2xl shadow-2xl p-4 flex items-center justify-between border ${
          isDark
            ? 'bg-[#202c33] border-[#313d45] text-white'
            : 'bg-white border-gray-200 text-gray-900'
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="relative">
            <img
              src={callerAvatar}
              alt={callerName}
              className="w-12 h-12 rounded-full object-cover ring-2 ring-[#00a884] animate-pulse"
            />
            <div className="absolute -bottom-1 -right-1 bg-[#00a884] text-white p-1 rounded-full text-xs">
              {callType === 'video' ? <Video size={10} /> : <Phone size={10} />}
            </div>
          </div>
          <div>
            <h4 className="font-bold text-sm">{callerName}</h4>
            <p className="text-xs text-[#00a884] font-medium flex items-center gap-1">
              Incoming WhatsApp {callType === 'video' ? 'Video' : 'Voice'} Call...
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Decline */}
          <button
            onClick={onDecline}
            className="w-10 h-10 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center shadow-md transition-transform active:scale-95"
            title="Decline"
          >
            <PhoneOff size={18} />
          </button>
          {/* Accept */}
          <button
            onClick={onAccept}
            className="w-10 h-10 rounded-full bg-[#00a884] hover:bg-[#02906f] text-white flex items-center justify-center shadow-md transition-transform active:scale-95 animate-pulse"
            title="Accept"
          >
            <Phone size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};
