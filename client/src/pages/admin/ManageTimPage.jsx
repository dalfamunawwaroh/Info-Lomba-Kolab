import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, UsersRound, Plus, Shuffle, UserPlus, Search, RefreshCw, Trophy } from 'lucide-react';
import competitionService from '@/services/competitionService';
import userService from '@/services/userService';
import api from '@/services/api';
import { Card, CardContent } from '@/components/common/Card';
import { Select } from '@/components/common/Select';
import { Input } from '@/components/common/Input';
import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';
import { StatusBadge } from '@/components/common/StatusBadge';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { EmptyState } from '@/components/common/EmptyState';
import { TEAM_STATUS_LABELS } from '@/utils/constants';
import useUIStore from '@/store/uiStore';

/* ── get initials ── */
const initials = (name = '') => name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

/* ── Add Team Modal ── */
function AddTeamModal({ competitions, onClose, onCreated }) {
  const [mode, setMode] = useState('custom'); // 'custom' | 'random'
  const [teamName, setTeamName] = useState('');
  const [competitionId, setCompetitionId] = useState('');
  const [numTeams, setNumTeams] = useState(2);
  const [teamPrefix, setTeamPrefix] = useState('Tim');
  const [students, setStudents] = useState([]);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [leaderId, setLeaderId] = useState('');
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [studentsError, setStudentsError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const addToast = useUIStore((s) => s.addToast);

  const loadStudents = useCallback(() => {
    setLoadingStudents(true);
    setStudentsError(false);
    userService.getUsers({ role: 'mahasiswa', limit: 500 })
      .then((res) => setStudents(res.data || []))
      .catch(() => {
        setStudents([]);
        setStudentsError(true);
        addToast({ type: 'error', message: 'Gagal memuat data mahasiswa' });
      })
      .finally(() => setLoadingStudents(false));
  }, [addToast]);

  useEffect(() => { loadStudents(); }, [loadStudents]);

  const toggleMember = (u) => {
    setSelectedMembers(prev => {
      if (prev.some(m => m.id === u.id)) return prev.filter(m => m.id !== u.id);
      return [...prev, u];
    });
  };

  const setLeader = (id) => {
    setLeaderId(id);
    // ensure leader is in members
    setSelectedMembers(prev => {
      if (prev.some(m => m.id === id)) return prev;
      const u = students.find(s => s.id === id);
      return u ? [...prev, u] : prev;
    });
  };

  const filteredStudents = students.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    (u.email || '').toLowerCase().includes(search.toLowerCase())
  );

  const handleCreate = async () => {
    if (!competitionId) {
      addToast({ type: 'error', message: 'Pilih lomba dulu' });
      return;
    }

    setSaving(true);
    try {
      if (mode === 'custom') {
        if (!teamName.trim()) {
          addToast({ type: 'error', message: 'Nama tim wajib diisi' });
          setSaving(false);
          return;
        }
        if (selectedMembers.length === 0) {
          addToast({ type: 'error', message: 'Pilih minimal 1 anggota dari daftar mahasiswa' });
          setSaving(false);
          return;
        }
        const lid = leaderId || selectedMembers[0].id;
        const lUser = students.find(s => s.id === lid) || selectedMembers[0];
        const members = selectedMembers.map(m => ({
          user_id: m.id,
          name: m.name,
          role: m.id === lid ? 'Ketua Tim' : 'Anggota',
          status: 'confirmed',
        }));
        await api.post('/teams', {
          name: teamName.trim(),
          competition_id: Number(competitionId),
          leader_id: lid,
          leader_name: lUser.name,
          members,
        });
        addToast({ type: 'success', message: `Tim "${teamName.trim()}" berhasil dibuat` });
        onCreated();
        onClose();
      } else {
        // Random mode
        const count = Math.max(1, Math.min(numTeams, students.length));
        if (count < 1 || students.length === 0) {
          addToast({ type: 'error', message: 'Tidak cukup mahasiswa untuk dibagi' });
          setSaving(false);
          return;
        }
        // shuffle
        const shuffled = [...students].sort(() => Math.random() - 0.5);
        const perTeam = Math.ceil(shuffled.length / count);
        const created = [];
        for (let i = 0; i < count; i++) {
          const chunk = shuffled.slice(i * perTeam, (i + 1) * perTeam);
          if (chunk.length === 0) continue;
          const lUser = chunk[0];
          const members = chunk.map((m, idx) => ({
            user_id: m.id,
            name: m.name,
            role: idx === 0 ? 'Ketua Tim' : 'Anggota',
            status: 'confirmed',
          }));
          await api.post('/teams', {
            name: `${teamPrefix.trim() || 'Tim'} ${i + 1}`,
            competition_id: Number(competitionId),
            leader_id: lUser.id,
            leader_name: lUser.name,
            members,
          });
          created.push(`${teamPrefix.trim() || 'Tim'} ${i + 1}`);
        }
        addToast({ type: 'success', message: `${created.length} tim berhasil dibuat secara acak` });
        onCreated();
        onClose();
      }
    } catch (err) {
      addToast({ type: 'error', message: err.response?.data?.message || 'Gagal membuat tim' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen onClose={onClose} title="Tambah Tim Baru" className="max-w-2xl">
      <div className="space-y-5">
        {/* Mode Tabs */}
        <div className="flex gap-2 p-1 rounded-xl bg-slate-100 dark:bg-white/5">
          {[
            { key: 'custom', label: 'Kustom', icon: UserPlus, desc: 'Pilih anggota sendiri' },
            { key: 'random', label: 'Random', icon: Shuffle, desc: 'Bagi otomatis' },
          ].map(t => (
            <button
              key={t.key}
              onClick={() => setMode(t.key)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all ${
                mode === t.key
                  ? 'bg-white dark:bg-white/10 text-purple-700 dark:text-purple-300 shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-white'
              }`}
            >
              <t.icon size={15} /> {t.label}
            </button>
          ))}
        </div>

        {/* Competition Select */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Lomba <span className="text-destructive">*</span></label>
          <Select value={competitionId} onChange={(e) => setCompetitionId(e.target.value)}>
            <option value="">-- Pilih Lomba --</option>
            {competitions.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
          </Select>
        </div>

        {mode === 'custom' ? (
          <>
            {/* Team name */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Nama Tim <span className="text-destructive">*</span></label>
              <Input placeholder="Contoh: Tim CyberNova Tech" value={teamName} onChange={(e) => setTeamName(e.target.value)} />
            </div>

            {/* Member picker */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Anggota <span className="text-slate-400 font-normal">({selectedMembers.length} dipilih)</span>
              </label>
              <div className="relative">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input placeholder="Cari mahasiswa..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
              </div>
              {loadingStudents ? (
                <div className="flex justify-center py-4"><LoadingSpinner /></div>
              ) : studentsError ? (
                <div className="flex flex-col items-center gap-2 py-4 text-center">
                  <p className="text-xs text-rose-500 font-medium">Data mahasiswa gagal dimuat</p>
                  <Button size="sm" variant="outline" onClick={loadStudents}>
                    <RefreshCw className="h-3.5 w-3.5 mr-1.5" />Coba Lagi
                  </Button>
                </div>
              ) : (
                <div className="max-h-48 overflow-y-auto space-y-1 rounded-xl border border-slate-100 dark:border-white/10 p-2">
                  {filteredStudents.map(u => {
                    const selected = selectedMembers.some(m => m.id === u.id);
                    const isLeader = leaderId === u.id;
                    return (
                      <button
                        key={u.id}
                        onClick={() => toggleMember(u)}
                        className={`w-full flex items-center gap-3 p-2.5 rounded-lg text-left transition-all ${
                          selected
                            ? 'bg-purple-50 dark:bg-purple-500/10 border border-purple-200 dark:border-purple-500/30'
                            : 'hover:bg-slate-50 dark:hover:bg-white/5 border border-transparent'
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold shrink-0 ${
                          selected ? 'bg-purple-500 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-300'
                        }`}>
                          {initials(u.name)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-slate-800 dark:text-white truncate">{u.name}</p>
                          <p className="text-[10px] text-slate-400 truncate">{u.nip_nim || u.email}</p>
                        </div>
                        {isLeader && <span className="text-[10px] font-bold text-amber-600 bg-amber-100 dark:bg-amber-500/15 px-2 py-0.5 rounded-full shrink-0">👑 Ketua</span>}
                        {selected && !isLeader && <span className="text-[10px] font-bold text-purple-600 bg-purple-100 dark:bg-purple-500/15 px-2 py-0.5 rounded-full shrink-0">✓</span>}
                      </button>
                    );
                  })}
                  {filteredStudents.length === 0 && !loadingStudents && (
                    <p className="text-center text-xs text-slate-400 py-4">Tidak ada mahasiswa ditemukan</p>
                  )}
                </div>
              )}
            </div>

            {/* Leader select — langsung dari seluruh mahasiswa */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Pilih Ketua</label>
              <Select value={leaderId} onChange={(e) => setLeader(Number(e.target.value))}>
                <option value="">-- Pilih Ketua (dari daftar mahasiswa) --</option>
                {students.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.name}{selectedMembers.some(s => s.id === m.id) ? '' : ' (belum dipilih jadi anggota)'}
                  </option>
                ))}
              </Select>
              <p className="text-[11px] text-slate-400">Ketua otomatis ditambahkan sebagai anggota tim</p>
            </div>
          </>
        ) : (
          <>
            {/* Random config */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Jumlah Tim</label>
                <Input type="number" min={1} max={20} value={numTeams} onChange={(e) => setNumTeams(Number(e.target.value))} />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Nama Awal Tim</label>
                <Input placeholder="Tim" value={teamPrefix} onChange={(e) => setTeamPrefix(e.target.value)} />
              </div>
            </div>
            <div className="rounded-xl bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 p-4 text-sm text-blue-700 dark:text-blue-300">
              <p className="font-semibold mb-1">Cara kerja Random:</p>
              <ul className="text-xs space-y-1 list-disc list-inside text-blue-600 dark:text-blue-400">
                <li>{students.length} mahasiswa aktif akan diacak</li>
                <li>Dibagi rata ke <strong>{numTeams} tim</strong></li>
                <li>Anggota pertama di tiap tim otomatis jadi ketua</li>
                <li>Nama tim: "{teamPrefix || 'Tim'} 1", "{teamPrefix || 'Tim'} 2", dst.</li>
              </ul>
            </div>
            {loadingStudents ? (
              <div className="flex justify-center py-4"><LoadingSpinner /></div>
            ) : studentsError ? (
              <div className="flex flex-col items-center gap-2 py-2 text-center">
                <p className="text-xs text-rose-500 font-medium">Data mahasiswa gagal dimuat</p>
                <Button size="sm" variant="outline" onClick={loadStudents}>
                  <RefreshCw className="h-3.5 w-3.5 mr-1.5" />Coba Lagi
                </Button>
              </div>
            ) : (
              <p className="text-xs text-slate-400 text-center">Tersedia <strong>{students.length}</strong> mahasiswa untuk dibagi</p>
            )}
          </>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-white/10">
          <Button variant="outline" onClick={onClose}>Batal</Button>
          <Button onClick={handleCreate} disabled={saving || loadingStudents}>
            {saving ? 'Membuat...' : mode === 'random' ? 'Buat Tim Random' : 'Buat Tim'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

/* ── Main Page ── */
export default function ManageTimPage() {
  const [competitions, setCompetitions] = useState([]);
  const [teams, setTeams] = useState([]);
  const [selectedComp, setSelectedComp] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [regs, setRegs] = useState([]);
  const [assignTarget, setAssignTarget] = useState(null);
  const [assignTeamName, setAssignTeamName] = useState('');
  const [assigning, setAssigning] = useState(false);
  const addToast = useUIStore((s) => s.addToast);
  const navigate = useNavigate();

  const loadData = useCallback(() => {
    setLoading(true);
    Promise.all([
      competitionService.getCompetitions({ limit: 100 }).catch(() => ({ data: [] })),
      api.get('/teams').catch(() => ({ data: { data: [] } })),
      api.get('/registrations', { params: { status: 'waiting' } }).catch(() => ({ data: { data: [] } })),
    ])
      .then(([cRes, tRes, rRes]) => {
        setCompetitions(cRes.data || []);
        setTeams(tRes.data?.data || []);
        setRegs(rRes.data?.data || []);
      })
      .catch(() => addToast({ type: 'error', message: 'Gagal memuat data tim' }))
      .finally(() => setLoading(false));
  }, [addToast]);

  useEffect(() => { loadData(); }, [loadData]);

  const compOf = useCallback(
    (t) => competitions.find((c) => c.id === t.competition_id) || null,
    [competitions]
  );

  const filteredTeams = useMemo(() => {
    const q = search.trim().toLowerCase();
    return teams.filter((t) => {
      const matchComp = !selectedComp || t.competition_id === Number(selectedComp);
      const matchSearch =
        !q ||
        t.name.toLowerCase().includes(q) ||
        (t.leader_name || '').toLowerCase().includes(q) ||
        (t.competition_title || '').toLowerCase().includes(q);
      return matchComp && matchSearch;
    });
  }, [teams, selectedComp, search]);

  const openAssign = (reg) => {
    setAssignTarget(reg);
    setAssignTeamName(`Tim ${(reg.user?.name || reg.user_name || 'Mahasiswa').split(' ')[0]}`);
  };

  const confirmAssign = async () => {
    if (!assignTarget) return;
    setAssigning(true);
    try {
      const res = await api.post(`/registrations/${assignTarget.id}/assign`, {
        team_name: assignTeamName.trim(),
      });
      addToast({ type: 'success', message: res.data?.message || 'Tim berhasil dibuat' });
      setAssignTarget(null);
      loadData();
    } catch (err) {
      addToast({ type: 'error', message: err.response?.data?.message || 'Gagal membuat tim' });
    } finally {
      setAssigning(false);
    }
  };

  if (loading) return <LoadingSpinner className="py-12" />;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Kelola Tim</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {teams.length} tim dari {competitions.length} lomba — ditampilkan seluruhnya tanpa perlu filter
          </p>
        </div>
        <Button onClick={() => setShowAddModal(true)}>
          <Plus className="h-4 w-4 mr-1" />Tambah Tim
        </Button>
      </div>

      {/* Toolbar: search + filter lomba (opsional, default semua) */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari nama tim, ketua, atau lomba..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={selectedComp} onChange={(e) => setSelectedComp(e.target.value)} className="sm:w-72">
          <option value="">Semua Lomba ({teams.length} tim)</option>
          {competitions.map((c) => (
            <option key={c.id} value={c.id}>{c.title}</option>
          ))}
        </Select>
      </div>

      {/* Pendaftar tanpa tim — menunggu admin buatkan tim */}
      {regs.length > 0 && (
        <Card>
          <CardContent>
            <div className="mb-3">
              <h2 className="font-semibold flex items-center gap-2">
                <UserPlus className="h-4 w-4 text-amber-600" />
                Pendaftar Tanpa Tim ({regs.length})
              </h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                Mahasiswa yang mendaftar lomba tanpa tim — buatkan tim agar bisa langsung berkompetisi
              </p>
            </div>
            <div className="space-y-3">
              {regs.map((reg) => (
                <div
                  key={reg.id}
                  className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-lg border border-amber-200 dark:border-amber-500/20 bg-amber-50/50 dark:bg-amber-500/5"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium">{reg.user?.name || reg.user_name}</p>
                      {(reg.user?.nip_nim || reg.user_nim) && (
                        <span className="text-xs text-muted-foreground">NIM {reg.user?.nip_nim || reg.user_nim}</span>
                      )}
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">
                        <Trophy className="h-3 w-3" />
                        {reg.competition?.title || reg.competition_title || 'Lomba'}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Mendaftar{' '}
                      {reg.created_at
                        ? new Date(reg.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
                        : '-'}
                      {reg.user?.program_studi ? ` • ${reg.user.program_studi}` : ''}
                    </p>
                    {reg.notes && <p className="text-sm text-muted-foreground italic">"{reg.notes}"</p>}
                  </div>
                  <Button size="sm" onClick={() => openAssign(reg)}>
                    <UserPlus className="h-4 w-4 mr-1" />Buatkan Tim
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Team list — always visible */}
      <Card>
        <CardContent>
          {filteredTeams.length > 0 ? (
            <div className="space-y-3">
              {filteredTeams.map((team) => {
                const comp = compOf(team);
                const maxMembers = comp?.max_team_members || null;
                return (
                  <div key={team.id} className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-lg border hover:bg-muted/50">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium">{team.name}</p>
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-500/15 dark:text-purple-300">
                          <Trophy className="h-3 w-3" />
                          {team.competition_title || comp?.title || 'Lomba'}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Ketua: {team.leader_name} | Anggota: {team.members?.length || 0}{maxMembers ? `/${maxMembers}` : ''}
                      </p>
                      {team.advisor_name && (
                        <p className="text-sm text-muted-foreground">
                          Dosen: {team.advisor_name}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={team.status} labels={TEAM_STATUS_LABELS} />
                      <Button size="sm" variant="outline" onClick={() => navigate(`/admin/teams/${team.id}`)}>
                        <Eye className="h-4 w-4 mr-1" />Detail
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : teams.length === 0 ? (
            <EmptyState
              icon={UsersRound}
              title="Belum ada tim"
              description="Klik 'Tambah Tim' untuk membuat tim baru di lomba mana pun"
            />
          ) : (
            <EmptyState
              icon={Search}
              title="Tidak ada tim yang cocok"
              description="Ubah kata kunci pencarian atau pilih lomba lain"
            />
          )}
        </CardContent>
      </Card>

      {assignTarget && (
        <Modal isOpen onClose={() => setAssignTarget(null)} title="Buatkan Tim" className="max-w-md">
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Tim baru akan dibuat untuk{' '}
              <span className="font-medium text-foreground">{assignTarget.user?.name || assignTarget.user_name}</span>{' '}
              pada lomba{' '}
              <span className="font-medium text-foreground">
                {assignTarget.competition?.title || assignTarget.competition_title}
              </span>
              . Ia otomatis menjadi ketua tim.
            </p>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Nama Tim</label>
              <Input
                placeholder="Nama tim"
                value={assignTeamName}
                onChange={(e) => setAssignTeamName(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setAssignTarget(null)} disabled={assigning}>
                Batal
              </Button>
              <Button onClick={confirmAssign} disabled={assigning || !assignTeamName.trim()}>
                {assigning ? 'Membuat...' : 'Buat Tim'}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {showAddModal && (
        <AddTeamModal
          competitions={competitions}
          onClose={() => setShowAddModal(false)}
          onCreated={loadData}
        />
      )}
    </div>
  );
}
