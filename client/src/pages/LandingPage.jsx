import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Trophy, Users, GraduationCap, Search, ArrowRight, ArrowDown,
  Shield, Zap, BarChart3, ChevronDown, Lightbulb, Heart,
  Globe, Rocket, CheckCircle2, Sparkles, Star, Award,
  Clock, TrendingUp, MessageSquare, Quote, Building2,
  Layers, PieChart, Bell, FileText, UserCheck, ArrowUpRight,
  Menu, X, Target, ClipboardCheck,
  GitBranch, Cloud, Lock, Eye
} from 'lucide-react';

/* ═══════════════════════════════════════════════════════════
   GRADIENT MAP — used by GradIcon and inline styles
   ═══════════════════════════════════════════════════════════ */

const GRADIENTS = {
  'blue-cyan': 'linear-gradient(135deg, #3b82f6, #22d3ee)',
  'emerald-teal': 'linear-gradient(135deg, #10b981, #2dd4bf)',
  'brand-purple': 'linear-gradient(135deg, #6C1B75, #9333EA)',
  'amber-orange': 'linear-gradient(135deg, #f59e0b, #fb923c)',
  'rose-pink': 'linear-gradient(135deg, #f43f5e, #f472b6)',
  'indigo-blue': 'linear-gradient(135deg, #6366f1, #3b82f6)',
};

/* ═══════════════════════════════════════════════════════════
   JSON DATA — Edit konten di sini
   ═══════════════════════════════════════════════════════════ */

