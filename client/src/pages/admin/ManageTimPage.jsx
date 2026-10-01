import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, UsersRound } from 'lucide-react';
import competitionService from '@/services/competitionService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/common/Card';
import { Select } from '@/components/common/Select';
import { StatusBadge } from '@/components/common/StatusBadge';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { EmptyState } from '@/components/common/EmptyState';
import { Button } from '@/components/common/Button';
import { TEAM_STATUS_LABELS } from '@/utils/constants';
import useUIStore from '@/store/uiStore';

export default function ManageTimPage() {
  const [competitions, setCompetitions] = useState([]);
  const [selectedComp, setSelectedComp] = useState('');
  const [compDetail, setCompDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const addToast = useUIStore((s) => s.addToast);
  const navigate = useNavigate();

  useEffect(() => {
    competitionService.getCompetitions({ limit: 100 }).then((res) => {
      setCompetitions(res.data || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedComp) { setCompDetail(null); return; }
    competitionService.getCompetitionById(selectedComp).then((res) => {
      setCompDetail(res.data);
    }).catch(() => addToast({ type: 'error', message: 'Gagal memuat detail lomba' }));
  }, [selectedComp, addToast]);

  if (loading) return <LoadingSpinner className="py-12" />;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Kelola Tim</h1>

      <div className="space-y-2">
        <label className="text-sm font-medium">Pilih Lomba</label>
        <Select value={selectedComp} onChange={(e) => setSelectedComp(e.target.value)} className="max-w-md">
          <option value="">-- Pilih Lomba --</option>
          {competitions.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </Select>
      </div>

      {selectedComp && compDetail && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{compDetail.name} — Daftar Tim</CardTitle>
            </CardHeader>
            <CardContent>
              {compDetail.teams?.length > 0 ? (
                <div className="space-y-3">
                  {compDetail.teams.map((team) => (
                    <div key={team.id} className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50">
                      <div>
                        <p className="font-medium">{team.name}</p>
                        <p className="text-sm text-muted-foreground">
                          Ketua: {team.leader?.name} | Anggota: {team.members?.length || 0}/{compDetail.max_team_size}
                        </p>
                        {team.advisors?.length > 0 && (
                          <p className="text-sm text-muted-foreground">
                            Dosen: {team.advisors.filter(a => a.status === 'approved').map(a => a.advisor?.name).join(', ') || 'Belum ada'}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusBadge status={team.status} labels={TEAM_STATUS_LABELS} />
                        <Button size="sm" variant="outline" onClick={() => navigate(`/admin/teams/${team.id}`)}>
                          <Eye className="h-4 w-4 mr-1" />Detail
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState icon={UsersRound} title="Belum ada tim" description="Belum ada tim yang terdaftar di lomba ini" />
              )}
            </CardContent>
          </Card>

          {/* Solo Registrations */}
          {compDetail.solo_registrations?.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Mahasiswa Tanpa Tim</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {compDetail.solo_registrations.map((sr) => (
                    <div key={sr.id} className="flex items-center justify-between p-3 rounded border">
                      <div>
                        <p className="font-medium text-sm">{sr.user?.name}</p>
                        <p className="text-xs text-muted-foreground">{sr.user?.startup}</p>
                      </div>
                      <StatusBadge status={sr.status} labels={{ waiting: 'Menunggu', assigned: 'Sudah Diassign' }} />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
