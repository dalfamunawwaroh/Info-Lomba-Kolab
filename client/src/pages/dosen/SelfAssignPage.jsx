import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  UsersRound, Send, Search, Trophy, Crown, GraduationCap, Clock,
  ArrowRight,
} from 'lucide-react';
import advisorService from '@/services/advisorService';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Badge } from '@/components/common/Badge';
import { StatusBadge } from '@/components/common/StatusBadge';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { EmptyState } from '@/components/common/EmptyState';
import { ADVISOR_STATUS_LABELS } from '@/utils/constants';
import { formatRelativeTime, getInitials } from '@/utils/helpers';
import useUIStore from '@/store/uiStore';

export default function SelfAssignPage() {
  const [items, setItems] = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [submittingId, setSubmittingId] = useState(null);
  const addToast = useUIStore((s) => s.addToast);

  const load = useCallback(async () => {
    try {
      const [teamsRes, reqRes] = await Promise.all([
        advisorService.getTeamsNeedingAdvisor(),
        advisorService.getMyRequests(),
      ]);
      setItems(teamsRes.data || []);
      setMyRequests(reqRes.data || []);
    } catch {
      addToast({ type: 'error', message: 'Gagal memuat daftar tim' });
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => { load(); }, [load]);

  const handleSelfAssign = async (teamId) => {
    setSubmittingId(teamId);
    try {
      await advisorService.selfAssign(teamId);
      addToast({ type: 'success', message: 'Pengajuan diri terkirim. Menunggu persetujuan admin.' });
      load();
    } catch (err) {
      addToast({ type: 'error', message: err.response?.data?.message || 'Gagal mengajukan diri' });
    } finally {
      setSubmittingId(null);
    }
  };

  const filtered = items.filter((it) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      String(it.team?.name || '').toLowerCase().includes(q) ||
      String(it.competition?.name || '').toLowerCase().includes(q) ||
      String(it.team?.leader?.name || '').toLowerCase().includes(q)
    );
  });

  if (loading) return <LoadingSpinner className="py-16" />;

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Ajukan Diri sebagai Pembimbing</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Tim di bawah ini masih membutuhkan dosen pembimbing. Pengajuan Anda akan ditinjau admin.
        </p>
      </div>

      {/* Status pengajuan saya */}
      {myRequests.length > 0 && (
        <div className="rounded-[28px] bg-white dark:bg-[#131620]/90 border border-slate-200/80 dark:border-white/10 p-5 shadow-sm">
          <h2 className="text-sm font-extrabold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
            <Clock size={15} className="text-purple-500" /> Pengajuan Diri Saya
            <span className="text-[10px] font-bold bg-purple-100 text-purple-700 dark:bg-purple-500/15 dark:text-purple-300 px-2 py-0.5 rounded-full">
              {myRequests.length}
            </span>
          </h2>
          <div className="grid gap-2 sm:grid-cols-2">
            {myRequests.slice(0, 6).map((r) => (
              <div key={r.id} className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200/70 dark:border-white/10 px-3 py-2">
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-800 dark:text-white truncate">{r.team?.name || r.team_name}</p>
                  <p className="text-[10px] font-semibold text-slate-400 truncate">
                    {r.competition?.name || r.competition_title} • {formatRelativeTime(r.created_at)}
                  </p>
                </div>
                <StatusBadge status={r.status} labels={ADVISOR_STATUS_LABELS} />
              </div>
            ))}
          </div>
        </div>
      )}

      {items.length > 0 && (
        <div className="relative max-w-md">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Cari tim, lomba, atau ketua..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 rounded-xl"
          />
        </div>
      )}

      {items.length === 0 ? (
        <EmptyState
          icon={GraduationCap}
          title="Tidak ada tim yang membutuhkan pembimbing"
          description="Saat ini semua tim di lomba yang membutuhkan pembimbing sudah memiliki dosen. Cek lagi nanti."
          action={
            <Link to="/dosen/my-teams">
              <Button variant="outline" className="rounded-full">Lihat Tim Bimbingan</Button>
            </Link>
          }
        />
      ) : filtered.length === 0 ? (
        <EmptyState icon={Search} title="Tidak ditemukan" description="Tidak ada tim yang cocok dengan pencarian Anda." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 stagger-children">
          {filtered.map(({ team, competition, quota, approved_advisors, my_request }) => {
            const members = team.members || [];
            const requested = Boolean(my_request);
            return (
              <div
                key={team.id}
                className="rounded-[28px] bg-white dark:bg-[#131620]/90 border border-slate-200/80 dark:border-white/10 shadow-sm hover:shadow-lg transition-all overflow-hidden"
              >
                <div className="h-1.5 bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500" />
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-700 text-white flex items-center justify-center font-extrabold text-xs shrink-0">
                        {getInitials(team.name)}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-extrabold text-slate-900 dark:text-white truncate">{team.name}</h3>
                        <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1 truncate">
                          <Trophy size={10} /> {competition?.name || team.competition_title}
                        </p>
                      </div>
                    </div>
                    <Badge variant="warning" className="shrink-0">
                      Butuh {quota - approved_advisors}
                    </Badge>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 mb-3 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                    <span className="inline-flex items-center gap-1 bg-slate-100 dark:bg-white/5 px-2 py-0.5 rounded-full">
                      <Crown size={10} className="text-amber-500" /> {team.leader?.name || team.leader_name || '-'}
                    </span>
                    <span className="inline-flex items-center gap-1 bg-slate-100 dark:bg-white/5 px-2 py-0.5 rounded-full">
                      <UsersRound size={10} /> {members.length} anggota
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {members.slice(0, 5).map((m) => (
                      <span key={m.user_id} className="text-[10px] font-semibold bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-full">
                        {m.name}
                      </span>
                    ))}
                    {members.length > 5 && (
                      <span className="text-[10px] font-semibold text-slate-400 px-1">+{members.length - 5}</span>
                    )}
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-100 dark:border-white/5">
                    <Link
                      to={`/dosen/competitions/${competition?.id}`}
                      className="text-[11px] font-bold text-slate-500 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 inline-flex items-center gap-1"
                    >
                      Lihat Lomba <ArrowRight size={11} />
                    </Link>

                    {requested ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-600 dark:text-amber-400">
                        <Clock size={13} /> Menunggu admin
                      </span>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => handleSelfAssign(team.id)}
                        disabled={submittingId === team.id}
                        className="rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 px-4"
                      >
                        <Send size={13} className="mr-1.5" />
                        {submittingId === team.id ? 'Mengirim...' : 'Ajukan Diri'}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