const SITE_DATA = {
  brand: {
    name: 'Info Lomba Ko+Lab',
    tagline: 'Platform Kompetisi Akademik #1',
    description: 'Ekosistem terpadu untuk mahasiswa, dosen, dan admin — temukan lomba, bentuk tim, dan raih prestasi dalam satu platform.',
  },
  stats: [
    { value: 50, suffix: '+', label: 'Lomba Terdaftar', icon: Trophy, grad: 'blue-cyan', bg: 'bg-blue-50', text: 'text-blue-600' },
    { value: 200, suffix: '+', label: 'Mahasiswa Aktif', icon: GraduationCap, grad: 'emerald-teal', bg: 'bg-emerald-50', text: 'text-emerald-600' },
    { value: 30, suffix: '+', label: 'Dosen Pembimbing', icon: Shield, grad: 'brand-purple', bg: 'bg-purple-50', text: 'text-brand-600' },
    { value: 80, suffix: '+', label: 'Tim Terbentuk', icon: Users, grad: 'amber-orange', bg: 'bg-amber-50', text: 'text-amber-600' },
  ],
  features: [
    { icon: Search, title: 'Temukan Lomba', desc: 'Jelajahi ratusan kompetisi nasional & internasional yang dikurasi sesuai minat dan keahlianmu.', grad: 'blue-cyan', span: 'md:col-span-2', highlight: true },
    { icon: Users, title: 'Bangun Tim', desc: 'Cari rekan dari berbagai jurusan dan bentuk tim impian untuk kompetisi.', grad: 'emerald-teal' },
    { icon: GraduationCap, title: 'Bimbingan Dosen', desc: 'Arahan langsung dari dosen pembimbing berpengalaman di bidangnya.', grad: 'brand-purple' },
    { icon: BarChart3, title: 'Dashboard Analitik', desc: 'Pantau progress tim, statistik lomba, dan pencapaian secara real-time.', grad: 'amber-orange', span: 'md:col-span-2', highlight: true },
    { icon: Bell, title: 'Notifikasi Real-time', desc: 'Dapatkan update instan tentang pengajuan, persetujuan, dan deadline.', grad: 'rose-pink' },
    { icon: Zap, title: 'Cepat & Intuitif', desc: 'Antarmuka modern yang responsif — daftar lomba dalam hitungan detik.', grad: 'indigo-blue' },
  ],
  featureSpotlight: [
    {
      title: 'Pencarian Lomba Cerdas',
      desc: 'Filter berdasarkan bidang, tingkat kesulitan, tanggal, dan lokasi. Sistem rekomendasi kami belajar dari preferensimu untuk menyarankan lomba yang paling cocok.',
      icon: Search,
      bullets: ['Filter multi-kategori', 'Rekomendasi berbasis AI', 'Bookmark & reminder deadline', 'Notifikasi lomba baru'],
      grad: 'blue-cyan',
      direction: 'left',
    },
    {
      title: 'Manajemen Tim Terintegrasi',
      desc: 'Buat tim, undang anggota, atur peran, dan koordinasi semuanya dalam satu dashboard. Kolaborasi lintas jurusan dan lintas angkatan.',
      icon: Users,
      bullets: ['Undang via email/link', 'Atur peran & tanggung jawab', 'Chat internal tim', 'Dashboard progress bersama'],
      grad: 'emerald-teal',
      direction: 'right',
    },
    {
      title: 'Alur Persetujuan Bertingkat',
      desc: 'Setiap pengajuan melewati alur yang terstruktur — dari dosen pembimbing hingga admin. Transparan, terdokumentasi, dan efisien.',
      icon: ClipboardCheck,
      bullets: ['Pengajuan satu klik', 'Tracking status real-time', 'Riwayat persetujuan lengkap', 'Notifikasi otomatis'],
      grad: 'brand-purple',
      direction: 'left',
    },
  ],
  steps: [
    { num: '01', icon: UserCheck, title: 'Daftar & Profil', desc: 'Buat akun sesuai peranmu (mahasiswa/dosen) dan lengkapi profil akademik.', grad: 'brand-purple' },
    { num: '02', icon: Search, title: 'Jelajahi Lomba', desc: 'Temukan kompetisi sesuai minat, bidang, dan tingkat keahlianmu.', grad: 'brand-purple' },
    { num: '03', icon: GitBranch, title: 'Bentuk Tim', desc: 'Ajukan tim, pilih dosen pembimbing, dan daftarkan diri ke lomba.', grad: 'brand-purple' },
    { num: '04', icon: Rocket, title: 'Berprestasi!', desc: 'Ikuti kompetisi, dapatkan bimbingan, dan raih prestasi terbaik.', grad: 'brand-purple' },
  ],
  reasons: [
    { icon: Clock, title: 'Hemat Waktu', desc: 'Semua info lomba terpusat di satu platform.', stat: '70%', statLabel: 'Lebih cepat', grad: 'brand-purple' },
    { icon: TrendingUp, title: 'Tingkatkan Prestasi', desc: 'Partisipasi lomba meningkat signifikan.', stat: '3x', statLabel: 'Lebih aktif', grad: 'brand-purple' },
    { icon: UserCheck, title: 'Bimbingan Terarah', desc: 'Dosen sesuai bidang keahlian tim.', stat: '95%', statLabel: 'Kepuasan', grad: 'brand-purple' },
    { icon: Layers, title: 'Ekosistem Terintegrasi', desc: 'Dari pencarian hingga pelaporan.', stat: '100%', statLabel: 'Terintegrasi', grad: 'brand-purple' },
  ],
  roles: [
    {
      role: 'Mahasiswa',
      icon: GraduationCap,
      grad: 'emerald-teal',
      items: ['Cari & daftar lomba favorit', 'Bentuk tim lintas jurusan', 'Ajukan dosen pembimbing', 'Riwayat & statistik partisipasi'],
    },
    {
      role: 'Dosen',
      icon: Shield,
      grad: 'brand-purple',
      items: ['Buat & kelola lomba', 'Terima/tolak bimbingan', 'Pantau progress tim', 'Dashboard analitik lengkap'],
    },
  ],
  testimonials: [
    { name: 'Rina Wijaya', role: 'Mahasiswa Informatika', text: 'Ko+Lab mengubah cara saya mencari lomba. Tim saya juara 2 kompetisi nasional berkat platform ini!', avatar: 'RW', rating: 5 },
    { name: 'Dr. Budi Santoso', role: 'Dosen Pembimbing', text: 'Sistem pengajuannya terstruktur dan menghemat banyak waktu koordinasi. Sangat recommended untuk dosen.', avatar: 'BS', rating: 5 },
    { name: 'Ahmad Fadhil', role: 'Mahasiswa SI', text: 'Fitur tim lintas jurusan sangat membantu. Dashboard analitiknya insightful dan mudah dipahami.', avatar: 'AF', rating: 5 },
    { name: 'Siti Nurhaliza', role: 'Mahasiswa DKV', text: 'Antarmukanya modern dan intuitif. Platform yang bikin urusan lomba jadi gampang dan menyenangkan.', avatar: 'SN', rating: 4 },
    { name: 'Dr. Eko Prasetyo', role: 'Dosen TI', text: 'Pantau semua tim bimbingan dalam satu dashboard. Efisien sekali, tidak perlu koordinasi manual lagi.', avatar: 'EP', rating: 5 },
    { name: 'Maya Putri', role: 'Mahasiswa Teknik', text: 'Bergabung ke 3 tim lomba berbeda jadi mudah. Koordinasi dengan dosen pembimbing juga lancar.', avatar: 'MP', rating: 5 },
  ],
  faqs: [
    { q: 'Siapa saja yang bisa menggunakan platform ini?', a: 'Platform ini untuk mahasiswa, dosen, dan admin. Masing-masing punya akses dan fitur yang disesuaikan dengan perannya.' },
    { q: 'Bagaimana cara mendaftar lomba?', a: 'Setelah daftar akun, jelajahi lomba, bentuk tim, pilih dosen pembimbing, dan daftarkan tim ke lomba pilihanmu. Semua bisa dilakukan dalam beberapa klik.' },
    { q: 'Apakah dosen bisa membuat lomba sendiri?', a: 'Ya! Dosen bisa menambah, mengelola lomba, dan menerima/menolak permintaan bimbingan dari mahasiswa.' },
    { q: 'Bagaimana sistem persetujuan bekerja?', a: 'Setiap pengajuan melalui alur persetujuan bertingkat — dari dosen pembimbing hingga admin. Status bisa dipantau secara real-time.' },
    { q: 'Apakah platform ini gratis?', a: 'Ya, sepenuhnya gratis untuk seluruh civitas akademika terdaftar. Tidak ada biaya tersembunyi.' },
    { q: 'Bisakah saya bergabung ke lebih dari satu tim?', a: 'Tentu! Kamu bisa di beberapa tim untuk lomba berbeda, selama dosen pembimbing menyetujui setiap pengajuan.' },
    { q: 'Bagaimana jika lombanya sudah lewat deadline?', a: 'Lomba yang sudah melewati deadline akan otomatis ditandai sebagai "Selesai" dan tidak bisa didaftari lagi.' },
    { q: 'Apakah ada notifikasi untuk deadline?', a: 'Ya, kamu akan mendapat notifikasi otomatis sebelum deadline dan setiap perubahan status pengajuan.' },
  ],
  marqueeItems: [
    '🏆 50+ Lomba', '🎓 200+ Mahasiswa', '👨‍🏫 30+ Dosen', '👥 80+ Tim',
    '🚀 #1 Platform Akademik', '⚡ Real-time', '🔒 Aman & Terpercaya', '💡 Inovatif',
  ],
  whyTags: [
    { icon: Bell, label: 'Notifikasi Real-time' },
    { icon: FileText, label: 'Dokumentasi Lengkap' },
    { icon: PieChart, label: 'Analitik Mendalam' },
    { icon: Building2, label: 'Multi-Universitas' },
    { icon: Lock, label: 'Keamanan Data' },
    { icon: Cloud, label: 'Cloud-Based' },
  ],
};

/* ═══════════════════════════════════════════════════════════
   HOOKS
   ═══════════════════════════════════════════════════════════ */

function useReveal(threshold = 0.15) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { el.classList.add('visible'); obs.unobserve(el); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return ref;
}

function Reveal({ children, className = '', delay = 0, direction = 'up' }) {
  const ref = useReveal();
  const cls = direction === 'left' ? 'reveal-left' : direction === 'right' ? 'reveal-right' : direction === 'scale' ? 'reveal-scale' : 'reveal';
  return (
    <div ref={ref} className={`${cls} ${className}`} style={{ transitionDelay: `${delay}s` }}>
      {children}
    </div>
  );
}

