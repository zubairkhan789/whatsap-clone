import React, { useState } from 'react';
import {
  X,
  User as UserIcon,
  Shield,
  Bell,
  Moon,
  Sun,
  Lock,
  LogOut,
  Camera,
  Check,
  CheckCheck,
} from 'lucide-react';
import { User } from '../types';

interface SettingsModalProps {
  currentUser: User;
  onUpdateUser: (updatedUser: Partial<User>) => Promise<void>;
  onLogout: () => void;
  onClose: () => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  isDark: boolean;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  currentUser,
  onUpdateUser,
  onLogout,
  onClose,
  theme,
  onToggleTheme,
  isDark,
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'privacy' | 'notifications' | 'theme' | 'security'>('profile');
  
  // Profile edit state
  const [name, setName] = useState(currentUser.name);
  const [about, setAbout] = useState(currentUser.about);
  const [phone, setPhone] = useState(currentUser.phone);
  const [avatar, setAvatar] = useState(currentUser.avatar);

  // Privacy state
  const [lastSeenPrivacy, setLastSeenPrivacy] = useState(currentUser.privacy.lastSeen);
  const [onlinePrivacy, setOnlinePrivacy] = useState(currentUser.privacy.online);
  const [readReceipts, setReadReceipts] = useState(currentUser.privacy.readReceipts);

  // Notifications
  const [notificationSound, setNotificationSound] = useState(true);
  const [notificationPermission, setNotificationPermission] = useState(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );

