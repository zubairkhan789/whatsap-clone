import React, { useState, useRef, useEffect } from 'react';
import {
  Phone,
  Video,
  Search,
  MoreVertical,
  Paperclip,
  Smile,
  Mic,
  Send,
  Check,
  CheckCheck,
  Pin,
  Trash2,
  Edit2,
  Copy,
  CornerUpLeft,
  Share2,
  X,
  Play,
  Pause,
  FileText,
  Download,
  AlertCircle,
  Square,
  Lock,
  ArrowLeft,
} from 'lucide-react';
import { Chat, Message, User } from '../types';
import { EmojiPicker } from './EmojiPicker';
import { MediaPreviewModal } from './MediaPreviewModal';
import { formatMessageTime, formatDuration, formatLastSeen } from '../utils/format';
import { soundEffects } from '../utils/audio';

interface ChatAreaProps {
  chat: Chat | null;
  currentUser: User;
  allUsers: User[];
  messages: Message[];
  onSendMessage: (msgData: {
    type: 'text' | 'image' | 'audio' | 'video' | 'document';
    content: string;
    fileUrl?: string;
    fileName?: string;
    fileSize?: string;
    fileType?: string;
    duration?: number;
    replyTo?: any;
  }) => void;
  onEditMessage: (messageId: string, newContent: string) => void;
  onDeleteMessage: (messageId: string, forEveryone: boolean) => void;
  onReactMessage: (messageId: string, emoji: string) => void;
  onPinMessage: (messageId: string, isPinned: boolean) => void;
  onStartCall: (callType: 'voice' | 'video') => void;
  onOpenGroupInfo: () => void;
  onBackToSidebar: () => void;
  typingUsers: string[];
  onTyping: (isTyping: boolean) => void;
  isDark: boolean;
}

