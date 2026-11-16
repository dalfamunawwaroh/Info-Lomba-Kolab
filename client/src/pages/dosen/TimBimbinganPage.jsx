import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  UsersRound, Trophy, Crown, ArrowRight, Search, GraduationCap,
  Calendar, CheckCircle2, ClipboardList,
} from 'lucide-react';
import advisorService from '@/services/advisorService';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Badge } from '@/components/common/Badge';
import { StatusBadge } from '@/components/common/StatusBadge';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { EmptyState } from '@/components/common/EmptyState';
import { ADVISOR_STATUS_LABELS } from '@/utils/constants';
import { formatDate, getInitials } from '@/utils/helpers';
import useUIStore from '@/store/uiStore';

export default function TimBimbinganPage() {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const addToast = useUIStore((s) => s.addToast);
  const navigate = useNavigate();

  useEffect(() => {
    advisorService.getMyTeams()
      .then((res) => setTeams(res.data || []))
      .catch(() => addToast({ type: 'error', message: 'Gagal memuat data tim bimbingan' }))
      .finally(() => setLoading(false));
  }, [addToast]);

  if (loading) return <LoadingSpinner className="py-16" />;

  const filtered = teams.filter((item) => {
    const t = item.team || {};
    const q = search.toLowerCase();
    return (
      !q ||
      String(t.name || '').toLowerCase().includes(q) ||
      String(t.competition?.name || t.competition_title || '').toLowerCase().includes(q)
    );
  });

  const totalMembers = teams.reduce((acc, item) => acc + ((item.team || item).members || []).length, 0);

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Tim Bimbingan</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {teams.length} tim • {totalMembers} mahasiswa yang Anda bimbing
          </p>
        </div>
        <div className="flex gap-2">
          <Link to="/dosen/self-assign">
            <Button variant="outline" className="rounded-full">
              <UsersRound size={15} className="mr-1.5" /> Cari Tim Lain
            </Button>
          </Link>
          <Link to="/dosen/team-change-requests">
            <Button className="rounded-full bg-gradient-to-r from-purple-600 to-indigo-600">
              <ClipboardList size={15} className="mr-1.5" /> Ajukan Perubahan
            </Button>
          </Link>
        </div>
      </div>

      {teams.length > 0 && (
        <div className="relative max-w-md">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Cari nama tim atau lomba..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 rounded-xl"
          />
        </div>
      )}

      {teams.length === 0 ? (
        <EmptyState
          icon={UsersRound}
          title="Belum ada tim bimbingan"
          description="Anda belum membimbing tim manapun. Ajukan diri sebagai pembimbing pada tim yang membutuhkan."
          action={
            <Button onClick={() => navigate('/dosen/self-assign')} className="rounded-full">
              <UsersRound size={15} className="mr-1.5" /> Ajukan Diri Jadi Pembimbing
            </Button>
          }
        />
      ) : filtered.length === 0 ? (
        <EmptyState icon={Search} title="Tidak ditemukan" description="Tidak ada tim yang cocok dengan pencarian Anda." />
      ) : (
        <div className="grid gap-5 md:grid-cols-2 stagger-children">
          {filtered.map((item) => {
            const team = item.team || item;
            const comp = team.competition;
            const members = team.members || [];
            return (
              <div
                key={item.id}
                className="group rounded-[28px] bg-white dark:bg-[#131620]/90 border border-slate-200/80 dark:border-white/10 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden"
              >
                <div className="h-1.5 bg-gradient-to-r from-purple-600 via-indigo-500 to-blue-500" />
                <div className="p-6">
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-700 text-white flex items-center justify-center font-extrabold shrink-0">
                        {getInitials(team.name)}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-extrabold text-slate-900 dark:text-white text-lg truncate group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                          {team.name}
                        </h3>
                        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5 truncate">
                          <Trophy size={11} /> {comp?.name || team.competition_title || '-'}
                        </p>
                      </div>
                    </div>
                    <StatusBadge status={item.status} labels={ADVISOR_STATUS_LABELS} />
                  </div>

                  <div className="flex flex-wrap items-center gap-2 mb-4">
                    <Badge variant="outline" className="flex items-center gap-1">
                      <UsersRound size={11} /> {members.length} anggota
                    </Badge>
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <Calendar size={11} /> {formatDate(team.created_at, 'dd MMM yyyy') || '-'}
                    </Badge>
                    {team.advisor_status === 'approved' && (
                      <Badge variant="success" className="flex items-center gap-1">
                        <CheckCircle2 size={11} /> Aktif
                      </Badge>
                    )}
                  </div>

                  <div className="space-y-1.5 mb-4">
                    {members.slice(0, 4).map((m) => (
                      <div key={m.user_id} className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
                        <div className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-white/5 flex items-center justify-center text-[9px] font-extrabold text-slate-500 dark:text-slate-400 shrink-0">
                          {getInitials(m.name)}
                        </div>
                        <span className="truncate">{m.name}</span>
                        {m.user_id === team.leader_id && <Crown size={11} className="text-amber-500 shrink-0" />}
                        {m.user?.startup_name && (
                          <span className="text-[10px] text-slate-400 truncate">• {m.user.startup_name}</span>
                        )}
                      </div>
                    ))}
                    {members.length > 4 && (
                      <p className="text-[11px] font-semibold text-slate-400 pl-8">+{members.length - 4} anggota lainnya</p>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-white/5">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                      <GraduationCap size={12} /> {comp?.max_team_members ? `Max ${comp.max_team_members} anggota` : 'Tim bimbingan'}
                    </p>
                    <Link
                      to={`/dosen/my-teams/${team.id}`}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-purple-600 dark:text-purple-400 hover:gap-2.5 transition-all"
                    >
                      Lihat Detail <ArrowRight size={13} />
                    </Link>
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
