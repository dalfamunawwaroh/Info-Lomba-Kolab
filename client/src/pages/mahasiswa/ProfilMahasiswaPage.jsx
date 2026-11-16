import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Mail, Phone, Building2, CalendarDays, GraduationCap, AtSign, Briefcase, Pencil, Save, X, Trophy,
  PlayCircle, CheckCircle2, CalendarClock, UsersRound, Crown, UserCheck, IdCard, ArrowUpRight, Hourglass, BadgeCheck,
} from 'lucide-react';
import userService from '@/services/userService';
import historyService from '@/services/historyService';
import useUIStore from '@/store/uiStore';
import { useAuth } from '@/hooks/useAuth';
import { formatDate } from '@/utils/helpers';
import { ROLE_LABELS } from '@/utils/constants';
import { cn } from '@/lib/utils';
import {
  Panel, PanelTitle, Pill, StatusPill, EmptyBlock, FilterTabs, FieldLabel, inputClass, PrimaryButton, GhostButton, ICON_TONES,
} from '@/components/user/UserUI';

const EDITABLE = ['name', 'phone', 'program_studi', 'bio', 'instagram', 'linkedin'];

const linkify = (v, base) => {
  if (!v) return null;
  if (/^https?:\/\//i.test(v)) return v;
  return `${base}${v.replace(/^@/, '')}`;
};

export default function ProfilMahasiswaPage() {
  const { id } = useParams();
  const { user: me, updateUser } = useAuth();
  const addToast = useUIStore((s) => s.addToast);
  const isOwn = !id || Number(id) === me?.id;
  const userId = isOwn ? me?.id : Number(id);

  const [profile, setProfile] = useState(null);
  const [history, setHistory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('about');
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setLoading(true);
    setEditing(false);
    setTab('about');
    Promise.allSettled([userService.getUserById(userId), historyService.getUserHistory(userId)])
      .then(([u, h]) => {
        setProfile(u.status === 'fulfilled' ? u.value.data : isOwn ? me : null);
        setHistory(h.status === 'fulfilled' ? h.value.data : null);
      })
      .finally(() => setLoading(false));
  }, [userId]); // eslint-disable-line react-hooks/exhaustive-deps

  const startEdit = () => {
    setForm(Object.fromEntries(EDITABLE.map((k) => [k, profile?.[k] || ''])));
    setEditing(true);
    setTab('about');
  };

  const save = async (e) => {
    e.preventDefault();
    if (!form.name?.trim()) return addToast({ type: 'error', message: 'Nama tidak boleh kosong' });
    setSaving(true);
    try {
      const res = await userService.updateUser(userId, { ...form, name: form.name.trim() });
      const next = { ...profile, ...form, ...(res?.data || {}) };
      setProfile(next);
      updateUser({ ...me, name: next.name });
      setEditing(false);
      addToast({ type: 'success', message: 'Profil berhasil diperbarui' });
    } catch (err) {
      addToast({ type: 'error', message: err.response?.data?.message || 'Gagal menyimpan profil' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-72 rounded-[32px] bg-slate-200/70 dark:bg-white/5 animate-pulse" />
        <div className="grid xl:grid-cols-[360px_minmax(0,1fr)] gap-6">
          <div className="h-80 rounded-[28px] bg-slate-200/70 dark:bg-white/5 animate-pulse" />
          <div className="h-80 rounded-[28px] bg-slate-200/70 dark:bg-white/5 animate-pulse" />
        </div>
      </div>
    );
  }
  if (!profile) return <Panel><EmptyBlock icon={UsersRound} title="Pengguna tidak ditemukan" /></Panel>;

  const c = history?.competitions || {};
  const items = [...(c.ongoing || []), ...(c.upcoming || []), ...(c.completed || [])];
  const stats = history?.stats || { total: 0, ongoing: 0, upcoming: 0, completed: 0 };
  const startup = profile.startup?.name || profile.startup_name;
  const leaderCount = items.filter((i) => i.team?.role_in_team === 'leader').length;

  const contacts = [
    { icon: Mail, label: 'Email', val: profile.email, href: profile.email && `mailto:${profile.email}` },
    isOwn && { icon: Phone, label: 'Telepon', val: profile.phone },
    { icon: AtSign, label: 'Instagram', val: profile.instagram, href: linkify(profile.instagram, 'https://instagram.com/') },
    { icon: Briefcase, label: 'LinkedIn', val: profile.linkedin, href: linkify(profile.linkedin, 'https://linkedin.com/in/') },
  ].filter(Boolean);

  const details = [
    { icon: IdCard, label: 'NIM', val: profile.nip_nim },
    { icon: GraduationCap, label: 'Program Studi', val: profile.program_studi },
    { icon: Building2, label: 'Startup', val: startup },
    { icon: CalendarDays, label: 'Bergabung', val: profile.created_at && formatDate(profile.created_at) },
  ];

  return (
    <div className="space-y-6 pb-12 animate-fade-in-up">
      {/* Cover + identity */}
      <section className="relative overflow-hidden rounded-[32px] bg-white dark:bg-[#131620]/90 border border-slate-200/80 dark:border-white/10 shadow-sm dark:shadow-xl">
        <div className="relative h-40 md:h-48 bg-gradient-to-br from-[#1E1B4B] via-[#2E1065] to-[#6C1B75] overflow-hidden">
          <div className="absolute -top-20 right-10 w-80 h-80 rounded-full bg-fuchsia-500/30 blur-3xl" />
          <div className="absolute -bottom-24 left-1/4 w-80 h-80 rounded-full bg-[#9333EA]/40 blur-3xl" />
          <div className="absolute inset-0 opacity-[0.08]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '22px 22px' }} />
        </div>
        <div className="px-6 md:px-10 pb-7">
          <div className="flex flex-col md:flex-row md:items-start gap-5">
            <div className="-mt-14 md:-mt-16 w-28 h-28 md:w-32 md:h-32 rounded-[32px] bg-gradient-to-br from-purple-600 to-indigo-700 flex items-center justify-center text-white text-4xl font-black ring-[6px] ring-white dark:ring-[#131620] shadow-xl shrink-0 relative z-10">
              {(profile.name || '?').split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0 md:pt-5">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight">{profile.name}</h1>
                {(profile.status || 'active') === 'active' && <BadgeCheck size={22} className="text-[#9333EA]" />}
              </div>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <Pill tone="purple" icon={GraduationCap}>{ROLE_LABELS[profile.role] || profile.role}</Pill>
                {startup && <Pill tone="blue" icon={Building2}>{startup}</Pill>}
                {stats.ongoing + stats.upcoming > 0 ? <Pill tone="emerald" icon={Trophy}>Aktif di {stats.ongoing + stats.upcoming} lomba</Pill> : <Pill tone="slate">Available untuk tim baru</Pill>}
              </div>
            </div>
            {isOwn && !editing && (
              <PrimaryButton onClick={startEdit} className="self-start md:mt-5"><Pencil size={16} /> Edit Profil</PrimaryButton>
            )}
          </div>
        </div>
      </section>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {[
          { label: 'Total Lomba', val: stats.total, icon: Trophy, tone: 'purple' },
          { label: 'Berlangsung', val: stats.ongoing, icon: PlayCircle, tone: 'blue' },
          { label: 'Jadi Ketua', val: leaderCount, icon: Crown, tone: 'amber' },
          { label: 'Selesai', val: stats.completed, icon: CheckCircle2, tone: 'emerald' },
        ].map((s) => (
          <div key={s.label} className="flex items-center gap-4 bg-white dark:bg-[#131620]/90 rounded-[24px] p-5 border border-slate-200/80 dark:border-white/10 shadow-sm dark:shadow-xl">
            <div className={cn('p-3 rounded-2xl border shrink-0', ICON_TONES[s.tone])}><s.icon size={22} /></div>
            <div>
              <p className="text-3xl font-black text-slate-900 dark:text-white leading-none">{s.val}</p>
              <p className="text-[13px] font-bold text-slate-500 dark:text-slate-400 mt-1">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[360px_minmax(0,1fr)] gap-6 items-start">
        {/* Left: details & contact */}
        <aside className="space-y-6 xl:sticky xl:top-28">
          <Panel className="p-6 md:p-6">
            <h3 className="font-black text-slate-900 dark:text-white mb-4">Data Diri</h3>
            <ul className="space-y-4">
              {details.map((d) => (
                <li key={d.label} className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 shrink-0"><d.icon size={17} /></div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{d.label}</p>
                    <p className={cn('text-[14px] font-bold truncate', d.val ? 'text-slate-800 dark:text-slate-100' : 'text-slate-400 italic font-medium')}>{d.val || 'Belum diisi'}</p>
                  </div>
                </li>
              ))}
            </ul>
          </Panel>
          <Panel className="p-6 md:p-6">
            <h3 className="font-black text-slate-900 dark:text-white mb-4">Kontak</h3>
            <ul className="space-y-2">
              {contacts.map((ct) => {
                const Inner = (
                  <>
                    <ct.icon size={17} className="text-slate-400 shrink-0" />
                    <span className={cn('flex-1 min-w-0 truncate text-[14px] font-semibold', ct.val ? 'text-slate-700 dark:text-slate-200' : 'text-slate-400 italic font-medium')}>{ct.val || `${ct.label} belum diisi`}</span>
                    {ct.href && ct.val && <ArrowUpRight size={15} className="text-slate-400 shrink-0" />}
                  </>
                );
                return (
                  <li key={ct.label}>
                    {ct.href && ct.val
                      ? <a href={ct.href} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">{Inner}</a>
                      : <div className="flex items-center gap-3 p-2.5">{Inner}</div>}
                  </li>
                );
              })}
            </ul>
          </Panel>
        </aside>

        {/* Right: tabs */}
        <div className="space-y-6 min-w-0">
          {!editing && (
            <FilterTabs
              value={tab}
              onChange={setTab}
              items={[
                { value: 'about', label: 'Tentang' },
                { value: 'history', label: 'Riwayat Lomba', count: items.length },
              ]}
            />
          )}

          {editing ? (
            <Panel>
              <PanelTitle icon={Pencil} title="Edit Profil" subtitle="Email, NIM, dan startup hanya bisa diubah oleh admin" />
              <form onSubmit={save} className="space-y-5">
                <div className="grid md:grid-cols-2 gap-5">
                  <div>
                    <FieldLabel>Nama Lengkap</FieldLabel>
                    <input className={inputClass} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                  </div>
                  <div>
                    <FieldLabel>Program Studi</FieldLabel>
                    <input className={inputClass} value={form.program_studi} onChange={(e) => setForm({ ...form, program_studi: e.target.value })} placeholder="Contoh: Teknik Informatika" />
                  </div>
                  <div>
                    <FieldLabel>Nomor Telepon</FieldLabel>
                    <input className={inputClass} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="08xx" />
                  </div>
                  <div>
                    <FieldLabel>Email</FieldLabel>
                    <input className={cn(inputClass, 'opacity-60 cursor-not-allowed')} value={profile.email || ''} disabled />
                  </div>
                  <div>
                    <FieldLabel hint="username atau URL">Instagram</FieldLabel>
                    <input className={inputClass} value={form.instagram} onChange={(e) => setForm({ ...form, instagram: e.target.value })} placeholder="@username" />
                  </div>
                  <div>
                    <FieldLabel hint="username atau URL">LinkedIn</FieldLabel>
                    <input className={inputClass} value={form.linkedin} onChange={(e) => setForm({ ...form, linkedin: e.target.value })} placeholder="linkedin.com/in/..." />
                  </div>
                </div>
                <div>
                  <FieldLabel hint={`${(form.bio || '').length}/300`}>Bio</FieldLabel>
                  <textarea rows={4} maxLength={300} className={cn(inputClass, 'resize-none')} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} placeholder="Ceritakan minat, keahlian, atau lomba yang ingin kamu ikuti..." />
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <GhostButton type="button" onClick={() => setEditing(false)} disabled={saving}><X size={16} /> Batal</GhostButton>
                  <PrimaryButton type="submit" disabled={saving}><Save size={16} /> {saving ? 'Menyimpan...' : 'Simpan'}</PrimaryButton>
                </div>
              </form>
            </Panel>
          ) : tab === 'about' ? (
            <Panel>
              <PanelTitle icon={UsersRound} title="Tentang" />
              {profile.bio ? (
                <p className="text-slate-600 dark:text-slate-300 font-medium leading-relaxed whitespace-pre-line">{profile.bio}</p>
              ) : (
                <div className="p-6 rounded-[22px] border-2 border-dashed border-slate-200 dark:border-white/10 text-center">
                  <p className="font-bold text-slate-700 dark:text-slate-200">Belum ada bio</p>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">{isOwn ? 'Tulis bio singkat supaya teman lebih mudah mengajakmu satu tim.' : 'Pengguna ini belum menulis bio.'}</p>
                  {isOwn && <button onClick={startEdit} className="mt-4 text-sm font-bold text-purple-700 dark:text-purple-300 hover:underline underline-offset-4">Tulis bio sekarang</button>}
                </div>
              )}

              {items.length > 0 && (
                <div className="mt-8">
                  <p className="text-[12px] font-bold uppercase tracking-wider text-slate-400 mb-3">Lomba terbaru</p>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {items.slice(0, 4).map((it) => (
                      <Link key={`${it.competition?.id}-${it.team?.id || 's'}`} to={`/mahasiswa/competitions/${it.competition?.id}`} className="flex items-center gap-3 p-4 rounded-2xl border border-slate-200/70 dark:border-white/5 bg-slate-50/70 dark:bg-slate-900/40 hover:border-purple-500/30 transition-colors">
                        <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 shrink-0"><Trophy size={17} /></div>
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-[14px] text-slate-900 dark:text-white truncate">{it.competition?.name}</p>
                          <p className="text-[12px] font-medium text-slate-500 dark:text-slate-400 truncate">{it.team?.name || 'Menunggu tim'}</p>
                        </div>
                        <StatusPill status={it.competition?.status} />
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </Panel>
          ) : (
            <Panel>
              <PanelTitle icon={CalendarClock} tone="amber" title="Riwayat Lomba" subtitle={`${items.length} lomba tercatat`} />
              {items.length === 0 ? (
                <EmptyBlock icon={Trophy} title="Belum ada riwayat" description={isOwn ? 'Riwayat lombamu akan tampil di sini.' : 'Pengguna ini belum mengikuti lomba.'} />
              ) : (
                <ol className="relative border-l-2 border-slate-200 dark:border-white/10 ml-3 space-y-5">
                  {items.map((it) => {
                    const role = it.team?.role_in_team;
                    return (
                      <li key={`${it.competition?.id}-${it.team?.id || 's'}`} className="pl-6 relative">
                        <span className={cn('absolute -left-[9px] top-2 w-4 h-4 rounded-full ring-4 ring-white dark:ring-[#131620]', it.competition?.status === 'ongoing' ? 'bg-blue-500' : it.competition?.status === 'upcoming' ? 'bg-amber-500' : 'bg-emerald-500')} />
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <Link to={`/mahasiswa/competitions/${it.competition?.id}`} className="font-black text-slate-900 dark:text-white hover:text-purple-700 dark:hover:text-purple-300">{it.competition?.name}</Link>
                          <StatusPill status={it.competition?.status} />
                        </div>
                        <p className="text-[13px] font-medium text-slate-500 dark:text-slate-400">{formatDate(it.competition?.event_date)}</p>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {it.team ? <Pill tone="slate" icon={UsersRound}>{it.team.name}</Pill> : <Pill tone="amber" icon={Hourglass}>Menunggu tim</Pill>}
                          {role === 'leader' && <Pill tone="amber" icon={Crown}>Ketua</Pill>}
                          {it.advisors?.[0] && <Pill tone="emerald" icon={UserCheck}>{it.advisors[0].name}</Pill>}
                        </div>
                      </li>
                    );
                  })}
                </ol>
              )}
            </Panel>
          )}
        </div>
      </div>
    </div>
  );
}
