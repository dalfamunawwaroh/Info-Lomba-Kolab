import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  CheckCircle, XCircle, ClipboardList, Trophy, Crown, Users, Clock,
  GraduationCap, MessageSquare, ArrowRight,
} from 'lucide-react';
import advisorService from '@/services/advisorService';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Modal } from '@/components/common/Modal';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { EmptyState } from '@/components/common/EmptyState';
import { ADVISOR_STATUS_LABELS } from '@/utils/constants';
import { formatRelativeTime, formatDate, getInitials } from '@/utils/helpers';
import useUIStore from '@/store/uiStore';

const FILTERS = [
  { value: 'pending', label: 'Menunggu' },
  { value: 'approved', label: 'Disetujui' },
  { value: 'rejected', label: 'Ditolak' },
  { value: '', label: 'Semua' },
];

export default function PengajuanMasukPage() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [approveTarget, setApproveTarget] = useState(null);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [responding, setResponding] = useState(false);
  const addToast = useUIStore((s) => s.addToast);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      const res = await advisorService.getAdvisorRequests(params);
      setRequests(res.data || []);
    } catch {
      addToast({ type: 'error', message: 'Gagal memuat pengajuan' });
    } finally {
      setLoading(false);
    }
  }, [statusFilter, addToast]);

  useEffect(() => { load(); }, [load]);

  const handleApprove = async () => {
    if (!approveTarget) return;
    setResponding(true);
    try {
      await advisorService.respondToRequest(approveTarget.id, { status: 'approved' });
      addToast({ type: 'success', message: 'Pengajuan disetujui. Anda kini pembimbing tim tersebut.' });
      setApproveTarget(null);
      load();
    } catch (err) {
      addToast({ type: 'error', message: err.response?.data?.message || 'Gagal menyetujui' });
    } finally {
      setResponding(false);
    }
  };

  const handleReject = async () => {
    if (!rejectTarget) return;
    setResponding(true);
    try {
      await advisorService.respondToRequest(rejectTarget.id, {
        status: 'rejected',
        rejection_reason: rejectReason,
      });
      addToast({ type: 'success', message: 'Pengajuan ditolak' });
      setRejectTarget(null);
      setRejectReason('');
      load();
    } catch (err) {
      addToast({ type: 'error', message: err.response?.data?.message || 'Gagal menolak' });
    } finally {
      setResponding(false);
    }
  };

  const pendingCount = requests.filter((r) => r.status === 'pending').length;

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Pengajuan Pembimbing</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Tinjau permintaan bimbingan yang masuk, lalu setujui atau tolak dengan alasan.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-1 p-1 rounded-2xl bg-slate-100 dark:bg-white/5">
            {FILTERS.map((f) => (
              <button
                key={f.value || 'all'}
                onClick={() => setStatusFilter(f.value)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                  statusFilter === f.value
                    ? 'bg-white dark:bg-white/10 text-purple-700 dark:text-purple-300 shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                }`}
              >
                {f.label}
                {f.value === 'pending' && pendingCount > 0 && (
                  <span className="ml-1.5 text-[10px] bg-amber-500 text-white px-1.5 py-0.5 rounded-full">{pendingCount}</span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner className="py-16" />
      ) : requests.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="Tidak ada pengajuan"
          description={
            statusFilter === 'pending'
              ? 'Belum ada mahasiswa yang mengajukan Anda sebagai pembimbing saat ini.'
              : 'Tidak ada pengajuan dengan status tersebut.'
          }
        />
      ) : (
        <div className="space-y-4 stagger-children">
          {requests.map((req) => {
            const team = req.team;
            const members = team?.members || [];
            return (
              <div
                key={req.id}
                className="rounded-[28px] bg-white dark:bg-[#131620]/90 border border-slate-200/80 dark:border-white/10 shadow-sm hover:shadow-lg transition-all overflow-hidden"
              >
                <div className="h-1 bg-gradient-to-r from-purple-600 via-indigo-500 to-blue-500" />
                <div className="p-5 sm:p-6">
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                    {/* Info tim */}
                    <div className="flex gap-4 min-w-0 flex-1">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-700 text-white flex items-center justify-center font-extrabold text-sm shrink-0">
                        {getInitials(team?.name || req.team_name)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <h3 className="font-extrabold text-slate-900 dark:text-white text-lg truncate">
                            {team?.name || req.team_name || '-'}
                          </h3>
                          <StatusBadge status={req.status} labels={ADVISOR_STATUS_LABELS} />
                          {req.applicant_role === 'dosen' && req.applicant_id === req.team?.advisor_id && (
                            <Badge variant="outline">Ajukan Diri</Badge>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                          <span className="inline-flex items-center gap-1.5 bg-slate-100 dark:bg-white/5 px-2.5 py-1 rounded-full">
                            <Trophy size={12} /> {req.competition?.name || req.competition_title || '-'}
                          </span>
                          <span className="inline-flex items-center gap-1.5 bg-slate-100 dark:bg-white/5 px-2.5 py-1 rounded-full">
                            <Crown size={12} className="text-amber-500" />
                            {team?.leader?.name || team?.leader_name || '-'}
                          </span>
                          <span className="inline-flex items-center gap-1.5 bg-slate-100 dark:bg-white/5 px-2.5 py-1 rounded-full">
                            <Users size={12} /> {members.length} anggota
                          </span>
                          <span className="inline-flex items-center gap-1.5 text-slate-400">
                            <Clock size={12} /> {formatRelativeTime(req.created_at)}
                          </span>
                        </div>

                        {members.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-2.5">
                            {members.map((m) => (
                              <span
                                key={m.user_id}
                                className="inline-flex items-center gap-1 text-[11px] font-semibold bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-full"
                              >
                                {m.user_id === team?.leader_id && <Crown size={9} className="text-amber-500" />}
                                {m.name}
                              </span>
                            ))}
                          </div>
                        )}

                        {req.notes && (
                          <p className="mt-3 text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-white/5 border border-slate-200/70 dark:border-white/10 rounded-xl px-3 py-2 flex items-start gap-2">
                            <MessageSquare size={13} className="shrink-0 mt-0.5 text-slate-400" />
                            <span className="italic">"{req.notes}"</span>
                          </p>
                        )}

                        {req.status === 'rejected' && req.rejection_reason && (
                          <p className="mt-2 text-xs font-semibold text-rose-600 dark:text-rose-400">
                            Alasan penolakan: {req.rejection_reason}
                          </p>
                        )}

                        {req.status !== 'pending' && req.processed_at && (
                          <p className="mt-2 text-[11px] font-semibold text-slate-400">
                            Diproses {formatDate(req.processed_at, 'dd MMM yyyy HH:mm')}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Aksi */}
                    <div className="flex lg:flex-col gap-2 shrink-0">
                      {req.status === 'pending' ? (
                        <>
                          <Button
                            size="sm"
                            onClick={() => setApproveTarget(req)}
                            disabled={responding}
                            className="rounded-full px-5 bg-emerald-600 hover:bg-emerald-700"
                          >
                            <CheckCircle className="h-4 w-4 mr-1.5" /> Terima
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => { setRejectTarget(req); setRejectReason(''); }}
                            disabled={responding}
                            className="rounded-full px-5 text-rose-600 border-rose-200 hover:bg-rose-50 dark:border-rose-500/30 dark:hover:bg-rose-500/10"
                          >
                            <XCircle className="h-4 w-4 mr-1.5" /> Tolak
                          </Button>
                        </>
                      ) : (
                        <Link
                          to={`/dosen/my-teams`}
                          className="inline-flex items-center gap-1.5 text-xs font-bold text-purple-600 dark:text-purple-400 hover:underline underline-offset-4"
                        >
                          Lihat Tim Bimbingan <ArrowRight size={13} />
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal konfirmasi terima */}
      <Modal isOpen={!!approveTarget} onClose={() => setApproveTarget(null)} title="Terima Pengajuan?">
        <div className="space-y-4">
          <div className="flex items-center gap-3 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 p-4">
            <div className="w-11 h-11 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shrink-0">
              <GraduationCap size={20} />
            </div>
            <div className="min-w-0">
              <p className="font-bold text-slate-900 dark:text-white text-sm truncate">
                {approveTarget?.team?.name || approveTarget?.team_name}
              </p>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 truncate">
                {approveTarget?.competition?.name || approveTarget?.competition_title}
              </p>
            </div>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Setelah disetujui, Anda akan resmi tercatat sebagai dosen pembimbing tim ini dan tim akan muncul di halaman
            <strong> Tim Bimbingan</strong>.
          </p>
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="outline" onClick={() => setApproveTarget(null)} className="rounded-full">Batal</Button>
            <Button onClick={handleApprove} disabled={responding} className="rounded-full bg-emerald-600 hover:bg-emerald-700 px-6">
              {responding ? 'Memproses...' : 'Ya, Terima'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal tolak */}
      <Modal isOpen={!!rejectTarget} onClose={() => setRejectTarget(null)} title="Tolak Pengajuan">
        <div className="space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Tolak pengajuan dari <strong>{rejectTarget?.team?.name || rejectTarget?.team_name}</strong>?
            Ketua tim akan melihat alasan penolakan Anda.
          </p>
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">
              Alasan Penolakan <span className="text-rose-500">*</span>
            </label>
            <textarea
              className="flex min-h-[90px] w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 px-3 py-2.5 text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-400 transition-all"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Contoh: Saya sudah membimbing 3 tim, belum bisa menambah beban bimbingan."
              rows={3}
            />
            {rejectReason.trim().length === 0 && (
              <p className="text-[11px] font-semibold text-slate-400">Wajib diisi sebelum menolak.</p>
            )}
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="outline" onClick={() => setRejectTarget(null)} className="rounded-full">Batal</Button>
            <Button
              onClick={handleReject}
              disabled={!rejectReason.trim() || responding}
              className="rounded-full bg-rose-600 hover:bg-rose-700 px-6"
            >
              {responding ? 'Memproses...' : 'Tolak Pengajuan'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
