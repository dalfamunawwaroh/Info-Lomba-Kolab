import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_FILE = path.join(__dirname, 'data.json');

// Default initial database content
const getInitialData = () => {
  const hashedPassword = bcrypt.hashSync('KoLab2026!', 10);

  return {
    users: [
      {
        id: 1,
        name: 'Admin Ko+Lab System',
        email: 'admin@kolab.id',
        password: hashedPassword,
        role: 'admin',
        nip_nim: 'ADM-2026-001',
        phone: '081234567890',
        startup_id: 1,
        startup_name: 'Teknologi Informasi',
        status: 'active',
        avatar: null,
        created_at: '2026-01-10T08:00:00.000Z',
      },
      {
        id: 2,
        name: 'Dr. Budi Santoso, M.T.',
        email: 'dosen@kolab.id',
        password: hashedPassword,
        role: 'dosen',
        nip_nim: '198503122010121001',
        phone: '081298765432',
        startup_id: 1,
        startup_name: 'Teknologi Informasi',
        expertise: ['Machine Learning', 'Web Development', 'Internet of Things'],
        status: 'active',
        avatar: null,
        created_at: '2026-01-12T09:30:00.000Z',
      },
      {
        id: 3,
        name: 'Prof. Siti Aminah, Ph.D.',
        email: 'siti.aminah@kolab.id',
        password: hashedPassword,
        role: 'dosen',
        nip_nim: '197804152005012002',
        phone: '081311223344',
        startup_id: 2,
        startup_name: 'Sistem Informasi',
        expertise: ['UI/UX Research', 'Business Intelligence', 'Software Engineering'],
        status: 'active',
        avatar: null,
        created_at: '2026-01-14T10:00:00.000Z',
      },
      {
        id: 4,
        name: 'Rina Wijaya',
        email: 'mahasiswa@kolab.id',
        password: hashedPassword,
        role: 'mahasiswa',
        nip_nim: '2241720088',
        phone: '085712348899',
        startup_id: 1,
        startup_name: 'Teknologi Informasi',
        skills: ['React', 'Node.js', 'UI/UX Design'],
        status: 'active',
        avatar: null,
        created_at: '2026-01-20T11:00:00.000Z',
      },
      {
        id: 5,
        name: 'Ahmad Fauzi',
        email: 'ahmad.fauzi@student.kolab.id',
        password: hashedPassword,
        role: 'mahasiswa',
        nip_nim: '2241720102',
        phone: '081987654321',
        startup_id: 1,
        startup_name: 'Teknologi Informasi',
        skills: ['Python', 'TensorFlow', 'Data Science'],
        status: 'active',
        avatar: null,
        created_at: '2026-01-22T14:15:00.000Z',
      },
      {
        id: 6,
        name: 'Dewi Lestari',
        email: 'dewi.lestari@student.kolab.id',
        password: hashedPassword,
        role: 'mahasiswa',
        nip_nim: '2241720150',
        phone: '085234567891',
        startup_id: 2,
        startup_name: 'Sistem Informasi',
        skills: ['Figma', 'Product Management', 'Market Research'],
        status: 'active',
        avatar: null,
        created_at: '2026-01-25T16:00:00.000Z',
      }
    ],
    startups: [
      { id: 1, name: 'Teknologi Informasi', code: 'TI', description: 'Program Studi Teknologi Informasi', status: 'active', created_at: '2026-01-01' },
      { id: 2, name: 'Sistem Informasi', code: 'SI', description: 'Program Studi Sistem Informasi Enterprise', status: 'active', created_at: '2026-01-01' },
      { id: 3, name: 'Teknik Komputer', code: 'TK', description: 'Program Studi Sistem Tertanam dan IoT', status: 'active', created_at: '2026-01-01' },
      { id: 4, name: 'Bisnis Digital', code: 'BD', description: 'Program Studi Kewirausahaan Digital & FinTech', status: 'active', created_at: '2026-01-01' },
    ],
    competitions: [
      {
        id: 1,
        title: 'National Hackathon Ko+Lab 2026',
        category: 'Software Development',
        organizer: 'Politeknik Negeri & Industri Tech',
        description: 'Kompetisi pembuatan aplikasi inovatif bertema Smart City dan Sustainability solusi berbasis AI & Web.',
        prize_pool: 'Rp 50.000.000',
        registration_deadline: '2026-11-15',
        event_date: '2026-12-01',
        status: 'ongoing',
        max_team_members: 4,
        requirements: ['Proposal Inovasi', 'Prototype Aplikasi', 'Video Pitching 3 Menit'],
        image_url: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=800&q=80',
        created_at: '2026-02-01',
      },
      {
        id: 2,
        title: 'Indonesian UI/UX Design Challenge 2026',
        category: 'Design & Experience',
        organizer: 'Association of Digital Designers',
        description: 'Kompetisi perancangan antarmuka pengguna berkualifikasi tinggi berfokus pada aksesibilitas dan kemudahan pengoperasian.',
        prize_pool: 'Rp 25.000.000',
        registration_deadline: '2026-10-30',
        event_date: '2026-11-10',
        status: 'ongoing',
        max_team_members: 3,
        requirements: ['Design System', 'Figma Prototype Link', 'Case Study Document'],
        image_url: 'https://images.unsplash.com/photo-1581291518633-83b4ebd1d83e?auto=format&fit=crop&w=800&q=80',
        created_at: '2026-02-05',
      },
      {
        id: 3,
        title: 'AI Startup & Business Plan Competition',
        category: 'Business & Pitch',
        organizer: 'Venture Capital & Innovation Hub',
        description: 'Ajang kompetisi rencana bisnis bagi mahasiswa pendiri startup teknologi di bidang kecerdasan buatan.',
        prize_pool: 'Rp 75.000.000',
        registration_deadline: '2026-12-05',
        event_date: '2026-12-20',
        status: 'upcoming',
        max_team_members: 5,
        requirements: ['Pitch Deck (PDF)', 'Financial Projection', 'Market Analysis Paper'],
        image_url: 'https://images.unsplash.com/photo-1559136555-9303baea8ebd?auto=format&fit=crop&w=800&q=80',
        created_at: '2026-02-10',
      }
    ],
    teams: [
      {
        id: 1,
        name: 'Tim CyberNova Tech',
        competition_id: 1,
        competition_title: 'National Hackathon Ko+Lab 2026',
        leader_id: 4,
        leader_name: 'Rina Wijaya',
        advisor_id: 2,
        advisor_name: 'Dr. Budi Santoso, M.T.',
        advisor_status: 'approved',
        status: 'complete',
        members: [
          { user_id: 4, name: 'Rina Wijaya', role: 'Ketua Tim / Frontend', status: 'confirmed' },
          { user_id: 5, name: 'Ahmad Fauzi', role: 'Backend / AI Engineer', status: 'confirmed' },
          { user_id: 6, name: 'Dewi Lestari', role: 'UI/UX & Business', status: 'confirmed' },
        ],
        created_at: '2026-02-15',
      },
      {
        id: 2,
        name: 'InnovateX Design',
        competition_id: 2,
        competition_title: 'Indonesian UI/UX Design Challenge 2026',
        leader_id: 6,
        leader_name: 'Dewi Lestari',
        advisor_id: 3,
        advisor_name: 'Prof. Siti Aminah, Ph.D.',
        advisor_status: 'pending',
        status: 'forming',
        members: [
          { user_id: 6, name: 'Dewi Lestari', role: 'Ketua Tim', status: 'confirmed' },
        ],
        created_at: '2026-02-20',
      }
    ],
    submissions: [
      {
        id: 1,
        type: 'advisor_self_assign',
        type_label: 'Pengajuan Pembimbingan Dosen',
        team_id: 2,
        team_name: 'InnovateX Design',
        competition_title: 'Indonesian UI/UX Design Challenge 2026',
        applicant_id: 3,
        applicant_name: 'Prof. Siti Aminah, Ph.D.',
        applicant_role: 'dosen',
        notes: 'Saya tertarik membimbing tim ini karena topik UI/UX sesuai kepakaran riset saya.',
        status: 'pending',
        submitted_at: '2026-02-21T09:00:00.000Z',
      },
      {
        id: 2,
        type: 'team_change',
        type_label: 'Perubahan Anggota Tim',
        team_id: 1,
        team_name: 'Tim CyberNova Tech',
        competition_title: 'National Hackathon Ko+Lab 2026',
        applicant_id: 4,
        applicant_name: 'Rina Wijaya',
        applicant_role: 'mahasiswa',
        notes: 'Permohonan penambahan 1 anggota baru sebagai UI Designer.',
        status: 'approved',
        submitted_at: '2026-02-18T14:30:00.000Z',
      }
    ],
    broadcasts: [
      {
        id: 'BC-001',
        title: 'Pendaftaran Hackathon National 2026 Diperpanjang!',
        target: 'Mahasiswa',
        targetCode: 'mahasiswa',
        category: 'Pengumuman Lomba',
        priority: 'high',
        message: 'Informasi penting: batas akhir pendaftaran Hackathon National 2026 resmi diperpanjang hingga 15 November 2026. Segera daftarkan tim Anda!',
        actionUrl: 'https://kolab.id/competitions/1',
        scheduleDate: null,
        sentAt: '2026-10-08 14:30',
        recipientsCount: 890,
        readCount: 765,
        status: 'Terkirim',
      },
      {
        id: 'BC-002',
        title: 'Pemeliharaan Server Sistem Info Lomba',
        target: 'Semua Pengguna',
        targetCode: 'all',
        category: 'System Maintenance',
        priority: 'urgent',
        message: 'Sistem akan mengalami pemeliharaan rutin pada hari Minggu jam 01:00 - 04:00 WIB. Mohon simpan draft pengajuan sebelum jadwal maintenance.',
        actionUrl: '',
        scheduleDate: null,
        sentAt: '2026-10-05 09:00',
        recipientsCount: 1420,
        readCount: 1380,
        status: 'Terkirim',
      },
      {
        id: 'BC-003',
        title: 'Reminder Input Laporan Kemajuan Tim Bimbingan',
        target: 'Dosen Pembimbing',
        targetCode: 'dosen',
        category: 'Info Umum',
        priority: 'normal',
        message: 'Bapak/Ibu Dosen Pembimbing diharapkan melakukan verifikasi dan penilaian progres awal tim lomba sebelum 12 Oktober 2026.',
        actionUrl: '',
        scheduleDate: '2026-10-12 08:00',
        sentAt: '2026-10-12 08:00 (Scheduled)',
        recipientsCount: 150,
        readCount: 0,
        status: 'Dijadualkan',
      }
    ]
  };
};

class JSONDatabase {
  constructor() {
    this.ensureDbExists();
  }

  ensureDbExists() {
    if (!fs.existsSync(DB_FILE)) {
      const initial = getInitialData();
      fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2), 'utf-8');
    }
  }

  read() {
    this.ensureDbExists();
    try {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      return JSON.parse(raw);
    } catch (err) {
      console.error('Error reading JSON db, resetting:', err);
      const initial = getInitialData();
      fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2), 'utf-8');
      return initial;
    }
  }

  write(data) {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  }
}

export const db = new JSONDatabase();
