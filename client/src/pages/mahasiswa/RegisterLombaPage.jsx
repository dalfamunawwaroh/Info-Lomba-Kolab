import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, UsersRound, UserRound, Crown, X, Search, Check, ArrowRight, PartyPopper, Calendar, Clock,
  Hourglass, Award, Building2, ChevronRight, Sparkles, ShieldCheck, Lightbulb, UserCheck, ListChecks, Pencil,
} from 'lucide-react';
import { differenceInCalendarDays, parseISO } from 'date-fns';
import competitionService from '@/services/competitionService';
import userService from '@/services/userService';
import useUIStore from '@/store/uiStore';
import { useAuth } from '@/hooks/useAuth';
import { formatDate } from '@/utils/helpers';
import { cn } from '@/lib/utils';
import { Panel, Avatar, FieldLabel, inputClass, PrimaryButton, GhostButton, EmptyBlock } from '@/components/user/UserUI';

const OPTIONS = [
  {
    value: true,
    icon: UsersRound,
    title: 'Sudah Punya Tim',
    desc: 'Kamu otomatis menjadi ketua dan bisa langsung menyusun anggota.',
    points: ['Pilih anggota dari mahasiswa terdaftar', 'Tim langsung tercatat di lomba', 'Bisa langsung ajukan dosen pembimbing'],
    gradient: 'from-[#9333EA] to-[#6C1B75]',
    ring: 'border-[#9333EA] shadow-purple-900/15',
    badge: 'Paling cepat',
  },
  {
    value: false,
    icon: UserRound,
    title: 'Belum Punya Tim',
    desc: 'Daftar sendiri dulu, admin akan mencarikan tim yang sesuai untukmu.',
    points: ['Cukup satu klik untuk mendaftar', 'Admin menempatkanmu ke tim yang cocok', 'Pantau statusnya di halaman Tim Saya'],
    gradient: 'from-amber-400 to-orange-500',
    ring: 'border-amber-500 shadow-amber-900/15',
  },
];

