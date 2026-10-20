import { useState, useEffect, useCallback } from 'react';
import { Plus, Edit, Trash2, Users, ChevronDown, ChevronUp, GraduationCap, BookOpen, Building2, X, Search, UserPlus, Briefcase, Mail, Phone, Hash } from 'lucide-react';
import startupService from '@/services/startupService';
import userService from '@/services/userService';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Modal } from '@/components/common/Modal';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import useUIStore from '@/store/uiStore';

// Role config helpers
const ROLE_CONFIG = {
  mahasiswa: { label: 'Mahasiswa', icon: BookOpen, chip: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300' },
  dosen: { label: 'Dosen', icon: GraduationCap, chip: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300' },
  admin: { label: 'Admin', icon: Building2, chip: 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300' },
};

function getInitials(name = '') {
  return name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
}

// ── Member Detail Modal ──────────────────────────────────────────────────────
function MemberDetailModal({ member, onClose }) {
  if (!member) return null;
  const cfg = ROLE_CONFIG[member.role] || ROLE_CONFIG.mahasiswa;

  return (
    <Modal isOpen={!!member} onClose={onClose} title="Detail Anggota">
      <div className="space-y-5">
        {/* Avatar & name header */}
        <div className="flex items-center gap-4">
          <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br from-[#9333EA] to-[#6C1B75] text-white flex items-center justify-center text-xl font-black shadow-lg shrink-0`}>
            {getInitials(member.name)}
          </div>
          <div className="min-w-0">
            <h3 className="text-lg font-extrabold text-slate-900 dark:text-white truncate">{member.name}</h3>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${cfg.chip}`}>{cfg.label}</span>
              {member.position && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-500/15 dark:text-purple-300">
                  {member.position}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Info fields */}
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10">
            <Mail size={16} className="text-slate-400 shrink-0" />
            <div>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Email</p>
              <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{member.email}</p>
            </div>
          </div>
          {member.nip_nim && (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10">
              <Hash size={16} className="text-slate-400 shrink-0" />
              <div>
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{member.role === 'mahasiswa' ? 'NIM' : 'NIP'}</p>
                <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{member.nip_nim}</p>
              </div>
            </div>
          )}
          {member.phone && (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10">
              <Phone size={16} className="text-slate-400 shrink-0" />
              <div>
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Telepon</p>
                <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{member.phone}</p>
              </div>
            </div>
          )}
          {member.startup_name && (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10">
              <Building2 size={16} className="text-slate-400 shrink-0" />
              <div>
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Startup</p>
                <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{member.startup_name}</p>
              </div>
            </div>
          )}
          {member.position && (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-purple-50 dark:bg-purple-500/10 border border-purple-200 dark:border-purple-500/20">
              <Briefcase size={16} className="text-purple-500 shrink-0" />
              <div>
                <p className="text-[10px] font-semibold text-purple-400 uppercase tracking-wider">Jabatan</p>
                <p className="text-sm font-bold text-purple-700 dark:text-purple-300">{member.position}</p>
              </div>
            </div>
          )}
          {Array.isArray(member.expertise) && member.expertise.length > 0 && (
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10">
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Keahlian</p>
              <div className="flex flex-wrap gap-1.5">
                {member.expertise.map((e, i) => (
                  <span key={i} className="text-[10px] font-bold px-2 py-1 rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">{e}</span>
                ))}
              </div>
            </div>
          )}
          {Array.isArray(member.skills) && member.skills.length > 0 && (
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10">
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Skills</p>
              <div className="flex flex-wrap gap-1.5">
                {member.skills.map((e, i) => (
                  <span key={i} className="text-[10px] font-bold px-2 py-1 rounded-lg bg-indigo-100 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300">{e}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}

// ── Add Member Modal ─────────────────────────────────────────────────────────
function AddMemberModal({ startupId, onClose, onAdd }) {
  const [allUsers, setAllUsers] = useState([]);
  const [existingIds, setExistingIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [position, setPosition] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      userService.getUsers({ limit: 200 }),
      userService.getUsers({ startup_id: startupId, limit: 200 }),
    ])
      .then(([allRes, memberRes]) => {
        setAllUsers(allRes.data || []);
        setExistingIds((memberRes.data || []).map((u) => u.id));
      })
      .catch(() => setAllUsers([]))
      .finally(() => setLoading(false));
  }, [startupId]);

  const candidates = allUsers.filter((u) => !existingIds.includes(u.id));

  const filtered = candidates.filter((u) =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    (u.email || '').toLowerCase().includes(search.toLowerCase())
  );

  const handleAdd = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await onAdd(selected, position.trim());
      onClose();
    } catch {
      // handled in parent
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen onClose={onClose} title="Tambah Anggota Startup">
      {!selected ? (
        <div className="space-y-4">
          <div className="relative">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nama atau email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm font-medium text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/30"
            />
          </div>
          {loading ? (
            <div className="flex items-center justify-center py-8"><LoadingSpinner /></div>
          ) : filtered.length === 0 ? (
            <p className="text-center text-sm text-slate-400 py-8">Tidak ada user yang tersedia</p>
          ) : (
            <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
              {filtered.map((u) => {
                const cfg = ROLE_CONFIG[u.role] || ROLE_CONFIG.mahasiswa;
                return (
                  <button
                    key={u.id}
                    onClick={() => setSelected(u)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 hover:border-purple-300 dark:hover:border-purple-500/40 hover:bg-purple-50/50 dark:hover:bg-purple-500/10 transition-all text-left"
                  >
                    <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 text-white flex items-center justify-center text-[11px] font-bold shrink-0">
                      {getInitials(u.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate">{u.name}</p>
                      <p className="text-[11px] text-slate-400 truncate">{u.email}</p>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${cfg.chip}`}>{cfg.label}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-4 rounded-2xl bg-purple-50 dark:bg-purple-500/10 border border-purple-200 dark:border-purple-500/20">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 text-white flex items-center justify-center text-sm font-bold shrink-0">
              {getInitials(selected.name)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate">{selected.name}</p>
              <p className="text-[11px] text-slate-400 truncate">{selected.email}</p>
            </div>
            <button onClick={() => setSelected(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white" title="Ganti">
              <X size={18} />
            </button>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <Briefcase size={14} className="text-purple-500" /> Jabatan <span className="text-slate-400 font-normal text-xs">(opsional)</span>
            </label>
            <Input
              placeholder="Contoh: CEO, COO, Backend Developer, Dosen Pembimbing..."
              value={position}
              onChange={(e) => setPosition(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button variant="outline" onClick={onClose}>Batal</Button>
            <Button onClick={handleAdd} disabled={saving}>
              {saving ? 'Menambahkan...' : 'Tambahkan'}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}

// ── Members Panel (slide-open per startup card) ──────────────────────────────
function MembersPanel({ startupId, onMemberClick, onRemoveMember, onAddMember }) {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const loadMembers = useCallback(() => {
    setLoading(true);
    userService.getUsers({ startup_id: startupId, limit: 100 })
      .then((res) => setMembers(res.data || []))
      .catch(() => setMembers([]))
      .finally(() => setLoading(false));
  }, [startupId]);

  useEffect(() => { loadMembers(); }, [loadMembers]);

  const filtered = members.filter((m) =>
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    (m.email || '').toLowerCase().includes(search.toLowerCase()) ||
    (m.position || '').toLowerCase().includes(search.toLowerCase())
  );

  const dosen = filtered.filter((m) => m.role === 'dosen');
  const mahasiswa = filtered.filter((m) => m.role === 'mahasiswa');

  return (
    <div className="border-t border-slate-100 dark:border-white/10 mt-4 pt-4 space-y-4 animate-fade-in">
      {/* Search + Add */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari anggota..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs font-medium text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/30"
          />
        </div>
        <button
          onClick={onAddMember}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 text-xs font-bold hover:bg-purple-200 dark:hover:bg-purple-500/30 transition-colors shrink-0"
          title="Tambah Anggota"
        >
          <UserPlus size={14} /> Tambah
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-6">
          <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-6">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-slate-100 dark:bg-white/5 flex items-center justify-center mb-2">
            <Users size={22} className="text-slate-400" />
          </div>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Belum ada anggota</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Dosen */}
          {dosen.length > 0 && (
            <div>
              <p className="text-[11px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <GraduationCap size={12} /> Dosen ({dosen.length})
              </p>
              <div className="space-y-1.5">
                {dosen.map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center gap-3 p-2.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-500/5 border border-emerald-100 dark:border-emerald-500/15 hover:border-emerald-300 dark:hover:border-emerald-500/30 transition-colors group"
                  >
                    <button onClick={() => onMemberClick(m)} className="flex items-center gap-3 flex-1 min-w-0 text-left cursor-pointer">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center text-[11px] font-bold shrink-0">
                        {getInitials(m.name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{m.name}</p>
                        <p className="text-[10px] text-slate-400 truncate">
                          {m.position ? `${m.position} · ` : ''}{m.email}
                        </p>
                      </div>
                    </button>
                    <button
                      onClick={() => onRemoveMember(m)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-300 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 opacity-0 group-hover:opacity-100 transition-all shrink-0"
                      title="Keluarkan dari startup"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Mahasiswa */}
          {mahasiswa.length > 0 && (
            <div>
              <p className="text-[11px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <BookOpen size={12} /> Mahasiswa ({mahasiswa.length})
              </p>
              <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
                {mahasiswa.map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center gap-3 p-2.5 rounded-xl bg-indigo-50/70 dark:bg-indigo-500/5 border border-indigo-100 dark:border-indigo-500/15 hover:border-indigo-300 dark:hover:border-indigo-500/30 transition-colors group"
                  >
                    <button onClick={() => onMemberClick(m)} className="flex items-center gap-3 flex-1 min-w-0 text-left cursor-pointer">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center text-[11px] font-bold shrink-0">
                        {getInitials(m.name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{m.name}</p>
                        <p className="text-[10px] text-slate-400 truncate">
                          {m.position ? `${m.position} · ` : ''}{m.nip_nim ? `NIM: ${m.nip_nim}` : m.email}
                        </p>
                      </div>
                    </button>
                    <button
                      onClick={() => onRemoveMember(m)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-300 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 opacity-0 group-hover:opacity-100 transition-all shrink-0"
                      title="Keluarkan dari startup"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Startup Card ──────────────────────────────────────────────────────────────
function StartupCard({ startup, onEdit, onDelete, onMemberClick, onRemoveMember, onAddMember }) {
  const [showMembers, setShowMembers] = useState(false);
  const totalMembers = startup._count?.users || 0;

  return (
    <div className={`bg-white dark:bg-white/5 rounded-[1.75rem] border transition-all duration-300 overflow-hidden ${
      showMembers
        ? 'border-purple-300 dark:border-purple-500/40 shadow-lg shadow-purple-500/10'
        : 'border-slate-100 dark:border-white/10 hover:border-slate-200 dark:hover:border-white/20 hover:shadow-md'
    }`}>
      {/* Accent bar */}
      <div className="h-1 bg-gradient-to-r from-[#6C1B75] via-[#9333EA] to-[#C084FC]" />

      <div className="p-6">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#9333EA] to-[#6C1B75] text-white flex items-center justify-center text-lg font-black shadow-lg shadow-purple-500/20 shrink-0">
              {startup.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white truncate">{startup.name}</h3>
              {startup.code && (
                <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-white/10 px-2 py-0.5 rounded-full">
                  {startup.code}
                </span>
              )}
            </div>
          </div>
          <div className="flex gap-1.5 shrink-0">
            <button
              onClick={onEdit}
              className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-all"
              title="Edit"
            >
              <Edit size={15} />
            </button>
            <button
              onClick={onDelete}
              className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all"
              title="Hapus"
            >
              <Trash2 size={15} />
            </button>
          </div>
        </div>

        {/* Description */}
        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-4 line-clamp-2">
          {startup.description || 'Tidak ada deskripsi untuk startup ini.'}
        </p>

        {/* Stats */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-500/10 border border-purple-100 dark:border-purple-500/20">
            <Users size={14} className="text-purple-600 dark:text-purple-400" />
            <span className="text-xs font-bold text-purple-700 dark:text-purple-300">
              {totalMembers} Anggota
            </span>
          </div>
        </div>

        {/* Toggle Members Button */}
        <button
          onClick={() => setShowMembers((v) => !v)}
          className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 ${
            showMembers
              ? 'bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300'
              : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 hover:bg-purple-50 dark:hover:bg-purple-500/10 hover:text-purple-700 dark:hover:text-purple-300'
          }`}
        >
          <span className="flex items-center gap-2">
            <Users size={14} />
            {showMembers ? 'Sembunyikan Anggota' : `Lihat ${totalMembers} Anggota`}
          </span>
          {showMembers ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>

        {/* Members Panel */}
        {showMembers && (
          <MembersPanel
            startupId={startup.id}
            onMemberClick={onMemberClick}
            onRemoveMember={onRemoveMember}
            onAddMember={onAddMember}
          />
        )}
      </div>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default function ManageStartupsPage() {
  const [startups, setStartups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editStartup, setEditStartup] = useState(null);
  const [form, setForm] = useState({ name: '', code: '', description: '' });
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Modal: member detail
  const [selectedMember, setSelectedMember] = useState(null);
  // Modal: add member
  const [addMemberStartup, setAddMemberStartup] = useState(null);
  const [editMembers, setEditMembers] = useState([]); // members shown in edit modal
  const [removeTarget, setRemoveTarget] = useState(null); // { member, startupId }

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
    setForm({ name: '', code: '', description: '' });
    setEditMembers([]);
    setShowModal(true);
  };

  const openEdit = async (s) => {
    setEditStartup(s);
    setForm({ name: s.name, code: s.code || '', description: s.description || '' });
    setShowModal(true);
    // Load members for position editing
    try {
      const res = await userService.getUsers({ startup_id: s.id, limit: 100 });
      setEditMembers(res.data || []);
    } catch {
      setEditMembers([]);
    }
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
        // Update positions for each member
        for (const m of editMembers) {
          await userService.updateUser(m.id, { position: m.position || '' });
        }
        addToast({ type: 'success', message: 'Startup & posisi anggota berhasil diperbarui' });
      } else {
        await startupService.createStartup(form);
        addToast({ type: 'success', message: 'Startup berhasil ditambahkan' });
      }
      setShowModal(false);
      setEditMembers([]);
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

  const handleRemoveMember = async () => {
    if (!removeTarget) return;
    try {
      await userService.updateUser(removeTarget.member.id, { startup_id: null, position: null });
      addToast({ type: 'success', message: `${removeTarget.member.name} dikeluarkan dari startup` });
      setRemoveTarget(null);
      loadStartups();
    } catch (err) {
      addToast({ type: 'error', message: err.response?.data?.message || 'Gagal mengeluarkan anggota' });
    }
  };

  const handleAddMember = async (user, position) => {
    if (!addMemberStartup) return;
    await userService.updateUser(user.id, { startup_id: addMemberStartup.id, position });
    addToast({ type: 'success', message: `${user.name} ditambahkan ke ${addMemberStartup.name}` });
    setAddMemberStartup(null);
    loadStartups();
  };

  const totalMembers = startups.reduce((n, s) => n + (s._count?.users || 0), 0);

  return (
    <div className="space-y-8 pb-12 animate-fade-in">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Kelola Startup</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {startups.length} startup · {totalMembers} total anggota terdaftar
          </p>
        </div>
        <button
          onClick={openAdd}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-[#9333EA] to-[#6C1B75] text-white text-sm font-bold shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 hover:brightness-110 transition-all"
        >
          <Plus size={18} /> Tambah Startup
        </button>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {[
          { label: 'Startup', value: startups.length, icon: Building2, tint: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20' },
          { label: 'Total Anggota', value: totalMembers, icon: Users, tint: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20' },
          { label: 'Rata-rata Anggota', value: startups.length ? Math.round(totalMembers / startups.length) : 0, icon: GraduationCap, tint: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' },
        ].map((s) => (
          <div key={s.label} className={`flex items-center gap-4 p-4 rounded-2xl border bg-white dark:bg-white/5 ${s.tint.split(' ').pop()}`}>
            <div className={`w-10 h-10 rounded-xl border flex items-center justify-center ${s.tint}`}>
              <s.icon size={20} />
            </div>
            <div>
              <p className="text-2xl font-black text-slate-900 dark:text-white">{s.value}</p>
              <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Startup cards grid */}
      {loading ? (
        <LoadingSpinner className="py-12" />
      ) : startups.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-20 h-20 mx-auto rounded-3xl bg-purple-100 dark:bg-purple-500/15 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-4">
            <Building2 size={36} />
          </div>
          <p className="font-bold text-slate-700 dark:text-slate-200">Belum ada startup</p>
          <p className="text-sm text-slate-400 mt-1 mb-4">Tambahkan startup pertama untuk memulai.</p>
          <button onClick={openAdd} className="px-5 py-2.5 rounded-full bg-[#9333EA] text-white text-sm font-bold">
            <Plus size={16} className="inline mr-1" /> Tambah Startup
          </button>
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {startups.map((s) => (
            <StartupCard
              key={s.id}
              startup={s}
              onEdit={() => openEdit(s)}
              onDelete={() => setDeleteTarget(s)}
              onMemberClick={(m) => setSelectedMember(m)}
              onRemoveMember={(m) => setRemoveTarget({ member: m, startupId: s.id })}
              onAddMember={() => setAddMemberStartup(s)}
            />
          ))}
        </div>
      )}

      {/* ── Add/Edit Startup Modal ── */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editStartup ? 'Edit Startup' : 'Tambah Startup'}>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Nama Startup</label>
            <Input
              placeholder="Contoh: JagoAI, Kroombox, Uni Inside..."
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Kode <span className="text-slate-400 font-normal">(opsional)</span></label>
            <Input
              placeholder="Contoh: JG, KB, UI"
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Deskripsi <span className="text-slate-400 font-normal">(opsional)</span></label>
            <textarea
              className="flex min-h-[80px] w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 px-4 py-2.5 text-sm text-slate-800 dark:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/30 focus-visible:border-purple-400 placeholder:text-slate-400 transition-colors resize-none"
              placeholder="Deskripsi singkat tentang startup ini..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
            />
          </div>

          {/* Edit: Posisi Anggota */}
          {editStartup && editMembers.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-white/10">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <Briefcase size={14} className="text-purple-500" /> Posisi Anggota
              </label>
              <p className="text-[11px] text-slate-400">Ubah jabatan (misal: CEO, COO, Backend Developer) tiap anggota startup ini.</p>
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {editMembers.map((m, idx) => (
                  <div key={m.id} className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10">
                    <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${
                      m.role === 'dosen' ? 'from-emerald-500 to-teal-600' : 'from-indigo-500 to-purple-600'
                    } text-white flex items-center justify-center text-[10px] font-bold shrink-0`}>
                      {getInitials(m.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{m.name}</p>
                      <p className="text-[10px] text-slate-400">{ROLE_CONFIG[m.role]?.label || m.role}</p>
                    </div>
                    <input
                      type="text"
                      placeholder="Jabatan"
                      value={m.position || ''}
                      onChange={(e) => {
                        const updated = [...editMembers];
                        updated[idx] = { ...m, position: e.target.value };
                        setEditMembers(updated);
                      }}
                      className="w-32 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg px-2.5 py-1.5 text-[11px] font-medium text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-purple-500/40"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <Button variant="outline" onClick={() => setShowModal(false)}>Batal</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Menyimpan...' : editStartup ? 'Simpan Perubahan' : 'Tambah Startup'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ── Member Detail Modal ── */}
      {selectedMember && (
        <MemberDetailModal member={selectedMember} onClose={() => setSelectedMember(null)} />
      )}

      {/* ── Add Member Modal ── */}
      {addMemberStartup && (
        <AddMemberModal
          startupId={addMemberStartup.id}
          onClose={() => setAddMemberStartup(null)}
          onAdd={handleAddMember}
        />
      )}

      {/* ── Remove Member Confirm ── */}
      {removeTarget && (
        <ConfirmDialog
          isOpen={!!removeTarget}
          onClose={() => setRemoveTarget(null)}
          onConfirm={handleRemoveMember}
          title="Keluarkan Anggota?"
          message={`Keluarkan "${removeTarget.member.name}" dari startup ini? Jabatan di startup ini akan dihapus.`}
          confirmText="Keluarkan"
          variant="destructive"
        />
      )}

      {/* ── Delete Startup Confirm ── */}
      {deleteTarget && (
        <ConfirmDialog
          isOpen={!!deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
          title="Hapus Startup?"
          message={`Hapus "${deleteTarget.name}"? ${deleteTarget._count?.users || 0} anggota akan kehilangan startup.`}
          confirmText="Hapus"
        />
      )}
    </div>
  );
}