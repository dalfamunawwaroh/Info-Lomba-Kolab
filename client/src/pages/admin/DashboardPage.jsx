import { useState, useEffect } from 'react';
import { AdminDashboard } from '@/components/dashboard/AdminDashboard';
import { SkeletonCard } from '@/components/common/SkeletonLoader';
import competitionService from '@/services/competitionService';
import submissionService from '@/services/submissionService';
import userService from '@/services/userService';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState(null);
  const [pendingSubmissions, setPendingSubmissions] = useState([]);
  const [upcomingCompetitions, setUpcomingCompetitions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [usersRes, compRes, subRes] = await Promise.allSettled([
          userService.getUsers({ limit: 1 }),
          competitionService.getCompetitions({ status: 'upcoming', limit: 5 }),
          submissionService.getSubmissions({ status: 'pending', limit: 5 }),
        ]);

        setStats({
          totalUsers: usersRes.status === 'fulfilled' ? usersRes.value.meta?.total || 0 : 0,
          totalCompetitions: compRes.status === 'fulfilled' ? compRes.value.meta?.total || 0 : 0,
          totalTeams: 0, // Will be populated when teams API is ready
          pendingSubmissions: subRes.status === 'fulfilled' ? subRes.value.meta?.total || 0 : 0,
        });
        setUpcomingCompetitions(compRes.status === 'fulfilled' ? compRes.value.data || [] : []);
        setPendingSubmissions(subRes.status === 'fulfilled' ? subRes.value.data || [] : []);
      } catch (err) {
        console.error('Failed to load dashboard:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
      </div>
    );
  }

  return (
    <AdminDashboard
      stats={stats}
      pendingSubmissions={pendingSubmissions}
      upcomingCompetitions={upcomingCompetitions}
    />
  );
}
