import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Trophy, UsersRound, CalendarClock, ArrowUpRight, PlayCircle, CheckCircle2, UserCheck, Hourglass,
  Bell, Sparkles, Clock, Award, ChevronRight, Flame, Target, Compass, Inbox,
} from 'lucide-react';
import { differenceInCalendarDays, parseISO, isValid } from 'date-fns';
import competitionService from '@/services/competitionService';
import historyService from '@/services/historyService';
import myTeamService from '@/services/myTeamService';
import notificationService from '@/services/notificationService';
import { useAuth } from '@/hooks/useAuth';
import { formatDate, formatRelativeTime } from '@/utils/helpers';
import { cn } from '@/lib/utils';
import { Panel, PanelTitle, Pill, StatusPill, Avatar, EmptyBlock, ICON_TONES } from '@/components/user/UserUI';

const toDate = (v) => {
  if (!v) return null;
  const d = parseISO(String(v));
  return isValid(d) ? d : null;
};
const daysUntil = (v) => {
  const d = toDate(v);
  return d ? differenceInCalendarDays(d, new Date()) : null;
};

function greeting() {
  const h = new Date().getHours();
  if (h < 11) return 'Selamat pagi';
  if (h < 15) return 'Selamat siang';
  if (h < 19) return 'Selamat sore';
  return 'Selamat malam';
}