export default function RegisterLombaPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [competition, setCompetition] = useState(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(1);
  const [hasTeam, setHasTeam] = useState(null);
  const [teamName, setTeamName] = useState('');
  const [members, setMembers] = useState([]);
  const [users, setUsers] = useState([]);
  const [query, setQuery] = useState('');
  const [agree, setAgree] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(null);
  const addToast = useUIStore((s) => s.addToast);
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([
      competitionService.getCompetitionById(id),
      userService.getUsers({ role: 'mahasiswa', status: 'active', limit: 200 }),
    ]).then(([compRes, usersRes]) => {
      setCompetition(compRes.data);
      setUsers((usersRes.data || []).filter((u) => u.id !== user.id));
    }).catch(() => addToast({ type: 'error', message: 'Gagal memuat data' }))
      .finally(() => setLoading(false));
  }, [id, user.id, addToast]);

  const maxMembers = Number(competition?.max_team_members) || 10;
  const slotsLeft = maxMembers - 1 - members.length;

  // Mahasiswa yang sudah ada di tim lomba ini tidak bisa dipilih
  const takenIds = useMemo(() => {
    const s = new Set();
    (competition?.teams || []).forEach((t) => (t.members || []).forEach((m) => s.add(m.user_id)));
    return s;
  }, [competition]);

  const candidates = users.filter((u) =>
    !members.some((m) => m.id === u.id) &&
    (!query || u.name.toLowerCase().includes(query.toLowerCase()) || (u.startup_name || '').toLowerCase().includes(query.toLowerCase()))
  );

  const addMember = (u) => {
    if (takenIds.has(u.id)) return;
    if (slotsLeft <= 0) {
      setError(`Tim sudah penuh. Maksimal ${maxMembers} anggota.`);
      return;
    }
    setError('');
    setMembers([...members, u]);
  };
  const removeMember = (mid) => setMembers(members.filter((x) => x.id !== mid));

  const goNext = () => {
    if (step === 1 && hasTeam === null) return setError('Pilih salah satu cara mendaftar');
    if (step === 2 && hasTeam) {
      if (!teamName.trim()) return setError('Nama tim wajib diisi');
      if (members.length < 1) return setError('Tambahkan minimal 1 anggota selain kamu');
    }
    setError('');
    setStep(step + 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const goBack = () => {
    setError('');
    if (step > 1) setStep(step - 1);
    else navigate(-1);
  };

  const submit = async () => {
    setSubmitting(true);
    try {
      const payload = hasTeam
        ? { has_team: true, team_name: teamName.trim(), member_ids: members.map((m) => m.id) }
        : { has_team: false };
      const res = await competitionService.registerToCompetition(id, payload);
      setDone({ hasTeam, data: res.data });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      addToast({ type: 'error', message: err.response?.data?.message || 'Gagal mendaftar' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-72 rounded-[32px] bg-slate-200/70 dark:bg-white/5 animate-pulse" />
        <div className="grid xl:grid-cols-[minmax(0,1fr)_380px] gap-6">
          <div className="h-96 rounded-[28px] bg-slate-200/70 dark:bg-white/5 animate-pulse" />
          <div className="h-96 rounded-[28px] bg-slate-200/70 dark:bg-white/5 animate-pulse" />
        </div>
      </div>
    );
  }
  if (!competition) return <Panel><EmptyBlock icon={UsersRound} title="Lomba tidak ditemukan" /></Panel>;

  const title = competition.title || competition.name;
  let daysLeft = null;
  try { daysLeft = competition.registration_deadline ? differenceInCalendarDays(parseISO(competition.registration_deadline), new Date()) : null; } catch { daysLeft = null; }

  const steps = [
    { label: 'Pilih Cara', hint: 'Dengan atau tanpa tim' },
    { label: hasTeam === false ? 'Daftar Solo' : 'Susun Tim', hint: hasTeam === false ? 'Masuk daftar tunggu' : 'Nama & anggota' },
    { label: 'Konfirmasi', hint: 'Periksa & kirim' },
  ];
  const visibleSteps = hasTeam === false ? steps.slice(0, 2) : steps;

  /* ------------------------------------------------------------------ */
  /* Success screen                                                       */
  /* ------------------------------------------------------------------ */
  if (done) {
    const teamLink = done.hasTeam && done.data?.id ? `/mahasiswa/my-teams?team=${done.data.id}` : '/mahasiswa/my-teams';
    const nextSteps = done.hasTeam
      ? [
        { icon: UserCheck, title: 'Ajukan dosen pembimbing', desc: 'Pilih dosen yang sesuai bidang lomba dari halaman Tim Saya.' },
        { icon: UsersRound, title: 'Lengkapi anggota', desc: `Masih bisa menambah anggota hingga ${maxMembers} orang.` },
        { icon: ListChecks, title: 'Siapkan persyaratan', desc: 'Cek kembali dokumen yang diminta penyelenggara.' },
      ]
      : [
        { icon: Hourglass, title: 'Tunggu penempatan', desc: 'Admin akan membentuk tim dari pendaftar solo.' },
        { icon: UsersRound, title: 'Cek Tim Saya', desc: 'Timmu akan muncul di sana setelah ditempatkan.' },
        { icon: ListChecks, title: 'Siapkan persyaratan', desc: 'Sambil menunggu, siapkan dokumen lomba.' },
      ];
    return (
      <div className="space-y-6 pb-12 animate-fade-in-up">
        <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-emerald-500 via-teal-600 to-[#1E1B4B] p-8 md:p-14 text-white shadow-2xl">
          <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-32 left-1/3 w-96 h-96 rounded-full bg-emerald-300/20 blur-3xl" />
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center gap-8">
            <div className="w-24 h-24 rounded-[28px] bg-white/20 backdrop-blur flex items-center justify-center shrink-0 shadow-xl">
              {done.hasTeam ? <PartyPopper size={46} /> : <Hourglass size={46} />}
            </div>
            <div className="flex-1">
              <p className="text-[12px] font-bold uppercase tracking-[0.16em] text-emerald-100 mb-2">Pendaftaran berhasil</p>
              <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-tight">
                {done.hasTeam ? <>Tim {teamName} resmi terdaftar!</> : 'Kamu sudah masuk daftar tunggu'}
              </h1>
              <p className="text-emerald-50/90 text-lg font-medium mt-3 max-w-2xl">{title}</p>
            </div>
            <div className="flex flex-col sm:flex-row lg:flex-col gap-3 shrink-0">
              <Link to={teamLink} className="inline-flex items-center justify-center gap-2 bg-white text-emerald-700 px-7 py-4 rounded-2xl font-bold hover:scale-[1.03] transition-transform shadow-xl">
                Buka Tim Saya <ArrowRight size={18} />
              </Link>
              <Link to="/mahasiswa" className="inline-flex items-center justify-center px-7 py-4 rounded-2xl font-bold bg-white/15 hover:bg-white/25 backdrop-blur transition-colors">Ke Dashboard</Link>
            </div>
          </div>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {nextSteps.map((s, i) => (
            <Panel key={s.title} className="p-6 md:p-7">
              <div className="flex items-center gap-3 mb-4">
                <span className="w-8 h-8 rounded-full bg-gradient-to-br from-[#9333EA] to-[#6C1B75] text-white flex items-center justify-center text-sm font-black">{i + 1}</span>
                <s.icon size={20} className="text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="font-black text-lg text-slate-900 dark:text-white">{s.title}</h3>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">{s.desc}</p>
            </Panel>
          ))}
        </div>
      </div>
    );
  }

  /* ------------------------------------------------------------------ */
  /* Wizard                                                               */
  /* ------------------------------------------------------------------ */
  return (
    <div className="space-y-6 pb-12 animate-fade-in-up">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm font-semibold text-slate-500 dark:text-slate-400 min-w-0">
        <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 px-3 py-2 -ml-3 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 hover:text-purple-700 dark:hover:text-purple-300 transition-colors">
          <ArrowLeft size={17} /> Kembali
        </button>
        <span className="text-slate-300 dark:text-slate-600">/</span>
        <Link to="/mahasiswa/competitions" className="hover:text-purple-700 dark:hover:text-purple-300 hidden sm:inline">Daftar Lomba</Link>
        <ChevronRight size={14} className="hidden sm:block text-slate-300 dark:text-slate-600" />
        <Link to={`/mahasiswa/competitions/${id}`} className="hover:text-purple-700 dark:hover:text-purple-300 truncate max-w-[40ch]">{title}</Link>
        <ChevronRight size={14} className="text-slate-300 dark:text-slate-600 shrink-0" />
        <span className="text-slate-800 dark:text-white shrink-0">Pendaftaran</span>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden rounded-[32px] bg-[#140A2E] text-white shadow-2xl">
        {competition.image_url && (
          <img src={competition.image_url} alt="" className="absolute inset-0 w-full h-full object-cover opacity-30" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-[#1E1B4B] via-[#2E1065]/95 to-[#3B0764]/80" />
        <div className="absolute -top-1/2 right-0 w-[50%] h-[200%] bg-gradient-to-b from-[#9333EA]/30 to-transparent blur-3xl rotate-12 pointer-events-none" />

        <div className="relative z-10 p-7 md:p-10">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur text-[12px] font-bold"><Sparkles size={13} /> Pendaftaran Lomba</span>
                {competition.category && <span className="px-3 py-1 rounded-full bg-white/10 backdrop-blur text-[12px] font-bold">{competition.category}</span>}
              </div>
              <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-[1.1]">{title}</h1>
              <div className="flex flex-wrap gap-x-6 gap-y-2 mt-5 text-[14px] font-semibold text-purple-100/90">
                {competition.organizer && <span className="flex items-center gap-2"><Building2 size={16} className="text-purple-300" /> {competition.organizer}</span>}
                <span className="flex items-center gap-2"><Calendar size={16} className="text-purple-300" /> {formatDate(competition.event_date)}</span>
                <span className="flex items-center gap-2"><UsersRound size={16} className="text-purple-300" /> Maks {maxMembers} orang / tim</span>
                {competition.prize_pool && <span className="flex items-center gap-2"><Award size={16} className="text-amber-300" /> {competition.prize_pool}</span>}
              </div>
            </div>

            {daysLeft !== null && daysLeft >= 0 && (
              <div className="shrink-0 flex items-center gap-4 bg-white/10 backdrop-blur-md border border-white/15 rounded-[24px] px-6 py-5">
                <div className="w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center"><Clock size={22} /></div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-purple-200">Pendaftaran ditutup</p>
                  <p className="text-2xl font-black leading-tight">{daysLeft === 0 ? 'Hari ini' : `${daysLeft} hari lagi`}</p>
                  <p className="text-[12px] font-medium text-purple-200">{formatDate(competition.registration_deadline)}</p>
                </div>
              </div>
            )}
          </div>

          {/* Stepper */}
          <ol className={cn('grid gap-3 mt-9', visibleSteps.length === 3 ? 'grid-cols-3' : 'grid-cols-2')}>
            {visibleSteps.map((s, i) => {
              const n = i + 1;
              const state = n < step ? 'done' : n === step ? 'now' : 'next';
              return (
                <li key={s.label} className={cn(
                  'relative flex items-center gap-3 rounded-2xl px-4 py-3.5 border transition-all',
                  state === 'now' && 'bg-white text-purple-950 border-white shadow-xl',
                  state === 'done' && 'bg-emerald-400/15 border-emerald-300/30',
                  state === 'next' && 'bg-white/5 border-white/10 text-white/60',
                )}>
                  <span className={cn(
                    'w-9 h-9 rounded-full flex items-center justify-center font-black text-sm shrink-0',
                    state === 'now' && 'bg-gradient-to-br from-[#9333EA] to-[#6C1B75] text-white',
                    state === 'done' && 'bg-emerald-400 text-emerald-950',
                    state === 'next' && 'bg-white/10',
                  )}>
                    {state === 'done' ? <Check size={16} strokeWidth={3} /> : n}
                  </span>
                  <div className="min-w-0 hidden sm:block">
                    <p className="font-black text-[14px] truncate">{s.label}</p>
                    <p className={cn('text-[12px] font-medium truncate', state === 'now' ? 'text-slate-500' : 'opacity-70')}>{s.hint}</p>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      </section>

      {/* Body */}
      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_380px] gap-6 items-start">
        <div className="space-y-6 min-w-0">
          {/* STEP 1 */}
          {step === 1 && (
            <Panel>
              <div className="mb-7">
                <h2 className="text-2xl md:text-[28px] font-black text-slate-900 dark:text-white tracking-tight">Bagaimana kamu ingin mendaftar?</h2>
                <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">Pilih yang paling sesuai. Kamu masih bisa mengubahnya sebelum mengirim.</p>
              </div>
              <div className="grid md:grid-cols-2 gap-5">
                {OPTIONS.map((o) => {
                  const chosen = hasTeam === o.value;
                  return (
                    <button
                      key={String(o.value)}
                      type="button"
                      onClick={() => { setHasTeam(o.value); setError(''); }}
                      className={cn(
                        'relative text-left p-7 rounded-[26px] border-2 transition-all duration-300 group',
                        chosen
                          ? `${o.ring} bg-slate-50 dark:bg-white/[0.04] shadow-xl -translate-y-1`
                          : 'border-slate-200 dark:border-white/10 hover:border-purple-400/50 hover:-translate-y-1 hover:shadow-lg'
                      )}
                    >
                      <span className={cn(
                        'absolute top-6 right-6 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all',
                        chosen ? 'border-transparent bg-gradient-to-br ' + o.gradient : 'border-slate-300 dark:border-slate-600'
                      )}>
                        {chosen && <Check size={14} strokeWidth={3} className="text-white" />}
                      </span>
                      <div className={`w-16 h-16 rounded-[20px] bg-gradient-to-br ${o.gradient} text-white flex items-center justify-center mb-6 shadow-lg group-hover:scale-105 transition-transform`}>
                        <o.icon size={30} />
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-xl font-black text-slate-900 dark:text-white">{o.title}</h3>
                        {o.badge && <span className="px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-700 dark:text-purple-300 text-[11px] font-bold">{o.badge}</span>}
                      </div>
                      <p className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed mb-5">{o.desc}</p>
                      <ul className="space-y-2.5">
                        {o.points.map((p) => (
                          <li key={p} className="flex items-start gap-2.5 text-[14px] font-semibold text-slate-700 dark:text-slate-300">
                            <span className="mt-0.5 w-5 h-5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0"><Check size={12} strokeWidth={3} /></span>
                            {p}
                          </li>
                        ))}
                      </ul>
                    </button>
                  );
                })}
              </div>
            </Panel>
          )}

          {/* STEP 2 — with team */}
          {step === 2 && hasTeam && (
            <Panel>
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-7">
                <div>
                  <h2 className="text-2xl md:text-[28px] font-black text-slate-900 dark:text-white tracking-tight">Susun timmu</h2>
                  <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">Beri nama tim, lalu tambahkan anggota dari mahasiswa yang terdaftar.</p>
                </div>
                <span className={cn('self-start md:self-auto px-4 py-2 rounded-full text-sm font-bold', slotsLeft > 0 ? 'bg-purple-500/10 text-purple-700 dark:text-purple-300' : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300')}>
                  {slotsLeft > 0 ? `${slotsLeft} slot tersisa` : 'Tim sudah penuh'}
                </span>
              </div>

              <div className="max-w-xl">
                <FieldLabel>Nama Tim</FieldLabel>
                <input value={teamName} onChange={(e) => setTeamName(e.target.value)} className={inputClass} placeholder="Contoh: Team Alpha" autoFocus />
              </div>

              <div className="mt-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
                  <FieldLabel>Pilih Anggota</FieldLabel>
                  <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-900/80 px-4 py-3 rounded-2xl border border-slate-200 dark:border-white/10 focus-within:ring-4 focus-within:ring-[#9333EA]/20 focus-within:border-[#9333EA]/50 md:w-80">
                    <Search size={17} className="text-slate-400" />
                    <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Cari nama atau startup..." className="bg-transparent outline-none w-full text-[14px] font-medium text-slate-800 dark:text-white" />
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 2xl:grid-cols-3 gap-3 max-h-[440px] overflow-y-auto custom-scrollbar pr-1">
                  {candidates.map((u) => {
                    const taken = takenIds.has(u.id);
                    return (
                      <button
                        key={u.id}
                        type="button"
                        disabled={taken || slotsLeft <= 0}
                        onClick={() => addMember(u)}
                        className="group flex items-center gap-3 p-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/40 hover:border-purple-500/50 hover:bg-purple-500/5 text-left transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:border-slate-200 dark:disabled:hover:border-white/10"
                      >
                        <Avatar name={u.name} />
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-[14px] text-slate-900 dark:text-white truncate">{u.name}</p>
                          <p className="text-[12px] font-medium text-slate-500 dark:text-slate-400 truncate">{taken ? 'Sudah terdaftar di tim lain' : u.startup_name || 'Mahasiswa'}</p>
                        </div>
                        {!taken && (
                          <span className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-700 dark:text-purple-300 flex items-center justify-center group-hover:bg-[#9333EA] group-hover:text-white transition-colors shrink-0">
                            <UsersRound size={16} />
                          </span>
                        )}
                      </button>
                    );
                  })}
                  {candidates.length === 0 && <p className="col-span-full text-sm text-slate-500 text-center py-10">Tidak ada mahasiswa yang cocok.</p>}
                </div>
              </div>
            </Panel>
          )}

          {/* STEP 2 — solo */}
          {step === 2 && hasTeam === false && (
            <Panel>
              <div className="flex flex-col md:flex-row gap-6 md:items-center mb-8">
                <div className="w-20 h-20 rounded-[24px] bg-gradient-to-br from-amber-400 to-orange-500 text-white flex items-center justify-center shrink-0 shadow-lg"><Hourglass size={36} /></div>
                <div>
                  <h2 className="text-2xl md:text-[28px] font-black text-slate-900 dark:text-white tracking-tight">Daftar tanpa tim</h2>
                  <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">Kamu akan masuk daftar tunggu. Begini prosesnya:</p>
                </div>
              </div>
              <div className="grid md:grid-cols-3 gap-4">
                {[
                  { t: 'Kamu mendaftar', d: 'Namamu tercatat sebagai pendaftar solo di lomba ini.' },
                  { t: 'Admin membentuk tim', d: 'Admin menggabungkan pendaftar solo menjadi tim yang seimbang.' },
                  { t: 'Tim muncul di akunmu', d: 'Cek halaman Tim Saya untuk melihat tim dan anggotanya.' },
                ].map((s, i) => (
                  <div key={s.t} className="p-5 rounded-[22px] bg-slate-50 dark:bg-slate-900/50 border border-slate-200/70 dark:border-white/5">
                    <span className="inline-flex w-8 h-8 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-400 items-center justify-center text-sm font-black mb-3">{i + 1}</span>
                    <p className="font-black text-slate-900 dark:text-white">{s.t}</p>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">{s.d}</p>
                  </div>
                ))}
              </div>
            </Panel>
          )}

          {/* STEP 3 — confirm */}
          {step === 3 && hasTeam && (
            <Panel>
              <h2 className="text-2xl md:text-[28px] font-black text-slate-900 dark:text-white tracking-tight">Periksa sekali lagi</h2>
              <p className="text-slate-500 dark:text-slate-400 font-medium mt-1 mb-7">Pastikan data tim sudah benar sebelum dikirim.</p>

              <div className="grid md:grid-cols-2 gap-4 mb-6">
                <div className="p-5 rounded-[22px] bg-slate-50 dark:bg-slate-900/50 border border-slate-200/70 dark:border-white/5">
                  <p className="text-[12px] font-bold uppercase tracking-wider text-slate-400 mb-1">Lomba</p>
                  <p className="font-black text-slate-900 dark:text-white">{title}</p>
                </div>
                <div className="p-5 rounded-[22px] bg-slate-50 dark:bg-slate-900/50 border border-slate-200/70 dark:border-white/5 flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[12px] font-bold uppercase tracking-wider text-slate-400 mb-1">Nama Tim</p>
                    <p className="font-black text-slate-900 dark:text-white">{teamName}</p>
                  </div>
                  <button onClick={() => setStep(2)} className="p-2 rounded-xl text-slate-400 hover:text-purple-700 dark:hover:text-purple-300 hover:bg-purple-500/10" title="Ubah"><Pencil size={16} /></button>
                </div>
              </div>

              <p className="text-[12px] font-bold uppercase tracking-wider text-slate-400 mb-3">Anggota ({members.length + 1})</p>
              <div className="grid sm:grid-cols-2 2xl:grid-cols-3 gap-3">
                {[{ id: user.id, name: user.name, startup_name: user.startup_name, lead: true }, ...members].map((m) => (
                  <div key={m.id} className={cn('flex items-center gap-3 p-4 rounded-2xl border', m.lead ? 'bg-amber-500/5 border-amber-500/25' : 'bg-white dark:bg-slate-900/40 border-slate-200 dark:border-white/10')}>
                    <Avatar name={m.name} />
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-[14px] text-slate-900 dark:text-white truncate">{m.name}</p>
                      <p className="text-[12px] font-medium text-slate-500 dark:text-slate-400 truncate">{m.lead ? 'Ketua tim (kamu)' : m.startup_name || 'Anggota'}</p>
                    </div>
                    {m.lead && <Crown size={17} className="text-amber-500 shrink-0" />}
                  </div>
                ))}
              </div>

              <label className="flex items-start gap-3 mt-7 p-4 rounded-2xl bg-purple-500/5 border border-purple-500/20 cursor-pointer">
                <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-0.5 w-5 h-5 accent-[#9333EA]" />
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Saya memastikan anggota yang dipilih sudah setuju bergabung dan data tim sudah benar.</span>
              </label>
            </Panel>
          )}

          {/* Action bar */}
          <div className="flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-3 bg-white/80 dark:bg-[#131620]/80 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 rounded-[24px] p-4 md:p-5 shadow-sm">
            <GhostButton onClick={goBack}><ArrowLeft size={17} /> {step > 1 ? 'Sebelumnya' : 'Batal'}</GhostButton>
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              {error && <p className="text-sm font-bold text-rose-600 dark:text-rose-400 sm:text-right">{error}</p>}
              {(step === 1 || (step === 2 && hasTeam)) && (
                <PrimaryButton onClick={goNext} disabled={step === 1 && hasTeam === null}>Lanjut <ArrowRight size={18} /></PrimaryButton>
              )}
              {step === 2 && hasTeam === false && (
                <PrimaryButton onClick={submit} disabled={submitting}>{submitting ? 'Mendaftar...' : <>Daftar Sekarang <ArrowRight size={18} /></>}</PrimaryButton>
              )}
              {step === 3 && hasTeam && (
                <PrimaryButton onClick={submit} disabled={submitting || !agree}>{submitting ? 'Mengirim...' : <>Kirim Pendaftaran <ArrowRight size={18} /></>}</PrimaryButton>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar summary */}
        <aside className="space-y-6 xl:sticky xl:top-28">
          <Panel className="p-6 md:p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-black text-lg text-slate-900 dark:text-white">Ringkasan</h3>
              <span className="text-[12px] font-bold text-slate-400">Langkah {step}/{visibleSteps.length}</span>
            </div>

            <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/70 dark:border-white/5 mb-4">
              <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 bg-gradient-to-br', hasTeam === false ? 'from-amber-400 to-orange-500' : 'from-[#9333EA] to-[#6C1B75]')}>
                {hasTeam === false ? <UserRound size={18} /> : <UsersRound size={18} />}
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Cara mendaftar</p>
                <p className="font-bold text-[14px] text-slate-900 dark:text-white truncate">{hasTeam === null ? 'Belum dipilih' : hasTeam ? 'Dengan tim' : 'Solo (tanpa tim)'}</p>
              </div>
            </div>

            {hasTeam && (
              <>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[13px] font-bold text-slate-700 dark:text-slate-300 truncate">{teamName.trim() || 'Nama tim belum diisi'}</p>
                  <span className="text-[13px] font-bold text-slate-500">{members.length + 1}/{maxMembers}</span>
                </div>
                <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden mb-4">
                  <div className="h-full bg-gradient-to-r from-[#9333EA] to-fuchsia-500 transition-all duration-500" style={{ width: `${Math.min(100, ((members.length + 1) / maxMembers) * 100)}%` }} />
                </div>
                <ul className="space-y-2">
                  <li className="flex items-center gap-3 p-2.5 rounded-xl bg-amber-500/5 border border-amber-500/20">
                    <Avatar name={user.name} size="sm" />
                    <p className="flex-1 font-bold text-[13px] text-slate-900 dark:text-white truncate">{user.name} <span className="text-slate-400 font-medium">(kamu)</span></p>
                    <Crown size={15} className="text-amber-500" />
                  </li>
                  {members.map((m) => (
                    <li key={m.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-white/5 animate-scale-in">
                      <Avatar name={m.name} size="sm" />
                      <p className="flex-1 font-bold text-[13px] text-slate-900 dark:text-white truncate">{m.name}</p>
                      {step === 2 && (
                        <button onClick={() => removeMember(m.id)} className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-500/10" title="Hapus"><X size={15} /></button>
                      )}
                    </li>
                  ))}
                  {Array.from({ length: Math.max(0, slotsLeft) }).slice(0, 3).map((_, i) => (
                    <li key={`slot-${i}`} className="flex items-center gap-3 p-2.5 rounded-xl border-2 border-dashed border-slate-200 dark:border-white/10">
                      <span className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800" />
                      <p className="text-[13px] font-medium text-slate-400">Slot kosong</p>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </Panel>

          <div className="rounded-[28px] p-6 bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-fuchsia-500/10 border border-purple-500/20">
            <div className="flex items-center gap-2 mb-3 text-purple-700 dark:text-purple-300">
              <Lightbulb size={18} />
              <p className="font-black text-[15px]">Tips</p>
            </div>
            <ul className="space-y-2.5 text-[13px] font-medium text-slate-600 dark:text-slate-300">
              <li className="flex gap-2"><ShieldCheck size={15} className="text-emerald-500 shrink-0 mt-0.5" /> Satu mahasiswa hanya bisa terdaftar di satu tim per lomba.</li>
              <li className="flex gap-2"><ShieldCheck size={15} className="text-emerald-500 shrink-0 mt-0.5" /> Pilih anggota dengan keahlian yang saling melengkapi.</li>
              {competition.needs_advisor && <li className="flex gap-2"><ShieldCheck size={15} className="text-emerald-500 shrink-0 mt-0.5" /> Lomba ini wajib dosen pembimbing — ajukan setelah tim terbentuk.</li>}
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
