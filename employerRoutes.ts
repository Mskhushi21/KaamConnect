import { Router } from 'express';
import { db } from '../db.ts';
import { requireRole, verifyCsrf } from '../auth.ts';
import { EMPLOYER_TYPES } from '../../src/data/constants.ts';

const router = Router();

router.get('/dashboard', requireRole('employer'), (req, res) => {
  const employerId = req.auth!.user.id;
  const profile = db.prepare('SELECT * FROM employer_profiles WHERE user_id = ?').get(employerId);

  const jobs = db
    .prepare(
      `SELECT j.*,
              (SELECT COUNT(*) FROM applications a WHERE a.job_id = j.id AND a.status != 'Withdrawn') AS total_applicants,
              (SELECT COUNT(*) FROM applications a WHERE a.job_id = j.id AND a.status = 'Pending') AS pending_applicants
       FROM jobs j
       WHERE j.employer_id = ?
       ORDER BY j.created_at DESC`
    )
    .all(employerId) as any[];

  const applications = db
    .prepare(
      `SELECT a.*,
              j.title AS job_title,
              j.category AS job_category,
              j.city AS job_city,
              u.full_name AS worker_name,
              u.email AS worker_email,
              u.mobile AS worker_mobile,
              wp.city AS worker_city,
              wp.area AS worker_area,
              wp.skills AS worker_skills,
              wp.experience_label AS worker_experience,
              wp.preferred_category AS worker_category,
              wp.preferred_work_type AS worker_work_type,
              wp.bio AS worker_bio,
              wp.availability_status AS worker_availability
       FROM applications a
       JOIN jobs j ON j.id = a.job_id
       JOIN users u ON u.id = a.worker_id
       LEFT JOIN worker_profiles wp ON wp.user_id = u.id
       WHERE j.employer_id = ?
       ORDER BY a.created_at DESC`
    )
    .all(employerId) as any[];

  const notifications = db
    .prepare('SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 30')
    .all(employerId);

  const activeJobs = jobs.filter((j) => j.status === 'Active').length;
  const closedJobs = jobs.filter((j) => ['Closed', 'Filled'].includes(j.status)).length;
  const nonWithdrawn = applications.filter((a) => a.status !== 'Withdrawn');
  const totalApplicants = nonWithdrawn.length;
  const newApplications = applications.filter((a) => a.status === 'Pending' || a.status === 'Under Review').length;
  const acceptedApplications = applications.filter((a) => a.status === 'Accepted').length;
  const rejectedApplications = applications.filter((a) => a.status === 'Rejected').length;

  res.json({
    profile,
    jobs,
    applications,
    notifications,
    stats: {
      activeJobs,
      closedJobs,
      totalApplicants,
      newApplications,
      acceptedApplications,
      rejectedApplications,
    },
  });
});

router.put('/profile', requireRole('employer'), verifyCsrf, (req, res) => {
  const userId = req.auth!.user.id;
  const body = req.body || {};
  const fullName = String(body.full_name || '').trim();
  const mobile = String(body.mobile || '').replace(/\D/g, '').slice(-10);
  const businessName = String(body.business_name || '').trim();
  const employerType = String(body.employer_type || 'Individual / Household').trim();
  const state = String(body.state || 'Karnataka').trim();
  const district = String(body.district || '').trim();
  const city = String(body.city || '').trim();
  const area = String(body.area || '').trim();
  const description = String(body.description || '').trim();

  if (fullName.length < 2) {
    res.status(400).json({ error: 'Employer name must be at least 2 characters.' });
    return;
  }
  if (!/^[6-9]\d{9}$/.test(mobile)) {
    res.status(400).json({ error: 'Please enter a valid 10-digit mobile number.' });
    return;
  }
  if (!EMPLOYER_TYPES.includes(employerType as any)) {
    res.status(400).json({ error: 'Please select a valid employer type.' });
    return;
  }
  if (!state || !city) {
    res.status(400).json({ error: 'State and city are required.' });
    return;
  }

  const dupMobile = db
    .prepare('SELECT id FROM users WHERE mobile = ? AND id != ?')
    .get(mobile, userId);
  if (dupMobile) {
    res.status(409).json({ error: 'Another account already uses this mobile number.' });
    return;
  }

  const now = new Date().toISOString();
  db.transaction(() => {
    db.prepare('UPDATE users SET full_name = ?, mobile = ?, updated_at = ? WHERE id = ?').run(
      fullName,
      mobile,
      now,
      userId
    );
    db.prepare(
      `UPDATE employer_profiles SET
        business_name = ?, employer_type = ?, state = ?, district = ?, city = ?, area = ?, description = ?, updated_at = ?
       WHERE user_id = ?`
    ).run(businessName, employerType, state, district, city, area, description, now, userId);
  })();

  const updatedUser = db
    .prepare('SELECT id, email, mobile, role, full_name, language, is_suspended, created_at FROM users WHERE id = ?')
    .get(userId);
  const updatedProfile = db.prepare('SELECT * FROM employer_profiles WHERE user_id = ?').get(userId);
  res.json({ user: updatedUser, profile: updatedProfile });
});

