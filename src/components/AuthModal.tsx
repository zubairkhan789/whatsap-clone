import React, { useState } from 'react';
import { Lock, Mail, User as UserIcon, Phone, KeyRound, Sparkles, LogIn, ArrowRight } from 'lucide-react';
import { User } from '../types';

interface AuthModalProps {
  onSuccess: (user: User, token: string) => void;
  isDark: boolean;
}

export const AuthModal: React.FC<AuthModalProps> = ({ onSuccess, isDark }) => {
  const [tab, setTab] = useState<'login' | 'signup' | 'reset'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [about, setAbout] = useState('Available | Let’s chat 💬');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      if (tab === 'login') {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to sign in');
        onSuccess(data.user, data.token);
      } else if (tab === 'signup') {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name,
            email,
            password,
            phone,
            about,
            avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name || 'user')}`,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to sign up');
        onSuccess(data.user, data.token);
      } else if (tab === 'reset') {
        const res = await fetch('/api/auth/reset-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, newPassword: password }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to reset password');
        setSuccessMsg('Password reset successfully! You can now log in.');
        setTimeout(() => setTab('login'), 1500);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('password123');
    setTab('login');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div
        className={`w-full max-w-md rounded-3xl overflow-hidden shadow-2xl flex flex-col border ${
          isDark
            ? 'bg-[#111b21] border-[#313d45] text-gray-200'
            : 'bg-white border-gray-200 text-gray-800'
        }`}
      >
        {/* WhatsApp Brand Banner */}
        <div className="bg-[#00a884] p-6 text-white text-center relative overflow-hidden">
          <div className="w-16 h-16 mx-auto bg-white/20 rounded-full flex items-center justify-center mb-3 backdrop-blur-md">
            <svg
              className="w-10 h-10 fill-white"
              viewBox="0 0 24 24"
            >
              <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2zm.05 16.75c-1.49 0-2.95-.41-4.23-1.18l-.3-.18-3.13.82.84-3.05-.2-.31a8.196 8.196 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.24-8.24 2.2 0 4.27.86 5.83 2.42a8.18 8.18 0 0 1 2.41 5.83c.02 4.54-3.67 8.24-8.21 8.24zm4.51-6.17c-.25-.12-1.47-.72-1.7-.81-.23-.08-.39-.12-.56.12-.17.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.12-1.05-.39-2-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.02-.38.11-.5.11-.11.25-.29.37-.43.12-.14.17-.25.25-.41.08-.17.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.4-.42-.56-.43h-.48c-.17 0-.43.06-.66.31-.22.25-.86.84-.86 2.05 0 1.21.88 2.38 1 2.55.12.17 1.74 2.65 4.21 3.72.59.25 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.68-1.18.21-.58.21-1.07.15-1.18-.07-.1-.23-.17-.48-.29z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold tracking-tight">WhatsApp Web</h2>
          <p className="text-xs text-emerald-100 mt-1">
            Simple. Secure. Reliable messaging.
          </p>
        </div>

        {/* Auth Tabs */}
        <div className={`flex border-b text-xs font-semibold ${isDark ? 'border-[#313d45] bg-[#1a242a]' : 'border-gray-200 bg-gray-50'}`}>
          <button
            onClick={() => { setTab('login'); setError(''); }}
            className={`flex-1 py-3 text-center transition-colors ${
              tab === 'login'
                ? 'text-[#00a884] border-b-2 border-[#00a884] bg-transparent'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            Log In
          </button>
          <button
            onClick={() => { setTab('signup'); setError(''); }}
            className={`flex-1 py-3 text-center transition-colors ${
              tab === 'signup'
                ? 'text-[#00a884] border-b-2 border-[#00a884] bg-transparent'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            Create Account
          </button>
          <button
            onClick={() => { setTab('reset'); setError(''); }}
            className={`flex-1 py-3 text-center transition-colors ${
              tab === 'reset'
                ? 'text-[#00a884] border-b-2 border-[#00a884] bg-transparent'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            Reset
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 text-xs">
              {error}
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/30 text-green-500 text-xs">
              {successMsg}
            </div>
          )}

          {tab === 'signup' && (
            <>
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1">Full Name</label>
                <div className="relative">
                  <UserIcon size={16} className="absolute left-3 top-3 text-gray-400" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="e.g. John Doe"
                    className={`w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none border ${
                      isDark
                        ? 'bg-[#202c33] border-[#313d45] text-white focus:border-[#00a884]'
                        : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-[#00a884]'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1">Phone Number (Optional)</label>
                <div className="relative">
                  <Phone size={16} className="absolute left-3 top-3 text-gray-400" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="+1 (555) 000-0000"
                    className={`w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none border ${
                      isDark
                        ? 'bg-[#202c33] border-[#313d45] text-white focus:border-[#00a884]'
                        : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-[#00a884]'
                    }`}
                  />
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1">Email Address</label>
            <div className="relative">
              <Mail size={16} className="absolute left-3 top-3 text-gray-400" />
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="name@example.com"
                className={`w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none border ${
                  isDark
                    ? 'bg-[#202c33] border-[#313d45] text-white focus:border-[#00a884]'
                    : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-[#00a884]'
                }`}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1">
              {tab === 'reset' ? 'New Password' : 'Password'}
            </label>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-3 text-gray-400" />
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className={`w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none border ${
                  isDark
                    ? 'bg-[#202c33] border-[#313d45] text-white focus:border-[#00a884]'
                    : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-[#00a884]'
                }`}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-[#00a884] hover:bg-[#02906f] text-white font-semibold text-sm shadow-md transition-all flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50"
          >
            {loading ? (
              <span className="animate-spin text-lg">⏳</span>
            ) : tab === 'login' ? (
              <>
                <LogIn size={16} />
                <span>Sign In</span>
              </>
            ) : tab === 'signup' ? (
              <>
                <Sparkles size={16} />
                <span>Create WhatsApp Account</span>
              </>
            ) : (
              <>
                <KeyRound size={16} />
                <span>Reset Password</span>
              </>
            )}
          </button>
        </form>

        {/* Quick Demo Switcher Section */}
        <div className={`p-4 border-t ${isDark ? 'border-[#313d45] bg-[#162127]' : 'border-gray-200 bg-gray-50'}`}>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-2 text-center">
            ⚡ Quick Demo Accounts (One-Click Test)
          </p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              onClick={() => handleQuickLogin('alex@whatsapp.io')}
              className={`p-2 rounded-lg border text-left flex items-center gap-2 transition-colors ${
                isDark
                  ? 'border-[#313d45] hover:bg-[#202c33] text-gray-200'
                  : 'border-gray-200 hover:bg-white text-gray-800'
              }`}
            >
              <img
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=50&auto=format&fit=crop&q=80"
                alt="Alex"
                className="w-6 h-6 rounded-full object-cover"
              />
              <span className="truncate font-medium">Alex (Default)</span>
            </button>
            <button
              onClick={() => handleQuickLogin('sarah@whatsapp.io')}
              className={`p-2 rounded-lg border text-left flex items-center gap-2 transition-colors ${
                isDark
                  ? 'border-[#313d45] hover:bg-[#202c33] text-gray-200'
                  : 'border-gray-200 hover:bg-white text-gray-800'
              }`}
            >
              <img
                src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=50&auto=format&fit=crop&q=80"
                alt="Sarah"
                className="w-6 h-6 rounded-full object-cover"
              />
              <span className="truncate font-medium">Sarah Connor</span>
            </button>
            <button
              onClick={() => handleQuickLogin('david@whatsapp.io')}
              className={`p-2 rounded-lg border text-left flex items-center gap-2 transition-colors ${
                isDark
                  ? 'border-[#313d45] hover:bg-[#202c33] text-gray-200'
                  : 'border-gray-200 hover:bg-white text-gray-800'
              }`}
            >
              <img
                src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=50&auto=format&fit=crop&q=80"
                alt="David"
                className="w-6 h-6 rounded-full object-cover"
              />
              <span className="truncate font-medium">David Miller</span>
            </button>
            <button
              onClick={() => handleQuickLogin('elena@whatsapp.io')}
              className={`p-2 rounded-lg border text-left flex items-center gap-2 transition-colors ${
                isDark
                  ? 'border-[#313d45] hover:bg-[#202c33] text-gray-200'
                  : 'border-gray-200 hover:bg-white text-gray-800'
              }`}
            >
              <img
                src="https://images.unsplash.com/photo-1517841905240-472988babdf9?w=50&auto=format&fit=crop&q=80"
                alt="Elena"
                className="w-6 h-6 rounded-full object-cover"
              />
              <span className="truncate font-medium">Elena Rostova</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
