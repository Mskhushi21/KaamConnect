import { Router } from 'express';
import { db } from '../db.ts';
import { requireRole, verifyCsrf } from '../auth.ts';
import { clearSampleData, seedSampleData } from '../seed.ts';

const router = Router();

router.get('/overview', requireRole('admin'), (_req, res) => {
  const workers = db
    .prepare(
      `SELECT u.id, u.full_name, u.email, u.mobile, u.is_suspended, u.is_sample, u.created_at,
              wp.state, wp.district, wp.city, wp.area, wp.skills, wp.experience_label,
              wp.preferred_category, wp.preferred_work_type
       FROM users u
       LEFT JOIN worker_profiles wp ON wp.user_id = u.id
       WHERE u.role = 'worker'
       ORDER BY u.created_at DESC`
    )
    .all();

  const employers = db
    .prepare(
      `SELECT u.id, u.full_name, u.email, u.mobile, u.is_suspended, u.is_sample, u.created_at,
              ep.business_name, ep.employer_type, ep.state, ep.district, ep.city, ep.area,
              (SELECT COUNT(*) FROM jobs j WHERE j.employer_id = u.id) AS jobs_count
       FROM users u
       LEFT JOIN employer_profiles ep ON ep.user_id = u.id
       WHERE u.role = 'employer'
       ORDER BY u.created_at DESC`
    )
    .all();

  const jobs = db
    .prepare(
      `SELECT j.*, u.full_name AS employer_name, COALESCE(ep.business_name, '') AS business_name,
              (SELECT COUNT(*) FROM applications a WHERE a.job_id = j.id) AS applicant_count
       FROM jobs j
       JOIN users u ON u.id = j.employer_id
       LEFT JOIN employer_profiles ep ON ep.user_id = j.employer_id
       ORDER BY j.created_at DESC`
    )
    .all();

  const applications = db
    .prepare(
      `SELECT a.*, j.title AS job_title, j.city AS job_city,
              w.full_name AS worker_name, e.full_name AS employer_name
       FROM applications a
       JOIN jobs j ON j.id = a.job_id
       JOIN users w ON w.id = a.worker_id
       JOIN users e ON e.id = j.employer_id
       ORDER BY a.created_at DESC
       LIMIT 100`
    )
    .all();

  const reports = db
    .prepare(
      `SELECT r.*,
              rep.full_name AS reporter_name,
              j.title AS target_job_title,
              emp.full_name AS target_employer_name
       FROM reports r
       LEFT JOIN users rep ON rep.id = r.reporter_id
       LEFT JOIN jobs j ON j.id = r.target_job_id
       LEFT JOIN users emp ON emp.id = r.target_employer_id
       ORDER BY r.created_at DESC`
    )
    .all();

  const contacts = db
    .prepare('SELECT * FROM contact_messages ORDER BY created_at DESC LIMIT 100')
    .all();

  const sampleJobCount = (db.prepare('SELECT COUNT(*) as cnt FROM jobs WHERE is_sample = 1').get() as { cnt: number }).cnt;
  const sampleUserCount = (db.prepare("SELECT COUNT(*) as cnt FROM users WHERE is_sample = 1 AND role != 'admin'").get() as { cnt: number }).cnt;

  res.json({
    workers,
    employers,
    jobs,
    applications,
    reports,
    contacts,
    sampleCounts: { jobs: sampleJobCount, users: sampleUserCount },
  });
});

router.patch('/jobs/:id/status', requireRole('admin'), verifyCsrf, (req, res) => {
  const jobId = Number(req.params.id);
  const status = String(req.body?.status || '');
  if (!['Active', 'Closed', 'Filled', 'Pending Review', 'Removed'].includes(status)) {
    res.status(400).json({ error: 'Invalid job status.' });
    return;
  }

  const job = db.prepare('SELECT employer_id, title FROM jobs WHERE id = ?').get(jobId) as
    | { employer_id: number; title: string }
    | undefined;
  if (!job) {
    res.status(404).json({ error: 'Job listing not found.' });
    return;
  }

  const now = new Date().toISOString();
  db.transaction(() => {
    db.prepare('UPDATE jobs SET status = ?, updated_at = ? WHERE id = ?').run(status, now, jobId);
    db.prepare(
      `INSERT INTO notifications (user_id, title, message, link, is_read, created_at)
       VALUES (?, ?, ?, ?, 0, ?)`
    ).run(
      job.employer_id,
      'Job Listing Moderation Update',
      `Administrator updated status of "${job.title}" to ${status}.`,
      '/employer/dashboard',
      now
    );
  })();

  res.json({ ok: true, status });
});

router.delete('/jobs/:id', requireRole('admin'), verifyCsrf, (req, res) => {
  const jobId = Number(req.params.id);
  const changes = db.prepare('DELETE FROM jobs WHERE id = ?').run(jobId).changes;
  if (!changes) {
    res.status(404).json({ error: 'Job not found.' });
    return;
  }
  res.json({ ok: true });
});

router.patch('/users/:id/suspend', requireRole('admin'), verifyCsrf, (req, res) => {
  const userId = Number(req.params.id);
  const suspend = req.body?.is_suspended ? 1 : 0;

  const target = db.prepare('SELECT id, role FROM users WHERE id = ?').get(userId) as
    | { id: number; role: string }
    | undefined;
  if (!target) {
    res.status(404).json({ error: 'User not found.' });
    return;
  }
  if (target.role === 'admin') {
    res.status(400).json({ error: 'Administrator accounts cannot be suspended.' });
    return;
  }

  db.transaction(() => {
    db.prepare('UPDATE users SET is_suspended = ?, updated_at = ? WHERE id = ?').run(
      suspend,
      new Date().toISOString(),
      userId
    );
    if (suspend === 1) {
      db.prepare('DELETE FROM sessions WHERE user_id = ?').run(userId);
    }
  })();

  res.json({ ok: true, is_suspended: suspend });
});

router.patch('/reports/:id', requireRole('admin'), verifyCsrf, (req, res) => {
  const reportId = Number(req.params.id);
  const status = String(req.body?.status || '');
  const adminNotes = String(req.body?.admin_notes || '').trim();
  if (!['Open', 'Reviewed', 'Resolved', 'Dismissed'].includes(status)) {
    res.status(400).json({ error: 'Invalid report status.' });
    return;
  }
  db.prepare('UPDATE reports SET status = ?, admin_notes = ?, updated_at = ? WHERE id = ?').run(
    status,
    adminNotes,
    new Date().toISOString(),
    reportId
  );
  res.json({ ok: true, status });
});

router.patch('/contacts/:id', requireRole('admin'), verifyCsrf, (req, res) => {
  const contactId = Number(req.params.id);
  const status = String(req.body?.status || '');
  if (!['New', 'Reviewed', 'Resolved'].includes(status)) {
    res.status(400).json({ error: 'Invalid contact status.' });
    return;
  }
  db.prepare('UPDATE contact_messages SET status = ? WHERE id = ?').run(status, contactId);
  res.json({ ok: true, status });
});

router.post('/sample-data/clear', requireRole('admin'), verifyCsrf, (_req, res) => {
  const result = clearSampleData();
  res.json({ ok: true, ...result });
});

router.post('/sample-data/load', requireRole('admin'), verifyCsrf, (_req, res) => {
  const result = seedSampleData(true);
  res.json({ ok: true, ...result });
});

export default router;
