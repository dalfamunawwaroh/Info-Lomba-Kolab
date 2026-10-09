import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Trophy, UsersRound, Building2, ClipboardList, Activity, ArrowUpRight, CheckCircle, Clock, Megaphone, Send } from 'lucide-react';
import { StatusBadge } from '@/components/common/StatusBadge';
import { STATUS_LABELS } from '@/utils/constants';

function AdminDashboard({ stats, pendingSubmissions, upcomingCompetitions }) {
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastStatus, setBroadcastStatus] = useState('');

  const handleBroadcast = (e) => {
    e.preventDefault();
    if (!broadcastTitle || !broadcastMessage) return;
    setBroadcastStatus('sending');
    // Simulate API call
    setTimeout(() => {
      setBroadcastStatus('success');
      setBroadcastTitle('');
      setBroadcastMessage('');
      setTimeout(() => setBroadcastStatus(''), 3000);
    }, 1000);
  };

  return (
    <div className="space-y-6 pb-12 animate-fade-in-up">
      
      {/* Header Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Lomba Aktif', val: stats?.total_competitions, icon: Trophy, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-500/10 dark:bg-blue-500/20 border-blue-500/20 dark:border-blue-500/30' },
          { label: 'Total Tim', val: stats?.total_teams, icon: UsersRound, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-500/10 dark:bg-purple-500/20 border-purple-500/20 dark:border-purple-500/30' },
          { label: 'Pengajuan Baru', val: stats?.pending_submissions, icon: Clock, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500/10 dark:bg-amber-500/20 border-amber-500/20 dark:border-amber-500/30' },
          { label: 'Mahasiswa Aktif', val: stats?.active_users, icon: Activity, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/10 dark:bg-emerald-500/20 border-emerald-500/20 dark:border-emerald-500/30' },
        ].map((s, i) => (
          <div key={i} className="bg-white dark:bg-[#131620]/90 backdrop-blur-xl rounded-[28px] p-6 shadow-sm dark:shadow-xl border border-slate-200/80 dark:border-white/10 hover:border-purple-500/40 hover:-translate-y-1 transition-all duration-300 group">
            <div className="flex justify-between items-start mb-4">
              <div className={`p-3.5 rounded-2xl border ${s.bg} ${s.color} group-hover:scale-110 transition-transform duration-300`}><s.icon size={26} strokeWidth={2.5} /></div>
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-[13px] font-bold uppercase tracking-wider mb-1">{s.label}</p>
            <h3 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">{s.val || 0}</h3>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pending Submissions Bento (Spans 2 columns) */}
        <div className="lg:col-span-2 bg-white dark:bg-[#131620]/90 backdrop-blur-xl rounded-[32px] p-8 shadow-sm dark:shadow-xl border border-slate-200/80 dark:border-white/10">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/20 dark:border-amber-500/30 rounded-2xl"><ClipboardList size={24} strokeWidth={2.5} /></div>
              <h2 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">Pengajuan Tertunda</h2>
            </div>
            <Link to="/admin/submissions" className="text-sm font-bold text-amber-600 dark:text-amber-400 hover:underline underline-offset-4">Lihat Semua</Link>
          </div>
          <div className="space-y-4">
            {pendingSubmissions?.length > 0 ? pendingSubmissions.slice(0,5).map(sub => (
              <div key={sub.id} className="group flex items-center justify-between p-5 rounded-[20px] border border-slate-200/60 dark:border-white/5 bg-slate-50/80 dark:bg-slate-900/50 hover:bg-white dark:hover:bg-slate-800/80 hover:border-purple-500/30 transition-all duration-300 cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-300 font-bold border border-slate-300 dark:border-white/10">
                    {sub.team?.name?.charAt(0) || 'T'}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">{sub.team?.name}</h3>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{sub.competition?.name}</p>
                  </div>
                </div>
                <StatusBadge status={sub.status} labels={STATUS_LABELS} />
              </div>
            )) : (
              <div className="py-12 flex flex-col items-center text-center">
                <div className="w-20 h-20 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-[24px] flex items-center justify-center text-emerald-500 dark:text-emerald-400 mb-5 shadow-inner"><CheckCircle size={40} /></div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-1">Semua Selesai!</h3>
                <p className="text-slate-500 dark:text-slate-400 font-medium text-sm">Tidak ada pengajuan yang perlu ditinjau saat ini.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Quick Actions & Broadcast */}
        <div className="space-y-6">
          {/* Quick Actions Bento */}
          <div className="bg-white dark:bg-[#0F1115] border border-slate-200/80 dark:border-white/5 rounded-[32px] p-7 relative overflow-hidden shadow-sm dark:shadow-xl text-slate-900 dark:text-white transition-colors duration-300">
            <div className="absolute top-[-20%] right-[-10%] p-8 opacity-10 dark:opacity-20 pointer-events-none blur-[2px] rotate-12"><Activity size={180} /></div>
            <h2 className="text-xl font-black tracking-tight mb-6 relative z-10 text-slate-900 dark:text-white">Akses Cepat</h2>
            <div className="grid grid-cols-2 gap-3 relative z-10">
              {[
                { to: '/admin/competitions/add', icon: Trophy, label: 'Lomba Baru', color: 'from-blue-500 to-indigo-600' },
                { to: '/admin/users', icon: UsersRound, label: 'Pengguna', color: 'from-purple-500 to-fuchsia-600' },
                { to: '/admin/startups', icon: Building2, label: 'Startup', color: 'from-emerald-400 to-teal-500' },
                { to: '/admin/submissions', icon: ClipboardList, label: 'Laporan', color: 'from-amber-400 to-orange-500' },
              ].map((action, i) => (
                <Link key={i} to={action.to} className={`bg-gradient-to-br ${action.color} p-5 rounded-[24px] hover:scale-[1.03] hover:shadow-xl transition-all duration-300 group flex flex-col items-center text-center gap-3`}>
                  <div className="bg-white/25 w-12 h-12 rounded-[18px] flex items-center justify-center group-hover:-translate-y-1 transition-transform backdrop-blur-sm"><action.icon size={22} className="text-white" strokeWidth={2.5} /></div>
                  <p className="font-bold text-white text-[13px] leading-tight">{action.label}</p>
                </Link>
              ))}
            </div>
          </div>

          {/* Quick Broadcast Form */}
          <div className="bg-gradient-to-br from-indigo-500 via-purple-500 to-fuchsia-500 rounded-[32px] p-7 shadow-lg relative overflow-hidden text-white">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
            <div className="flex items-center gap-3 mb-6 relative z-10">
              <div className="p-2.5 bg-white/20 rounded-xl backdrop-blur-md"><Megaphone size={20} strokeWidth={2.5} /></div>
              <h2 className="text-xl font-black tracking-tight">Kirim Pengumuman</h2>
            </div>
            
            <form onSubmit={handleBroadcast} className="relative z-10 space-y-3">
              <input 
                type="text" 
                placeholder="Judul Pengumuman" 
                value={broadcastTitle}
                onChange={(e) => setBroadcastTitle(e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-sm text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50 backdrop-blur-sm transition-all"
                required
              />
              <textarea 
                placeholder="Isi pesan (mendukung markdown dasar)..." 
                rows="3"
                value={broadcastMessage}
                onChange={(e) => setBroadcastMessage(e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-sm text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50 backdrop-blur-sm transition-all resize-none custom-scrollbar"
                required
              />
              <button 
                type="submit" 
                disabled={broadcastStatus === 'sending'}
                className="w-full bg-white text-purple-600 hover:bg-slate-50 font-bold text-sm px-4 py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-70"
              >
                {broadcastStatus === 'sending' ? (
                  <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"/> Mengirim...</span>
                ) : broadcastStatus === 'success' ? (
                  <span className="flex items-center gap-2 text-emerald-600"><CheckCircle size={16}/> Terkirim</span>
                ) : (
                  <span className="flex items-center gap-2">Kirim Broadcast <Send size={16}/></span>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export { AdminDashboard };
