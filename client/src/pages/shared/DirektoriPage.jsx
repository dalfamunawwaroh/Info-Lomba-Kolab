import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Building2, Trophy, GraduationCap, BookUser, ShieldCheck } from 'lucide-react';
import directoryService from '@/services/directoryService';
import startupService from '@/services/startupService';
import { Pagination } from '@/components/common/Pagination';
import { useAuth } from '@/hooks/useAuth';
import { useDebounce } from '@/hooks/useDebounce';
import { ROLE_LABELS } from '@/utils/constants';
import {
  PageHeader, Panel, Pill, Avatar, EmptyBlock, FilterTabs, SearchField, SelectField, SkeletonBlocks,
} from '@/components/user/UserUI';

const ROLE_STYLE = {
  mahasiswa: ['purple', GraduationCap],
  dosen: ['emerald', BookUser],
  admin: ['blue', ShieldCheck],
};

export default function DirektoriPage() {
  const [directory, setDirectory] = useState([]);
  const [startups, setStartups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [startupFilter, setStartupFilter] = useState('');
  const [activity, setActivity] = useState('');
  const debounced = useDebounce(search, 300);
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 18 };
      if (debounced) params.search = debounced;
      if (roleFilter) params.role = roleFilter;
      if (startupFilter) params.startup_id = startupFilter;
      const res = await directoryService.getDirectory(params);
      setDirectory(res.data || []);
      setTotalPages(res.meta?.total_pages || 1);
      setTotal(res.meta?.total || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, debounced, roleFilter, startupFilter]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [debounced, roleFilter, startupFilter]);
  useEffect(() => {
    startupService.getStartups().then((res) => setStartups(res.data || [])).catch(() => {});
  }, []);

  // Filter status partisipasi dilakukan di halaman aktif (data per halaman dari server)
  const shown = directory.filter((p) => {
    if (activity === 'active') return (p.competition_stats?.active || 0) > 0;
    if (activity === 'idle') return !(p.competition_stats?.active > 0);
    return true;
  });

  const openProfile = (person) => navigate(isAdmin ? `/admin/users/${person.id}` : `/${user?.role || 'mahasiswa'}/profile/${person.id}`);

  return (
    <div className="space-y-8 pb-12 animate-fade-in-up">
      <PageHeader
        icon={Users}
        eyebrow="Komunitas Ko+Lab"
        title="Direktori Anggota"
        subtitle="Cari teman setim yang available, lihat siapa yang sedang aktif berlomba."
      />

      <div className="space-y-4">
        <div className="flex flex-col lg:flex-row gap-3">
          <SearchField value={search} onChange={setSearch} placeholder="Cari nama, email, atau NIM..." className="flex-1" />
          <SelectField value={startupFilter} onChange={setStartupFilter} className="lg:w-56">
            <option value="">Semua Startup</option>
            {startups.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </SelectField>
          <SelectField value={activity} onChange={setActivity} className="lg:w-56">
            <option value="">Semua Status</option>
            <option value="active">Sedang ikut lomba</option>
            <option value="idle">Tidak ikut lomba (available)</option>
          </SelectField>
        </div>
        <FilterTabs
          value={roleFilter}
          onChange={setRoleFilter}
          items={[
            { value: '', label: 'Semua' },
            { value: 'mahasiswa', label: 'Mahasiswa' },
            { value: 'dosen', label: 'Dosen' },
            { value: 'admin', label: 'Admin' },
          ]}
        />
      </div>

      {loading ? (
        <SkeletonBlocks count={6} className="h-52" />
      ) : shown.length === 0 ? (
        <Panel><EmptyBlock icon={Users} title="Tidak ada anggota" description="Coba ubah kata kunci atau filter." /></Panel>
      ) : (
        <>
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Menampilkan {shown.length} dari {total} anggota</p>
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {shown.map((person) => {
              const [tone, RoleIcon] = ROLE_STYLE[person.role] || ['slate', Users];
              const active = person.competition_stats?.active || 0;
              return (
                <button
                  key={person.id}
                  onClick={() => openProfile(person)}
                  className="group text-left bg-white dark:bg-[#131620]/90 rounded-[28px] p-6 border border-slate-200/80 dark:border-white/10 shadow-sm dark:shadow-xl hover:border-purple-500/40 hover:-translate-y-1 transition-all duration-300"
                >
                  <div className="flex items-start gap-4">
                    <div className="relative">
                      <Avatar name={person.name} size="lg" />
                      <span className={`absolute bottom-0 right-0 w-4 h-4 rounded-full ring-[3px] ring-white dark:ring-[#131620] ${active > 0 ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'}`} title={active > 0 ? 'Sedang ikut lomba' : 'Available'} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-black text-[17px] text-slate-900 dark:text-white truncate group-hover:text-purple-700 dark:group-hover:text-purple-300 transition-colors">
                        {person.name}{person.id === user?.id && <span className="text-slate-400 font-medium text-sm"> (kamu)</span>}
                      </p>
                      <p className="text-[13px] font-medium text-slate-500 dark:text-slate-400 truncate">{person.position || person.nip_nim || '—'}</p>
                      <div className="mt-2"><Pill tone={tone} icon={RoleIcon}>{ROLE_LABELS[person.role] || person.role}</Pill></div>
                    </div>
                  </div>
                  <div className="mt-5 pt-5 border-t border-slate-100 dark:border-white/5 flex items-center justify-between gap-3 text-[13px] font-semibold">
                    <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 truncate"><Building2 size={14} /> {person.startup?.name || 'Tanpa startup'}</span>
                    {active > 0 ? (
                      <span className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 shrink-0"><Trophy size={14} /> {active} lomba aktif</span>
                    ) : (
                      <span className="text-slate-400 shrink-0">Available</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
          <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}
