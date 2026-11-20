import { Router } from 'express';
import { db } from '../db.ts';
import { requireRole, verifyCsrf } from '../auth.ts';
import { EXPERIENCE_LEVELS, JOB_CATEGORIES, WORK_TYPES } from '../../src/data/constants.ts';

const router = Router();

const SUSPICIOUS_PATTERNS = [
  'registration fee',
  'joining fee',
  'security deposit',
  'processing fee',
  'pay advance',
  'send money first',
  'upi advance',
];

function hasSuspiciousText(text: string): boolean {
  const lower = text.toLowerCase();
  return SUSPICIOUS_PATTERNS.some((p) => lower.includes(p));
}

function formatSalaryDisplay(payType: string, min: number, max: number): string {
  const fmt = (n: number) => '₹' + n.toLocaleString('en-IN');
  const unit = payType === 'daily' ? '/ day' : '/ month';
  if (min === max || !max) {
    return `${fmt(min)} ${unit}`;
  }
  return `${fmt(min)} - ${fmt(max)} ${unit}`;
}

function sanitizeJobContact<T extends { employer_id: number; hide_phone_until_accepted: number; contact_phone: string }>(
  job: T,
  viewerUserId?: number,
  viewerRole?: string,
  applicationStatus?: string | null
): T & { phone_masked: boolean } {
  const canSeePhone =
    job.hide_phone_until_accepted === 0 ||
    viewerRole === 'admin' ||
    (viewerUserId && viewerUserId === job.employer_id) ||
    applicationStatus === 'Accepted';

  if (canSeePhone) {
    return { ...job, phone_masked: false };
  }

  return {
    ...job,
    contact_phone: 'Hidden until application is accepted',
    phone_masked: true,
  };
}

router.get('/stats/public', (_req, res) => {
  const activeJobs = (db.prepare("SELECT COUNT(*) as cnt FROM jobs WHERE status = 'Active'").get() as { cnt: number }).cnt;
  const totalWorkers = (db.prepare("SELECT COUNT(*) as cnt FROM users WHERE role = 'worker' AND is_suspended = 0").get() as { cnt: number }).cnt;
  const totalEmployers = (db.prepare("SELECT COUNT(*) as cnt FROM users WHERE role = 'employer' AND is_suspended = 0").get() as { cnt: number }).cnt;
  const citiesCovered = (db.prepare("SELECT COUNT(DISTINCT city) as cnt FROM jobs WHERE status = 'Active'").get() as { cnt: number }).cnt;

  const catRows = db
    .prepare("SELECT category, COUNT(*) as cnt FROM jobs WHERE status = 'Active' GROUP BY category")
    .all() as { category: string; cnt: number }[];

  const categoryCounts: Record<string, number> = {};
  for (const r of catRows) {
    categoryCounts[r.category] = r.cnt;
  }

  res.json({
    activeJobs,
    totalWorkers,
    totalEmployers,
    citiesCovered,
    categoryCounts,
  });
});

