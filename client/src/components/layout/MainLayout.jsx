import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { ToastContainer } from '@/components/common/Toast';
import useUIStore from '@/store/uiStore';

function MainLayout() {
  const sidebarOpen = useUIStore((s) => s.sidebarOpen);

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className={`transition-all duration-300 ease-in-out ${
        sidebarOpen ? 'lg:ml-64' : 'lg:ml-16'
      }`}>
        <Header />
        <main className="p-4 lg:p-6 page-enter">
          <Outlet />
        </main>
      </div>
      <ToastContainer />
    </div>
  );
}

export { MainLayout };
