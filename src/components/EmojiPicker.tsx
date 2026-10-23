import React, { useState } from 'react';
import { Smile, Heart, Coffee, Globe, Compass, Music, Flag, Search, X } from 'lucide-react';

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
  onClose: () => void;
  isDark: boolean;
}

const EMOJI_CATEGORIES = [
  {
    name: 'Smileys',
    icon: Smile,
    emojis: [
      '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇',
      '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚',
      '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩',
      '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣',
      '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬',
      '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗',
      '🤔', '🤭', '🤫', '🤥', '😶', '😐', '😑', '😬', '🙄', '😯',
    ],
  },
  {
    name: 'Gestures',
    icon: Heart,
    emojis: [
      '👍', '👎', '👌', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉',
      '👆', '🖕', '👇', '☝️', '👋', '🤚', '🖐️', '✋', '🖖', '👏',
      '🙌', '👐', '🤲', '🤝', '🙏', '✍️', '💪', '❤️', '🧡', '💛',
      '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞',
      '💓', '💗', '💖', '💘', '💝', '💟', '🔥', '✨', '🌟', '💫',
    ],
  },
  {
    name: 'Food & Drink',
    icon: Coffee,
    emojis: [
      '🍏', '🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🫐',
      '🍈', '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🥑', '🥦',
      '🍔', '🍟', '🍕', '🌭', '🥪', '🌮', '🌯', '🥙', '🍜', '🍝',
      '🍣', '🍱', '🍩', '🍪', '🎂', '🍰', '🧁', '🍫', '🍿', '☕',
      '🍵', '🧃', '🥤', '🧋', '🍺', '🍻', '🥂', '🍷', '🍹', '🍸',
    ],
  },
  {
    name: 'Activities & Travel',
    icon: Compass,
    emojis: [
      '⚽', '🏀', '🏈', '⚾', '🎾', '🏐', '🏉', '🎱', '🏓', '🏸',
      '🥅', '🥊', '🥋', '🎯', '⛳', '🎮', '🕹️', '🎲', '🧩', '🚗',
      '🚕', '🚙', '🚌', '🚎', '🏎️', '🚓', '🚑', '🚒', '✈️', '🚀',
      '🛸', '🚁', '🛶', '⛵', '🚤', '🛳️', '🏝️', '🏖️', '⛰️', '⛺',
    ],
  },
  {
    name: 'Objects & Symbols',
    icon: Music,
    emojis: [
      '💻', '🖥️', '📱', '⌚', '📷', '📹', '🎥', '💡', '🔦', '📖',
      '📚', '💰', '💵', '💳', '💎', '🔑', '🔒', '🔔', '📢', '🎉',
      '🎊', '🎈', '🎁', '🏆', '🥇', '🥈', '🥉', '⚡', '☀️', '🌙',
      '⭐', '💯', '✔️', '❌', '❓', '❗', '💬', '💭', '🚀', '🌈',
    ],
  },
];

export const EmojiPicker: React.FC<EmojiPickerProps> = ({ onSelect, onClose, isDark }) => {
  const [activeCategory, setActiveCategory] = useState(0);
  const [search, setSearch] = useState('');

  const filteredEmojis = search
    ? EMOJI_CATEGORIES.flatMap(c => c.emojis).filter(e => e.includes(search))
    : EMOJI_CATEGORIES[activeCategory].emojis;

  return (
    <div
      className={`absolute bottom-16 left-3 w-80 md:w-96 rounded-xl shadow-2xl border flex flex-col z-50 overflow-hidden ${
        isDark ? 'bg-[#202c33] border-[#313d45] text-gray-200' : 'bg-white border-gray-200 text-gray-800'
      }`}
      style={{ height: '360px' }}
    >
      {/* Search Header */}
      <div className={`p-2.5 border-b flex items-center gap-2 ${isDark ? 'border-[#313d45] bg-[#111b21]' : 'border-gray-200 bg-gray-50'}`}>
        <Search size={16} className={isDark ? 'text-gray-400' : 'text-gray-500'} />
        <input
          type="text"
          placeholder="Search emojis..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className={`flex-1 text-sm bg-transparent outline-none ${isDark ? 'text-white' : 'text-gray-900'}`}
          autoFocus
        />
        {search && (
          <button onClick={() => setSearch('')} className="text-gray-400 hover:text-gray-200">
            <X size={14} />
          </button>
        )}
      </div>

      {/* Categories Bar */}
      {!search && (
        <div className={`flex items-center px-2 py-1.5 border-b gap-1 overflow-x-auto ${isDark ? 'border-[#313d45] bg-[#1a242a]' : 'border-gray-200 bg-gray-100'}`}>
          {EMOJI_CATEGORIES.map((cat, idx) => {
            const Icon = cat.icon;
            const isActive = activeCategory === idx;
            return (
              <button
                key={cat.name}
                onClick={() => setActiveCategory(idx)}
                className={`p-1.5 rounded-lg text-xs flex items-center gap-1 transition-colors ${
                  isActive
                    ? 'bg-[#00a884] text-white'
                    : isDark
                    ? 'text-gray-400 hover:text-gray-200 hover:bg-[#253238]'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
                }`}
                title={cat.name}
              >
                <Icon size={16} />
              </button>
            );
          })}
        </div>
      )}

      {/* Emoji Grid */}
      <div className="flex-1 overflow-y-auto p-3 grid grid-cols-8 gap-1.5 content-start">
        {filteredEmojis.map((emoji, idx) => (
          <button
            key={idx}
            onClick={() => onSelect(emoji)}
            className="text-2xl hover:scale-125 transition-transform p-1.5 rounded-lg flex items-center justify-center hover:bg-black/10 dark:hover:bg-white/10"
          >
            {emoji}
          </button>
        ))}
        {filteredEmojis.length === 0 && (
          <div className="col-span-8 py-8 text-center text-sm text-gray-400">
            No emojis found for "{search}"
          </div>
        )}
      </div>
    </div>
  );
};
