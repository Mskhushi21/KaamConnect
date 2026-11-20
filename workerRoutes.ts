import { Router } from 'express';
import { db } from '../db.ts';
import { requireRole, verifyCsrf } from '../auth.ts';
import { EXPERIENCE_LEVELS, JOB_CATEGORIES, WORK_TYPES } from '../../src/data/constants.ts';

const router = Router();

function computeProfileCompletion(user: any, profile: any): { percent: number; missing: string[] } {
  const checks: { label: string; ok: boolean }[] = [
    { label: 'full_name', ok: Boolean(user?.full_name?.trim()) },
    { label: 'mobile', ok: Boolean(user?.mobile?.trim()) },
    { label: 'city', ok: Boolean(profile?.city?.trim()) },
    { label: 'area', ok: Boolean(profile?.area?.trim()) },
    { label: 'skills', ok: Boolean(profile?.skills?.trim()) },
    { label: 'preferred_category', ok: Boolean(profile?.preferred_category?.trim()) },
    { label: 'preferred_work_type', ok: Boolean(profile?.preferred_work_type?.trim()) },
    { label: 'experience_label', ok: Boolean(profile?.experience_label?.trim()) },
    { label: 'bio', ok: Boolean(profile?.bio?.trim()) },
  ];
  const done = checks.filter((c) => c.ok).length;
  return {
    percent: Math.round((done / checks.length) * 100),
    missing: checks.filter((c) => !c.ok).map((c) => c.label),
  };
}

