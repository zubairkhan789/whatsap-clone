import React, { useState } from 'react';
import { X, Send, FileText, Image as ImageIcon, Video as VideoIcon } from 'lucide-react';

interface MediaPreviewModalProps {
  file: File;
  onSend: (file: File, caption: string) => void;
  onClose: () => void;
  isDark: boolean;
}

export const MediaPreviewModal: React.FC<MediaPreviewModalProps> = ({
  file,
  onSend,
  onClose,
  isDark,
}) => {
  const [caption, setCaption] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string>(() => {
    return URL.createObjectURL(file);
  });

  const isImage = file.type.startsWith('image/');
  const isVideo = file.type.startsWith('video/');
  const isAudio = file.type.startsWith('audio/');

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  };

  const handleSend = () => {
    onSend(file, caption);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div
        className={`w-full max-w-xl rounded-2xl overflow-hidden flex flex-col shadow-2xl ${
          isDark ? 'bg-[#202c33] text-gray-200' : 'bg-white text-gray-800'
        }`}
      >
        {/* Header */}
        <div className={`flex items-center justify-between p-4 border-b ${isDark ? 'border-[#313d45]' : 'border-gray-200'}`}>
          <div className="flex items-center gap-2">
            {isImage && <ImageIcon size={20} className="text-[#00a884]" />}
            {isVideo && <VideoIcon size={20} className="text-[#00a884]" />}
            {!isImage && !isVideo && <FileText size={20} className="text-[#00a884]" />}
            <span className="font-semibold text-sm truncate max-w-[320px]">{file.name}</span>
            <span className="text-xs text-gray-400">({formatFileSize(file.size)})</span>
          </div>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-black/10 dark:hover:bg-white/10">
            <X size={20} />
          </button>
        </div>

        {/* Media Preview Area */}
        <div className="flex-1 min-h-[300px] max-h-[460px] bg-black/90 flex items-center justify-center p-4 overflow-hidden relative">
          {isImage ? (
            <img
              src={previewUrl}
              alt="Preview"
              className="max-h-[420px] max-w-full object-contain rounded-lg shadow-md"
            />
          ) : isVideo ? (
            <video
              src={previewUrl}
              controls
              className="max-h-[420px] max-w-full rounded-lg shadow-md"
            />
          ) : (
            <div className="flex flex-col items-center justify-center gap-3 text-white p-8">
              <FileText size={64} className="text-[#00a884]" />
              <div className="text-center">
                <p className="font-medium text-lg">{file.name}</p>
                <p className="text-sm text-gray-400">{formatFileSize(file.size)} • {file.type || 'Document'}</p>
              </div>
            </div>
          )}
        </div>

        {/* Caption and Send Bar */}
        <div className={`p-4 flex items-center gap-3 border-t ${isDark ? 'border-[#313d45] bg-[#111b21]' : 'border-gray-200 bg-gray-50'}`}>
          <input
            type="text"
            placeholder="Add a caption..."
            value={caption}
            onChange={e => setCaption(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') handleSend();
            }}
            className={`flex-1 px-4 py-2.5 rounded-full text-sm outline-none ${
              isDark ? 'bg-[#2a3942] text-white placeholder-gray-400' : 'bg-white text-gray-900 border border-gray-200'
            }`}
            autoFocus
          />
          <button
            onClick={handleSend}
            className="w-11 h-11 rounded-full bg-[#00a884] hover:bg-[#02906f] text-white flex items-center justify-center shadow-lg transition-transform active:scale-95"
            title="Send"
          >
            <Send size={18} className="translate-x-0.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
