import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CompetitionForm } from '@/components/competition/CompetitionForm';
import competitionService from '@/services/competitionService';
import useUIStore from '@/store/uiStore';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

export default function EditLombaPage() {
  const { id } = useParams();
  const [competition, setCompetition] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const addToast = useUIStore((s) => s.addToast);
  const navigate = useNavigate();

  useEffect(() => {
    competitionService.getCompetitionById(id).then((res) => {
      setCompetition(res.data);
    }).catch(() => addToast({ type: 'error', message: 'Gagal memuat data' }))
    .finally(() => setLoading(false));
  }, [id, addToast]);

  const handleSubmit = async (data) => {
    setSaving(true);
    try {
      await competitionService.updateCompetition(id, data);
      addToast({ type: 'success', message: 'Lomba berhasil diperbarui' });
      navigate(-1);
    } catch (err) {
      addToast({ type: 'error', message: err.response?.data?.message || 'Gagal memperbarui' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner className="py-12" />;

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Edit Lomba</h1>
      <CompetitionForm initialData={competition} onSubmit={handleSubmit} loading={saving} submitLabel="Perbarui" />
    </div>
  );
}
