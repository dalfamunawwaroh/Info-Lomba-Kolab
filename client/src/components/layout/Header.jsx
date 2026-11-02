import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Bell, Menu, Search, Sun, Moon, Settings } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import useUIStore from '@/store/uiStore';
import { getInitials } from '@/utils/helpers';
import notificationService from '@/services/notificationService';
import { AdminProfileModal } from '@/components/admin/AdminProfileModal';

export function Header() {
  const { user, isAdmin } = useAuth();
  const { setSidebarOpen, theme, toggleTheme } = useUIStore();
  const [unreadCount, setUnreadCount] = useState(0);
  const [profileOpen, setProfileOpen] = useState(false);

  const profilePath = `/${user?.role || 'admin'}/profile`;
  const settingsPath = `/${user?.role || 'admin'}/settings`;
  const notificationsPath = `/${user?.role || 'admin'}/notifications`;

  useEffect(() => {
    if (!user) return;
    notificationService.getNotifications()
      .then((res) => setUnreadCount(res.data?.unread_count || 0))
      .catch(() => {});
  }, [user]);

  return (
    <header className="sticky top-0 z-30 flex h-24 items-center justify-between px-6 lg:px-10 bg-white/80 dark:bg-[#0B0D11]/80 backdrop-blur-xl border-b border-slate-200/80 dark:border-white/10 mb-6 transition-all duration-300">
      <div className="flex items-center gap-6 flex-1">
        <button
          onClick={() => setSidebarOpen(true)}
          className="p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-white/10 transition-colors lg:hidden text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 shadow-sm border border-slate-200 dark:border-white/10"
        >
          <Menu size={20} />
        </button>
        
        <div className="hidden md:flex items-center gap-3 bg-slate-100/80 dark:bg-slate-900/90 px-5 py-3 rounded-[16px] border border-slate-200 dark:border-white/10 w-80 shadow-sm focus-within:ring-4 focus-within:ring-[#9333EA]/20 focus-within:border-[#9333EA]/50 transition-all duration-300">
          <Search size={18} className="text-slate-400" />
          <input type="text" placeholder="Cari apapun di sini..." className="bg-transparent border-none outline-none text-[14px] w-full text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 font-medium" />
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Theme Toggle Button */}
        <button 
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Ubah ke Mode Terang (Light Mode)' : 'Ubah ke Mode Gelap (Dark Mode)'}
          className="p-3 rounded-full bg-slate-100 dark:bg-slate-900/80 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:text-[#9333EA] dark:hover:text-purple-400 hover:border-purple-500/40 transition-all duration-300 shadow-sm hover:scale-105"
        >
          {theme === 'dark' ? (
            <Sun size={20} className="text-amber-400 transition-transform duration-500 rotate-0 hover:rotate-90" />
          ) : (
            <Moon size={20} className="text-indigo-600 transition-transform duration-500 rotate-0 hover:-rotate-12" />
          )}
        </button>

        {/* Settings Button → Settings Page */}
        <Link 
          to={settingsPath}
          title="Pengaturan"
          className="p-3 rounded-full bg-slate-100 dark:bg-slate-900/80 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:text-[#9333EA] dark:hover:text-purple-400 hover:border-purple-500/40 transition-all duration-300 shadow-sm hover:scale-105"
        >
          <Settings size={20} className="transition-transform hover:rotate-45" />
        </Link>

        {/* Notification Bell → Notifications Page */}
        <Link 
          to={notificationsPath}
          title="Notifikasi"
          className="relative p-3 rounded-full bg-slate-100 dark:bg-slate-900/80 border border-slate-200 dark:border-white/10 hover:border-purple-500/40 text-slate-700 dark:text-slate-300 transition-all shadow-sm hover:scale-105"
        >
          <Bell size={20} className="transition-transform hover:scale-110" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 border-2 border-white dark:border-slate-900">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </Link>

        <div className="h-10 w-[1px] bg-slate-200 dark:bg-white/10 hidden sm:block"></div>

        {isAdmin ? (
          <button onClick={() => setProfileOpen(true)} className="flex items-center gap-4 cursor-pointer group" title="Profil & Keluar">
            <div className="hidden md:flex flex-col items-end">
              <p className="text-[14px] font-bold text-slate-800 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">{user?.name || 'Admin'}</p>
              <p className="text-[12px] font-semibold text-slate-500 dark:text-slate-400 capitalize mt-0.5">{user?.role || 'admin'}</p>
            </div>
            <div className="h-12 w-12 rounded-[16px] bg-gradient-to-br from-purple-600 to-indigo-700 flex items-center justify-center text-white text-[15px] font-bold shadow-lg shadow-purple-900/30 group-hover:scale-105 transition-transform duration-300 border border-purple-400/30">
              {getInitials(user?.name || 'A')}
            </div>
          </button>
        ) : (
        <Link to={profilePath} className="flex items-center gap-4 cursor-pointer group" title="Buka Profil Saya">
          <div className="hidden md:flex flex-col items-end">
            <p className="text-[14px] font-bold text-slate-800 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">{user?.name || 'Guest User'}</p>
            <p className="text-[12px] font-semibold text-slate-500 dark:text-slate-400 capitalize mt-0.5">{user?.role || 'Role'}</p>
          </div>
          <div className="h-12 w-12 rounded-[16px] bg-gradient-to-br from-purple-600 to-indigo-700 flex items-center justify-center text-white text-[15px] font-bold shadow-lg shadow-purple-900/30 group-hover:scale-105 transition-transform duration-300 border border-purple-400/30">
            {getInitials(user?.name || 'G')}
          </div>
        </Link>
        )}
      </div>
      {isAdmin && <AdminProfileModal open={profileOpen} onClose={() => setProfileOpen(false)} />}
    </header>
  );
}
