import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Palette, Bell, User, Shield, Moon, Sun, Monitor,
  Save, Key, Globe, Layout
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import useUIStore from '@/store/uiStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Label } from '@/components/common/Label';
import { getInitials } from '@/utils/helpers';

function SettingRow({ icon: Icon, title, description, children }) {
  return (
    <div className="flex items-center justify-between py-4 border-b border-slate-100 dark:border-white/5 last:border-0">
      <div className="flex items-center gap-4 flex-1">
        <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
          <Icon size={18} />
        </div>
        <div>
          <p className="text-sm font-bold text-slate-800 dark:text-white">{title}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">{description}</p>
        </div>
      </div>
      <div className="shrink-0 ml-4">{children}</div>
    </div>
  );
}

function ToggleSwitch({ checked, onChange }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`relative w-12 h-7 rounded-full transition-colors ${
        checked ? 'bg-purple-600' : 'bg-slate-300 dark:bg-slate-600'
      }`}
    >
      <span
        className={`absolute top-1 left-1 w-5 h-5 rounded-full bg-white transition-transform ${
          checked ? 'translate-x-5' : ''
        }`}
      />
    </button>
  );
}

export default function SettingsPage() {
  const { user } = useAuth();
  const { theme, toggleTheme } = useUIStore();
  const navigate = useNavigate();
  const [notifSettings, setNotifSettings] = useState({
    email: true,
    push: true,
    competition: true,
    team: true,
    deadline: true,
    advisor: true,
  });
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    localStorage.setItem('kolab_notif_settings', JSON.stringify(notifSettings));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const updateNotif = (key, val) => setNotifSettings((prev) => ({ ...prev, [key]: val }));

  return (
    <div className="space-y-6 max-w-2xl pb-12">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft size={18} />
        </Button>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Pengaturan</h1>
      </div>

      {/* Profile Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xl font-black">
              {getInitials(user?.name)}
            </div>
            <div>
              <p className="text-lg font-bold text-slate-800 dark:text-white">{user?.name}</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">{user?.email}</p>
              <span className="inline-block mt-1 text-[11px] font-bold uppercase tracking-wider bg-purple-100 dark:bg-purple-500/15 text-purple-700 dark:text-purple-400 px-2.5 py-1 rounded-full">
                {user?.role}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Appearance */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Palette size={16} />Tampilan
          </CardTitle>
        </CardHeader>
        <CardContent className="px-6 py-0">
          <SettingRow
            icon={theme === 'dark' ? Moon : Sun}
            title="Tema"
            description="Pilih tema tampilan aplikasi"
          >
            <div className="flex gap-1 p-1 rounded-xl bg-slate-100 dark:bg-white/5">
              {[
                { key: 'light', icon: Sun, label: 'Terang' },
                { key: 'dark', icon: Moon, label: 'Gelap' },
              ].map((t) => (
                <button
                  key={t.key}
                  onClick={() => {
                    if (theme !== t.key) toggleTheme();
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    theme === t.key
                      ? 'bg-white dark:bg-white/10 text-purple-700 dark:text-purple-300 shadow-sm'
                      : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  <t.icon size={13} />
                  {t.label}
                </button>
              ))}
            </div>
          </SettingRow>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Bell size={16} />Notifikasi
          </CardTitle>
        </CardHeader>
        <CardContent className="px-6 py-0">
          <SettingRow
            icon={Bell}
            title="Email Notifikasi"
            description="Terima notifikasi melalui email"
          >
            <ToggleSwitch
              checked={notifSettings.email}
              onChange={(v) => updateNotif('email', v)}
            />
          </SettingRow>
          <SettingRow
            icon={Globe}
            title="Notifikasi Lomba Baru"
            description="Ketika ada lomba baru ditambahkan"
          >
            <ToggleSwitch
              checked={notifSettings.competition}
              onChange={(v) => updateNotif('competition', v)}
            />
          </SettingRow>
          <SettingRow
            icon={Layout}
            title="Notifikasi Tim"
            description="Update terkait tim Anda"
          >
            <ToggleSwitch
              checked={notifSettings.team}
              onChange={(v) => updateNotif('team', v)}
            />
          </SettingRow>
          <SettingRow
            icon={Bell}
            title="Pengingat Deadline"
            description="Notifikasi mendekati deadline"
          >
            <ToggleSwitch
              checked={notifSettings.deadline}
              onChange={(v) => updateNotif('deadline', v)}
            />
          </SettingRow>
        </CardContent>
      </Card>

      {/* Account */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Shield size={16} />Akun & Keamanan
          </CardTitle>
        </CardHeader>
        <CardContent className="px-6 py-0">
          <SettingRow
            icon={Key}
            title="Ganti Password"
            description="Perbarui password akun Anda"
          >
            <Button variant="outline" size="sm" onClick={() => navigate(`/${user?.role || 'admin'}/profile`)}>
              Ganti
            </Button>
          </SettingRow>
          <SettingRow
            icon={User}
            title="Edit Profil"
            description="Perbarui informasi profil Anda"
          >
            <Button variant="outline" size="sm" onClick={() => navigate(`/${user?.role || 'admin'}/profile`)}>
              Edit
            </Button>
          </SettingRow>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave}>
          <Save size={15} className="mr-1.5" />
          {saved ? 'Tersimpan!' : 'Simpan Pengaturan'}
        </Button>
      </div>
    </div>
  );
}
