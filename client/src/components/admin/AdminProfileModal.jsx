import { useEffect, useState } from 'react';
import { X, User, Mail, Phone, Save, LogOut } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import userService from '@/services/userService';
import useUIStore from '@/store/uiStore';
import { getInitials } from '@/utils/helpers';

// Modal profil admin — dibuka dari foto/nama di Header.
// ponytail: tanpa upload avatar; tambah bila backend dukung multipart.
export function AdminProfileModal({ open, onClose }) {
  const { user, updateUser, logout } = useAuth();
  const { addToast } = useUIStore();
  const [form, setForm] = useState({ name: '', phone: '' });
  const [saving, setSaving] = useState(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    if (open && user) setForm({ name: user.name || '', phone: user.phone || '' });
  }, [open, user]);

  // Tutup pakai Escape — tanpa itu modal jebak fokus keyboard
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose?.(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      addToast({ type: 'error', message: 'Nama tidak boleh kosong.' });
      return;
    }
    setSaving(true);
    try {
      const res = await userService.updateUser(user.id, { name: form.name.trim(), phone: form.phone.trim() });
      const updated = res?.data || { ...user, ...form };
      updateUser(updated);
      addToast({ type: 'success', message: 'Profil berhasil diperbarui!' });
      onClose?.();
    } catch {
      addToast({ type: 'error', message: 'Gagal memperbarui profil.' });
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    setLeaving(true);
    try {
      await logout();
    } finally {
      setLeaving(false);
      onClose?.();
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-[2rem] bg-white dark:bg-[#15181e] shadow-2xl p-8 animate-fade-in">
        <button
          onClick={onClose}
          aria-label="Tutup"
          className="absolute top-5 right-5 w-9 h-9 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10 hover:text-slate-700 transition-colors"
        >
          <X size={18} />
        </button>

        <div className="flex items-center gap-4 mb-6">
          <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-700 flex items-center justify-center text-white text-lg font-bold shadow-lg shadow-purple-900/30 border border-purple-400/30">
            {getInitials(user?.name || 'A')}
          </div>
          <div className="min-w-0">
            <p className="text-base font-extrabold text-slate-900 dark:text-white truncate">{user?.name || 'Admin'}</p>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 truncate">{user?.email || ''}</p>
            <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-purple-100 text-[#6C1B75] dark:bg-purple-500/15 dark:text-purple-300">
              {user?.role || 'admin'}
            </span>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-3">
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 ml-0.5">Nama Lengkap</label>
            <div className="relative mt-1">
              <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={form.name}
                onChange={set('name')}
                placeholder="Nama lengkap"
                className="w-full h-11 pl-10 pr-3.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-4 focus:ring-[#9333EA]/15 focus:border-[#9333EA] transition-all"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 ml-0.5">No. Telepon</label>
            <div className="relative mt-1">
              <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={form.phone}
                onChange={set('phone')}
                placeholder="08xx-xxxx-xxxx"
                className="w-full h-11 pl-10 pr-3.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-4 focus:ring-[#9333EA]/15 focus:border-[#9333EA] transition-all"
              />
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-white/5 rounded-xl px-3.5 py-2.5">
            <Mail size={14} className="shrink-0" />
            <span className="truncate">Email tidak bisa diubah sendiri — hubungi admin lain.</span>
          </div>

          <div className="flex gap-2.5 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 h-11 rounded-full font-bold text-sm text-white bg-gradient-to-r from-[#6C1B75] to-[#9333EA] hover:brightness-110 shadow-lg shadow-purple-500/25 transition-all active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {saving ? (
                <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Save size={16} />
              )}
              {saving ? 'Menyimpan...' : 'Simpan'}
            </button>
            <button
              type="button"
              onClick={handleLogout}
              disabled={leaving}
              className="flex-1 h-11 rounded-full font-bold text-sm bg-rose-50 text-rose-600 hover:bg-rose-100 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-60"
            >
              <LogOut size={16} />
              {leaving ? 'Keluar...' : 'Logout'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
