import { Link, Outlet } from 'react-router-dom';
import { Trophy, ArrowLeft } from 'lucide-react';

export function AuthLayout() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center font-sans relative overflow-hidden bg-[#0F172A]">
      {/* Dynamic Animated Background */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        {/* Animated glowing orbs */}
        <div className="absolute top-[10%] left-[20%] w-[500px] h-[500px] bg-purple-600/40 rounded-full mix-blend-screen blur-[120px] animate-pulse-slow" />
        <div className="absolute bottom-[10%] right-[10%] w-[600px] h-[600px] bg-blue-600/40 rounded-full mix-blend-screen blur-[130px] animate-pulse-slow" style={{ animationDelay: '2s' }} />
        <div className="absolute top-[40%] right-[30%] w-[400px] h-[400px] bg-amber-500/30 rounded-full mix-blend-screen blur-[100px] animate-pulse-slow" style={{ animationDelay: '4s' }} />
        <div className="absolute bottom-[20%] left-[30%] w-[450px] h-[450px] bg-rose-500/30 rounded-full mix-blend-screen blur-[110px] animate-pulse-slow" style={{ animationDelay: '1s' }} />
        
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wNykiLz48L3N2Zz4=')] [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_100%)]" />
      </div>

      {/* Main Glass Card */}
      <div className="relative z-10 w-full max-w-xl p-4 sm:p-6 lg:p-8 animate-slide-up">
        {/* Top Action */}
        <div className="mb-6 flex justify-between items-center px-2">
          <Link to="/" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-300 hover:text-white transition-colors group bg-white/5 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 hover:bg-white/10">
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> 
            Kembali ke Beranda
          </Link>
        </div>

        {/* The Card */}
        <div className="w-full bg-white/80 backdrop-blur-2xl rounded-[2.5rem] shadow-[0_8px_40px_rgba(0,0,0,0.12)] border border-white/60 overflow-hidden relative">
          
          {/* Card Header Pattern */}
          <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-br from-purple-500/10 via-transparent to-blue-500/10 pointer-events-none" />
          
          <div className="px-6 py-10 sm:px-12 sm:py-12 relative z-10">
            <div className="flex justify-center mb-8">
              <Link to="/" className="flex items-center gap-3 group transition-all">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#6C1B75] to-[#9333EA] flex items-center justify-center shadow-lg shadow-purple-500/30 group-hover:shadow-purple-500/50 group-hover:scale-110 transition-all duration-300 ring-4 ring-purple-500/20">
                  <Trophy className="w-7 h-7 text-white" />
                </div>
                <span className="text-3xl font-black tracking-tight text-slate-900 bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700">
                  Ko+Lab
                </span>
              </Link>
            </div>

            {/* Form Content */}
            <Outlet />
          </div>
        </div>
        
        {/* Footer info */}
        <div className="text-center mt-8">
          <p className="text-sm text-slate-400 font-medium">
            © {new Date().getFullYear()} Ko+Lab. Platform #1 Mahasiswa Berkarya.
          </p>
        </div>
      </div>
    </div>
  );
}