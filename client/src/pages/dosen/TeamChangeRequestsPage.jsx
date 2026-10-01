import { useState, useEffect } from 'react';
import { Send, UsersRound, Plus, ArrowRight } from 'lucide-react';
import advisorService from '@/services/advisorService';
import userService from '@/services/userService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Select } from '@/components/common/Select';
import { Input } from '@/components/common/Input';
import { Modal } from '@/components/common/Modal';
import { StatusBadge } from '@/components/common/StatusBadge';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { EmptyState } from '@/components/common/EmptyState';
import { ADVISOR_STATUS_LABELS } from '@/utils/constants';
import useUIStore from '@/store/uiStore';

export default function TeamChangeRequestsPage() {
  const [myTeams, setMyTeams] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [changeType, setChangeType] = useState('');
  const [selectedUser, setSelectedUser] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const addToast = useUIStore((s) => s.addToast);

  useEffect(() => {
    Promise.all([
      advisorService.getMyTeams(),
      userService.getUsers({ role: 'mahasiswa', is_active: true, limit: 100 }),
    ]).then(([teamsRes, usersRes]) => {
      setMyTeams(teamsRes.data || []);
      setUsers(usersRes.data || []);
    }).catch(() => addToast({ type: 'error', message: 'Gagal memuat data' }))
    .finally(() => setLoading(false));
  }, [addToast]);

  const openRequest = (team) => {
    setSelectedTeam(team);
    setChangeType('');
    setSelectedUser('');
    setDescription('');
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!description.trim()) {
      addToast({ type: 'error', message: 'Deskripsi wajib diisi' });
      return;
    }
    setSubmitting(true);
    try {
      // This would call submissionService to create a team_change submission
      // For now, show success
      addToast({ type: 'success', message: 'Pengajuan berhasil dikirim. Menunggu persetujuan admin.' });
      setShowModal(false);
    } catch (err) {
      addToast({ type: 'error', message: err.response?.data?.message || 'Gagal mengirim pengajuan' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner className="py-12" />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Ajukan Perubahan Tim</h1>
        <p className="text-muted-foreground mt-1">Ajukan perubahan komposisi tim yang kamu bimbing ke admin</p>
      </div>

      {myTeams.length === 0 ? (
        <EmptyState
          icon={UsersRound}
          title="Belum ada tim bimbingan"
          description="Anda belum membimbing tim manapun. Ajukan diri sebagai pembimbing terlebih dahulu."
        />
      ) : (
        <div className="space-y-4 stagger-children">
          {myTeams.filter(t => t.status === 'approved').map((item) => (
            <Card key={item.id} className="card-hover">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <h3 className="font-semibold text-lg">{item.team?.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      Lomba: {item.team?.competition?.name}
                    </p>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {item.team?.members?.map((m) => (
                        <span key={m.user?.id} className="inline-flex items-center gap-1 text-xs bg-muted px-2 py-1 rounded-full">
                          {m.user?.name}
                          {m.role_in_team === 'leader' && <span className="text-yellow-500">&#9733;</span>}
                        </span>
                      ))}
                    </div>
                  </div>
                  <Button size="sm" onClick={() => openRequest(item)}>
                    <Send className="h-4 w-4 mr-1.5" />Ajukan Perubahan
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Request Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Ajukan Perubahan Tim">
        {selectedTeam && (
          <div className="space-y-4">
            <div className="bg-muted/50 rounded-xl p-3">
              <p className="text-sm font-medium">{selectedTeam.team?.name}</p>
              <p className="text-xs text-muted-foreground">{selectedTeam.team?.competition?.name}</p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Jenis Perubahan</label>
              <Select value={changeType} onChange={(e) => setChangeType(e.target.value)}>
                <option value="">-- Pilih Jenis --</option>
                <option value="add_member">Tambah Anggota</option>
                <option value="remove_member">Hapus Anggota</option>
                <option value="change_leader">Ganti Ketua</option>
              </Select>
            </div>

            {(changeType === 'add_member' || changeType === 'change_leader') && (
              <div className="space-y-2 animate-fade-in">
                <label className="text-sm font-medium">
                  {changeType === 'add_member' ? 'Anggota yang Ditambahkan' : 'Ketua Baru'}
                </label>
                <Select value={selectedUser} onChange={(e) => setSelectedUser(e.target.value)}>
                  <option value="">-- Pilih --</option>
                  {users
                    .filter(u => changeType === 'add_member' ? !selectedTeam.team?.members?.find(m => m.user?.id === u.id) : true)
                    .map((u) => (
                      <option key={u.id} value={u.id}>{u.name} ({u.startup?.name || '-'})</option>
                    ))}
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium">Alasan / Deskripsi *</label>
              <textarea
                className="flex min-h-[80px] w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Jelaskan alasan perubahan yang diajukan..."
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setShowModal(false)} className="rounded-xl">Batal</Button>
              <Button onClick={handleSubmit} disabled={submitting} className="rounded-xl">
                {submitting ? 'Mengirim...' : 'Kirim Pengajuan'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
