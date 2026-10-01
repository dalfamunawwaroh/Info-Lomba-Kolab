import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/common/Card';
import { Input } from '@/components/common/Input';
import { Label } from '@/components/common/Label';
import { Select } from '@/components/common/Select';
import { Button } from '@/components/common/Button';
import { validateRequired } from '@/utils/validators';

function CompetitionForm({ initialData, onSubmit, loading, submitLabel = 'Simpan' }) {
  const [form, setForm] = useState({
    name: '',
    description: '',
    event_date: '',
    registration_deadline: '',
    link: '',
    max_team_size: 3,
    needs_advisor: false,
    max_advisors: 1,
    ...initialData,
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (initialData) {
      setForm((prev) => ({ ...prev, ...initialData }));
    }
  }, [initialData]);

  const validate = () => {
    const errs = {};
    const nameErr = validateRequired(form.name, 'Nama lomba');
    if (nameErr) errs.name = nameErr;
    if (form.max_team_size < 2 || form.max_team_size > 10) {
      errs.max_team_size = 'Maks anggota tim: 2-10';
    }
    if (form.needs_advisor && (form.max_advisors < 1 || form.max_advisors > 3)) {
      errs.max_advisors = 'Maks dosen: 1-3';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    const data = { ...form };
    if (data.max_team_size) data.max_team_size = parseInt(data.max_team_size);
    if (data.max_advisors) data.max_advisors = parseInt(data.max_advisors);
    if (!data.needs_advisor) data.max_advisors = 1;
    onSubmit(data);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{initialData ? 'Edit Lomba' : 'Tambah Lomba Baru'}</CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Nama Lomba *</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nama lomba" />
            {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
          </div>
          <div className="space-y-2">
            <Label>Deskripsi</Label>
            <textarea
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={form.description || ''}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Deskripsi lomba (opsional)"
              rows={3}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tanggal Pelaksanaan</Label>
              <Input type="date" value={form.event_date || ''} onChange={(e) => setForm({ ...form, event_date: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Deadline Pendaftaran</Label>
              <Input type="date" value={form.registration_deadline || ''} onChange={(e) => setForm({ ...form, registration_deadline: e.target.value })} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Link Informasi</Label>
            <Input value={form.link || ''} onChange={(e) => setForm({ ...form, link: e.target.value })} placeholder="https://..." />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Max Anggota Per Tim *</Label>
              <Input type="number" min={2} max={10} value={form.max_team_size} onChange={(e) => setForm({ ...form, max_team_size: e.target.value })} />
              {errors.max_team_size && <p className="text-xs text-destructive">{errors.max_team_size}</p>}
            </div>
            <div className="space-y-2">
              <Label>Perlu Dosen Pembimbing?</Label>
              <Select value={form.needs_advisor ? 'yes' : 'no'} onChange={(e) => setForm({ ...form, needs_advisor: e.target.value === 'yes' })}>
                <option value="no">Tidak</option>
                <option value="yes">Ya</option>
              </Select>
            </div>
          </div>
          {form.needs_advisor && (
            <div className="space-y-2">
              <Label>Max Dosen Pembimbing Per Tim</Label>
              <Input type="number" min={1} max={3} value={form.max_advisors} onChange={(e) => setForm({ ...form, max_advisors: e.target.value })} />
              {errors.max_advisors && <p className="text-xs text-destructive">{errors.max_advisors}</p>}
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Menyimpan...' : submitLabel}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}

export { CompetitionForm };
