import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Lock } from 'lucide-react';
import { CompetitionForm } from '@/components/competition/CompetitionForm';
import competitionService from '@/services/competitionService';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { Button } from '@/components/common/Button';
import useUIStore from '@/store/uiStore';

export default function EditLombaPage() {
  const { id } = useParams();
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');
  const basePath = isAdmin ? '/admin' : '/dosen';

  const [competition, setCompetition] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const addToast = useUIStore((s) => s.addToast);
  const navigate = useNavigate();

  useEffect(() => {
    competitionService.getCompetitionById(id)
      .then((res) => {
        const comp = res.data;
        setCompetition(comp);
        // F-05: dosen hanya boleh mengedit lomba miliknya sendiri
        if (!isAdmin && !comp.is_owner) setBlocked(true);
      })
      .catch(() => addToast({ type: 'error', message: 'Gagal memuat data lomba' }))
      .finally(() => setLoading(false));
  }, [id, addToast, isAdmin]);

  const handleSubmit = async (data) => {
    setSaving(true);
    try {
      await competitionService.updateCompetition(id, data);
      addToast({ type: 'success', message: 'Lomba berhasil diperbarui' });
      navigate(`${basePath}/competitions/${id}`);
    } catch (err) {
      addToast({ type: 'error', message: err.response?.data?.message || 'Gagal memperbarui lomba' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner className="py-16" />;

  if (blocked) {
    return (
      <div className="max-w-lg mx-auto py-16 text-center space-y-4">
        <div className="w-16 h-16 rounded-3xl bg-amber-100 dark:bg-amber-500/15 text-amber-500 flex items-center justify-center mx-auto">
          <Lock size={28} />
        </div>
        <h2 className="text-xl font-bold text-slate-800 dark:text-white">Tidak Dapat Mengedit</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Lomba ini dibuat oleh pengguna lain. Dosen hanya dapat mengedit lomba yang ia buat sendiri.
        </p>
        <Button variant="outline" onClick={() => navigate(`${basePath}/competitions/${id}`)} className="rounded-full">
          <ArrowLeft size={15} className="mr-1.5" /> Lihat Detail Lomba
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl pb-12">
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors mb-4"
      >
        <ArrowLeft size={14} /> Kembali
      </button>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Edit Lomba</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 truncate">{competition?.title}</p>
      </div>
      <CompetitionForm
        initialData={competition}
        onSubmit={handleSubmit}
        loading={saving}
        submitLabel="Perbarui Lomba"
      />
    </div>
  );
}