export const ChatArea: React.FC<ChatAreaProps> = ({
  chat,
  currentUser,
  allUsers,
  messages,
  onSendMessage,
  onEditMessage,
  onDeleteMessage,
  onReactMessage,
  onPinMessage,
  onStartCall,
  onOpenGroupInfo,
  onBackToSidebar,
  typingUsers,
  onTyping,
  isDark,
}) => {
  const [inputText, setInputText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedFileForPreview, setSelectedFileForPreview] = useState<File | null>(null);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [inChatSearch, setInChatSearch] = useState('');
  const [showSearchInput, setShowSearchInput] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [forwardingMessage, setForwardingMessage] = useState<Message | null>(null);
  const [copiedToast, setCopiedToast] = useState(false);

  // Voice recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<any>(null);

  // Audio note playback state: messageId -> { isPlaying: boolean, currentTime: number, duration: number, playbackRate: number }
  const [audioPlayback, setAudioPlayback] = useState<Record<string, { isPlaying: boolean; speed: number }>>({});
  const audioElementsRef = useRef<Record<string, HTMLAudioElement>>({});

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<any>(null);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, chat?.id]);

  if (!chat) {
    return (
      <div
        className={`h-full flex flex-col items-center justify-center p-8 select-none border-b-8 border-[#00a884] ${
          isDark ? 'bg-[#222e35] text-gray-300' : 'bg-[#f0f2f5] text-gray-700'
        }`}
      >
        <div className="w-64 h-64 mb-6 flex items-center justify-center opacity-75">
          <svg viewBox="0 0 300 200" className="w-full h-full fill-current text-[#00a884]">
            <path d="M150 20 C78 20 20 78 20 150 C20 175 27 198 40 218 L25 275 L85 260 C104 273 126 280 150 280 C222 280 280 222 280 150 C280 78 222 20 150 20 Z" />
          </svg>
        </div>
        <h2 className="text-3xl font-light mb-2">WhatsApp Web</h2>
        <p className="text-sm text-gray-400 max-w-md text-center leading-relaxed mb-6">
          Send and receive real-time messages, audio notes, and make crystal-clear WebRTC voice & video calls.
        </p>
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <Lock size={14} className="text-[#00a884]" />
          <span>End-to-end encrypted messaging prototype</span>
        </div>
      </div>
    );
  }

  // Get other party details
  const isGroup = chat.type === 'group';
  const otherUserId = chat.participants.find(p => p !== currentUser.id);
  const otherUser = allUsers.find(u => u.id === otherUserId);

  const chatTitle = isGroup ? chat.name || 'Group Chat' : otherUser?.name || 'Contact';
  const chatAvatar = isGroup
    ? chat.avatar || 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=150&auto=format&fit=crop&q=80'
    : otherUser?.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=user';

  const subtitle = isGroup
    ? `${chat.participants.length} participants`
    : typingUsers.length > 0
    ? 'typing...'
    : otherUser
    ? formatLastSeen(otherUser.lastSeen, otherUser.isOnline)
    : 'offline';

  // Find pinned message
  const pinnedMessage = messages.find(m => m.isPinned);

  // In-chat search filter
  const displayedMessages = inChatSearch.trim()
    ? messages.filter(m => m.content.toLowerCase().includes(inChatSearch.toLowerCase()))
    : messages;

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
    onTyping(true);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      onTyping(false);
    }, 1500);
  };

  const handleSendTextMessage = () => {
    if (editingMessage) {
      if (inputText.trim()) {
        onEditMessage(editingMessage.id, inputText.trim());
      }
      setEditingMessage(null);
      setInputText('');
      return;
    }

    if (!inputText.trim()) return;

    onSendMessage({
      type: 'text',
      content: inputText.trim(),
      replyTo: replyingTo
        ? {
            id: replyingTo.id,
            senderName: replyingTo.senderName,
            content: replyingTo.content,
            type: replyingTo.type,
          }
        : undefined,
    });

    setInputText('');
    setReplyingTo(null);
    setShowEmojiPicker(false);
    soundEffects.playMessageSent();
  };

  // Voice recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = e => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        stream.getTracks().forEach(t => t.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingDuration(0);
      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration(d => d + 1);
      }, 1000);
    } catch (err) {
      alert('Microphone permission denied or not available on this device.');
    }
  };

  const stopAndSendRecording = () => {
    if (!mediaRecorderRef.current || !isRecording) return;
    clearInterval(recordingTimerRef.current);

    mediaRecorderRef.current.onstop = () => {
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      const reader = new FileReader();
      reader.onload = () => {
        const base64Data = reader.result as string;
        onSendMessage({
          type: 'audio',
          content: 'Voice message',
          fileUrl: base64Data,
          fileName: `voice-note-${Date.now()}.webm`,
          duration: recordingDuration,
          replyTo: replyingTo
            ? {
                id: replyingTo.id,
                senderName: replyingTo.senderName,
                content: replyingTo.content,
                type: replyingTo.type,
              }
            : undefined,
        });
        soundEffects.playMessageSent();
      };
      reader.readAsDataURL(audioBlob);
    };

    mediaRecorderRef.current.stop();
    setIsRecording(false);
    setRecordingDuration(0);
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      clearInterval(recordingTimerRef.current);
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setRecordingDuration(0);
    }
  };

  // Media preview upload
  const handleMediaSend = (file: File, caption: string) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const isImg = file.type.startsWith('image/');
      const isVid = file.type.startsWith('video/');

      onSendMessage({
        type: isImg ? 'image' : isVid ? 'video' : 'document',
        content: caption || file.name,
        fileUrl: dataUrl,
        fileName: file.name,
        fileSize: (file.size / 1024 / 1024).toFixed(1) + ' MB',
        fileType: file.type,
      });
      setSelectedFileForPreview(null);
      soundEffects.playMessageSent();
    };
    reader.readAsDataURL(file);
  };

  // Audio note playback
  const togglePlayAudio = (messageId: string, url: string) => {
    let audio = audioElementsRef.current[messageId];
    if (!audio) {
      audio = new Audio(url);
      audioElementsRef.current[messageId] = audio;
      audio.onended = () => {
        setAudioPlayback(prev => ({
          ...prev,
          [messageId]: { ...prev[messageId], isPlaying: false },
        }));
      };
    }

    const currentSpeed = audioPlayback[messageId]?.speed || 1;
    const isPlaying = audioPlayback[messageId]?.isPlaying;

    if (isPlaying) {
      audio.pause();
      setAudioPlayback(prev => ({
        ...prev,
        [messageId]: { isPlaying: false, speed: currentSpeed },
      }));
    } else {
      audio.playbackRate = currentSpeed;
      audio.play();
      setAudioPlayback(prev => ({
        ...prev,
        [messageId]: { isPlaying: true, speed: currentSpeed },
      }));
    }
  };

  const changeSpeed = (messageId: string) => {
    const currentSpeed = audioPlayback[messageId]?.speed || 1;
    const nextSpeed = currentSpeed === 1 ? 1.5 : currentSpeed === 1.5 ? 2 : 1;
    const audio = audioElementsRef.current[messageId];
    if (audio) {
      audio.playbackRate = nextSpeed;
    }
    setAudioPlayback(prev => ({
      ...prev,
      [messageId]: { ...prev[messageId], speed: nextSpeed },
    }));
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedToast(true);
    setTimeout(() => setCopiedToast(false), 2000);
  };

  return (
    <div
      className={`h-full flex flex-col relative ${
        isDark ? 'wa-chat-bg-dark text-gray-200' : 'wa-chat-bg-light text-gray-800'
      }`}
    >
      {/* Chat Header */}
      <div
        className={`h-16 px-4 flex items-center justify-between border-b z-30 ${
          isDark ? 'bg-[#202c33] border-[#222d34]' : 'bg-[#f0f2f5] border-gray-200'
        }`}
      >
        <div className="flex items-center gap-3">
          {/* Back button for mobile */}
          <button
            onClick={onBackToSidebar}
            className="md:hidden p-1.5 rounded-full hover:bg-black/10 dark:hover:bg-white/10 text-gray-400"
          >
            <ArrowLeft size={20} />
          </button>

          <div
            onClick={onOpenGroupInfo}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="relative">
              <img src={chatAvatar} alt={chatTitle} className="w-10 h-10 rounded-full object-cover" />
              {!isGroup && otherUser?.isOnline && (
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-[#25d366] rounded-full border-2 border-[#111b21]" />
              )}
            </div>
            <div>
              <h3 className="font-semibold text-sm leading-tight group-hover:text-[#00a884] transition-colors">
                {chatTitle}
              </h3>
              <p className="text-[11px] text-gray-400 font-normal capitalize">
                {subtitle}
              </p>
            </div>
          </div>
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-2 text-gray-400">
          <button
            onClick={() => onStartCall('video')}
            className="p-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10 hover:text-[#00a884] transition-colors"
            title="Start WebRTC Video Call"
          >
            <Video size={20} />
          </button>
          <button
            onClick={() => onStartCall('voice')}
            className="p-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10 hover:text-[#00a884] transition-colors"
            title="Start WebRTC Voice Call"
          >
            <Phone size={19} />
          </button>
          <button
            onClick={() => setShowSearchInput(!showSearchInput)}
            className="p-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10 hover:text-white transition-colors"
            title="Search in chat"
          >
            <Search size={19} />
          </button>
          <button
            onClick={onOpenGroupInfo}
            className="p-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10 hover:text-white transition-colors"
            title="Details / Settings"
          >
            <MoreVertical size={19} />
          </button>
        </div>
      </div>

      {/* In-Chat Search Bar */}
      {showSearchInput && (
        <div className={`p-2.5 border-b flex items-center gap-2 ${isDark ? 'bg-[#182229] border-[#222d34]' : 'bg-white border-gray-200'}`}>
          <Search size={16} className="text-gray-400" />
          <input
            type="text"
            placeholder="Search messages in this conversation..."
            value={inChatSearch}
            onChange={e => setInChatSearch(e.target.value)}
            className={`flex-1 text-xs bg-transparent outline-none ${isDark ? 'text-white' : 'text-gray-900'}`}
            autoFocus
          />
          <span className="text-xs text-gray-400">{displayedMessages.length} matches</span>
          <button onClick={() => { setShowSearchInput(false); setInChatSearch(''); }} className="text-gray-400 hover:text-white">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Pinned Message Banner */}
      {pinnedMessage && (
        <div
          onClick={() => {
            const el = document.getElementById(`msg-${pinnedMessage.id}`);
            el?.scrollIntoView({ behavior: 'smooth' });
          }}
          className={`px-4 py-2 flex items-center justify-between border-b cursor-pointer shadow-sm text-xs z-20 ${
            isDark ? 'bg-[#202c33] border-[#222d34] text-gray-200' : 'bg-emerald-50 border-emerald-100 text-gray-800'
          }`}
        >
          <div className="flex items-center gap-2 truncate">
            <Pin size={14} className="text-[#00a884] fill-[#00a884] rotate-45 flex-shrink-0" />
            <span className="font-semibold text-[#00a884]">Pinned Message:</span>
            <span className="truncate">{pinnedMessage.content}</span>
          </div>
          <button
            onClick={e => {
              e.stopPropagation();
              onPinMessage(pinnedMessage.id, false);
            }}
            className="text-gray-400 hover:text-red-500 p-1"
            title="Unpin message"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Messages Feed */}
      <div className="flex-1 overflow-y-auto p-4 md:px-12 space-y-3">
        {/* Encryption Safety Notice */}
        <div className="flex justify-center my-3">
          <div
            className={`max-w-md px-4 py-2 rounded-xl text-center text-xs shadow-sm flex items-center gap-2 ${
              isDark ? 'bg-[#182229] text-[#ffd279]' : 'bg-[#ffeecd] text-amber-900'
            }`}
          >
            <Lock size={14} className="flex-shrink-0" />
            <span>Messages are end-to-end synchronized. Nobody outside of this chat can read or listen to them.</span>
          </div>
        </div>

        {/* Message Bubbles */}
        {displayedMessages.map(msg => {
          const isMe = msg.senderId === currentUser.id;
          const isDeletedEveryone = msg.deletedForEveryone;

          return (
            <div
              key={msg.id}
              id={`msg-${msg.id}`}
              className={`flex flex-col group ${isMe ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[85%] md:max-w-[65%] rounded-2xl p-2.5 shadow-md relative transition-all ${
                  isMe
                    ? isDark
                      ? 'bg-[#005c4b] text-[#e9edef] rounded-tr-none'
                      : 'bg-[#d9fdd3] text-[#111b21] rounded-tr-none'
                    : isDark
                    ? 'bg-[#202c33] text-[#e9edef] rounded-tl-none'
                    : 'bg-white text-[#111b21] rounded-tl-none'
                }`}
              >
                {/* Sender Name for group chats */}
                {isGroup && !isMe && (
                  <p className="text-[11px] font-bold text-[#00a884] mb-1">
                    {msg.senderName}
                  </p>
                )}

                {/* Reply To Quote Bubble */}
                {msg.replyTo && (
                  <div
                    className={`mb-2 p-2 rounded-lg border-l-4 border-[#00a884] text-xs ${
                      isDark ? 'bg-black/25 text-gray-300' : 'bg-black/5 text-gray-700'
                    }`}
                  >
                    <p className="font-bold text-[#00a884] text-[11px]">{msg.replyTo.senderName}</p>
                    <p className="truncate line-clamp-1">{msg.replyTo.content}</p>
                  </div>
                )}

                {/* Message Body according to type */}
                {isDeletedEveryone ? (
                  <p className="italic text-xs text-gray-400 flex items-center gap-1.5 py-1">
                    <AlertCircle size={14} />
                    <span>This message was deleted</span>
                  </p>
                ) : (
                  <>
                    {/* Image Attachment */}
                    {msg.type === 'image' && msg.fileUrl && (
                      <div className="mb-1.5 overflow-hidden rounded-xl">
                        <img
                          src={msg.fileUrl}
                          alt="Attachment"
                          className="max-h-72 w-full object-cover rounded-xl cursor-pointer hover:scale-101 transition-transform"
                          onClick={() => window.open(msg.fileUrl, '_blank')}
                        />
                      </div>
                    )}

                    {/* Audio Voice Note with Play/Pause & Speed */}
                    {msg.type === 'audio' && msg.fileUrl && (
                      <div className="flex items-center gap-3 py-1 min-w-[240px]">
                        <button
                          onClick={() => togglePlayAudio(msg.id, msg.fileUrl!)}
                          className="w-10 h-10 rounded-full bg-[#00a884] text-white flex items-center justify-center shadow-md active:scale-95 transition-transform flex-shrink-0"
                        >
                          {audioPlayback[msg.id]?.isPlaying ? <Pause size={18} /> : <Play size={18} className="translate-x-0.5" />}
                        </button>

                        <div className="flex-1">
                          {/* Fake wave bars */}
                          <div className="flex items-center gap-0.5 h-6">
                            {[12, 18, 8, 22, 15, 10, 24, 18, 12, 16, 20, 14, 22, 8, 16].map((h, i) => (
                              <div
                                key={i}
                                className={`w-1 rounded-full ${
                                  audioPlayback[msg.id]?.isPlaying ? 'bg-[#00a884]' : 'bg-gray-400'
                                }`}
                                style={{ height: `${h}px` }}
                              />
                            ))}
                          </div>
                          <div className="flex items-center justify-between text-[10px] text-gray-400 mt-0.5">
                            <span>{msg.duration ? formatDuration(msg.duration) : '0:15'}</span>
                            <button
                              onClick={() => changeSpeed(msg.id)}
                              className="font-bold text-[#00a884] hover:underline"
                            >
                              {audioPlayback[msg.id]?.speed || 1}x
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Document Attachment */}
                    {msg.type === 'document' && (
                      <div
                        className={`flex items-center gap-3 p-3 rounded-xl mb-1.5 ${
                          isDark ? 'bg-black/20' : 'bg-black/5'
                        }`}
                      >
                        <FileText size={28} className="text-[#00a884] flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold truncate">{msg.fileName || msg.content}</p>
                          <p className="text-[10px] text-gray-400">{msg.fileSize || 'Document'}</p>
                        </div>
                        {msg.fileUrl && (
                          <a
                            href={msg.fileUrl}
                            download={msg.fileName || 'download'}
                            className="p-1.5 rounded-lg bg-[#00a884] text-white hover:bg-[#02906f]"
                            title="Download"
                          >
                            <Download size={14} />
                          </a>
                        )}
                      </div>
                    )}

                    {/* Text content */}
                    {msg.type !== 'audio' && (
                      <p className="text-sm leading-relaxed whitespace-pre-wrap break-words pr-2">
                        {msg.content}
                      </p>
                    )}
                  </>
                )}

                {/* Footer: Timestamp, Edited label, and Checkmark Status */}
                <div className="flex items-center justify-end gap-1 text-[10px] text-gray-400 mt-1 select-none">
                  {msg.isPinned && <Pin size={11} className="rotate-45 fill-gray-400" />}
                  {msg.isEdited && <span className="italic">(edited)</span>}
                  <span>{formatMessageTime(msg.createdAt)}</span>
                  {isMe && !isDeletedEveryone && (
                    msg.status === 'read' ? (
                      <CheckCheck size={14} className="text-[#53bdeb]" />
                    ) : msg.status === 'delivered' ? (
                      <CheckCheck size={14} className="text-gray-400" />
                    ) : (
                      <Check size={14} className="text-gray-400" />
                    )
                  )}
                </div>

                {/* Emoji Reactions Cluster */}
                {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                  <div className="absolute -bottom-3 right-2 flex items-center gap-1 bg-[#202c33] dark:bg-[#111b21] border border-gray-700 rounded-full px-2 py-0.5 text-xs shadow-md z-10 cursor-pointer">
                    {Object.entries(msg.reactions).map(([emoji, userIds]) => (
                      <span
                        key={emoji}
                        onClick={() => onReactMessage(msg.id, emoji)}
                        title={`${userIds.length} reaction(s)`}
                        className="hover:scale-125 transition-transform"
                      >
                        {emoji} {userIds.length > 1 && <span className="text-[10px] text-gray-300">{userIds.length}</span>}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Message Hover Quick Actions Menu */}
              {!isDeletedEveryone && (
                <div
                  className={`opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 mt-1 px-1 text-gray-400 ${
                    isMe ? 'flex-row-reverse' : 'flex-row'
                  }`}
                >
                  {/* Quick Reactions */}
                  <div className="flex items-center gap-1 bg-[#202c33] border border-[#313d45] rounded-full px-2 py-1 shadow-lg text-xs">
                    {['👍', '❤️', '😂', '😮', '😢', '🙏'].map(em => (
                      <button
                        key={em}
                        onClick={() => onReactMessage(msg.id, em)}
                        className="hover:scale-125 transition-transform px-0.5"
                      >
                        {em}
                      </button>
                    ))}
                  </div>

                  {/* Reply */}
                  <button
                    onClick={() => setReplyingTo(msg)}
                    className="p-1 rounded-full hover:bg-black/10 dark:hover:bg-white/10 hover:text-white"
                    title="Reply"
                  >
                    <CornerUpLeft size={14} />
                  </button>

                  {/* Pin / Unpin */}
                  <button
                    onClick={() => onPinMessage(msg.id, !msg.isPinned)}
                    className="p-1 rounded-full hover:bg-black/10 dark:hover:bg-white/10 hover:text-[#00a884]"
                    title={msg.isPinned ? 'Unpin' : 'Pin'}
                  >
                    <Pin size={14} />
                  </button>

                  {/* Copy text */}
                  {msg.type === 'text' && (
                    <button
                      onClick={() => copyToClipboard(msg.content)}
                      className="p-1 rounded-full hover:bg-black/10 dark:hover:bg-white/10 hover:text-white"
                      title="Copy"
                    >
                      <Copy size={14} />
                    </button>
                  )}

                  {/* Edit (only if sender and within reasonable time) */}
                  {isMe && msg.type === 'text' && (
                    <button
                      onClick={() => {
                        setEditingMessage(msg);
                        setInputText(msg.content);
                      }}
                      className="p-1 rounded-full hover:bg-black/10 dark:hover:bg-white/10 hover:text-white"
                      title="Edit"
                    >
                      <Edit2 size={14} />
                    </button>
                  )}

                  {/* Delete options */}
                  <button
                    onClick={() => {
                      if (isMe) {
                        const forEveryone = confirm('Delete for everyone? Press Cancel to delete only for you.');
                        onDeleteMessage(msg.id, forEveryone);
                      } else {
                        onDeleteMessage(msg.id, false);
                      }
                    }}
                    className="p-1 rounded-full hover:bg-black/10 dark:hover:bg-white/10 hover:text-red-500"
                    title="Delete"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              )}
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Copy notification toast */}
      {copiedToast && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 bg-[#00a884] text-white px-4 py-1.5 rounded-full text-xs font-semibold shadow-lg z-40">
          Message copied to clipboard!
        </div>
      )}

      {/* Reply bar above composer */}
      {replyingTo && (
        <div
          className={`px-4 py-2 border-t flex items-center justify-between ${
            isDark ? 'bg-[#202c33] border-[#222d34]' : 'bg-gray-100 border-gray-200'
          }`}
        >
          <div className="flex items-center gap-2 truncate">
            <CornerUpLeft size={14} className="text-[#00a884]" />
            <div className="truncate text-xs">
              <span className="font-semibold text-[#00a884]">{replyingTo.senderName}: </span>
              <span className="text-gray-400">{replyingTo.content}</span>
            </div>
          </div>
          <button onClick={() => setReplyingTo(null)} className="p-1 text-gray-400 hover:text-white">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Editing bar above composer */}
      {editingMessage && (
        <div
          className={`px-4 py-2 border-t flex items-center justify-between ${
            isDark ? 'bg-[#202c33] border-[#222d34]' : 'bg-gray-100 border-gray-200'
          }`}
        >
          <div className="flex items-center gap-2 text-xs">
            <Edit2 size={14} className="text-[#00a884]" />
            <span className="font-semibold text-[#00a884]">Editing message</span>
          </div>
          <button
            onClick={() => {
              setEditingMessage(null);
              setInputText('');
            }}
            className="p-1 text-gray-400 hover:text-white"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Emoji Picker Popup */}
      {showEmojiPicker && (
        <EmojiPicker
          onSelect={emoji => {
            setInputText(prev => prev + emoji);
          }}
          onClose={() => setShowEmojiPicker(false)}
          isDark={isDark}
        />
      )}

      {/* Media Preview Modal */}
      {selectedFileForPreview && (
        <MediaPreviewModal
          file={selectedFileForPreview}
          onSend={handleMediaSend}
          onClose={() => setSelectedFileForPreview(null)}
          isDark={isDark}
        />
      )}

      {/* Hidden File Inputs */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*,video/*"
        onChange={e => {
          if (e.target.files?.[0]) setSelectedFileForPreview(e.target.files[0]);
        }}
        className="hidden"
      />
      <input
        type="file"
        ref={docInputRef}
        accept=".pdf,.doc,.docx,.txt,.zip,.xls,.xlsx"
        onChange={e => {
          if (e.target.files?.[0]) setSelectedFileForPreview(e.target.files[0]);
        }}
        className="hidden"
      />

      {/* Bottom Composer Bar */}
      <div
        className={`p-3 px-4 flex items-center gap-3 border-t relative z-20 ${
          isDark ? 'bg-[#202c33] border-[#222d34]' : 'bg-[#f0f2f5] border-gray-200'
        }`}
      >
        {isRecording ? (
          /* Live Voice Recording UI */
          <div className="flex-1 flex items-center justify-between px-4 py-2 rounded-2xl bg-red-500/10 border border-red-500/30">
            <div className="flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-red-500 animate-ping" />
              <span className="text-sm font-semibold font-mono text-red-500">
                {formatDuration(recordingDuration)}
              </span>
              <span className="text-xs text-gray-400">Recording voice message...</span>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={cancelRecording}
                className="p-2 rounded-full hover:bg-red-500/20 text-red-500 transition-colors"
                title="Cancel recording"
              >
                <Trash2 size={18} />
              </button>
              <button
                onClick={stopAndSendRecording}
                className="p-2.5 rounded-full bg-[#00a884] text-white hover:bg-[#02906f] shadow-md transition-transform active:scale-95"
                title="Send voice message"
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        ) : (
          /* Standard Input Composer */
          <>
            {/* Emoji Trigger */}
            <button
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="p-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
              title="Emojis"
            >
              <Smile size={24} />
            </button>

            {/* Attachment Dropdown Trigger */}
            <div className="relative group">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                title="Attach photo/video"
              >
                <Paperclip size={22} />
              </button>
            </div>

            {/* Document Trigger */}
            <button
              onClick={() => docInputRef.current?.click()}
              className="p-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10 text-gray-400 hover:text-white transition-colors hidden sm:block"
              title="Attach Document (PDF, ZIP, DOCX)"
            >
              <FileText size={20} />
            </button>

            {/* Message Text Input */}
            <textarea
              value={inputText}
              onChange={handleInputChange}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendTextMessage();
                }
              }}
              placeholder="Type a message"
              rows={1}
              className={`flex-1 px-4 py-2.5 rounded-2xl text-sm outline-none resize-none max-h-32 ${
                isDark
                  ? 'bg-[#2a3942] text-white placeholder-gray-400'
                  : 'bg-white text-gray-900 border border-gray-200 placeholder-gray-400'
              }`}
            />

            {/* Send or Voice Record Button */}
            {inputText.trim() || editingMessage ? (
              <button
                onClick={handleSendTextMessage}
                className="w-11 h-11 rounded-full bg-[#00a884] hover:bg-[#02906f] text-white flex items-center justify-center shadow-lg transition-transform active:scale-95"
                title="Send"
              >
                <Send size={18} className="translate-x-0.5" />
              </button>
            ) : (
              <button
                onClick={startRecording}
                className="w-11 h-11 rounded-full bg-[#00a884] hover:bg-[#02906f] text-white flex items-center justify-center shadow-lg transition-transform active:scale-95"
                title="Record voice note"
              >
                <Mic size={20} />
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
};
