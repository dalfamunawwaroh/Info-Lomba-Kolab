import { Link } from 'react-router-dom';
import { Trophy, UsersRound, Clock } from 'lucide-react';
import { StatCard } from './StatCard';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { StatusBadge } from '@/components/common/StatusBadge';
import { ADVISOR_STATUS_LABELS, STATUS_COLORS, STATUS_LABELS } from '@/utils/constants';

function MhsDashboard({ myCompetitions, upcomingCompetitions, advisorStatuses }) {
  const activeCount = myCompetitions?.length || 0;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard Mahasiswa</h1>

      <div className="p-6 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
        <p className="text-lg font-medium">
          {activeCount > 0
            ? `Kamu sedang mengikuti ${activeCount} lomba`
            : 'Kamu belum mengikuti lomba apapun'}
        </p>
        <p className="text-blue-100 text-sm mt-1">
          {activeCount > 0 ? 'Semangat!' : 'Yuk daftar lomba sekarang!'}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* My Competitions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Lomba Yang Diikuti</CardTitle>
          </CardHeader>
          <CardContent>
            {myCompetitions?.length > 0 ? (
              <ul className="space-y-3">
                {myCompetitions.map((item) => (
                  <li key={item.competition?.id} className="py-2 border-b last:border-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">{item.competition?.name}</p>
                      <StatusBadge status={item.competition?.status} labels={STATUS_LABELS} />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Tim: {item.team?.name} — {item.team?.role_in_team === 'leader' ? 'Ketua' : 'Anggota'}
                    </p>
                    {item.advisors?.length > 0 && (
                      <p className="text-xs text-muted-foreground">
                        Dosen: {item.advisors.map(a => a.name).join(', ')}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">Belum terdaftar di lomba apapun</p>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Competitions */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Lomba Tersedia</CardTitle>
            <Link to="/mahasiswa/competitions" className="text-sm text-primary hover:underline">Lihat Semua</Link>
          </CardHeader>
          <CardContent>
            {upcomingCompetitions?.length > 0 ? (
              <ul className="space-y-3">
                {upcomingCompetitions.slice(0, 5).map((comp) => (
                  <li key={comp.id} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div>
                      <p className="text-sm font-medium">{comp.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Deadline: {comp.registration_deadline || '-'}
                      </p>
                    </div>
                    <Button asChild size="sm" variant="outline">
                      <Link to={`/mahasiswa/competitions/${comp.id}`}>Detail</Link>
                    </Button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">Tidak ada lomba tersedia</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Advisor Status */}
      {advisorStatuses?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Status Pengajuan Dosen Pembimbing</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {advisorStatuses.map((a) => (
                <li key={a.id} className="flex items-center justify-between py-1">
                  <span className="text-sm">{a.advisor?.name} — {a.team?.name}</span>
                  <StatusBadge status={a.status} labels={ADVISOR_STATUS_LABELS} />
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export { MhsDashboard };
