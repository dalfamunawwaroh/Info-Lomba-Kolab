import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { History, Trophy, PlayCircle, CalendarClock, CheckCircle2, Crown, UserCheck, UsersRound, ArrowUpRight, Hourglass } from 'lucide-react';
import historyService from '@/services/historyService';
import { useAuth } from '@/hooks/useAuth';
import { formatDate } from '@/utils/helpers';
import { PageHeader, Panel, Pill, StatusPill, EmptyBlock, FilterTabs, SkeletonBlocks, ICON_TONES } from '@/components/user/UserUI';

const ROLE = {
  leader: ['Ketua', 'amber', Crown],
  member: ['Anggota', 'purple', UsersRound],
  advisor: ['Dosen Pembimbing', 'emerald', UserCheck],
};

export default function HistoryPage() {
  const { user, isDosen } = useAuth();
  const base = isDosen ? '/dosen' : '/mahasiswa';
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('all');

  useEffect(() => {
    historyService.getUserHistory(user.id)
      .then((res) => setData(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user.id]);

  const groups = useMemo(() => {
    const c = data?.competitions || {};
    const upcoming = c.upcoming || [];
    const ongoing = c.ongoing || [];
    const completed = c.completed || [];
    return { all: [...ongoing, ...upcoming, ...completed], upcoming, ongoing, completed };
  }, [data]);

  const items = groups[tab] || [];

  return (
    <div className="space-y-8 pb-12 animate-fade-in-up">
      <PageHeader
        icon={History}
        eyebrow="Rekam Jejak"
        title="History Lomba"
        subtitle={isDosen ? 'Semua lomba yang pernah dan sedang kamu bimbing.' : 'Semua lomba yang pernah, sedang, dan akan kamu ikuti — bekal portofoliomu.'}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {[
          { label: 'Total Lomba', val: groups.all.length, icon: Trophy, tone: 'purple' },
          { label: 'Berlangsung', val: groups.ongoing.length, icon: PlayCircle, tone: 'blue' },
          { label: 'Akan Datang', val: groups.upcoming.length, icon: CalendarClock, tone: 'amber' },
          { label: 'Selesai', val: groups.completed.length, icon: CheckCircle2, tone: 'emerald' },
        ].map((s) => (
          <div key={s.label} className="bg-white dark:bg-[#131620]/90 rounded-[28px] p-5 md:p-6 border border-slate-200/80 dark:border-white/10 shadow-sm dark:shadow-xl">
            <div className={`inline-flex p-3 rounded-2xl border mb-4 ${ICON_TONES[s.tone]}`}><s.icon size={22} strokeWidth={2.5} /></div>
            <p className="text-slate-500 dark:text-slate-400 text-[12px] font-bold uppercase tracking-wider">{s.label}</p>
            <p className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white">{loading ? '–' : s.val}</p>
          </div>
        ))}
      </div>

      <FilterTabs
        value={tab}
        onChange={setTab}
        items={[
          { value: 'all', label: 'Semua', count: groups.all.length },
          { value: 'ongoing', label: 'Berlangsung', count: groups.ongoing.length },
          { value: 'upcoming', label: 'Akan Datang', count: groups.upcoming.length },
          { value: 'completed', label: 'Selesai', count: groups.completed.length },
        ]}
      />

      {loading ? (
        <SkeletonBlocks count={3} className="h-48" />
      ) : items.length === 0 ? (
        <Panel>
          <EmptyBlock
            icon={History}
            title="Belum ada riwayat"
            description={tab === 'all' ? 'Riwayat lomba akan muncul di sini setelah kamu mendaftar.' : 'Tidak ada lomba di kategori ini.'}
            action={!isDosen && <Link to="/mahasiswa/competitions" className="font-bold text-purple-700 dark:text-purple-300 hover:underline underline-offset-4">Cari lomba sekarang</Link>}
          />
        </Panel>
      ) : (
        <ol className="relative md:ml-4 md:border-l-2 border-slate-200 dark:border-white/10 md:pl-8 space-y-5">
          {items.map((item, i) => {
            const comp = item.competition || {};
            const [roleLabel, roleTone, RoleIcon] = ROLE[item.team?.role_in_team] || [];
            return (
              <li key={`${comp.id}-${item.team?.id || i}`} className="relative">
                <span className={`hidden md:block absolute -left-[43px] top-8 w-4 h-4 rounded-full ring-4 ring-[#F8FAFC] dark:ring-[#0B0D11] ${comp.status === 'ongoing' ? 'bg-blue-500' : comp.status === 'upcoming' ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                <div className="group bg-white dark:bg-[#131620]/90 rounded-[28px] border border-slate-200/80 dark:border-white/10 shadow-sm dark:shadow-xl overflow-hidden flex flex-col sm:flex-row hover:border-purple-500/40 transition-all">
                  <div className="sm:w-48 h-32 sm:h-auto relative bg-gradient-to-br from-[#2E1065] to-[#6C1B75] shrink-0">
                    {comp.image_url && <img src={comp.image_url} alt="" className="w-full h-full object-cover opacity-80" onError={(e) => { e.currentTarget.style.display = 'none'; }} />}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 to-transparent" />
                    <p className="absolute bottom-3 left-4 text-white text-[12px] font-bold">{formatDate(comp.event_date, 'dd MMM yyyy')}</p>
                  </div>
                  <div className="p-6 flex-1 min-w-0">
                    <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                      <div className="min-w-0">
                        <Link to={`${base}/competitions/${comp.id}`} className="font-black text-lg text-slate-900 dark:text-white hover:text-purple-700 dark:hover:text-purple-300 transition-colors">{comp.name || comp.title}</Link>
                        {comp.category && <p className="text-[13px] font-medium text-slate-500 dark:text-slate-400">{comp.category}{comp.organizer ? ` • ${comp.organizer}` : ''}</p>}
                      </div>
                      <StatusPill status={comp.status} />
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {item.team ? (
                        <>
                          <Pill tone="slate" icon={UsersRound}>{item.team.name}</Pill>
                          {roleLabel && <Pill tone={roleTone} icon={RoleIcon}>{roleLabel}</Pill>}
                        </>
                      ) : (
                        <Pill tone="amber" icon={Hourglass}>Menunggu penempatan tim</Pill>
                      )}
                      {item.advisors?.length > 0 && item.team?.role_in_team !== 'advisor' && (
                        <Pill tone="emerald" icon={UserCheck}>{item.advisors.map((a) => a.name).join(', ')}</Pill>
                      )}
                    </div>
                    {!isDosen && item.team && comp.status !== 'completed' && (
                      <Link to={`/mahasiswa/my-teams?team=${item.team.id}`} className="inline-flex items-center gap-1.5 mt-4 text-sm font-bold text-purple-700 dark:text-purple-300 hover:underline underline-offset-4">
                        Kelola tim <ArrowUpRight size={15} />
                      </Link>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
