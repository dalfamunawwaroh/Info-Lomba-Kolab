import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy } from 'lucide-react';
import competitionService from '@/services/competitionService';
import historyService from '@/services/historyService';
import { CompetitionCard } from '@/components/competition/CompetitionCard';
import { Input } from '@/components/common/Input';
import { Select } from '@/components/common/Select';
import { Pagination } from '@/components/common/Pagination';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { EmptyState } from '@/components/common/EmptyState';
import { useAuth } from '@/hooks/useAuth';

export default function DaftarLombaPage() {
  const { user } = useAuth();
  const [competitions, setCompetitions] = useState([]);
  const [registeredIds, setRegisteredIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const navigate = useNavigate();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 12 };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      const [compRes, histRes] = await Promise.all([
        competitionService.getCompetitions(params),
        historyService.getUserHistory(user.id).catch(() => ({ data: null })),
      ]);
      setCompetitions(compRes.data || []);
      setTotalPages(compRes.meta?.total_pages || 1);

      // Collect registered competition IDs
      const hist = histRes?.data?.competitions;
      if (hist) {
        const ids = new Set();
        [...(hist.upcoming || []), ...(hist.ongoing || [])].forEach((h) => {
          ids.add(h.competition?.id);
        });
        setRegisteredIds(ids);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, user.id]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Daftar Lomba</h1>

      <div className="flex flex-col sm:flex-row gap-3">
        <Input
          placeholder="Cari lomba..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="flex-1"
        />
        <Select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="w-40">
          <option value="">Semua Status</option>
          <option value="upcoming">Akan Datang</option>
          <option value="ongoing">Berlangsung</option>
          <option value="completed">Selesai</option>
        </Select>
      </div>

      {loading ? (
        <LoadingSpinner className="py-12" />
      ) : competitions.length === 0 ? (
        <EmptyState icon={Trophy} title="Tidak ada lomba" description="Belum ada lomba tersedia saat ini" />
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {competitions.map((comp) => (
              <CompetitionCard
                key={comp.id}
                competition={comp}
                basePath="/mahasiswa"
                isRegistered={registeredIds.has(comp.id)}
                onRegister={(c) => navigate(`/mahasiswa/competitions/${c.id}/register`)}
              />
            ))}
          </div>
          <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}
