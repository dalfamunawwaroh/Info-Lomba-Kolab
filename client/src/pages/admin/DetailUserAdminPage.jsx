import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Mail, Phone, IdCard, Building2, CalendarDays, Trophy, UsersRound, History } from 'lucide-react';
import userService from '@/services/userService';
import historyService from '@/services/historyService';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { Button } from '@/components/common/Button';
import { ROLE_LABELS } from '@/utils/constants';
import { formatDate, getInitials } from '@/utils/helpers';
import useUIStore from '@/store/uiStore';

// Halaman detail user versi admin — read-only ringkas + history lomba.
// ponytail: tanpa aksi edit; edit tetap lewat Kelola User agar satu pintu.
export default function DetailUserAdminPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const addToast = useUIStore((s) => s.addToast);
  const [user, setUser] = useState(null);
  const [history, setHistory] = useState({ competitions: { upcoming: [], ongoing: [], completed: [] }, stats: { total: 0, upcoming: 0, ongoing: 0, completed: 0 } });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [uRes, hRes] = await Promise.all([
          userService.getUserById(id),
          historyService.getUserHistory(id).catch(() => null),
        ]);
        setUser(uRes?.data || null);
        if (hRes?.data?.competitions) setHistory(hRes.data);
      } catch {
        addToast({ type: 'error', message: 'Gagal memuat detail user' });
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id, addToast]);

  const stats = history.stats || { total: 0, upcoming: 0, ongoing: 0, completed: 0 };
  const cups = history.competitions || { upcoming: [], ongoing: [], completed: [] };
  const allItems = [...(cups.upcoming || []), ...(cups.ongoing || []), ...(cups.completed || [])];

  if (loading) return <LoadingSpinner className="py-20" />;
  if (!user) {
    return (
      <div className="text-center py-20">
        <p className="text-slate-500 font-medium">User tidak ditemukan</p>
        <Button variant="outline" className="mt-4 rounded-full" onClick={() => navigate('/admin/users')}>
          <ArrowLeft size={16} className="mr-1" /> Kembali ke Kelola User
        </Button>
      </div>
    );
  }

  const info = [
    { icon: Mail, label: 'Email', value: user.email || '-' },
    { icon: Phone, label: 'Telepon', value: user.phone || '-' },
    { icon: IdCard, label: user.role === 'mahasiswa' ? 'NIM' : 'NIP', value: user.nip_nim || '-' },
    { icon: Building2, label: 'Startup', value: user.startup?.name || user.startup_name || '-' },
    { icon: CalendarDays, label: 'Terdaftar', value: user.created_at ? formatDate(user.created_at) : '-' },
  ];

  return (
    <div className="space-y-5">
      <button
        onClick={() => navigate('/admin/users')}
        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-[#6C1B75] transition-colors"
      >
        <ArrowLeft size={14} /> Kembali ke Kelola User
      </button>

      {/* Hero */}
      <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-r from-[#6C1B75] via-[#9333EA] to-[#C084FC] p-6 sm:p-8 text-white">
        <div className="absolute -top-16 -right-10 w-72 h-72 bg-white/15 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 left-1/3 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
        <div className="relative flex items-center gap-5">
          <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-3xl bg-white/20 backdrop-blur-md border-2 border-white/40 flex items-center justify-center text-xl sm:text-2xl font-extrabold shrink-0">
            {getInitials(user.name)}
          </div>
          <div className="min-w-0">
            <p className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider bg-white/20 backdrop-blur-md px-3 py-1 rounded-full">
              {ROLE_LABELS[user.role] || user.role}
            </p>
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight mt-1.5 truncate">{user.name}</h1>
            <p className="text-sm text-white/80 truncate">{user.email}</p>
          </div>
          <div className="ml-auto hidden sm:flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 backdrop-blur-md px-3.5 py-1.5 text-xs font-extrabold">
              <Trophy size={14} /> {stats.total} lomba diikuti
            </span>
            <Badge variant={user.status === 'active' || user.is_active ? 'success' : 'secondary'}>
              {user.status === 'active' || user.is_active ? 'Aktif' : 'Nonaktif'}
            </Badge>
          </div>
        </div>
      </div>

      {/* Data diri */}
      <Card className="rounded-[2rem]">
        <CardHeader>
          <CardTitle>Data Diri</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {info.map((row) => (
              <div key={row.label} className="flex items-center gap-3 rounded-2xl bg-slate-50 dark:bg-white/5 px-4 py-3">
                <span className="h-9 w-9 rounded-xl bg-purple-100 dark:bg-purple-500/15 text-[#6C1B75] dark:text-purple-300 flex items-center justify-center shrink-0">
                  <row.icon size={16} />
                </span>
                <div className="min-w-0">
                  <dt className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{row.label}</dt>
                  <dd className="text-sm font-semibold text-slate-800 dark:text-white truncate">{row.value}</dd>
                </div>
              </div>
            ))}
          </dl>
        </CardContent>
      </Card>

      {/* History lomba */}
      <Card className="rounded-[2rem]">
        <CardHeader>
          <CardTitle>
            <span className="inline-flex items-center gap-2">
              <History size={18} /> Lomba yang Diikuti
              <span className="text-xs font-bold bg-purple-100 text-[#6C1B75] dark:bg-purple-500/15 dark:text-purple-300 px-2.5 py-0.5 rounded-full">
                {stats.total} lomba
              </span>
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Ringkas per status */}
          <div className="grid grid-cols-3 gap-2.5 mb-4">
            {[
              { label: 'Akan Datang', value: stats.upcoming },
              { label: 'Berjalan', value: stats.ongoing },
              { label: 'Selesai', value: stats.completed },
            ].map((s) => (
              <div key={s.label} className="rounded-2xl bg-slate-50 dark:bg-white/5 px-4 py-3 text-center">
                <p className="text-xl font-extrabold text-[#6C1B75] dark:text-purple-300">{s.value}</p>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{s.label}</p>
              </div>
            ))}
          </div>
          {allItems.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-3xl bg-purple-100 dark:bg-purple-500/15 flex items-center justify-center mx-auto mb-3">
                <Trophy size={24} className="text-[#9333EA]" />
              </div>
              <p className="text-sm font-bold text-slate-700 dark:text-slate-200">Belum ada history lomba</p>
              <p className="text-xs text-slate-400 mt-1">User ini belum terdaftar di lomba manapun.</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {allItems.map((item, i) => {
                const comp = item.competition || {};
                const team = item.team;
                const roleLabel = team?.role_in_team === 'leader' ? 'Ketua Tim' : team?.role_in_team === 'advisor' ? 'Dosen Pembimbing' : team ? 'Anggota' : 'Pendaftar Solo';
                return (
                  <li key={comp.id || i}>
                    <Link
                      to={comp.id ? `/admin/competitions/${comp.id}` : '#'}
                      onClick={(e) => { if (!comp.id) e.preventDefault(); }}
                      className="block rounded-2xl border border-slate-100 dark:border-white/10 p-4 hover:shadow-md hover:border-purple-200 dark:hover:border-purple-500/30 transition-all cursor-pointer"
                      title="Lihat detail lomba"
                    >
                    <div className="h-1.5 -mt-4 -mx-4 mb-3 rounded-t-2xl bg-gradient-to-r from-[#6C1B75] via-[#9333EA] to-[#C084FC]" />
                    <div className="flex items-center gap-3">
                      <span className="h-10 w-10 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-700 text-white flex items-center justify-center font-extrabold text-sm shrink-0">
                        {(comp.name || '?').charAt(0).toUpperCase()}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-slate-800 dark:text-white truncate group-hover:text-[#6C1B75]">
                          {comp.name || 'Lomba'}
                        </p>
                        <p className="text-xs text-slate-400 truncate">
                          {team?.name && (
                            <span className="inline-flex items-center gap-1 mr-2">
                              <UsersRound size={12} /> {team.name}
                            </span>
                          )}
                          {roleLabel}
                          {comp.status ? ` • ${comp.status}` : ''}
                        </p>
                      </div>
                      {team?.status && <Badge variant="secondary">{team.status}</Badge>}
                    </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
