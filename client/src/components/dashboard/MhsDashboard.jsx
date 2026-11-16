import { Link } from 'react-router-dom';
import {
  Trophy, UsersRound, Calendar, ArrowUpRight, Activity, Zap, ChevronRight, History, Users, UserCheck, Hourglass, Clock,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { formatDate } from '@/utils/helpers';
import { Panel, PanelTitle, StatusPill, Pill, Avatar, EmptyBlock } from '@/components/user/UserUI';

function MhsDashboard({ loading, myCompetitions, upcomingCompetitions, advisorStatuses }) {
  const { user } = useAuth();
  const activeCount = myCompetitions?.length || 0;
  const firstName = user?.name?.split(' ')[0] || 'Mahasiswa';
  const needsAction = (advisorStatuses || []).filter((a) => a.status === 'none' && a.isLeader).length;

  return (
    <div className="space-y-6 pb-12 animate-fade-in-up">
      {/* Header Bento */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 bg-gradient-to-br from-[#1E1B4B] via-[#2E1065] to-[#3B0764] rounded-[32px] p-8 md:p-12 relative overflow-hidden shadow-2xl flex flex-col justify-center text-white">
          <div className="absolute -top-[50%] -right-[10%] w-[80%] h-[150%] bg-gradient-to-b from-[#9333EA]/30 to-transparent blur-3xl rounded-full transform rotate-12 pointer-events-none" />
          <div className="relative z-10">
            <h1 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight mb-4 leading-tight">
              Selamat datang kembali, <br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-pink-300">{firstName}</span>.
            </h1>
            <p className="text-purple-200/90 text-lg md:text-xl font-medium max-w-lg mb-8">
              {loading ? 'Memuat aktivitasmu...' : activeCount > 0
                ? `Kamu sedang mengikuti ${activeCount} lomba. Tetap fokus dan raih prestasimu!`
                : 'Kamu belum mengikuti lomba apapun. Saatnya mengeksplorasi potensimu!'}
            </p>
            <div className="flex flex-wrap gap-3">
              <Link to="/mahasiswa/competitions" className="inline-flex items-center gap-3 bg-white text-purple-950 px-7 py-4 rounded-full font-bold hover:bg-purple-100 hover:scale-105 transition-all shadow-xl shadow-purple-900/40">
                Eksplorasi Lomba <ArrowUpRight size={20} />
              </Link>
              <Link to="/mahasiswa/my-teams" className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur px-6 py-4 rounded-full font-bold transition-all">
                <UsersRound size={18} /> Tim Saya
              </Link>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-[#9333EA] to-[#6C1B75] rounded-[32px] p-8 text-white relative overflow-hidden shadow-xl flex flex-col justify-between">
          <div className="absolute top-0 right-0 p-6 opacity-20"><Zap size={100} /></div>
          <div className="relative z-10">
            <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mb-6">
              <Activity size={28} className="text-white" />
            </div>
            <p className="text-purple-200 font-medium text-lg uppercase tracking-wider mb-1">Status Aktivitas</p>
            <h2 className="text-5xl font-black">{loading ? '–' : activeCount} <span className="text-2xl font-bold text-purple-200">Lomba Aktif</span></h2>
          </div>
          {needsAction > 0 && (
            <Link to="/mahasiswa/my-teams" className="relative z-10 mt-6 flex items-center gap-3 bg-white/15 hover:bg-white/25 rounded-2xl p-4 transition-all">
              <UserCheck size={20} className="shrink-0" />
              <span className="text-sm font-bold flex-1">{needsAction} tim belum punya dosen pembimbing</span>
              <ChevronRight size={18} />
            </Link>
          )}
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { to: '/mahasiswa/competitions', icon: Trophy, label: 'Daftar Lomba', color: 'from-blue-500 to-indigo-600' },
          { to: '/mahasiswa/my-teams', icon: UsersRound, label: 'Tim Saya', color: 'from-purple-500 to-fuchsia-600' },
          { to: '/mahasiswa/history', icon: History, label: 'History', color: 'from-amber-400 to-orange-500' },
          { to: '/mahasiswa/directory', icon: Users, label: 'Cari Teman Tim', color: 'from-emerald-400 to-teal-500' },
        ].map((a) => (
          <Link key={a.to} to={a.to} className={`bg-gradient-to-br ${a.color} p-5 rounded-[24px] hover:scale-[1.03] hover:shadow-xl transition-all duration-300 group flex items-center gap-4`}>
            <div className="bg-white/25 w-12 h-12 rounded-[18px] flex items-center justify-center group-hover:-translate-y-0.5 transition-transform backdrop-blur-sm shrink-0"><a.icon size={22} className="text-white" strokeWidth={2.5} /></div>
            <p className="font-bold text-white text-[14px] leading-tight">{a.label}</p>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Competitions */}
        <Panel>
          <PanelTitle icon={Trophy} tone="blue" title="Lomba Aktifmu" action={
            <Link to="/mahasiswa/history" className="text-sm font-bold text-purple-700 dark:text-purple-300 hover:underline underline-offset-4">Riwayat</Link>
          } />
          <div className="space-y-4">
            {loading ? (
              [0, 1].map((i) => <div key={i} className="h-24 rounded-2xl bg-slate-100 dark:bg-white/5 animate-pulse" />)
            ) : myCompetitions?.length > 0 ? myCompetitions.map((item) => (
              <Link
                to={item.team ? `/mahasiswa/my-teams?team=${item.team.id}` : '/mahasiswa/my-teams'}
                key={`${item.competition?.id}-${item.team?.id || 's'}`}
                className="group flex flex-col sm:flex-row sm:items-center justify-between p-5 rounded-2xl border border-slate-200/60 dark:border-white/5 bg-slate-50/80 dark:bg-slate-900/50 hover:border-[#9333EA]/30 hover:bg-purple-50/50 dark:hover:bg-slate-800/80 transition-colors gap-4"
              >
                <div className="min-w-0">
                  <h3 className="font-bold text-slate-900 dark:text-white text-lg mb-2 group-hover:text-[#9333EA] dark:group-hover:text-purple-400 transition-colors truncate">{item.competition?.name}</h3>
                  <div className="flex flex-wrap items-center gap-2">
                    {item.team ? <Pill tone="slate" icon={UsersRound}>{item.team.name}</Pill> : <Pill tone="amber" icon={Hourglass}>Menunggu tim</Pill>}
                    {item.advisors?.[0] && <Pill tone="emerald" icon={UserCheck}>{item.advisors[0].name}</Pill>}
                  </div>
                </div>
                <div className="shrink-0"><StatusPill status={item.competition?.status} /></div>
              </Link>
            )) : (
              <EmptyBlock icon={Trophy} title="Belum ada lomba" description="Lomba yang kamu ikuti akan muncul di sini." />
            )}
          </div>
        </Panel>

        {/* Upcoming Competitions */}
        <Panel>
          <PanelTitle icon={Calendar} tone="amber" title="Lomba Tersedia" action={
            <Link to="/mahasiswa/competitions" className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full text-slate-600 dark:text-slate-300 transition-colors"><ChevronRight size={20} /></Link>
          } />
          <div className="space-y-4">
            {loading ? (
              [0, 1, 2].map((i) => <div key={i} className="h-20 rounded-2xl bg-slate-100 dark:bg-white/5 animate-pulse" />)
            ) : upcomingCompetitions?.length > 0 ? upcomingCompetitions.slice(0, 4).map((comp) => (
              <div key={comp.id} className="group flex items-center gap-4 p-5 rounded-2xl border border-slate-200/60 dark:border-white/5 bg-slate-50/80 dark:bg-slate-900/50 hover:border-amber-500/30 transition-colors">
                <Link to={`/mahasiswa/competitions/${comp.id}`} className="flex-1 min-w-0">
                  <h3 className="font-bold text-slate-900 dark:text-white text-lg mb-1 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors truncate">{comp.name || comp.title}</h3>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1.5"><Clock size={14} /> Deadline {formatDate(comp.registration_deadline, 'dd MMM yyyy')}</p>
                </Link>
                <Link to={`/mahasiswa/competitions/${comp.id}/register`} className="shrink-0 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#9333EA] to-[#6C1B75] text-white text-sm font-bold shadow-md shadow-purple-900/20 hover:scale-105 transition-transform">Daftar</Link>
              </div>
            )) : (
              <EmptyBlock icon={Calendar} title="Tidak ada lomba baru" description="Kamu sudah mendaftar semua lomba yang tersedia, atau belum ada lomba dibuka." />
            )}
          </div>
        </Panel>
      </div>

      {advisorStatuses?.length > 0 && (
        <Panel>
          <PanelTitle icon={UserCheck} tone="emerald" title="Status Dosen Pembimbing" subtitle="Pantau pengajuan pembimbing tiap timmu" />
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
            {advisorStatuses.map((a) => (
              <Link to={`/mahasiswa/my-teams?team=${a.teamId}`} key={a.id} className="flex items-center justify-between gap-3 p-5 rounded-2xl border border-slate-200/60 dark:border-white/5 bg-slate-50/80 dark:bg-slate-900/50 hover:border-purple-500/30 transition-colors">
                <div className="flex items-center gap-4 min-w-0">
                  {a.advisor ? <Avatar name={a.advisor.name} /> : <div className="w-11 h-11 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-400 shrink-0"><UserCheck size={18} /></div>}
                  <div className="min-w-0">
                    <p className="font-bold text-slate-900 dark:text-white truncate">{a.advisor?.name || 'Belum diajukan'}</p>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400 truncate">Tim: {a.team?.name}</p>
                  </div>
                </div>
                {a.status === 'none' ? <Pill tone="slate">{a.isLeader ? 'Ajukan' : 'Belum ada'}</Pill> : <StatusPill status={a.status} />}
              </Link>
            ))}
          </div>
        </Panel>
      )}
    </div>
  );
}

export { MhsDashboard };
