import { Bell, Menu, Search } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import useUIStore from '@/store/uiStore';
import { getInitials } from '@/utils/helpers';

export function Header() {
  const { user } = useAuth();
  const { setSidebarOpen } = useUIStore();

  return (
    <header className="sticky top-0 z-30 flex h-24 items-center justify-between px-6 lg:px-10 bg-[#F8FAFC]/90 backdrop-blur-xl border-b border-slate-200/50 mb-6 transition-all">
      <div className="flex items-center gap-6 flex-1">
        <button
          onClick={() => setSidebarOpen(true)}
          className="p-2.5 rounded-xl hover:bg-slate-200/50 transition-colors lg:hidden text-slate-600 bg-white shadow-sm border border-slate-200"
        >
          <Menu size={20} />
        </button>
        
        <div className="hidden md:flex items-center gap-3 bg-white px-5 py-3 rounded-[16px] border border-slate-200/80 w-80 shadow-sm focus-within:ring-4 focus-within:ring-[#9333EA]/10 focus-within:border-[#9333EA]/40 transition-all duration-300">
          <Search size={18} className="text-slate-400" />
          <input type="text" placeholder="Cari apapun di sini..." className="bg-transparent border-none outline-none text-[14px] w-full text-slate-700 placeholder:text-slate-400 font-medium" />
        </div>
      </div>

      <div className="flex items-center gap-5">
        <button className="relative p-3 rounded-full hover:bg-white transition-colors text-slate-500 shadow-sm border border-slate-200/50 hover:shadow-md hover:border-slate-300 bg-white/50">
          <Bell size={20} className="transition-transform hover:scale-110" />
          <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
        </button>

        <div className="h-10 w-[1px] bg-slate-200 hidden sm:block"></div>

        <div className="flex items-center gap-4 cursor-pointer group">
          <div className="hidden md:flex flex-col items-end">
            <p className="text-[14px] font-bold text-slate-800 group-hover:text-[#9333EA] transition-colors">{user?.name || 'Guest User'}</p>
            <p className="text-[12px] font-semibold text-slate-500 capitalize mt-0.5">{user?.role || 'Role'}</p>
          </div>
          <div className="h-12 w-12 rounded-[16px] bg-slate-900 flex items-center justify-center text-white text-[15px] font-bold shadow-lg shadow-slate-900/20 group-hover:scale-105 transition-transform duration-300 border border-slate-800">
            {getInitials(user?.name || 'G')}
          </div>
        </div>
      </div>
    </header>
  );
}
