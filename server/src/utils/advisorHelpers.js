/**
 * Helper bersama untuk logika dosen pembimbing (multi-advisor).
 *
 * Sumber kebenaran ganda yang harus selalu dipertimbangkan:
 *   - `team.advisor_id` / `team.advisor_name` / `team.advisor_status`
 *     → field lama (backward-compat), hanya menampung SATU pembimbing utama.
 *   - `team.advisors[]` = [{ id, name, status }]
 *     → menampung SEMUA pembimbing (lomba bisa `max_advisors` > 1).
 *
 * Semua pengecekan "apakah dosen X membimbing tim ini" WAJIB lewat helper di
 * sini agar dosen pembimbing ke-2 dan seterusnya tidak dianggap bukan pembimbing.
 */

/** Daftar pembimbing berstatus approved pada sebuah tim. */
export const getApprovedAdvisors = (team) => {
  if (!team) return [];
  const list = [];
  if (team.advisor_id && team.advisor_status === 'approved') {
    list.push({ id: team.advisor_id, name: team.advisor_name, status: 'approved' });
  }
  for (const adv of team.advisors || []) {
    if (adv?.status === 'approved' && !list.find((a) => a.id === adv.id)) {
      list.push({ id: adv.id, name: adv.name, status: 'approved' });
    }
  }
  return list;
};

/** Jumlah pembimbing approved. */
export const countApprovedAdvisors = (team) => getApprovedAdvisors(team).length;

/** Semua entri advisors (semua status), termasuk field lama, tanpa duplikat. */
export const advisorListOnTeam = (team) => {
  if (!team) return [];
  const list = [];
  if (team.advisor_id && team.advisor_status === 'approved') {
    list.push({ id: team.advisor_id, name: team.advisor_name, status: 'approved' });
  }
  for (const a of team.advisors || []) {
    if (!list.find((x) => x.id === a.id)) list.push(a);
  }
  return list;
};

/** Apakah user adalah pembimbing approved tim ini? (mendukung multi-advisor) */
export const isAdvisorOf = (team, userId) => {
  if (!team || userId == null) return false;
  return getApprovedAdvisors(team).some((a) => a.id === userId);
};

/** Kuota pembimbing sebuah lomba; default 1. */
export const advisorQuota = (comp) => {
  const q = Number(comp?.max_advisors);
  if (Number.isFinite(q) && q > 0) return q;
  return 1;
};

/** Apakah lomba butuh pembimbing? */
export const competitionNeedsAdvisor = (comp) => {
  if (!comp) return false;
  if (comp.needs_advisor === false) return false;
  const quota = Number(comp.max_advisors);
  if (Number.isFinite(quota) && quota === 0) return false;
  return true;
};

/** Apakah tim masih punya slot pembimbing? */
export const hasAdvisorSlot = (team, comp) =>
  countApprovedAdvisors(team) < advisorQuota(comp);

/**
 * Sinkronkan field lama (`advisor_id`/`advisor_name`/`advisor_status`) dengan
 * isi `team.advisors[]`. Dipanggil setiap kali daftar pembimbing berubah agar
 * seluruh kode lama yang hanya membaca field tunggal tetap benar.
 */
export const syncPrimaryAdvisor = (team) => {
  if (!team) return team;
  const approved = getApprovedAdvisors(team);
  if (approved.length > 0) {
    team.advisor_id = approved[0].id;
    team.advisor_name = approved[0].name;
    team.advisor_status = 'approved';
  } else {
    const pending = (team.advisors || []).find((a) => a?.status === 'pending');
    team.advisor_id = null;
    team.advisor_name = null;
    team.advisor_status = pending ? 'pending' : 'none';
  }
  return team;
};
