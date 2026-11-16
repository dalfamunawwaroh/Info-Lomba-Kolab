import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Bell, UsersRound, Clock, GraduationCap, CalendarDays, CheckCheck, Inbox, ChevronRight, Megaphone } from 'lucide-react';
import { differenceInCalendarDays, parseISO, isValid } from 'date-fns';
import notificationService from '@/services/notificationService';
import { formatRelativeTime, formatDate } from '@/utils/helpers';
import { cn } from '@/lib/utils';
import { PageHeader, Panel, EmptyBlock, FilterTabs, GhostButton, ICON_TONES } from '@/components/user/UserUI';

const TYPES = {
  team: { icon: UsersRound, tone: 'purple', label: 'Tim' },
  advisor: { icon: GraduationCap, tone: 'emerald', label: 'Pembimbing' },
  advisor_request: { icon: GraduationCap, tone: 'blue', label: 'Pengajuan' },
  event: { icon: CalendarDays, tone: 'amber', label: 'Jadwal' },
  deadline: { icon: Clock, tone: 'rose', label: 'Deadline' },
  broadcast: { icon: Megaphone, tone: 'blue', label: 'Pengumuman' },
  default: { icon: Bell, tone: 'purple', label: 'Info' },
};

function bucket(date) {
  const d = date ? parseISO(String(date)) : null;
  if (!d || !isValid(d)) return 'Lainnya';
  const diff = differenceInCalendarDays(new Date(), d);
  if (diff <= 0) return 'Hari ini';
  if (diff === 1) return 'Kemarin';
  if (diff <= 7) return 'Minggu ini';
  return 'Lebih lama';
}
const ORDER = ['Hari ini', 'Kemarin', 'Minggu ini', 'Lebih lama', 'Lainnya'];

