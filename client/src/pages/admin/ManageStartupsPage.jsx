import { useState, useEffect, useCallback } from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';
import startupService from '@/services/startupService';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Modal } from '@/components/common/Modal';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import useUIStore from '@/store/uiStore';

export default function ManageStartupsPage() {
  const [startups, setStartups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editStartup, setEditStartup] = useState(null);
  const [form, setForm] = useState({ name: '', description: '' });
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const addToast = useUIStore((s) => s.addToast);

  const loadStartups = useCallback(async () => {
    setLoading(true);
    try {
      const res = await startupService.getStartups();
      setStartups(res.data || []);
    } catch (err) {
      addToast({ type: 'error', message: 'Gagal memuat data startup' });
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => { loadStartups(); }, [loadStartups]);

  const openAdd = () => {
    setEditStartup(null);
    setForm({ name: '', description: '' });
    setShowModal(true);
  };

  const openEdit = (s) => {
    setEditStartup(s);
    setForm({ name: s.name, description: s.description || '' });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      addToast({ type: 'error', message: 'Nama startup wajib diisi' });
      return;
    }
    setSaving(true);
    try {
      if (editStartup) {
        await startupService.updateStartup(editStartup.id, form);
        addToast({ type: 'success', message: 'Startup berhasil diperbarui' });
      } else {
        await startupService.createStartup(form);
        addToast({ type: 'success', message: 'Startup berhasil ditambahkan' });
      }
      setShowModal(false);
      loadStartups();
    } catch (err) {
      addToast({ type: 'error', message: err.response?.data?.message || 'Gagal menyimpan' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await startupService.deleteStartup(deleteTarget.id);
      addToast({ type: 'success', message: 'Startup berhasil dihapus' });
      setDeleteTarget(null);
      loadStartups();
    } catch (err) {
      addToast({ type: 'error', message: 'Gagal menghapus startup' });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Kelola Startup</h1>
        <Button onClick={openAdd}><Plus className="h-4 w-4 mr-1" />Tambah Startup</Button>
      </div>

      {loading ? (
        <LoadingSpinner className="py-12" />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {startups.map((s) => (
            <Card key={s.id}>
              <CardHeader>
                <CardTitle className="text-lg">{s.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">{s.description || 'Tidak ada deskripsi'}</p>
                <p className="text-sm mb-4">
                  <span className="font-medium">{s._count?.users || 0}</span> anggota
                </p>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => openEdit(s)}>
                    <Edit className="h-3 w-3 mr-1" /> Edit
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => setDeleteTarget(s)}>
                    <Trash2 className="h-3 w-3 mr-1" /> Hapus
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editStartup ? 'Edit Startup' : 'Tambah Startup'}>
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Nama Startup</label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Deskripsi</label>
            <textarea
              className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={2}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowModal(false)}>Batal</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? 'Menyimpan...' : 'Simpan'}</Button>
          </div>
        </div>
      </Modal>

      {deleteTarget && (
        <ConfirmDialog
          isOpen={!!deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
          title="Hapus Startup?"
          message={`Hapus startup "${deleteTarget.name}"? ${deleteTarget._count?.users || 0} anggota akan kehilangan startup.`}
          confirmText="Hapus"
        />
      )}
    </div>
  );
}
