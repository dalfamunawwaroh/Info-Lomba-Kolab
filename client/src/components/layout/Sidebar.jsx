import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import {
  LayoutDashboard, Users, Building2, Trophy, UsersRound,
  FileText, ClipboardList, History, ChevronLeft, ChevronRight, LogOut, X, Send
} from 'lucide-react';
import useUIStore from '@/store/uiStore';
import { getInitials } from '@/utils/helpers';

const adminMenu = [
  { to: '/admin', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/admin/users', icon: Users, label: 'Kelola User' },
  { to: '/admin/startups', icon: Building2, label: 'Kelola Startup' },
  { to: '/admin/competitions', icon: Trophy, label: 'Kelola Lomba' },
  { to: '/admin/teams', icon: UsersRound, label: 'Kelola Tim' },
  { to: '/admin/submissions', icon: ClipboardList, label: 'Pengajuan' },
  { to: '/admin/directory', icon: Users, label: 'Direktori' },
];

const dosenMenu = [
  { to: '/dosen', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/dosen/competitions', icon: Trophy, label: 'Info Lomba' },
  { to: '/dosen/competitions/add', icon: FileText, label: 'Tambah Lomba' },
  { to: '/dosen/advisor-requests', icon: ClipboardList, label: 'Pengajuan Masuk' },
  { to: '/dosen/my-teams', icon: UsersRound, label: 'Tim Bimbingan' },
  { to: '/dosen/self-assign', icon: Send, label: 'Ajukan Diri' },
  { to: '/dosen/team-change-requests', icon: ClipboardList, label: 'Ajukan Perubahan' },
  { to: '/dosen/history', icon: History, label: 'History' },
  { to: '/dosen/directory', icon: Users, label: 'Direktori' },
];

const mahasiswaMenu = [
  { to: '/mahasiswa', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/mahasiswa/competitions', icon: Trophy, label: 'Daftar Lomba' },
  { to: '/mahasiswa/history', icon: History, label: 'History' },
  { to: '/mahasiswa/directory', icon: Users, label: 'Direktori' },
];

function Sidebar() {
  const { user, logout, isAdmin, isDosen } = useAuth();
  const { sidebarOpen, toggleSidebar, setSidebarOpen } = useUIStore();
  
  const menuItems = isAdmin ? adminMenu : isDosen ? dosenMenu : mahasiswaMenu;

  return (
    <>
      {sidebarOpen && <div className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm lg:hidden" onClick={() => setSidebarOpen(false)} />}

      <aside className={`fixed left-0 top-0 z-50 h-screen bg-[#0F1115] border-r border-white/5 text-slate-300 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] flex flex-col ${sidebarOpen ? 'w-[280px] translate-x-0' : 'w-0 -translate-x-full lg:w-[88px] lg:translate-x-0'}`}>
        
        {/* Logo Area */}
        <div className="h-24 flex items-center px-6 shrink-0 border-b border-white/5">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <div className="w-10 h-10 rounded-[14px] bg-gradient-to-br from-[#6C1B75] to-[#9333EA] flex items-center justify-center shrink-0 shadow-[0_0_20px_rgba(147,51,234,0.3)]">
              <Trophy className="w-5 h-5 text-white" />
            </div>
            <span className={`text-[20px] font-extrabold text-white tracking-wide transition-opacity duration-300 ${!sidebarOpen && 'lg:opacity-0'}`}>
              Ko+Lab
            </span>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="p-2 rounded-lg hover:bg-white/10 text-slate-400 lg:hidden">
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-8 px-4 custom-scrollbar">
          <ul className="space-y-1.5">
            {menuItems.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.end}
                  onClick={() => window.innerWidth < 1024 && setSidebarOpen(false)}
                  className={({ isActive }) => `flex items-center gap-4 px-4 py-3.5 rounded-xl text-[14.5px] font-medium transition-all duration-200 group ${isActive ? 'bg-[#9333EA]/10 text-white' : 'text-slate-400 hover:text-slate-100 hover:bg-white/5'}`}
                >
                  {({ isActive }) => (
                    <>
                      <item.icon size={20} className={`shrink-0 transition-transform duration-300 ${isActive ? 'text-[#9333EA]' : 'group-hover:scale-110 group-hover:text-slate-300'}`} />
                      <span className={`truncate transition-opacity duration-300 ${!sidebarOpen && 'lg:hidden'}`}>{item.label}</span>
                      {isActive && sidebarOpen && <div className="absolute left-0 w-[3px] h-8 bg-[#9333EA] rounded-r-full" />}
                    </>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* Footer / User Profile */}
        <div className="p-4 border-t border-white/5 shrink-0 flex flex-col gap-2">
          <button onClick={toggleSidebar} className={`hidden lg:flex items-center gap-4 px-4 py-3 rounded-xl text-[14.5px] font-medium text-slate-400 hover:text-white hover:bg-white/5 transition-all duration-200 ${!sidebarOpen && 'justify-center'}`}>
            {sidebarOpen ? <ChevronLeft size={20} className="shrink-0" /> : <ChevronRight size={20} className="shrink-0" />}
            <span className={`truncate ${!sidebarOpen && 'hidden'}`}>Kecilkan</span>
          </button>
          
          <div className={`flex items-center gap-4 px-4 py-3 rounded-xl bg-white/5 border border-white/5 mt-2 ${!sidebarOpen && 'lg:justify-center lg:px-0'}`}>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center shrink-0 border border-white/10 text-white text-xs font-bold">
              {getInitials(user?.name)}
            </div>
            <div className={`flex-1 min-w-0 transition-opacity duration-300 ${!sidebarOpen && 'lg:hidden'}`}>
              <p className="text-[14px] font-bold text-white truncate">{user?.name}</p>
              <p className="text-[11px] text-slate-400 uppercase tracking-wider mt-0.5 font-semibold">{user?.role}</p>
            </div>
            <button onClick={logout} className={`p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors ${!sidebarOpen && 'lg:hidden'}`}>
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

export { Sidebar };