export default function NotifikasiPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    notificationService.getNotifications()
      .then((res) => setItems(res.data?.notifications || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  const unread = items.filter((n) => !n.read).length;
  const typeCounts = useMemo(() => items.reduce((acc, n) => ({ ...acc, [n.type]: (acc[n.type] || 0) + 1 }), {}), [items]);

  const filtered = items.filter((n) => (filter === 'all' ? true : filter === 'unread' ? !n.read : n.type === filter));
  const groups = ORDER.map((g) => [g, filtered.filter((n) => bucket(n.date) === g)]).filter(([, l]) => l.length);

  const markAll = () => {
    notificationService.markAllRead().catch(() => {});
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  return (
    <div className="space-y-8 pb-12 animate-fade-in-up">
      <PageHeader
        icon={Bell}
        eyebrow="Kotak Masuk"
        title="Notifikasi"
        subtitle={unread > 0 ? `Ada ${unread} notifikasi baru yang belum kamu baca.` : 'Semua notifikasi sudah kamu baca.'}
        actions={unread > 0 && <GhostButton onClick={markAll}><CheckCheck size={17} /> Tandai semua dibaca</GhostButton>}
      />

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_320px] gap-6 items-start">
        <div className="space-y-6 min-w-0">
          <FilterTabs
            value={filter}
            onChange={setFilter}
            items={[
              { value: 'all', label: 'Semua', count: items.length },
              { value: 'unread', label: 'Belum dibaca', count: unread },
              ...Object.keys(typeCounts).map((t) => ({ value: t, label: (TYPES[t] || TYPES.default).label, count: typeCounts[t] })),
            ]}
          />

          {loading ? (
            <div className="space-y-3">{[0, 1, 2, 3].map((i) => <div key={i} className="h-24 rounded-[22px] bg-slate-200/70 dark:bg-white/5 animate-pulse" />)}</div>
          ) : groups.length === 0 ? (
            <Panel><EmptyBlock icon={filter === 'unread' ? CheckCheck : Inbox} title={filter === 'unread' ? 'Semua sudah dibaca' : 'Belum ada notifikasi'} description="Kabar terbaru soal tim, pembimbing, dan jadwal lomba akan muncul di sini." /></Panel>
          ) : (
            groups.map(([label, list]) => (
              <section key={label}>
                <h2 className="text-[12px] font-bold uppercase tracking-[0.14em] text-slate-400 mb-3 px-1">{label}</h2>
                <div className="bg-white dark:bg-[#131620]/90 rounded-[28px] border border-slate-200/80 dark:border-white/10 shadow-sm dark:shadow-xl divide-y divide-slate-100 dark:divide-white/5 overflow-hidden">
                  {list.map((n) => {
                    const cfg = TYPES[n.type] || TYPES.default;
                    const Wrapper = n.link ? Link : 'div';
                    return (
                      <Wrapper
                        key={n.id}
                        {...(n.link ? { to: n.link } : {})}
                        className={cn('group flex items-start gap-4 p-5 md:p-6 transition-colors', n.link && 'hover:bg-slate-50 dark:hover:bg-white/[0.03]', !n.read && 'bg-purple-500/[0.04]')}
                      >
                        <div className={cn('w-12 h-12 rounded-2xl border flex items-center justify-center shrink-0', ICON_TONES[cfg.tone])}><cfg.icon size={20} /></div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className={cn('text-[15px] truncate', n.read ? 'font-bold text-slate-700 dark:text-slate-200' : 'font-black text-slate-900 dark:text-white')}>{n.title}</p>
                            {!n.read && <span className="w-2 h-2 rounded-full bg-[#9333EA] ring-4 ring-purple-500/15 shrink-0" />}
                          </div>
                          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">{n.message}</p>
                          <p className="text-[12px] font-semibold text-slate-400 mt-2" title={formatDate(n.date)}>{formatRelativeTime(n.date)}</p>
                        </div>
                        {n.link && <ChevronRight size={18} className="text-slate-300 dark:text-slate-600 group-hover:text-purple-500 group-hover:translate-x-0.5 transition-all mt-3 shrink-0" />}
                      </Wrapper>
                    );
                  })}
                </div>
              </section>
            ))
          )}
        </div>

        <aside className="space-y-6 xl:sticky xl:top-28">
          <div className="rounded-[28px] p-6 bg-gradient-to-br from-[#9333EA] to-[#6C1B75] text-white shadow-xl relative overflow-hidden">
            <div className="absolute -right-6 -top-6 opacity-20"><Bell size={120} /></div>
            <p className="text-[12px] font-bold uppercase tracking-wider text-purple-200">Belum dibaca</p>
            <p className="text-5xl font-black mt-1">{loading ? '–' : unread}</p>
            <p className="text-sm font-medium text-purple-100 mt-2">dari {items.length} notifikasi</p>
          </div>
          <Panel className="p-6 md:p-6">
            <h3 className="font-black text-slate-900 dark:text-white mb-4">Kategori</h3>
            <ul className="space-y-2">
              {Object.entries(typeCounts).map(([t, c]) => {
                const cfg = TYPES[t] || TYPES.default;
                return (
                  <li key={t}>
                    <button onClick={() => setFilter(t)} className={cn('w-full flex items-center gap-3 p-2.5 rounded-xl transition-colors', filter === t ? 'bg-purple-500/10' : 'hover:bg-slate-50 dark:hover:bg-white/5')}>
                      <span className={cn('w-9 h-9 rounded-xl border flex items-center justify-center', ICON_TONES[cfg.tone])}><cfg.icon size={16} /></span>
                      <span className="flex-1 text-left font-bold text-[14px] text-slate-700 dark:text-slate-200">{cfg.label}</span>
                      <span className="text-[13px] font-bold text-slate-400">{c}</span>
                    </button>
                  </li>
                );
              })}
              {!loading && items.length === 0 && <p className="text-sm text-slate-500">Belum ada kategori.</p>}
            </ul>
            <Link to="/mahasiswa/settings" className="mt-5 flex items-center justify-between text-sm font-bold text-purple-700 dark:text-purple-300 hover:underline underline-offset-4">Atur preferensi notifikasi <ChevronRight size={16} /></Link>
          </Panel>
        </aside>
      </div>
    </div>
  );
}
