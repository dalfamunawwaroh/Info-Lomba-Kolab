import { Link, Outlet } from 'react-router-dom';
import { Trophy, ArrowLeft, Users, Rocket, Award, Sparkles } from 'lucide-react';

export function AuthLayout() {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center font-sans relative overflow-y-auto py-4 sm:py-8 px-4 bg-slate-100 dark:bg-[#0F172A] transition-colors duration-300">
      {/* Dynamic Animated Background */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        {/* Animated glowing orbs */}
        <div className="absolute top-[10%] left-[20%] w-[550px] h-[550px] bg-purple-600/35 rounded-full mix-blend-screen blur-[120px] animate-pulse-slow" />
        <div className="absolute bottom-[10%] right-[10%] w-[650px] h-[650px] bg-blue-600/35 rounded-full mix-blend-screen blur-[130px] animate-pulse-slow" style={{ animationDelay: '2s' }} />
        <div className="absolute top-[40%] right-[30%] w-[450px] h-[450px] bg-purple-500/25 rounded-full mix-blend-screen blur-[100px] animate-pulse-slow" style={{ animationDelay: '4s' }} />
        
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wNykiLz48L3N2Zz4=')] [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_100%)]" />
      </div>

      {/* Main Container */}
      <div className="relative z-10 w-full max-w-5xl lg:max-w-6xl my-auto animate-slide-up">
        {/* Top Navigation */}
        <div className="mb-3 flex justify-between items-center px-1">
          <Link to="/" className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-300 hover:text-white transition-colors group bg-white/5 backdrop-blur-md px-4 py-1.5 sm:py-2 rounded-full border border-white/10 hover:bg-white/10">
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> 
            Kembali ke Beranda
          </Link>
          <div className="md:hidden">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#6C1B75] to-[#9333EA] flex items-center justify-center text-white">
                <Trophy size={16} />
              </div>
              <span className="text-xl font-extrabold text-white">Ko+Lab</span>
            </Link>
          </div>
        </div>

        {/* The Glass Card Split */}
        <div className="w-full bg-white/95 sm:bg-white/90 backdrop-blur-2xl rounded-3xl sm:rounded-[2rem] shadow-[0_12px_50px_rgba(0,0,0,0.3)] border border-white/60 overflow-hidden relative grid grid-cols-1 md:grid-cols-12">
          
          {/* Left Side Panel (Branding & Highlights) */}
          <div className="hidden md:flex md:col-span-5 bg-gradient-to-br from-[#1E112A] via-[#2A1238] to-[#12081F] text-white p-7 lg:p-9 flex-col justify-between relative overflow-hidden">
            {/* Background Orbs inside panel */}
            <div className="absolute -top-12 -left-12 w-56 h-56 bg-purple-600/30 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-12 -right-12 w-56 h-56 bg-pink-600/30 rounded-full blur-3xl pointer-events-none" />
            
            {/* Top Logo */}
            <div className="relative z-10">
              <Link to="/" className="inline-flex items-center gap-3 group">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#9333EA] to-[#6C1B75] flex items-center justify-center shadow-lg shadow-purple-500/30 group-hover:scale-105 transition-transform ring-4 ring-white/10">
                  <Trophy className="w-6 h-6 text-white" />
                </div>
                <span className="text-2xl font-black tracking-tight text-white">
                  Ko<span className="text-purple-400">+</span>Lab
                </span>
              </Link>
            </div>

            {/* Middle Content & Features */}
            <div className="relative z-10 my-6 space-y-5">
              <div>
                <div className="inline-flex items-center gap-1.5 bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-semibold px-3 py-1 rounded-full mb-3">
                  <Sparkles size={12} /> Platform #1 Mahasiswa
                </div>
                <h2 className="text-2xl lg:text-3xl font-bold text-white leading-tight">
                  Wujudkan Karya & Prestasi Kompetisimu
                </h2>
                <p className="text-xs lg:text-sm text-purple-200/80 mt-2 leading-relaxed">
                  Bentuk tim impian, temukan kompetisi terbaik, dan dapatkan bimbingan dosen mentor terpercaya.
                </p>
              </div>

              {/* Feature Highlights List */}
              <div className="space-y-3 pt-1">
                <div className="flex items-center gap-3 text-xs lg:text-sm text-purple-100/90">
                  <div className="w-7 h-7 rounded-xl bg-purple-500/20 border border-purple-400/30 flex items-center justify-center shrink-0 text-purple-300">
                    <Users size={14} />
                  </div>
                  <span className="font-medium">Cari Anggota Tim & Kolaborasi Antar Jurusan</span>
                </div>
                <div className="flex items-center gap-3 text-xs lg:text-sm text-purple-100/90">
                  <div className="w-7 h-7 rounded-xl bg-purple-500/20 border border-purple-400/30 flex items-center justify-center shrink-0 text-purple-300">
                    <Award size={14} />
                  </div>
                  <span className="font-medium">Bimbingan Langsung dari Dosen Mentor</span>
                </div>
                <div className="flex items-center gap-3 text-xs lg:text-sm text-purple-100/90">
                  <div className="w-7 h-7 rounded-xl bg-purple-500/20 border border-purple-400/30 flex items-center justify-center shrink-0 text-purple-300">
                    <Rocket size={14} />
                  </div>
                  <span className="font-medium">Terhubung dengan Ekosistem Startup</span>
                </div>
              </div>
            </div>

            {/* Bottom Footer */}
            <div className="relative z-10 pt-3 border-t border-white/10 text-xs text-purple-300/70">
              Platform Kolaborasi Lomba & Startup Indonesia
            </div>
          </div>

          {/* Right Side Panel (Form Content) */}
          <div className="md:col-span-7 p-6 sm:p-8 lg:p-9 relative z-10 flex flex-col justify-center">
            {/* Form Content */}
            <Outlet />
          </div>
        </div>
        
        {/* Footer info */}
        <div className="text-center mt-4">
          <p className="text-xs text-slate-400 font-medium">
            © {new Date().getFullYear()} Ko+Lab. Platform #1 Mahasiswa Berkarya.
          </p>
        </div>
      </div>
    </div>
  );
}