import React, { useEffect, useRef, useState } from 'react';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  Maximize2,
  Minimize2,
  RotateCw,
  Volume2,
  ShieldAlert,
} from 'lucide-react';
import { ActiveCall } from '../types';
import { formatDuration } from '../utils/format';

interface CallModalProps {
  activeCall: ActiveCall;
  onEndCall: () => void;
  onToggleMute: () => void;
  onToggleVideo: () => void;
  onSwitchCamera?: () => void;
  isDark: boolean;
}

export const CallModal: React.FC<CallModalProps> = ({
  activeCall,
  onEndCall,
  onToggleMute,
  onToggleVideo,
  onSwitchCamera,
  isDark,
}) => {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const [isMinimized, setIsMinimized] = useState(false);
  const [hasPermissionError, setHasPermissionError] = useState(false);

  // Bind local stream
  useEffect(() => {
    if (localVideoRef.current && activeCall.localStream) {
      localVideoRef.current.srcObject = activeCall.localStream;
    }
  }, [activeCall.localStream, activeCall.isVideoOff]);

  // Bind remote stream
  useEffect(() => {
    if (remoteVideoRef.current && activeCall.remoteStream) {
      remoteVideoRef.current.srcObject = activeCall.remoteStream;
    }
  }, [activeCall.remoteStream]);

  if (isMinimized) {
    return (
      <div className="fixed bottom-6 right-6 z-50 bg-[#111b21] text-white p-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-[#313d45]">
        <img
          src={activeCall.otherUser.avatar}
          alt={activeCall.otherUser.name}
          className="w-10 h-10 rounded-full object-cover"
        />
        <div>
          <p className="text-xs font-semibold">{activeCall.otherUser.name}</p>
          <p className="text-[11px] text-[#00a884] font-medium">
            {activeCall.status === 'connected'
              ? formatDuration(activeCall.duration)
              : activeCall.status === 'ringing'
              ? 'Ringing...'
              : 'Connecting...'}
          </p>
        </div>
        <button
          onClick={() => setIsMinimized(false)}
          className="p-1.5 rounded-full hover:bg-white/10 text-gray-300"
          title="Maximize"
        >
          <Maximize2 size={16} />
        </button>
        <button
          onClick={onEndCall}
          className="p-2 rounded-full bg-red-600 hover:bg-red-700 text-white"
          title="End Call"
        >
          <PhoneOff size={16} />
        </button>
      </div>
    );
  }

  const isVideoCall = activeCall.type === 'video';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
      <div
        className={`w-full max-w-4xl h-[85vh] rounded-3xl overflow-hidden flex flex-col shadow-2xl relative ${
          isDark ? 'bg-[#111b21]' : 'bg-[#202c33]'
        }`}
      >
        {/* Top Header */}
        <div className="absolute top-0 left-0 right-0 p-5 flex items-center justify-between z-20 bg-gradient-to-b from-black/70 to-transparent">
          <div className="flex items-center gap-3">
            <img
              src={activeCall.otherUser.avatar}
              alt={activeCall.otherUser.name}
              className="w-10 h-10 rounded-full object-cover border-2 border-white/40"
            />
            <div>
              <h3 className="text-white font-bold text-base flex items-center gap-2">
                {activeCall.otherUser.name}
                <span className="text-[11px] font-normal px-2 py-0.5 rounded-full bg-black/40 text-gray-300 uppercase tracking-wider">
                  {activeCall.type} Call
                </span>
              </h3>
              <p className="text-xs text-[#25d366] font-medium">
                {activeCall.status === 'connected'
                  ? formatDuration(activeCall.duration)
                  : activeCall.status === 'ringing'
                  ? 'Ringing...'
                  : 'Establishing Secure WebRTC Connection...'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsMinimized(true)}
              className="p-2 rounded-full bg-black/40 hover:bg-black/60 text-white transition-colors"
              title="Minimize"
            >
              <Minimize2 size={18} />
            </button>
          </div>
        </div>

        {/* Call Stage Area */}
        <div className="flex-1 relative w-full h-full flex items-center justify-center overflow-hidden bg-gradient-to-b from-[#0b141a] to-[#111b21]">
          {/* Permission Error Banner */}
          {hasPermissionError && (
            <div className="absolute top-20 z-30 bg-red-600/90 text-white px-4 py-2.5 rounded-xl flex items-center gap-2 text-sm shadow-lg">
              <ShieldAlert size={18} />
              <span>Camera or microphone access denied. Please allow permissions in browser settings.</span>
            </div>
          )}

          {isVideoCall ? (
            <>
              {/* Remote Video Stream or Placeholder */}
              {activeCall.remoteStream && activeCall.status === 'connected' ? (
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-center p-6">
                  <div className="relative mb-6">
                    <img
                      src={activeCall.otherUser.avatar}
                      alt={activeCall.otherUser.name}
                      className="w-32 h-32 rounded-full object-cover shadow-2xl ring-4 ring-[#00a884]/40 animate-pulse"
                    />
                  </div>
                  <h2 className="text-white text-2xl font-bold mb-2">{activeCall.otherUser.name}</h2>
                  <p className="text-gray-400 text-sm">
                    {activeCall.status === 'ringing' ? 'Waiting for answer...' : 'Connecting video stream...'}
                  </p>
                </div>
              )}

              {/* Local Video Stream Picture-in-Picture */}
              <div className="absolute bottom-28 right-6 w-36 h-52 md:w-48 md:h-64 rounded-2xl overflow-hidden shadow-2xl border-2 border-white/20 bg-black z-20">
                {activeCall.isVideoOff ? (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-gray-900 text-gray-400 text-xs">
                    <VideoOff size={24} className="mb-2 text-gray-500" />
                    <span>Camera Off</span>
                  </div>
                ) : (
                  <video
                    ref={localVideoRef}
                    autoPlay
                    muted
                    playsInline
                    className="w-full h-full object-cover scale-x-[-1]"
                  />
                )}
                {onSwitchCamera && (
                  <button
                    onClick={onSwitchCamera}
                    className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 hover:bg-black/80 text-white"
                    title="Flip camera"
                  >
                    <RotateCw size={14} />
                  </button>
                )}
              </div>
            </>
          ) : (
            /* Voice Call Screen */
            <div className="flex flex-col items-center justify-center text-center p-6 z-10">
              <div className="relative mb-8">
                {/* Visualizer Pulse Rings */}
                <div className="absolute inset-0 -m-6 rounded-full bg-[#00a884]/20 animate-ping opacity-60" />
                <div className="absolute inset-0 -m-3 rounded-full bg-[#00a884]/30 animate-pulse" />
                <img
                  src={activeCall.otherUser.avatar}
                  alt={activeCall.otherUser.name}
                  className="w-36 h-36 rounded-full object-cover shadow-2xl ring-4 ring-[#00a884] relative z-10"
                />
              </div>

              <h2 className="text-white text-3xl font-bold mb-2">{activeCall.otherUser.name}</h2>
              <p className="text-gray-300 text-base font-medium mb-1">
                {activeCall.status === 'connected' ? 'Connected' : 'WhatsApp Audio Call'}
              </p>
              <p className="text-[#25d366] text-xl font-mono">
                {activeCall.status === 'connected'
                  ? formatDuration(activeCall.duration)
                  : activeCall.status === 'ringing'
                  ? 'Ringing...'
                  : 'Connecting...'}
              </p>

              {/* Audio Waveform visualization */}
              {activeCall.status === 'connected' && (
                <div className="flex items-center gap-1.5 mt-8 h-8">
                  {[12, 24, 18, 30, 15, 28, 20, 32, 16, 22].map((h, i) => (
                    <div
                      key={i}
                      className="w-1.5 bg-[#00a884] rounded-full animate-wave-bar"
                      style={{
                        animationDelay: `${i * 0.1}s`,
                        height: `${h}px`,
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Call Controls Floating Bar */}
        <div className="p-6 bg-gradient-to-t from-black/80 via-black/50 to-transparent flex items-center justify-center gap-5 z-20">
          {/* Mute/Unmute Mic */}
          <button
            onClick={onToggleMute}
            className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-transform active:scale-95 ${
              activeCall.isMuted
                ? 'bg-red-500 hover:bg-red-600 text-white'
                : 'bg-white/20 hover:bg-white/30 text-white'
            }`}
            title={activeCall.isMuted ? 'Unmute microphone' : 'Mute microphone'}
          >
            {activeCall.isMuted ? <MicOff size={24} /> : <Mic size={24} />}
          </button>

          {/* Toggle Video (for video calls) */}
          {isVideoCall && (
            <button
              onClick={onToggleVideo}
              className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-transform active:scale-95 ${
                activeCall.isVideoOff
                  ? 'bg-red-500 hover:bg-red-600 text-white'
                  : 'bg-white/20 hover:bg-white/30 text-white'
              }`}
              title={activeCall.isVideoOff ? 'Turn camera on' : 'Turn camera off'}
            >
              {activeCall.isVideoOff ? <VideoOff size={24} /> : <Video size={24} />}
            </button>
          )}

          {/* End Call Button */}
          <button
            onClick={onEndCall}
            className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center shadow-2xl transition-transform active:scale-95"
            title="End call"
          >
            <PhoneOff size={28} />
          </button>
        </div>
      </div>
    </div>
  );
};
