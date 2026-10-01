import { useState, useEffect } from 'react';
import { DosenDashboard } from '@/components/dashboard/DosenDashboard';
import { SkeletonCard } from '@/components/common/SkeletonLoader';
import competitionService from '@/services/competitionService';
import advisorService from '@/services/advisorService';

export default function DosenDashboardPage() {
  const [stats, setStats] = useState(null);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [upcomingCompetitions, setUpcomingCompetitions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [compRes, reqRes, teamsRes] = await Promise.allSettled([
          competitionService.getCompetitions({ status: 'upcoming', limit: 5 }),
          advisorService.getAdvisorRequests({ status: 'pending' }),
          advisorService.getMyTeams(),
        ]);

        setStats({
          myTeams: teamsRes.status === 'fulfilled' ? (teamsRes.value.data || []).length : 0,
          pendingRequests: reqRes.status === 'fulfilled' ? (reqRes.value.data || []).length : 0,
          myCompetitions: 0,
        });
        setUpcomingCompetitions(compRes.status === 'fulfilled' ? compRes.value.data || [] : []);
        setPendingRequests(reqRes.status === 'fulfilled' ? reqRes.value.data || [] : []);
      } catch (err) {
        console.error('Dashboard error:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
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
      upcomingCompetitions={upcomingCompetitions}
    />
  );
}
