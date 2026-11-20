import { Router } from 'express';
import { db } from '../db.ts';
import { requireAuth, verifyCsrf } from '../auth.ts';
import { REPORT_REASONS } from '../../src/data/constants.ts';

const router = Router();

router.get('/notifications', requireAuth, (req, res) => {
  const items = db
    .prepare('SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 40')
    .all(req.auth!.user.id);
  res.json({ notifications: items });
});

router.patch('/notifications/:id/read', requireAuth, verifyCsrf, (req, res) => {
  const id = Number(req.params.id);
  db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?').run(
    id,
    req.auth!.user.id
  );
  res.json({ ok: true });
});

router.patch('/notifications/read-all', requireAuth, verifyCsrf, (req, res) => {
  db.prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ?').run(req.auth!.user.id);
  res.json({ ok: true });
});

router.post('/reports', verifyCsrf, (req, res) => {
  const body = req.body || {};
  const targetType = String(body.target_type || '');
  const targetJobId = body.target_job_id ? Number(body.target_job_id) : null;
  const targetEmployerId = body.target_employer_id ? Number(body.target_employer_id) : null;
  const reason = String(body.reason || '').trim();
  const details = String(body.details || '').trim().slice(0, 1000);

  if (!['job', 'employer'].includes(targetType)) {
    res.status(400).json({ error: 'Invalid report target.' });
    return;
  }
  if (!reason || (!REPORT_REASONS.includes(reason as any) && reason.length < 4)) {
    res.status(400).json({ error: 'Please select a valid reason for your report.' });
    return;
  }
  if (targetType === 'job' && !targetJobId) {
    res.status(400).json({ error: 'Missing job reference.' });
    return;
  }
  if (targetType === 'employer' && !targetEmployerId) {
    res.status(400).json({ error: 'Missing employer reference.' });
    return;
  }

  const now = new Date().toISOString();
  const r = db
    .prepare(
      `INSERT INTO reports (reporter_id, target_type, target_job_id, target_employer_id, reason, details, status, admin_notes, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, 'Open', '', ?, ?)`
    )
    .run(req.auth?.user.id || null, targetType, targetJobId, targetEmployerId, reason, details, now, now);

  const admins = db.prepare("SELECT id FROM users WHERE role = 'admin'").all() as { id: number }[];
  for (const adm of admins) {
    db.prepare(
      `INSERT INTO notifications (user_id, title, message, link, is_read, created_at)
       VALUES (?, ?, ?, ?, 0, ?)`
    ).run(
      adm.id,
      'New Safety Report Submitted',
      `A ${targetType} report was filed: ${reason}`,
      '/admin/dashboard',
      now
    );
  }

  res.status(201).json({ ok: true, id: Number(r.lastInsertRowid) });
});

router.post('/contact', (req, res) => {
  const body = req.body || {};
  const name = String(body.name || '').trim();
  const email = String(body.email || '').trim();
  const phone = String(body.phone || '').replace(/\D/g, '').slice(-10);
  const subject = String(body.subject || '').trim();
  const message = String(body.message || '').trim();

  if (name.length < 2) {
    res.status(400).json({ error: 'Please enter your name.' });
    return;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    res.status(400).json({ error: 'Please enter a valid email address.' });
    return;
  }
  if (subject.length < 3 || message.length < 10) {
    res.status(400).json({ error: 'Please enter a subject and message (at least 10 characters).' });
    return;
  }

  const now = new Date().toISOString();
  const r = db
    .prepare(
      `INSERT INTO contact_messages (name, email, phone, subject, message, status, created_at)
       VALUES (?, ?, ?, ?, ?, 'New', ?)`
    )
    .run(name, email, phone, subject, message, now);

  res.status(201).json({ ok: true, id: Number(r.lastInsertRowid) });
});

export default router;