router.get('/jobs', (req, res) => {
  const q = String(req.query.q || '').trim();
  const category = String(req.query.category || '').trim();
  const state = String(req.query.state || '').trim();
  const district = String(req.query.district || '').trim();
  const city = String(req.query.city || '').trim();
  const area = String(req.query.area || '').trim();
  const workType = String(req.query.work_type || '').trim();
  const payType = String(req.query.pay_type || '').trim();
  const experience = String(req.query.experience || '').trim();
  const minSalary = Number(req.query.min_salary || 0);
  const maxSalary = Number(req.query.max_salary || 0);
  const recentDays = Number(req.query.recent_days || 0);
  const sort = String(req.query.sort || 'latest');
  const limit = Math.min(Math.max(Number(req.query.limit || 50), 1), 100);

  const conditions: string[] = ["j.status = 'Active'", 'u.is_suspended = 0'];
  const params: (string | number)[] = [];

  if (q) {
    const like = `%${q}%`;
    conditions.push('(j.title LIKE ? OR j.description LIKE ? OR j.required_skills LIKE ? OR j.area LIKE ? OR j.city LIKE ? OR ep.business_name LIKE ?)');
    params.push(like, like, like, like, like, like);
  }
  if (category) {
    conditions.push('j.category = ?');
    params.push(category);
  }
  if (state) {
    conditions.push('j.state = ?');
    params.push(state);
  }
  if (district) {
    conditions.push('j.district = ?');
    params.push(district);
  }
  if (city) {
    conditions.push('LOWER(j.city) = LOWER(?)');
    params.push(city);
  }
  if (area) {
    conditions.push('LOWER(j.area) LIKE LOWER(?)');
    params.push(`%${area}%`);
  }
  if (workType) {
    conditions.push('j.work_type = ?');
    params.push(workType);
  }
  if (payType && ['monthly', 'daily'].includes(payType)) {
    conditions.push('j.pay_type = ?');
    params.push(payType);
  }
  if (experience) {
    conditions.push('j.experience_required = ?');
    params.push(experience);
  }
  if (minSalary > 0) {
    conditions.push('j.salary_max >= ?');
    params.push(minSalary);
  }
  if (maxSalary > 0) {
    conditions.push('j.salary_min <= ?');
    params.push(maxSalary);
  }
  if (recentDays > 0) {
    const cutoff = new Date(Date.now() - recentDays * 24 * 60 * 60 * 1000).toISOString();
    conditions.push('j.created_at >= ?');
    params.push(cutoff);
  }

  let orderBy = 'j.created_at DESC';
  if (sort === 'salary_asc') {
    orderBy = 'j.salary_min ASC, j.created_at DESC';
  } else if (sort === 'salary_desc') {
    orderBy = 'j.salary_max DESC, j.created_at DESC';
  }

  const sql = `
    SELECT j.*,
           u.full_name AS employer_name,
           COALESCE(ep.business_name, '') AS business_name,
           COALESCE(ep.employer_type, '') AS employer_type,
           (SELECT COUNT(*) FROM applications a WHERE a.job_id = j.id AND a.status != 'Withdrawn') AS applicant_count
    FROM jobs j
    JOIN users u ON u.id = j.employer_id
    LEFT JOIN employer_profiles ep ON ep.user_id = j.employer_id
    WHERE ${conditions.join(' AND ')}
    ORDER BY ${orderBy}
    LIMIT ?
  `;

  const rows = db.prepare(sql).all(...params, limit) as any[];

  const viewerId = req.auth?.user.id;
  const viewerRole = req.auth?.user.role;

  let savedSet = new Set<number>();
  let appStatusMap = new Map<number, string>();

  if (viewerId && viewerRole === 'worker') {
    const saved = db.prepare('SELECT job_id FROM saved_jobs WHERE worker_id = ?').all(viewerId) as { job_id: number }[];
    savedSet = new Set(saved.map((s) => s.job_id));
    const apps = db.prepare('SELECT job_id, status FROM applications WHERE worker_id = ?').all(viewerId) as {
      job_id: number;
      status: string;
    }[];
    for (const a of apps) {
      appStatusMap.set(a.job_id, a.status);
    }
  }

  const jobs = rows.map((row) => {
    const appStatus = appStatusMap.get(row.id) || null;
    const sanitized = sanitizeJobContact(row, viewerId, viewerRole, appStatus);
    return {
      ...sanitized,
      is_saved: savedSet.has(row.id),
      my_application_status: appStatus,
    };
  });

  res.json({ jobs });
});

router.get('/jobs/:id', (req, res) => {
  const jobId = Number(req.params.id);
  if (!Number.isInteger(jobId) || jobId <= 0) {
    res.status(400).json({ error: 'Invalid job ID.' });
    return;
  }

  const job = db
    .prepare(
      `SELECT j.*,
              u.full_name AS employer_name,
              u.is_suspended AS employer_suspended,
              COALESCE(ep.business_name, '') AS business_name,
              COALESCE(ep.employer_type, '') AS employer_type,
              COALESCE(ep.description, '') AS employer_description,
              (SELECT COUNT(*) FROM applications a WHERE a.job_id = j.id AND a.status != 'Withdrawn') AS applicant_count
       FROM jobs j
       JOIN users u ON u.id = j.employer_id
       LEFT JOIN employer_profiles ep ON ep.user_id = j.employer_id
       WHERE j.id = ?`
    )
    .get(jobId) as any;

  if (!job || job.status === 'Removed' || job.employer_suspended === 1) {
    if (req.auth?.user.role !== 'admin') {
      res.status(404).json({ error: 'Job listing not found or no longer available.' });
      return;
    }
  }
  if (!job) {
    res.status(404).json({ error: 'Job listing not found.' });
    return;
  }

  const viewerId = req.auth?.user.id;
  const viewerRole = req.auth?.user.role;
  let isSaved = false;
  let myApplication: any = null;

  if (viewerId && viewerRole === 'worker') {
    const saved = db.prepare('SELECT id FROM saved_jobs WHERE worker_id = ? AND job_id = ?').get(viewerId, jobId);
    isSaved = Boolean(saved);
    myApplication =
      db.prepare('SELECT id, status, cover_note, employer_note, created_at, updated_at FROM applications WHERE worker_id = ? AND job_id = ?').get(viewerId, jobId) ||
      null;
  }

  const sanitized = sanitizeJobContact(job, viewerId, viewerRole, myApplication?.status);

  res.json({
    job: {
      ...sanitized,
      is_saved: isSaved,
      my_application: myApplication,
    },
  });
});

