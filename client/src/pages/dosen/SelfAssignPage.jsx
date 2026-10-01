import { useState, useEffect } from 'react';
import { UsersRound, Send } from 'lucide-react';
import competitionService from '@/services/competitionService';
import advisorService from '@/services/advisorService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Select } from '@/components/common/Select';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { EmptyState } from '@/components/common/EmptyState';
import useUIStore from '@/store/uiStore';

export default function SelfAssignPage() {
  const [competitions, setCompetitions] = useState([]);
  const [selectedComp, setSelectedComp] = useState('');
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const addToast = useUIStore((s) => s.addToast);

  useEffect(() => {
    competitionService.getCompetitions({ status: 'upcoming', limit: 50 }).then((res) => {
      setCompetitions((res.data || []).filter((c) => c.needs_advisor));
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedComp) { setTeams([]); return; }
    competitionService.getCompetitionById(selectedComp).then((res) => {
      // Filter teams without max advisors
      const allTeams = res.data?.teams || [];
      setTeams(allTeams.filter((t) => {
        const approved = t.advisors?.filter((a) => a.status === 'approved').length || 0;
        return approved < (res.data?.max_advisors || 1);
      }));
    }).catch(() => {});
  }, [selectedComp]);

  const handleSelfAssign = async (teamId) => {
    setSubmitting(true);
    try {
      await advisorService.selfAssign(teamId);
      addToast({ type: 'success', message: 'Pengajuan diri berhasil dikirim. Menunggu persetujuan admin.' });
    } catch (err) {
      addToast({ type: 'error', message: err.response?.data?.message || 'Gagal mengajukan diri' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner className="py-12" />;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Ajukan Diri sebagai Pembimbing</h1>

      <div className="space-y-2">
        <label className="text-sm font-medium">Pilih Lomba</label>
        <Select value={selectedComp} onChange={(e) => setSelectedComp(e.target.value)} className="max-w-md">
          <option value="">-- Pilih Lomba --</option>
          {competitions.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </Select>
      </div>

      {selectedComp && (
        teams.length > 0 ? (
          <div className="space-y-3">
            {teams.map((team) => (
              <Card key={team.id}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium">{team.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Ketua: {team.leader?.name} | Anggota: {team.members?.length}
                    </p>
                  </div>
                  <Button size="sm" onClick={() => handleSelfAssign(team.id)} disabled={submitting}>
                    <Send className="h-4 w-4 mr-1" />Ajukan Diri
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <EmptyState icon={UsersRound} title="Tidak ada tim yang membutuhkan pembimbing" />
        )
      )}
    </div>
  );
}
