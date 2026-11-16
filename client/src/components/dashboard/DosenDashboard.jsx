import { Link } from 'react-router-dom';
import {
  Trophy, UsersRound, ClipboardList, ArrowUpRight, Zap, ChevronRight,
  GraduationCap, Plus, ArrowRight, CheckCircle2, Clock,
} from 'lucide-react';
import { StatusBadge } from '@/components/common/StatusBadge';
import { ADVISOR_STATUS_LABELS, STATUS_LABELS } from '@/utils/constants';
import { useAuth } from '@/hooks/useAuth';
import { getInitials } from '@/utils/helpers';

function DosenDashboard({ stats, pendingRequests = [], myTeams = [], upcomingCompetitions = [] }) {
  const { user } = useAuth();
  const firstName = user?.name?.split(' ')[0] || 'Dosen';

  const pendingCount = stats?.pending_requests ?? pendingRequests.length;
  const activeTeams = stats?.active_teams ?? myTeams.length;

  const kpi = [
    {
      label: 'Tim Dibimbing',
      value: activeTeams,
      icon: UsersRound,
      color: 'text-blue-600 dark:text-blue-400',
      bg: 'bg-blue-500/10 dark:bg-blue-500/20 border-blue-500/20 dark:border-blue-500/30',
      to: '/dosen/my-teams',
    },
    {
      label: 'Pengajuan Masuk',
      value: pendingCount,
      icon: ClipboardList,
      color: 'text-amber-600 dark:text-amber-400',
      bg: 'bg-amber-500/10 dark:bg-amber-500/20 border-amber-500/20 dark:border-amber-500/30',
      to: '/dosen/advisor-requests',
    },
    {
      label: 'Lomba Dibimbing',
      value: stats?.my_competitions ?? 0,
      icon: Trophy,
      color: 'text-purple-600 dark:text-purple-400',
      bg: 'bg-purple-500/10 dark:bg-purple-500/20 border-purple-500/20 dark:border-purple-500/30',
      to: '/dosen/history',
    },
    {
      label: 'Mahasiswa Aktif',
      value: stats?.members_count ?? 0,
      icon: GraduationCap,
      color: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-500/10 dark:bg-emerald-500/20 border-emerald-500/20 dark:border-emerald-500/30',
      to: '/dosen/directory',
    },
  ];

  return (
    <div className="space-y-8 pb-12 animate-fade-in-up">
      {/* Header Bento */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 bg-gradient-to-br from-[#1E1B4B] via-[#2E1065] to-[#3B0764] dark:bg-[#0F1115] rounded-[32px] p-8 md:p-12 relative overflow-hidden shadow-2xl flex flex-col justify-center text-white">
          <div className="absolute -top-[50%] -right-[10%] w-[80%] h-[150%] bg-gradient-to-b from-[#3b82f6]/30 to-transparent blur-3xl rounded-full transform rotate-12 pointer-events-none" />
          <div className="relative z-10">
            <h1 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight mb-4 leading-tight">
              Selamat datang, <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-cyan-300">Bpk/Ibu {firstName}</span>.
            </h1>
            <p className="text-purple-200/90 dark:text-slate-400 text-lg md:text-xl font-medium max-w-lg mb-8">
              {pendingCount > 0
                ? `Ada ${pendingCount} pengajuan bimbingan yang menunggu konfirmasi Anda.`
                : 'Tidak ada pengajuan bimbingan baru. Anda membimbing ' + activeTeams + ' tim aktif.'}
            </p>
            <div className="flex flex-wrap gap-3">
              <Link to="/dosen/advisor-requests" className="inline-flex items-center gap-3 bg-white text-purple-950 px-8 py-4 rounded-full font-bold hover:bg-purple-100 hover:scale-105 transition-all shadow-xl shadow-purple-900/40">
                Tinjau Pengajuan <ArrowUpRight size={20} />
              </Link>
              <Link to="/dosen/competitions/add" className="inline-flex items-center gap-3 bg-white/10 border border-white/25 backdrop-blur-md text-white px-8 py-4 rounded-full font-bold hover:bg-white/20 hover:scale-105 transition-all">
                <Plus size={20} /> Tambah Lomba
              </Link>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-[#3b82f6] to-[#1d4ed8] rounded-[32px] p-8 text-white relative overflow-hidden shadow-xl flex flex-col justify-between">
          <div className="absolute top-0 right-0 p-6 opacity-20"><Zap size={100} /></div>
          <div className="relative z-10">
            <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mb-6">
              <UsersRound size={28} className="text-white" />
            </div>
            <p className="text-blue-200 font-medium text-lg uppercase tracking-wider mb-1">Tim Dibimbing</p>
            <h2 className="text-5xl font-black">
              {activeTeams} <span className="text-2xl font-bold text-blue-200">Tim Aktif</span>
            </h2>
            <p className="text-blue-100/80 text-sm font-medium mt-3">
              {stats?.pending_team_changes > 0
                ? `${stats.pending_team_changes} pengajuan perubahan tim menunggu admin`
                : 'Semua pengajuan perubahan tim sudah diproses'}
            </p>
          </div>
        </div>
      </div>

      {/* KPI ringkas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpi.map((k) => (
          <Link
            key={k.label}
            to={k.to}
            className="bg-white dark:bg-[#131620]/90 rounded-[28px] p-5 shadow-sm dark:shadow-xl border border-slate-200/80 dark:border-white/10 hover:-translate-y-1 hover:border-purple-500/40 transition-all duration-300 group"
          >
            <div className={`inline-flex p-3 rounded-2xl border ${k.bg} ${k.color} mb-3 group-hover:scale-110 transition-transform`}>
              <k.icon size={22} strokeWidth={2.5} />
            </div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">{k.label}</p>
            <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{k.value}</h3>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Requests */}
        <div className="bg-white dark:bg-[#131620]/90 rounded-[32px] p-8 shadow-sm dark:shadow-xl border border-slate-200/80 dark:border-white/10">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-50 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-2xl"><ClipboardList size={24} /></div>
              <h2 className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight">Menunggu Persetujuan</h2>
            </div>
            <Link to="/dosen/advisor-requests" className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full text-slate-600 dark:text-slate-300 transition-colors"><ChevronRight size={20} /></Link>
          </div>
          <div className="space-y-4">
            {pendingRequests?.length > 0 ? pendingRequests.slice(0, 4).map((req) => (
              <Link
                key={req.id}
                to="/dosen/advisor-requests"
                className="group flex flex-col sm:flex-row sm:items-center justify-between p-5 rounded-2xl border border-slate-200/60 dark:border-white/5 bg-slate-50/80 dark:bg-slate-900/50 hover:border-blue-500/30 hover:bg-blue-50/50 dark:hover:bg-slate-800/80 transition-colors gap-4"
              >
                <div className="min-w-0">
                  <h3 className="font-bold text-slate-900 dark:text-white text-lg mb-1 truncate">{req.team?.name || req.team_name}</h3>
                  <div className="flex flex-wrap items-center gap-3 text-sm font-medium text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1.5 bg-slate-200/70 dark:bg-slate-800 px-3 py-1 rounded-full text-slate-700 dark:text-slate-300">
                      <Trophy size={14} /> {req.competition?.name || req.competition_title || '-'}
                    </span>
                    <span>• Ketua: {req.team?.leader?.name || req.team?.leader_name || '-'}</span>
                  </div>
                </div>
                <div className="shrink-0"><StatusBadge status={req.status} labels={ADVISOR_STATUS_LABELS} /></div>
              </Link>
            )) : (
              <div className="py-12 flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-500 mb-4"><CheckCircle2 size={32} /></div>
                <p className="text-slate-500 dark:text-slate-400 font-medium">Tidak ada pengajuan baru</p>
              </div>
            )}
          </div>
        </div>

        {/* My Teams */}
        <div className="bg-white dark:bg-[#131620]/90 rounded-[32px] p-8 shadow-sm dark:shadow-xl border border-slate-200/80 dark:border-white/10">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-50 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 rounded-2xl"><UsersRound size={24} /></div>
              <h2 className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight">Tim Bimbingan</h2>
            </div>
            <Link to="/dosen/my-teams" className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full text-slate-600 dark:text-slate-300 transition-colors"><ChevronRight size={20} /></Link>
          </div>
          <div className="space-y-4">
            {myTeams?.length > 0 ? myTeams.slice(0, 4).map((item) => {
              const team = item.team || item;
              return (
                <Link
                  key={item.id}
                  to={`/dosen/my-teams/${team.id}`}
                  className="group flex items-center justify-between p-4 rounded-2xl border border-slate-200/60 dark:border-white/5 bg-slate-50/80 dark:bg-slate-900/50 hover:border-purple-500/30 hover:bg-purple-50/50 dark:hover:bg-slate-800/80 transition-colors gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-700 text-white flex items-center justify-center font-extrabold text-sm shrink-0">
                      {getInitials(team.name)}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-slate-900 dark:text-white truncate group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">{team.name}</h3>
                      <p className="text-xs font-medium text-slate-500 dark:text-slate-400 truncate">
                        {team.competition?.name || team.competition_title || '-'} • {team.members?.length || 0} anggota
                      </p>
                    </div>
                  </div>
                  <ArrowRight size={16} className="text-slate-400 shrink-0 group-hover:translate-x-1 transition-transform" />
                </Link>
              );
            }) : (
              <div className="py-12 flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-400 mb-4"><UsersRound size={32} /></div>
                <p className="text-slate-500 dark:text-slate-400 font-medium mb-3">Belum membimbing tim</p>
                <Link to="/dosen/self-assign" className="text-sm font-bold text-purple-600 dark:text-purple-400 hover:underline underline-offset-4">
                  Ajukan diri sebagai pembimbing →
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Upcoming Competitions */}
      <div className="bg-white dark:bg-[#131620]/90 rounded-[32px] p-8 shadow-sm dark:shadow-xl border border-slate-200/80 dark:border-white/10">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-amber-50 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded-2xl"><Trophy size={24} /></div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight">Lomba Mendatang & Berlangsung</h2>
          </div>
          <Link to="/dosen/competitions" className="text-sm font-bold text-amber-600 dark:text-amber-400 hover:underline underline-offset-4">Lihat Semua</Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {upcomingCompetitions?.length > 0 ? upcomingCompetitions.slice(0, 6).map((comp) => (
            <Link
              key={comp.id}
              to={`/dosen/competitions/${comp.id}`}
              className="group flex items-center justify-between p-5 rounded-2xl border border-slate-200/60 dark:border-white/5 bg-slate-50/80 dark:bg-slate-900/50 hover:border-amber-500/30 hover:bg-amber-50 dark:hover:bg-slate-800/80 transition-colors"
            >
              <div className="min-w-0">
                <h3 className="font-bold text-slate-900 dark:text-white mb-1 truncate group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">{comp.name || comp.title}</h3>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Clock size={12} /> Batas Daftar: {comp.registration_deadline || '-'}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <StatusBadge status={comp.status} labels={STATUS_LABELS} />
                <div className="w-8 h-8 rounded-full bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center text-slate-400 group-hover:bg-amber-500 group-hover:text-white transition-all">
                  <ArrowUpRight size={15} />
                </div>
              </div>
            </Link>
          )) : (
            <div className="md:col-span-2 py-12 flex flex-col items-center text-center">
              <p className="text-slate-500 dark:text-slate-400 font-medium">Belum ada data lomba</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export { DosenDashboard };
