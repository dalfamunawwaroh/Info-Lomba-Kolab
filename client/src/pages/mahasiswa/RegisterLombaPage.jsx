import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, UsersRound, UserRound, Crown, X, Search, Check, ArrowRight, PartyPopper, Calendar, Clock, Hourglass,
} from 'lucide-react';
import competitionService from '@/services/competitionService';
import userService from '@/services/userService';
import useUIStore from '@/store/uiStore';
import { useAuth } from '@/hooks/useAuth';
import { formatDate } from '@/utils/helpers';
import { Panel, Avatar, FieldLabel, inputClass, PrimaryButton, GhostButton, EmptyBlock } from '@/components/user/UserUI';

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

  const toggle = (u) => {
    if (takenIds.has(u.id)) return;
    if (slotsLeft <= 0) {
      setError(`Tim sudah penuh. Maksimal ${maxMembers} anggota.`);
      return;
    }
    setError('');
    setMembers([...members, u]);
  };

  const next = () => {
    if (step === 2 && hasTeam) {
      if (!teamName.trim()) return setError('Nama tim wajib diisi');
      if (members.length < 1) return setError('Tambahkan minimal 1 anggota selain kamu');
    }
    setError('');
    setStep(step + 1);
  };

  const submit = async () => {
    setSubmitting(true);
    try {
      const payload = hasTeam
        ? { has_team: true, team_name: teamName.trim(), member_ids: members.map((m) => m.id) }
        : { has_team: false };
      const res = await competitionService.registerToCompetition(id, payload);
      setDone({ hasTeam, data: res.data });
    } catch (err) {
      addToast({ type: 'error', message: err.response?.data?.message || 'Gagal mendaftar' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="h-96 rounded-[32px] bg-slate-200/70 dark:bg-white/5 animate-pulse" />;
  if (!competition) return <Panel><EmptyBlock icon={UsersRound} title="Lomba tidak ditemukan" /></Panel>;

  const title = competition.title || competition.name;

  if (done) {
    return (
      <div className="max-w-2xl mx-auto pt-6 animate-scale-in">
        <Panel className="text-center p-10 md:p-12">
          <div className="w-24 h-24 mx-auto rounded-[28px] bg-gradient-to-br from-emerald-400 to-teal-600 text-white flex items-center justify-center mb-6 shadow-xl shadow-emerald-900/30">
            {done.hasTeam ? <PartyPopper size={44} /> : <Hourglass size={44} />}
          </div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight mb-3">
            {done.hasTeam ? 'Berhasil mendaftar!' : 'Kamu sudah terdaftar'}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium mb-8">
            {done.hasTeam
              ? <>Tim <b className="text-slate-800 dark:text-white">{teamName}</b> terdaftar di {title}. Langkah berikutnya: ajukan dosen pembimbing.</>
              : 'Tim akan disesuaikan oleh admin. Pantau statusnya di halaman Tim Saya.'}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to={done.hasTeam && done.data?.id ? `/mahasiswa/my-teams?team=${done.data.id}` : '/mahasiswa/my-teams'} className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-[#9333EA] to-[#6C1B75] text-white px-6 py-3.5 rounded-2xl font-bold shadow-lg shadow-purple-900/25">
              Buka Tim Saya <ArrowRight size={18} />
            </Link>
            <Link to="/mahasiswa" className="inline-flex items-center justify-center px-6 py-3.5 rounded-2xl font-bold border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200">Ke Dashboard</Link>
          </div>
        </Panel>
      </div>
    );
  }

  const steps = ['Pilih Cara', hasTeam === false ? 'Konfirmasi Solo' : 'Susun Tim', 'Konfirmasi'];

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12 animate-fade-in-up">
      <button onClick={() => (step > 1 ? setStep(step - 1) : navigate(-1))} className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 dark:text-slate-400 hover:text-purple-700 dark:hover:text-purple-300">
        <ArrowLeft size={18} /> {step > 1 ? 'Langkah sebelumnya' : 'Kembali'}
      </button>

      {/* Header + stepper */}
      <div className="bg-gradient-to-br from-[#1E1B4B] via-[#2E1065] to-[#3B0764] rounded-[32px] p-7 md:p-9 text-white relative overflow-hidden shadow-2xl">
        <div className="absolute -top-1/2 -right-[10%] w-[70%] h-[160%] bg-gradient-to-b from-[#9333EA]/30 to-transparent blur-3xl rounded-full rotate-12 pointer-events-none" />
        <div className="relative z-10">
          <p className="text-[12px] font-bold uppercase tracking-[0.14em] text-purple-300 mb-2">Pendaftaran Lomba</p>
          <h1 className="text-2xl md:text-4xl font-black tracking-tight">{title}</h1>
          <div className="flex flex-wrap gap-4 mt-3 text-sm font-semibold text-purple-200">
            <span className="flex items-center gap-1.5"><Calendar size={15} /> {formatDate(competition.event_date)}</span>
            <span className="flex items-center gap-1.5"><Clock size={15} /> Tutup {formatDate(competition.registration_deadline)}</span>
            <span className="flex items-center gap-1.5"><UsersRound size={15} /> Maks {maxMembers} orang</span>
          </div>
          <ol className="flex items-center gap-2 md:gap-4 mt-8">
            {steps.map((s, i) => {
              const n = i + 1;
              const state = n < step ? 'done' : n === step ? 'now' : 'next';
              return (
                <li key={s} className="flex items-center gap-2 md:gap-3 flex-1 last:flex-none">
                  <span className={`w-9 h-9 rounded-full flex items-center justify-center font-black text-sm shrink-0 ${state === 'done' ? 'bg-emerald-400 text-emerald-950' : state === 'now' ? 'bg-white text-purple-900' : 'bg-white/15 text-white/60'}`}>
                    {state === 'done' ? <Check size={16} strokeWidth={3} /> : n}
                  </span>
                  <span className={`hidden sm:block text-sm font-bold whitespace-nowrap ${state === 'next' ? 'text-white/50' : 'text-white'}`}>{s}</span>
                  {n < steps.length && <span className={`flex-1 h-0.5 rounded-full ${n < step ? 'bg-emerald-400' : 'bg-white/15'}`} />}
                </li>
              );
            })}
          </ol>
        </div>
      </div>

      {/* Step 1: choose mode */}
      {step === 1 && (
        <div className="grid md:grid-cols-2 gap-6">
          {[
            { v: true, icon: UsersRound, title: 'Sudah Punya Tim', desc: 'Kamu jadi ketua. Beri nama tim dan pilih anggota dari mahasiswa terdaftar.', tone: 'from-[#9333EA] to-[#6C1B75]' },
            { v: false, icon: UserRound, title: 'Belum Punya Tim', desc: 'Daftar sendiri dulu. Admin akan mencarikan dan menempatkanmu ke tim yang sesuai.', tone: 'from-amber-400 to-orange-500' },
          ].map((o) => {
            const chosen = hasTeam === o.v;
            return (
              <button
                key={String(o.v)}
                onClick={() => { setHasTeam(o.v); setStep(2); setError(''); }}
                className={`text-left p-7 rounded-[28px] border-2 bg-white dark:bg-[#131620]/90 transition-all duration-300 hover:-translate-y-1 group ${chosen ? 'border-[#9333EA] shadow-xl shadow-purple-900/10' : 'border-slate-200/80 dark:border-white/10 hover:border-purple-500/40'}`}
              >
                <div className={`w-14 h-14 rounded-[18px] bg-gradient-to-br ${o.tone} text-white flex items-center justify-center mb-5 shadow-lg group-hover:scale-110 transition-transform`}><o.icon size={26} /></div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">{o.title}</h3>
                <p className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed">{o.desc}</p>
                <span className="inline-flex items-center gap-2 mt-5 font-bold text-purple-700 dark:text-purple-300 text-sm">Pilih <ArrowRight size={16} /></span>
              </button>
            );
          })}
        </div>
      )}

      {/* Step 2: build team */}
      {step === 2 && hasTeam && (
        <div className="grid lg:grid-cols-5 gap-6 items-start">
          <Panel className="lg:col-span-3">
            <FieldLabel>Nama Tim</FieldLabel>
            <input value={teamName} onChange={(e) => setTeamName(e.target.value)} className={inputClass} placeholder="Contoh: Team Alpha" autoFocus />

            <div className="mt-7">
              <FieldLabel hint={`${Math.max(0, slotsLeft)} slot tersisa`}>Cari Anggota</FieldLabel>
              <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-900/80 px-4 py-3.5 rounded-2xl border border-slate-200 dark:border-white/10 focus-within:ring-4 focus-within:ring-[#9333EA]/20 focus-within:border-[#9333EA]/50">
                <Search size={17} className="text-slate-400" />
                <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Ketik nama atau startup..." className="bg-transparent outline-none w-full text-[14px] font-medium text-slate-800 dark:text-white" />
              </div>
              <div className="mt-3 max-h-80 overflow-y-auto custom-scrollbar space-y-2 pr-1">
                {candidates.map((u) => {
                  const taken = takenIds.has(u.id);
                  return (
                    <button
                      key={u.id}
                      type="button"
                      disabled={taken}
                      onClick={() => toggle(u)}
                      className="w-full flex items-center gap-3 p-3 rounded-2xl border border-slate-200/70 dark:border-white/5 hover:border-purple-500/40 hover:bg-purple-500/5 text-left transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                    >
                      <Avatar name={u.name} size="sm" />
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-[14px] text-slate-900 dark:text-white truncate">{u.name}</p>
                        <p className="text-[12px] font-medium text-slate-500 dark:text-slate-400 truncate">{taken ? 'Sudah terdaftar di tim lain' : u.startup_name || 'Mahasiswa'}</p>
                      </div>
                      {!taken && <span className="text-[12px] font-bold text-purple-700 dark:text-purple-300 px-3 py-1.5 rounded-xl bg-purple-500/10">Tambah</span>}
                    </button>
                  );
                })}
                {candidates.length === 0 && <p className="text-sm text-slate-500 text-center py-6">Tidak ada mahasiswa yang cocok.</p>}
              </div>
            </div>
          </Panel>

          <Panel className="lg:col-span-2 lg:sticky lg:top-28">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-black text-lg text-slate-900 dark:text-white">Susunan Tim</h3>
              <span className="text-sm font-bold text-slate-500">{members.length + 1}/{maxMembers}</span>
            </div>
            <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden mb-5">
              <div className="h-full bg-gradient-to-r from-[#9333EA] to-fuchsia-500 transition-all" style={{ width: `${((members.length + 1) / maxMembers) * 100}%` }} />
            </div>
            <ul className="space-y-2">
              <li className="flex items-center gap-3 p-3 rounded-2xl bg-amber-500/5 border border-amber-500/20">
                <Avatar name={user.name} size="sm" />
                <p className="flex-1 font-bold text-[14px] text-slate-900 dark:text-white truncate">{user.name} <span className="text-slate-400 font-medium">(kamu)</span></p>
                <Crown size={16} className="text-amber-500" />
              </li>
              {members.map((m) => (
                <li key={m.id} className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-white/5 animate-scale-in">
                  <Avatar name={m.name} size="sm" />
                  <p className="flex-1 font-bold text-[14px] text-slate-900 dark:text-white truncate">{m.name}</p>
                  <button onClick={() => setMembers(members.filter((x) => x.id !== m.id))} className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-500/10"><X size={16} /></button>
                </li>
              ))}
            </ul>
            {error && <p className="mt-4 text-sm font-bold text-rose-600 dark:text-rose-400">{error}</p>}
            <PrimaryButton onClick={next} className="w-full mt-6">Lanjut <ArrowRight size={18} /></PrimaryButton>
          </Panel>
        </div>
      )}

      {step === 2 && hasTeam === false && (
        <Panel className="max-w-2xl mx-auto text-center p-10">
          <div className="w-20 h-20 mx-auto rounded-[24px] bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-5"><Hourglass size={36} /></div>
          <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Daftar tanpa tim</h3>
          <p className="text-slate-500 dark:text-slate-400 font-medium mb-8">Kamu akan masuk daftar tunggu. Admin akan membentuk tim dari mahasiswa yang mendaftar sendiri, lalu kamu bisa melihat timmu di halaman <b>Tim Saya</b>.</p>
          <div className="flex justify-center gap-3">
            <GhostButton onClick={() => setStep(1)}>Ubah Pilihan</GhostButton>
            <PrimaryButton onClick={submit} disabled={submitting}>{submitting ? 'Mendaftar...' : 'Daftar Sekarang'}</PrimaryButton>
          </div>
        </Panel>
      )}

      {/* Step 3: confirm (with team) */}
      {step === 3 && hasTeam && (
        <Panel className="max-w-2xl mx-auto">
          <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-1">Periksa sekali lagi</h3>
          <p className="text-slate-500 dark:text-slate-400 font-medium mb-6">Pastikan data tim sudah benar sebelum dikirim.</p>
          <div className="rounded-[22px] border border-slate-200/70 dark:border-white/10 divide-y divide-slate-200/70 dark:divide-white/10">
            <div className="p-5 flex justify-between gap-4"><span className="text-slate-500 font-semibold">Lomba</span><span className="font-bold text-slate-900 dark:text-white text-right">{title}</span></div>
            <div className="p-5 flex justify-between gap-4"><span className="text-slate-500 font-semibold">Nama Tim</span><span className="font-bold text-slate-900 dark:text-white">{teamName}</span></div>
            <div className="p-5">
              <p className="text-slate-500 font-semibold mb-3">Anggota ({members.length + 1})</p>
              <div className="flex flex-wrap gap-2">
                {[{ id: user.id, name: user.name, lead: true }, ...members].map((m) => (
                  <span key={m.id} className="inline-flex items-center gap-2 pl-1 pr-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-sm font-bold text-slate-700 dark:text-slate-200">
                    <Avatar name={m.name} size="sm" className="w-6 h-6 text-[9px]" /> {m.name}{m.lead && <Crown size={13} className="text-amber-500" />}
                  </span>
                ))}
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-8">
            <GhostButton onClick={() => setStep(2)}>Ubah</GhostButton>
            <PrimaryButton onClick={submit} disabled={submitting}>{submitting ? 'Mendaftar...' : 'Kirim Pendaftaran'}</PrimaryButton>
          </div>
        </Panel>
      )}
    </div>
  );
}
