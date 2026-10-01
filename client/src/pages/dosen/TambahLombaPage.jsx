import { useNavigate } from 'react-router-dom';
import { CompetitionForm } from '@/components/competition/CompetitionForm';
import competitionService from '@/services/competitionService';
import useUIStore from '@/store/uiStore';
import { useState } from 'react';

export default function TambahLombaPage() {
  const [loading, setLoading] = useState(false);
  const addToast = useUIStore((s) => s.addToast);
  const navigate = useNavigate();

  const handleSubmit = async (data) => {
    setLoading(true);
    try {
      await competitionService.createCompetition(data);
      addToast({ type: 'success', message: 'Lomba berhasil ditambahkan' });
      navigate('/dosen/competitions');
    } catch (err) {
      addToast({ type: 'error', message: err.response?.data?.message || 'Gagal menambah lomba' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Tambah Lomba Baru</h1>
      <CompetitionForm onSubmit={handleSubmit} loading={loading} />
    </div>
  );
}
