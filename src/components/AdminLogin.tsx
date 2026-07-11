import React, { useState } from 'react';
import { ShieldAlert, KeyRound, Check } from 'lucide-react';
import { database } from '../lib/firebase';
import { ref, get } from 'firebase/database';
import { hashPasscodeSync } from '../utils/hash';

interface AdminLoginProps {
  onLoginSuccess: (adminUser: { emailOrPhone: string; role: string; id: string }) => void;
  onClose: () => void;
}

export default function AdminLogin({ onLoginSuccess, onClose }: AdminLoginProps) {
  const [username, setUsername] = useState('');
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !passcode) {
      setError('Lütfen kullanıcı adı ve şifre girin.');
      return;
    }

    setLoading(true);
    setError('');

    // Hardcoded master credentials as requested
    if ((username === 'eralpergun' || username === 'eralp') && passcode === 'eralp') {
      onLoginSuccess({
        emailOrPhone: username,
        role: 'admin',
        id: username
      });
      setLoading(false);
      return;
    }

    try {
      // Check in firebase database users
      const formattedKey = username.replace(/[.#$[\]]/g, '_');
      const userRef = ref(database, `users/${formattedKey}`);
      const snapshot = await get(userRef);

      if (snapshot.exists()) {
        const userData = snapshot.val();
        const hashedPass = hashPasscodeSync(passcode);
        
        if (userData.passcodeHash === hashedPass && userData.role === 'admin') {
          onLoginSuccess({
            emailOrPhone: userData.emailOrPhone,
            role: 'admin',
            id: formattedKey
          });
          return;
        }
      }

      setError('Geçersiz kullanıcı adı, parola veya yetkisiz erişim.');
    } catch (err) {
      console.error(err);
      setError('Bağlantı sırasında bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white border border-slate-100 p-6 sm:p-8 rounded-3xl shadow-2xl max-w-md mx-auto relative overflow-hidden">
      <div className="absolute top-0 left-0 w-24 h-24 bg-slate-500/5 rounded-full blur-2xl pointer-events-none"></div>

      <div className="relative z-10 space-y-6">
        <div className="text-center">
          <div className="w-12 h-12 bg-slate-900 text-slate-200 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg">
            <KeyRound className="h-5 w-5" />
          </div>
          <h3 className="text-xl font-bold text-slate-900">Yönetici Girişi</h3>
          <p className="text-xs text-slate-400 mt-1">Yalnızca yetkili Ergün 3D Baskı yöneticileri erişebilir.</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Kullanıcı Adı / Telefon *
            </label>
            <input
              type="text"
              required
              placeholder="Kullanıcı adı veya telefon"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-slate-500/20"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Şifre / Parola *
            </label>
            <input
              type="password"
              required
              placeholder="••••••"
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-slate-500/20"
            />
          </div>

          {error && (
            <p className="text-xs text-rose-500 bg-rose-50 p-2.5 rounded-xl border border-rose-100 flex items-center gap-1.5">
              <ShieldAlert className="h-4 w-4 shrink-0" />
              {error}
            </p>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="w-1/3 py-3 border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold rounded-xl text-xs transition-all cursor-pointer"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="w-2/3 bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 rounded-xl text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-slate-200"
            >
              {loading ? 'Giriş Yapılıyor...' : 'Yönetici Girişi Yap'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