export default function MhsDashboardPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState(null);
  const [competitions, setCompetitions] = useState([]);
  const [teams, setTeams] = useState([]);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    Promise.allSettled([
      historyService.getUserHistory(user.id),
      competitionService.getCompetitions(),
      myTeamService.getMyTeams(),
      notificationService.getNotifications(),
    ]).then(([h, c, t, n]) => {
      if (h.status === 'fulfilled') setHistory(h.value.data);
      if (c.status === 'fulfilled') setCompetitions(c.value.data || []);
      if (t.status === 'fulfilled') setTeams(t.value.data?.teams || []);
      if (n.status === 'fulfilled') setNotifications(n.value.data?.notifications || []);
    }).finally(() => setLoading(false));
  }, [user.id]);

  const data = useMemo(() => {
    const c = history?.competitions || {};
    const active = [...(c.ongoing || []), ...(c.upcoming || [])];
    const registered = new Set([...active, ...(c.completed || [])].map((i) => i.competition?.id));
    const open = competitions
      .filter((x) => x.status === 'upcoming' && !registered.has(x.id) && (daysUntil(x.registration_deadline) ?? 1) >= 0)
      .sort((a, b) => String(a.registration_deadline).localeCompare(String(b.registration_deadline)));
    const noAdvisor = teams.filter((t) => t.leader_id === user.id && !(t.advisor_id && t.advisor_status === 'approved') && !t.advisor_requests?.some((r) => r.status === 'pending') && t.competition?.status !== 'completed');

    // Agenda: tanggal pelaksanaan lomba yang diikuti + deadline lomba yang masih dibuka
    const agenda = [
      ...active.map((i) => ({ key: `e-${i.competition?.id}`, date: i.competition?.event_date, title: i.competition?.name, kind: 'Pelaksanaan', tone: 'blue', to: `/mahasiswa/competitions/${i.competition?.id}` })),
      ...open.map((x) => ({ key: `d-${x.id}`, date: x.registration_deadline, title: x.title || x.name, kind: 'Deadline daftar', tone: 'rose', to: `/mahasiswa/competitions/${x.id}` })),
    ].filter((a) => (daysUntil(a.date) ?? -1) >= 0)
      .sort((a, b) => String(a.date).localeCompare(String(b.date)))
      .slice(0, 5);

    return {
      active,
      open,
      noAdvisor,
      agenda,
      stats: history?.stats || { total: 0, ongoing: 0, upcoming: 0, completed: 0 },
      dueThisWeek: open.filter((x) => (daysUntil(x.registration_deadline) ?? 99) <= 7).length,
      nearest: open[0] || null,
    };
  }, [history, competitions, teams, user.id]);

  const firstName = user?.name?.split(' ')[0] || 'Mahasiswa';
  const unread = notifications.filter((n) => !n.read).length;
  const today = formatDate(new Date().toISOString(), 'EEEE, dd MMMM yyyy');

  return (
    <div className="space-y-6 pb-12 animate-fade-in-up">
      {/* ── Row 1: hero + spotlight ───────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        <section className="xl:col-span-8 relative overflow-hidden rounded-[32px] bg-gradient-to-br from-[#1E1B4B] via-[#2E1065] to-[#3B0764] p-8 md:p-10 text-white shadow-2xl">
          <div className="absolute -top-1/2 -right-[10%] w-[70%] h-[160%] bg-gradient-to-b from-[#9333EA]/35 to-transparent blur-3xl rounded-full rotate-12 pointer-events-none" />
          <div className="absolute -bottom-24 -left-10 w-72 h-72 rounded-full bg-fuchsia-500/20 blur-3xl pointer-events-none" />
          <div className="absolute inset-0 opacity-[0.07] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '22px 22px' }} />

          <div className="relative z-10">
            <p className="text-[13px] font-semibold text-purple-200/80 capitalize">{today}</p>
            <h1 className="text-3xl md:text-[44px] font-black tracking-tight leading-[1.1] mt-2">
              {greeting()}, <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-200 via-pink-200 to-amber-100">{firstName}</span> 👋
            </h1>
            <p className="text-purple-100/85 text-base md:text-lg font-medium max-w-xl mt-3">
              {loading ? 'Menyiapkan ringkasan aktivitasmu...' : data.active.length > 0
                ? `Kamu sedang mengikuti ${data.active.length} lomba. Terus pantau tim dan jadwalmu di sini.`
                : 'Kamu belum mengikuti lomba apapun. Yuk mulai cari kompetisi yang cocok!'}
            </p>

            <div className="flex flex-wrap gap-2.5 mt-6">
              {[
                { icon: PlayCircle, text: `${data.stats.ongoing} berlangsung` },
                { icon: Flame, text: `${data.dueThisWeek} deadline minggu ini` },
                { icon: UserCheck, text: `${data.noAdvisor.length} tim tanpa pembimbing`, warn: data.noAdvisor.length > 0 },
              ].map((c) => (
                <span key={c.text} className={cn('inline-flex items-center gap-2 px-3.5 py-2 rounded-full text-[13px] font-bold backdrop-blur border', c.warn ? 'bg-amber-400/20 border-amber-300/30 text-amber-100' : 'bg-white/10 border-white/15')}>
                  <c.icon size={15} /> {loading ? '…' : c.text}
                </span>
              ))}
            </div>

            <div className="flex flex-wrap gap-3 mt-8">
              <Link to="/mahasiswa/competitions" className="inline-flex items-center gap-2 bg-white text-purple-950 px-6 py-3.5 rounded-2xl font-bold hover:bg-purple-50 hover:scale-[1.03] transition-all shadow-xl shadow-purple-950/40">
                <Compass size={18} /> Jelajah Lomba
              </Link>
              <Link to="/mahasiswa/my-teams" className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/15 backdrop-blur px-6 py-3.5 rounded-2xl font-bold transition-all">
                <UsersRound size={18} /> Kelola Tim
              </Link>
            </div>
          </div>
        </section>

        {/* Spotlight: deadline terdekat */}
        <section className="xl:col-span-4 relative overflow-hidden rounded-[32px] p-7 bg-white dark:bg-[#131620]/90 border border-slate-200/80 dark:border-white/10 shadow-sm dark:shadow-xl flex flex-col">
          <div className="flex items-center justify-between mb-5">
            <span className="inline-flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.14em] text-rose-600 dark:text-rose-400"><Clock size={14} /> Deadline terdekat</span>
            {data.open.length > 1 && <Link to="/mahasiswa/competitions" className="text-[12px] font-bold text-slate-400 hover:text-purple-600">+{data.open.length - 1} lainnya</Link>}
          </div>
          {loading ? (
            <div className="flex-1 rounded-2xl bg-slate-100 dark:bg-white/5 animate-pulse min-h-[220px]" />
          ) : data.nearest ? (
            <>
              <div className="relative h-32 rounded-2xl overflow-hidden bg-gradient-to-br from-[#2E1065] to-[#6C1B75] mb-5">
                {data.nearest.image_url && <img src={data.nearest.image_url} alt="" className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; }} />}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 to-transparent" />
                {data.nearest.prize_pool && <span className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 text-white text-[13px] font-black"><Award size={15} className="text-amber-300" /> {data.nearest.prize_pool}</span>}
              </div>
              <h3 className="font-black text-lg text-slate-900 dark:text-white leading-snug line-clamp-2">{data.nearest.title || data.nearest.name}</h3>
              <div className="flex items-end justify-between gap-4 mt-4">
                <div>
                  <p className="text-5xl font-black tracking-tight text-slate-900 dark:text-white leading-none">{Math.max(0, daysUntil(data.nearest.registration_deadline) ?? 0)}</p>
                  <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mt-1">hari tersisa • {formatDate(data.nearest.registration_deadline, 'dd MMM')}</p>
                </div>
                <Link to={`/mahasiswa/competitions/${data.nearest.id}/register`} className="inline-flex items-center gap-1.5 px-5 py-3 rounded-2xl bg-gradient-to-r from-[#9333EA] to-[#6C1B75] text-white font-bold text-sm shadow-lg shadow-purple-900/25 hover:-translate-y-0.5 transition-all">
                  Daftar <ArrowUpRight size={16} />
                </Link>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-6">
              <div className="w-16 h-16 rounded-[20px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4"><CheckCircle2 size={30} /></div>
              <p className="font-black text-slate-900 dark:text-white">Tidak ada deadline mendesak</p>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">Semua lomba yang dibuka sudah kamu ikuti.</p>
            </div>
          )}
        </section>
      </div>

      {/* ── Row 2: stats ───────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {[
          { label: 'Total Lomba', val: data.stats.total, icon: Trophy, tone: 'purple', hint: 'sepanjang waktu' },
          { label: 'Berlangsung', val: data.stats.ongoing, icon: PlayCircle, tone: 'blue', hint: 'sedang dikerjakan' },
          { label: 'Akan Datang', val: data.stats.upcoming, icon: CalendarClock, tone: 'amber', hint: 'sudah terdaftar' },
          { label: 'Selesai', val: data.stats.completed, icon: CheckCircle2, tone: 'emerald', hint: 'portofolio kamu' },
        ].map((s) => (
          <div key={s.label} className="group relative overflow-hidden bg-white dark:bg-[#131620]/90 rounded-[28px] p-5 md:p-6 border border-slate-200/80 dark:border-white/10 shadow-sm dark:shadow-xl hover:-translate-y-1 hover:border-purple-500/30 transition-all duration-300">
            <div className="flex items-start justify-between">
              <div className={cn('p-3 rounded-2xl border group-hover:scale-110 transition-transform', ICON_TONES[s.tone])}><s.icon size={22} strokeWidth={2.4} /></div>
              <span className="text-[11px] font-bold text-slate-400 hidden sm:block">{s.hint}</span>
            </div>
            <p className="text-4xl font-black text-slate-900 dark:text-white tracking-tight mt-5">{loading ? '–' : s.val}</p>
            <p className="text-[13px] font-bold text-slate-500 dark:text-slate-400 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* ── Row 3: tim aktif + agenda ──────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        <Panel className="xl:col-span-8">
          <PanelTitle
            icon={Target}
            title="Lomba & Tim Aktif"
            subtitle="Pantau status tim dan dosen pembimbingmu"
            action={<Link to="/mahasiswa/my-teams" className="inline-flex items-center gap-1 text-sm font-bold text-purple-700 dark:text-purple-300 hover:gap-2 transition-all">Semua <ChevronRight size={16} /></Link>}
          />
          {loading ? (
            <div className="grid md:grid-cols-2 gap-4">{[0, 1].map((i) => <div key={i} className="h-44 rounded-[22px] bg-slate-100 dark:bg-white/5 animate-pulse" />)}</div>
          ) : data.active.length === 0 ? (
            <EmptyBlock icon={Trophy} title="Belum ada lomba aktif" description="Daftar lomba pertamamu dan bangun tim impian." action={<Link to="/mahasiswa/competitions" className="font-bold text-purple-700 dark:text-purple-300 hover:underline underline-offset-4">Cari lomba</Link>} />
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {data.active.slice(0, 4).map((item) => {
                const team = teams.find((t) => t.id === item.team?.id);
                const pending = team?.advisor_requests?.find((r) => r.status === 'pending');
                const advisor = team?.advisor_status === 'approved' ? team.advisor_name : null;
                const left = daysUntil(item.competition?.event_date);
                return (
                  <Link
                    key={`${item.competition?.id}-${item.team?.id || 's'}`}
                    to={item.team ? `/mahasiswa/my-teams?team=${item.team.id}` : '/mahasiswa/my-teams'}
                    className="group p-5 rounded-[22px] border border-slate-200/70 dark:border-white/5 bg-slate-50/70 dark:bg-slate-900/40 hover:bg-white dark:hover:bg-slate-900/80 hover:border-purple-500/30 hover:shadow-lg transition-all"
                  >
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div className="min-w-0">
                        <p className="font-black text-slate-900 dark:text-white truncate group-hover:text-purple-700 dark:group-hover:text-purple-300 transition-colors">{item.competition?.name}</p>
                        <p className="text-[13px] font-semibold text-slate-500 dark:text-slate-400 truncate">{item.team ? item.team.name : 'Menunggu penempatan tim'}</p>
                      </div>
                      <StatusPill status={item.competition?.status} />
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      {team ? (
                        <div className="flex -space-x-2">
                          {(team.members || []).slice(0, 4).map((m) => <Avatar key={m.user_id} name={m.name} size="sm" className="ring-2 ring-slate-50 dark:ring-slate-900" />)}
                          {(team.members || []).length > 4 && <span className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 ring-2 ring-slate-50 dark:ring-slate-900 flex items-center justify-center text-[11px] font-bold text-slate-600 dark:text-slate-300">+{team.members.length - 4}</span>}
                        </div>
                      ) : <Pill tone="amber" icon={Hourglass}>Solo</Pill>}
                      {left !== null && left >= 0 && <span className="text-[12px] font-bold text-slate-500 dark:text-slate-400">H-{left}</span>}
                    </div>
                    <div className="mt-4 pt-4 border-t border-slate-200/70 dark:border-white/5">
                      {advisor ? <Pill tone="emerald" icon={UserCheck}>{advisor}</Pill>
                        : pending ? <Pill tone="amber" icon={Hourglass}>Menunggu {pending.target_advisor_name}</Pill>
                        : item.team ? <Pill tone="slate" icon={UserCheck}>Belum ada pembimbing</Pill>
                        : <Pill tone="slate">Admin akan menyesuaikan tim</Pill>}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </Panel>

        <Panel className="xl:col-span-4">
          <PanelTitle icon={CalendarClock} tone="amber" title="Agenda" subtitle="Tanggal penting ke depan" />
          {loading ? (
            <div className="space-y-3">{[0, 1, 2].map((i) => <div key={i} className="h-16 rounded-2xl bg-slate-100 dark:bg-white/5 animate-pulse" />)}</div>
          ) : data.agenda.length === 0 ? (
            <EmptyBlock icon={CalendarClock} title="Agenda kosong" description="Belum ada tanggal penting dalam waktu dekat." />
          ) : (
            <ol className="space-y-3">
              {data.agenda.map((a) => {
                const d = toDate(a.date);
                const left = daysUntil(a.date);
                return (
                  <li key={a.key}>
                    <Link to={a.to} className="flex items-center gap-4 p-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-white/5 transition-colors group">
                      <div className={cn('w-14 h-14 rounded-2xl flex flex-col items-center justify-center shrink-0 border', a.tone === 'rose' ? 'bg-rose-500/10 border-rose-500/20 text-rose-700 dark:text-rose-300' : 'bg-blue-500/10 border-blue-500/20 text-blue-700 dark:text-blue-300')}>
                        <span className="text-lg font-black leading-none">{d ? formatDate(a.date, 'dd') : '-'}</span>
                        <span className="text-[10px] font-bold uppercase">{d ? formatDate(a.date, 'MMM') : ''}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-[14px] text-slate-900 dark:text-white truncate group-hover:text-purple-700 dark:group-hover:text-purple-300">{a.title}</p>
                        <p className="text-[12px] font-semibold text-slate-500 dark:text-slate-400">{a.kind} • {left === 0 ? 'hari ini' : `${left} hari lagi`}</p>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ol>
          )}
        </Panel>
      </div>

      {/* ── Row 4: rekomendasi + notifikasi ────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        <Panel className="xl:col-span-8">
          <PanelTitle
            icon={Sparkles}
            tone="blue"
            title="Rekomendasi Lomba"
            subtitle="Masih membuka pendaftaran dan belum kamu ikuti"
            action={<Link to="/mahasiswa/competitions" className="inline-flex items-center gap-1 text-sm font-bold text-purple-700 dark:text-purple-300 hover:gap-2 transition-all">Jelajah <ChevronRight size={16} /></Link>}
          />
          {loading ? (
            <div className="grid sm:grid-cols-3 gap-4">{[0, 1, 2].map((i) => <div key={i} className="h-56 rounded-[22px] bg-slate-100 dark:bg-white/5 animate-pulse" />)}</div>
          ) : data.open.length === 0 ? (
            <EmptyBlock icon={Compass} title="Belum ada rekomendasi" description="Lomba baru akan muncul di sini saat dibuka." />
          ) : (
            <div className="grid sm:grid-cols-2 2xl:grid-cols-3 gap-4">
              {data.open.slice(0, 3).map((c) => {
                const left = daysUntil(c.registration_deadline);
                return (
                  <div key={c.id} className="group rounded-[22px] overflow-hidden border border-slate-200/70 dark:border-white/5 bg-white dark:bg-slate-900/40 hover:shadow-xl hover:-translate-y-1 hover:border-purple-500/30 transition-all flex flex-col">
                    <Link to={`/mahasiswa/competitions/${c.id}`} className="relative h-28 block bg-gradient-to-br from-[#2E1065] to-[#6C1B75] overflow-hidden">
                      {c.image_url && <img src={c.image_url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" onError={(e) => { e.currentTarget.style.display = 'none'; }} />}
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 to-transparent" />
                      {c.category && <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-white/90 text-[11px] font-bold text-slate-800">{c.category}</span>}
                    </Link>
                    <div className="p-4 flex-1 flex flex-col">
                      <p className="font-black text-[15px] text-slate-900 dark:text-white leading-snug line-clamp-2">{c.title || c.name}</p>
                      <p className={cn('text-[12px] font-bold mt-2 flex items-center gap-1.5', left !== null && left <= 7 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-500 dark:text-slate-400')}>
                        <Clock size={13} /> {left === 0 ? 'Tutup hari ini' : `Tutup ${left} hari lagi`}
                      </p>
                      <Link to={`/mahasiswa/competitions/${c.id}/register`} className="mt-4 inline-flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-purple-500/10 text-purple-700 dark:text-purple-300 font-bold text-sm hover:bg-[#9333EA] hover:text-white transition-colors">
                        Daftar <ArrowUpRight size={15} />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Panel>

        <Panel className="xl:col-span-4">
          <PanelTitle
            icon={Bell}
            tone="rose"
            title="Notifikasi"
            subtitle={unread > 0 ? `${unread} belum dibaca` : 'Semua sudah dibaca'}
            action={<Link to="/mahasiswa/notifications" className="inline-flex items-center gap-1 text-sm font-bold text-purple-700 dark:text-purple-300 hover:gap-2 transition-all">Semua <ChevronRight size={16} /></Link>}
          />
          {loading ? (
            <div className="space-y-3">{[0, 1, 2].map((i) => <div key={i} className="h-14 rounded-2xl bg-slate-100 dark:bg-white/5 animate-pulse" />)}</div>
          ) : notifications.length === 0 ? (
            <EmptyBlock icon={Inbox} title="Tidak ada notifikasi" />
          ) : (
            <ul className="space-y-1">
              {notifications.slice(0, 4).map((n) => (
                <li key={n.id}>
                  <Link to={n.link || '/mahasiswa/notifications'} className="flex items-start gap-3 p-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                    <span className={cn('mt-1.5 w-2 h-2 rounded-full shrink-0', n.read ? 'bg-slate-300 dark:bg-slate-600' : 'bg-[#9333EA] ring-4 ring-purple-500/15')} />
                    <div className="min-w-0">
                      <p className={cn('text-[14px] truncate', n.read ? 'font-semibold text-slate-600 dark:text-slate-300' : 'font-bold text-slate-900 dark:text-white')}>{n.title}</p>
                      <p className="text-[12px] font-medium text-slate-500 dark:text-slate-400 line-clamp-1">{n.message}</p>
                      {n.date && <p className="text-[11px] font-semibold text-slate-400 mt-0.5">{formatRelativeTime(n.date)}</p>}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  );
}
