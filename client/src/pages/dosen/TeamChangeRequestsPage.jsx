import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  UsersRound, ClipboardList, Send, Clock, CheckCircle2, XCircle,
  MessageSquare, Trophy, ArrowRight, Crown,
} from 'lucide-react';
import advisorService from '@/services/advisorService';
import { TeamChangeRequestModal } from '@/components/dosen/TeamChangeRequestModal';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { StatusBadge } from '@/components/common/StatusBadge';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { EmptyState } from '@/components/common/EmptyState';
import { ADVISOR_STATUS_LABELS } from '@/utils/constants';
import { formatRelativeTime, getInitials } from '@/utils/helpers';
import useUIStore from '@/store/uiStore';

export default function TeamChangeRequestsPage() {
  const [myTeams, setMyTeams] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalTeam, setModalTeam] = useState(null);
  const addToast = useUIStore((s) => s.addToast);
  const navigate = useNavigate();

  const load = useCallback(async () => {
    try {
      const [teamsRes, reqRes] = await Promise.all([
        advisorService.getMyTeams(),
        advisorService.getMyChangeRequests(),
      ]);
      setMyTeams(teamsRes.data || []);
      setRequests(reqRes.data || []);
    } catch {
      addToast({ type: 'error', message: 'Gagal memuat data' });
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <LoadingSpinner className="py-16" />;

  const pendingByTeam = {};
  requests.forEach((r) => {
    if (r.status === 'pending') pendingByTeam[r.team_id] = r;
  });

  const approvedTeams = myTeams.filter((t) => t.status === 'approved' || t.team?.advisor_status === 'approved');

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Ajukan Perubahan Tim</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Ajukan penambahan anggota, penggantian ketua, atau penghapusan anggota ke admin.
        </p>
      </div>

      {/* Daftar tim */}
      {approvedTeams.length === 0 ? (
        <EmptyState
          icon={UsersRound}
          title="Belum ada tim bimbingan"
          description="Anda belum membimbing tim manapun. Ajukan diri sebagai pembimbing terlebih dahulu."
          action={
            <Button onClick={() => navigate('/dosen/self-assign')} className="rounded-full">
              <Send size={15} className="mr-1.5" /> Ajukan Diri
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 stagger-children">
          {approvedTeams.map((item) => {
            const team = item.team || item;
            const pending = pendingByTeam[team.id];
            return (
              <div
                key={item.id}
                className="rounded-[28px] bg-white dark:bg-[#131620]/90 border border-slate-200/80 dark:border-white/10 shadow-sm p-5 hover:shadow-lg transition-all"
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-700 text-white flex items-center justify-center font-extrabold text-xs shrink-0">
                      {getInitials(team.name)}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-extrabold text-slate-900 dark:text-white truncate">{team.name}</h3>
                      <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1 truncate">
                        <Trophy size={10} /> {team.competition?.name || team.competition_title || '-'}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline">{team.members?.length || 0} anggota</Badge>
                </div>

                <div className="flex flex-wrap gap-1.5 mb-4">
                  {(team.members || []).map((m) => (
                    <span key={m.user_id} className="inline-flex items-center gap-1 text-[10px] font-semibold bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-full">
                      {m.user_id === team.leader_id && <Crown size={9} className="text-amber-500" />}
                      {m.name}
                    </span>
                  ))}
                </div>

                <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-100 dark:border-white/5">
                  <Link
                    to={`/dosen/my-teams/${team.id}`}
                    className="text-[11px] font-bold text-slate-500 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 inline-flex items-center gap-1"
                  >
                    Detail Tim <ArrowRight size={11} />
                  </Link>
                  {pending ? (
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-600 dark:text-amber-400">
                      <Clock size={13} /> Menunggu admin
                    </span>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => setModalTeam(team)}
                      className="rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 px-4"
                    >
                      <ClipboardList size={13} className="mr-1.5" /> Ajukan Perubahan
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Riwayat pengajuan */}
      <div className="rounded-[28px] bg-white dark:bg-[#131620]/90 border border-slate-200/80 dark:border-white/10 shadow-sm overflow-hidden">
        <div className="h-1.5 bg-gradient-to-r from-purple-600 via-indigo-500 to-blue-500" />
        <div className="p-6">
          <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
            <ClipboardList size={17} className="text-purple-500" /> Riwayat Pengajuan Perubahan
            <span className="text-[10px] font-bold bg-purple-100 text-purple-700 dark:bg-purple-500/15 dark:text-purple-300 px-2 py-0.5 rounded-full">
              {requests.length}
            </span>
          </h2>

          {requests.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-8">
              Belum ada pengajuan perubahan tim.
            </p>
          ) : (
            <div className="space-y-3">
              {requests.map((r) => (
                <div key={r.id} className="rounded-2xl border border-slate-200/70 dark:border-white/5 bg-slate-50/80 dark:bg-white/5 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold text-slate-800 dark:text-white">{r.team?.name || r.team_name}</span>
                      <Badge variant="outline">{r.change_type_label || r.type_label || 'Perubahan Tim'}</Badge>
                      <StatusBadge status={r.status} labels={ADVISOR_STATUS_LABELS} />
                    </div>
                    <span className="text-[11px] font-semibold text-slate-400">{formatRelativeTime(r.created_at)}</span>
                  </div>
                  <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                    {r.competition?.name || r.competition_title || '-'}
                    {r.target_user_name ? ` • Target: ${r.target_user_name}` : ''}
                  </p>
                  {r.notes && (
                    <p className="text-xs text-slate-600 dark:text-slate-300 flex items-start gap-1.5">
                      <MessageSquare size={12} className="shrink-0 mt-0.5 text-slate-400" />
                      <span>{r.notes}</span>
                    </p>
                  )}
                  {r.admin_notes && (
                    <p className="mt-1.5 text-xs font-semibold text-purple-600 dark:text-purple-400">
                      Catatan admin: {r.admin_notes}
                    </p>
                  )}
                  {r.status === 'approved' && (
                    <p className="mt-1.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 size={12} /> Disetujui admin
                    </p>
                  )}
                  {r.status === 'rejected' && (
                    <p className="mt-1.5 text-[11px] font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1">
                      <XCircle size={12} /> Ditolak admin
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <TeamChangeRequestModal
        isOpen={Boolean(modalTeam)}
        onClose={() => setModalTeam(null)}
        team={modalTeam}
        onSuccess={load}
      />
    </div>
  );
}
