import { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  UsersRound, Crown, Trophy, Calendar, UserCheck, UserPlus, Pencil, Trash2, Send,
  Hourglass, XCircle, CheckCircle2, ArrowUpRight, LogOut, Clock, Info, ChevronRight,
} from 'lucide-react';
import myTeamService from '@/services/myTeamService';
import userService from '@/services/userService';
import useUIStore from '@/store/uiStore';
import { useAuth } from '@/hooks/useAuth';
import { formatDate, formatRelativeTime } from '@/utils/helpers';
import {
  PageHeader, Panel, PanelTitle, Pill, StatusPill, Avatar, EmptyBlock, FilterTabs,
  SkeletonBlocks, Dialog, ConfirmDialog, PrimaryButton, GhostButton, FieldLabel, inputClass, SelectField,
} from '@/components/user/UserUI';

const LOCKED = ['ongoing', 'completed', 'cancelled'];

export default function TimSayaPage() {
  const { user } = useAuth();
  const addToast = useUIStore((s) => s.addToast);
  const [params, setParams] = useSearchParams();
  const [teams, setTeams] = useState([]);
  const [solo, setSolo] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [students, setStudents] = useState([]);
  const [lecturers, setLecturers] = useState([]);

  // dialog state
  const [dialog, setDialog] = useState(null); // 'rename' | 'add' | 'advisor'
  const [confirm, setConfirm] = useState(null); // { title, message, action, label }
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ name: '', memberId: '', advisorId: '', notes: '' });

  const load = useCallback(async () => {
    try {
      const res = await myTeamService.getMyTeams();
      setTeams(res.data?.teams || []);
      setSolo(res.data?.solo || []);
    } catch {
      addToast({ type: 'error', message: 'Gagal memuat data tim' });
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    userService.getUsers({ role: 'mahasiswa', status: 'active', limit: 200 }).then((r) => setStudents(r.data || [])).catch(() => {});
    userService.getUsers({ role: 'dosen', status: 'active', limit: 200 }).then((r) => setLecturers(r.data || [])).catch(() => {});
  }, []);

  const filtered = useMemo(() => {
    if (filter === 'leader') return teams.filter((t) => t.leader_id === user.id);
    if (filter === 'member') return teams.filter((t) => t.leader_id !== user.id);
    if (filter === 'solo') return [];
    return teams;
  }, [teams, filter, user.id]);

  const selectedId = Number(params.get('team')) || filtered[0]?.id;
  const team = teams.find((t) => t.id === selectedId) || null;
  const isLeader = team?.leader_id === user.id;
  const comp = team?.competition;
  const locked = comp && LOCKED.includes(comp.status);
  const maxMembers = Number(comp?.max_team_members) || 10;
  const pendingReq = team?.advisor_requests?.find((r) => r.status === 'pending');
  const hasAdvisor = team?.advisor_id && team?.advisor_status === 'approved';

  const run = async (fn, okMsg) => {
    setBusy(true);
    try {
      const res = await fn();
      addToast({ type: 'success', message: res?.message || okMsg });
      setDialog(null);
      setConfirm(null);
      await load();
    } catch (err) {
      addToast({ type: 'error', message: err.response?.data?.message || 'Terjadi kesalahan' });
    } finally {
      setBusy(false);
    }
  };

  const openDialog = (type) => {
    setForm({ name: team?.name || '', memberId: '', advisorId: '', notes: '' });
    setDialog(type);
  };

  const memberCandidates = students.filter((s) => !team?.members?.some((m) => m.user_id === s.id));
  const rejectedIds = new Set((team?.advisor_requests || []).filter((r) => r.status === 'rejected').map((r) => r.target_advisor_id));

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="h-16 w-72 rounded-2xl bg-slate-200/70 dark:bg-white/5 animate-pulse" />
        <SkeletonBlocks count={3} className="h-56" />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12 animate-fade-in-up">
      <PageHeader
        icon={UsersRound}
        eyebrow="Kolaborasi"
        title="Tim Saya"
        subtitle="Kelola tim lomba, pantau anggota, dan ajukan dosen pembimbing dalam satu tempat."
        actions={
          <Link to="/mahasiswa/competitions" className="inline-flex items-center gap-2 bg-gradient-to-r from-[#9333EA] to-[#6C1B75] text-white px-6 py-3.5 rounded-2xl font-bold text-[14px] shadow-lg shadow-purple-900/25 hover:-translate-y-0.5 transition-all">
            Daftar Lomba Baru <ArrowUpRight size={18} />
          </Link>
        }
      />

      <FilterTabs
        value={filter}
        onChange={(v) => { setFilter(v); setParams({}); }}
        items={[
          { value: 'all', label: 'Semua Tim', count: teams.length },
          { value: 'leader', label: 'Saya Ketua', count: teams.filter((t) => t.leader_id === user.id).length },
          { value: 'member', label: 'Saya Anggota', count: teams.filter((t) => t.leader_id !== user.id).length },
          { value: 'solo', label: 'Menunggu Tim', count: solo.length },
        ]}
      />

      {filter === 'solo' ? (
        <SoloList solo={solo} onCancel={(r) => setConfirm({
          title: 'Batalkan pendaftaran?',
          message: `Kamu akan keluar dari antrean pembentukan tim untuk "${r.competition_title}".`,
          label: 'Batalkan Pendaftaran',
          action: () => run(() => myTeamService.cancelSolo(r.id), 'Pendaftaran dibatalkan'),
        })} />
      ) : filtered.length === 0 ? (
        <Panel>
          <EmptyBlock
            icon={UsersRound}
            title="Belum ada tim"
            description={solo.length > 0 ? `Kamu punya ${solo.length} pendaftaran yang sedang menunggu pembentukan tim oleh admin.` : 'Daftar ke lomba dan bentuk tim bersama teman-temanmu.'}
            action={<Link to="/mahasiswa/competitions" className="inline-flex items-center gap-2 text-purple-700 dark:text-purple-300 font-bold hover:underline underline-offset-4">Jelajahi lomba <ChevronRight size={16} /></Link>}
          />
        </Panel>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-[380px_1fr] gap-6 items-start">
          {/* Team list */}
          <div className="space-y-3">
            {filtered.map((t) => {
              const active = t.id === team?.id;
              const lead = t.leader_id === user.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setParams({ team: String(t.id) })}
                  className={`w-full text-left p-5 rounded-[24px] border transition-all duration-300 group ${active
                    ? 'bg-gradient-to-br from-[#9333EA]/10 to-transparent border-[#9333EA]/40 shadow-lg shadow-purple-900/10'
                    : 'bg-white dark:bg-[#131620]/90 border-slate-200/80 dark:border-white/10 hover:border-purple-500/30 hover:-translate-y-0.5'}`}
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="min-w-0">
                      <p className={`font-black text-[17px] truncate ${active ? 'text-purple-700 dark:text-purple-300' : 'text-slate-900 dark:text-white'}`}>{t.name}</p>
                      <p className="text-[13px] font-medium text-slate-500 dark:text-slate-400 truncate">{t.competition_title}</p>
                    </div>
                    {lead && <Pill tone="amber" icon={Crown}>Ketua</Pill>}
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex -space-x-2">
                      {(t.members || []).slice(0, 4).map((m) => (
                        <Avatar key={m.user_id} name={m.name} size="sm" className="ring-2 ring-white dark:ring-[#131620]" />
                      ))}
                      {(t.members || []).length > 4 && (
                        <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 ring-2 ring-white dark:ring-[#131620] flex items-center justify-center text-[11px] font-bold text-slate-600 dark:text-slate-300">+{t.members.length - 4}</div>
                      )}
                    </div>
                    <StatusPill status={t.competition?.status} />
                  </div>
                </button>
              );
            })}
          </div>

          {/* Team detail */}
          {team && (
            <div className="space-y-6 min-w-0">
              {/* Hero */}
              <div className="bg-gradient-to-br from-[#1E1B4B] via-[#2E1065] to-[#3B0764] rounded-[32px] p-7 md:p-9 relative overflow-hidden text-white shadow-2xl">
                <div className="absolute -top-1/2 -right-[10%] w-[70%] h-[160%] bg-gradient-to-b from-[#9333EA]/30 to-transparent blur-3xl rounded-full rotate-12 pointer-events-none" />
                <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
                  <div className="min-w-0">
                    <div className="flex flex-wrap gap-2 mb-4">
                      <span className="px-3 py-1 rounded-full bg-white/15 backdrop-blur text-[12px] font-bold">{isLeader ? 'Kamu Ketua Tim' : 'Kamu Anggota Tim'}</span>
                      <span className="px-3 py-1 rounded-full bg-white/15 backdrop-blur text-[12px] font-bold">{team.status === 'complete' ? 'Tim Lengkap' : 'Sedang Dibentuk'}</span>
                    </div>
                    <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-2 break-words">{team.name}</h2>
                    <Link to={`/mahasiswa/competitions/${team.competition_id}`} className="inline-flex items-center gap-2 text-purple-200 hover:text-white font-semibold">
                      <Trophy size={16} /> {team.competition_title} <ArrowUpRight size={15} />
                    </Link>
                  </div>
                  {isLeader && !locked && (
                    <button onClick={() => openDialog('rename')} className="inline-flex items-center gap-2 bg-white/15 hover:bg-white/25 backdrop-blur px-5 py-3 rounded-2xl font-bold text-sm transition-all shrink-0">
                      <Pencil size={16} /> Ubah Nama
                    </button>
                  )}
                </div>
                <div className="relative z-10 grid grid-cols-3 gap-3 mt-8">
                  {[
                    { icon: UsersRound, label: 'Anggota', val: `${team.members?.length || 0}/${maxMembers}` },
                    { icon: Calendar, label: 'Pelaksanaan', val: comp?.event_date ? formatDate(comp.event_date, 'dd MMM yyyy') : '-' },
                    { icon: Clock, label: 'Deadline', val: comp?.registration_deadline ? formatDate(comp.registration_deadline, 'dd MMM yyyy') : '-' },
                  ].map((s) => (
                    <div key={s.label} className="bg-white/10 backdrop-blur rounded-2xl p-4">
                      <s.icon size={18} className="text-purple-200 mb-2" />
                      <p className="text-[11px] uppercase tracking-wider font-bold text-purple-200">{s.label}</p>
                      <p className="font-black text-[15px] md:text-lg truncate">{s.val}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 2xl:grid-cols-2 gap-6">
                {/* Members */}
                <Panel>
                  <PanelTitle
                    icon={UsersRound}
                    title="Anggota Tim"
                    subtitle={`${team.members?.length || 0} dari maks ${maxMembers} orang`}
                    action={isLeader && (team.members?.length || 0) < maxMembers && (
                      <button onClick={() => openDialog('add')} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-500/10 text-purple-700 dark:text-purple-300 font-bold text-sm hover:bg-purple-500/20 transition-all">
                        <UserPlus size={16} /> Tambah
                      </button>
                    )}
                  />
                  <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden mb-6">
                    <div className="h-full bg-gradient-to-r from-[#9333EA] to-fuchsia-500 rounded-full transition-all" style={{ width: `${Math.min(100, ((team.members?.length || 0) / maxMembers) * 100)}%` }} />
                  </div>
                  <ul className="space-y-3">
                    {(team.members || []).map((m) => {
                      const lead = m.user_id === team.leader_id;
                      return (
                        <li key={m.user_id} className="flex items-center gap-4 p-4 rounded-[20px] border border-slate-200/60 dark:border-white/5 bg-slate-50/80 dark:bg-slate-900/50">
                          <Avatar name={m.name} />
                          <Link to={`/mahasiswa/profile/${m.user_id}`} className="flex-1 min-w-0 group">
                            <p className="font-bold text-slate-900 dark:text-white truncate group-hover:text-purple-600 dark:group-hover:text-purple-400">
                              {m.name}{m.user_id === user.id && <span className="text-slate-400 font-medium"> (kamu)</span>}
                            </p>
                            <p className="text-[13px] font-medium text-slate-500 dark:text-slate-400 truncate">{m.role || 'Anggota'}{m.startup_name ? ` • ${m.startup_name}` : ''}</p>
                          </Link>
                          {lead ? (
                            <Pill tone="amber" icon={Crown}>Ketua</Pill>
                          ) : isLeader && !locked ? (
                            <button
                              title="Hapus dari tim"
                              onClick={() => setConfirm({
                                title: `Hapus ${m.name}?`,
                                message: `${m.name} akan dikeluarkan dari ${team.name} dan tidak lagi terdaftar di lomba ini.`,
                                label: 'Hapus Anggota',
                                action: () => run(() => myTeamService.updateByLeader(team.id, { remove_member_id: m.user_id }), 'Anggota dihapus'),
                              })}
                              className="p-2.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-500/10 transition-colors"
                            >
                              <Trash2 size={17} />
                            </button>
                          ) : null}
                        </li>
                      );
                    })}
                  </ul>
                  {!isLeader && (
                    <p className="flex items-center gap-2 text-[13px] font-medium text-slate-500 dark:text-slate-400 mt-5"><Info size={15} /> Hanya ketua tim yang dapat mengelola anggota.</p>
                  )}
                </Panel>

                {/* Advisor */}
                <Panel>
                  <PanelTitle icon={UserCheck} tone="emerald" title="Dosen Pembimbing" subtitle="Pengajuan dilakukan oleh ketua tim" />

                  {hasAdvisor ? (
                    <div className="p-5 rounded-[22px] bg-emerald-500/5 border border-emerald-500/25 flex items-center gap-4">
                      <Avatar name={team.advisor_name} size="lg" className="from-emerald-500 to-teal-600 border-emerald-300/40" />
                      <div className="flex-1 min-w-0">
                        <p className="font-black text-slate-900 dark:text-white truncate">{team.advisor_name}</p>
                        <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5"><CheckCircle2 size={15} /> Resmi membimbing tim ini</p>
                      </div>
                    </div>
                  ) : pendingReq ? (
                    <div className="p-5 rounded-[22px] bg-amber-500/5 border border-amber-500/25">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0"><Hourglass size={24} /></div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[12px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">Menunggu respons</p>
                          <p className="font-black text-slate-900 dark:text-white truncate">{pendingReq.target_advisor_name}</p>
                          <p className="text-[13px] font-medium text-slate-500 dark:text-slate-400">Diajukan {formatRelativeTime(pendingReq.submitted_at)}</p>
                        </div>
                      </div>
                      {isLeader && (
                        <button
                          onClick={() => setConfirm({
                            title: 'Batalkan pengajuan?',
                            message: `Pengajuan ke ${pendingReq.target_advisor_name} akan ditarik kembali.`,
                            label: 'Batalkan Pengajuan',
                            action: () => run(() => myTeamService.cancelAdvisorRequest(team.id), 'Pengajuan dibatalkan'),
                          })}
                          className="mt-4 w-full inline-flex items-center justify-center gap-2 py-3 rounded-2xl border border-amber-500/30 text-amber-700 dark:text-amber-300 font-bold text-sm hover:bg-amber-500/10 transition-all"
                        >
                          <XCircle size={16} /> Batalkan Pengajuan
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="p-6 rounded-[22px] border-2 border-dashed border-slate-200 dark:border-white/10 text-center">
                      <div className="w-14 h-14 mx-auto rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mb-3"><UserCheck size={24} /></div>
                      <p className="font-bold text-slate-800 dark:text-white">Belum ada dosen pembimbing</p>
                      <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">{isLeader ? 'Pilih dosen yang sesuai dengan bidang lomba timmu.' : 'Ketua tim dapat mengajukan dosen pembimbing.'}</p>
                      {isLeader && (
                        <PrimaryButton onClick={() => openDialog('advisor')} className="mt-5"><Send size={16} /> Ajukan Dosen</PrimaryButton>
                      )}
                    </div>
                  )}

                  {(team.advisor_requests || []).length > 0 && (
                    <div className="mt-6">
                      <p className="text-[12px] font-bold uppercase tracking-wider text-slate-400 mb-3">Riwayat Pengajuan</p>
                      <ol className="relative border-l-2 border-slate-200 dark:border-white/10 ml-2 space-y-4">
                        {team.advisor_requests.map((r) => (
                          <li key={r.id} className="pl-5 relative">
                            <span className={`absolute -left-[7px] top-1.5 w-3 h-3 rounded-full ring-4 ring-white dark:ring-[#131620] ${r.status === 'approved' ? 'bg-emerald-500' : r.status === 'rejected' ? 'bg-rose-500' : 'bg-amber-500'}`} />
                            <div className="flex items-center justify-between gap-3">
                              <p className="font-bold text-[14px] text-slate-800 dark:text-white truncate">{r.target_advisor_name}</p>
                              <StatusPill status={r.status} />
                            </div>
                            <p className="text-[12px] font-medium text-slate-500 dark:text-slate-400">{formatRelativeTime(r.processed_at || r.submitted_at)}</p>
                            {r.rejection_reason && <p className="text-[13px] text-rose-600 dark:text-rose-400 mt-1">Alasan: {r.rejection_reason}</p>}
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}
                </Panel>
              </div>

              {/* Danger zone */}
              {isLeader && (
                <Panel className="border-rose-500/20 dark:border-rose-500/20">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <h3 className="font-black text-slate-900 dark:text-white text-lg">Batalkan Pendaftaran Tim</h3>
                      <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                        {locked ? 'Tidak tersedia — lomba sudah berjalan atau selesai.' : 'Tim akan dihapus dan semua anggota keluar dari lomba ini.'}
                      </p>
                    </div>
                    <button
                      disabled={locked}
                      onClick={() => setConfirm({
                        title: `Batalkan pendaftaran di ${team.competition_title}?`,
                        message: `Tim "${team.name}" akan dihapus dan seluruh anggota tidak lagi terdaftar. Tindakan ini tidak bisa dibatalkan.`,
                        label: 'Ya, Batalkan',
                        action: () => run(() => myTeamService.cancelRegistration(team.id), 'Pendaftaran dibatalkan').then(() => setParams({})),
                      })}
                      className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl border border-rose-500/30 text-rose-600 dark:text-rose-400 font-bold text-sm hover:bg-rose-500/10 transition-all disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                    >
                      <LogOut size={16} /> Batalkan Pendaftaran
                    </button>
                  </div>
                </Panel>
              )}
            </div>
          )}
        </div>
      )}

      {/* Rename */}
      <Dialog
        open={dialog === 'rename'}
        onClose={() => setDialog(null)}
        title="Ubah Nama Tim"
        footer={<>
          <GhostButton onClick={() => setDialog(null)}>Batal</GhostButton>
          <PrimaryButton disabled={busy || !form.name.trim()} onClick={() => run(() => myTeamService.updateByLeader(team.id, { name: form.name }), 'Nama tim diperbarui')}>Simpan</PrimaryButton>
        </>}
      >
        <FieldLabel>Nama Tim</FieldLabel>
        <input autoFocus value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputClass} placeholder="Contoh: Team Alpha" />
      </Dialog>

      {/* Add member */}
      <Dialog
        open={dialog === 'add'}
        onClose={() => setDialog(null)}
        title="Tambah Anggota"
        subtitle={team ? `Sisa slot: ${maxMembers - (team.members?.length || 0)} orang` : ''}
        footer={<>
          <GhostButton onClick={() => setDialog(null)}>Batal</GhostButton>
          <PrimaryButton disabled={busy || !form.memberId} onClick={() => run(() => myTeamService.updateByLeader(team.id, { add_member_id: Number(form.memberId) }), 'Anggota ditambahkan')}><UserPlus size={16} /> Tambahkan</PrimaryButton>
        </>}
      >
        <FieldLabel hint="Mahasiswa aktif">Pilih Mahasiswa</FieldLabel>
        <SelectField value={form.memberId} onChange={(v) => setForm({ ...form, memberId: v })}>
          <option value="">— Pilih anggota —</option>
          {memberCandidates.map((s) => <option key={s.id} value={s.id}>{s.name}{s.startup_name ? ` (${s.startup_name})` : ''}</option>)}
        </SelectField>
        <p className="text-[13px] text-slate-500 dark:text-slate-400 font-medium mt-3">Mahasiswa yang sudah terdaftar di lomba ini lewat tim lain tidak bisa ditambahkan.</p>
      </Dialog>

      {/* Request advisor */}
      <Dialog
        open={dialog === 'advisor'}
        onClose={() => setDialog(null)}
        title="Ajukan Dosen Pembimbing"
        subtitle={team ? `Untuk ${team.name} • ${team.competition_title}` : ''}
        footer={<>
          <GhostButton onClick={() => setDialog(null)}>Batal</GhostButton>
          <PrimaryButton disabled={busy || !form.advisorId} onClick={() => run(() => myTeamService.requestAdvisor(team.id, { advisor_id: Number(form.advisorId), notes: form.notes }), 'Pengajuan terkirim')}><Send size={16} /> Kirim Pengajuan</PrimaryButton>
        </>}
      >
        <div className="space-y-5">
          <div>
            <FieldLabel>Pilih Dosen</FieldLabel>
            <div className="grid gap-2 max-h-64 overflow-y-auto custom-scrollbar pr-1">
              {lecturers.map((d) => {
                const rejected = rejectedIds.has(d.id);
                const chosen = String(d.id) === form.advisorId;
                return (
                  <button
                    key={d.id}
                    type="button"
                    disabled={rejected}
                    onClick={() => setForm({ ...form, advisorId: String(d.id) })}
                    className={`flex items-center gap-3 p-3.5 rounded-2xl border text-left transition-all ${chosen ? 'border-[#9333EA] bg-purple-500/10' : 'border-slate-200 dark:border-white/10 hover:border-purple-500/40'} disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    <Avatar name={d.name} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-[14px] text-slate-900 dark:text-white truncate">{d.name}</p>
                      <p className="text-[12px] font-medium text-slate-500 dark:text-slate-400 truncate">
                        {rejected ? 'Sudah menolak pengajuan timmu' : (Array.isArray(d.expertise) && d.expertise.length ? d.expertise.join(' • ') : d.position || 'Dosen')}
                      </p>
                    </div>
                    {chosen && <CheckCircle2 size={18} className="text-[#9333EA] shrink-0" />}
                  </button>
                );
              })}
              {lecturers.length === 0 && <p className="text-sm text-slate-500">Belum ada dosen terdaftar.</p>}
            </div>
          </div>
          <div>
            <FieldLabel hint="Opsional">Pesan untuk Dosen</FieldLabel>
            <textarea rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className={`${inputClass} resize-none`} placeholder="Ceritakan singkat ide/rencana timmu..." />
          </div>
        </div>
      </Dialog>

      <ConfirmDialog
        open={!!confirm}
        onClose={() => setConfirm(null)}
        onConfirm={() => confirm?.action()}
        title={confirm?.title}
        message={confirm?.message}
        confirmLabel={confirm?.label}
        loading={busy}
      />
    </div>
  );
}

function SoloList({ solo, onCancel }) {
  if (solo.length === 0) {
    return (
      <Panel>
        <EmptyBlock icon={Hourglass} title="Tidak ada antrean" description="Semua pendaftaranmu sudah memiliki tim." />
      </Panel>
    );
  }
  return (
    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
      {solo.map((r) => (
        <Panel key={r.id} className="p-6 md:p-6 flex flex-col">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"><Hourglass size={22} /></div>
            <StatusPill status="waiting" />
          </div>
          <h3 className="font-black text-lg text-slate-900 dark:text-white mb-1">{r.competition_title}</h3>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-5">Didaftarkan {formatRelativeTime(r.created_at)}. Admin akan menempatkanmu ke tim yang sesuai.</p>
          <div className="mt-auto flex gap-2">
            <Link to={`/mahasiswa/competitions/${r.competition_id}`} className="flex-1 inline-flex items-center justify-center gap-2 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-sm hover:bg-slate-200 dark:hover:bg-slate-700">Detail Lomba</Link>
            <button onClick={() => onCancel(r)} disabled={LOCKED.includes(r.competition?.status)} className="px-4 py-3 rounded-2xl border border-rose-500/30 text-rose-600 dark:text-rose-400 font-bold text-sm hover:bg-rose-500/10 disabled:opacity-40">Batalkan</button>
          </div>
        </Panel>
      ))}
    </div>
  );
}
