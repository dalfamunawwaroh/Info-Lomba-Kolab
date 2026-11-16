import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Calendar, Clock, UsersRound, ExternalLink, ArrowLeft, MapPin, Award, Wallet,
  BookOpen, Link as LinkIcon, Pencil, UserCheck, Building2, CheckCircle2, Lock, ArrowUpRight, Crown,
} from 'lucide-react';
import { differenceInCalendarDays, parseISO } from 'date-fns';
import competitionService from '@/services/competitionService';
import historyService from '@/services/historyService';
import { COMPETITION_STATUS } from '@/utils/constants';
import { formatDate, isDeadlinePassed } from '@/utils/helpers';
import { useAuth } from '@/hooks/useAuth';
import { Panel, PanelTitle, Pill, StatusPill, Avatar, EmptyBlock } from '@/components/user/UserUI';

export default function DetailLombaPage() {
  const { id } = useParams();
  const { user, isMahasiswa, isAdmin, isDosen } = useAuth();
  const [competition, setCompetition] = useState(null);
  const [myEntry, setMyEntry] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const basePath = isAdmin ? '/admin' : isDosen ? '/dosen' : '/mahasiswa';

  useEffect(() => {
    async function load() {
      try {
        const [compRes, histRes] = await Promise.all([
          competitionService.getCompetitionById(id),
          isMahasiswa ? historyService.getUserHistory(user.id).catch(() => ({ data: null })) : Promise.resolve({ data: null }),
        ]);
        setCompetition(compRes.data);
        const c = histRes?.data?.competitions;
        if (c) {
          const entry = [...(c.upcoming || []), ...(c.ongoing || []), ...(c.completed || [])].find((h) => h.competition?.id === Number(id));
          setMyEntry(entry || null);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id, user?.id, isMahasiswa]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-72 rounded-[32px] bg-slate-200/70 dark:bg-white/5 animate-pulse" />
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-64 rounded-[28px] bg-slate-200/70 dark:bg-white/5 animate-pulse" />
          <div className="h-64 rounded-[28px] bg-slate-200/70 dark:bg-white/5 animate-pulse" />
        </div>
      </div>
    );
  }
  if (!competition) {
    return <Panel><EmptyBlock icon={Award} title="Lomba tidak ditemukan" description="Lomba mungkin sudah dihapus." /></Panel>;
  }

  const title = competition.title || competition.name;
  const isRegistered = !!myEntry;
  const deadlinePassed = isDeadlinePassed(competition.registration_deadline);
  const canRegister = competition.status === COMPETITION_STATUS.UPCOMING && !deadlinePassed && !isRegistered && isMahasiswa;
  let left = null;
  try { left = competition.registration_deadline ? differenceInCalendarDays(parseISO(competition.registration_deadline), new Date()) : null; } catch { left = null; }
  const teams = competition.teams || [];

  const facts = [
    { icon: Calendar, label: 'Pelaksanaan', val: formatDate(competition.event_date) },
    { icon: Clock, label: 'Deadline Daftar', val: formatDate(competition.registration_deadline) },
    { icon: UsersRound, label: 'Ukuran Tim', val: competition.max_team_members ? `Maks ${competition.max_team_members} orang` : '-' },
    competition.organizer && { icon: Building2, label: 'Penyelenggara', val: competition.organizer },
    competition.location && { icon: MapPin, label: 'Lokasi', val: competition.location },
    competition.registration_fee && { icon: Wallet, label: 'Biaya Daftar', val: competition.registration_fee },
    competition.needs_advisor && { icon: UserCheck, label: 'Dosen Pembimbing', val: `Wajib, maks ${competition.max_advisors || 1}` },
  ].filter(Boolean);

  return (
    <div className="space-y-6 pb-12 animate-fade-in-up">
      <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 dark:text-slate-400 hover:text-purple-700 dark:hover:text-purple-300 transition-colors">
        <ArrowLeft size={18} /> Kembali
      </button>

      {/* Hero */}
      <div className="relative rounded-[32px] overflow-hidden shadow-2xl bg-gradient-to-br from-[#1E1B4B] via-[#2E1065] to-[#3B0764] min-h-[300px] flex items-end">
        {competition.image_url && (
          <img src={competition.image_url} alt="" className="absolute inset-0 w-full h-full object-cover opacity-40" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#140A2E] via-[#140A2E]/70 to-transparent" />
        <div className="relative z-10 w-full p-7 md:p-10 flex flex-col lg:flex-row lg:items-end justify-between gap-6 text-white">
          <div className="max-w-3xl">
            <div className="flex flex-wrap gap-2 mb-4">
              <StatusPill status={competition.status} className="bg-white/90 dark:bg-slate-950/70" />
              {competition.category && <span className="px-3 py-1 rounded-full bg-white/15 backdrop-blur text-[12px] font-bold">{competition.category}</span>}
              {competition.needs_advisor && <span className="px-3 py-1 rounded-full bg-white/15 backdrop-blur text-[12px] font-bold">Perlu Dosen Pembimbing</span>}
            </div>
            <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-tight">{title}</h1>
            {competition.prize_pool && (
              <p className="flex items-center gap-2 mt-4 text-lg font-bold"><Award className="text-amber-300" size={22} /> Total hadiah {competition.prize_pool}</p>
            )}
          </div>
          <div className="flex flex-wrap gap-3 shrink-0">
            {(isAdmin || isDosen) && (
              <button onClick={() => navigate(`${basePath}/competitions/${id}/edit`)} className="inline-flex items-center gap-2 bg-white/15 hover:bg-white/25 backdrop-blur px-5 py-3.5 rounded-2xl font-bold text-sm transition-all">
                <Pencil size={16} /> Edit Lomba
              </button>
            )}
            {canRegister && (
              <button onClick={() => navigate(`/mahasiswa/competitions/${id}/register`)} className="inline-flex items-center gap-2 bg-white text-purple-950 px-7 py-3.5 rounded-2xl font-bold hover:bg-purple-100 hover:scale-105 transition-all shadow-xl shadow-purple-900/40">
                Daftar Lomba Ini <ArrowUpRight size={18} />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Main */}
        <div className="lg:col-span-2 space-y-6">
          {competition.description && (
            <Panel>
              <PanelTitle icon={BookOpen} title="Tentang Lomba" />
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed font-medium whitespace-pre-line">{competition.description}</p>
            </Panel>
          )}

          {Array.isArray(competition.requirements) && competition.requirements.length > 0 && (
            <Panel>
              <PanelTitle icon={CheckCircle2} tone="emerald" title="Persyaratan" subtitle={`${competition.requirements.length} hal yang perlu disiapkan`} />
              <ul className="grid sm:grid-cols-2 gap-3">
                {competition.requirements.map((req, i) => (
                  <li key={i} className="flex items-start gap-3 p-4 rounded-[18px] bg-slate-50/80 dark:bg-slate-900/50 border border-slate-200/60 dark:border-white/5">
                    <span className="w-7 h-7 rounded-full bg-gradient-to-br from-[#9333EA] to-[#6C1B75] text-white flex items-center justify-center text-xs font-black shrink-0">{i + 1}</span>
                    <span className="text-slate-700 dark:text-slate-300 font-semibold text-sm pt-1">{req}</span>
                  </li>
                ))}
              </ul>
            </Panel>
          )}

          <Panel>
            <PanelTitle icon={UsersRound} tone="blue" title="Tim Terdaftar" subtitle={`${teams.length} tim sudah mendaftar`} />
            {teams.length > 0 ? (
              <div className="grid sm:grid-cols-2 gap-4">
                {teams.map((team) => {
                  const mine = isMahasiswa && (team.members || []).some((m) => m.user_id === user.id);
                  const Wrapper = isAdmin ? Link : 'div';
                  return (
                    <Wrapper
                      key={team.id}
                      {...(isAdmin ? { to: `/admin/teams/${team.id}` } : {})}
                      className={`block p-5 rounded-[22px] border transition-all ${mine ? 'border-[#9333EA]/40 bg-purple-500/5' : 'border-slate-200/60 dark:border-white/5 bg-slate-50/80 dark:bg-slate-900/50'} ${isAdmin ? 'hover:border-purple-500/40 hover:-translate-y-0.5' : ''}`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className="min-w-0">
                          <p className="font-black text-slate-900 dark:text-white truncate">{team.name}</p>
                          {team.leader_name && <p className="text-[13px] font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1 truncate"><Crown size={13} className="text-amber-500" /> {team.leader_name}</p>}
                        </div>
                        {mine ? <Pill tone="purple">Tim Kamu</Pill> : <StatusPill status={team.status} />}
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex -space-x-2">
                          {(team.members || []).slice(0, 5).map((m) => (
                            <Avatar key={m.user_id} name={m.name} size="sm" className="ring-2 ring-white dark:ring-[#131620]" />
                          ))}
                        </div>
                        {team.advisor_name && team.advisor_status === 'approved' && (
                          <span className="text-[12px] font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-1 truncate max-w-[55%]"><UserCheck size={13} /> {team.advisor_name}</span>
                        )}
                      </div>
                    </Wrapper>
                  );
                })}
              </div>
            ) : (
              <EmptyBlock icon={UsersRound} title="Belum ada tim" description="Jadilah tim pertama yang mendaftar di lomba ini." />
            )}
          </Panel>
        </div>

        {/* Side */}
        <div className="space-y-6 lg:sticky lg:top-28">
          {/* Registration status card (mahasiswa) */}
          {isMahasiswa && (
            isRegistered ? (
              <div className="rounded-[28px] p-7 bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-xl relative overflow-hidden">
                <div className="absolute -right-6 -top-6 opacity-20"><CheckCircle2 size={120} /></div>
                <p className="text-[12px] font-bold uppercase tracking-wider text-emerald-100 mb-1">Status Pendaftaran</p>
                <h3 className="text-2xl font-black mb-2">Kamu sudah terdaftar</h3>
                <p className="text-emerald-50 font-medium text-sm mb-6">
                  {myEntry.team ? <>Tim <b>{myEntry.team.name}</b> • {myEntry.team.role_in_team === 'leader' ? 'Ketua' : 'Anggota'}</> : 'Menunggu admin menempatkanmu ke tim.'}
                </p>
                <Link to={myEntry.team ? `/mahasiswa/my-teams?team=${myEntry.team.id}` : '/mahasiswa/my-teams'} className="relative inline-flex items-center gap-2 bg-white text-emerald-700 px-5 py-3 rounded-2xl font-bold text-sm hover:scale-105 transition-transform">
                  Kelola Tim <ArrowUpRight size={16} />
                </Link>
              </div>
            ) : canRegister ? (
              <div className="rounded-[28px] p-7 bg-gradient-to-br from-[#9333EA] to-[#6C1B75] text-white shadow-xl relative overflow-hidden">
                <div className="absolute -right-6 -top-6 opacity-20"><Clock size={120} /></div>
                <p className="text-[12px] font-bold uppercase tracking-wider text-purple-200 mb-1">Pendaftaran dibuka</p>
                <h3 className="text-4xl font-black">{left !== null && left >= 0 ? left : '-'} <span className="text-lg font-bold text-purple-200">hari lagi</span></h3>
                <p className="text-purple-100 font-medium text-sm mt-2 mb-6">Ditutup {formatDate(competition.registration_deadline)}</p>
                <button onClick={() => navigate(`/mahasiswa/competitions/${id}/register`)} className="relative w-full bg-white text-purple-800 py-3.5 rounded-2xl font-bold hover:bg-purple-50 transition-colors">Daftar Sekarang</button>
              </div>
            ) : (
              <div className="rounded-[28px] p-7 bg-slate-100 dark:bg-slate-900/80 border border-slate-200 dark:border-white/10">
                <Lock className="text-slate-400 mb-3" size={26} />
                <h3 className="text-lg font-black text-slate-800 dark:text-white">Pendaftaran ditutup</h3>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">Lomba ini tidak lagi menerima pendaftar baru.</p>
              </div>
            )
          )}

          <Panel className="p-6 md:p-6">
            <h3 className="font-black text-slate-900 dark:text-white text-lg mb-4">Info Penting</h3>
            <ul className="space-y-4">
              {facts.map((f) => (
                <li key={f.label} className="flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 shrink-0"><f.icon size={17} /></div>
                  <div className="min-w-0">
                    <p className="text-[12px] font-bold uppercase tracking-wider text-slate-400">{f.label}</p>
                    <p className="font-bold text-slate-800 dark:text-slate-100 text-[14px] break-words">{f.val || '-'}</p>
                  </div>
                </li>
              ))}
            </ul>
            {(competition.registration_url || competition.guidebook_url) && (
              <div className="grid gap-2 mt-6">
                {competition.registration_url && (
                  <a href={competition.registration_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 py-3 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-sm hover:opacity-90">
                    <ExternalLink size={16} /> Website Resmi
                  </a>
                )}
                {competition.guidebook_url && (
                  <a href={competition.guidebook_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 py-3 rounded-2xl border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 font-bold text-sm hover:border-purple-500/40">
                    <LinkIcon size={16} /> Guidebook
                  </a>
                )}
              </div>
            )}
          </Panel>
        </div>
      </div>
    </div>
  );
}
