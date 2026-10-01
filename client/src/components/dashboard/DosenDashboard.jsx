import { Link } from 'react-router-dom';
import { Trophy, UsersRound, ClipboardList, Plus } from 'lucide-react';
import { StatCard } from './StatCard';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { StatusBadge } from '@/components/common/StatusBadge';
import { ADVISOR_STATUS_LABELS } from '@/utils/constants';

function DosenDashboard({ stats, pendingRequests, upcomingCompetitions }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard Dosen</h1>
        <Button asChild size="sm">
          <Link to="/dosen/competitions/add"><Plus className="h-4 w-4 mr-1" />Tambah Lomba</Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard title="Tim Dibimbing" value={stats?.myTeams} icon={UsersRound} iconColor="text-purple-500" />
        <StatCard title="Pengajuan Masuk" value={stats?.pendingRequests} icon={ClipboardList} iconColor="text-orange-500" />
        <StatCard title="Lomba Diikuti" value={stats?.myCompetitions} icon={Trophy} iconColor="text-green-500" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Pengajuan Pembimbing</CardTitle>
            <Link to="/dosen/advisor-requests" className="text-sm text-primary hover:underline">Lihat Semua</Link>
          </CardHeader>
          <CardContent>
            {pendingRequests?.length > 0 ? (
              <ul className="space-y-3">
                {pendingRequests.slice(0, 5).map((req) => (
                  <li key={req.id} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div>
                      <p className="text-sm font-medium">{req.team?.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {req.team?.competition?.name} — Ketua: {req.team?.leader?.name}
                      </p>
                    </div>
                    <div className="flex gap-2 items-center">
                      <StatusBadge status={req.status} labels={ADVISOR_STATUS_LABELS} />
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">Tidak ada pengajuan masuk</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Lomba Mendatang</CardTitle>
            <Link to="/dosen/competitions" className="text-sm text-primary hover:underline">Lihat Semua</Link>
          </CardHeader>
          <CardContent>
            {upcomingCompetitions?.length > 0 ? (
              <ul className="space-y-3">
                {upcomingCompetitions.slice(0, 5).map((comp) => (
                  <li key={comp.id} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div>
                      <p className="text-sm font-medium">{comp.name}</p>
                      <p className="text-xs text-muted-foreground">{comp.event_date || '-'}</p>
                    </div>
                    <span className="text-xs text-muted-foreground">{comp._count?.teams || 0} tim</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">Belum ada lomba</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export { DosenDashboard };
