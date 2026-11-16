import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Settings, Sun, Moon, Bell, Trophy, UsersRound, Clock, GraduationCap, Mail, UserCircle2, ChevronRight, Check, LogOut, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import useUIStore from '@/store/uiStore';
import { cn } from '@/lib/utils';
import { PageHeader, Panel, PanelTitle, Avatar, PrimaryButton } from '@/components/user/UserUI';

const STORAGE_KEY = 'kolab_notif_settings';
const DEFAULTS = { email: true, competition: true, team: true, deadline: true, advisor: true };

function loadPrefs() {
  try {
    return { ...DEFAULTS, ...(JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}) };
  } catch {
    return DEFAULTS;
  }
}

function Toggle({ checked, onChange }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn('relative w-12 h-7 rounded-full transition-colors shrink-0', checked ? 'bg-gradient-to-r from-[#9333EA] to-fuchsia-500' : 'bg-slate-300 dark:bg-slate-700')}
    >
      <span className={cn('absolute top-1 left-1 w-5 h-5 rounded-full bg-white shadow transition-transform', checked && 'translate-x-5')} />
    </button>
  );
}

function ThemeCard({ active, onClick, dark, label, icon: Icon }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn('relative text-left rounded-[22px] border-2 p-3 transition-all hover:-translate-y-0.5', active ? 'border-[#9333EA] shadow-lg shadow-purple-900/10' : 'border-slate-200 dark:border-white/10 hover:border-purple-400/50')}
    >
      <div className={cn('h-28 rounded-2xl p-3 flex gap-2 overflow-hidden', dark ? 'bg-[#0B0D11]' : 'bg-slate-100')}>
        <div className={cn('w-8 rounded-lg', dark ? 'bg-[#0F1115] border border-white/5' : 'bg-white border border-slate-200')} />
        <div className="flex-1 space-y-2">
          <div className="h-8 rounded-lg bg-gradient-to-r from-[#2E1065] to-[#6C1B75]" />
          <div className="grid grid-cols-2 gap-2">
            <div className={cn('h-10 rounded-lg', dark ? 'bg-[#131620] border border-white/10' : 'bg-white border border-slate-200')} />
            <div className={cn('h-10 rounded-lg', dark ? 'bg-[#131620] border border-white/10' : 'bg-white border border-slate-200')} />
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between mt-3 px-1">
        <span className="flex items-center gap-2 font-bold text-[14px] text-slate-800 dark:text-white"><Icon size={16} /> {label}</span>
        {active && <span className="w-6 h-6 rounded-full bg-[#9333EA] text-white flex items-center justify-center"><Check size={14} strokeWidth={3} /></span>}
      </div>
    </button>
  );
}

export default function PengaturanPage() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme, addToast } = useUIStore();
  const [prefs, setPrefs] = useState(loadPrefs);
  const [dirty, setDirty] = useState(false);

  const setPref = (k, v) => { setPrefs((p) => ({ ...p, [k]: v })); setDirty(true); };
  const save = () => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs)); } catch { /* storage tidak tersedia */ }
    setDirty(false);
    addToast({ type: 'success', message: 'Pengaturan disimpan' });
  };

  const rows = [
    { key: 'competition', icon: Trophy, title: 'Lomba baru', desc: 'Kabari saat ada lomba baru dibuka' },
    { key: 'deadline', icon: Clock, title: 'Pengingat deadline', desc: 'Pengingat saat pendaftaran hampir ditutup' },
    { key: 'team', icon: UsersRound, title: 'Aktivitas tim', desc: 'Perubahan anggota dan status tim' },
    { key: 'advisor', icon: GraduationCap, title: 'Dosen pembimbing', desc: 'Respons atas pengajuan pembimbing' },
    { key: 'email', icon: Mail, title: 'Kirim juga ke email', desc: 'Salinan notifikasi penting ke email kamu' },
  ];

  return (
    <div className="space-y-8 pb-12 animate-fade-in-up">
      <PageHeader icon={Settings} eyebrow="Akun" title="Pengaturan" subtitle="Atur tampilan aplikasi dan notifikasi yang ingin kamu terima." />

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_360px] gap-6 items-start">
        <div className="space-y-6 min-w-0">
          <Panel>
            <PanelTitle icon={Sun} tone="amber" title="Tampilan" subtitle="Pilih tema yang paling nyaman di mata" />
            <div className="grid sm:grid-cols-2 gap-4 max-w-2xl">
              <ThemeCard label="Terang" icon={Sun} active={theme === 'light'} onClick={() => theme !== 'light' && toggleTheme()} />
              <ThemeCard label="Gelap" icon={Moon} dark active={theme === 'dark'} onClick={() => theme !== 'dark' && toggleTheme()} />
            </div>
          </Panel>

          <Panel>
            <PanelTitle icon={Bell} title="Notifikasi" subtitle="Pilih kabar apa saja yang ingin kamu terima" />
            <ul className="divide-y divide-slate-100 dark:divide-white/5">
              {rows.map((r) => (
                <li key={r.key} className="flex items-center gap-4 py-4 first:pt-0 last:pb-0">
                  <div className="w-11 h-11 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0"><r.icon size={19} /></div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-[15px] text-slate-900 dark:text-white">{r.title}</p>
                    <p className="text-[13px] font-medium text-slate-500 dark:text-slate-400">{r.desc}</p>
                  </div>
                  <Toggle checked={prefs[r.key]} onChange={(v) => setPref(r.key, v)} />
                </li>
              ))}
            </ul>
            <div className="flex items-center justify-end gap-3 mt-6 pt-6 border-t border-slate-100 dark:border-white/5">
              {dirty && <span className="text-sm font-semibold text-amber-600 dark:text-amber-400">Ada perubahan belum disimpan</span>}
              <PrimaryButton onClick={save} disabled={!dirty}>Simpan Pengaturan</PrimaryButton>
            </div>
          </Panel>
        </div>

        <aside className="space-y-6 xl:sticky xl:top-28">
          <Panel className="p-6 md:p-6 text-center">
            <Avatar name={user?.name} size="lg" className="mx-auto w-20 h-20 text-2xl" />
            <p className="font-black text-lg text-slate-900 dark:text-white mt-4">{user?.name}</p>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 truncate">{user?.email}</p>
            <span className="inline-flex items-center gap-1.5 mt-3 px-3 py-1 rounded-full bg-purple-500/10 text-purple-700 dark:text-purple-300 text-[12px] font-bold"><ShieldCheck size={13} /> Mahasiswa</span>
          </Panel>
          <Panel className="p-3 md:p-3">
            {[
              { to: '/mahasiswa/profile', icon: UserCircle2, label: 'Edit profil' },
              { to: '/mahasiswa/notifications', icon: Bell, label: 'Lihat notifikasi' },
            ].map((l) => (
              <Link key={l.to} to={l.to} className="flex items-center gap-3 p-3.5 rounded-2xl hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                <l.icon size={19} className="text-purple-600 dark:text-purple-400" />
                <span className="flex-1 font-bold text-[14px] text-slate-700 dark:text-slate-200">{l.label}</span>
                <ChevronRight size={17} className="text-slate-400" />
              </Link>
            ))}
            <button onClick={logout} className="w-full flex items-center gap-3 p-3.5 rounded-2xl hover:bg-rose-500/10 transition-colors text-rose-600 dark:text-rose-400">
              <LogOut size={19} />
              <span className="flex-1 text-left font-bold text-[14px]">Keluar</span>
            </button>
          </Panel>
        </aside>
      </div>
    </div>
  );
}
