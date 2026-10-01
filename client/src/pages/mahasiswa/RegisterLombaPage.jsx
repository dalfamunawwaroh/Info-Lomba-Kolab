import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, X } from 'lucide-react';
import competitionService from '@/services/competitionService';
import userService from '@/services/userService';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Select } from '@/components/common/Select';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import useUIStore from '@/store/uiStore';

export default function RegisterLombaPage() {
  const { id } = useParams();
  const [competition, setCompetition] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hasTeam, setHasTeam] = useState(null);
  const [teamName, setTeamName] = useState('');
  const [members, setMembers] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const addToast = useUIStore((s) => s.addToast);
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([
      competitionService.getCompetitionById(id),
      userService.getUsers({ role: 'mahasiswa', is_active: true, limit: 100 }),
    ]).then(([compRes, usersRes]) => {
      setCompetition(compRes.data);
      setUsers(usersRes.data || []);
    }).catch(() => addToast({ type: 'error', message: 'Gagal memuat data' }))
    .finally(() => setLoading(false));
  }, [id, addToast]);

  const addMember = () => {
    if (!selectedUser) return;
    const user = users.find((u) => u.id === parseInt(selectedUser));
    if (!user) return;
    if (members.find((m) => m.id === user.id)) {
      addToast({ type: 'error', message: 'Anggota sudah ditambahkan' });
      return;
    }
    setMembers([...members, user]);
    setSelectedUser('');
  };

  const removeMember = (userId) => {
    setMembers(members.filter((m) => m.id !== userId));
  };

  const handleSubmit = async () => {
    const errs = {};
    if (hasTeam) {
      if (!teamName.trim()) errs.teamName = 'Nama tim wajib diisi';
      if (members.length < 1) errs.members = 'Minimal 1 anggota selain ketua';
      if (members.length + 1 > (competition?.max_team_size || 10)) {
        errs.members = `Maksimal ${competition.max_team_size} anggota termasuk ketua`;
      }
    }
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setSubmitting(true);
    try {
      const data = hasTeam
        ? { has_team: true, team_name: teamName, member_ids: members.map((m) => m.id) }
        : { has_team: false };

      await competitionService.registerToCompetition(id, data);
      addToast({ type: 'success', message: hasTeam ? 'Berhasil mendaftar! Tim berhasil dibuat.' : 'Berhasil mendaftar. Tim akan disesuaikan oleh admin.' });
      navigate('/mahasiswa');
    } catch (err) {
      addToast({ type: 'error', message: err.response?.data?.message || 'Gagal mendaftar' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner className="py-12" />;
  if (!competition) return <p className="text-center py-12">Lomba tidak ditemukan</p>;

  return (
    <div className="max-w-2xl space-y-6">
      <Button variant="ghost" onClick={() => navigate(-1)}>
        <ArrowLeft className="h-4 w-4 mr-1" />Kembali
      </Button>

      <h1 className="text-2xl font-bold">Daftar: {competition.name}</h1>

      {hasTeam === null ? (
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setHasTeam(true)}>
            <CardContent className="p-6 text-center">
              <h3 className="text-lg font-semibold mb-2">Sudah Punya Tim</h3>
              <p className="text-sm text-muted-foreground">Buat tim dan tambahkan anggota</p>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setHasTeam(false)}>
            <CardContent className="p-6 text-center">
              <h3 className="text-lg font-semibold mb-2">Belum Punya Tim</h3>
              <p className="text-sm text-muted-foreground">Admin akan menyesuaikan tim kamu</p>
            </CardContent>
          </Card>
        </div>
      ) : hasTeam ? (
        <Card>
          <CardHeader>
            <CardTitle>Buat Tim</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nama Tim *</label>
              <Input value={teamName} onChange={(e) => setTeamName(e.target.value)} placeholder="Nama tim" />
              {errors.teamName && <p className="text-xs text-destructive">{errors.teamName}</p>}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Kamu (Ketua)</label>
              <p className="text-sm text-muted-foreground bg-muted p-2 rounded">Kamu otomatis menjadi ketua tim</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Tambah Anggota (max {competition.max_team_size - 1} lagi)</label>
              <div className="flex gap-2">
                <Select value={selectedUser} onChange={(e) => setSelectedUser(e.target.value)} className="flex-1">
                  <option value="">-- Pilih Anggota --</option>
                  {users.filter((u) => !members.find((m) => m.id === u.id)).map((u) => (
                    <option key={u.id} value={u.id}>{u.name} ({u.startup?.name || '-'})</option>
                  ))}
                </Select>
                <Button size="sm" onClick={addMember} disabled={!selectedUser}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {errors.members && <p className="text-xs text-destructive">{errors.members}</p>}
            </div>
            {members.length > 0 && (
              <div className="space-y-1">
                {members.map((m) => (
                  <div key={m.id} className="flex items-center justify-between p-2 bg-muted rounded">
                    <span className="text-sm">{m.name} ({m.startup?.name || '-'})</span>
                    <button onClick={() => removeMember(m.id)} className="text-destructive hover:text-destructive/80">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button onClick={handleSubmit} disabled={submitting} className="w-full">
              {submitting ? 'Mendaftar...' : 'Daftar Sekarang'}
            </Button>
          </CardFooter>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-6 text-center space-y-4">
            <p className="text-muted-foreground">Kamu akan didaftarkan tanpa tim. Admin akan menyesuaikan tim kamu nanti.</p>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? 'Mendaftar...' : 'Daftar'}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
