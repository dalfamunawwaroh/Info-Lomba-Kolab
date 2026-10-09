import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { ToastContainer } from '@/components/common/Toast';
import useUIStore from '@/store/uiStore';

export function MainLayout() {
  const sidebarOpen = useUIStore((s) => s.sidebarOpen);

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B0D11] text-slate-900 dark:text-slate-100 font-sans flex font-inter selection:bg-[#9333EA]/30 transition-colors duration-300">
      <Sidebar />
      <div className={`relative flex-1 flex flex-col min-h-screen transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
        sidebarOpen ? 'lg:pl-[280px]' : 'lg:pl-[88px]'
      }`}>
        <Header />
        <main className="flex-1 p-6 lg:p-10 pt-2 lg:pt-4 max-w-[1600px] w-full mx-auto relative z-10 animate-fade-in-up">
          <Outlet />
        </main>
      </div>
      <ToastContainer />
    </div>
  );
}
