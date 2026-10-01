import { useState, useEffect, useCallback } from 'react';
import { CheckCircle, XCircle } from 'lucide-react';
import advisorService from '@/services/advisorService';
import { Card, CardContent, CardHeader } from '@/components/common/Card';
import { Select } from '@/components/common/Select';
import { Button } from '@/components/common/Button';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Modal } from '@/components/common/Modal';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { EmptyState } from '@/components/common/EmptyState';
import { ADVISOR_STATUS_LABELS } from '@/utils/constants';
import { formatRelativeTime } from '@/utils/helpers';
import useUIStore from '@/store/uiStore';
import { ClipboardList } from 'lucide-react';

export default function PengajuanMasukPage() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [responding, setResponding] = useState(false);
  const addToast = useUIStore((s) => s.addToast);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      const res = await advisorService.getAdvisorRequests(params);
      setRequests(res.data || []);
    } catch (err) {
      addToast({ type: 'error', message: 'Gagal memuat pengajuan' });
    } finally {
      setLoading(false);
    }
  }, [statusFilter, addToast]);

  useEffect(() => { load(); }, [load]);

  const handleApprove = async (id) => {
    setResponding(true);
    try {
      await advisorService.respondToRequest(id, { status: 'approved' });
      addToast({ type: 'success', message: 'Pengajuan disetujui' });
      load();
    } catch (err) {
      addToast({ type: 'error', message: 'Gagal menyetujui' });
    } finally {
      setResponding(false);
    }
  };

  const handleReject = async () => {
    setResponding(true);
    try {
      await advisorService.respondToRequest(rejectTarget.id, {
        status: 'rejected',
        rejection_reason: rejectReason,
      });
      addToast({ type: 'success', message: 'Pengajuan ditolak' });
      setRejectTarget(null);
      setRejectReason('');
      load();
    } catch (err) {
      addToast({ type: 'error', message: 'Gagal menolak' });
    } finally {
      setResponding(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Pengajuan Pembimbing</h1>

      <div className="flex gap-3">
        <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-40">
          <option value="pending">Pending</option>
          <option value="approved">Disetujui</option>
          <option value="rejected">Ditolak</option>
          <option value="">Semua</option>
        </Select>
      </div>

      {loading ? (
        <LoadingSpinner className="py-12" />
      ) : requests.length === 0 ? (
        <EmptyState icon={ClipboardList} title="Tidak ada pengajuan" description="Belum ada mahasiswa yang mengajukan Anda sebagai pembimbing" />
      ) : (
        <div className="space-y-3">
          {requests.map((req) => (
            <Card key={req.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="font-medium">{req.team?.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Lomba: {req.team?.competition?.name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Ketua: {req.team?.leader?.name}
                    </p>
                    <p className="text-xs text-muted-foreground">{formatRelativeTime(req.created_at)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={req.status} labels={ADVISOR_STATUS_LABELS} />
                    {req.status === 'pending' && (
                      <>
                        <Button size="sm" onClick={() => handleApprove(req.id)} disabled={responding}>
                          <CheckCircle className="h-4 w-4 mr-1" />Terima
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => { setRejectTarget(req); setRejectReason(''); }} disabled={responding}>
                          <XCircle className="h-4 w-4 mr-1" />Tolak
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Modal isOpen={!!rejectTarget} onClose={() => setRejectTarget(null)} title="Tolak Pengajuan">
        <div className="space-y-4">
          <p className="text-sm">Tolak pengajuan dari <strong>{rejectTarget?.team?.name}</strong>?</p>
          <div className="space-y-2">
            <label className="text-sm font-medium">Alasan Penolakan *</label>
            <textarea
              className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Alasan..."
              rows={2}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setRejectTarget(null)}>Batal</Button>
            <Button variant="destructive" onClick={handleReject} disabled={!rejectReason.trim() || responding}>
              Tolak
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
