import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit, Trash2, Eye } from 'lucide-react';
import competitionService from '@/services/competitionService';
import { Card, CardContent, CardHeader } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Select } from '@/components/common/Select';
import { StatusBadge } from '@/components/common/StatusBadge';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Pagination } from '@/components/common/Pagination';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { EmptyState } from '@/components/common/EmptyState';
import { STATUS_LABELS, STATUS_COLORS } from '@/utils/constants';
import { formatDate } from '@/utils/helpers';
import useUIStore from '@/store/uiStore';
import { Trophy } from 'lucide-react';

export default function ManageLombaPage() {
  const [competitions, setCompetitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const addToast = useUIStore((s) => s.addToast);
  const navigate = useNavigate();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 20 };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      const res = await competitionService.getCompetitions(params);
      setCompetitions(res.data || []);
      setTotalPages(res.meta?.total_pages || 1);
    } catch (err) {
      addToast({ type: 'error', message: 'Gagal memuat data lomba' });
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, addToast]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async () => {
    try {
      await competitionService.deleteCompetition(deleteTarget.id);
      addToast({ type: 'success', message: 'Lomba berhasil dihapus' });
      setDeleteTarget(null);
      load();
    } catch (err) {
      addToast({ type: 'error', message: 'Gagal menghapus lomba' });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Kelola Lomba</h1>
        <Button onClick={() => navigate('/admin/competitions/add')}>
          <Plus className="h-4 w-4 mr-1" />Tambah Lomba
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-3">
            <Input
              placeholder="Cari nama lomba..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="flex-1"
            />
            <Select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="w-40">
              <option value="">Semua Status</option>
              <option value="upcoming">Akan Datang</option>
              <option value="ongoing">Berlangsung</option>
              <option value="completed">Selesai</option>
              <option value="cancelled">Dibatalkan</option>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <LoadingSpinner className="py-12" />
          ) : competitions.length === 0 ? (
            <EmptyState icon={Trophy} title="Belum ada lomba" description="Klik tombol Tambah Lomba untuk membuat lomba baru" />
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-2 font-medium">Nama</th>
                      <th className="text-left py-3 px-2 font-medium">Status</th>
                      <th className="text-left py-3 px-2 font-medium">Tanggal</th>
                      <th className="text-left py-3 px-2 font-medium">Deadline</th>
                      <th className="text-left py-3 px-2 font-medium">Tim</th>
                      <th className="text-left py-3 px-2 font-medium">Max Anggota</th>
                      <th className="text-right py-3 px-2 font-medium">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {competitions.map((c) => (
                      <tr key={c.id} className="border-b hover:bg-muted/50">
                        <td className="py-3 px-2 font-medium">{c.name}</td>
                        <td className="py-3 px-2">
                          <StatusBadge status={c.status} labels={STATUS_LABELS} />
                        </td>
                        <td className="py-3 px-2 text-muted-foreground">{formatDate(c.event_date, 'dd/MM/yy') || '-'}</td>
                        <td className="py-3 px-2 text-muted-foreground">{formatDate(c.registration_deadline, 'dd/MM/yy') || '-'}</td>
                        <td className="py-3 px-2">{c._count?.teams || 0}</td>
                        <td className="py-3 px-2">{c.max_team_size}</td>
                        <td className="py-3 px-2">
                          <div className="flex justify-end gap-1">
                            <Button size="icon" variant="ghost" onClick={() => navigate(`/admin/competitions/${c.id}`)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button size="icon" variant="ghost" onClick={() => navigate(`/admin/competitions/${c.id}/edit`)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button size="icon" variant="ghost" onClick={() => setDeleteTarget(c)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
            </>
          )}
        </CardContent>
      </Card>

      {deleteTarget && (
        <ConfirmDialog
          isOpen={!!deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
          title="Hapus Lomba?"
          message={`Hapus lomba "${deleteTarget.name}"? Semua tim dan pendaftaran akan ikut terhapus.`}
          confirmText="Hapus"
        />
      )}
    </div>
  );
}
