import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, UsersRound, Crown, Trophy, Calendar, GraduationCap,
  Send, X, Loader2, AlertCircle,
} from 'lucide-react';
import teamService from '@/services/teamService';
import advisorService from '@/services/advisorService';
import userService from '@/services/userService';
import { useAuth } from '@/hooks/useAuth';
import useUIStore from '@/store/uiStore';
import { Button } from '@/components/common/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/common/Card';
import { Select } from '@/components/common/Select';
import { Badge } from '@/components/common/Badge';
import { StatusBadge } from '@/components/common/StatusBadge';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ADVISOR_STATUS_LABELS } from '@/utils/constants';

export default function DetailTimMahasiswaPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const addToast = useUIStore((s) => s.addToast);

  const [team, setTeam] = useState(null);
  const [requests, setRequests] = useState([]);
  const [advisors, setAdvisors] = useState([]);
  const [selectedAdvisor, setSelectedAdvisor] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const isLeader = team?.leader_id === user?.id;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [teamRes, reqRes, usersRes] = await Promise.allSettled([
        teamService.getTeamById(id),
        advisorService.getTeamAdvisorRequests(),
        userService.getUsers({ role: 'dosen', is_active: true, limit: 100 }),
      ]);

      if (teamRes.status === 'fulfilled') {
        setTeam(teamRes.value.data);
      } else {
        addToast({ type: 'error', message: 'Gagal memuat data tim' });
      }

      if (reqRes.status === 'fulfilled') {
        const all = reqRes.value.data || [];
        setRequests(all.filter((r) => r.team_id === Number(id)));
      }

      if (usersRes.status === 'fulfilled') {
        setAdvisors(usersRes.value.data || []);
      }
    } catch {
      addToast({ type: 'error', message: 'Gagal memuat halaman' });
    } finally {
      setLoading(false);
    }
  }, [id, addToast]);

  useEffect(() => { load(); }, [load]);

  const handleRequest = async (e) => {
    e.preventDefault();
    if (!selectedAdvisor) return;
    setSubmitting(true);
    try {
      await advisorService.requestAdvisor(Number(id), Number(selectedAdvisor), notes);
      addToast({ type: 'success', message: 'Pengajuan dosen pembimbing berhasil dikirim' });
      setSelectedAdvisor('');
      setNotes('');
      load();
    } catch (err) {
      addToast({ type: 'error', message: err.response?.data?.message || 'Gagal mengajukan dosen' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async (requestId) => {
    try {
      await advisorService.cancelAdvisorRequest(requestId);
      addToast({ type: 'success', message: 'Pengajuan dibatalkan' });
      load();
    } catch (err) {
      addToast({ type: 'error', message: err.response?.data?.message || 'Gagal membatalkan' });
    }
  };

  if (loading) return <LoadingSpinner className="py-12" />;
  if (!team) return <p className="text-center py-12">Tim tidak ditemukan</p>;

  const competitionNeedsAdvisor = team.competition?.needs_advisor !== false && Number(team.competition?.max_advisors) !== 0;
  const approvedCount = team.advisors?.length || 0;
  const quota = Number(team.competition?.max_advisors) > 0 ? Number(team.competition.max_advisors) : 1;
  const canRequest = isLeader && competitionNeedsAdvisor && approvedCount < quota;
  const availableAdvisors = advisors.filter(
    (a) => !team.advisors?.find((ta) => ta.id === a.id) && !requests.find((r) => r.advisor_id === a.id && r.status === 'pending')
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in-up">
      <Button variant="ghost" onClick={() => navigate(-1)}>
        <ArrowLeft className="h-4 w-4 mr-1" /> Kembali
      </Button>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <UsersRound className="h-6 w-6 text-purple-600" />
            {team.name}
          </h1>
          <p className="text-muted-foreground flex items-center gap-2 mt-1">
            <Trophy className="h-4 w-4" />
            {team.competition?.name || team.competition_title}
          </p>
        </div>
        <Badge variant={team.status === 'forming' ? 'warning' : 'success'}>{team.status}</Badge>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <UsersRound className="h-5 w-5" /> Anggota Tim
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {team.members?.map((m) => (
              <div key={m.user_id} className="flex items-center justify-between p-3 bg-muted rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-sm">
                    {m.user?.name?.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium">{m.user?.name || m.name}</p>
                    <p className="text-xs text-muted-foreground">{m.user?.startup_name || '-'}</p>
                  </div>
                </div>
                {m.user_id === team.leader_id && (
                  <span className="flex items-center gap-1 text-xs font-semibold text-amber-600 bg-amber-100 px-2 py-1 rounded-full">
                    <Crown className="h-3 w-3" /> Ketua
                  </span>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <GraduationCap className="h-5 w-5" /> Dosen Pembimbing
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {team.advisors?.length > 0 ? (
              team.advisors.map((a) => (
                <div key={a.id} className="flex items-center gap-3 p-3 bg-green-50 text-green-800 rounded-xl">
                  <div className="w-9 h-9 rounded-full bg-green-200 flex items-center justify-center font-bold text-sm">
                    {a.name?.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                  <p className="font-medium">{a.name}</p>
                </div>
              ))
            ) : (
              <div className="p-4 rounded-xl bg-amber-50 text-amber-800 flex items-start gap-3">
                <AlertCircle className="h-5 w-5 shrink-0" />
                <p className="text-sm">Belum ada dosen pembimbing.</p>
              </div>
            )}
            <div className="text-sm text-muted-foreground flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Deadline: {team.competition?.registration_deadline || '-'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pengajuan Dosen */}
      {canRequest && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Send className="h-5 w-5" /> Ajukan Dosen Pembimbing
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleRequest} className="space-y-4">
              <div>
                <label className="text-sm font-medium">Pilih Dosen</label>
                <Select
                  value={selectedAdvisor}
                  onChange={(e) => setSelectedAdvisor(e.target.value)}
                  className="mt-1"
                >
                  <option value="">-- Pilih Dosen --</option>
                  {availableAdvisors.map((a) => (
                    <option key={a.id} value={a.id}>{a.name} {a.expertise ? `(${a.expertise})` : ''}</option>
                  ))}
                </Select>
                {availableAdvisors.length === 0 && (
                  <p className="text-xs text-amber-600 mt-1">Semua dosen sudah diajukan atau sudah menjadi pembimbing.</p>
                )}
              </div>
              <div>
                <label className="text-sm font-medium">Catatan (opsional)</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Jelaskan alasan mengajukan dosen ini..."
                  className="w-full mt-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
                  rows={3}
                />
              </div>
              <Button type="submit" disabled={!selectedAdvisor || submitting}>
                {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                Ajukan
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {!isLeader && competitionNeedsAdvisor && team.advisors?.length === 0 && (
        <div className="p-4 rounded-xl bg-slate-100 text-slate-600 text-sm">
          Hanya ketua tim yang dapat mengajukan dosen pembimbing.
        </div>
      )}

      {/* Riwayat Pengajuan */}
      {requests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Riwayat Pengajuan Pembimbing</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {requests.map((r) => (
              <div key={r.id} className="flex items-center justify-between p-4 border rounded-xl">
                <div>
                  <p className="font-medium">{r.advisor?.name || r.advisor_name}</p>
                  <p className="text-xs text-muted-foreground">{r.notes || r.description || 'Tidak ada catatan'}</p>
                  <div className="mt-2">
                    <StatusBadge status={r.status} labels={ADVISOR_STATUS_LABELS} />
                  </div>
                </div>
                {r.status === 'pending' && isLeader && (
                  <Button variant="outline" size="sm" onClick={() => handleCancel(r.id)}>
                    <X className="h-4 w-4 mr-1" /> Batalkan
                  </Button>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
