import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Calendar, Clock, Users, ExternalLink, ArrowLeft, MapPin, Trophy,
  DollarSign, BookOpen, Link as LinkIcon, Pencil, UserCheck, Building2, Target
} from 'lucide-react';
import competitionService from '@/services/competitionService';
import historyService from '@/services/historyService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Badge } from '@/components/common/Badge';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { STATUS_LABELS, COMPETITION_STATUS } from '@/utils/constants';
import { formatDate, isDeadlinePassed } from '@/utils/helpers';
import { useAuth } from '@/hooks/useAuth';

export default function DetailLombaPage() {
  const { id } = useParams();
  const { user, isMahasiswa, isAdmin, isDosen } = useAuth();
  const [competition, setCompetition] = useState(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const basePath = isAdmin ? '/admin' : isDosen ? '/dosen' : '/mahasiswa';

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

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{competition.title}</h1>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <StatusBadge status={competition.status} labels={STATUS_LABELS} />
            {competition.category && (
              <Badge variant="info">{competition.category}</Badge>
            )}
            {competition.needs_advisor && (
              <Badge variant="warning">Perlu Dosen Pembimbing</Badge>
            )}
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          {(isAdmin || isDosen) && (
            <Button onClick={() => navigate(`${basePath}/competitions/${id}/edit`)}>
              <Pencil className="h-4 w-4 mr-1" />Edit
            </Button>
          )}
          {canRegister && (
            <Button onClick={() => navigate(`${basePath}/competitions/${id}/register`)}>
              Daftar Lomba Ini
            </Button>
          )}
          {isRegistered && (
            <Badge variant="success" className="text-base px-4 py-1">Sudah Terdaftar</Badge>
          )}
        </div>
      </div>

      {/* Image */}
      {competition.image_url && (
        <div className="rounded-xl overflow-hidden border">
          <img
            src={competition.image_url}
            alt={competition.title}
            className="w-full h-48 sm:h-64 object-cover"
            onError={(e) => { e.target.style.display = 'none'; }}
          />
        </div>
      )}

      {/* Description */}
      {competition.description && (
        <Card>
          <CardContent className="p-6">
            <p className="text-muted-foreground leading-relaxed">{competition.description}</p>
          </CardContent>
        </Card>
      )}

      {/* Key Info Grid */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
              <span>Pelaksanaan: <strong>{formatDate(competition.event_date) || '-'}</strong></span>
            </div>
            <div className="flex items-center gap-3">
              <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
              <span>Deadline Daftar: <strong>{formatDate(competition.registration_deadline) || '-'}</strong></span>
              {deadlinePassed && competition.status === COMPETITION_STATUS.UPCOMING && (
                <Badge variant="destructive" className="text-[10px]">Ditutup</Badge>
              )}
            </div>
            <div className="flex items-center gap-3">
              <Users className="h-4 w-4 text-muted-foreground shrink-0" />
              <span>Max {competition.max_team_members || '-'} anggota per tim</span>
            </div>
            {competition.location && (
              <div className="flex items-center gap-3">
                <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                <span>{competition.location}</span>
              </div>
            )}
            {competition.organizer && (
              <div className="flex items-center gap-3">
                <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
                <span>Penyelenggara: {competition.organizer}</span>
              </div>
            )}
            {competition.prize_pool && (
              <div className="flex items-center gap-3">
                <Trophy className="h-4 w-4 text-muted-foreground shrink-0" />
                <span>Hadiah: <strong className="text-emerald-600 dark:text-emerald-400">{competition.prize_pool}</strong></span>
              </div>
            )}
            {competition.registration_fee && (
              <div className="flex items-center gap-3">
                <DollarSign className="h-4 w-4 text-muted-foreground shrink-0" />
                <span>Biaya Daftar: {competition.registration_fee}</span>
              </div>
            )}
            {competition.needs_advisor && (
              <div className="flex items-center gap-3">
                <UserCheck className="h-4 w-4 text-muted-foreground shrink-0" />
                <span>Dosen Pembimbing: maks {competition.max_advisors || 1}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Requirements */}
      {Array.isArray(competition.requirements) && competition.requirements.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <BookOpen className="h-4 w-4" />Persyaratan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {competition.requirements.map((req, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <span className="mt-1 w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">
                    {i + 1}
                  </span>
                  <span className="text-muted-foreground">{req}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Links */}
      {(competition.registration_url || competition.guidebook_url) && (
        <Card>
          <CardContent className="p-6 flex flex-wrap gap-3">
            {competition.registration_url && (
              <a
                href={competition.registration_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                <ExternalLink className="h-4 w-4" />
                Link Pendaftaran
              </a>
            )}
            {competition.guidebook_url && (
              <a
                href={competition.guidebook_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium hover:bg-muted transition-colors"
              >
                <LinkIcon className="h-4 w-4" />
                Guidebook
              </a>
            )}
          </CardContent>
        </Card>
      )}

      {/* Teams */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Tim Terdaftar ({competition._count?.teams || competition.teams?.length || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          {competition.teams?.length > 0 ? (
            <div className="space-y-3">
              {competition.teams.map((team) => (
                <Link
                  key={team.id}
                  to={isAdmin ? `${basePath}/teams/${team.id}` : '#'}
                  onClick={(e) => { if (!isAdmin) e.preventDefault(); }}
                  className={`block p-4 rounded-lg border transition-all ${isAdmin ? 'cursor-pointer hover:shadow-md hover:border-purple-200' : 'cursor-default'}`}
                  title={isAdmin ? 'Lihat detail tim' : undefined}
                >
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium">{team.name}</p>
                    <StatusBadge
                      status={team.status}
                      labels={{ forming: 'Sedang Dibentuk', complete: 'Lengkap' }}
                    />
                  </div>
                  {team.leader_name && (
                    <p className="text-sm text-muted-foreground">Ketua: {team.leader_name}</p>
                  )}
                  <div className="mt-1">
                    {team.members?.map((m) => (
                      <span
                        key={m.user_id}
                        className="inline-block mr-2 text-xs bg-muted px-2 py-0.5 rounded"
                      >
                        {m.name} {m.role ? `(${m.role})` : ''}
                      </span>
                    ))}
                  </div>
                  {team.advisor_name && (
                    <p className="text-sm text-muted-foreground mt-1">
                      Dosen Pembimbing: {team.advisor_name}
                      {team.advisor_status === 'approved' && (
                        <Badge variant="success" className="ml-2 text-[10px]">Disetujui</Badge>
                      )}
                      {team.advisor_status === 'pending' && (
                        <Badge variant="warning" className="ml-2 text-[10px]">Menunggu</Badge>
                      )}
                    </p>
                  )}
                </Link>
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
