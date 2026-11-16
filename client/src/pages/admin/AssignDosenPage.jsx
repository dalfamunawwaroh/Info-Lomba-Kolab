import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  GraduationCap, Search, Trophy, Users, Crown, RefreshCw, UserPlus,
  ArrowRight, CheckCircle2, AlertCircle, Repeat, X,
} from 'lucide-react';
import teamService from '@/services/teamService';
import competitionService from '@/services/competitionService';
import userService from '@/services/userService';
import advisorService from '@/services/advisorService';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Select } from '@/components/common/Select';
import { Badge } from '@/components/common/Badge';
import { Modal } from '@/components/common/Modal';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { EmptyState } from '@/components/common/EmptyState';
import { getInitials } from '@/utils/helpers';
import useUIStore from '@/store/uiStore';

/* ── Helper: hitung pembimbing approved (mirror server/advisorHelpers.js) ── */
const approvedAdvisors = (team) => {
  const list = [];
  if (team.advisor_id && team.advisor_status === 'approved') {
    list.push({ id: team.advisor_id, name: team.advisor_name });
  }
  for (const a of team.advisors || []) {
    if (a?.status === 'approved' && !list.find((x) => x.id === a.id)) {
      list.push({ id: a.id, name: a.name });
    }
  }
  return list;
};

const advisorQuota = (comp) => {
  const q = Number(comp?.max_advisors);
  if (Number.isFinite(q) && q > 0) return q;
  return 1;
};

const needsAdvisor = (comp) => {
  if (!comp) return true;
  if (comp.needs_advisor === false) return false;
  const q = Number(comp.max_advisors);
  if (Number.isFinite(q) && q === 0) return false;
  return true;
};

const FILTERS = [
  { key: 'needs', label: 'Belum Ada Pembimbing' },
  { key: 'partial', label: 'Kurang Pembimbing' },
  { key: 'has', label: 'Sudah Ada' },
  { key: 'all', label: 'Semua Tim' },
];

