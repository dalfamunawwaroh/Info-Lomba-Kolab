import { useState, useEffect } from 'react';
import { UsersRound } from 'lucide-react';
import advisorService from '@/services/advisorService';
import { Card, CardContent } from '@/components/common/Card';
import { StatusBadge } from '@/components/common/StatusBadge';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { EmptyState } from '@/components/common/EmptyState';
import { ADVISOR_STATUS_LABELS } from '@/utils/constants';
import useUIStore from '@/store/uiStore';

export default function TimBimbinganPage() {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const addToast = useUIStore((s) => s.addToast);

  useEffect(() => {
    advisorService.getMyTeams().then((res) => {
      setTeams(res.data || []);
    }).catch(() => addToast({ type: 'error', message: 'Gagal memuat data' }))
    .finally(() => setLoading(false));
  }, [addToast]);

  if (loading) return <LoadingSpinner className="py-12" />;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Tim Bimbingan</h1>

      {teams.length === 0 ? (
        <EmptyState icon={UsersRound} title="Belum ada tim bimbingan" description="Anda belum membimbing tim manapun" />
      ) : (
        <div className="space-y-3">
          {teams.map((item) => (
            <Card key={item.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium">{item.team?.name}</p>
                    <p className="text-sm text-muted-foreground">Lomba: {item.team?.competition?.name}</p>
                    <div className="mt-2">
                      <p className="text-sm font-medium">Anggota:</p>
                      <ul className="text-sm text-muted-foreground">
                        {item.team?.members?.map((m) => (
                          <li key={m.user?.id}>
                            {m.user?.name} {m.role_in_team === 'leader' ? '(Ketua)' : ''}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  <StatusBadge status={item.status} labels={ADVISOR_STATUS_LABELS} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