router.get('/dashboard', requireRole('worker'), (req, res) => {
  const userId = req.auth!.user.id;
  const profile = db.prepare('SELECT * FROM worker_profiles WHERE user_id = ?').get(userId) as any;

  const applications = db
    .prepare(
      `SELECT a.*,
              j.title AS job_title,
              j.category AS job_category,
              j.city AS job_city,
              j.area AS job_area,
              j.salary_display,
              j.work_type,
              j.status AS job_status,
              j.contact_name,
              j.contact_phone,
              j.hide_phone_until_accepted,
              u.full_name AS employer_name,
              COALESCE(ep.business_name, '') AS business_name
       FROM applications a
       JOIN jobs j ON j.id = a.job_id
       JOIN users u ON u.id = j.employer_id
       LEFT JOIN employer_profiles ep ON ep.user_id = j.employer_id
       WHERE a.worker_id = ?
       ORDER BY a.updated_at DESC`
    )
    .all(userId) as any[];

  const maskedApps = applications.map((a) => ({
    ...a,
    contact_phone:
      a.hide_phone_until_accepted === 0 || a.status === 'Accepted'
        ? a.contact_phone
        : 'Visible once accepted',
  }));

  const savedJobs = db
    .prepare(
      `SELECT j.*,
              s.created_at AS saved_at,
              u.full_name AS employer_name,
              COALESCE(ep.business_name, '') AS business_name
       FROM saved_jobs s
       JOIN jobs j ON j.id = s.job_id
       JOIN users u ON u.id = j.employer_id
       LEFT JOIN employer_profiles ep ON ep.user_id = j.employer_id
       WHERE s.worker_id = ? AND j.status != 'Removed'
       ORDER BY s.created_at DESC`
    )
    .all(userId);

  // Recommended jobs based on worker's category, city, and skills
  const allActiveJobs = db
    .prepare(
      `SELECT j.*,
              u.full_name AS employer_name,
              COALESCE(ep.business_name, '') AS business_name
       FROM jobs j
       JOIN users u ON u.id = j.employer_id
       LEFT JOIN employer_profiles ep ON ep.user_id = j.employer_id
       WHERE j.status = 'Active' AND u.is_suspended = 0
       ORDER BY j.created_at DESC
       LIMIT 40`
    )
    .all() as any[];

  const workerSkills = String(profile?.skills || '')
    .toLowerCase()
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  const scored = allActiveJobs
    .map((j) => {
      let score = 0;
      if (profile?.preferred_category && j.category === profile.preferred_category) score += 5;
      if (profile?.city && j.city.toLowerCase() === profile.city.toLowerCase()) score += 4;
      if (profile?.area && j.area.toLowerCase() === profile.area.toLowerCase()) score += 3;
      if (profile?.preferred_work_type && j.work_type === profile.preferred_work_type) score += 2;
      const haystack = `${j.title} ${j.required_skills} ${j.description}`.toLowerCase();
      for (const sk of workerSkills) {
        if (sk.length >= 3 && haystack.includes(sk)) score += 2;
      }
      return { job: j, score };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 6)
    .map((item) => item.job);

  const recentJobs = allActiveJobs.slice(0, 6);

  const notifications = db
    .prepare('SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 30')
    .all(userId);

  const completion = computeProfileCompletion(req.auth!.user, profile);

  res.json({
    profile,
    completion,
    applications: maskedApps,
    savedJobs,
    recommendedJobs: scored,
    recentJobs,
    notifications,
  });
});

router.put('/profile', requireRole('worker'), verifyCsrf, (req, res) => {
  const userId = req.auth!.user.id;
  const body = req.body || {};
  const fullName = String(body.full_name || '').trim();
  const mobile = String(body.mobile || '').replace(/\D/g, '').slice(-10);
  const state = String(body.state || 'Karnataka').trim();
  const district = String(body.district || '').trim();
  const city = String(body.city || '').trim();
  const area = String(body.area || '').trim();
  const skills = String(body.skills || '').trim();
  const experienceLabel = String(body.experience_label || 'Fresher').trim();
  const preferredCategory = String(body.preferred_category || '').trim();
  const preferredWorkType = String(body.preferred_work_type || 'Full-time').trim();
  const bio = String(body.bio || '').trim();
  const availabilityStatus = ['Available', 'Busy'].includes(body.availability_status)
    ? body.availability_status
    : 'Available';

  if (fullName.length < 2) {
    res.status(400).json({ error: 'Full name must be at least 2 characters.' });
    return;
  }
  if (!/^[6-9]\d{9}$/.test(mobile)) {
    res.status(400).json({ error: 'Please enter a valid 10-digit mobile number.' });
    return;
  }
  if (!state || !city) {
    res.status(400).json({ error: 'State and city are required.' });
    return;
  }
  if (!skills) {
    res.status(400).json({ error: 'Please enter your skills.' });
    return;
  }
  if (!JOB_CATEGORIES.includes(preferredCategory as any)) {
    res.status(400).json({ error: 'Please select a valid preferred category.' });
    return;
  }
  if (!WORK_TYPES.includes(preferredWorkType as any)) {
    res.status(400).json({ error: 'Please select a valid preferred work type.' });
    return;
  }
  if (!EXPERIENCE_LEVELS.includes(experienceLabel as any)) {
    res.status(400).json({ error: 'Please select a valid experience level.' });
    return;
  }

  const dupMobile = db
    .prepare('SELECT id FROM users WHERE mobile = ? AND id != ?')
    .get(mobile, userId);
  if (dupMobile) {
    res.status(409).json({ error: 'Another account already uses this mobile number.' });
    return;
  }

  const expYearsMap: Record<string, number> = {
    Fresher: 0,
    '1-2 years': 1,
    '2-5 years': 3,
    '5+ years': 6,
  };
  const now = new Date().toISOString();

  db.transaction(() => {
    db.prepare('UPDATE users SET full_name = ?, mobile = ?, updated_at = ? WHERE id = ?').run(
      fullName,
      mobile,
      now,
      userId
    );
    db.prepare(
      `UPDATE worker_profiles SET
        state = ?, district = ?, city = ?, area = ?, skills = ?,
        experience_years = ?, experience_label = ?, preferred_category = ?,
        preferred_work_type = ?, bio = ?, availability_status = ?, updated_at = ?
       WHERE user_id = ?`
    ).run(
      state,
      district,
      city,
      area,
      skills,
      expYearsMap[experienceLabel] ?? 0,
      experienceLabel,
      preferredCategory,
      preferredWorkType,
      bio,
      availabilityStatus,
      now,
      userId
    );
  })();

  const updatedUser = db
    .prepare('SELECT id, email, mobile, role, full_name, language, is_suspended, created_at FROM users WHERE id = ?')
    .get(userId);
  const updatedProfile = db.prepare('SELECT * FROM worker_profiles WHERE user_id = ?').get(userId);

  res.json({
    user: updatedUser,
    profile: updatedProfile,
    completion: computeProfileCompletion(updatedUser, updatedProfile),
  });
});

router.post('/apply/:jobId', requireRole('worker'), verifyCsrf, (req, res) => {
  const jobId = Number(req.params.jobId);
  const workerId = req.auth!.user.id;
  const coverNote = String(req.body?.cover_note || '').trim().slice(0, 800);

  const job = db.prepare('SELECT * FROM jobs WHERE id = ?').get(jobId) as any;
  if (!job || job.status !== 'Active') {
    res.status(400).json({ error: 'This job is no longer accepting applications.' });
    return;
  }

  const existing = db
    .prepare('SELECT id, status FROM applications WHERE job_id = ? AND worker_id = ?')
    .get(jobId, workerId) as { id: number; status: string } | undefined;

  if (existing) {
    res.status(409).json({ error: 'You have already applied to this job.' });
    return;
  }

  const now = new Date().toISOString();
  const tx = db.transaction(() => {
    const r = db
      .prepare(
        `INSERT INTO applications (job_id, worker_id, cover_note, status, employer_note, created_at, updated_at)
         VALUES (?, ?, ?, 'Pending', '', ?, ?)`
      )
      .run(jobId, workerId, coverNote, now, now);

    db.prepare(
      `INSERT INTO notifications (user_id, title, message, link, is_read, created_at)
       VALUES (?, ?, ?, ?, 0, ?)`
    ).run(
      job.employer_id,
      'New Job Application',
      `${req.auth!.user.full_name} applied for "${job.title}".`,
      '/employer/dashboard',
      now
    );

    return Number(r.lastInsertRowid);
  });

  const applicationId = tx();
  const application = db.prepare('SELECT * FROM applications WHERE id = ?').get(applicationId);
  res.status(201).json({ application });
});

router.patch('/applications/:applicationId/withdraw', requireRole('worker'), verifyCsrf, (req, res) => {
  const applicationId = Number(req.params.applicationId);
  const workerId = req.auth!.user.id;

  const app = db
    .prepare(
      `SELECT a.*, j.employer_id, j.title
       FROM applications a
       JOIN jobs j ON j.id = a.job_id
       WHERE a.id = ? AND a.worker_id = ?`
    )
    .get(applicationId, workerId) as any;

  if (!app) {
    res.status(404).json({ error: 'Application not found.' });
    return;
  }
  if (!['Pending', 'Under Review'].includes(app.status)) {
    res.status(400).json({ error: 'Only pending or under-review applications can be withdrawn.' });
    return;
  }

  const now = new Date().toISOString();
  db.transaction(() => {
    db.prepare("UPDATE applications SET status = 'Withdrawn', updated_at = ? WHERE id = ?").run(
      now,
      applicationId
    );
    db.prepare(
      `INSERT INTO notifications (user_id, title, message, link, is_read, created_at)
       VALUES (?, ?, ?, ?, 0, ?)`
    ).run(
      app.employer_id,
      'Application Withdrawn',
      `${req.auth!.user.full_name} withdrew their application for "${app.title}".`,
      '/employer/dashboard',
      now
    );
  })();

  res.json({ ok: true, status: 'Withdrawn' });
});

router.post('/saved/:jobId', requireRole('worker'), verifyCsrf, (req, res) => {
  const jobId = Number(req.params.jobId);
  const job = db.prepare('SELECT id FROM jobs WHERE id = ?').get(jobId);
  if (!job) {
    res.status(404).json({ error: 'Job not found.' });
    return;
  }
  db.prepare('INSERT OR IGNORE INTO saved_jobs (worker_id, job_id, created_at) VALUES (?, ?, ?)').run(
    req.auth!.user.id,
    jobId,
    new Date().toISOString()
  );
  res.json({ ok: true, saved: true });
});

router.delete('/saved/:jobId', requireRole('worker'), verifyCsrf, (req, res) => {
  const jobId = Number(req.params.jobId);
  db.prepare('DELETE FROM saved_jobs WHERE worker_id = ? AND job_id = ?').run(
    req.auth!.user.id,
    jobId
  );
  res.json({ ok: true, saved: false });
});

export default router;
