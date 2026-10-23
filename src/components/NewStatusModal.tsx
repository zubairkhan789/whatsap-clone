import React, { useState, useRef } from 'react';
import { X, Type, Image as ImageIcon, Send, Palette } from 'lucide-react';

interface NewStatusModalProps {
  onClose: () => void;
  onSubmit: (statusData: {
    type: 'text' | 'image';
    content?: string;
    mediaUrl?: string;
    caption?: string;
    bgColor?: string;
  }) => void;
  isDark: boolean;
}

const BG_COLORS = [
  '#005c4b', // classic WA dark teal
  '#7a3ef0', // purple
  '#2a69ac', // blue
  '#b33939', // crimson
  '#d35400', // orange
  '#2c3e50', // dark navy
  '#16a085', // cyan green
];

export const NewStatusModal: React.FC<NewStatusModalProps> = ({
  onClose,
  onSubmit,
  isDark,
}) => {
  const [tab, setTab] = useState<'text' | 'media'>('text');
  const [textContent, setTextContent] = useState('');
  const [colorIndex, setColorIndex] = useState(0);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setMediaFile(file);
      const reader = new FileReader();
      reader.onload = () => setMediaPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = () => {
    if (tab === 'text') {
      if (!textContent.trim()) return;
      onSubmit({
        type: 'text',
        content: textContent.trim(),
        bgColor: BG_COLORS[colorIndex],
      });
    } else {
      if (!mediaPreview) return;
      onSubmit({
        type: 'image',
        mediaUrl: mediaPreview,
        caption: caption.trim() || undefined,
      });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div
        className={`w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl flex flex-col ${
          isDark ? 'bg-[#202c33] text-gray-200' : 'bg-white text-gray-800'
        }`}
      >
        {/* Header Tabs */}
        <div className={`flex items-center justify-between p-4 border-b ${isDark ? 'border-[#313d45]' : 'border-gray-200'}`}>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setTab('text')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                tab === 'text'
                  ? 'bg-[#00a884] text-white'
                  : isDark
                  ? 'text-gray-400 hover:bg-white/5'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Type size={16} />
              <span>Text Status</span>
            </button>
            <button
              onClick={() => {
                setTab('media');
                fileInputRef.current?.click();
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                tab === 'media'
                  ? 'bg-[#00a884] text-white'
                  : isDark
                  ? 'text-gray-400 hover:bg-white/5'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <ImageIcon size={16} />
              <span>Photo / Media</span>
            </button>
          </div>

          <button onClick={onClose} className="p-1 rounded-full hover:bg-black/10 dark:hover:bg-white/10">
            <X size={20} />
          </button>
        </div>

        {/* Status Content Preview */}
        {tab === 'text' ? (
          <div
            className="h-80 flex flex-col items-center justify-center p-6 relative transition-colors duration-300"
            style={{ backgroundColor: BG_COLORS[colorIndex] }}
          >
            <textarea
              placeholder="Type a status..."
              value={textContent}
              onChange={e => setTextContent(e.target.value)}
              maxLength={400}
              className="w-full bg-transparent text-white text-2xl font-medium text-center outline-none resize-none placeholder-white/60 leading-relaxed font-sans"
              rows={4}
              autoFocus
            />

            {/* Color Palette Switcher */}
            <button
              onClick={() => setColorIndex((colorIndex + 1) % BG_COLORS.length)}
              className="absolute bottom-4 right-4 p-2.5 rounded-full bg-black/40 hover:bg-black/60 text-white shadow-lg transition-transform active:scale-95"
              title="Change Background Color"
            >
              <Palette size={18} />
            </button>
          </div>
        ) : (
          <div className="h-80 bg-black flex flex-col items-center justify-center p-4 relative">
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
            {mediaPreview ? (
              <div className="w-full h-full flex flex-col items-center justify-center">
                <img
                  src={mediaPreview}
                  alt="Status preview"
                  className="max-h-56 max-w-full object-contain rounded-lg"
                />
                <input
                  type="text"
                  placeholder="Add a caption..."
                  value={caption}
                  onChange={e => setCaption(e.target.value)}
                  className="w-full mt-3 px-3 py-1.5 rounded-lg bg-white/20 text-white placeholder-white/60 text-sm outline-none"
                />
              </div>
            ) : (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center gap-2 text-gray-400 hover:text-white"
              >
                <ImageIcon size={48} className="text-[#00a884]" />
                <span className="text-sm font-medium">Click to select photo</span>
              </button>
            )}
          </div>
        )}

        {/* Footer Submit */}
        <div className={`p-4 flex items-center justify-between border-t ${isDark ? 'border-[#313d45] bg-[#111b21]' : 'border-gray-200 bg-gray-50'}`}>
          <span className="text-xs text-gray-400">Status will expire after 24 hours</span>
          <button
            onClick={handleSubmit}
            disabled={tab === 'text' ? !textContent.trim() : !mediaPreview}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#00a884] hover:bg-[#02906f] disabled:opacity-50 text-white font-medium text-sm shadow-md transition-transform active:scale-95"
          >
            <Send size={16} />
            <span>Send Status</span>
          </button>
        </div>
      </div>
    </div>
  );
};
