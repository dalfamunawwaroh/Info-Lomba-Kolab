import { Link } from 'react-router-dom';
import { Users, Trophy, UsersRound, ClipboardList, Plus } from 'lucide-react';
import { StatCard } from './StatCard';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { StatusBadge } from '@/components/common/StatusBadge';
import { ADVISOR_STATUS_LABELS } from '@/utils/constants';

function AdminDashboard({ stats, pendingSubmissions, upcomingCompetitions }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard Admin</h1>
        <div className="flex gap-2">
          <Button asChild size="sm">
            <Link to="/admin/users"><Plus className="h-4 w-4 mr-1" />Tambah User</Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link to="/admin/competitions"><Plus className="h-4 w-4 mr-1" />Tambah Lomba</Link>
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="User Aktif" value={stats?.totalUsers} icon={Users} iconColor="text-blue-500" />
        <StatCard title="Total Lomba" value={stats?.totalCompetitions} icon={Trophy} iconColor="text-green-500" />
        <StatCard title="Total Tim" value={stats?.totalTeams} icon={UsersRound} iconColor="text-purple-500" />
        <StatCard title="Pengajuan Pending" value={stats?.pendingSubmissions} icon={ClipboardList} iconColor="text-orange-500" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Pending Submissions */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Pengajuan Pending</CardTitle>
            <Link to="/admin/submissions" className="text-sm text-primary hover:underline">Lihat Semua</Link>
          </CardHeader>
          <CardContent>
            {pendingSubmissions?.length > 0 ? (
              <ul className="space-y-3">
                {pendingSubmissions.slice(0, 5).map((sub) => (
                  <li key={sub.id} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div>
                      <p className="text-sm font-medium">{sub.requester?.name}</p>
                      <p className="text-xs text-muted-foreground">{sub.type}</p>
                    </div>
                    <StatusBadge status={sub.status} labels={ADVISOR_STATUS_LABELS} />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">Tidak ada pengajuan pending</p>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Competitions */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Lomba Mendatang</CardTitle>
            <Link to="/admin/competitions" className="text-sm text-primary hover:underline">Lihat Semua</Link>
          </CardHeader>
          <CardContent>
            {upcomingCompetitions?.length > 0 ? (
              <ul className="space-y-3">
                {upcomingCompetitions.slice(0, 5).map((comp) => (
                  <li key={comp.id} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div>
                      <p className="text-sm font-medium">{comp.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {comp.event_date || 'Tanggal belum ditentukan'}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {comp._count?.teams || 0} tim
                    </span>
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

export { AdminDashboard };
