import { useState, useEffect, useCallback } from 'react';
import { Plus, Edit, UserCheck, UserX, Search } from 'lucide-react';
import userService from '@/services/userService';
import startupService from '@/services/startupService';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Select } from '@/components/common/Select';
import { Modal } from '@/components/common/Modal';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Badge } from '@/components/common/Badge';
import { Pagination } from '@/components/common/Pagination';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ROLE_LABELS, DEFAULT_PASSWORD } from '@/utils/constants';
import { formatDate } from '@/utils/helpers';
import useUIStore from '@/store/uiStore';

export default function ManageUsersPage() {
  const [users, setUsers] = useState([]);
  const [startups, setStartups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', role: 'mahasiswa', startup_id: '' });
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const addToast = useUIStore((s) => s.addToast);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 20 };
      if (search) params.search = search;
      if (roleFilter) params.role = roleFilter;
      const res = await userService.getUsers(params);
      setUsers(res.data || []);
      setTotalPages(res.meta?.total_pages || 1);
    } catch (err) {
      addToast({ type: 'error', message: 'Gagal memuat data user' });
    } finally {
      setLoading(false);
    }
  }, [page, search, roleFilter, addToast]);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  useEffect(() => {
    startupService.getStartups().then((res) => setStartups(res.data || [])).catch(() => {});
  }, []);

  const openAddModal = () => {
    setEditUser(null);
    setForm({ name: '', email: '', role: 'mahasiswa', startup_id: '' });
    setFormErrors({});
    setShowModal(true);
  };

  const openEditModal = (user) => {
    setEditUser(user);
    setForm({
      name: user.name,
      email: user.email,
      role: user.role,
      startup_id: user.startup?.id || '',
    });
    setFormErrors({});
    setShowModal(true);
  };

  const validateForm = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Nama wajib diisi';
    if (!form.email.trim()) errs.email = 'Email wajib diisi';
    if (form.role === 'mahasiswa' && !form.startup_id) errs.startup_id = 'Startup wajib untuk mahasiswa';
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    setSaving(true);
    try {
      const data = { ...form };
      if (data.startup_id) data.startup_id = parseInt(data.startup_id);
      else data.startup_id = null;

      if (editUser) {
        await userService.updateUser(editUser.id, data);
        addToast({ type: 'success', message: 'User berhasil diperbarui' });
      } else {
        data.password = DEFAULT_PASSWORD;
        await userService.createUser(data);
        addToast({ type: 'success', message: 'User berhasil ditambahkan' });
      }
      setShowModal(false);
      loadUsers();
    } catch (err) {
      addToast({ type: 'error', message: err.response?.data?.message || 'Gagal menyimpan' });
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (user) => {
    try {
      if (user.is_active) {
        await userService.deactivateUser(user.id);
        addToast({ type: 'success', message: `${user.name} dinonaktifkan` });
      } else {
        await userService.activateUser(user.id);
        addToast({ type: 'success', message: `${user.name} diaktifkan` });
      }
      loadUsers();
    } catch (err) {
      addToast({ type: 'error', message: 'Gagal mengubah status user' });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Kelola User</h1>
        <Button onClick={openAddModal}><Plus className="h-4 w-4 mr-1" />Tambah User</Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari nama atau email..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="pl-9"
              />
            </div>
            <Select value={roleFilter} onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }} className="w-40">
              <option value="">Semua Role</option>
              <option value="admin">Admin</option>
              <option value="dosen">Dosen</option>
              <option value="mahasiswa">Mahasiswa</option>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <LoadingSpinner className="py-12" />
          ) : users.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Tidak ada user ditemukan</p>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-2 font-medium">Nama</th>
                      <th className="text-left py-3 px-2 font-medium">Email</th>
                      <th className="text-left py-3 px-2 font-medium">Role</th>
                      <th className="text-left py-3 px-2 font-medium">Startup</th>
                      <th className="text-left py-3 px-2 font-medium">Status</th>
                      <th className="text-left py-3 px-2 font-medium">Terdaftar</th>
                      <th className="text-right py-3 px-2 font-medium">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.id} className="border-b hover:bg-muted/50">
                        <td className="py-3 px-2 font-medium">{u.name}</td>
                        <td className="py-3 px-2 text-muted-foreground">{u.email}</td>
                        <td className="py-3 px-2">
                          <Badge variant={u.role === 'admin' ? 'destructive' : u.role === 'dosen' ? 'info' : 'secondary'}>
                            {ROLE_LABELS[u.role]}
                          </Badge>
                        </td>
                        <td className="py-3 px-2 text-muted-foreground">{u.startup?.name || '-'}</td>
                        <td className="py-3 px-2">
                          <Badge variant={u.is_active ? 'success' : 'secondary'}>
                            {u.is_active ? 'Aktif' : 'Nonaktif'}
                          </Badge>
                        </td>
                        <td className="py-3 px-2 text-muted-foreground">{formatDate(u.created_at, 'dd/MM/yy')}</td>
                        <td className="py-3 px-2">
                          <div className="flex justify-end gap-1">
                            <Button size="icon" variant="ghost" onClick={() => openEditModal(u)} title="Edit">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => setConfirmAction({ user: u })}
                              title={u.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                            >
                              {u.is_active ? <UserX className="h-4 w-4 text-destructive" /> : <UserCheck className="h-4 w-4 text-green-600" />}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
            </>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editUser ? 'Edit User' : 'Tambah User'}>
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Nama</label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            {formErrors.name && <p className="text-xs text-destructive">{formErrors.name}</p>}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Email</label>
            <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} disabled={!!editUser} />
            {formErrors.email && <p className="text-xs text-destructive">{formErrors.email}</p>}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Role</label>
            <Select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value, startup_id: '' })}>
              <option value="mahasiswa">Mahasiswa</option>
              <option value="dosen">Dosen</option>
              <option value="admin">Admin</option>
            </Select>
          </div>
          {form.role === 'mahasiswa' && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Startup</label>
              <Select value={form.startup_id} onChange={(e) => setForm({ ...form, startup_id: e.target.value })}>
                <option value="">-- Pilih Startup --</option>
                {startups.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </Select>
              {formErrors.startup_id && <p className="text-xs text-destructive">{formErrors.startup_id}</p>}
            </div>
          )}
          {!editUser && (
            <p className="text-xs text-muted-foreground">Password default: {DEFAULT_PASSWORD}</p>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setShowModal(false)}>Batal</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? 'Menyimpan...' : 'Simpan'}</Button>
          </div>
        </div>
      </Modal>

      {/* Confirm Toggle Active */}
      {confirmAction && (
        <ConfirmDialog
          isOpen={!!confirmAction}
          onClose={() => setConfirmAction(null)}
          onConfirm={() => handleToggleActive(confirmAction.user)}
          title={confirmAction.user.is_active ? 'Nonaktifkan User?' : 'Aktifkan User?'}
          message={`${confirmAction.user.is_active ? 'Nonaktifkan' : 'Aktifkan'} user ${confirmAction.user.name}?`}
          confirmText={confirmAction.user.is_active ? 'Nonaktifkan' : 'Aktifkan'}
          variant={confirmAction.user.is_active ? 'destructive' : 'default'}
        />
      )}
    </div>
  );
}
