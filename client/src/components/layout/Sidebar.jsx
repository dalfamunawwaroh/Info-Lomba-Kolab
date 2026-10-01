import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import {
  LayoutDashboard, Users, Building2, Trophy, UsersRound,
  FileText, ClipboardList, History, UserCircle, ChevronLeft,
  ChevronRight, LogOut, X, Send
} from 'lucide-react';
import useUIStore from '@/store/uiStore';

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
  const location = useLocation();

  const menuItems = isAdmin ? adminMenu : isDosen ? dosenMenu : mahasiswaMenu;
  const basePath = isAdmin ? '/admin' : isDosen ? '/dosen' : '/mahasiswa';

  // Close mobile sidebar on navigation
  const handleNavClick = () => {
    if (window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  };

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 sidebar-overlay lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed left-0 top-0 z-40 h-screen bg-sidebar text-sidebar-foreground border-r transition-all duration-300 ease-in-out flex flex-col
          ${sidebarOpen ? 'w-64 translate-x-0' : 'w-0 -translate-x-full lg:w-16 lg:translate-x-0'}
        `}
      >
        {/* Logo */}
        <div className="flex items-center h-16 px-4 border-b border-sidebar-accent shrink-0">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center shrink-0">
              <Trophy className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-lg font-bold text-white truncate">Info Lomba</h1>
          </div>
          {/* Mobile close */}
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-1.5 rounded-md hover:bg-sidebar-accent text-gray-400 hover:text-white lg:hidden"
          >
            <X size={18} />
          </button>
          {/* Desktop collapse */}
          <button
            onClick={toggleSidebar}
            className="hidden lg:flex p-1.5 rounded-md hover:bg-sidebar-accent text-gray-400 hover:text-white"
          >
            {sidebarOpen ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
          </button>
        </div>

        {/* User info */}
        <div className="px-4 py-3 border-b border-sidebar-accent shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-sm font-semibold shrink-0">
              {user?.name?.charAt(0)?.toUpperCase() || '?'}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-white truncate">{user?.name}</p>
              <p className="text-xs text-gray-400 capitalize">{user?.role}</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-2">
          <ul className="space-y-0.5">
            {menuItems.map((item, index) => (
              <li key={item.to} style={{ animationDelay: `${index * 30}ms` }}>
                <NavLink
                  to={item.to}
                  end={item.end}
                  onClick={handleNavClick}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 group ${
                      isActive
                        ? 'bg-sidebar-accent text-white font-medium shadow-sm'
                        : 'text-gray-400 hover:text-white hover:bg-sidebar-accent/50'
                    }`
                  }
                >
                  <item.icon size={18} className="shrink-0 transition-transform group-hover:scale-110" />
                  <span className="truncate">{item.label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* Bottom actions */}
        <div className="border-t border-sidebar-accent p-2 shrink-0">
          <NavLink
            to={`${basePath}/profile`}
            onClick={handleNavClick}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 ${
                isActive
                  ? 'bg-sidebar-accent text-white'
                  : 'text-gray-400 hover:text-white hover:bg-sidebar-accent/50'
              }`
            }
          >
            <UserCircle size={18} className="shrink-0" />
            <span>Profil</span>
          </NavLink>
          <button
            onClick={logout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-400 hover:text-red-400 hover:bg-red-500/10 w-full transition-all duration-200"
          >
            <LogOut size={18} className="shrink-0" />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}

export { Sidebar };