  // Security / Password
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState('');

  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      await onUpdateUser({
        name,
        about,
        phone,
        avatar,
        privacy: {
          lastSeen: lastSeenPrivacy,
          online: onlinePrivacy,
          readReceipts,
          profilePhoto: currentUser.privacy.profilePhoto,
        },
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (reader.result) setAvatar(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const requestBrowserNotifications = async () => {
    if (typeof Notification !== 'undefined') {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword) return;
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: currentUser.email, newPassword }),
      });
      if (res.ok) {
        setPasswordMsg('Password changed successfully!');
        setOldPassword('');
        setNewPassword('');
        setTimeout(() => setPasswordMsg(''), 3000);
      }
    } catch {
      setPasswordMsg('Failed to update password');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div
        className={`w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row h-[560px] border ${
          isDark
            ? 'bg-[#111b21] border-[#313d45] text-gray-200'
            : 'bg-white border-gray-200 text-gray-800'
        }`}
      >
        {/* Sidebar Nav */}
        <div
          className={`w-full md:w-56 p-4 border-r flex flex-col justify-between ${
            isDark ? 'border-[#313d45] bg-[#1a242a]' : 'border-gray-200 bg-gray-50'
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-lg text-[#00a884]">Settings</h2>
              <button
                onClick={onClose}
                className="md:hidden p-1 rounded-full hover:bg-black/10 dark:hover:bg-white/10"
              >
                <X size={18} />
              </button>
            </div>

            <nav className="space-y-1">
              {[
                { id: 'profile', label: 'Profile', icon: UserIcon },
                { id: 'privacy', label: 'Privacy', icon: Shield },
                { id: 'notifications', label: 'Notifications', icon: Bell },
                { id: 'theme', label: 'Appearance', icon: isDark ? Moon : Sun },
                { id: 'security', label: 'Security', icon: Lock },
              ].map(item => {
                const Icon = item.icon;
                const active = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id as any)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                      active
                        ? 'bg-[#00a884] text-white shadow-sm'
                        : isDark
                        ? 'text-gray-300 hover:bg-[#202c33]'
                        : 'text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <Icon size={18} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          <button
            onClick={onLogout}
            className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-500/10 transition-colors mt-4"
          >
            <LogOut size={18} />
            <span>Log Out</span>
          </button>
        </div>

        {/* Content Pane */}
        <div className="flex-1 flex flex-col justify-between overflow-hidden">
          {/* Header */}
          <div className={`p-4 border-b flex items-center justify-between ${isDark ? 'border-[#313d45]' : 'border-gray-200'}`}>
            <h3 className="font-semibold text-base capitalize">{activeTab} Settings</h3>
            <button
              onClick={onClose}
              className="p-1 rounded-full hover:bg-black/10 dark:hover:bg-white/10 hidden md:block"
            >
              <X size={18} />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 p-6 overflow-y-auto space-y-5">
            {activeTab === 'profile' && (
              <div className="space-y-4">
                <div className="flex flex-col items-center mb-4">
                  <div className="relative group cursor-pointer">
                    <img
                      src={avatar}
                      alt={name}
                      className="w-24 h-24 rounded-full object-cover ring-4 ring-[#00a884]"
                    />
                    <label className="absolute inset-0 bg-black/50 rounded-full flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                      <Camera size={20} />
                      <span className="text-[10px] mt-1">Change</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                  <p className="text-xs text-gray-400 mt-2">Click to upload custom avatar</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1">Display Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl text-sm outline-none border ${
                      isDark
                        ? 'bg-[#202c33] border-[#313d45] text-white focus:border-[#00a884]'
                        : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-[#00a884]'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1">About / Bio</label>
                  <input
                    type="text"
                    value={about}
                    onChange={e => setAbout(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl text-sm outline-none border ${
                      isDark
                        ? 'bg-[#202c33] border-[#313d45] text-white focus:border-[#00a884]'
                        : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-[#00a884]'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl text-sm outline-none border ${
                      isDark
                        ? 'bg-[#202c33] border-[#313d45] text-white focus:border-[#00a884]'
                        : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-[#00a884]'
                    }`}
                  />
                </div>
              </div>
            )}

            {activeTab === 'privacy' && (
              <div className="space-y-4">
                <div className={`p-4 rounded-xl border ${isDark ? 'border-[#313d45] bg-[#202c33]' : 'border-gray-200 bg-gray-50'}`}>
                  <label className="block text-sm font-semibold mb-1">Last Seen Visibility</label>
                  <p className="text-xs text-gray-400 mb-2">Control who can see your last seen timestamp.</p>
                  <select
                    value={lastSeenPrivacy}
                    onChange={e => setLastSeenPrivacy(e.target.value as any)}
                    className={`w-full px-3 py-2 rounded-lg text-sm outline-none border ${
                      isDark ? 'bg-[#111b21] border-[#313d45] text-white' : 'bg-white border-gray-200 text-gray-900'
                    }`}
                  >
                    <option value="everyone">Everyone</option>
                    <option value="contacts">My Contacts</option>
                    <option value="nobody">Nobody</option>
                  </select>
                </div>

                <div className={`p-4 rounded-xl border ${isDark ? 'border-[#313d45] bg-[#202c33]' : 'border-gray-200 bg-gray-50'}`}>
                  <label className="block text-sm font-semibold mb-1">Online Status Visibility</label>
                  <p className="text-xs text-gray-400 mb-2">Who can see when you are active and online.</p>
                  <select
                    value={onlinePrivacy}
                    onChange={e => setOnlinePrivacy(e.target.value as any)}
                    className={`w-full px-3 py-2 rounded-lg text-sm outline-none border ${
                      isDark ? 'bg-[#111b21] border-[#313d45] text-white' : 'bg-white border-gray-200 text-gray-900'
                    }`}
                  >
                    <option value="everyone">Everyone</option>
                    <option value="nobody">Same as last seen</option>
                  </select>
                </div>

                <div className={`p-4 rounded-xl border flex items-center justify-between ${isDark ? 'border-[#313d45] bg-[#202c33]' : 'border-gray-200 bg-gray-50'}`}>
                  <div>
                    <h4 className="text-sm font-semibold flex items-center gap-1.5">
                      <CheckCheck size={16} className="text-[#00a884]" />
                      <span>Read Receipts</span>
                    </h4>
                    <p className="text-xs text-gray-400">If turned off, you won't send or receive read receipts (blue ticks).</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={readReceipts}
                    onChange={e => setReadReceipts(e.target.checked)}
                    className="w-5 h-5 accent-[#00a884] rounded cursor-pointer"
                  />
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="space-y-4">
                <div className={`p-4 rounded-xl border flex items-center justify-between ${isDark ? 'border-[#313d45] bg-[#202c33]' : 'border-gray-200 bg-gray-50'}`}>
                  <div>
                    <h4 className="text-sm font-semibold">Message & Call Sounds</h4>
                    <p className="text-xs text-gray-400">Play audio chimes for incoming messages and ringtones.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notificationSound}
                    onChange={e => setNotificationSound(e.target.checked)}
                    className="w-5 h-5 accent-[#00a884] rounded cursor-pointer"
                  />
                </div>

                <div className={`p-4 rounded-xl border ${isDark ? 'border-[#313d45] bg-[#202c33]' : 'border-gray-200 bg-gray-50'}`}>
                  <h4 className="text-sm font-semibold mb-1">Desktop / Browser Notifications</h4>
                  <p className="text-xs text-gray-400 mb-3">
                    Status: <span className="font-semibold text-[#00a884]">{notificationPermission}</span>
                  </p>
                  {notificationPermission !== 'granted' && (
                    <button
                      onClick={requestBrowserNotifications}
                      className="px-4 py-2 rounded-xl bg-[#00a884] text-white text-xs font-semibold hover:bg-[#02906f] transition-colors"
                    >
                      Enable Browser Notifications
                    </button>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'theme' && (
              <div className="space-y-4">
                <div className={`p-4 rounded-xl border ${isDark ? 'border-[#313d45] bg-[#202c33]' : 'border-gray-200 bg-gray-50'}`}>
                  <h4 className="text-sm font-semibold mb-1">Theme Preference</h4>
                  <p className="text-xs text-gray-400 mb-4">Choose between clean light or comfortable dark theme.</p>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => {
                        if (theme === 'dark') onToggleTheme();
                      }}
                      className={`p-4 rounded-xl border flex flex-col items-center gap-2 ${
                        theme === 'light'
                          ? 'border-[#00a884] bg-emerald-50 text-emerald-800'
                          : 'border-gray-300 text-gray-500'
                      }`}
                    >
                      <Sun size={24} className="text-amber-500" />
                      <span className="text-xs font-semibold">Light Theme</span>
                    </button>
                    <button
                      onClick={() => {
                        if (theme === 'light') onToggleTheme();
                      }}
                      className={`p-4 rounded-xl border flex flex-col items-center gap-2 ${
                        theme === 'dark'
                          ? 'border-[#00a884] bg-[#202c33] text-white'
                          : 'border-gray-300 text-gray-500'
                      }`}
                    >
                      <Moon size={24} className="text-indigo-400" />
                      <span className="text-xs font-semibold">Dark Theme</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <form onSubmit={handlePasswordChange} className="space-y-4">
                {passwordMsg && (
                  <div className="p-3 rounded-xl bg-[#00a884]/20 border border-[#00a884] text-[#00a884] text-xs">
                    {passwordMsg}
                  </div>
                )}
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1">New Password</label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    className={`w-full px-3 py-2 rounded-xl text-sm outline-none border ${
                      isDark
                        ? 'bg-[#202c33] border-[#313d45] text-white focus:border-[#00a884]'
                        : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-[#00a884]'
                    }`}
                  />
                </div>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#00a884] hover:bg-[#02906f] text-white text-xs font-semibold"
                >
                  Update Password
                </button>
              </form>
            )}
          </div>

          {/* Footer Save Button */}
          <div className={`p-4 border-t flex items-center justify-between ${isDark ? 'border-[#313d45] bg-[#1a242a]' : 'border-gray-200 bg-gray-50'}`}>
            <span className="text-xs text-gray-400">
              {savedSuccess ? 'Settings saved successfully! ✓' : ''}
            </span>
            <button
              onClick={handleSaveProfile}
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#00a884] hover:bg-[#02906f] text-white font-semibold text-xs shadow-md transition-all active:scale-95 disabled:opacity-50"
            >
              <Check size={16} />
              <span>{saving ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