function validateJobBody(body: any) {
  const title = String(body.title || '').trim();
  const category = String(body.category || '').trim();
  const description = String(body.description || '').trim();
  const required_skills = String(body.required_skills || '').trim();
  const workers_required = Number(body.workers_required || 0);
  const state = String(body.state || '').trim();
  const district = String(body.district || '').trim();
  const city = String(body.city || '').trim();
  const area = String(body.area || '').trim();
  const pay_type = String(body.pay_type || '').trim();
  const salary_min = Number(body.salary_min || 0);
  const salary_max = Number(body.salary_max || salary_min);
  const work_type = String(body.work_type || '').trim();
  const working_hours = String(body.working_hours || '').trim();
  const experience_required = String(body.experience_required || '').trim();
  const contact_name = String(body.contact_name || '').trim();
  const contact_phone = String(body.contact_phone || '').replace(/\D/g, '').slice(-10);
  const hide_phone_until_accepted = body.hide_phone_until_accepted ? 1 : 0;
  const application_deadline = String(body.application_deadline || '').trim();

  if (title.length < 4) return { error: 'Job title must be at least 4 characters.' };
  if (!JOB_CATEGORIES.includes(category as any)) return { error: 'Please select a valid job category.' };
  if (description.length < 20) return { error: 'Please provide a clear job description (at least 20 characters).' };
  if (!required_skills) return { error: 'Please specify required skills.' };
  if (!Number.isInteger(workers_required) || workers_required < 1 || workers_required > 500) {
    return { error: 'Number of workers required must be between 1 and 500.' };
  }
  if (!state || !district || !city || !area) {
    return { error: 'Please provide complete location details (State, District, City, and Area/Locality).' };
  }
  if (!['monthly', 'daily'].includes(pay_type)) {
    return { error: 'Pay type must be monthly salary or daily wage.' };
  }
  if (!Number.isFinite(salary_min) || salary_min <= 0 || !Number.isFinite(salary_max) || salary_max < salary_min) {
    return { error: 'Please enter a valid salary or daily wage range (minimum <= maximum).' };
  }
  if (!WORK_TYPES.includes(work_type as any)) return { error: 'Please select a valid work type.' };
  if (!working_hours) return { error: 'Please specify working hours.' };
  if (!EXPERIENCE_LEVELS.includes(experience_required as any)) return { error: 'Please select required experience level.' };
  if (contact_name.length < 2) return { error: 'Please enter a valid contact person name.' };
  if (!/^[6-9]\d{9}$/.test(contact_phone)) return { error: 'Please enter a valid 10-digit contact mobile number.' };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(application_deadline)) {
    return { error: 'Please select a valid application deadline date.' };
  }

  return {
    data: {
      title,
      category,
      description,
      required_skills,
      workers_required,
      state,
      district,
      city,
      area,
      pay_type,
      salary_min: Math.round(salary_min),
      salary_max: Math.round(salary_max),
      salary_display: formatSalaryDisplay(pay_type, Math.round(salary_min), Math.round(salary_max)),
      work_type,
      working_hours,
      experience_required,
      contact_name,
      contact_phone,
      hide_phone_until_accepted,
      application_deadline,
    },
  };
}

router.post('/jobs', requireRole('employer'), verifyCsrf, (req, res) => {
  const validated = validateJobBody(req.body);
  if ('error' in validated) {
    res.status(400).json({ error: validated.error });
    return;
  }
  const d = validated.data;
  const suspicious = hasSuspiciousText(`${d.title} ${d.description}`);
  const initialStatus = suspicious ? 'Pending Review' : 'Active';
  const now = new Date().toISOString();

  const result = db
    .prepare(
      `INSERT INTO jobs (
        employer_id, title, category, description, required_skills, workers_required,
        state, district, city, area, pay_type, salary_min, salary_max, salary_display,
        work_type, working_hours, experience_required, contact_name, contact_phone,
        hide_phone_until_accepted, application_deadline, status, is_sample, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)`
    )
    .run(
      req.auth!.user.id,
      d.title,
      d.category,
      d.description,
      d.required_skills,
      d.workers_required,
      d.state,
      d.district,
      d.city,
      d.area,
      d.pay_type,
      d.salary_min,
      d.salary_max,
      d.salary_display,
      d.work_type,
      d.working_hours,
      d.experience_required,
      d.contact_name,
      d.contact_phone,
      d.hide_phone_until_accepted,
      d.application_deadline,
      initialStatus,
      now,
      now
    );

  const jobId = Number(result.lastInsertRowid);

  if (suspicious) {
    const admins = db.prepare("SELECT id FROM users WHERE role = 'admin'").all() as { id: number }[];
    for (const adm of admins) {
      db.prepare(
        `INSERT INTO notifications (user_id, title, message, link, is_read, created_at)
         VALUES (?, ?, ?, ?, 0, ?)`
      ).run(
        adm.id,
        'Listing Flagged for Moderation',
        `Job "${d.title}" matched fee-warning keywords and is queued for Admin review.`,
        '/admin/dashboard',
        now
      );
    }
  }

  const job = db.prepare('SELECT * FROM jobs WHERE id = ?').get(jobId);
  res.status(201).json({
    job,
    flaggedForReview: suspicious,
  });
});

