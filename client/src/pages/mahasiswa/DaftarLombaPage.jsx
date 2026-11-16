import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, Sparkles } from 'lucide-react';
import competitionService from '@/services/competitionService';
import historyService from '@/services/historyService';
import { CompetitionCard } from '@/components/competition/CompetitionCard';
import { Pagination } from '@/components/common/Pagination';
import { useAuth } from '@/hooks/useAuth';
import { useDebounce } from '@/hooks/useDebounce';
import {
  PageHeader, Panel, EmptyBlock, FilterTabs, SearchField, SelectField, SkeletonBlocks,
} from '@/components/user/UserUI';

const PAGE_SIZE = 9;

export default function DaftarLombaPage() {
  const { user, isMahasiswa, isDosen } = useAuth();
  const basePath = isDosen ? '/dosen' : '/mahasiswa';
  const [all, setAll] = useState([]);
  const [registeredIds, setRegisteredIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [category, setCategory] = useState('');
  const [sort, setSort] = useState('deadline');
  const debounced = useDebounce(search, 300);
  const navigate = useNavigate();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [compRes, histRes] = await Promise.all([
        competitionService.getCompetitions(debounced ? { search: debounced } : {}),
        isMahasiswa ? historyService.getUserHistory(user.id).catch(() => ({ data: null })) : Promise.resolve({ data: null }),
      ]);
      setAll(compRes.data || []);
      const hist = histRes?.data?.competitions;
      if (hist) {
        setRegisteredIds(new Set([...(hist.upcoming || []), ...(hist.ongoing || [])].map((h) => h.competition?.id)));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [debounced, isMahasiswa, user.id]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [debounced, status, category, sort]);

  const categories = useMemo(() => [...new Set(all.map((c) => c.category).filter(Boolean))], [all]);
  const counts = useMemo(() => ({
    all: all.length,
    upcoming: all.filter((c) => c.status === 'upcoming').length,
    ongoing: all.filter((c) => c.status === 'ongoing').length,
    completed: all.filter((c) => c.status === 'completed').length,
  }), [all]);

  const list = useMemo(() => {
    let l = all;
    if (status) l = l.filter((c) => c.status === status);
    if (category) l = l.filter((c) => c.category === category);
    const by = {
      deadline: (a, b) => String(a.registration_deadline || '9').localeCompare(String(b.registration_deadline || '9')),
      newest: (a, b) => String(b.created_at || '').localeCompare(String(a.created_at || '')),
      name: (a, b) => String(a.title || a.name).localeCompare(String(b.title || b.name)),
    };
    return [...l].sort(by[sort]);
  }, [all, status, category, sort]);

  const totalPages = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
  const pageItems = list.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="space-y-8 pb-12 animate-fade-in-up">
      <PageHeader
        icon={Trophy}
        eyebrow="Info Lomba"
        title="Daftar Lomba"
        subtitle="Temukan kompetisi yang cocok, cek deadline, lalu daftar bersama timmu."
      />

      {counts.upcoming > 0 && isMahasiswa && (
        <div className="flex items-center gap-4 p-5 rounded-[24px] bg-gradient-to-r from-[#9333EA]/10 via-fuchsia-500/5 to-transparent border border-purple-500/20">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-[#9333EA] to-[#6C1B75] text-white shrink-0"><Sparkles size={20} /></div>
          <p className="font-semibold text-slate-700 dark:text-slate-200">
            Ada <span className="font-black text-purple-700 dark:text-purple-300">{counts.upcoming} lomba</span> yang masih membuka pendaftaran. Jangan sampai ketinggalan!
          </p>
        </div>
      )}

      <div className="space-y-4">
        <div className="flex flex-col lg:flex-row gap-3">
          <SearchField value={search} onChange={setSearch} placeholder="Cari nama lomba, penyelenggara..." className="flex-1" />
          <SelectField value={category} onChange={setCategory} className="lg:w-56">
            <option value="">Semua Kategori</option>
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </SelectField>
          <SelectField value={sort} onChange={setSort} className="lg:w-52">
            <option value="deadline">Deadline terdekat</option>
            <option value="newest">Terbaru ditambahkan</option>
            <option value="name">Nama (A–Z)</option>
          </SelectField>
        </div>
        <FilterTabs
          value={status}
          onChange={setStatus}
          items={[
            { value: '', label: 'Semua', count: counts.all },
            { value: 'upcoming', label: 'Buka Pendaftaran', count: counts.upcoming },
            { value: 'ongoing', label: 'Berlangsung', count: counts.ongoing },
            { value: 'completed', label: 'Selesai', count: counts.completed },
          ]}
        />
      </div>

      {loading ? (
        <SkeletonBlocks count={6} className="h-[420px]" />
      ) : pageItems.length === 0 ? (
        <Panel>
          <EmptyBlock icon={Trophy} title="Tidak ada lomba" description={search || status || category ? 'Coba ubah kata kunci atau filter pencarian.' : 'Belum ada lomba tersedia saat ini.'} />
        </Panel>
      ) : (
        <>
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Menampilkan {pageItems.length} dari {list.length} lomba</p>
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {pageItems.map((comp) => (
              <CompetitionCard
                key={comp.id}
                competition={comp}
                basePath={basePath}
                isRegistered={registeredIds.has(comp.id)}
                onRegister={isMahasiswa ? (c) => navigate(`/mahasiswa/competitions/${c.id}/register`) : undefined}
              />
            ))}
          </div>
          <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}