export default function AssignDosenPage() {
  const [teams, setTeams] = useState([]);
  const [competitions, setCompetitions] = useState([]);
  const [dosenList, setDosenList] = useState([]);
  const [loading, setLoading] = useState(true);

  const [filter, setFilter] = useState('needs');
  const [competitionFilter, setCompetitionFilter] = useState('');
  const [search, setSearch] = useState('');

  const [target, setTarget] = useState(null);
  const [selectedDosen, setSelectedDosen] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const addToast = useUIStore((s) => s.addToast);
  const navigate = useNavigate();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [tRes, cRes, dRes] = await Promise.all([
        teamService.getTeams(),
        competitionService.getCompetitions({ limit: 100 }).catch(() => ({ data: [] })),
        userService.getUsers({ role: 'dosen', limit: 200 }).catch(() => ({ data: [] })),
      ]);
      setTeams(tRes.data || []);
      setCompetitions(cRes.data || []);
      setDosenList(dRes.data || []);
    } catch (err) {
      addToast({
        type: 'error',
        message: err.response?.data?.message || 'Gagal memuat data tim',
      });
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => { load(); }, [load]);

  const compById = useCallback(
    (id) => competitions.find((c) => c.id === id) || null,
    [competitions]
  );

  /* ── Baris tim yang sudah diperkaya info pembimbing ── */
  const rows = useMemo(() => {
    return teams.map((team) => {
      const comp = compById(team.competition_id);
      const advisors = approvedAdvisors(team);
      const quota = advisorQuota(comp);
      const required = needsAdvisor(comp);
      const missing = Math.max(0, quota - advisors.length);

      return {
        team,
        comp,
        advisors,
        quota,
        required,
        missing,
        complete: !required || advisors.length >= quota,
      };
    });
  }, [teams, compById]);

  const counts = useMemo(() => ({
    needs: rows.filter((r) => r.required && r.advisors.length === 0).length,
    partial: rows.filter((r) => r.required && r.advisors.length > 0 && r.missing > 0).length,
    has: rows.filter((r) => r.complete && r.advisors.length > 0).length,
    all: rows.length,
  }), [rows]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();

    return rows.filter((row) => {
      if (competitionFilter && row.team.competition_id !== Number(competitionFilter)) return false;

      if (filter === 'needs' && !(row.required && row.advisors.length === 0)) return false;
      if (filter === 'partial' && !(row.required && row.advisors.length > 0 && row.missing > 0)) return false;
      if (filter === 'has' && !(row.complete && row.advisors.length > 0)) return false;

      if (!q) return true;
      const hay = [
        row.team.name,
        row.team.leader_name,
        row.team.competition_title,
        row.comp?.title,
        ...row.advisors.map((a) => a.name),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return hay.includes(q);
    });
  }, [rows, filter, competitionFilter, search]);

  const openAssign = (row) => {
    setTarget(row);
    setSelectedDosen('');
  };

  const handleSubmit = async () => {
    if (!target || !selectedDosen) return;
    setSubmitting(true);
    try {
      const isReplace = target.advisors.length > 0;
      const res = isReplace
        ? await advisorService.replaceAdvisor(target.team.id, { new_advisor_id: Number(selectedDosen) })
        : await advisorService.assignByAdmin({
            team_id: Number(target.team.id),
            advisor_id: Number(selectedDosen),
          });

      addToast({
        type: 'success',
        message: res?.message || (isReplace ? 'Dosen pembimbing diganti' : 'Dosen pembimbing ditetapkan'),
      });
      setTarget(null);
      setSelectedDosen('');
      load();
    } catch (err) {
      addToast({
        type: 'error',
        message: err.response?.data?.message || 'Gagal menetapkan dosen pembimbing',
      });
    } finally {
      setSubmitting(false);
    }
  };

  /* Dosen yang sudah membimbing tim target tidak perlu muncul di pilihan */
  const dosenOptions = useMemo(() => {
    if (!target) return dosenList;
    return dosenList.filter((d) => !target.advisors.some((a) => a.id === d.id));
  }, [dosenList, target]);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
            Penetapan Dosen Pembimbing
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Tetapkan dosen pembimbing langsung ke tim, tanpa menunggu pengajuan mahasiswa (F-13).
          </p>
        </div>
        <Button variant="outline" onClick={load} disabled={loading} className="rounded-full">
          <RefreshCw size={15} className={`mr-1.5 ${loading ? 'animate-spin' : ''}`} />
          Muat Ulang
        </Button>
      </div>

      {/* Stat cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-[24px] bg-gradient-to-br from-rose-500 to-red-600 p-5 text-white shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-white/80">Tanpa Pembimbing</p>
            <AlertCircle size={16} className="text-white/70" />
          </div>
          <p className="text-3xl font-black mt-2">{counts.needs}</p>
          <p className="text-[11px] font-semibold text-white/75 mt-0.5">tim butuh dosen</p>
        </div>
        <div className="rounded-[24px] bg-gradient-to-br from-amber-500 to-orange-600 p-5 text-white shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-white/80">Kurang Kuota</p>
            <Users size={16} className="text-white/70" />
          </div>
          <p className="text-3xl font-black mt-2">{counts.partial}</p>
          <p className="text-[11px] font-semibold text-white/75 mt-0.5">butuh tambahan dosen</p>
        </div>
        <div className="rounded-[24px] bg-gradient-to-br from-emerald-500 to-teal-600 p-5 text-white shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-white/80">Sudah Lengkap</p>
            <CheckCircle2 size={16} className="text-white/70" />
          </div>
          <p className="text-3xl font-black mt-2">{counts.has}</p>
          <p className="text-[11px] font-semibold text-white/75 mt-0.5">tim punya pembimbing</p>
        </div>
        <div className="rounded-[24px] bg-gradient-to-br from-purple-600 to-indigo-700 p-5 text-white shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-white/80">Total Tim</p>
            <Users size={16} className="text-white/70" />
          </div>
          <p className="text-3xl font-black mt-2">{counts.all}</p>
          <p className="text-[11px] font-semibold text-white/75 mt-0.5">seluruh tim terdaftar</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => {
            const active = filter === f.key;
            return (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold transition-all ${
                  active
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-sm'
                    : 'bg-white dark:bg-white/5 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-white/10 hover:border-purple-300'
                }`}
              >
                {f.label}
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[10px] font-black ${
                    active ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {counts[f.key]}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Cari tim, ketua, lomba, atau dosen..."
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
        </div>
      </div>

      {/* List */}
      {loading ? (
        <LoadingSpinner className="py-16" />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={filter === 'needs' ? CheckCircle2 : Search}
          title={
            filter === 'needs' && counts.needs === 0
              ? 'Semua tim sudah punya pembimbing'
              : 'Tidak ada tim yang cocok'
          }
          description={
            filter === 'needs' && counts.needs === 0
              ? 'Tidak ada tim yang menunggu penetapan dosen pembimbing saat ini.'
              : 'Ubah filter status, pilih lomba lain, atau ubah kata kunci pencarian.'
          }
        />
      ) : (
        <div className="grid gap-3 lg:grid-cols-2 stagger-children">
          {filtered.map((row) => {
            const { team, comp, advisors, quota, missing, required } = row;
            const hasAdvisor = advisors.length > 0;
            const memberCount = (team.members || []).length;

            return (
              <div
                key={team.id}
                className="rounded-[26px] bg-white dark:bg-[#15181e] border border-slate-200 dark:border-white/10 shadow-sm hover:shadow-md transition-all overflow-hidden"
              >
                <div
                  className={`h-1.5 ${
                    !required
                      ? 'bg-slate-300 dark:bg-white/10'
                      : !hasAdvisor
                        ? 'bg-gradient-to-r from-rose-500 to-red-500'
                        : missing > 0
                          ? 'bg-gradient-to-r from-amber-500 to-orange-500'
                          : 'bg-gradient-to-r from-emerald-500 to-teal-500'
                  }`}
                />
                <div className="p-5">
                  {/* Team header */}
                  <div className="flex items-start gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-700 text-white flex items-center justify-center font-extrabold text-xs shrink-0">
                      {getInitials(team.name)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <button
                        onClick={() => navigate(`/admin/teams/${team.id}`)}
                        className="font-extrabold text-slate-900 dark:text-white hover:text-purple-600 dark:hover:text-purple-400 transition-colors truncate block text-left w-full"
                      >
                        {team.name}
                      </button>
                      <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1 truncate mt-0.5">
                        <Trophy size={10} /> {team.competition_title || comp?.title || 'Lomba'}
                      </p>
                    </div>
                    {!required ? (
                      <Badge variant="secondary" className="shrink-0 text-[10px]">Tanpa Pembimbing</Badge>
                    ) : !hasAdvisor ? (
                      <Badge variant="destructive" className="shrink-0 text-[10px]">Belum Ada</Badge>
                    ) : missing > 0 ? (
                      <Badge variant="warning" className="shrink-0 text-[10px]">Kurang {missing}</Badge>
                    ) : (
                      <Badge variant="success" className="shrink-0 text-[10px]">Lengkap</Badge>
                    )}
                  </div>

                  {/* Meta */}
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                    <span className="inline-flex items-center gap-1 bg-slate-100 dark:bg-white/5 px-2 py-0.5 rounded-full">
                      <Crown size={10} className="text-amber-500" /> {team.leader_name || '-'}
                    </span>
                    <span className="inline-flex items-center gap-1 bg-slate-100 dark:bg-white/5 px-2 py-0.5 rounded-full">
                      <Users size={10} /> {memberCount} anggota
                    </span>
                    {required && (
                      <span className="inline-flex items-center gap-1 bg-slate-100 dark:bg-white/5 px-2 py-0.5 rounded-full">
                        Kuota {advisors.length}/{quota}
                      </span>
                    )}
                  </div>

                  {/* Dosen chips */}
                  <div className="mt-3">
                    {hasAdvisor ? (
                      <div className="flex flex-wrap gap-1.5">
                        {advisors.map((a) => (
                          <span
                            key={a.id}
                            className="inline-flex items-center gap-1.5 text-[10px] font-bold bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-300 pl-1.5 pr-2 py-1 rounded-full"
                          >
                            <span className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[8px] font-black shrink-0">
                              {getInitials(a.name)}
                            </span>
                            {a.name}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 italic">
                        {required
                          ? 'Belum ada dosen pembimbing untuk tim ini.'
                          : 'Lomba ini tidak membutuhkan dosen pembimbing.'}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="mt-3 flex items-center justify-between gap-2 pt-3 border-t border-slate-100 dark:border-white/5">
                    <button
                      onClick={() => navigate(`/admin/teams/${team.id}`)}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-500 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-400"
                    >
                      Detail Tim <ArrowRight size={11} />
                    </button>

                    {required && missing > 0 && (
                      <Button
                        size="sm"
                        onClick={() => openAssign(row)}
                        className="rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 px-4"
                      >
                        {hasAdvisor ? (
                          <><Repeat size={13} className="mr-1.5" />Ganti Dosen</>
                        ) : (
                          <><UserPlus size={13} className="mr-1.5" />Tetapkan Dosen</>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal penetapan dosen */}
      <Modal
        isOpen={!!target}
        onClose={() => !submitting && setTarget(null)}
        title={target && target.advisors.length > 0 ? 'Ganti Dosen Pembimbing' : 'Tetapkan Dosen Pembimbing'}
        className="max-w-md"
      >
        {target && (
          <div className="space-y-4">
            <div className="rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200/70 dark:border-white/10 p-3">
              <p className="text-sm font-bold text-slate-900 dark:text-white">{target.team.name}</p>
              <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
                {target.team.competition_title || target.comp?.title}
              </p>
            </div>

            {target.advisors.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-xs font-bold text-slate-600 dark:text-slate-300">Pembimbing saat ini</p>
                <div className="flex flex-wrap gap-1.5">
                  {target.advisors.map((a) => (
                    <span
                      key={a.id}
                      className="inline-flex items-center gap-1 text-[10px] font-bold bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-amber-700 dark:text-amber-300 px-2 py-1 rounded-full"
                    >
                      <GraduationCap size={10} /> {a.name}
                    </span>
                  ))}
                </div>
                <p className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1 pt-1">
                  <AlertCircle size={11} />
                  Dosen lama akan digantikan oleh dosen yang Anda pilih.
                </p>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Pilih Dosen
              </label>
              <Select
                value={selectedDosen}
                onChange={(e) => setSelectedDosen(e.target.value)}
                className="rounded-xl"
              >
                <option value="">-- Pilih dosen pembimbing --</option>
                {dosenOptions.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}{d.program_studi ? ` — ${d.program_studi}` : ''}
                  </option>
                ))}
              </Select>
              {dosenOptions.length === 0 && (
                <p className="text-[11px] font-semibold text-rose-500">
                  Tidak ada dosen tersedia. Tambahkan dosen di Kelola User terlebih dahulu.
                </p>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <Button
                variant="outline"
                onClick={() => setTarget(null)}
                disabled={submitting}
                className="rounded-full"
              >
                <X size={14} className="mr-1" />Batal
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={submitting || !selectedDosen}
                className="rounded-full"
              >
                {submitting
                  ? 'Menyimpan...'
                  : target.advisors.length > 0
                    ? 'Ganti Dosen'
                    : 'Tetapkan'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