router.put('/jobs/:id', requireRole('employer'), verifyCsrf, (req, res) => {
  const jobId = Number(req.params.id);
  const existing = db.prepare('SELECT * FROM jobs WHERE id = ?').get(jobId) as any;
  if (!existing) {
    res.status(404).json({ error: 'Job not found.' });
    return;
  }
  if (existing.employer_id !== req.auth!.user.id) {
    res.status(403).json({ error: 'You can only edit job listings that you created.' });
    return;
  }

  const validated = validateJobBody(req.body);
  if ('error' in validated) {
    res.status(400).json({ error: validated.error });
    return;
  }
  const d = validated.data;
  const suspicious = hasSuspiciousText(`${d.title} ${d.description}`);
  const status = suspicious ? 'Pending Review' : existing.status === 'Pending Review' ? 'Active' : existing.status;
  const now = new Date().toISOString();

  db.prepare(
    `UPDATE jobs SET
      title = ?, category = ?, description = ?, required_skills = ?, workers_required = ?,
      state = ?, district = ?, city = ?, area = ?, pay_type = ?, salary_min = ?, salary_max = ?, salary_display = ?,
      work_type = ?, working_hours = ?, experience_required = ?, contact_name = ?, contact_phone = ?,
      hide_phone_until_accepted = ?, application_deadline = ?, status = ?, updated_at = ?
     WHERE id = ? AND employer_id = ?`
  ).run(
    d.title,
    d.category,
    d.description,
    d.required_skills,
    d.workers_required,
    d.state,
    d.district,
    d.city,
    d.area,
    d.pay_type,
    d.salary_min,
    d.salary_max,
    d.salary_display,
    d.work_type,
    d.working_hours,
    d.experience_required,
    d.contact_name,
    d.contact_phone,
    d.hide_phone_until_accepted,
    d.application_deadline,
    status,
    now,
    jobId,
    req.auth!.user.id
  );

  const updated = db.prepare('SELECT * FROM jobs WHERE id = ?').get(jobId);
  res.json({ job: updated, flaggedForReview: suspicious });
});

router.patch('/jobs/:id/status', requireRole('employer'), verifyCsrf, (req, res) => {
  const jobId = Number(req.params.id);
  const nextStatus = String(req.body?.status || '');
  if (!['Active', 'Closed', 'Filled'].includes(nextStatus)) {
    res.status(400).json({ error: 'Invalid status. Allowed: Active, Closed, Filled.' });
    return;
  }

  const existing = db.prepare('SELECT employer_id, status FROM jobs WHERE id = ?').get(jobId) as
    | { employer_id: number; status: string }
    | undefined;

  if (!existing) {
    res.status(404).json({ error: 'Job not found.' });
    return;
  }
  if (existing.employer_id !== req.auth!.user.id) {
    res.status(403).json({ error: 'You can only manage your own job listings.' });
    return;
  }
  if (existing.status === 'Removed' || existing.status === 'Pending Review') {
    res.status(403).json({ error: 'This listing is under administrator moderation and cannot be reopened directly.' });
    return;
  }

  db.prepare('UPDATE jobs SET status = ?, updated_at = ? WHERE id = ?').run(
    nextStatus,
    new Date().toISOString(),
    jobId
  );
  res.json({ ok: true, status: nextStatus });
});

router.delete('/jobs/:id', requireRole('employer'), verifyCsrf, (req, res) => {
  const jobId = Number(req.params.id);
  const existing = db.prepare('SELECT employer_id FROM jobs WHERE id = ?').get(jobId) as { employer_id: number } | undefined;
  if (!existing) {
    res.status(404).json({ error: 'Job not found.' });
    return;
  }
  if (existing.employer_id !== req.auth!.user.id) {
    res.status(403).json({ error: 'You can only delete your own job listings.' });
    return;
  }
  db.prepare('DELETE FROM jobs WHERE id = ?').run(jobId);
  res.json({ ok: true });
});

export default router;
