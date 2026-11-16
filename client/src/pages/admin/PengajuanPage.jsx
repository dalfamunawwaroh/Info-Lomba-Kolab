import { useState, useEffect, useCallback } from 'react';
import {
  CheckCircle, XCircle, ClipboardList, User, Users, Trophy, Calendar,
  Clock, GraduationCap, MessageSquare, AlertTriangle,
  UserPlus, UserMinus, Crown, FileText, History, ExternalLink,
} from 'lucide-react';
import submissionService from '@/services/submissionService';
import { Card, CardContent, CardHeader } from '@/components/common/Card';
import { Select } from '@/components/common/Select';
import { Button } from '@/components/common/Button';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Badge } from '@/components/common/Badge';
import { Modal } from '@/components/common/Modal';
import { Pagination } from '@/components/common/Pagination';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { EmptyState } from '@/components/common/EmptyState';
import { ADVISOR_STATUS_LABELS, SUBMISSION_TYPE_LABELS, TEAM_STATUS_LABELS } from '@/utils/constants';
import { formatRelativeTime, formatDate, getInitials } from '@/utils/helpers';
import useUIStore from '@/store/uiStore';

/* ── Label jenis perubahan tim ── */
const CHANGE_TYPE_LABELS = {
  add_member: 'Tambah Anggota',
  remove_member: 'Keluarkan Anggota',
  change_leader: 'Ganti Ketua',
};

const CHANGE_TYPE_ICONS = {
  add_member: UserPlus,
  remove_member: UserMinus,
  change_leader: Crown,
};

/* ── Satu baris info kecil ── */
function InfoRow({ icon: Icon, label, value, tone = 'default' }) {
  const toneCls =
    tone === 'warn'
      ? 'text-amber-600 dark:text-amber-400'
      : tone === 'ok'
        ? 'text-emerald-600 dark:text-emerald-400'
        : 'text-slate-500 dark:text-slate-400';
  return (
    <div className="flex items-start gap-2.5">
      <Icon size={14} className={`mt-0.5 shrink-0 ${toneCls}`} />
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">{label}</p>
        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 break-words">{value || '-'}</p>
      </div>
    </div>
  );
}

