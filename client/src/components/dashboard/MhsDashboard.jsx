import { Link } from 'react-router-dom';
import { Trophy, UsersRound, Calendar, ArrowUpRight, Activity, Zap, CheckCircle2, ChevronRight } from 'lucide-react';
import { StatusBadge } from '@/components/common/StatusBadge';
import { ADVISOR_STATUS_LABELS, STATUS_LABELS } from '@/utils/constants';
import { useAuth } from '@/hooks/useAuth';

function MhsDashboard({ myCompetitions, upcomingCompetitions, advisorStatuses }) {
  const { user } = useAuth();
  const activeCount = myCompetitions?.length || 0;
  const firstName = user?.name?.split(' ')[0] || 'Mahasiswa';

  return (
    <div className="space-y-8 pb-12 animate-fade-in-up">
      {/* Header Bento */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 bg-gradient-to-br from-[#1E1B4B] via-[#2E1065] to-[#3B0764] dark:bg-[#0F1115] rounded-[32px] p-8 md:p-12 relative overflow-hidden shadow-2xl flex flex-col justify-center text-white">
          <div className="absolute -top-[50%] -right-[10%] w-[80%] h-[150%] bg-gradient-to-b from-[#9333EA]/30 to-transparent blur-3xl rounded-full transform rotate-12 pointer-events-none" />
          <div className="relative z-10">
            <h1 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight mb-4 leading-tight">
              Selamat datang kembali, <br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-pink-300">{firstName}</span>.
            </h1>
            <p className="text-purple-200/90 dark:text-slate-400 text-lg md:text-xl font-medium max-w-lg mb-8">
              {activeCount > 0 
                ? `Kamu sedang aktif di ${activeCount} perlombaan. Tetap fokus dan raih prestasimu!`
                : 'Belum ada perlombaan yang diikuti. Saatnya mengeksplorasi potensimu!'}
            </p>
            <Link to="/mahasiswa/competitions" className="inline-flex items-center gap-3 bg-white text-purple-950 px-8 py-4 rounded-full font-bold hover:bg-purple-100 hover:scale-105 transition-all shadow-xl shadow-purple-900/40">
              Eksplorasi Lomba <ArrowUpRight size={20} />
            </Link>
          </div>
        </div>

        <div className="bg-gradient-to-br from-[#9333EA] to-[#6C1B75] rounded-[32px] p-8 text-white relative overflow-hidden shadow-xl flex flex-col justify-between">
          <div className="absolute top-0 right-0 p-6 opacity-20"><Zap size={100} /></div>
          <div className="relative z-10">
            <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mb-6">
              <Activity size={28} className="text-white" />
            </div>
            <p className="text-purple-200 font-medium text-lg uppercase tracking-wider mb-1">Status Aktivitas</p>
            <h2 className="text-5xl font-black">{activeCount} <span className="text-2xl font-bold text-purple-200">Lomba Aktif</span></h2>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Competitions Bento */}
        <div className="bg-white dark:bg-[#131620]/90 rounded-[32px] p-8 shadow-sm dark:shadow-xl border border-slate-200/80 dark:border-white/10">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-50 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-2xl"><Trophy size={24} /></div>
              <h2 className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight">Lomba Aktifmu</h2>
            </div>
          </div>
          <div className="space-y-4">
            {myCompetitions?.length > 0 ? myCompetitions.map(item => (
              <div key={item.competition?.id} className="group flex flex-col sm:flex-row sm:items-center justify-between p-5 rounded-2xl border border-slate-200/60 dark:border-white/5 bg-slate-50/80 dark:bg-slate-900/50 hover:border-[#9333EA]/30 hover:bg-purple-50/50 dark:hover:bg-slate-800/80 transition-colors gap-4">
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-lg mb-1 group-hover:text-[#9333EA] dark:group-hover:text-purple-400 transition-colors">{item.competition?.name}</h3>
                  <div className="flex flex-wrap items-center gap-3 text-sm font-medium text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1.5 bg-slate-200/70 dark:bg-slate-800 px-3 py-1 rounded-full text-slate-700 dark:text-slate-300">
                      <UsersRound size={14} /> {item.team?.name}
                    </span>
                    {item.advisors?.[0] && <span className="text-slate-500 dark:text-slate-400">• Dosen: {item.advisors[0].name}</span>}
                  </div>
                </div>
                <div className="shrink-0"><StatusBadge status={item.competition?.status} labels={STATUS_LABELS} /></div>
              </div>
            )) : (
              <div className="py-12 flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-400 dark:text-slate-500 mb-4"><Trophy size={32} /></div>
                <p className="text-slate-500 dark:text-slate-400 font-medium">Belum ada lomba yang kamu ikuti</p>
              </div>
            )}
          </div>
        </div>

        {/* Upcoming Competitions Bento */}
        <div className="bg-white dark:bg-[#131620]/90 rounded-[32px] p-8 shadow-sm dark:shadow-xl border border-slate-200/80 dark:border-white/10">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-amber-50 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded-2xl"><Calendar size={24} /></div>
              <h2 className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight">Mendatang</h2>
            </div>
            <Link to="/mahasiswa/competitions" className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full text-slate-600 dark:text-slate-300 transition-colors"><ChevronRight size={20} /></Link>
          </div>
          <div className="space-y-4">
            {upcomingCompetitions?.length > 0 ? upcomingCompetitions.slice(0,4).map(comp => (
              <Link to={`/mahasiswa/competitions/${comp.id}`} key={comp.id} className="group block p-5 rounded-2xl border border-slate-200/60 dark:border-white/5 bg-slate-50/80 dark:bg-slate-900/50 hover:border-amber-500/30 hover:bg-amber-50 dark:hover:bg-slate-800/80 transition-colors">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-lg mb-1 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">{comp.name}</h3>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Deadline: {comp.registration_deadline || '-'}</p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center text-slate-400 group-hover:bg-amber-500 group-hover:text-white transition-all">
                    <ArrowUpRight size={18} />
                  </div>
                </div>
              </Link>
            )) : (
              <div className="py-12 flex flex-col items-center text-center">
                <p className="text-slate-500 dark:text-slate-400 font-medium">Belum ada lomba tersedia</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {advisorStatuses?.length > 0 && (
        <div className="bg-white dark:bg-[#131620]/90 rounded-[32px] p-8 shadow-sm dark:shadow-xl border border-slate-200/80 dark:border-white/10">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight mb-8">Status Pengajuan Pembimbing</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {advisorStatuses.map(a => (
              <div key={a.id} className="flex items-center justify-between p-5 rounded-2xl border border-slate-200/60 dark:border-white/5 bg-slate-50/80 dark:bg-slate-900/50">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-300 font-bold">{getInitials(a.advisor?.name)}</div>
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white">{a.advisor?.name}</p>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Tim: {a.team?.name}</p>
                  </div>
                </div>
                <StatusBadge status={a.status} labels={ADVISOR_STATUS_LABELS} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Ensure getInitials is available or just implement it inline to be safe.
function getInitials(name) {
  if (!name) return 'U';
  return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
}

export { MhsDashboard };
