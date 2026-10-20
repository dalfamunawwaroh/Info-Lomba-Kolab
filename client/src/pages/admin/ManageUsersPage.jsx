import { useState, useEffect, useCallback } from 'react';
import { Plus, Edit, UserCheck, UserX, Search, GraduationCap, ShieldCheck, BookOpen, IdCard, Hash, KeyRound, Send, Mail, MapPin, CalendarDays, AtSign, Link, Image as ImageIcon, PenLine } from 'lucide-react';
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
  const [form, setForm] = useState({
    name: '', email: '', role: 'mahasiswa', startup_id: '', nip_nim: '', program_studi: '',
    tempat_lahir: '', tanggal_lahir: '', instagram: '', linkedin: '', foto_pribadi: null, tanda_tangan: null,
  });
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [resetConfirmUser, setResetConfirmUser] = useState(null);
  const [notifyUser, setNotifyUser] = useState(null);
  const [notifyForm, setNotifyForm] = useState({ title: '', message: '' });
  const [notifyError, setNotifyError] = useState('');
  const [sending, setSending] = useState(false);
  const addToast = useUIStore((s) => s.addToast);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 20 };
      if (search) params.search = search;
      if (roleFilter) params.role = roleFilter;
      const res = await userService.getUsers(params);
      // Backend menyimpan `status` ('active'/'inactive'); frontend memakai `is_active`
      setUsers((res.data || []).map((u) => ({ ...u, is_active: (u.status || 'active') === 'active' })));
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
    setForm({
      name: '', email: '', role: 'mahasiswa', startup_id: '', nip_nim: '', program_studi: '',
      tempat_lahir: '', tanggal_lahir: '', instagram: '', linkedin: '', foto_pribadi: null, tanda_tangan: null,
    });
    setFormErrors({});
    setShowModal(true);
  };

  const openEditModal = (user) => {
    setEditUser(user);
    setForm({
      name: user.name,
      email: user.email,
      role: user.role,
      startup_id: user.startup?.id || startups.find((s) => s.name === user.startup_name)?.id || '',
      nip_nim: user.nip_nim || '',
      program_studi: user.program_studi || '',
      tempat_lahir: user.tempat_lahir || '',
      tanggal_lahir: user.tanggal_lahir ? String(user.tanggal_lahir).slice(0, 10) : '',
      instagram: user.instagram || '',
      linkedin: user.linkedin || '',
      foto_pribadi: user.foto_pribadi || null,
      tanda_tangan: user.tanda_tangan || null,
    });
    setFormErrors({});
    setShowModal(true);
  };

  /* Upload gambar → base64 data URL (maks 2 MB) */
  const MAX_IMAGE_SIZE = 2 * 1024 * 1024;
  const handleImageFile = (field, file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      addToast({ type: 'error', message: 'File harus berupa gambar (JPG/PNG)' });
      return;
    }
    if (file.size > MAX_IMAGE_SIZE) {
      addToast({ type: 'error', message: 'Ukuran gambar maksimal 2 MB' });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setForm((prev) => ({ ...prev, [field]: reader.result }));
    reader.onerror = () => addToast({ type: 'error', message: 'Gagal membaca file' });
    reader.readAsDataURL(file);
  };

  const validateForm = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Nama wajib diisi';
    if (!form.email.trim()) errs.email = 'Email wajib diisi';
    // Program Studi hanya wajib untuk mahasiswa
    if (form.role === 'mahasiswa' && !form.startup_id) errs.startup_id = 'Startup wajib dipilih untuk mahasiswa';
    // NIM wajib untuk mahasiswa, NIP wajib untuk dosen
    if (form.role === 'mahasiswa' && !form.nip_nim.trim()) errs.nip_nim = 'NIM wajib diisi';
    if (form.role === 'dosen' && !form.nip_nim.trim()) errs.nip_nim = 'NIP wajib diisi';
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
      if (!data.nip_nim.trim()) delete data.nip_nim;
      // Rapikan string kosong → '' (boleh kosong, kecuali foto/tanda tangan)
      ['program_studi', 'tempat_lahir', 'tanggal_lahir', 'instagram', 'linkedin'].forEach((k) => {
        data[k] = (data[k] || '').trim();
      });
      if (data.role !== 'mahasiswa') data.program_studi = '';

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

  const handleResetPassword = async (user) => {
    try {
      await userService.resetPassword(user.id);
      addToast({ type: 'success', message: `Password ${user.name} berhasil direset ke default` });
      setShowModal(false);
      setEditUser(null);
      setNotifyForm({
        title: 'Password Telah Direset',
        message: `Halo ${user.name},\n\nPassword akun Anda telah direset oleh admin ke password default: ${DEFAULT_PASSWORD}\n\nSilakan login menggunakan password tersebut, lalu segera buat password baru Anda. Jika ada pertanyaan, silakan hubungi admin.\n\nSalam,\nAdmin Ko+Lab`,
      });
      setNotifyError('');
      setNotifyUser(user);
    } catch (err) {
      addToast({ type: 'error', message: err.response?.data?.message || 'Gagal mereset password' });
    }
  };

  const handleSendMessage = async () => {
    if (!notifyForm.message.trim()) {
      setNotifyError('Isi pesan wajib diisi');
      return;
    }
    setSending(true);
    try {
      await userService.sendMessage(notifyUser.id, {
        title: notifyForm.title.trim(),
        message: notifyForm.message,
      });
      addToast({ type: 'success', message: `Pesan berhasil dikirim ke ${notifyUser.name}` });
      setNotifyUser(null);
    } catch (err) {
      addToast({ type: 'error', message: err.response?.data?.message || 'Gagal mengirim pesan' });
    } finally {
      setSending(false);
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
                        <td className="py-3 px-2 text-muted-foreground">{u.startup?.name || u.startup_name || '-'}</td>
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
        <div className="space-y-5">

          {/* ── Role Selector Cards (top) ── */}
          <div>
            <p className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">Pilih Role</p>
            <div className="grid grid-cols-3 gap-3">
              {[
                {
                  value: 'mahasiswa',
                  icon: BookOpen,
                  label: 'Mahasiswa',
                  desc: 'Peserta lomba, anggota tim',
                  activeGrad: 'from-indigo-500 to-purple-600',
                  activeBorder: 'border-indigo-400 dark:border-indigo-500',
                  inactiveIcon: 'text-indigo-500',
                  inactiveBg: 'bg-indigo-50 dark:bg-indigo-500/10',
                },
                {
                  value: 'dosen',
                  icon: GraduationCap,
                  label: 'Dosen',
                  desc: 'Pembimbing & reviewer tim',
                  activeGrad: 'from-emerald-500 to-teal-600',
                  activeBorder: 'border-emerald-400 dark:border-emerald-500',
                  inactiveIcon: 'text-emerald-500',
                  inactiveBg: 'bg-emerald-50 dark:bg-emerald-500/10',
                },
                {
                  value: 'admin',
                  icon: ShieldCheck,
                  label: 'Admin',
                  desc: 'Pengelola sistem Ko+Lab',
                  activeGrad: 'from-rose-500 to-pink-600',
                  activeBorder: 'border-rose-400 dark:border-rose-500',
                  inactiveIcon: 'text-rose-500',
                  inactiveBg: 'bg-rose-50 dark:bg-rose-500/10',
                },
              ].map((r) => {
                const isActive = form.role === r.value;
                return (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => setForm({ ...form, role: r.value, startup_id: '', nip_nim: '', program_studi: '' })}
                    className={`relative flex flex-col items-center text-center gap-2 p-4 rounded-2xl border-2 transition-all duration-200 cursor-pointer ${
                      isActive
                        ? `bg-gradient-to-br ${r.activeGrad} ${r.activeBorder} text-white shadow-lg scale-[1.02]`
                        : `bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 hover:shadow-md`
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      isActive ? 'bg-white/20' : `${r.inactiveBg} ${r.inactiveIcon}`
                    }`}>
                      <r.icon size={20} className={isActive ? 'text-white' : ''} />
                    </div>
                    <div>
                      <p className={`text-xs font-bold ${isActive ? 'text-white' : 'text-slate-800 dark:text-slate-200'}`}>{r.label}</p>
                      <p className={`text-[10px] leading-tight mt-0.5 ${isActive ? 'text-white/75' : 'text-slate-400 dark:text-slate-500'}`}>{r.desc}</p>
                    </div>
                    {isActive && (
                      <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-white/30 flex items-center justify-center">
                        <span className="text-[9px] text-white font-black">✓</span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── NIM / NIP field (conditional, below role) ── */}
          {(form.role === 'mahasiswa' || form.role === 'dosen') && (
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                {form.role === 'mahasiswa' ? <Hash size={14} className="text-indigo-500" /> : <IdCard size={14} className="text-emerald-500" />}
                {form.role === 'mahasiswa' ? 'NIM (Nomor Induk Mahasiswa)' : 'NIP (Nomor Induk Pegawai)'}
              </label>
              <Input
                placeholder={form.role === 'mahasiswa' ? 'Contoh: 2241720088' : 'Contoh: 198503122010121001'}
                value={form.nip_nim}
                onChange={(e) => setForm({ ...form, nip_nim: e.target.value })}
              />
              {formErrors.nip_nim && <p className="text-xs text-destructive">{formErrors.nip_nim}</p>}
            </div>
          )}

          {/* ── Nama ── */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Nama Lengkap</label>
            <Input placeholder="Masukkan nama lengkap" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            {formErrors.name && <p className="text-xs text-destructive">{formErrors.name}</p>}
          </div>

          {/* ── Email ── */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Email</label>
            <Input type="email" placeholder="nama@kolab.id" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} disabled={!!editUser} />
            {formErrors.email && <p className="text-xs text-destructive">{formErrors.email}</p>}
            {editUser && <p className="text-[11px] text-slate-400">Email tidak dapat diubah setelah akun dibuat.</p>}
          </div>

          {/* ── Startup & Program Studi — hanya untuk mahasiswa ── */}
          {form.role === 'mahasiswa' && (
            <>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <span className="text-indigo-500">🏢</span> Startup
                  <span className="text-rose-500 text-xs font-bold">*</span>
                </label>
                <Select value={form.startup_id} onChange={(e) => setForm({ ...form, startup_id: e.target.value })}>
                  <option value="">-- Pilih Startup --</option>
                  {startups.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </Select>
                <p className="text-[11px] text-slate-400">Perusahaan / startup tempat magang mahasiswa</p>
                {formErrors.startup_id && <p className="text-xs text-destructive">{formErrors.startup_id}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <span className="text-indigo-500">🏫</span> Program Studi
                </label>
                <Input
                  placeholder="Contoh: Teknik Informatika"
                  value={form.program_studi}
                  onChange={(e) => setForm({ ...form, program_studi: e.target.value })}
                />
              </div>
            </>
          )}

          {/* ── Tempat, Tanggal Lahir — semua role ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <MapPin size={14} className="text-slate-400" /> Tempat Lahir
              </label>
              <Input
                placeholder="Contoh: Bandung"
                value={form.tempat_lahir}
                onChange={(e) => setForm({ ...form, tempat_lahir: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <CalendarDays size={14} className="text-slate-400" /> Tanggal Lahir
              </label>
              <Input
                type="date"
                value={form.tanggal_lahir}
                onChange={(e) => setForm({ ...form, tanggal_lahir: e.target.value })}
              />
            </div>
          </div>

          {/* ── Instagram & LinkedIn — semua role ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <AtSign size={14} className="text-pink-500" /> Instagram
              </label>
              <Input
                placeholder="@username atau https://instagram.com/..."
                value={form.instagram}
                onChange={(e) => setForm({ ...form, instagram: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <Link size={14} className="text-sky-600" /> LinkedIn
              </label>
              <Input
                placeholder="username atau https://linkedin.com/in/..."
                value={form.linkedin}
                onChange={(e) => setForm({ ...form, linkedin: e.target.value })}
              />
            </div>
          </div>

          {/* ── Foto Pribadi & Tanda Tangan Digital — semua role ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Foto Pribadi */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <ImageIcon size={14} className="text-violet-500" /> Foto Pribadi
              </label>
              <div className="flex items-center gap-3">
                {form.foto_pribadi ? (
                  <img
                    src={form.foto_pribadi}
                    alt="Foto Pribadi"
                    className="w-14 h-14 rounded-xl object-cover border border-slate-200 dark:border-white/10"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-xl bg-slate-100 dark:bg-white/5 border border-dashed border-slate-300 dark:border-white/10 flex items-center justify-center text-slate-400">
                    <ImageIcon size={20} />
                  </div>
                )}
                <div className="flex flex-col gap-1.5">
                  <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/10 cursor-pointer transition-colors">
                    <ImageIcon size={13} /> {form.foto_pribadi ? 'Ganti Foto' : 'Pilih Foto'}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleImageFile('foto_pribadi', e.target.files?.[0])}
                    />
                  </label>
                  {form.foto_pribadi && (
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, foto_pribadi: null })}
                      className="text-xs font-semibold text-destructive hover:underline"
                    >
                      Hapus Foto
                    </button>
                  )}
                </div>
              </div>
              <p className="text-[11px] text-slate-400">JPG/PNG, maksimal 2 MB</p>
            </div>

            {/* Tanda Tangan Digital */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <PenLine size={14} className="text-emerald-500" /> Tanda Tangan Digital
              </label>
              <div className="flex items-center gap-3">
                {form.tanda_tangan ? (
                  <img
                    src={form.tanda_tangan}
                    alt="Tanda Tangan"
                    className="w-24 h-14 rounded-xl object-contain bg-white border border-slate-200 dark:border-white/10"
                  />
                ) : (
                  <div className="w-24 h-14 rounded-xl bg-slate-100 dark:bg-white/5 border border-dashed border-slate-300 dark:border-white/10 flex items-center justify-center text-slate-400">
                    <PenLine size={20} />
                  </div>
                )}
                <div className="flex flex-col gap-1.5">
                  <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/10 cursor-pointer transition-colors">
                    <PenLine size={13} /> {form.tanda_tangan ? 'Ganti Tanda Tangan' : 'Pilih Gambar'}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleImageFile('tanda_tangan', e.target.files?.[0])}
                    />
                  </label>
                  {form.tanda_tangan && (
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, tanda_tangan: null })}
                      className="text-xs font-semibold text-destructive hover:underline"
                    >
                      Hapus
                    </button>
                  )}
                </div>
              </div>
              <p className="text-[11px] text-slate-400">Scan tanda tangan (PNG transparan disarankan), maks 2 MB</p>
            </div>
          </div>

          {!editUser && (
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20">
              <span className="text-amber-600 dark:text-amber-400 text-sm">🔑</span>
              <p className="text-xs text-amber-700 dark:text-amber-300 font-medium">Password default: <strong>{DEFAULT_PASSWORD}</strong></p>
            </div>
          )}

          <div className="flex items-center justify-between gap-2 pt-1">
            {editUser ? (
              <Button
                variant="outline"
                onClick={() => setResetConfirmUser(editUser)}
                className="text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
              >
                <KeyRound className="h-4 w-4 mr-2" />Reset Password
              </Button>
            ) : <span />}
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowModal(false)}>Batal</Button>
              <Button onClick={handleSave} disabled={saving}>{saving ? 'Menyimpan...' : editUser ? 'Simpan Perubahan' : 'Tambah User'}</Button>
            </div>
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

      {/* ── Reset Password Modal (premium) ── */}
      {resetConfirmUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-md" onClick={() => setResetConfirmUser(null)}>
          <div
            className="bg-white dark:bg-[#13151C] w-full max-w-md rounded-[2rem] shadow-2xl overflow-hidden animate-fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Danger accent top bar */}
            <div className="h-1.5 bg-gradient-to-r from-rose-500 to-pink-600" />

            <div className="p-7 space-y-5">
              {/* Icon + Title */}
              <div className="flex flex-col items-center text-center gap-3">
                <div className="w-16 h-16 rounded-[1.25rem] bg-rose-100 dark:bg-rose-500/15 text-rose-600 dark:text-rose-400 flex items-center justify-center shadow-sm">
                  <KeyRound size={32} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Reset Password?</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Tindakan ini tidak dapat dibatalkan</p>
                </div>
              </div>

              {/* User info card */}
              <div className="flex items-center gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 text-white flex items-center justify-center text-base font-bold shrink-0">
                  {resetConfirmUser.name?.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-800 dark:text-white truncate">{resetConfirmUser.name}</p>
                  <p className="text-xs text-slate-400 truncate">{resetConfirmUser.email}</p>
                </div>
              </div>

              {/* New password preview */}
              <div className="rounded-2xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 px-4 py-3.5 flex items-center gap-3">
                <span className="text-xl">🔑</span>
                <div>
                  <p className="text-xs font-bold text-amber-700 dark:text-amber-300">Password akan direset ke:</p>
                  <p className="text-sm font-black text-amber-800 dark:text-amber-200 mt-0.5 tracking-wider font-mono">{DEFAULT_PASSWORD}</p>
                </div>
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400 text-center leading-relaxed">
                Setelah reset, user harus login dengan password default dan disarankan segera mengganti password baru.
              </p>

              {/* Actions */}
              <div className="flex gap-3 pt-1">
                <button
                  onClick={() => setResetConfirmUser(null)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={() => { handleResetPassword(resetConfirmUser); setResetConfirmUser(null); }}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 text-white text-sm font-bold shadow-lg shadow-rose-500/25 hover:brightness-110 transition-all flex items-center justify-center gap-2"
                >
                  <KeyRound size={16} /> Ya, Reset Password
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Kirim Pesan Setelah Reset (premium) ── */}
      {notifyUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-md" onClick={() => setNotifyUser(null)}>
          <div
            className="bg-white dark:bg-[#13151C] w-full max-w-lg rounded-[2rem] shadow-2xl overflow-hidden animate-fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Blue accent top bar */}
            <div className="h-1.5 bg-gradient-to-r from-indigo-500 to-purple-600" />

            <div className="p-7 space-y-5">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">Kirim Notifikasi ke User</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Password berhasil direset — informasikan ke pengguna</p>
                </div>
                <button
                  onClick={() => setNotifyUser(null)}
                  className="w-8 h-8 rounded-full bg-slate-100 dark:bg-white/10 text-slate-400 hover:text-slate-700 dark:hover:text-white flex items-center justify-center transition-colors"
                >
                  ✕
                </button>
              </div>

              {/* Recipient card */}
              <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center text-sm font-bold shrink-0">
                  {notifyUser.name?.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate">{notifyUser.name}</p>
                  <p className="text-xs text-slate-400 truncate">{notifyUser.email}</p>
                </div>
                <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 shrink-0">
                  {notifyUser.role || 'user'}
                </span>
              </div>

              {/* Title input */}
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Judul Pesan</label>
                <Input
                  placeholder="Judul pesan notifikasi"
                  value={notifyForm.title}
                  onChange={(e) => setNotifyForm({ ...notifyForm, title: e.target.value })}
                />
              </div>

              {/* Message textarea */}
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Isi Pesan</label>
                <textarea
                  rows={6}
                  placeholder="Tuliskan pesan untuk user..."
                  value={notifyForm.message}
                  onChange={(e) => { setNotifyForm({ ...notifyForm, message: e.target.value }); setNotifyError(''); }}
                  className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 px-4 py-3 text-sm text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/30 resize-none leading-relaxed transition-colors"
                />
                {notifyError && <p className="text-xs text-rose-500">{notifyError}</p>}
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-1">
                <button
                  onClick={() => setNotifyUser(null)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
                >
                  Lewati
                </button>
                <button
                  onClick={handleSendMessage}
                  disabled={sending}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm font-bold shadow-lg shadow-purple-500/25 hover:brightness-110 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  <Send size={16} />{sending ? 'Mengirim...' : 'Kirim Pesan'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