/* ── Kartu ringkas tim ── */
function TeamSummary({ team, competition }) {
  if (!team) return null;
  const members = team.members || [];
  return (
    <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/70 dark:bg-white/5 p-4 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-700 text-white flex items-center justify-center text-[11px] font-black shrink-0">
            {getInitials(team.name)}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-extrabold text-slate-900 dark:text-white truncate">{team.name}</p>
            <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 truncate">
              {competition?.name || competition?.title || team.competition_title || '-'}
            </p>
          </div>
        </div>
        <StatusBadge status={team.status} labels={TEAM_STATUS_LABELS} />
      </div>

      <div className="grid grid-cols-2 gap-2 text-[11px]">
        <div className="rounded-xl bg-white dark:bg-white/5 border border-slate-200/70 dark:border-white/10 px-2.5 py-2">
          <p className="font-bold text-slate-400 uppercase tracking-wide text-[9px]">Ketua</p>
          <p className="font-bold text-slate-800 dark:text-slate-100 truncate">{team.leader_name || '-'}</p>
        </div>
        <div className="rounded-xl bg-white dark:bg-white/5 border border-slate-200/70 dark:border-white/10 px-2.5 py-2">
          <p className="font-bold text-slate-400 uppercase tracking-wide text-[9px]">Anggota</p>
          <p className="font-bold text-slate-800 dark:text-slate-100">{members.length} orang</p>
        </div>
      </div>

      {members.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {members.map((m) => (
            <span
              key={m.user_id ?? m.name}
              className="inline-flex items-center gap-1 text-[10px] font-bold bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-full"
            >
              {m.role?.toLowerCase().includes('ketua') && <Crown size={9} className="text-amber-500" />}
              {m.name}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
        <GraduationCap size={12} className={team.advisor_name ? 'text-emerald-500' : 'text-slate-400'} />
        {team.advisor_name || 'Belum ada dosen pembimbing'}
      </div>
    </div>
  );
}

/* ── Detail isi pengajuan sesuai jenisnya ── */
function SubmissionDetail({ sub }) {
  const isTeamChange = sub.type === 'team_change';
  const isSelfAssign = sub.type === 'advisor_self_assign';
  const isTeamRequest = sub.type === 'advisor_request';
  const ChangeIcon = CHANGE_TYPE_ICONS[sub.change_type] || FileText;

  return (
    <div className="space-y-3">
      {/* Jenis pengajuan */}
      <div className="rounded-2xl border border-purple-200 dark:border-purple-500/25 bg-purple-50/60 dark:bg-purple-500/10 p-4">
        <div className="flex items-center gap-2 mb-2">
          <Badge variant="outline" className="text-[10px]">
            {SUBMISSION_TYPE_LABELS[sub.type] || sub.type_label || sub.type}
          </Badge>
          <StatusBadge status={sub.status} labels={ADVISOR_STATUS_LABELS} />
        </div>
        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
          {sub.type_label || SUBMISSION_TYPE_LABELS[sub.type] || sub.type}
        </p>
      </div>

      {/* Detail khusus perubahan tim */}
      {isTeamChange && (
        <div className="rounded-2xl border border-amber-200 dark:border-amber-500/30 bg-amber-50/70 dark:bg-amber-500/10 p-4 space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <ChangeIcon size={14} />
            </div>
            <p className="text-xs font-extrabold uppercase tracking-wide text-amber-700 dark:text-amber-300">
              {CHANGE_TYPE_LABELS[sub.change_type] || sub.change_type_label || 'Perubahan Tim'}
            </p>
          </div>
          <div className="grid gap-2 text-sm">
            {sub.target_user_name && (
              <div className="flex items-center justify-between gap-2 rounded-xl bg-white/70 dark:bg-white/5 px-3 py-2">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Mahasiswa target</span>
                <span className="font-bold text-slate-900 dark:text-white truncate">{sub.target_user_name}</span>
              </div>
            )}
            <div className="flex items-center justify-between gap-2 rounded-xl bg-white/70 dark:bg-white/5 px-3 py-2">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Tim tujuan</span>
              <span className="font-bold text-slate-900 dark:text-white truncate">{sub.team?.name || sub.team_name || '-'}</span>
            </div>
          </div>
          <p className="text-[11px] font-semibold text-amber-700 dark:text-amber-400 flex items-start gap-1.5 pt-0.5">
            <AlertTriangle size={12} className="mt-0.5 shrink-0" />
            Jika disetujui, perubahan komposisi tim langsung diterapkan.
          </p>
        </div>
      )}

      {/* Detail khusus pengajuan dosen */}
      {(isSelfAssign || isTeamRequest) && (
        <div className="rounded-2xl border border-emerald-200 dark:border-emerald-500/30 bg-emerald-50/70 dark:bg-emerald-500/10 p-4 space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <GraduationCap size={14} />
            </div>
            <p className="text-xs font-extrabold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
              {isSelfAssign ? 'Dosen Mengajukan Diri' : 'Permintaan Tim ke Dosen'}
            </p>
          </div>
          <div className="grid gap-2 text-sm">
            <div className="flex items-center justify-between gap-2 rounded-xl bg-white/70 dark:bg-white/5 px-3 py-2">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                {isSelfAssign ? 'Dosen pemohon' : 'Dosen yang diminta'}
              </span>
              <span className="font-bold text-slate-900 dark:text-white truncate">
                {isSelfAssign ? sub.applicant_name : (sub.target_advisor_name || sub.advisor_name || '-')}
              </span>
            </div>
            <div className="flex items-center justify-between gap-2 rounded-xl bg-white/70 dark:bg-white/5 px-3 py-2">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Tim</span>
              <span className="font-bold text-slate-900 dark:text-white truncate">{sub.team?.name || sub.team_name || '-'}</span>
            </div>
          </div>
          <p className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 flex items-start gap-1.5 pt-0.5">
            <AlertTriangle size={12} className="mt-0.5 shrink-0" />
            Jika disetujui, dosen resmi menjadi pembimbing tim ini.
          </p>
        </div>
      )}

      {/* Alasan / catatan pemohon */}
      {sub.description && (
        <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/70 dark:bg-white/5 p-4">
          <div className="flex items-center gap-2 mb-1.5">
            <MessageSquare size={13} className="text-slate-400" />
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Alasan / Keterangan Pemohon
            </p>
          </div>
          <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed italic">
            "{sub.description}"
          </p>
        </div>
      )}
    </div>
  );
}

export default function PengajuanPage() {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [typeFilter, setTypeFilter] = useState('');
  const [respondTarget, setRespondTarget] = useState(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [responding, setResponding] = useState(false);
  const addToast = useUIStore((s) => s.addToast);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 20 };
      if (statusFilter) params.status = statusFilter;
      if (typeFilter) params.type = typeFilter;
      const res = await submissionService.getSubmissions(params);
      setSubmissions(res.data || []);
      setTotalPages(res.meta?.total_pages || 1);
    } catch (err) {
      addToast({ type: 'error', message: 'Gagal memuat pengajuan' });
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, typeFilter, addToast]);

  useEffect(() => { load(); }, [load]);

  const handleRespond = async (status) => {
    setResponding(true);
    try {
      const res = await submissionService.respondToSubmission(respondTarget.id, {
        status,
        review_notes: reviewNotes || undefined,
      });
      addToast({
        type: 'success',
        message: res?.message || `Pengajuan ${status === 'approved' ? 'disetujui' : 'ditolak'}`,
      });
      setRespondTarget(null);
      setReviewNotes('');
      load();
    } catch (err) {
      addToast({
        type: 'error',
        message: err.response?.data?.message || 'Gagal merespons pengajuan',
      });
    } finally {
      setResponding(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Monitoring Pengajuan</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Tinjau permintaan perubahan tim dan pengajuan dosen pembimbing.
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-3">
            <Select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="w-40">
              <option value="">Semua Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Disetujui</option>
              <option value="rejected">Ditolak</option>
            </Select>
            <Select value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }} className="w-52">
              <option value="">Semua Jenis</option>
              <option value="advisor_self_assign">Ajukan Diri</option>
              <option value="advisor_request">Permintaan Tim</option>
              <option value="team_change">Perubahan Tim</option>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <LoadingSpinner className="py-12" />
          ) : submissions.length === 0 ? (
            <EmptyState icon={ClipboardList} title="Tidak ada pengajuan" />
          ) : (
            <>
              <div className="space-y-3">
                {submissions.map((sub) => (
                  <div key={sub.id} className="p-4 rounded-xl border hover:bg-muted/50 transition-colors">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="space-y-1.5 min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="outline">{SUBMISSION_TYPE_LABELS[sub.type] || sub.type_label || sub.type}</Badge>
                          <StatusBadge status={sub.status} labels={ADVISOR_STATUS_LABELS} />
                          {sub.type === 'team_change' && (
                            <Badge variant="warning" className="text-[10px]">
                              {CHANGE_TYPE_LABELS[sub.change_type] || sub.change_type_label || sub.change_type}
                            </Badge>
                          )}
                        </div>

                        <p className="text-sm font-bold text-slate-800 dark:text-white">
                          {sub.requester?.name || sub.applicant_name}
                          <span className="ml-2 text-[11px] font-semibold text-slate-400 uppercase">
                            {sub.requester?.role || sub.applicant_role}
                          </span>
                        </p>

                        {sub.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2">{sub.description}</p>
                        )}

                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                          {sub.team && (
                            <span className="inline-flex items-center gap-1">
                              <Users size={11} /> {sub.team.name}
                            </span>
                          )}
                          {sub.competition && (
                            <span className="inline-flex items-center gap-1">
                              <Trophy size={11} /> {sub.competition.name || sub.competition.title}
                            </span>
                          )}
                          {sub.type === 'team_change' && sub.target_user_name && (
                            <span className="inline-flex items-center gap-1">
                              <User size={11} /> Target: {sub.target_user_name}
                            </span>
                          )}
                          {(sub.target_advisor_name || sub.advisor_name) && (
                            <span className="inline-flex items-center gap-1">
                              <GraduationCap size={11} /> {sub.target_advisor_name || sub.advisor_name}
                            </span>
                          )}
                          <span className="inline-flex items-center gap-1">
                            <Clock size={11} /> {formatRelativeTime(sub.created_at)}
                          </span>
                        </div>

                        {sub.admin_notes && (
                          <p className="text-xs text-muted-foreground italic">Catatan: {sub.admin_notes}</p>
                        )}
                      </div>

                      <div className="flex gap-2 shrink-0">
                        <Button size="sm" variant="outline" onClick={() => setRespondTarget(sub)}>
                          <ExternalLink className="h-4 w-4 mr-1" />
                          {sub.status === 'pending' ? 'Review' : 'Lihat Detail'}
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
            </>
          )}
        </CardContent>
      </Card>

      {/* ── Modal Review / Detail ── */}
      <Modal
        isOpen={!!respondTarget}
        onClose={() => { setRespondTarget(null); setReviewNotes(''); }}
        title={respondTarget?.status === 'pending' ? 'Review Pengajuan' : 'Detail Pengajuan'}
        className="max-w-2xl"
      >
        {respondTarget && (
          <div className="space-y-5">
            {/* Identitas pemohon + waktu */}
            <div className="grid gap-3 sm:grid-cols-2">
              <InfoRow
                icon={User}
                label="Pemohon"
                value={`${respondTarget.requester?.name || respondTarget.applicant_name || '-'}${
                  (respondTarget.requester?.role || respondTarget.applicant_role)
                    ? ` (${respondTarget.requester?.role || respondTarget.applicant_role})`
                    : ''
                }`}
              />
              <InfoRow
                icon={Calendar}
                label="Waktu Pengajuan"
                value={respondTarget.created_at ? formatDate(respondTarget.created_at) : '-'}
              />
              <InfoRow
                icon={Clock}
                label="Diajukan"
                value={formatRelativeTime(respondTarget.created_at)}
              />
              <InfoRow
                icon={Trophy}
                label="Lomba"
                value={respondTarget.competition?.name || respondTarget.competition?.title || respondTarget.competition_title || '-'}
              />
            </div>

            {/* Detail isi pengajuan */}
            <SubmissionDetail sub={respondTarget} />

            {/* Ringkasan tim saat ini */}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
                Kondisi Tim Saat Ini
              </p>
              <TeamSummary team={respondTarget.team} competition={respondTarget.competition} />
            </div>

            {/* Riwayat proses */}
            {respondTarget.status !== 'pending' && (
              <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/70 dark:bg-white/5 p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <History size={13} className="text-slate-400" />
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    Riwayat Proses
                  </p>
                </div>
                <div className="flex items-center justify-between gap-2 text-sm">
                  <span className="font-semibold text-slate-600 dark:text-slate-300">Status akhir</span>
                  <StatusBadge status={respondTarget.status} labels={ADVISOR_STATUS_LABELS} />
                </div>
                {respondTarget.processed_at && (
                  <div className="flex items-center justify-between gap-2 text-sm">
                    <span className="font-semibold text-slate-600 dark:text-slate-300">Diproses</span>
                    <span className="font-bold text-slate-800 dark:text-white">{formatDate(respondTarget.processed_at)}</span>
                  </div>
                )}
                {respondTarget.admin_notes && (
                  <div className="pt-1">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Catatan admin</p>
                    <p className="text-sm text-slate-700 dark:text-slate-200 italic">"{respondTarget.admin_notes}"</p>
                  </div>
                )}
              </div>
            )}

            {/* Aksi hanya untuk pending */}
            {respondTarget.status === 'pending' ? (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Catatan review (opsional)</label>
                  <textarea
                    className="flex min-h-[70px] w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    placeholder="Alasan persetujuan atau penolakan — akan dilihat pemohon..."
                    rows={3}
                  />
                </div>
                <div className="flex flex-wrap justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => { setRespondTarget(null); setReviewNotes(''); }}
                    disabled={responding}
                  >
                    Batal
                  </Button>
                  <Button variant="destructive" onClick={() => handleRespond('rejected')} disabled={responding}>
                    <XCircle className="h-4 w-4 mr-1" />Tolak
                  </Button>
                  <Button onClick={() => handleRespond('approved')} disabled={responding}>
                    <CheckCircle className="h-4 w-4 mr-1" />Setujui
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex justify-end">
                <Button variant="outline" onClick={() => setRespondTarget(null)}>Tutup</Button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
