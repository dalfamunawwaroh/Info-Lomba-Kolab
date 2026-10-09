import { useState } from 'react';
import { 
  Megaphone, Send, Clock, Users, ShieldAlert, CheckCircle2, 
  Bell, Eye, Trash2, Copy, Filter, Sparkles, AlertTriangle, 
  Info, ExternalLink, Calendar, Plus, RefreshCw, Radio
} from 'lucide-react';
import useUIStore from '@/store/uiStore';

export default function BroadcastPage() {
  const addToast = useUIStore((s) => s.addToast);
  const [formData, setFormData] = useState({
    title: '',
    target: 'all',
    category: 'info',
    priority: 'normal',
    message: '',
    actionUrl: '',
    scheduleDate: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('create'); // 'create' | 'history'

  // Dummy statistics
  const stats = [
    { title: 'Total Terkirim', value: '38', change: '+12% bulan ini', icon: Send, color: 'from-[#9333EA] to-[#6C1B75]' },
    { title: 'Estimasi Jangkauan', value: '1,420 User', change: 'Mahasiswa & Dosen', icon: Users, color: 'from-blue-500 to-indigo-600' },
    { title: 'Tingkat Keterbacaan', value: '94.2%', change: 'Respon cepat', icon: Eye, color: 'from-emerald-500 to-teal-600' },
    { title: 'Dijadualkan', value: '2 Pesan', change: 'Kirim otomatis', icon: Clock, color: 'from-amber-500 to-orange-600' },
  ];

  // Dummy history
  const [history, setHistory] = useState([
    {
      id: 'BC-001',
      title: 'Pendaftaran Hackathon National 2026 Diperpanjang!',
      target: 'Mahasiswa',
      targetCode: 'mahasiswa',
      category: 'Pengumuman Lomba',
      priority: 'high',
      sentAt: '2026-10-08 14:30',
      recipientsCount: 890,
      readCount: 765,
      status: 'Terkirim',
    },
    {
      id: 'BC-002',
      title: 'Pemeliharaan Server Sistem Info Lomba',
      target: 'Semua Pengguna',
      targetCode: 'all',
      category: 'System Maintenance',
      priority: 'urgent',
      sentAt: '2026-10-05 09:00',
      recipientsCount: 1420,
      readCount: 1380,
      status: 'Terkirim',
    },
    {
      id: 'BC-003',
      title: 'Reminder Input Laporan Kemajuan Tim Bimbingan',
      target: 'Dosen Pembimbing',
      targetCode: 'dosen',
      category: 'Info Umum',
      priority: 'normal',
      sentAt: '2026-10-12 08:00 (Scheduled)',
      recipientsCount: 150,
      readCount: 0,
      status: 'Dijadualkan',
    },
  ]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title || !formData.message) {
      addToast({ type: 'error', message: 'Judul dan isi pesan broadcast wajib diisi!' });
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      const newBroadcast = {
        id: `BC-00${history.length + 1}`,
        title: formData.title,
        target: formData.target === 'all' ? 'Semua Pengguna' : formData.target === 'mahasiswa' ? 'Mahasiswa' : 'Dosen Pembimbing',
        targetCode: formData.target,
        category: formData.category,
        priority: formData.priority,
        sentAt: formData.scheduleDate ? `${formData.scheduleDate} (Scheduled)` : 'Baru saja',
        recipientsCount: formData.target === 'all' ? 1420 : 890,
        readCount: 0,
        status: formData.scheduleDate ? 'Dijadualkan' : 'Terkirim',
      };

      setHistory([newBroadcast, ...history]);
      addToast({ 
        type: 'success', 
        message: formData.scheduleDate ? 'Broadcast berhasil dijadwalkan!' : 'Broadcast berhasil dikirimkan!' 
      });
      setFormData({
        title: '',
        target: 'all',
        category: 'info',
        priority: 'normal',
        message: '',
        actionUrl: '',
        scheduleDate: '',
      });
    }, 800);
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'urgent':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30"><AlertTriangle size={12} /> Urgent</span>;
      case 'high':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30"><ShieldAlert size={12} /> Penting</span>;
      default:
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30"><Info size={12} /> Normal</span>;
    }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#1E1B4B] via-[#2E1065] to-[#3B0764] p-8 text-white border border-white/10 shadow-2xl">
        <div className="absolute top-0 right-0 -translate-y-12 translate-x-12 w-96 h-96 bg-[#9333EA]/20 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs font-semibold text-purple-200 mb-3">
              <Radio size={14} className="animate-pulse text-purple-400" /> Pusat Notifikasi & Broadcast Admin
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Kirim Broadcast Massal</h1>
            <p className="mt-2 text-purple-200/80 max-w-2xl text-sm leading-relaxed">
              Sebarkan pengumuman penting, pengingat deadline lomba, atau notifikasi sistem secara instan ke seluruh pengguna aplikasi Ko+Lab.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setActiveTab('create')}
              className={`px-5 py-2.5 rounded-xl font-medium text-sm transition-all flex items-center gap-2 ${activeTab === 'create' ? 'bg-[#9333EA] text-white shadow-lg shadow-purple-900/40' : 'bg-white/10 hover:bg-white/15 text-white'}`}
            >
              <Plus size={16} /> Buat Broadcast
            </button>
            <button 
              onClick={() => setActiveTab('history')}
              className={`px-5 py-2.5 rounded-xl font-medium text-sm transition-all flex items-center gap-2 ${activeTab === 'history' ? 'bg-[#9333EA] text-white shadow-lg shadow-purple-900/40' : 'bg-white/10 hover:bg-white/15 text-white'}`}
            >
              <Clock size={16} /> Riwayat ({history.length})
            </button>
          </div>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {stats.map((st, i) => (
          <div key={i} className="relative group overflow-hidden rounded-2xl bg-white dark:bg-[#13161C]/80 border border-slate-200/80 dark:border-white/10 p-5 backdrop-blur-xl shadow-sm dark:shadow-lg hover:border-purple-500/40 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{st.title}</p>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{st.value}</h3>
                <p className="text-[11px] text-purple-600 dark:text-purple-400 mt-1 font-semibold">{st.change}</p>
              </div>
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${st.color} flex items-center justify-center text-white shadow-lg`}>
                <st.icon size={22} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Area */}
      {activeTab === 'create' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Form Create Broadcast */}
          <div className="lg:col-span-7 bg-white dark:bg-[#13161C]/90 border border-slate-200/80 dark:border-white/10 rounded-2xl p-6 backdrop-blur-xl shadow-sm dark:shadow-2xl">
            <div className="flex items-center gap-3 border-b border-slate-200 dark:border-white/10 pb-4 mb-6">
              <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                <Megaphone size={20} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Form Broadcast Baru</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">Isi detail pesan di bawah untuk menyebarkan pengumuman</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Judul Broadcast */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                  Judul Pengumuman / Broadcast <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Pengumuman Hasil Seleksi Lomba Ko+Lab 2026"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 text-sm transition-all"
                />
              </div>

              {/* Target Penerima & Urgensi Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                    Target Penerima
                  </label>
                  <select
                    value={formData.target}
                    onChange={(e) => setFormData({ ...formData, target: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 text-sm transition-all"
                  >
                    <option value="all" className="bg-white dark:bg-slate-900">🌐 Semua Pengguna (Mahasiswa & Dosen)</option>
                    <option value="mahasiswa" className="bg-white dark:bg-slate-900">🎓 Mahasiswa Saja</option>
                    <option value="dosen" className="bg-white dark:bg-slate-900">👨‍🏫 Dosen Pembimbing Saja</option>
                    <option value="leader" className="bg-white dark:bg-slate-900">🏆 Ketua Tim Lomba</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                    Tingkat Urgensi
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 text-sm transition-all"
                  >
                    <option value="normal" className="bg-white dark:bg-slate-900">ℹ️ Normal (Informasi Biasa)</option>
                    <option value="high" className="bg-white dark:bg-slate-900">⚡ Penting (High Priority)</option>
                    <option value="urgent" className="bg-white dark:bg-slate-900">🚨 Urgent (Darurat / Critical)</option>
                  </select>
                </div>
              </div>

              {/* Kategori & Tautan Action */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                    Kategori Pengumuman
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 text-sm transition-all"
                  >
                    <option value="Pengumuman Lomba" className="bg-white dark:bg-slate-900">🏆 Pengumuman Lomba</option>
                    <option value="System Maintenance" className="bg-white dark:bg-slate-900">🛠️ System Maintenance</option>
                    <option value="Beasiswa / Grant" className="bg-white dark:bg-slate-900">💰 Beasiswa & Grant</option>
                    <option value="Info Umum" className="bg-white dark:bg-slate-900">📢 Informasi Umum</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                    Tautan Action (Opsional)
                  </label>
                  <input
                    type="url"
                    placeholder="https://kolab.id/competitions/12"
                    value={formData.actionUrl}
                    onChange={(e) => setFormData({ ...formData, actionUrl: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 text-sm transition-all"
                  />
                </div>
              </div>

              {/* Isi Pesan Broadcast */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                  Isi Pesan Broadcast <span className="text-rose-400">*</span>
                </label>
                <textarea
                  rows={5}
                  required
                  placeholder="Tuliskan isi pesan pengumuman di sini. Gunakan bahasa yang jelas dan komunikatif..."
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 text-sm transition-all leading-relaxed resize-none"
                />
              </div>

              {/* Jadwal Pengiriman */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar size={13} className="text-purple-600 dark:text-purple-400" /> Jadwalkan Waktu Kirim (Kosongkan jika kirim langsung)
                </label>
                <input
                  type="datetime-local"
                  value={formData.scheduleDate}
                  onChange={(e) => setFormData({ ...formData, scheduleDate: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-slate-800 dark:text-slate-300 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 text-sm transition-all"
                />
              </div>

              {/* Actions */}
              <div className="pt-3 flex items-center gap-3">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-3 px-6 rounded-xl bg-gradient-to-r from-[#9333EA] to-[#6C1B75] hover:from-purple-600 hover:to-purple-800 text-white font-bold text-sm shadow-xl shadow-purple-900/30 flex items-center justify-center gap-2 transition-all transform active:scale-95 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw size={16} className="animate-spin" /> Mengirimkan...
                    </>
                  ) : (
                    <>
                      <Send size={16} /> {formData.scheduleDate ? 'Jadwalkan Broadcast' : 'Kirim Broadcast Sekarang'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Live Preview Card */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white dark:bg-[#13161C]/90 border border-slate-200/80 dark:border-white/10 rounded-2xl p-6 backdrop-blur-xl shadow-sm dark:shadow-2xl sticky top-6">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 pb-4 mb-4">
                <div className="flex items-center gap-2">
                  <Sparkles size={18} className="text-amber-500 dark:text-amber-400" />
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">Live Preview Tampilan User</h3>
                </div>
                <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300 font-mono">Realtime</span>
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                Ini adalah visual bagaimana notifikasi broadcast akan tampil di dashboard penerima ({formData.target === 'all' ? 'Semua Pengguna' : formData.target}).
              </p>

              {/* Card Preview Component */}
              <div className="rounded-2xl bg-gradient-to-br from-slate-900 to-[#1A102F] border border-purple-500/30 p-5 shadow-2xl relative overflow-hidden group text-white">
                <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />

                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-lg bg-purple-500/20 text-purple-300 border border-purple-500/30">
                      <Bell size={14} />
                    </span>
                    <span className="text-xs font-bold text-purple-300">
                      {formData.category || 'Info Broadcast'}
                    </span>
                  </div>
                  {getPriorityBadge(formData.priority)}
                </div>

                <h4 className="text-base font-bold text-white line-clamp-2 leading-snug">
                  {formData.title || 'Judul broadcast akan muncul di sini...'}
                </h4>

                <p className="mt-2 text-xs text-slate-300 leading-relaxed whitespace-pre-line line-clamp-4">
                  {formData.message || 'Tuliskan pesan pada form di samping untuk melihat pratinjau pesan di kartu ini secara realtime...'}
                </p>

                {formData.actionUrl && (
                  <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400 truncate max-w-[180px]">{formData.actionUrl}</span>
                    <span className="text-xs font-semibold text-purple-400 flex items-center gap-1">
                      Buka Tautan <ExternalLink size={12} />
                    </span>
                  </div>
                )}

                <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                  <span>Oleh: Administrator Ko+Lab</span>
                  <span>{formData.scheduleDate ? 'Terjadwal' : 'Baru saja'}</span>
                </div>
              </div>

              {/* Notice */}
              <div className="mt-5 p-4 rounded-xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/30 flex items-start gap-3">
                <Info size={18} className="text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
                <p className="text-xs text-purple-900 dark:text-purple-200/80 leading-relaxed">
                  Pengguna akan menerima notifikasi pop-up di pojok kanan bawah serta badge lonceng di header aplikasi begitu pesan disebarkan.
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* History Broadcast Table */
        <div className="bg-white dark:bg-[#13161C]/90 border border-slate-200/80 dark:border-white/10 rounded-2xl p-6 backdrop-blur-xl shadow-sm dark:shadow-2xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-white/10 pb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Clock size={20} className="text-purple-600 dark:text-purple-400" /> Riwayat Broadcast Terkirim & Dijadwalkan
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Daftar rekaman pengumuman yang pernah disebarkan ke pengguna.</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-1.5 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-white/10 px-3 py-1.5 rounded-lg">
                <Filter size={12} /> Total: {history.length} pesan
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Judul & Kategori</th>
                  <th className="py-3.5 px-4">Target Audience</th>
                  <th className="py-3.5 px-4">Urgensi</th>
                  <th className="py-3.5 px-4">Status & Waktu</th>
                  <th className="py-3.5 px-4 text-center">Jangkauan Read</th>
                  <th className="py-3.5 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {history.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors group">
                    <td className="py-4 px-4">
                      <div className="font-bold text-slate-900 dark:text-white text-sm group-hover:text-purple-600 dark:group-hover:text-purple-300 transition-colors">
                        {item.title}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{item.category} • ID: {item.id}</div>
                    </td>
                    <td className="py-4 px-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/10">
                        <Users size={12} /> {item.target}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      {getPriorityBadge(item.priority)}
                    </td>
                    <td className="py-4 px-4">
                      <div className="text-xs text-slate-700 dark:text-slate-200 font-mono">{item.sentAt}</div>
                      <span className={`inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${item.status === 'Terkirim' ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'bg-amber-500/20 text-amber-600 dark:text-amber-400'}`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <div className="text-xs font-bold text-slate-800 dark:text-white">
                        {item.readCount} / {item.recipientsCount}
                      </div>
                      <div className="w-24 bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full mx-auto mt-1 overflow-hidden">
                        <div 
                          className="bg-purple-500 h-full rounded-full" 
                          style={{ width: `${item.recipientsCount > 0 ? (item.readCount / item.recipientsCount) * 100 : 0}%` }}
                        />
                      </div>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => addToast({ type: 'info', message: `Melihat detail broadcast ${item.id}` })}
                          className="p-2 rounded-lg bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
                          title="Lihat Detail"
                        >
                          <Eye size={15} />
                        </button>
                        <button 
                          onClick={() => {
                            setHistory(history.filter(h => h.id !== item.id));
                            addToast({ type: 'success', message: 'Broadcast berhasil dihapus dari riwayat.' });
                          }}
                          className="p-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 transition-colors"
                          title="Hapus Record"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