function useScrollProgress() {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const onScroll = () => {
      const h = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(h > 0 ? (window.scrollY / h) * 100 : 0);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  return progress;
}

/* ═══════════════════════════════════════════════════════════
   SHARED COMPONENTS
   ═══════════════════════════════════════════════════════════ */

function GradIcon({ icon: Icon, grad, size = 'md', className = '' }) {
  const sizes = { sm: 'w-10 h-10', md: 'w-12 h-12', lg: 'w-14 h-14', xl: 'w-16 h-16' };
  const iconSizes = { sm: 'w-5 h-5', md: 'w-6 h-6', lg: 'w-7 h-7', xl: 'w-7 h-7' };
  return (
    <div
      className={`inline-flex items-center justify-center rounded-2xl shadow-md ${sizes[size]} ${className}`}
      style={{ background: GRADIENTS[grad] || grad }}
    >
      <Icon className={`text-white ${iconSizes[size]}`} />
    </div>
  );
}

function AnimatedCounter({ end, suffix = '', duration = 2000 }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const started = useRef(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !started.current) {
        started.current = true;
        const t0 = performance.now();
        const step = (now) => {
          const p = Math.min((now - t0) / duration, 1);
          setCount(Math.floor((1 - Math.pow(1 - p, 3)) * end));
          if (p < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      }
    }, { threshold: 0.5 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [end, duration]);
  return <span ref={ref}>{count}{suffix}</span>;
}

function SectionLabel({ icon: Icon, text, variant = 'brand' }) {
  const variants = {
    brand: 'bg-brand-50 text-brand-600 border-brand-200',
    white: 'bg-white/10 text-white/80 border-white/15',
    accent: 'bg-amber-50 text-amber-700 border-amber-200',
    dark: 'bg-gray-100 text-gray-600 border-gray-200',
  };
  return (
    <span className={`inline-flex items-center gap-2 text-[11px] font-bold px-4 py-1.5 rounded-full mb-5 tracking-widest uppercase border ${variants[variant]}`}>
      <Icon className="w-3.5 h-3.5" /> {text}
    </span>
  );
}

/* ═══════════════════════════════════════════════════════════
   NAVBAR (More rounded)
   ═══════════════════════════════════════════════════════════ */

function useActiveSection(sectionIds) {
  const [active, setActive] = useState('');
  useEffect(() => {
    const observers = [];
    sectionIds.forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
      const obs = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) setActive(id); },
        { rootMargin: '-40% 0px -55% 0px' }
      );
      obs.observe(el);
      observers.push(obs);
    });
    return () => observers.forEach(o => o.disconnect());
  }, [sectionIds]);
  return active;
}

