import { useState, useEffect } from 'react';
import { AdminDashboard } from '@/components/dashboard/AdminDashboard';
import { SkeletonCard } from '@/components/common/SkeletonLoader';
import submissionService from '@/services/submissionService';
import statsService from '@/services/statsService';
import useUIStore from '@/store/uiStore';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState(null);
  const [pendingSubmissions, setPendingSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const addToast = useUIStore((s) => s.addToast);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const [statsRes, subRes] = await Promise.allSettled([
          statsService.getAdminStats(),
          submissionService.getSubmissions({ status: 'pending' }),
        ]);

        if (!mounted) return;
        if (statsRes.status === 'fulfilled') {
          setStats(statsRes.value.data || null);
        } else {
          addToast({ type: 'error', message: 'Gagal memuat statistik dashboard' });
        }
        setPendingSubmissions(
          subRes.status === 'fulfilled' ? subRes.value.data || [] : []
        );
      } catch (err) {
        console.error('Failed to load dashboard:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, [addToast]);

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
    />
  );
}
