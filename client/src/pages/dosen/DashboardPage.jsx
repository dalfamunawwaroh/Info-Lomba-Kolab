import { useState, useEffect } from 'react';
import { DosenDashboard } from '@/components/dashboard/DosenDashboard';
import { SkeletonCard } from '@/components/common/SkeletonLoader';
import competitionService from '@/services/competitionService';
import advisorService from '@/services/advisorService';

export default function DosenDashboardPage() {
  const [stats, setStats] = useState(null);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [myTeams, setMyTeams] = useState([]);
  const [upcomingCompetitions, setUpcomingCompetitions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function load() {
      const [summaryRes, reqRes, teamsRes, compRes] = await Promise.allSettled([
        advisorService.getSummary(),
        advisorService.getAdvisorRequests({ status: 'pending' }),
        advisorService.getMyTeams(),
        competitionService.getCompetitions({ limit: 50 }),
      ]);

      if (!mounted) return;

      const summary = summaryRes.status === 'fulfilled' ? summaryRes.value.data : null;
      const requests = reqRes.status === 'fulfilled' ? reqRes.value.data || [] : [];
      const teams = teamsRes.status === 'fulfilled' ? teamsRes.value.data || [] : [];
      const comps = compRes.status === 'fulfilled' ? compRes.value.data || [] : [];

      setStats(
        summary || {
          active_teams: teams.length,
          pending_requests: requests.length,
          my_competitions: 0,
          total_teams: teams.length,
        }
      );
      setPendingRequests(requests);
      setMyTeams(teams);
      setUpcomingCompetitions(
        comps
          .filter((c) => c.status === 'upcoming' || c.status === 'ongoing')
          .sort((a, b) => new Date(a.registration_deadline || 0) - new Date(b.registration_deadline || 0))
      );
      setLoading(false);
    }

    load();
    return () => { mounted = false; };
  }, []);

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-3">
        {[...Array(3)].map((_, i) => <SkeletonCard key={i} />)}
      </div>
    );
  }

  return (
    <DosenDashboard
      stats={stats}
      pendingRequests={pendingRequests}
      myTeams={myTeams}
      upcomingCompetitions={upcomingCompetitions}
    />
  );
}
