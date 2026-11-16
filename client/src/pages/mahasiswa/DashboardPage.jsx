import { useState, useEffect } from 'react';
import { MhsDashboard } from '@/components/dashboard/MhsDashboard';
import competitionService from '@/services/competitionService';
import historyService from '@/services/historyService';
import myTeamService from '@/services/myTeamService';
import { useAuth } from '@/hooks/useAuth';

export default function MhsDashboardPage() {
  const { user } = useAuth();
  const [myCompetitions, setMyCompetitions] = useState([]);
  const [upcomingCompetitions, setUpcomingCompetitions] = useState([]);
  const [advisorStatuses, setAdvisorStatuses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [compRes, historyRes, teamRes] = await Promise.allSettled([
          competitionService.getCompetitions({ status: 'upcoming' }),
          historyService.getUserHistory(user.id),
          myTeamService.getMyTeams(),
        ]);

        let registered = new Set();
        if (historyRes.status === 'fulfilled') {
          const data = historyRes.value.data;
          const all = [...(data?.competitions?.ongoing || []), ...(data?.competitions?.upcoming || [])];
          setMyCompetitions(all);
          registered = new Set(all.map((i) => i.competition?.id));
        }
        if (compRes.status === 'fulfilled') {
          // Lomba tersedia = upcoming yang belum saya ikuti
          setUpcomingCompetitions((compRes.value.data || []).filter((c) => !registered.has(c.id)));
        }
        if (teamRes.status === 'fulfilled') {
          // Status pembimbing per tim: pengajuan terakhir, atau pembimbing yang sudah resmi
          const statuses = (teamRes.value.data?.teams || []).map((t) => {
            if (t.advisor_id && t.advisor_status === 'approved') {
              return { id: `t-${t.id}`, teamId: t.id, status: 'approved', advisor: { name: t.advisor_name }, team: { name: t.name } };
            }
            const last = t.advisor_requests?.[0];
            if (last) return { id: last.id, teamId: t.id, status: last.status, advisor: { name: last.target_advisor_name }, team: { name: t.name } };
            return { id: `n-${t.id}`, teamId: t.id, status: 'none', advisor: null, team: { name: t.name }, isLeader: t.leader_id === user.id };
          });
          setAdvisorStatuses(statuses);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user.id]);

  return (
    <MhsDashboard
      loading={loading}
      myCompetitions={myCompetitions}
      upcomingCompetitions={upcomingCompetitions}
      advisorStatuses={advisorStatuses}
    />
  );
}
