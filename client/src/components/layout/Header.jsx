import { Bell, Menu } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import useUIStore from '@/store/uiStore';
import { getInitials } from '@/utils/helpers';

function Header() {
  const { user } = useAuth();
  const { sidebarOpen, setSidebarOpen } = useUIStore();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-background/80 backdrop-blur-sm px-4 lg:px-6">
      {/* Mobile menu button */}
      <button
        onClick={() => setSidebarOpen(true)}
        className="p-2 rounded-lg hover:bg-accent transition-colors lg:hidden"
        aria-label="Buka menu"
      >
        <Menu size={20} />
      </button>

      <div className="flex-1" />

      <div className="flex items-center gap-3">
        <button className="relative p-2 rounded-lg hover:bg-accent transition-colors group">
          <Bell size={20} className="group-hover:scale-110 transition-transform" />
        </button>

        <div className="flex items-center gap-2.5 pl-2 border-l">
          <div className="h-9 w-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-sm font-semibold shadow-sm">
            {getInitials(user?.name)}
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-medium leading-tight">{user?.name}</p>
            <p className="text-xs text-muted-foreground capitalize">{user?.role}</p>
          </div>
        </div>
      </div>
    </header>
  );
}

export { Header };
