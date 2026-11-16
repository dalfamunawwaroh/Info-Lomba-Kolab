import { useState, useEffect } from 'react';
import { Send, UserPlus, UserMinus, Crown, AlertCircle } from 'lucide-react';
import advisorService from '@/services/advisorService';
import userService from '@/services/userService';
import { Button } from '@/components/common/Button';
import { Select } from '@/components/common/Select';
import { Modal } from '@/components/common/Modal';
import { getInitials } from '@/utils/helpers';
import useUIStore from '@/store/uiStore';

const CHANGE_TYPES = [
  { value: 'add_member', label: 'Tambah Anggota', icon: UserPlus },
  { value: 'remove_member', label: 'Hapus Anggota', icon: UserMinus },
  { value: 'change_leader', label: 'Ganti Ketua', icon: Crown },
];

/**
 * Modal pengajuan perubahan komposisi tim oleh dosen pembimbing (F-14).
 * Dipakai di halaman Tim Bimbingan dan detail tim.
 */
export function TeamChangeRequestModal({ isOpen, onClose, team, onSuccess }) {
  const [changeType, setChangeType] = useState('');
  const [selectedUser, setSelectedUser] = useState('');
  const [description, setDescription] = useState('');
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const addToast = useUIStore((s) => s.addToast);

  const members = team?.members || [];
  const leaderId = team?.leader_id;
  const maxMembers = team?.competition?.max_team_members || team?.max_team_members || 10;
  const isFull = members.length >= maxMembers;

  useEffect(() => {
    if (!isOpen) return;
    setChangeType('');
    setSelectedUser('');
    setDescription('');
  }, [isOpen, team?.id]);

  useEffect(() => {
    if (!isOpen) return;
    if (changeType !== 'add_member' && changeType !== 'change_leader') return;
    if (users.length > 0) return;

    setLoadingUsers(true);
    userService.getUsers({ role: 'mahasiswa', status: 'active', limit: 200 })
      .then((res) => setUsers(res.data || []))
      .catch(() => addToast({ type: 'error', message: 'Gagal memuat daftar mahasiswa' }))
      .finally(() => setLoadingUsers(false));
  }, [isOpen, changeType, users.length, addToast]);

  const memberIds = members.map((m) => m.user_id);
  const options = changeType === 'add_member'
    ? users.filter((u) => !memberIds.includes(u.id))
    : changeType === 'change_leader'
      ? members
          .filter((m) => m.user_id !== leaderId)
          .map((m) => ({ id: m.user_id, name: m.name, startup_name: m.user?.startup_name }))
      : members.filter((m) => m.user_id !== leaderId);

  const needsUser = changeType === 'add_member' || changeType === 'change_leader' || changeType === 'remove_member';
  const canSubmit =
    changeType &&
    description.trim().length > 0 &&
    (!needsUser || selectedUser) &&
    !(changeType === 'add_member' && isFull);

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      await advisorService.createTeamChangeRequest(team.id, {
        change_type: changeType,
        target_user_id: selectedUser ? Number(selectedUser) : null,
        description: description.trim(),
      });
      addToast({ type: 'success', message: 'Pengajuan perubahan tim terkirim. Menunggu persetujuan admin.' });
      onClose();
      onSuccess?.();
    } catch (err) {
      addToast({ type: 'error', message: err.response?.data?.message || 'Gagal mengirim pengajuan' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Ajukan Perubahan Tim">
      <div className="space-y-4">
        {/* Info tim */}
        <div className="flex items-center gap-3 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 p-3.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-700 text-white flex items-center justify-center font-extrabold text-xs shrink-0">
            {getInitials(team?.name)}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{team?.name}</p>
            <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 truncate">
              {team?.competition?.name || team?.competition_title || '-'} • {members.length}/{maxMembers} anggota
            </p>
          </div>
        </div>

        {/* Jenis perubahan */}
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            Jenis Perubahan <span className="text-rose-500">*</span>
          </label>
          <div className="grid grid-cols-3 gap-2">
            {CHANGE_TYPES.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => { setChangeType(t.value); setSelectedUser(''); }}
                disabled={t.value === 'add_member' && isFull}
                className={`flex flex-col items-center gap-1.5 rounded-2xl border px-2 py-3 text-[11px] font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                  changeType === t.value
                    ? 'border-purple-500 bg-purple-50 dark:bg-purple-500/15 text-purple-700 dark:text-purple-300'
                    : 'border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:border-purple-300 dark:hover:border-purple-500/40'
                }`}
              >
                <t.icon size={16} />
                {t.label}
              </button>
            ))}
          </div>
          {isFull && (
            <p className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1">
              <AlertCircle size={12} /> Tim sudah penuh ({maxMembers} anggota), tidak bisa menambah anggota.
            </p>
          )}
        </div>

        {/* Target user */}
        {changeType && (
          <div className="space-y-1.5 animate-fade-in">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">
              {changeType === 'add_member' ? 'Mahasiswa yang Ditambahkan' : changeType === 'change_leader' ? 'Ketua Baru' : 'Anggota yang Dihapus'}
              <span className="text-rose-500"> *</span>
            </label>
            <Select
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              className="rounded-xl"
              disabled={loadingUsers}
            >
              <option value="">{loadingUsers ? 'Memuat...' : '-- Pilih Mahasiswa --'}</option>
              {options.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}{u.startup_name ? ` (${u.startup_name})` : ''}
                </option>
              ))}
            </Select>
            {options.length === 0 && !loadingUsers && (
              <p className="text-[11px] font-semibold text-slate-400">
                {changeType === 'add_member'
                  ? 'Tidak ada mahasiswa yang bisa ditambahkan.'
                  : 'Tidak ada pilihan yang tersedia.'}
              </p>
            )}
          </div>
        )}

        {/* Deskripsi */}
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            Alasan / Deskripsi <span className="text-rose-500">*</span>
          </label>
          <textarea
            className="flex min-h-[90px] w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 px-3 py-2.5 text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-400 transition-all"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Jelaskan alasan perubahan ini agar admin mudah meninjau..."
            rows={3}
          />
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <Button variant="outline" onClick={onClose} className="rounded-full">Batal</Button>
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit || submitting}
            className="rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 px-6"
          >
            {submitting ? 'Mengirim...' : (<><Send size={14} className="mr-1.5" /> Kirim Pengajuan</>)}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
