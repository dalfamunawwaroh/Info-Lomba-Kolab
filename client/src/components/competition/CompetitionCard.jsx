import { Link } from 'react-router-dom';
import { Calendar, Clock, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/common/Card';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Button } from '@/components/common/Button';
import { STATUS_LABELS, COMPETITION_STATUS } from '@/utils/constants';
import { formatDate, isDeadlinePassed } from '@/utils/helpers';

function CompetitionCard({ competition, basePath, onRegister, isRegistered }) {
  const deadlinePassed = isDeadlinePassed(competition.registration_deadline);
  const canRegister = competition.status === COMPETITION_STATUS.UPCOMING && !deadlinePassed && !isRegistered;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg">{competition.name}</CardTitle>
            {competition.description && (
              <CardDescription className="mt-1 line-clamp-2">
                {competition.description}
              </CardDescription>
            )}
          </div>
          <StatusBadge status={competition.status} labels={STATUS_LABELS} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 text-sm text-muted-foreground mb-4">
          {competition.event_date && (
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>Pelaksanaan: {formatDate(competition.event_date)}</span>
            </div>
          )}
          {competition.registration_deadline && (
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span>Deadline: {formatDate(competition.registration_deadline)}</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span>Tim: {competition._count?.teams || 0} terdaftar | Max {competition.max_team_size} anggota</span>
          </div>
          {competition.needs_advisor && (
            <span className="inline-block px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs">
              Perlu Dosen Pembimbing (max {competition.max_advisors})
            </span>
          )}
        </div>

        <div className="flex gap-2">
          <Button asChild size="sm" variant="outline" className="flex-1">
            <Link to={`${basePath}/competitions/${competition.id}`}>Lihat Detail</Link>
          </Button>
          {canRegister && onRegister && (
            <Button size="sm" onClick={() => onRegister(competition)}>
              Daftar
            </Button>
          )}
          {isRegistered && (
            <span className="inline-flex items-center px-3 py-1.5 text-sm text-green-700 bg-green-50 rounded-md">
              Sudah Terdaftar
            </span>
          )}
          {deadlinePassed && competition.status === COMPETITION_STATUS.UPCOMING && (
            <span className="inline-flex items-center px-3 py-1.5 text-sm text-red-700 bg-red-50 rounded-md">
              Pendaftaran Ditutup
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export { CompetitionCard };