router.patch('/applications/:applicationId', requireRole('employer'), verifyCsrf, (req, res) => {
  const applicationId = Number(req.params.applicationId);
  const nextStatus = String(req.body?.status || '').trim();
  const employerNote = String(req.body?.employer_note || '').trim().slice(0, 500);

  if (!['Pending', 'Under Review', 'Accepted', 'Rejected'].includes(nextStatus)) {
    res.status(400).json({ error: 'Invalid status update.' });
    return;
  }

  const app = db
    .prepare(
      `SELECT a.*, j.employer_id, j.title, u.full_name AS employer_name, COALESCE(ep.business_name, '') AS business_name
       FROM applications a
       JOIN jobs j ON j.id = a.job_id
       JOIN users u ON u.id = j.employer_id
       LEFT JOIN employer_profiles ep ON ep.user_id = u.id
       WHERE a.id = ?`
    )
    .get(applicationId) as any;

  if (!app) {
    res.status(404).json({ error: 'Application not found.' });
    return;
  }
  if (app.employer_id !== req.auth!.user.id) {
    res.status(403).json({ error: 'You can only manage applications for your own job listings.' });
    return;
  }
  if (app.status === 'Withdrawn') {
    res.status(400).json({ error: 'This application was withdrawn by the worker.' });
    return;
  }

  const now = new Date().toISOString();
  const orgLabel = app.business_name || app.employer_name;

  db.transaction(() => {
    db.prepare('UPDATE applications SET status = ?, employer_note = ?, updated_at = ? WHERE id = ?').run(
      nextStatus,
      employerNote,
      now,
      applicationId
    );
    db.prepare(
      `INSERT INTO notifications (user_id, title, message, link, is_read, created_at)
       VALUES (?, ?, ?, ?, 0, ?)`
    ).run(
      app.worker_id,
      `Application ${nextStatus}`,
      `Your application for "${app.title}" at ${orgLabel} is now ${nextStatus}.${employerNote ? ' Note: ' + employerNote : ''}`,
      '/worker/dashboard',
      now
    );
  })();

  res.json({ ok: true, status: nextStatus, employer_note: employerNote });
});

// Public / Employer worker discovery directory (masks sensitive personal contact details publicly)
router.get('/workers', (req, res) => {
  const q = String(req.query.q || '').trim();
  const category = String(req.query.category || '').trim();
  const city = String(req.query.city || '').trim();
  const workType = String(req.query.work_type || '').trim();

  const conditions = ["u.role = 'worker'", 'u.is_suspended = 0'];
  const params: string[] = [];

  if (q) {
    const like = `%${q}%`;
    conditions.push('(u.full_name LIKE ? OR wp.skills LIKE ? OR wp.area LIKE ? OR wp.city LIKE ?)');
    params.push(like, like, like, like);
  }
  if (category) {
    conditions.push('wp.preferred_category = ?');
    params.push(category);
  }
  if (city) {
    conditions.push('LOWER(wp.city) = LOWER(?)');
    params.push(city);
  }
  if (workType) {
    conditions.push('wp.preferred_work_type = ?');
    params.push(workType);
  }

  const workers = db
    .prepare(
      `SELECT u.id, u.full_name, u.is_sample,
              wp.state, wp.district, wp.city, wp.area, wp.skills,
              wp.experience_label, wp.preferred_category, wp.preferred_work_type,
              wp.bio, wp.availability_status
       FROM users u
       JOIN worker_profiles wp ON wp.user_id = u.id
       WHERE ${conditions.join(' AND ')}
       ORDER BY u.created_at DESC
       LIMIT 50`
    )
    .all(...params);

  res.json({ workers });
});

export default router;
