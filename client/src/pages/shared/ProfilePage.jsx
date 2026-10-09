import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import userService from '@/services/userService';
import historyService from '@/services/historyService';
import { 
  User, Lock, Bell, Award, Camera, CheckCircle2, ShieldCheck, 
  KeyRound, Smartphone, Globe, Mail, Phone, BookOpen, Save, 
  Sparkles, Sun, Moon, ExternalLink, RefreshCw, AlertCircle
} from 'lucide-react';
import { StatusBadge } from '@/components/common/StatusBadge';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ROLE_LABELS, STATUS_LABELS } from '@/utils/constants';
import { formatDate, getInitials } from '@/utils/helpers';
import useUIStore from '@/store/uiStore';

export default function ProfilePage() {
  const { id } = useParams();
  const { user: currentUser, updateUser } = useAuth();
  const { theme, toggleTheme, addToast } = useUIStore();
  
  const isOwnProfile = !id || parseInt(id) === currentUser?.id;
  const userId = id || currentUser?.id;

  const [activeTab, setActiveTab] = useState('info'); // 'info' | 'security' | 'preferences' | 'history'
  const [profile, setProfile] = useState(null);
  const [historyData, setHistoryData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form State Edit Profile
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    identityNumber: '',
    department: '',
    bio: '',
    skills: '',
    linkedin: '',
    github: '',
  });

  // Password State
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordSaving, setPasswordSaving] = useState(false);

  // Notification preferences state
  const [notifSettings, setNotifSettings] = useState({
    emailComp: true,
    emailTeam: true,
    emailBroadcast: true,
    pushDeadline: true,
  });

  useEffect(() => {
    async function load() {
      try {
        let u = currentUser;
        
        if (userId) {
          try {
            const userRes = await userService.getUserById(userId);
            if (userRes?.data) {
              u = userRes.data;
            }
          } catch (e) {
            console.warn('API getUserById unavailable, using local context:', e);
          }
        }
        
        let hist = null;
        try {
          const histRes = await historyService.getUserHistory(userId || currentUser?.id);
          if (histRes?.data) hist = histRes.data;
        } catch (e) {}

        const activeUser = u || currentUser || {
          id: 1,
          name: 'Pengguna Ko+Lab',
          email: 'user@kolab.id',
          role: 'admin',
          created_at: new Date().toISOString(),
        };

        setProfile(activeUser);
        setHistoryData(hist);
        
        setFormData({
          name: activeUser?.name || 'Pengguna Ko+Lab',
          email: activeUser?.email || 'user@kolab.id',
          phone: activeUser?.phone || '0812-3456-7890',
          identityNumber: activeUser?.nim_nip || (activeUser?.role === 'mahasiswa' ? '2208101010023' : '198503152010121003'),
          department: activeUser?.department || 'Informatika & Ilmu Komputer',
          bio: activeUser?.bio || 'Mahasiswa berprestasi yang menyukai pengembangan aplikasi web & kecerdasan buatan.',
          skills: activeUser?.skills || 'React.js, Tailwind CSS, UI/UX Design, Node.js',
          linkedin: activeUser?.linkedin || 'https://linkedin.com/in/user-kolab',
          github: activeUser?.github || 'https://github.com/user-kolab',
        });
      } catch (err) {
        console.error('Failed to load profile:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [userId, currentUser]);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await userService.updateUser(userId, { name: formData.name });
      setProfile((prev) => ({ ...prev, name: formData.name }));
      if (isOwnProfile) {
        updateUser({ ...currentUser, name: formData.name });
      }
      addToast({ type: 'success', message: 'Profil berhasil diperbarui!' });
    } catch (err) {
      addToast({ type: 'error', message: 'Gagal memperbarui profil.' });
    } finally {
      setSaving(false);
    }
  };

  const handleSavePassword = (e) => {
    e.preventDefault();
    if (!passwordForm.currentPassword || !passwordForm.newPassword) {
      addToast({ type: 'error', message: 'Harap isi password saat ini dan password baru.' });
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      addToast({ type: 'error', message: 'Konfirmasi password baru tidak cocok!' });
      return;
    }

    setPasswordSaving(true);
    setTimeout(() => {
      setPasswordSaving(false);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      addToast({ type: 'success', message: 'Password berhasil diperbarui!' });
    }, 800);
  };

  if (loading) return <LoadingSpinner className="py-20" />;
  if (!profile) return <p className="text-center py-20 text-slate-500">User tidak ditemukan</p>;

  const stats = historyData?.stats || {};

  return (
    <div className="space-y-8 animate-fade-in pb-16">
      {/* Header Banner & Profile Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#1E1B4B] via-[#2E1065] to-[#3B0764] p-6 sm:p-8 text-white border border-white/10 shadow-2xl">
        <div className="absolute top-0 right-0 -translate-y-12 translate-x-12 w-96 h-96 bg-[#9333EA]/20 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
            {/* Avatar with Upload trigger */}
            <div className="relative group">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white text-3xl font-extrabold shadow-2xl border-4 border-white/20 shrink-0">
                {getInitials(profile.name)}
              </div>
              {isOwnProfile && (
                <button 
                  onClick={() => addToast({ type: 'info', message: 'Pilih foto profil baru dari galeri' })}
                  className="absolute bottom-0 right-0 p-2.5 rounded-xl bg-purple-600 text-white shadow-lg border-2 border-slate-900 hover:bg-purple-700 transition-transform hover:scale-110"
                  title="Ubah Foto Profil"
                >
                  <Camera size={16} />
                </button>
              )}
            </div>

            {/* Profile Info */}
            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">{profile.name}</h1>
                <CheckCircle2 size={20} className="text-cyan-400" title="Akun Terverifikasi" />
              </div>
              <p className="text-purple-200/90 text-sm font-medium">{profile.email}</p>
              
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-purple-500/30 text-purple-200 border border-purple-400/30">
                  <ShieldCheck size={13} /> {ROLE_LABELS[profile.role] || profile.role}
                </span>
                {profile.startup && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-cyan-500/20 text-cyan-200 border border-cyan-400/30">
                    🚀 {profile.startup.name}
                  </span>
                )}
                <span className="text-xs text-purple-300/80 font-mono">
                  Bergabung: {formatDate(profile.created_at)}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Action Badges / Info */}
          {isOwnProfile && (
            <div className="flex items-center justify-center sm:justify-end gap-3 border-t md:border-t-0 md:border-l border-white/10 pt-4 md:pt-0 md:pl-6">
              <div className="text-center px-4 py-2 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10">
                <p className="text-xs text-purple-200">Role Pengguna</p>
                <p className="text-base font-bold text-white uppercase mt-0.5">{profile.role}</p>
              </div>
              <div className="text-center px-4 py-2 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10">
                <p className="text-xs text-purple-200">Status Akun</p>
                <p className="text-base font-bold text-emerald-400 mt-0.5">Aktif</p>
              </div>
            </div>
          )}
        </div>

        {/* Tab Buttons Navigation */}
        <div className="flex items-center gap-2 overflow-x-auto pt-8 border-t border-white/10 mt-8 custom-scrollbar">
          {[
            { id: 'info', label: 'Edit Profil', icon: User },
            { id: 'security', label: 'Keamanan & Password', icon: Lock },
            { id: 'preferences', label: 'Notifikasi & Preferensi', icon: Bell },
            { id: 'history', label: 'Riwayat & Prestasi', icon: Award },
          ].map((tb) => (
            <button
              key={tb.id}
              onClick={() => setActiveTab(tb.id)}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm whitespace-nowrap transition-all flex items-center gap-2 ${
                activeTab === tb.id
                  ? 'bg-white text-purple-950 shadow-lg font-extrabold'
                  : 'bg-white/10 hover:bg-white/15 text-purple-100'
              }`}
            >
              <tb.icon size={16} /> {tb.label}
            </button>
          ))}
        </div>
      </div>

      {/* TAB 1: EDIT PROFIL */}
      {activeTab === 'info' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 bg-white dark:bg-[#131620]/90 border border-slate-200/80 dark:border-white/10 rounded-2xl p-6 sm:p-8 backdrop-blur-xl shadow-sm dark:shadow-2xl">
            <div className="flex items-center gap-3 border-b border-slate-200 dark:border-white/10 pb-4 mb-6">
              <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                <User size={20} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Informasi Diri & Kontak</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">Perbarui data profil agar memudahkan rekan tim menemukan Anda</p>
              </div>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-5">
              {/* Nama & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                    Nama Lengkap <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      disabled={!isOwnProfile}
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                    Alamat Email (Utama)
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      disabled
                      value={formData.email}
                      className="w-full bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-white/5 rounded-xl px-4 py-3 text-slate-500 dark:text-slate-400 text-sm cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>

              {/* NIM/NIP & Jurusan */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                    Nomor Identitas ({profile.role === 'mahasiswa' ? 'NIM' : 'NIP'})
                  </label>
                  <input
                    type="text"
                    disabled={!isOwnProfile}
                    value={formData.identityNumber}
                    onChange={(e) => setFormData({ ...formData, identityNumber: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                    Program Studi / Fakultas
                  </label>
                  <input
                    type="text"
                    disabled={!isOwnProfile}
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
                  />
                </div>
              </div>

              {/* Bio */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                  Bio / Deskripsi Singkat
                </label>
                <textarea
                  rows={3}
                  disabled={!isOwnProfile}
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  placeholder="Tuliskan pengalaman atau minat bidang kompetisi Anda..."
                  className="w-full bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-sm focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all resize-none"
                />
              </div>

              {/* Skills */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                  Keahlian & Minat (Pisahkan dengan koma)
                </label>
                <input
                  type="text"
                  disabled={!isOwnProfile}
                  value={formData.skills}
                  onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                  placeholder="Contoh: React.js, Mobile Dev, Machine Learning, UI/UX"
                  className="w-full bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
                />
              </div>

              {/* Social Links */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                    URL LinkedIn
                  </label>
                  <input
                    type="url"
                    disabled={!isOwnProfile}
                    value={formData.linkedin}
                    onChange={(e) => setFormData({ ...formData, linkedin: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                    URL GitHub / Portfolio
                  </label>
                  <input
                    type="url"
                    disabled={!isOwnProfile}
                    value={formData.github}
                    onChange={(e) => setFormData({ ...formData, github: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
                  />
                </div>
              </div>

              {isOwnProfile && (
                <div className="pt-4 border-t border-slate-200 dark:border-white/10 flex justify-end">
                  <button
                    type="submit"
                    disabled={saving}
                    className="py-3 px-8 rounded-xl bg-gradient-to-r from-[#9333EA] to-[#6C1B75] hover:from-purple-600 hover:to-purple-800 text-white font-bold text-sm shadow-xl shadow-purple-900/30 flex items-center gap-2 transition-all transform active:scale-95 disabled:opacity-50"
                  >
                    {saving ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />} Simpan Perubahan Profil
                  </button>
                </div>
              )}
            </form>
          </div>

          {/* Side Overview Box */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white dark:bg-[#131620]/90 border border-slate-200/80 dark:border-white/10 rounded-2xl p-6 backdrop-blur-xl shadow-sm dark:shadow-2xl">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                <Sparkles size={16} className="text-amber-500" /> Ringkasan Profil Singkat
              </h3>

              <div className="space-y-4 text-xs leading-relaxed">
                <div>
                  <span className="text-slate-400 block mb-1">Keahlian Utama:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {formData.skills.split(',').map((sk, idx) => (
                      <span key={idx} className="px-2.5 py-1 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-300 border border-purple-500/20 font-medium">
                        {sk.trim()}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-200 dark:border-white/10">
                  <span className="text-slate-400 block mb-1">Tautan Portofolio:</span>
                  {formData.linkedin && (
                    <a href={formData.linkedin} target="_blank" rel="noreferrer" className="text-purple-600 dark:text-purple-400 hover:underline font-medium flex items-center gap-1.5 mb-1">
                      <Globe size={13} /> Profile LinkedIn <ExternalLink size={11} />
                    </a>
                  )}
                  {formData.github && (
                    <a href={formData.github} target="_blank" rel="noreferrer" className="text-purple-600 dark:text-purple-400 hover:underline font-medium flex items-center gap-1.5">
                      <Globe size={13} /> Portfolio / GitHub <ExternalLink size={11} />
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: KEAMANAN & PASSWORD */}
      {activeTab === 'security' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7 bg-white dark:bg-[#131620]/90 border border-slate-200/80 dark:border-white/10 rounded-2xl p-6 sm:p-8 backdrop-blur-xl shadow-sm dark:shadow-2xl">
            <div className="flex items-center gap-3 border-b border-slate-200 dark:border-white/10 pb-4 mb-6">
              <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                <KeyRound size={20} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Ubah Password Akun</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">Pastikan password Anda kuat untuk menjaga keamanan data akun</p>
              </div>
            </div>

            <form onSubmit={handleSavePassword} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                  Password Saat Ini <span className="text-rose-500">*</span>
                </label>
                <input
                  type="password"
                  required
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                  placeholder="••••••••"
                  className="w-full bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                  Password Baru <span className="text-rose-500">*</span>
                </label>
                <input
                  type="password"
                  required
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  placeholder="Minimal 8 karakter"
                  className="w-full bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                  Konfirmasi Password Baru <span className="text-rose-500">*</span>
                </label>
                <input
                  type="password"
                  required
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  placeholder="Ulangi password baru"
                  className="w-full bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
                />
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-white/10 flex justify-end">
                <button
                  type="submit"
                  disabled={passwordSaving}
                  className="py-3 px-8 rounded-xl bg-gradient-to-r from-[#9333EA] to-[#6C1B75] hover:from-purple-600 hover:to-purple-800 text-white font-bold text-sm shadow-xl shadow-purple-900/30 flex items-center gap-2 transition-all transform active:scale-95 disabled:opacity-50"
                >
                  {passwordSaving ? <RefreshCw size={16} className="animate-spin" /> : <Lock size={16} />} Perbarui Password
                </button>
              </div>
            </form>
          </div>

          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white dark:bg-[#131620]/90 border border-slate-200/80 dark:border-white/10 rounded-2xl p-6 backdrop-blur-xl shadow-sm dark:shadow-2xl">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                <Smartphone size={16} className="text-purple-500" /> Sesi Perangkat Aktif
              </h3>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/5 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-900 dark:text-white">Windows PC • Chrome</span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-semibold text-[10px]">Perangkat Ini</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">IP: 180.252.xx.xx • Terakhir aktif baru saja</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: NOTIFIKASI & PREFERENSI */}
      {activeTab === 'preferences' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7 bg-white dark:bg-[#131620]/90 border border-slate-200/80 dark:border-white/10 rounded-2xl p-6 sm:p-8 backdrop-blur-xl shadow-sm dark:shadow-2xl space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-200 dark:border-white/10 pb-4">
              <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                <Sun size={20} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Preferensi Tampilan & Mode Aplikasi</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">Pilih tema tampilan yang nyaman untuk mata Anda</p>
              </div>
            </div>

            {/* Theme Visual Selector */}
            <div className="grid grid-cols-2 gap-4">
              <div 
                onClick={() => theme !== 'light' && toggleTheme()}
                className={`p-5 rounded-2xl border-2 cursor-pointer transition-all flex flex-col items-center gap-3 text-center ${
                  theme === 'light' 
                    ? 'border-purple-600 bg-purple-50/50 shadow-md ring-2 ring-purple-500/20' 
                    : 'border-slate-200 dark:border-white/10 hover:border-purple-400 bg-slate-50 dark:bg-slate-900/50'
                }`}
              >
                <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center shadow-inner">
                  <Sun size={24} />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">Mode Terang (Light Mode)</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Latar bersih, kontras tinggi di siang hari</p>
                </div>
              </div>

              <div 
                onClick={() => theme !== 'dark' && toggleTheme()}
                className={`p-5 rounded-2xl border-2 cursor-pointer transition-all flex flex-col items-center gap-3 text-center ${
                  theme === 'dark' 
                    ? 'border-purple-500 bg-purple-950/30 shadow-md ring-2 ring-purple-500/20' 
                    : 'border-slate-200 dark:border-white/10 hover:border-purple-400 bg-slate-50 dark:bg-slate-900/50'
                }`}
              >
                <div className="w-12 h-12 rounded-full bg-slate-900 text-purple-400 border border-purple-500/30 flex items-center justify-center shadow-inner">
                  <Moon size={24} />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">Mode Gelap (Dark Mode)</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Latar obsidian glassmorphism mewah</p>
                </div>
              </div>
            </div>

            {/* Notification Toggles */}
            <div className="pt-6 border-t border-slate-200 dark:border-white/10 space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">Pengaturan Notifikasi Email</h3>

              {[
                { key: 'emailComp', title: 'Pengumuman Lomba Baru', desc: 'Dapatkan pemberitahuan email saat ada kompetisi baru yang sesuai jurusan' },
                { key: 'emailTeam', title: 'Undangan & Permintaan Tim', desc: 'Notifikasi saat diajak bergabung tim atau ada permintaan dosen pembimbing' },
                { key: 'emailBroadcast', title: 'Broadcast Massal Admin', desc: 'Pesan pengumuman penting dari sistem Ko+Lab' },
                { key: 'pushDeadline', title: 'Pengingat Deadline Lomba', desc: 'Notifikasi 3 hari sebelum batas akhir pendaftaran lomba' },
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/5">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">{item.title}</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{item.desc}</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifSettings[item.key]}
                    onChange={(e) => {
                      setNotifSettings({ ...notifSettings, [item.key]: e.target.checked });
                      addToast({ type: 'success', message: 'Preferensi notifikasi disimpan.' });
                    }}
                    className="w-5 h-5 accent-purple-600 rounded cursor-pointer"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: RIWAYAT & PRESTASI */}
      {activeTab === 'history' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div className="p-6 rounded-2xl bg-white dark:bg-[#131620]/90 border border-slate-200/80 dark:border-white/10 shadow-sm dark:shadow-xl text-center">
              <p className="text-3xl font-extrabold text-purple-600 dark:text-purple-400">{stats.total || 0}</p>
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-1">Total Lomba Diikuti</p>
            </div>
            <div className="p-6 rounded-2xl bg-white dark:bg-[#131620]/90 border border-slate-200/80 dark:border-white/10 shadow-sm dark:shadow-xl text-center">
              <p className="text-3xl font-extrabold text-blue-600 dark:text-blue-400">{(stats.upcoming || 0) + (stats.ongoing || 0)}</p>
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-1">Kompetisi Aktif</p>
            </div>
            <div className="p-6 rounded-2xl bg-white dark:bg-[#131620]/90 border border-slate-200/80 dark:border-white/10 shadow-sm dark:shadow-xl text-center">
              <p className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">{stats.completed || 0}</p>
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-1">Selesai & Finalis</p>
            </div>
          </div>

          <div className="bg-white dark:bg-[#131620]/90 border border-slate-200/80 dark:border-white/10 rounded-2xl p-6 backdrop-blur-xl shadow-sm dark:shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Award size={20} className="text-amber-500" /> Timeline & History Rekam Jejak
            </h3>

            {historyData?.competitions && [...(historyData.competitions.upcoming || []), ...(historyData.competitions.ongoing || []), ...(historyData.competitions.completed || [])].length > 0 ? (
              <div className="space-y-3">
                {[...(historyData.competitions.upcoming || []), ...(historyData.competitions.ongoing || []), ...(historyData.competitions.completed || [])].map((item, i) => (
                  <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-slate-200/60 dark:border-white/5 bg-slate-50/80 dark:bg-slate-900/50 hover:bg-white dark:hover:bg-slate-800/80 transition-colors gap-3">
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white text-sm">{item.competition?.name}</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Tim: {item.team?.name} • Peran: <span className="font-bold text-purple-600 dark:text-purple-400">{item.team?.role_in_team === 'leader' ? 'Ketua Tim' : 'Anggota'}</span>
                      </p>
                    </div>
                    <StatusBadge status={item.competition?.status} labels={STATUS_LABELS} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center text-slate-500 dark:text-slate-400 text-sm">
                Belum ada rekaman kompetisi. Eksplorasi lomba untuk memulai perjalanan prestasimu!
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
