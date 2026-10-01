import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Calendar, Clock, Users, ExternalLink, ArrowLeft } from 'lucide-react';
import competitionService from '@/services/competitionService';
import historyService from '@/services/historyService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Badge } from '@/components/common/Badge';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { STATUS_LABELS, COMPETITION_STATUS, ADVISOR_STATUS_LABELS } from '@/utils/constants';
import { formatDate, isDeadlinePassed } from '@/utils/helpers';
import { useAuth } from '@/hooks/useAuth';

export default function DetailLombaPage() {
  const { id } = useParams();
  const { user, isMahasiswa } = useAuth();
  const [competition, setCompetition] = useState(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function load() {
      try {
        const [compRes, histRes] = await Promise.all([
          competitionService.getCompetitionById(id),
          isMahasiswa ? historyService.getUserHistory(user.id).catch(() => ({ data: null })) : Promise.resolve({ data: null }),
        ]);
        setCompetition(compRes.data);

        if (histRes?.data?.competitions) {
          const all = [
            ...(histRes.data.competitions.upcoming || []),
            ...(histRes.data.competitions.ongoing || []),
          ];
          setIsRegistered(all.some((h) => h.competition?.id === parseInt(id)));
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id, user?.id, isMahasiswa]);

  if (loading) return <LoadingSpinner className="py-12" />;
  if (!competition) return <p className="text-center py-12">Lomba tidak ditemukan</p>;

  const deadlinePassed = isDeadlinePassed(competition.registration_deadline);
  const canRegister = competition.status === COMPETITION_STATUS.UPCOMING && !deadlinePassed && !isRegistered && isMahasiswa;

  return (
    <div className="space-y-6 max-w-4xl">
      <Button variant="ghost" onClick={() => navigate(-1)} className="mb-2">
        <ArrowLeft className="h-4 w-4 mr-1" />Kembali
      </Button>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">{competition.name}</h1>
          <div className="flex items-center gap-2 mt-2">
            <StatusBadge status={competition.status} labels={STATUS_LABELS} />
            {competition.needs_advisor && (
              <Badge variant="info">Perlu Dosen Pembimbing</Badge>
            )}
          </div>
        </div>
        {canRegister && (
          <Button onClick={() => navigate(`/mahasiswa/competitions/${id}/register`)}>
            Daftar Lomba Ini
          </Button>
        )}
        {isRegistered && (
          <Badge variant="success" className="text-base px-4 py-1">Sudah Terdaftar</Badge>
        )}
      </div>

      <Card>
        <CardContent className="p-6 space-y-4">
          {competition.description && (
            <p className="text-muted-foreground">{competition.description}</p>
          )}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>Pelaksanaan: {formatDate(competition.event_date) || '-'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span>Deadline: {formatDate(competition.registration_deadline) || '-'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span>Max {competition.max_team_size} anggota per tim</span>
            </div>
            {competition.link && (
              <a href={competition.link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-primary hover:underline">
                <ExternalLink className="h-4 w-4" />
                <span>Link Info</span>
              </a>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Teams */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Tim Terdaftar ({competition.teams?.length || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          {competition.teams?.length > 0 ? (
            <div className="space-y-3">
              {competition.teams.map((team) => (
                <div key={team.id} className="p-4 rounded-lg border">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium">{team.name}</p>
                    <StatusBadge status={team.status} labels={{ forming: 'Sedang Dibentuk', complete: 'Lengkap' }} />
                  </div>
                  <p className="text-sm text-muted-foreground">Ketua: {team.leader?.name}</p>
                  <div className="mt-1">
                    {team.members?.map((m) => (
                      <span key={m.user?.id} className="inline-block mr-2 text-xs bg-muted px-2 py-0.5 rounded">
                        {m.user?.name} {m.role_in_team === 'leader' ? '★' : ''}
                      </span>
                    ))}
                  </div>
                  {team.advisors?.filter(a => a.status === 'approved').length > 0 && (
                    <p className="text-sm text-muted-foreground mt-1">
                      Dosen: {team.advisors.filter(a => a.status === 'approved').map(a => a.advisor?.name).join(', ')}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">Belum ada tim terdaftar</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
