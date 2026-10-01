import { useState, useEffect } from 'react';
import { History } from 'lucide-react';
import historyService from '@/services/historyService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/common/Card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/common/Tabs';
import { StatusBadge } from '@/components/common/StatusBadge';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { EmptyState } from '@/components/common/EmptyState';
import { STATUS_LABELS } from '@/utils/constants';
import { useAuth } from '@/hooks/useAuth';

export default function HistoryPage() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    historyService.getUserHistory(user.id).then((res) => {
      setData(res.data);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [user.id]);

  if (loading) return <LoadingSpinner className="py-12" />;

  const upcoming = data?.competitions?.upcoming || [];
  const ongoing = data?.competitions?.ongoing || [];
  const completed = data?.competitions?.completed || [];
  const all = [...upcoming, ...ongoing, ...completed];

  const renderList = (items) => {
    if (items.length === 0) {
      return <EmptyState icon={History} title="Tidak ada data" />;
    }
    return (
      <div className="space-y-3">
        {items.map((item, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="font-medium">{item.competition?.name}</p>
                <StatusBadge status={item.competition?.status} labels={STATUS_LABELS} />
              </div>
              {item.team && (
                <div className="text-sm text-muted-foreground">
                  <p>Tim: {item.team.name} ({item.team.role_in_team === 'leader' ? 'Ketua' : 'Anggota'})</p>
                </div>
              )}
              {item.advisors?.length > 0 && (
                <p className="text-sm text-muted-foreground">
                  Dosen: {item.advisors.map(a => a.name).join(', ')}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">History Lomba</h1>
      <div className="text-sm text-muted-foreground mb-4">
        Total: {all.length} lomba
      </div>

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">Semua ({all.length})</TabsTrigger>
          <TabsTrigger value="ongoing">Berlangsung ({ongoing.length})</TabsTrigger>
          <TabsTrigger value="upcoming">Akan Datang ({upcoming.length})</TabsTrigger>
          <TabsTrigger value="completed">Selesai ({completed.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="all">{renderList(all)}</TabsContent>
        <TabsContent value="ongoing">{renderList(ongoing)}</TabsContent>
        <TabsContent value="upcoming">{renderList(upcoming)}</TabsContent>
        <TabsContent value="completed">{renderList(completed)}</TabsContent>
      </Tabs>
    </div>
  );
}
