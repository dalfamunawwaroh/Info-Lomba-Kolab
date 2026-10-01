import { useState, useEffect } from 'react';
import { MhsDashboard } from '@/components/dashboard/MhsDashboard';
import { SkeletonCard } from '@/components/common/SkeletonLoader';
import competitionService from '@/services/competitionService';
import historyService from '@/services/historyService';
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
        const [compRes, historyRes] = await Promise.allSettled([
          competitionService.getCompetitions({ status: 'upcoming', limit: 5 }),
          historyService.getUserHistory(user.id),
        ]);

        if (historyRes.status === 'fulfilled') {
          const data = historyRes.value.data;
          const all = [
            ...(data?.competitions?.upcoming || []),
            ...(data?.competitions?.ongoing || []),
          ];
          setMyCompetitions(all);
        }
        setUpcomingCompetitions(compRes.status === 'fulfilled' ? compRes.value.data || [] : []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user.id]);

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        {[...Array(2)].map((_, i) => <SkeletonCard key={i} />)}
      </div>
    );
  }

  return (
    <MhsDashboard
      myCompetitions={myCompetitions}
      upcomingCompetitions={upcomingCompetitions}
      advisorStatuses={advisorStatuses}
    />
  );
}
