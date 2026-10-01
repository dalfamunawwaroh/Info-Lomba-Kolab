import { useState, useEffect, useCallback } from 'react';
import { CheckCircle, XCircle, ClipboardList } from 'lucide-react';
import submissionService from '@/services/submissionService';
import { Card, CardContent, CardHeader } from '@/components/common/Card';
import { Select } from '@/components/common/Select';
import { Button } from '@/components/common/Button';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Badge } from '@/components/common/Badge';
import { Modal } from '@/components/common/Modal';
import { Pagination } from '@/components/common/Pagination';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { EmptyState } from '@/components/common/EmptyState';
import { ADVISOR_STATUS_LABELS, SUBMISSION_TYPE_LABELS } from '@/utils/constants';
import { formatRelativeTime } from '@/utils/helpers';
import useUIStore from '@/store/uiStore';

export default function PengajuanPage() {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [typeFilter, setTypeFilter] = useState('');
  const [respondTarget, setRespondTarget] = useState(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [responding, setResponding] = useState(false);
  const addToast = useUIStore((s) => s.addToast);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 20 };
      if (statusFilter) params.status = statusFilter;
      if (typeFilter) params.type = typeFilter;
      const res = await submissionService.getSubmissions(params);
      setSubmissions(res.data || []);
      setTotalPages(res.meta?.total_pages || 1);
    } catch (err) {
      addToast({ type: 'error', message: 'Gagal memuat pengajuan' });
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, typeFilter, addToast]);

  useEffect(() => { load(); }, [load]);

  const handleRespond = async (status) => {
    setResponding(true);
    try {
      await submissionService.respondToSubmission(respondTarget.id, {
        status,
        review_notes: reviewNotes || undefined,
      });
      addToast({ type: 'success', message: `Pengajuan ${status === 'approved' ? 'disetujui' : 'ditolak'}` });
      setRespondTarget(null);
      setReviewNotes('');
      load();
    } catch (err) {
      addToast({ type: 'error', message: 'Gagal merespons pengajuan' });
    } finally {
      setResponding(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Monitoring Pengajuan</h1>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-3">
            <Select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="w-40">
              <option value="">Semua Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Disetujui</option>
              <option value="rejected">Ditolak</option>
            </Select>
            <Select value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }} className="w-48">
              <option value="">Semua Jenis</option>
              <option value="advisor_self_assign">Ajukan Diri</option>
              <option value="team_change">Perubahan Tim</option>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <LoadingSpinner className="py-12" />
          ) : submissions.length === 0 ? (
            <EmptyState icon={ClipboardList} title="Tidak ada pengajuan" />
          ) : (
            <>
              <div className="space-y-3">
                {submissions.map((sub) => (
                  <div key={sub.id} className="p-4 rounded-lg border hover:bg-muted/50">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{SUBMISSION_TYPE_LABELS[sub.type] || sub.type}</Badge>
                          <StatusBadge status={sub.status} labels={ADVISOR_STATUS_LABELS} />
                        </div>
                        <p className="text-sm font-medium">{sub.requester?.name}</p>
                        <p className="text-sm text-muted-foreground">{sub.description}</p>
                        {sub.team && (
                          <p className="text-xs text-muted-foreground">
                            Tim: {sub.team.name} {sub.competition ? `(${sub.competition.name})` : ''}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground">{formatRelativeTime(sub.created_at)}</p>
                      </div>
                      {sub.status === 'pending' && (
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => { setRespondTarget(sub); setReviewNotes(''); }}>
                            <CheckCircle className="h-4 w-4 mr-1" />Review
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
            </>
          )}
        </CardContent>
      </Card>

      {/* Review Modal */}
      <Modal isOpen={!!respondTarget} onClose={() => setRespondTarget(null)} title="Review Pengajuan">
        {respondTarget && (
          <div className="space-y-4">
            <div>
              <p className="font-medium">{respondTarget.requester?.name}</p>
              <p className="text-sm text-muted-foreground">{respondTarget.description}</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Catatan (opsional)</label>
              <textarea
                className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder="Catatan review..."
                rows={2}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="destructive" onClick={() => handleRespond('rejected')} disabled={responding}>
                <XCircle className="h-4 w-4 mr-1" />Tolak
              </Button>
              <Button onClick={() => handleRespond('approved')} disabled={responding}>
                <CheckCircle className="h-4 w-4 mr-1" />Setujui
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
