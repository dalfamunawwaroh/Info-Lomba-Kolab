import { Outlet, Link } from 'react-router-dom';
import { ToastContainer } from '@/components/common/Toast';
import { Trophy, Users, GraduationCap, Star, Sparkles, ArrowLeft, Shield } from 'lucide-react';

function AuthLayout() {
  return (
    <div className="min-h-screen flex" style={{ fontFamily: "'Josefin Sans', sans-serif" }}>
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-[45%] relative auth-bg overflow-hidden">
        {/* Animated blobs */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-blob" />
        <div className="absolute -bottom-32 -right-32 w-[500px] h-[500px] bg-white/10 rounded-full blur-3xl animate-blob" style={{ animationDelay: '3s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-white/5 rounded-full blur-2xl animate-blob" style={{ animationDelay: '5s' }} />

        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-[0.04]" style={{
          backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
          backgroundSize: '30px 30px'
        }} />

        {/* Floating icons */}
        {[
          { Icon: Trophy, top: '15%', left: '15%', delay: '0s', size: 24 },
          { Icon: Star, top: '30%', right: '20%', delay: '1s', size: 20 },
          { Icon: GraduationCap, bottom: '25%', left: '20%', delay: '2s', size: 22 },
          { Icon: Users, bottom: '15%', right: '15%', delay: '0.5s', size: 18 },
          { Icon: Shield, top: '55%', left: '10%', delay: '1.5s', size: 20 },
          { Icon: Sparkles, top: '20%', left: '55%', delay: '2.5s', size: 16 },
        ].map((p, i) => (
          <div
            key={i}
            className="absolute animate-parallax"
            style={{ top: p.top, left: p.left, right: p.right, bottom: p.bottom, animationDelay: p.delay }}
          >
            <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/10">
              <p.Icon className="text-white/40" size={p.size} />
            </div>
          </div>
        ))}

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between w-full p-12">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group w-fit">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover:bg-white/30 transition-colors">
              <Trophy className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white tracking-tight">
              Info Lomba <span className="text-white/70">Ko+Lab</span>
            </span>
          </Link>

          {/* Center text */}
          <div className="animate-fade-in">
            <h2 className="text-4xl font-bold text-white leading-tight mb-4">
              Wujudkan Prestasi<br />
              <span className="text-amber-200">Bersama Ko+Lab</span>
            </h2>
            <p className="text-white/60 text-lg leading-relaxed max-w-md">
              Ekosistem terpadu untuk mahasiswa, dosen, dan admin — temukan lomba, bentuk tim,
              dan raih prestasi dalam satu platform.
            </p>

            {/* Mini stats */}
            <div className="mt-10 grid grid-cols-3 gap-6">
              {[
                { val: '50+', label: 'Lomba' },
                { val: '200+', label: 'Mahasiswa' },
                { val: '80+', label: 'Tim' },
              ].map((s, i) => (
                <div key={i} className="text-center">
                  <p className="text-2xl font-bold text-white">{s.val}</p>
                  <p className="text-xs text-white/50 mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom quote */}
          <div className="animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <blockquote className="text-white/40 text-sm italic">
              "Platform yang mengubah cara civitas akademika berkompetisi."
            </blockquote>
          </div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8 bg-gray-50 relative min-h-screen">
        {/* Subtle background decoration */}
        <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-[#6C1B75]/5 rounded-full blur-[80px]" />
        <div className="absolute bottom-0 left-0 w-[200px] h-[200px] bg-[#9333EA]/5 rounded-full blur-[60px]" />

        <div className="relative z-10 w-full max-w-md">
          {/* Back to home (mobile) */}
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-[#6C1B75] transition-colors mb-6 lg:hidden"
          >
            <ArrowLeft size={14} /> Kembali ke beranda
          </Link>

          {/* Mobile logo */}
          <div className="text-center mb-8 lg:hidden animate-fade-in-down">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-[#6C1B75] to-[#9333EA] mb-3 shadow-lg shadow-[#6C1B75]/20">
              <Trophy className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Info Lomba</h1>
            <p className="text-[#6C1B75] font-medium text-sm">Ko+Lab</p>
          </div>

          {/* Desktop: back link above card */}
          <Link
            to="/"
            className="hidden lg:inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-[#6C1B75] transition-colors mb-6"
          >
            <ArrowLeft size={14} /> Kembali ke beranda
          </Link>

          {/* Card */}
          <div className="bg-white rounded-2xl shadow-xl shadow-black/5 border border-gray-100 animate-scale-in overflow-hidden">
            <Outlet />
          </div>

          {/* Footer */}
          <p className="text-center text-muted-foreground/50 text-xs mt-6 animate-fade-in" style={{ animationDelay: '0.3s' }}>
            &copy; 2026 Ko+Lab. Semua hak dilindungi.
          </p>
        </div>

        <ToastContainer />
      </div>
    </div>
  );
}

export { AuthLayout };