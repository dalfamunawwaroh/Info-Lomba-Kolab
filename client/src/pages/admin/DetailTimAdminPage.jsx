import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, X, Crown, Trash2 } from 'lucide-react';
import teamService from '@/services/teamService';
import userService from '@/services/userService';
import advisorService from '@/services/advisorService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Select } from '@/components/common/Select';
import { Badge } from '@/components/common/Badge';
import { StatusBadge } from '@/components/common/StatusBadge';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ADVISOR_STATUS_LABELS } from '@/utils/constants';
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
      // Load dosen
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
  if (!team) return <p className="text-center py-12">Tim tidak ditemukan</p>;

  const maxMembers = team.competition?.max_team_size || 10;

  return (
    <div className="space-y-6 max-w-3xl">
      <Button variant="ghost" onClick={() => navigate(-1)}>
        <ArrowLeft className="h-4 w-4 mr-1" />Kembali
      </Button>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{team.name}</h1>
          <p className="text-muted-foreground">Lomba: {team.competition?.name}</p>
        </div>
        <Button variant="destructive" size="sm" onClick={() => setShowDeleteConfirm(true)}>
          <Trash2 className="h-4 w-4 mr-1" />Bubarkan Tim
        </Button>
      </div>

      {/* Members */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Anggota Tim ({team.members?.length || 0}/{maxMembers})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {team.members?.map((m) => (
            <div key={m.id} className="flex items-center justify-between p-3 rounded border">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium">{m.user?.name}</span>
                {m.role_in_team === 'leader' && <Crown className="h-4 w-4 text-yellow-500" />}
                <span className="text-xs text-muted-foreground">{m.user?.startup}</span>
              </div>
              <div className="flex gap-1">
                {m.role_in_team !== 'leader' && (
                  <>
                    <Button size="sm" variant="ghost" onClick={() => handleChangeLeader(m.user?.id)} title="Jadikan Ketua">
                      <Crown className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleRemoveMember(m.user?.id)} title="Hapus">
                      <X className="h-4 w-4 text-destructive" />
                    </Button>
                  </>
                )}
              </div>
            </div>
          ))}

          {(team.members?.length || 0) < maxMembers && (
            <div className="flex gap-2 pt-2">
              <Select value={selectedUser} onChange={(e) => setSelectedUser(e.target.value)} className="flex-1">
                <option value="">-- Tambah Anggota --</option>
                {users.filter((u) => !team.members?.find((m) => m.user?.id === u.id)).map((u) => (
                  <option key={u.id} value={u.id}>{u.name} ({u.startup?.name || '-'})</option>
                ))}
              </Select>
              <Button size="sm" onClick={handleAddMember} disabled={!selectedUser}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Advisors */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Dosen Pembimbing</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {team.advisors?.length > 0 ? (
            team.advisors.map((a) => (
              <div key={a.id} className="flex items-center justify-between p-3 rounded border">
                <div>
                  <p className="text-sm font-medium">{a.advisor?.name}</p>
                  <p className="text-xs text-muted-foreground">Ditunjuk oleh: {a.assigned_by}</p>
                </div>
                <StatusBadge status={a.status} labels={ADVISOR_STATUS_LABELS} />
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">Belum ada dosen pembimbing</p>
          )}

          <div className="flex gap-2 pt-2">
            <Select value={selectedDosen} onChange={(e) => setSelectedDosen(e.target.value)} className="flex-1">
              <option value="">-- Tetapkan Dosen --</option>
              {dosenList.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </Select>
            <Button size="sm" onClick={handleAssignDosen} disabled={!selectedDosen}>
              Tetapkan
            </Button>
          </div>
        </CardContent>
      </Card>

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