function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const progress = useScrollProgress();

  const links = [
    { id: 'features', label: 'Fitur' },
    { id: 'spotlight', label: 'Keunggulan' },
    { id: 'how', label: 'Cara Kerja' },
    { id: 'roles', label: 'Peran' },
    { id: 'testimonials', label: 'Testimoni' },
    { id: 'faq', label: 'FAQ' },
  ];

  const activeSection = useActiveSection(links.map(l => l.id));

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 50);
      if (mobileOpen) setMobileOpen(false);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [mobileOpen]);

  return (
    <>
      {/* Progress bar */}
      <div className="fixed top-0 left-0 w-full h-[3px] z-[60]">
        <div className="h-full bg-gradient-to-r from-brand-600 via-purple-400 to-amber-400 transition-[width] duration-150 ease-out"
          style={{ width: `${progress}%` }} />
      </div>
      <nav className={`fixed z-50 transition-all duration-500 ${
        scrolled
          ? 'top-3 left-4 right-4 max-w-5xl mx-auto glass shadow-[0_8px_40px_rgba(108,27,117,0.12)] rounded-[1.5rem] border border-white/40'
          : 'top-0 left-0 right-0 w-full bg-transparent'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <a href="#" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="flex items-center gap-2.5 group">
            <div className={`w-9 h-9 rounded-2xl flex items-center justify-center transition-all duration-500 ${
              scrolled ? 'bg-brand-gradient shadow-md' : 'bg-white/15 group-hover:bg-white/25'
            }`}>
              <Trophy className="w-5 h-5 text-white" />
            </div>
            <span className={`text-lg font-extrabold tracking-tight transition-colors duration-300 ${scrolled ? 'text-gray-900' : 'text-white'}`}>
              Info Lomba <span className={scrolled ? 'text-brand-600' : 'text-white/60'}>Ko+Lab</span>
            </span>
          </a>

          <div className="hidden lg:flex items-center gap-1">
            {links.map(l => (
              <a key={l.id} href={`#${l.id}`}
                className={`relative px-3.5 py-2 text-[13px] font-medium rounded-full transition-all duration-200 nav-link ${
                  activeSection === l.id
                    ? 'text-brand-600 bg-brand-50 font-semibold'
                    : scrolled ? 'text-gray-500 hover:text-brand-600 hover:bg-brand-50' : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}>
                {l.label}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <Link to="/login" className={`hidden sm:inline-block text-[13px] font-medium px-4 py-2 rounded-full transition-all ${
              scrolled ? 'text-gray-500 hover:text-brand-600' : 'text-white/60 hover:text-white'
            }`}>Masuk</Link>
            <Link to="/register" className={`hidden sm:inline-block text-[13px] font-bold px-5 py-2.5 rounded-full transition-all duration-300 ${
              scrolled
                ? 'bg-brand-600 text-white hover:bg-brand-700 shadow-md shadow-brand-600/25 hover:shadow-lg hover:shadow-brand-600/30'
                : 'bg-white text-brand-600 hover:bg-white/90 shadow-lg shadow-black/10'
            }`}>Daftar</Link>
            <button onClick={() => setMobileOpen(!mobileOpen)}
              className={`lg:hidden p-2 rounded-xl ${scrolled ? 'text-gray-900' : 'text-white'}`}>
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        <div className={`lg:hidden overflow-hidden transition-all duration-300 ${mobileOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
          <div className={`px-4 pb-4 pt-2 ${scrolled ? 'glass rounded-b-[1.5rem]' : 'bg-gray-950/90 backdrop-blur-xl'}`}>
            {links.map(l => (
              <a key={l.id} href={`#${l.id}`} onClick={() => setMobileOpen(false)}
                className={`block py-3 text-sm font-medium border-b transition-colors ${
                  activeSection === l.id
                    ? 'text-brand-600 bg-brand-50/50 font-semibold border-brand-100'
                    : scrolled ? 'text-gray-700 border-gray-100 hover:text-brand-600' : 'text-white/70 border-white/5 hover:text-white'
                }`}>
                {l.label}
              </a>
            ))}
            <div className="flex gap-3 mt-4">
              <Link to="/login" className={`flex-1 text-center py-2.5 rounded-full text-sm font-medium ${scrolled ? 'bg-gray-100 text-gray-700' : 'bg-white/10 text-white'}`}>Masuk</Link>
              <Link to="/register" className="flex-1 text-center py-2.5 rounded-full text-sm font-bold bg-brand-600 text-white shadow-md">Daftar</Link>
            </div>
          </div>
        </div>
      </nav>
    </>
  );
}

/* ═══════════════════════════════════════════════════════════
   HERO
   ═══════════════════════════════════════════════════════════ */

function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Deep gradient background */}
      <div className="absolute inset-0 bg-brand-gradient-hero" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(192,132,252,0.2),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(245,158,11,0.15),transparent_50%)]" />

      {/* Animated orbs */}
      <div className="absolute top-[10%] left-[15%] w-[500px] h-[500px] bg-purple-500/15 rounded-full blur-[120px] animate-blob" />
      <div className="absolute bottom-[10%] right-[10%] w-[400px] h-[400px] bg-amber-400/10 rounded-full blur-[100px] animate-blob" style={{ animationDelay: '4s' }} />
      <div className="absolute top-[40%] right-[20%] w-[300px] h-[300px] bg-cyan-400/8 rounded-full blur-[80px] animate-blob" style={{ animationDelay: '7s' }} />

      {/* Grid overlay */}
      <div className="absolute inset-0 opacity-[0.03]"
        style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '32px 32px' }} />

      {/* Floating icons */}
      {[
        { Icon: Trophy, top: '12%', left: '8%', delay: '0s' },
        { Icon: Star, top: '20%', right: '12%', delay: '1s' },
        { Icon: GraduationCap, bottom: '30%', left: '6%', delay: '2s' },
        { Icon: Users, bottom: '25%', right: '8%', delay: '0.5s' },
        { Icon: Sparkles, top: '50%', left: '4%', delay: '1.5s' },
        { Icon: Target, top: '35%', right: '4%', delay: '2.5s' },
        { Icon: Award, top: '15%', right: '30%', delay: '3s' },
        { Icon: Rocket, bottom: '35%', left: '25%', delay: '1.8s' },
      ].map((p, i) => (
        <div key={i} className="absolute animate-float hidden lg:block" style={{ ...p, animationDelay: p.delay }}>
          <div className="w-11 h-11 rounded-2xl bg-white/8 backdrop-blur-sm flex items-center justify-center border border-white/10">
            <p.Icon className="text-white/30" size={18} />
          </div>
        </div>
      ))}

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-32 text-center">
        <Reveal>
          <div className="inline-flex items-center gap-2.5 bg-white/10 backdrop-blur-xl text-white text-[13px] font-medium px-5 py-2.5 rounded-full border border-white/15 mb-8">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-300" />
            </span>
            {SITE_DATA.brand.tagline}
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <h1 className="text-5xl sm:text-6xl lg:text-[5.5rem] font-extrabold text-white leading-[1.05] tracking-tight max-w-5xl mx-auto">
            Wujudkan Prestasi
            <span className="block mt-3">
              Bersama{' '}
              <span className="relative inline-block">
                <span className="text-gradient-gold">
                  Ko+Lab
                </span>
                <svg className="absolute -bottom-2 left-0 w-full h-4" viewBox="0 0 200 12" fill="none" preserveAspectRatio="none">
                  <path d="M2 8 Q50 1 100 7 Q150 13 198 4" stroke="rgba(251,191,36,0.6)" strokeWidth="3.5" strokeLinecap="round" />
                </svg>
              </span>
            </span>
          </h1>
        </Reveal>

        <Reveal delay={0.2}>
          <p className="mt-8 text-lg sm:text-xl text-white/55 max-w-2xl mx-auto leading-relaxed font-medium">
            {SITE_DATA.brand.description}
          </p>
        </Reveal>

        <Reveal delay={0.3}>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/register"
              className="group inline-flex items-center gap-2.5 bg-white text-brand-600 font-bold px-8 py-4 rounded-full shadow-xl shadow-black/15 hover:shadow-2xl hover:shadow-black/20 hover:-translate-y-1 transition-all duration-300">
              Mulai Sekarang
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
            </Link>
            <a href="#features"
              className="inline-flex items-center gap-2.5 text-white/70 font-semibold px-8 py-4 rounded-full border border-white/20 hover:bg-white/10 hover:border-white/30 transition-all duration-300">
              Pelajari Lebih Lanjut
              <ArrowDown className="w-4 h-4 animate-bounce-gentle" />
            </a>
          </div>
        </Reveal>

        {/* Dashboard Preview */}
        <Reveal delay={0.4}>
          <div className="mt-20 mx-auto max-w-5xl">
            <div className="relative">
              <div className="absolute -inset-6 bg-gradient-to-r from-brand-600/20 via-purple-500/20 to-amber-500/20 rounded-[2rem] blur-3xl" />
              <div className="relative rounded-[1.25rem] bg-white/[0.07] backdrop-blur-2xl border border-white/15 shadow-2xl shadow-black/30 overflow-hidden glow-brand">
                {/* Browser bar */}
                <div className="flex items-center gap-2 px-5 py-3.5 border-b border-white/10 bg-white/[0.03]">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-400/70" />
                    <div className="w-3 h-3 rounded-full bg-yellow-400/70" />
                    <div className="w-3 h-3 rounded-full bg-green-400/70" />
                  </div>
                  <div className="flex-1 flex justify-center">
                    <div className="bg-white/10 rounded-lg px-6 py-1.5 text-[11px] text-white/30 font-mono">infolomba.kolab.id</div>
                  </div>
                </div>
                {/* Content */}
                <div className="p-5 sm:p-8">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
                    {[
                      { label: 'Lomba Aktif', val: '24', grad: 'from-blue-400 to-cyan-300', delta: '+12%' },
                      { label: 'Tim Terdaftar', val: '87', grad: 'from-emerald-400 to-teal-300', delta: '+8%' },
                      { label: 'Dosen Aktif', val: '35', grad: 'from-amber-400 to-orange-300', delta: '+5%' },
                      { label: 'Pengajuan', val: '12', grad: 'from-pink-400 to-rose-300', delta: '+23%' },
                    ].map((s, i) => (
                      <div key={i} className="bg-white/[0.05] rounded-xl p-3.5 border border-white/[0.06] hover:bg-white/[0.1] transition-all">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] text-white/25">{s.label}</span>
                          <span className="text-[10px] text-emerald-300/70 font-medium">{s.delta}</span>
                        </div>
                        <div className={`text-xl font-bold bg-gradient-to-r ${s.grad} bg-clip-text text-transparent`}>{s.val}</div>
                      </div>
                    ))}
                  </div>
                  <div className="bg-white/[0.03] rounded-xl p-4 border border-white/[0.05] h-24 flex items-end gap-1.5">
                    {[30, 50, 35, 65, 45, 75, 55, 85, 70, 80, 60, 90, 75, 95, 85, 70, 80, 65, 90, 55, 70, 85, 60, 95].map((h, i) => (
                      <div key={i} className="flex-1 rounded-t-sm bg-gradient-to-t from-white/25 to-white/5 hover:from-white/40 hover:to-white/15 transition-all" style={{ height: `${h}%` }} />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-white to-transparent" />
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════
   MARQUEE
   ═══════════════════════════════════════════════════════════ */

function MarqueeSection() {
  const doubled = [...SITE_DATA.marqueeItems, ...SITE_DATA.marqueeItems];
  return (
    <div className="relative py-4 bg-brand-50/50 border-y border-brand-100/50 overflow-hidden">
      <div className="flex animate-marquee whitespace-nowrap">
        {doubled.map((item, i) => (
          <span key={i} className="mx-8 text-[13px] font-semibold text-brand-400">{item}</span>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   STATS
   ═══════════════════════════════════════════════════════════ */

function StatsSection() {
  return (
    <section id="stats" className="py-20 bg-white relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          {SITE_DATA.stats.map((s, i) => (
            <Reveal key={i} delay={i * 0.08}>
              <div className="text-center p-6 rounded-2xl bg-white border border-gray-100 hover:border-brand-100 hover:shadow-lg hover:shadow-brand-600/5 transition-all duration-400 group cursor-default">
                <div className="mb-4 group-hover:scale-110 group-hover:shadow-lg transition-all duration-300">
                  <GradIcon icon={s.icon} grad={s.grad} size="lg" />
                </div>
                <p className="text-4xl sm:text-5xl font-extrabold text-gray-900 tracking-tight">
                  <AnimatedCounter end={s.value} suffix={s.suffix} />
                </p>
                <p className="text-xs text-gray-400 mt-2 font-semibold tracking-wider uppercase">{s.label}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════
   FEATURES
   ═══════════════════════════════════════════════════════════ */

function FeaturesSection() {
  return (
    <section id="features" className="py-28 bg-white relative overflow-hidden">
      {/* Subtle dot pattern */}
      <div className="absolute inset-0 dot-pattern opacity-50" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
        <Reveal className="text-center mb-16">
          <SectionLabel icon={Sparkles} text="Fitur Utama" variant="brand" />
          <h2 className="text-4xl sm:text-5xl font-extrabold text-gray-900 tracking-tight">
            Semua yang Kamu <span className="text-gradient">Butuhkan</span>
          </h2>
          <p className="mt-4 text-gray-400 text-lg max-w-xl mx-auto">
            Platform lengkap untuk ekosistem kompetisi akademik.
          </p>
        </Reveal>

        <div className="grid md:grid-cols-4 gap-4">
          {SITE_DATA.features.map((f, i) => (
            <Reveal key={i} delay={i * 0.06} className={f.span}>
              <div className={`group relative h-full rounded-2xl border transition-all duration-500 hover:-translate-y-1 overflow-hidden ${
                f.highlight
                  ? 'p-8 bg-gray-50/80 border-gray-100 hover:border-brand-100 hover:shadow-xl hover:shadow-brand-600/5'
                  : 'p-6 bg-white border-gray-100 hover:border-brand-100 hover:shadow-lg hover:shadow-brand-600/5'
              }`}>
                <div className="absolute inset-0 opacity-0 group-hover:opacity-[0.04] transition-opacity duration-500" style={{ background: GRADIENTS[f.grad] }} />
                <div className="relative">
                  <div className="mb-5 group-hover:scale-110 group-hover:shadow-lg transition-all duration-300">
                    <GradIcon icon={f.icon} grad={f.grad} size={f.highlight ? 'lg' : 'md'} />
                  </div>
                  <h3 className={`font-bold text-gray-900 mb-2 ${f.highlight ? 'text-lg' : 'text-base'}`}>{f.title}</h3>
                  <p className="text-sm text-gray-400 leading-relaxed">{f.desc}</p>
                  <div
                    className={`mt-5 inline-flex items-center gap-1 text-xs font-bold opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0`}
                    style={{
                      backgroundImage: GRADIENTS[f.grad],
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                    }}
                  >
                    Pelajari lebih lanjut <ArrowUpRight size={12} />
                  </div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════
   FEATURE SPOTLIGHT (Deep Dive)
   ═══════════════════════════════════════════════════════════ */

function FeatureSpotlightSection() {
  return (
    <section id="spotlight" className="py-28 bg-gray-50/50 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <Reveal className="text-center mb-20">
          <SectionLabel icon={Eye} text="Keunggulan" variant="accent" />
          <h2 className="text-4xl sm:text-5xl font-extrabold text-gray-900 tracking-tight">
            Lebih dari Sekadar <span className="text-gradient">Platform</span>
          </h2>
          <p className="mt-4 text-gray-400 text-lg max-w-xl mx-auto">
            Fitur-fitur canggih yang dirancang khusus untuk ekosistem akademik.
          </p>
        </Reveal>

        <div className="space-y-24">
          {SITE_DATA.featureSpotlight.map((spot, i) => (
            <div key={i} className={`grid lg:grid-cols-2 gap-12 items-center ${spot.direction === 'right' ? 'lg:direction-rtl' : ''}`}>
              <Reveal direction={spot.direction === 'left' ? 'left' : 'right'} className={spot.direction === 'right' ? 'lg:order-2' : ''}>
                <div className={spot.direction === 'right' ? 'lg:direction-ltr' : ''}>
                  <div className="mb-6">
                    <GradIcon icon={spot.icon} grad={spot.grad} size="lg" className="shadow-lg" />
                  </div>
                  <h3 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4 tracking-tight">{spot.title}</h3>
                  <p className="text-gray-400 text-base leading-relaxed mb-6">{spot.desc}</p>
                  <ul className="space-y-3">
                    {spot.bullets.map((b, j) => (
                      <li key={j} className="flex items-center gap-3 text-sm text-gray-600">
                        <div
                          className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0"
                          style={{ background: GRADIENTS[spot.grad] }}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                        </div>
                        {b}
                      </li>
                    ))}
                  </ul>
                </div>
              </Reveal>

              <Reveal direction={spot.direction === 'left' ? 'right' : 'left'} delay={0.15} className={spot.direction === 'right' ? 'lg:order-1' : ''}>
                {/* Decorative card mockup */}
                <div className="relative rounded-3xl p-1 shadow-2xl" style={{ background: GRADIENTS[spot.grad] }}>
                  <div className="bg-white rounded-[1.15rem] p-8">
                    <div className="space-y-4">
                      {[1, 2, 3].map((row) => (
                        <div key={row} className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl opacity-20" style={{ background: GRADIENTS[spot.grad] }} />
                          <div className="flex-1 space-y-2">
                            <div className="h-3 bg-gray-100 rounded-full" style={{ width: `${80 - row * 15}%` }} />
                            <div className="h-2 bg-gray-50 rounded-full" style={{ width: `${60 - row * 10}%` }} />
                          </div>
                          <div className="w-8 h-8 rounded-lg opacity-10" style={{ background: GRADIENTS[spot.grad] }} />
                        </div>
                      ))}
                      <div className="h-24 rounded-2xl opacity-5" style={{ background: GRADIENTS[spot.grad] }} />
                    </div>
                  </div>
                </div>
              </Reveal>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════
   HOW IT WORKS
   ═══════════════════════════════════════════════════════════ */

function HowSection() {
  return (
    <section id="how" className="py-28 bg-white relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <Reveal className="text-center mb-16">
          <SectionLabel icon={Lightbulb} text="Cara Kerja" variant="accent" />
          <h2 className="text-4xl sm:text-5xl font-extrabold text-gray-900 tracking-tight">
            Mulai dalam <span className="text-gradient">4 Langkah</span>
          </h2>
          <p className="mt-4 text-gray-400 text-lg max-w-xl mx-auto">
            Proses sederhana untuk memulai perjalanan kompetisimu.
          </p>
        </Reveal>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 relative">
          {/* Connecting line (desktop) */}
          <div className="hidden lg:block absolute top-12 left-[12%] right-[12%] h-[2px] bg-gradient-to-r from-brand-200 via-purple-200 to-amber-200 z-0" />

          {SITE_DATA.steps.map((s, i) => (
            <Reveal key={i} delay={i * 0.12}>
              <div className="group relative text-center p-7 rounded-2xl bg-white border border-gray-100 hover:border-brand-100 hover:shadow-xl hover:shadow-brand-600/5 transition-all duration-400 hover:-translate-y-1 z-10">
                <div className="relative inline-flex items-center justify-center mb-6">
                  <div className="group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-brand-600/30 transition-all duration-300">
                    <GradIcon icon={s.icon} grad={s.grad} size="xl" />
                  </div>
                  <span className="absolute -top-2 -right-2 w-7 h-7 rounded-xl bg-amber-400 text-[11px] font-extrabold text-white flex items-center justify-center shadow-md">
                    {s.num}
                  </span>
                </div>
                <h3 className="text-base font-bold text-gray-900 mb-2">{s.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{s.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════
   WHY CHOOSE US
   ═══════════════════════════════════════════════════════════ */

function WhySection() {
  return (
    <section id="why" className="py-28 bg-gray-50/50 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <Reveal>
              <SectionLabel icon={Award} text="Mengapa Ko+Lab?" variant="brand" />
            </Reveal>
            <Reveal delay={0.1}>
              <h2 className="text-4xl sm:text-5xl font-extrabold text-gray-900 tracking-tight leading-tight">
                Dirancang untuk<br />
                <span className="text-gradient">Kesuksesan Akademik</span>
              </h2>
            </Reveal>
            <Reveal delay={0.15}>
              <p className="mt-6 text-gray-400 text-lg leading-relaxed">
                Ekosistem yang menghubungkan mahasiswa, dosen, dan admin dalam satu workflow efisien. Kolaborasi tanpa batas, pencapaian tanpa henti.
              </p>
            </Reveal>
            <Reveal delay={0.2}>
              <div className="mt-8 flex flex-wrap gap-3">
                {SITE_DATA.whyTags.map((tag, i) => (
                  <span key={i} className="inline-flex items-center gap-2 px-4 py-2.5 bg-white rounded-xl text-[13px] font-medium text-gray-600 border border-gray-100 hover:border-brand-200 hover:text-brand-600 hover:shadow-md transition-all cursor-default shadow-sm">
                    <tag.icon size={14} /> {tag.label}
                  </span>
                ))}
              </div>
            </Reveal>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {SITE_DATA.reasons.map((r, i) => (
              <Reveal key={i} delay={i * 0.1}>
                <div className="group p-6 rounded-2xl bg-white border border-gray-100 hover:border-brand-100 hover:shadow-lg hover:shadow-brand-600/5 transition-all duration-400 hover:-translate-y-1">
                  <div className="mb-4 group-hover:scale-110 transition-transform duration-300">
                    <GradIcon icon={r.icon} grad={r.grad} size="sm" />
                  </div>
                  <p className="text-3xl font-extrabold text-gray-900">{r.stat}</p>
                  <p className="text-[10px] text-brand-400 uppercase tracking-wider font-bold mb-2">{r.statLabel}</p>
                  <h3 className="font-bold text-gray-900 text-sm mb-1">{r.title}</h3>
                  <p className="text-xs text-gray-400">{r.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════
   ROLES
   ═══════════════════════════════════════════════════════════ */

function RolesSection() {
  return (
    <section id="roles" className="py-28 bg-white relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <Reveal className="text-center mb-16">
          <SectionLabel icon={Globe} text="Multi-Role" variant="brand" />
          <h2 className="text-4xl sm:text-5xl font-extrabold text-gray-900 tracking-tight">
            Untuk Setiap <span className="text-gradient">Peran</span>
          </h2>
          <p className="mt-4 text-gray-400 text-lg max-w-xl mx-auto">
            Dua peran, satu ekosistem.
          </p>
        </Reveal>

        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {SITE_DATA.roles.map((r, i) => (
            <Reveal key={i} delay={i * 0.12} direction={i === 0 ? 'left' : 'right'}>
              <div className="group relative h-full bg-white rounded-2xl border border-gray-100 hover:border-brand-100 p-8 transition-all duration-400 hover:shadow-xl hover:shadow-brand-600/5 hover:-translate-y-1 overflow-hidden">
                <div
                  className="absolute top-0 right-0 w-40 h-40 opacity-[0.04] rounded-full -translate-y-1/2 translate-x-1/2 group-hover:opacity-[0.08] transition-opacity"
                  style={{ background: GRADIENTS[r.grad] }}
                />
                <div className="mb-6 group-hover:scale-110 transition-transform duration-300">
                  <GradIcon icon={r.icon} grad={r.grad} size="lg" className="shadow-lg" />
                </div>
                <h3 className="text-xl font-extrabold text-gray-900 mb-5">{r.role}</h3>
                <ul className="space-y-3.5">
                  {r.items.map((item, j) => (
                    <li key={j} className="flex items-start gap-3 text-sm text-gray-500">
                      <div
                        className="w-5 h-5 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                        style={{ background: GRADIENTS[r.grad] }}
                      >
                        <CheckCircle2 className="w-3 h-3 text-white" />
                      </div>
                      <span className="font-medium">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════
   TESTIMONIALS (Auto-scrolling marquee)
   ═══════════════════════════════════════════════════════════ */

function TestimonialCard({ t }) {
  return (
    <div className="group flex-shrink-0 w-80 p-7 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10 hover:bg-white/15 hover:border-white/20 hover:shadow-xl transition-all duration-400 hover:-translate-y-1">
      <Quote className="w-8 h-8 text-white/15 mb-4" />
      <p className="text-white/70 text-sm leading-relaxed mb-5">&ldquo;{t.text}&rdquo;</p>
      <div className="flex items-center gap-1 mb-5">
        {[...Array(5)].map((_, j) => (
          <Star key={j} size={13} className={j < t.rating ? 'text-amber-300 fill-amber-300' : 'text-white/10'} />
        ))}
      </div>
      <div className="flex items-center gap-3 pt-4 border-t border-white/10">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-white/20 to-white/5 flex items-center justify-center text-white text-[11px] font-bold border border-white/10">
          {t.avatar}
        </div>
        <div>
          <p className="text-white text-sm font-bold">{t.name}</p>
          <p className="text-white/40 text-xs">{t.role}</p>
        </div>
      </div>
    </div>
  );
}

function TestimonialsSection() {
  const [paused, setPaused] = useState(false);
  const testimonials = SITE_DATA.testimonials;
  const row1 = [...testimonials, ...testimonials, ...testimonials];
  const row2 = [...testimonials, ...testimonials, ...testimonials];

  return (
    <section id="testimonials" className="py-28 bg-brand-gradient relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.1),transparent_60%)]" />
      <div className="absolute inset-0 opacity-[0.03]"
        style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '28px 28px' }} />

      <style>{`
        @keyframes testimonial-scroll-left {
          0% { transform: translateX(0); }
          100% { transform: translateX(-33.333%); }
        }
        @keyframes testimonial-scroll-right {
          0% { transform: translateX(-33.333%); }
          100% { transform: translateX(0); }
        }
        .testimonial-track {
          display: flex;
          gap: 1.25rem;
          width: max-content;
        }
        .testimonial-track-left {
          animation: testimonial-scroll-left 25s linear infinite;
        }
        .testimonial-track-right {
          animation: testimonial-scroll-right 28s linear infinite;
        }
        .testimonial-section:hover .testimonial-track {
          animation-play-state: paused !important;
        }
      `}</style>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
        <Reveal className="text-center mb-16">
          <SectionLabel icon={MessageSquare} text="Testimoni" variant="white" />
          <h2 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight">
            Apa Kata Mereka?
          </h2>
          <p className="mt-4 text-white/50 text-lg max-w-xl mx-auto">
            Pengalaman nyata dari pengguna Ko+Lab.
          </p>
        </Reveal>

        <div
          className="testimonial-section space-y-5"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          {/* Row 1 — scroll left */}
          <div className="overflow-hidden rounded-2xl">
            <div className={`testimonial-track testimonial-track-left${paused ? '' : ''}`}
              style={paused ? { animationPlayState: 'paused' } : undefined}>
              {row1.map((t, i) => (
                <TestimonialCard key={`r1-${i}`} t={t} />
              ))}
            </div>
          </div>
          {/* Row 2 — scroll right */}
          <div className="overflow-hidden rounded-2xl">
            <div className={`testimonial-track testimonial-track-right`}
              style={paused ? { animationPlayState: 'paused' } : undefined}>
              {row2.map((t, i) => (
                <TestimonialCard key={`r2-${i}`} t={t} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════
   FAQ
   ═══════════════════════════════════════════════════════════ */

function FAQSection() {
  const [open, setOpen] = useState(null);

  return (
    <section id="faq" className="py-28 bg-white relative overflow-hidden">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <Reveal className="text-center mb-14">
          <SectionLabel icon={Lightbulb} text="FAQ" variant="accent" />
          <h2 className="text-4xl sm:text-5xl font-extrabold text-gray-900 tracking-tight">
            Pertanyaan <span className="text-gradient">Umum</span>
          </h2>
          <p className="mt-4 text-gray-400 text-lg max-w-md mx-auto">
            Jawaban untuk pertanyaan yang sering diajukan.
          </p>
        </Reveal>

        <div className="space-y-3">
          {SITE_DATA.faqs.map((f, i) => (
            <Reveal key={i} delay={i * 0.04}>
              <div className={`rounded-2xl overflow-hidden transition-all duration-300 ${
                open === i ? 'bg-brand-50/50 border border-brand-200 shadow-sm' : 'bg-gray-50/80 border border-gray-100 hover:border-gray-200'
              }`}>
                <button onClick={() => setOpen(open === i ? null : i)}
                  className="w-full flex items-center justify-between px-6 py-5 text-left group">
                  <span className="font-bold text-gray-900 pr-4 text-sm group-hover:text-brand-600 transition-colors">{f.q}</span>
                  <ChevronDown className={`w-5 h-5 text-gray-300 shrink-0 transition-all duration-300 ${open === i ? 'rotate-180 text-brand-600' : 'group-hover:text-brand-400'}`} />
                </button>
                <div className={`overflow-hidden transition-all duration-400 ${open === i ? 'max-h-48 opacity-100' : 'max-h-0 opacity-0'}`}>
                  <p className="px-6 pb-5 text-sm text-gray-500 leading-relaxed">{f.a}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════
   CTA
   ═══════════════════════════════════════════════════════════ */

function CTASection() {
  return (
    <section id="cta" className="py-28 bg-brand-gradient relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.08),transparent_60%)]" />
      <div className="absolute inset-0 opacity-[0.03]"
        style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '24px 24px' }} />

      {/* Floating elements */}
      <div className="absolute top-10 left-10 w-20 h-20 bg-white/5 rounded-full blur-xl animate-float" />
      <div className="absolute bottom-10 right-10 w-32 h-32 bg-amber-400/10 rounded-full blur-2xl animate-float-delayed" />

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 text-center">
        <Reveal>
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm text-white/80 text-[13px] font-medium px-5 py-2.5 rounded-full border border-white/15 mb-8">
            <Heart className="w-4 h-4 text-rose-300" /> Bergabung Sekarang
          </div>
        </Reveal>
        <Reveal delay={0.1}>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-tight">
            Siap Meraih<br />
            <span className="text-gradient-gold">Prestasi Tertinggi?</span>
          </h2>
        </Reveal>
        <Reveal delay={0.15}>
          <p className="mt-6 text-lg text-white/50 max-w-xl mx-auto leading-relaxed">
            Bergabung bersama ratusan mahasiswa dan dosen yang sudah mempercayai Ko+Lab.
          </p>
        </Reveal>
        <Reveal delay={0.2}>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/register"
              className="group inline-flex items-center gap-2.5 bg-white text-brand-600 font-bold px-8 py-4 rounded-full shadow-xl shadow-black/15 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
              Buat Akun Gratis
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
            </Link>
            <Link to="/login"
              className="inline-flex items-center gap-2.5 text-white/70 font-semibold px-8 py-4 rounded-full border border-white/20 hover:bg-white/10 hover:border-white/30 transition-all duration-300">
              Sudah Punya Akun?
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════
   FOOTER (Layered wave top)
   ═══════════════════════════════════════════════════════════ */

function Footer() {
  return (
    <footer className="relative bg-gray-950 text-gray-400 pt-0 pb-16 overflow-hidden">
      {/* Layered wave SVG at top */}
      <div className="relative -mt-1">
        <svg viewBox="0 0 1440 150" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full block" preserveAspectRatio="none" style={{ height: '150px' }}>
          {/* Back wave — subtle, slow undulation */}
          <path d="M0,20 C120,60 240,10 360,40 C480,70 600,5 720,35 C840,65 960,15 1080,45 C1200,75 1320,25 1440,55 L1440,150 L0,150 Z" fill="#030712" opacity="0.2" />
          {/* Mid-back wave */}
          <path d="M0,40 C200,90 400,10 600,55 C800,100 1000,20 1200,60 C1350,85 1400,50 1440,70 L1440,150 L0,150 Z" fill="#030712" opacity="0.4" />
          {/* Mid-front wave */}
          <path d="M0,55 C160,100 320,20 480,65 C640,110 800,30 960,75 C1120,120 1280,40 1440,80 L1440,150 L0,150 Z" fill="#030712" opacity="0.65" />
          {/* Front wave — sharp, fully opaque */}
          <path d="M0,75 C180,115 360,50 540,85 C720,120 900,55 1080,90 C1260,125 1380,70 1440,100 L1440,150 L0,150 Z" fill="#030712" />
        </svg>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid md:grid-cols-4 gap-10 mb-12">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2.5 mb-5">
              <div className="w-10 h-10 rounded-2xl bg-brand-gradient flex items-center justify-center shadow-lg">
                <Trophy className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-extrabold text-white tracking-tight">
                Info Lomba <span className="text-brand-400">Ko+Lab</span>
              </span>
            </div>
            <p className="text-sm leading-relaxed max-w-sm text-gray-500 mb-6">
              Platform terpadu untuk mengelola kompetisi dan lomba di lingkungan akademik. Wujudkan prestasi bersama.
            </p>
            <div className="flex gap-3">
              {[
                { name: 'Twitter', icon: Globe },
                { name: 'Instagram', icon: Globe },
                { name: 'LinkedIn', icon: Globe },
              ].map((s, i) => (
                <a key={i} href="#" className="w-10 h-10 rounded-xl bg-gray-900 flex items-center justify-center text-gray-500 hover:bg-brand-600 hover:text-white transition-all duration-300 shadow-sm">
                  <s.icon size={15} />
                </a>
              ))}
            </div>
          </div>
          <div>
            <h4 className="text-[11px] font-bold text-white mb-5 uppercase tracking-widest">Navigasi</h4>
            <ul className="space-y-3">
              {[
                { label: 'Fitur', id: 'features' },
                { label: 'Cara Kerja', id: 'how' },
                { label: 'Peran', id: 'roles' },
                { label: 'Testimoni', id: 'testimonials' },
                { label: 'FAQ', id: 'faq' },
              ].map((l, i) => (
                <li key={i}><a href={`#${l.id}`} className="text-sm hover:text-white transition-colors">{l.label}</a></li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-[11px] font-bold text-white mb-5 uppercase tracking-widest">Akun</h4>
            <ul className="space-y-3">
              <li><Link to="/login" className="text-sm hover:text-white transition-colors">Masuk</Link></li>
              <li><Link to="/register" className="text-sm hover:text-white transition-colors">Daftar</Link></li>
              <li><Link to="/forgot-password" className="text-sm hover:text-white transition-colors">Lupa Password</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-800/50 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-gray-600">&copy; 2026 Ko+Lab. Semua hak dilindungi.</p>
          <p className="text-xs text-gray-700">Built with React & Tailwind CSS</p>
        </div>
      </div>
    </footer>
  );
}

/* ═══════════════════════════════════════════════════════════
   MAIN
   ═══════════════════════════════════════════════════════════ */

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white overflow-x-hidden" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <Navbar />
      <HeroSection />
      <MarqueeSection />
      <StatsSection />
      <FeaturesSection />
      <FeatureSpotlightSection />
      <WhySection />
      <HowSection />
      <RolesSection />
      <TestimonialsSection />
      <FAQSection />
      <CTASection />
      <Footer />
    </div>
  );
}