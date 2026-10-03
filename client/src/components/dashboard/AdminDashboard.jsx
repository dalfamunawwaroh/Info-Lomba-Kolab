import { Link } from 'react-router-dom';
import { Trophy, UsersRound, Building2, ClipboardList, Activity, ArrowUpRight, CheckCircle, Clock } from 'lucide-react';
import { StatusBadge } from '@/components/common/StatusBadge';
import { STATUS_LABELS } from '@/utils/constants';

function AdminDashboard({ stats, pendingSubmissions, upcomingCompetitions }) {
  return (
    <div className="space-y-8 pb-12 animate-fade-in-up">
      {/* Header Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Lomba Aktif', val: stats?.total_competitions, icon: Trophy, color: 'blue' },
          { label: 'Total Tim', val: stats?.total_teams, icon: UsersRound, color: 'purple' },
          { label: 'Pengajuan Baru', val: stats?.pending_submissions, icon: Clock, color: 'amber' },
          { label: 'Mahasiswa Aktif', val: stats?.active_users, icon: Activity, color: 'emerald' },
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-[24px] p-6 shadow-sm border border-slate-200/60 hover:shadow-lg hover:border-slate-300 transition-all group">
            <div className="flex justify-between items-start mb-4">
              <div className={`p-3 rounded-2xl bg-${s.color}-50 text-${s.color}-600 group-hover:scale-110 transition-transform`}><s.icon size={24} /></div>
            </div>
            <p className="text-slate-500 text-sm font-semibold uppercase tracking-wider mb-1">{s.label}</p>
            <h3 className="text-4xl font-extrabold text-slate-900">{s.val || 0}</h3>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Submissions Bento */}
        <div className="bg-white rounded-[32px] p-8 shadow-sm border border-slate-200/60">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl"><ClipboardList size={24} /></div>
              <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Pengajuan Tertunda</h2>
            </div>
            <Link to="/admin/submissions" className="text-sm font-bold text-amber-600 hover:text-amber-700">Lihat Semua</Link>
          </div>
          <div className="space-y-4">
            {pendingSubmissions?.length > 0 ? pendingSubmissions.slice(0,5).map(sub => (
              <div key={sub.id} className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 hover:bg-slate-50 transition-colors">
                <div>
                  <h3 className="font-bold text-slate-900">{sub.team?.name}</h3>
                  <p className="text-sm font-medium text-slate-500">{sub.competition?.name}</p>
                </div>
                <StatusBadge status={sub.status} labels={STATUS_LABELS} />
              </div>
            )) : (
              <div className="py-12 flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mb-4"><CheckCircle size={32} /></div>
                <p className="text-slate-500 font-medium">Semua pengajuan telah ditangani</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions Bento */}
        <div className="bg-[#0F1115] rounded-[32px] p-8 relative overflow-hidden shadow-xl text-white">
          <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none"><Activity size={150} /></div>
          <h2 className="text-2xl font-bold tracking-tight mb-8 relative z-10">Akses Cepat</h2>
          <div className="grid grid-cols-2 gap-4 relative z-10">
            {[
              { to: '/admin/competitions/add', icon: Trophy, label: 'Tambah Lomba Baru', color: 'from-blue-500 to-blue-600' },
              { to: '/admin/users', icon: UsersRound, label: 'Kelola Pengguna', color: 'from-purple-500 to-purple-600' },
              { to: '/admin/startups', icon: Building2, label: 'Manajemen Startup', color: 'from-emerald-500 to-emerald-600' },
              { to: '/admin/submissions', icon: ClipboardList, label: 'Tinjau Laporan', color: 'from-amber-500 to-amber-600' },
            ].map((action, i) => (
              <Link key={i} to={action.to} className={`bg-gradient-to-br ${action.color} p-6 rounded-3xl hover:scale-[1.02] hover:shadow-lg transition-all group flex flex-col h-full justify-between`}>
                <div className="bg-white/20 w-12 h-12 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform"><action.icon size={24} className="text-white" /></div>
                <p className="font-bold text-white text-lg leading-tight">{action.label}</p>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export { AdminDashboard };
