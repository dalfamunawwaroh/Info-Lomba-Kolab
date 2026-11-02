import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Plus, X, Crown, Trash2, Trophy, UsersRound, GraduationCap, UserPlus, UserMinus } from 'lucide-react';
import teamService from '@/services/teamService';
import userService from '@/services/userService';
import advisorService from '@/services/advisorService';
import { Button } from '@/components/common/Button';
import { Select } from '@/components/common/Select';
import { Badge } from '@/components/common/Badge';
import { StatusBadge } from '@/components/common/StatusBadge';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ADVISOR_STATUS_LABELS } from '@/utils/constants';
import { getInitials } from '@/utils/helpers';
import useUIStore from '@/store/uiStore';

export default function DetailTimAdminPage() {
  const { id } = useParams();
  const [team, setTeam] = useState(null);
  const [users, setUsers] = useState([]);
  const [dosenList, setDosenList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedDosen, setSelectedDosen] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const addToast = useUIStore((s) => s.addToast);
  const navigate = useNavigate();

  const load = async () => {
    try {
      const [teamRes, usersRes] = await Promise.all([
        teamService.getTeamById(id),
        userService.getUsers({ role: 'mahasiswa', is_active: true, limit: 100 }),
      ]);
      setTeam(teamRes.data);
      setUsers(usersRes.data || []);
      const dRes = await userService.getUsers({ role: 'dosen', is_active: true, limit: 100 }).catch(() => ({ data: [] }));
      setDosenList(dRes.data || []);
    } catch (err) {
      addToast({ type: 'error', message: 'Gagal memuat data tim' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  const handleAddMember = async () => {
    if (!selectedUser) return;
    try {
      await teamService.updateMembers(id, { add_members: [parseInt(selectedUser)] });
      addToast({ type: 'success', message: 'Anggota ditambahkan' });
      setSelectedUser('');
      load();
    } catch (err) {
      addToast({ type: 'error', message: err.response?.data?.message || 'Gagal menambah anggota' });
    }
  };

  const handleRemoveMember = async (userId) => {
    try {
      await teamService.updateMembers(id, { remove_members: [userId] });
      addToast({ type: 'success', message: 'Anggota dihapus' });
      load();
    } catch (err) {
      addToast({ type: 'error', message: 'Gagal menghapus anggota' });
    }
  };

  const handleChangeLeader = async (userId) => {
    try {
      await teamService.updateTeam(id, { leader_id: userId });
      addToast({ type: 'success', message: 'Ketua tim diganti' });
      load();
    } catch (err) {
      addToast({ type: 'error', message: 'Gagal mengganti ketua' });
    }
  };

  const handleAssignDosen = async () => {
    if (!selectedDosen) return;
    try {
      await advisorService.assignByAdmin({ team_id: parseInt(id), advisor_id: parseInt(selectedDosen) });
      addToast({ type: 'success', message: 'Dosen pembimbing ditetapkan' });
      setSelectedDosen('');
      load();
    } catch (err) {
      addToast({ type: 'error', message: err.response?.data?.message || 'Gagal menetapkan dosen' });
    }
  };

  const handleDelete = async () => {
    try {
      await teamService.deleteTeam(id);
      addToast({ type: 'success', message: 'Tim berhasil dibubarkan' });
      navigate('/admin/teams');
    } catch (err) {
      addToast({ type: 'error', message: 'Gagal membubarkan tim' });
    }
  };

  if (loading) return <LoadingSpinner className="py-12" />;
  if (!team) return <p className="text-center py-12 text-slate-700 dark:text-slate-300">Tim tidak ditemukan</p>;

  const members = team.members || [];
  const isLeader = (m) => m.user_id === team.leader_id || m.role === 'Ketua Tim';
  const maxMembers = team.competition?.max_team_members || 10;
  const availableUsers = users.filter((u) => !members.find((m) => m.user_id === u.id));

  return (
    <div className="space-y-5">
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-[#6C1B75] dark:hover:text-purple-300 transition-colors"
      >
        <ArrowLeft size={14} /> Kembali
      </button>

      {/* Hero */}
      <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-r from-[#6C1B75] via-[#9333EA] to-[#C084FC] p-6 sm:p-8 text-white">
        <div className="absolute -top-16 -right-10 w-72 h-72 bg-white/15 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 left-1/3 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
        <div className="relative flex items-center gap-5">
          <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-3xl bg-white/20 backdrop-blur-md border-2 border-white/40 flex items-center justify-center text-xl sm:text-2xl font-extrabold shrink-0">
            {(team.name || 'T').charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight truncate">{team.name}</h1>
            {team.competition ? (
              <Link
                to={`/admin/competitions/${team.competition.id || team.competition_id}`}
                className="mt-1.5 inline-flex items-center gap-1.5 text-sm font-bold text-white bg-black/25 hover:bg-black/40 backdrop-blur-sm px-3 py-1 rounded-full truncate transition-colors"
                title="Lihat detail lomba"
              >
                <Trophy size={14} className="shrink-0" />
                <span className="truncate">{team.competition.name}</span>
              </Link>
            ) : (
              <p className="text-sm text-white/70 mt-1">Lomba tidak diketahui</p>
            )}
          </div>
          <div className="ml-auto flex items-center gap-2 shrink-0">
            <span className="inline-flex items-center rounded-full border border-amber-600/40 bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-800">
              {team.status === 'forming' ? 'Dibentuk' : team.status === 'complete' ? 'Lengkap' : team.status}
            </span>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setShowDeleteConfirm(true)}
              className="rounded-full shadow-lg"
            >
              <Trash2 size={14} className="mr-1" /> Bubarkan
            </Button>
          </div>
        </div>
      </div>

      {/* KPI ringkas */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Anggota', value: `${members.length}/${maxMembers}` },
          { label: 'Ketua', value: team.leader_name || '-', short: true },
          { label: 'Pembimbing', value: team.advisor_name || 'Belum ada', short: true },
        ].map((k) => (
          <div key={k.label} className="rounded-3xl bg-white dark:bg-[#15181e] border border-slate-200 dark:border-white/10 px-4 py-3.5 text-center shadow-sm">
            <p className={`font-extrabold text-[#6C1B75] dark:text-purple-300 ${k.short ? 'text-sm truncate' : 'text-xl'}`}>{k.value}</p>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mt-0.5">{k.label}</p>
          </div>
        ))}
      </div>

      {/* Anggota */}
      <div className="rounded-[2rem] bg-white dark:bg-[#15181e] border border-slate-200 dark:border-white/10 shadow-sm">
        <div className="h-1.5 rounded-t-[2rem] bg-gradient-to-r from-[#6C1B75] via-[#9333EA] to-[#C084FC]" />
        <div className="p-6">
          <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <UsersRound size={18} className="text-[#9333EA]" /> Anggota Tim
            <span className="text-xs font-bold bg-purple-100 text-[#6C1B75] dark:bg-purple-500/15 dark:text-purple-300 px-2.5 py-0.5 rounded-full">
              {members.length}/{maxMembers}
            </span>
          </h3>
          <div className="mt-4 space-y-2.5">
            {members.length === 0 && (
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 text-center py-6">Belum ada anggota.</p>
            )}
            {members.map((m) => {
              const leader = isLeader(m);
              return (
                <div key={m.user_id} className="flex items-center gap-3 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 px-4 py-3">
                  <Link
                    to={`/admin/users/${m.user_id}`}
                    className="h-10 w-10 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-700 text-white flex items-center justify-center font-extrabold text-sm shrink-0 hover:scale-105 transition-transform"
                    title="Lihat detail user"
                  >
                    {getInitials(m.name)}
                  </Link>
                  <div className="min-w-0 flex-1">
                    <Link
                      to={`/admin/users/${m.user_id}`}
                      className="text-sm font-bold text-slate-800 dark:text-white hover:text-[#6C1B75] dark:hover:text-purple-300 truncate block"
                    >
                      {m.name || 'Tanpa nama'}
                    </Link>
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                      {leader ? 'Ketua Tim' : m.status === 'confirmed' ? 'Anggota' : m.status || 'Anggota'}
                    </p>
                  </div>
                  {leader && <Crown size={16} className="text-amber-500 shrink-0" />}
                  {!leader && (
                    <div className="flex gap-1 shrink-0">
                      <button
                        onClick={() => handleChangeLeader(m.user_id)}
                        title="Jadikan Ketua"
                        className="w-9 h-9 rounded-full flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-amber-100 hover:text-amber-600 dark:hover:bg-amber-500/15 dark:hover:text-amber-300 transition-colors"
                      >
                        <Crown size={15} />
                      </button>
                      <button
                        onClick={() => handleRemoveMember(m.user_id)}
                        title="Hapus dari tim"
                        className="w-9 h-9 rounded-full flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-rose-100 hover:text-rose-600 dark:hover:bg-rose-500/15 dark:hover:text-rose-300 transition-colors"
                      >
                        <UserMinus size={15} />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          {members.length < maxMembers && (
            <div className="flex gap-2 pt-4">
              <Select value={selectedUser} onChange={(e) => setSelectedUser(e.target.value)} className="flex-1 rounded-xl text-slate-800 dark:text-white">
                <option value="">-- Tambah Anggota --</option>
                {availableUsers.map((u) => (
                  <option key={u.id} value={u.id}>{u.name} ({u.startup?.name || u.startup_name || '-'})</option>
                ))}
              </Select>
              <Button size="sm" onClick={handleAddMember} disabled={!selectedUser} className="rounded-full px-4 disabled:bg-slate-300 disabled:text-white disabled:opacity-100">
                <Plus size={15} className="mr-1" /> Tambah
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Pembimbing */}
      <div className="rounded-[2rem] bg-white dark:bg-[#15181e] border border-slate-200 dark:border-white/10 shadow-sm">
        <div className="h-1.5 rounded-t-[2rem] bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500" />
        <div className="p-6">
          <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <GraduationCap size={18} className="text-amber-500" /> Dosen Pembimbing
          </h3>
          <div className="mt-4">
            {team.advisor_name ? (
              <div className="flex items-center gap-3 rounded-2xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 px-4 py-3">
                <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center justify-center font-extrabold text-sm shrink-0">
                  {getInitials(team.advisor_name)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-slate-800 dark:text-white truncate">{team.advisor_name}</p>
                  <p className="text-xs font-medium text-slate-400 dark:text-slate-500">
                    Status: {team.advisor_status === 'approved' ? 'Disetujui' : team.advisor_status === 'pending' ? 'Menunggu' : team.advisor_status || '-'}
                  </p>
                </div>
                <StatusBadge status={team.advisor_status} labels={ADVISOR_STATUS_LABELS} />
              </div>
            ) : (
              <div className="text-center py-6">
                <div className="w-14 h-14 rounded-3xl bg-amber-100 dark:bg-amber-500/15 flex items-center justify-center mx-auto mb-3">
                  <GraduationCap size={22} className="text-amber-500" />
                </div>
                <p className="text-sm font-bold text-slate-700 dark:text-slate-200">Belum ada dosen pembimbing</p>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">Pilih dosen di bawah untuk menetapkan.</p>
              </div>
            )}
          </div>
          <div className="flex gap-2 pt-4">
            <Select value={selectedDosen} onChange={(e) => setSelectedDosen(e.target.value)} className="flex-1 rounded-xl text-slate-800 dark:text-white">
              <option value="">-- Tetapkan Dosen --</option>
              {dosenList.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </Select>
            <Button size="sm" onClick={handleAssignDosen} disabled={!selectedDosen} className="rounded-full px-4 disabled:bg-slate-300 disabled:text-white disabled:opacity-100">
              <UserPlus size={15} className="mr-1" /> Tetapkan
            </Button>
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="Bubarkan Tim?"
        message={`Bubarkan ${team.name}? Semua anggota akan keluar dari lomba.`}
        confirmText="Bubarkan"
      />
    </div>
  );
}
