import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, UsersRound, Crown, GraduationCap, Trophy, Calendar, Clock,
  ClipboardList, CheckCircle2, XCircle, MessageSquare,
  Mail, Building2,
} from 'lucide-react';
import advisorService from '@/services/advisorService';
import { TeamChangeRequestModal } from '@/components/dosen/TeamChangeRequestModal';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { StatusBadge } from '@/components/common/StatusBadge';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ADVISOR_STATUS_LABELS, STATUS_LABELS } from '@/utils/constants';
import { formatDate, formatRelativeTime, getInitials } from '@/utils/helpers';

export default function DetailTimDosenPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [showChangeModal, setShowChangeModal] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await advisorService.getTeamDetail(id);
      setTeam(res.data);
    } catch (error) {
      if (error.response?.status === 403 || error.response?.status === 404) setForbidden(true);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <LoadingSpinner className="py-16" />;

  if (forbidden || !team) {
    return (
      <div className="text-center py-16 space-y-4">
        <p className="text-slate-500 dark:text-slate-400 font-medium">
          Tim tidak ditemukan atau Anda bukan pembimbing tim ini.
        </p>
        <Button variant="outline" onClick={() => navigate('/dosen/my-teams')} className="rounded-full">
          <ArrowLeft size={16} className="mr-1.5" /> Kembali ke Tim Bimbingan
        </Button>
      </div>
    );
  }

  const members = team.members || [];
  const comp = team.competition;
  const maxMembers = comp?.max_team_members || 10;
  const changeRequests = (team.submissions || []).filter((s) => s.type === 'team_change');
  const pendingChange = changeRequests.find((s) => s.status === 'pending');

  return (
    <div className="space-y-6 pb-12 max-w-5xl">
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
      >
        <ArrowLeft size={14} /> Kembali
      </button>

      {/* Hero */}
      <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-[#1E1B4B] via-[#2E1065] to-[#3B0764] p-7 sm:p-9 text-white shadow-2xl">
        <div className="absolute -top-20 -right-16 w-72 h-72 bg-purple-500/25 rounded-full blur-3xl pointer-events-none" />
        <div className="relative flex flex-col sm:flex-row sm:items-center gap-5">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-white/20 backdrop-blur-md border-2 border-white/30 flex items-center justify-center text-xl sm:text-2xl font-extrabold shrink-0">
            {getInitials(team.name)}
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight truncate">{team.name}</h1>
            {comp ? (
              <Link
                to={`/dosen/competitions/${comp.id}`}
                className="mt-1.5 inline-flex items-center gap-1.5 text-sm font-bold text-white bg-black/25 hover:bg-black/40 backdrop-blur-sm px-3 py-1 rounded-full transition-colors max-w-full"
              >
                <Trophy size={14} className="shrink-0" />
                <span className="truncate">{comp.name}</span>
              </Link>
            ) : (
              <p className="text-sm text-white/70 mt-1">Lomba tidak diketahui</p>
            )}
          </div>
          <div className="flex flex-col sm:items-end gap-2 shrink-0">
            <StatusBadge status={team.advisor_status} labels={ADVISOR_STATUS_LABELS} />
            <Button
              size="sm"
              onClick={() => setShowChangeModal(true)}
              disabled={Boolean(pendingChange)}
              title={pendingChange ? 'Masih ada pengajuan perubahan yang menunggu admin' : 'Ajukan perubahan tim'}
              className="rounded-full bg-white text-purple-950 hover:bg-purple-100 font-bold disabled:bg-white/30 disabled:text-white"
            >
              <ClipboardList size={14} className="mr-1.5" /> Ajukan Perubahan
            </Button>
          </div>
        </div>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Anggota', value: `${members.length}/${maxMembers}`, icon: UsersRound },
          { label: 'Status Tim', value: team.status === 'forming' ? 'Dibentuk' : team.status === 'complete' ? 'Lengkap' : team.status || '-', icon: CheckCircle2 },
          { label: 'Pengajuan', value: changeRequests.length, icon: ClipboardList },
          { label: 'Menunggu', value: changeRequests.filter((s) => s.status === 'pending').length, icon: Clock },
        ].map((k) => (
          <div key={k.label} className="rounded-3xl bg-white dark:bg-[#15181e] border border-slate-200 dark:border-white/10 px-4 py-4 text-center shadow-sm">
            <k.icon size={16} className="mx-auto mb-1.5 text-purple-500" />
            <p className="font-extrabold text-purple-700 dark:text-purple-300 text-sm truncate">{k.value}</p>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mt-0.5">{k.label}</p>
          </div>
        ))}
      </div>

      {/* Anggota */}
      <div className="rounded-[28px] bg-white dark:bg-[#15181e] border border-slate-200 dark:border-white/10 shadow-sm overflow-hidden">
        <div className="h-1.5 bg-gradient-to-r from-purple-600 via-indigo-500 to-blue-500" />
        <div className="p-6">
          <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
            <UsersRound size={18} className="text-purple-500" /> Anggota Tim
            <span className="text-xs font-bold bg-purple-100 text-purple-700 dark:bg-purple-500/15 dark:text-purple-300 px-2.5 py-0.5 rounded-full">
              {members.length}/{maxMembers}
            </span>
          </h3>

          {members.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-6">Belum ada anggota.</p>
          ) : (
            <div className="space-y-2.5">
              {members.map((m) => {
                const isLeader = m.user_id === team.leader_id;
                return (
                  <div key={m.user_id} className="flex items-center gap-3 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 px-4 py-3">
                    <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-700 text-white flex items-center justify-center font-extrabold text-xs shrink-0">
                      {getInitials(m.name)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-slate-800 dark:text-white truncate flex items-center gap-1.5">
                        {m.name}
                        {isLeader && <Crown size={13} className="text-amber-500 shrink-0" />}
                      </p>
                      <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 truncate">
                        {isLeader ? 'Ketua Tim' : 'Anggota'}
                        {m.user?.startup_name && ` • ${m.user.startup_name}`}
                        {m.user?.nip_nim && ` • ${m.user.nip_nim}`}
                      </p>
                    </div>
                    {m.user?.email && (
                      <a
                        href={`mailto:${m.user.email}`}
                        className="p-2 rounded-lg text-slate-400 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-500/10 transition-colors shrink-0"
                        title={m.user.email}
                      >
                        <Mail size={15} />
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Info lomba & pembimbing */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="rounded-[28px] bg-white dark:bg-[#15181e] border border-slate-200 dark:border-white/10 shadow-sm p-6">
          <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
            <Trophy size={17} className="text-amber-500" /> Info Lomba
          </h3>
          {comp ? (
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Nama Lomba</p>
                <Link to={`/dosen/competitions/${comp.id}`} className="font-bold text-slate-800 dark:text-white hover:text-purple-600 dark:hover:text-purple-400">
                  {comp.name}
                </Link>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Pelaksanaan</p>
                  <p className="font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                    <Calendar size={12} /> {formatDate(comp.event_date, 'dd MMM yyyy') || '-'}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Deadline Daftar</p>
                  <p className="font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                    <Clock size={12} /> {formatDate(comp.registration_deadline, 'dd MMM yyyy') || '-'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap pt-1">
                <StatusBadge status={comp.status} labels={STATUS_LABELS} />
                {comp.organizer && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Building2 size={10} /> {comp.organizer}
                  </Badge>
                )}
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-500 dark:text-slate-400">Lomba tidak diketahui.</p>
          )}
        </div>

        <div className="rounded-[28px] bg-white dark:bg-[#15181e] border border-slate-200 dark:border-white/10 shadow-sm p-6">
          <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
            <GraduationCap size={17} className="text-amber-500" /> Dosen Pembimbing
          </h3>
          <div className="flex items-center gap-3 rounded-2xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 px-4 py-3">
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center justify-center font-extrabold text-xs shrink-0">
              {getInitials(team.advisor_name || team.advisor?.name)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-slate-800 dark:text-white truncate">
                {team.advisor_name || team.advisor?.name || 'Belum ada'}
              </p>
              <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Anda</p>
            </div>
            <StatusBadge status={team.advisor_status} labels={ADVISOR_STATUS_LABELS} />
          </div>

          <div className="mt-4">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">Riwayat Pengajuan</p>
            {changeRequests.length === 0 ? (
              <p className="text-xs font-semibold text-slate-400">Belum ada pengajuan perubahan tim.</p>
            ) : (
              <div className="space-y-2">
                {changeRequests.slice(0, 4).map((s) => (
                  <div key={s.id} className="flex items-start gap-2 text-xs">
                    <span className={`mt-0.5 shrink-0 ${s.status === 'approved' ? 'text-emerald-500' : s.status === 'rejected' ? 'text-rose-500' : 'text-amber-500'}`}>
                      {s.status === 'approved' ? <CheckCircle2 size={13} /> : s.status === 'rejected' ? <XCircle size={13} /> : <Clock size={13} />}
                    </span>
                    <div className="min-w-0">
                      <p className="font-bold text-slate-700 dark:text-slate-200 truncate">
                        {s.change_type_label || s.type_label || 'Perubahan Tim'}
                      </p>
                      <p className="text-slate-400 font-semibold">
                        {formatRelativeTime(s.created_at)}
                        {s.target_user_name ? ` • ${s.target_user_name}` : ''}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Timeline pengajuan lengkap */}
      {changeRequests.length > 0 && (
        <div className="rounded-[28px] bg-white dark:bg-[#15181e] border border-slate-200 dark:border-white/10 shadow-sm p-6">
          <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
            <ClipboardList size={17} className="text-purple-500" /> Pengajuan Perubahan Tim
          </h3>
          <div className="space-y-3">
            {changeRequests.map((s) => (
              <div key={s.id} className="rounded-2xl border border-slate-200/70 dark:border-white/5 bg-slate-50/80 dark:bg-white/5 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline">{s.change_type_label || 'Perubahan Tim'}</Badge>
                    <StatusBadge status={s.status} labels={ADVISOR_STATUS_LABELS} />
                    {s.target_user_name && (
                      <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                        Target: {s.target_user_name}
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] font-semibold text-slate-400">{formatRelativeTime(s.created_at)}</span>
                </div>
                {s.notes && (
                  <p className="text-xs text-slate-600 dark:text-slate-300 flex items-start gap-1.5">
                    <MessageSquare size={12} className="shrink-0 mt-0.5 text-slate-400" />
                    <span>{s.notes}</span>
                  </p>
                )}
                {s.admin_notes && (
                  <p className="mt-1.5 text-xs font-semibold text-purple-600 dark:text-purple-400">
                    Catatan admin: {s.admin_notes}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <TeamChangeRequestModal
        isOpen={showChangeModal}
        onClose={() => setShowChangeModal(false)}
        team={team}
        onSuccess={load}
      />
    </div>
  );
}
