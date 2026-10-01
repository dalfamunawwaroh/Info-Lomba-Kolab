import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import userService from '@/services/userService';
import historyService from '@/services/historyService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Badge } from '@/components/common/Badge';
import { StatusBadge } from '@/components/common/StatusBadge';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { Modal } from '@/components/common/Modal';
import { ROLE_LABELS, STATUS_LABELS } from '@/utils/constants';
import { formatDate, getInitials } from '@/utils/helpers';
import useUIStore from '@/store/uiStore';

export default function ProfilePage() {
  const { id } = useParams();
  const { user: currentUser, updateUser } = useAuth();
  const isOwnProfile = !id || parseInt(id) === currentUser.id;
  const [profile, setProfile] = useState(null);
  const [history, setHistory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showEdit, setShowEdit] = useState(false);
  const [editName, setEditName] = useState('');
  const [saving, setSaving] = useState(false);
  const addToast = useUIStore((s) => s.addToast);

  const userId = id || currentUser.id;

  useEffect(() => {
    async function load() {
      try {
        const [userRes, histRes] = await Promise.all([
          userService.getUserById(userId),
          historyService.getUserHistory(userId).catch(() => ({ data: null })),
        ]);
        setProfile(userRes.data);
        setHistory(histRes?.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [userId]);

  const handleSaveName = async () => {
    setSaving(true);
    try {
      const res = await userService.updateUser(userId, { name: editName });
      setProfile({ ...profile, name: editName });
      if (isOwnProfile) updateUser({ ...currentUser, name: editName });
      addToast({ type: 'success', message: 'Profil berhasil diperbarui' });
      setShowEdit(false);
    } catch (err) {
      addToast({ type: 'error', message: 'Gagal memperbarui profil' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner className="py-12" />;
  if (!profile) return <p className="text-center py-12">User tidak ditemukan</p>;

  const stats = history?.stats || {};

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">{isOwnProfile ? 'Profil Saya' : `Profil ${profile.name}`}</h1>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-start gap-6">
            <div className="h-20 w-20 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-2xl font-bold shrink-0">
              {getInitials(profile.name)}
            </div>
            <div className="flex-1 space-y-2">
              <h2 className="text-xl font-semibold">{profile.name}</h2>
              {isOwnProfile && <p className="text-sm text-muted-foreground">{profile.email}</p>}
              <div className="flex items-center gap-2">
                <Badge variant={profile.role === 'admin' ? 'destructive' : profile.role === 'dosen' ? 'info' : 'secondary'}>
                  {ROLE_LABELS[profile.role]}
                </Badge>
                {profile.startup && <Badge variant="outline">{profile.startup.name}</Badge>}
              </div>
              <p className="text-sm text-muted-foreground">
                Bergabung: {formatDate(profile.created_at)}
              </p>
              {isOwnProfile && (
                <Button size="sm" variant="outline" onClick={() => { setEditName(profile.name); setShowEdit(true); }}>
                  Edit Profil
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{stats.total || 0}</p>
            <p className="text-xs text-muted-foreground">Total Lomba</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{stats.upcoming + stats.ongoing || 0}</p>
            <p className="text-xs text-muted-foreground">Aktif</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{stats.completed || 0}</p>
            <p className="text-xs text-muted-foreground">Selesai</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent History */}
      {history?.competitions && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">History Lomba</CardTitle>
          </CardHeader>
          <CardContent>
            {[...(history.competitions.upcoming || []), ...(history.competitions.ongoing || []), ...(history.competitions.completed || [])].length > 0 ? (
              <div className="space-y-2">
                {[...(history.competitions.upcoming || []), ...(history.competitions.ongoing || []), ...(history.competitions.completed || [])].map((item, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div>
                      <p className="text-sm font-medium">{item.competition?.name}</p>
                      <p className="text-xs text-muted-foreground">{item.team?.name} — {item.team?.role_in_team === 'leader' ? 'Ketua' : 'Anggota'}</p>
                    </div>
                    <StatusBadge status={item.competition?.status} labels={STATUS_LABELS} />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">Belum ada history</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Edit Modal */}
      <Modal isOpen={showEdit} onClose={() => setShowEdit(false)} title="Edit Profil">
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Nama</label>
            <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowEdit(false)}>Batal</Button>
            <Button onClick={handleSaveName} disabled={saving}>{saving ? 'Menyimpan...' : 'Simpan'}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
