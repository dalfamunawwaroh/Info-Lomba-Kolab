import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UserPlus, Search, Trophy, Users, Clock, CheckCircle2, RefreshCw,
  GraduationCap, ArrowRight, Hash, Inbox,
} from 'lucide-react';
import registrationService from '@/services/registrationService';
import competitionService from '@/services/competitionService';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Select } from '@/components/common/Select';
import { Badge } from '@/components/common/Badge';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Modal } from '@/components/common/Modal';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { EmptyState } from '@/components/common/EmptyState';
import { formatDate, getInitials } from '@/utils/helpers';
import useUIStore from '@/store/uiStore';

const STATUS_LABELS = { waiting: 'Menunggu', assigned: 'Sudah Dibuatkan', rejected: 'Ditolak' };

export default function SoloRegistrationsPage() {
  const [registrations, setRegistrations] = useState([]);
  const [competitions, setCompetitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('waiting');
  const [competitionFilter, setCompetitionFilter] = useState('');
  const [search, setSearch] = useState('');

  const [assignTarget, setAssignTarget] = useState(null);
  const [teamName, setTeamName] = useState('');
  const [assigning, setAssigning] = useState(false);

  const addToast = useUIStore((s) => s.addToast);
  const navigate = useNavigate();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (competitionFilter) params.competition_id = competitionFilter;

      const [regRes, compRes] = await Promise.all([
        registrationService.getRegistrations(params),
        competitionService.getCompetitions({ limit: 100 }).catch(() => ({ data: [] })),
      ]);

      setRegistrations(regRes.data || []);
      setCompetitions(compRes.data || []);
    } catch (err) {
      addToast({
        type: 'error',
        message: err.response?.data?.message || 'Gagal memuat pendaftaran solo',
      });
    } finally {
      setLoading(false);
    }
  }, [statusFilter, competitionFilter, addToast]);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return registrations;
    return registrations.filter((reg) => {
      const name = String(reg.user?.name || reg.user_name || '').toLowerCase();
      const nim = String(reg.user?.nip_nim || reg.user_nim || '').toLowerCase();
      const comp = String(reg.competition?.title || reg.competition_title || '').toLowerCase();
      return name.includes(q) || nim.includes(q) || comp.includes(q);
    });
  }, [registrations, search]);

  const openAssign = (reg) => {
    const firstName = String(reg.user?.name || reg.user_name || 'Mahasiswa').split(' ')[0];
    setAssignTarget(reg);
    setTeamName(`Tim ${firstName}`);
  };

  const confirmAssign = async () => {
    if (!assignTarget) return;
    setAssigning(true);
    try {
      const res = await registrationService.assignRegistration(assignTarget.id, {
        team_name: teamName.trim(),
      });
      addToast({ type: 'success', message: res?.message || 'Tim berhasil dibuat' });
      setAssignTarget(null);
      setTeamName('');
      load();
    } catch (err) {
      addToast({
        type: 'error',
        message: err.response?.data?.message || 'Gagal membuat tim',
      });
    } finally {
      setAssigning(false);
    }
  };

  const waitingCount = registrations.filter((r) => r.status === 'waiting').length;
  const assignedCount = registrations.filter((r) => r.status === 'assigned').length;

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
            Pendaftaran Tanpa Tim
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Mahasiswa yang mendaftar lomba secara solo. Buatkan tim agar mereka bisa berkompetisi.
          </p>
        </div>
        <Button variant="outline" onClick={load} disabled={loading} className="rounded-full">
          <RefreshCw size={15} className={`mr-1.5 ${loading ? 'animate-spin' : ''}`} />
          Muat Ulang
        </Button>
      </div>

      {/* Stat cards */}
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-[24px] bg-gradient-to-br from-amber-500 to-orange-600 p-5 text-white shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-white/80">Menunggu</p>
            <Clock size={16} className="text-white/70" />
          </div>
          <p className="text-3xl font-black mt-2">{waitingCount}</p>
          <p className="text-[11px] font-semibold text-white/75 mt-0.5">belum dibuatkan tim</p>
        </div>
        <div className="rounded-[24px] bg-gradient-to-br from-emerald-500 to-teal-600 p-5 text-white shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-white/80">Sudah Diproses</p>
            <CheckCircle2 size={16} className="text-white/70" />
          </div>
          <p className="text-3xl font-black mt-2">{assignedCount}</p>
          <p className="text-[11px] font-semibold text-white/75 mt-0.5">sudah jadi tim</p>
        </div>
        <div className="rounded-[24px] bg-gradient-to-br from-purple-600 to-indigo-700 p-5 text-white shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-white/80">Total Ditampilkan</p>
            <Users size={16} className="text-white/70" />
          </div>
          <p className="text-3xl font-black mt-2">{registrations.length}</p>
          <p className="text-[11px] font-semibold text-white/75 mt-0.5">sesuai filter aktif</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Cari nama, NIM, atau lomba..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 rounded-xl"
          />
        </div>
        <Select
          value={competitionFilter}
          onChange={(e) => setCompetitionFilter(e.target.value)}
          className="sm:w-64 rounded-xl"
        >
          <option value="">Semua Lomba</option>
          {competitions.map((c) => (
            <option key={c.id} value={c.id}>{c.title}</option>
          ))}
        </Select>
        <Select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="sm:w-48 rounded-xl"
        >
          <option value="waiting">Menunggu</option>
          <option value="assigned">Sudah Dibuatkan</option>
          <option value="">Semua Status</option>
        </Select>
      </div>

      {/* List */}
      {loading ? (
        <LoadingSpinner className="py-16" />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={registrations.length === 0 ? Inbox : Search}
          title={registrations.length === 0 ? 'Tidak ada pendaftaran solo' : 'Tidak ada yang cocok'}
          description={
            registrations.length === 0
              ? statusFilter === 'waiting'
                ? 'Semua pendaftar solo sudah dibuatkan tim. Kerja bagus!'
                : 'Belum ada mahasiswa yang mendaftar tanpa tim pada filter ini.'
              : 'Ubah kata kunci pencarian atau filter lomba/status.'
          }
        />
      ) : (
        <div className="grid gap-3 lg:grid-cols-2 stagger-children">
          {filtered.map((reg) => {
            const name = reg.user?.name || reg.user_name || 'Tanpa nama';
            const nim = reg.user?.nip_nim || reg.user_nim || '';
            const compTitle = reg.competition?.title || reg.competition_title || 'Lomba';
            const isWaiting = reg.status === 'waiting';

            return (
              <div
                key={reg.id}
                className="rounded-[26px] bg-white dark:bg-[#15181e] border border-slate-200 dark:border-white/10 shadow-sm hover:shadow-md transition-all overflow-hidden"
              >
                <div className={`h-1.5 ${isWaiting ? 'bg-gradient-to-r from-amber-500 to-orange-500' : 'bg-gradient-to-r from-emerald-500 to-teal-500'}`} />
                <div className="p-5">
                  <div className="flex items-start gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-700 text-white flex items-center justify-center font-extrabold text-xs shrink-0">
                      {getInitials(name)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-extrabold text-slate-900 dark:text-white truncate">{name}</p>
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-0.5">
                        {nim && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                            <Hash size={10} /> {nim}
                          </span>
                        )}
                        {reg.user?.program_studi && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                            <GraduationCap size={10} /> {reg.user.program_studi}
                          </span>
                        )}
                      </div>
                    </div>
                    <StatusBadge status={reg.status} labels={STATUS_LABELS} />
                  </div>

                  <div className="mt-3 flex items-center gap-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200/70 dark:border-white/10 px-3 py-2">
                    <Trophy size={13} className="text-purple-500 shrink-0" />
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate">
                      {compTitle}
                    </span>
                  </div>

                  {reg.notes && (
                    <p className="mt-2 text-[11px] italic text-slate-500 dark:text-slate-400 line-clamp-2">
                      "{reg.notes}"
                    </p>
                  )}

                  <div className="mt-3 flex items-center justify-between gap-2 pt-3 border-t border-slate-100 dark:border-white/5">
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-400">
                      <Clock size={11} />
                      {reg.created_at ? formatDate(reg.created_at) : '-'}
                    </span>

                    {isWaiting ? (
                      <Button
                        size="sm"
                        onClick={() => openAssign(reg)}
                        className="rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 px-4"
                      >
                        <UserPlus size={13} className="mr-1.5" />
                        Buatkan Tim
                      </Button>
                    ) : reg.assigned_team_id ? (
                      <button
                        onClick={() => navigate(`/admin/teams/${reg.assigned_team_id}`)}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
                      >
                        Lihat Tim <ArrowRight size={11} />
                      </button>
                    ) : (
                      <Badge variant="secondary" className="text-[10px]">Sudah diproses</Badge>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal buatkan tim */}
      <Modal
        isOpen={!!assignTarget}
        onClose={() => !assigning && setAssignTarget(null)}
        title="Buatkan Tim"
        className="max-w-md"
      >
        {assignTarget && (
          <div className="space-y-4">
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Tim baru akan dibuat untuk{' '}
              <span className="font-bold text-slate-900 dark:text-white">
                {assignTarget.user?.name || assignTarget.user_name}
              </span>{' '}
              pada lomba{' '}
              <span className="font-bold text-slate-900 dark:text-white">
                {assignTarget.competition?.title || assignTarget.competition_title}
              </span>
              . Ia otomatis menjadi ketua tim.
            </p>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Nama Tim</label>
              <Input
                placeholder="Nama tim"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                className="rounded-xl"
                autoFocus
              />
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <Button
                variant="outline"
                onClick={() => setAssignTarget(null)}
                disabled={assigning}
                className="rounded-full"
              >
                Batal
              </Button>
              <Button
                onClick={confirmAssign}
                disabled={assigning || !teamName.trim()}
                className="rounded-full"
              >
                {assigning ? 'Membuat...' : 'Buat Tim'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
