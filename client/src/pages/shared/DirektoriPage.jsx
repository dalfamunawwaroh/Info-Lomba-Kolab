import { useState, useEffect, useCallback } from 'react';
import { Users } from 'lucide-react';
import directoryService from '@/services/directoryService';
import startupService from '@/services/startupService';
import { Card, CardContent, CardHeader } from '@/components/common/Card';
import { Input } from '@/components/common/Input';
import { Select } from '@/components/common/Select';
import { Badge } from '@/components/common/Badge';
import { Pagination } from '@/components/common/Pagination';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { EmptyState } from '@/components/common/EmptyState';
import { ROLE_LABELS } from '@/utils/constants';
import { getInitials } from '@/utils/helpers';
import { useNavigate } from 'react-router-dom';

export default function DirektoriPage() {
  const [directory, setDirectory] = useState([]);
  const [startups, setStartups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [startupFilter, setStartupFilter] = useState('');
  const navigate = useNavigate();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 20 };
      if (search) params.search = search;
      if (roleFilter) params.role = roleFilter;
      if (startupFilter) params.startup_id = startupFilter;
      const res = await directoryService.getDirectory(params);
      setDirectory(res.data || []);
      setTotalPages(res.meta?.total_pages || 1);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, search, roleFilter, startupFilter]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    startupService.getStartups().then((res) => setStartups(res.data || [])).catch(() => {});
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Direktori Anggota</h1>

      <div className="flex flex-col sm:flex-row gap-3">
        <Input
          placeholder="Cari nama..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="flex-1"
        />
        <Select value={roleFilter} onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }} className="w-36">
          <option value="">Semua Role</option>
          <option value="mahasiswa">Mahasiswa</option>
          <option value="dosen">Dosen</option>
          <option value="admin">Admin</option>
        </Select>
        <Select value={startupFilter} onChange={(e) => { setStartupFilter(e.target.value); setPage(1); }} className="w-40">
          <option value="">Semua Startup</option>
          {startups.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </Select>
      </div>

      {loading ? (
        <LoadingSpinner className="py-12" />
      ) : directory.length === 0 ? (
        <EmptyState icon={Users} title="Tidak ada anggota" />
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {directory.map((person) => (
              <Card key={person.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate(`/profile/${person.id}`)}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                      {getInitials(person.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{person.name}</p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <Badge variant="outline" className="text-xs">{ROLE_LABELS[person.role]}</Badge>
                        {person.startup && <span className="text-xs text-muted-foreground">{person.startup.name}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="mt-3">
                    {person.competition_stats?.active > 0 ? (
                      <Badge variant="success">Sedang Ikut {person.competition_stats.active} Lomba</Badge>
                    ) : (
                      <Badge variant="secondary">Tidak Ikut Lomba</Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}
