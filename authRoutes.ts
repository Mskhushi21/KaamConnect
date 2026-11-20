import { Router } from 'express';
import { db } from '../db.ts';
import {
  createSession,
  destroySession,
  hashPassword,
  requireAuth,
  verifyCsrf,
  verifyPassword,
} from '../auth.ts';
import {
  EMPLOYER_TYPES,
  EXPERIENCE_LEVELS,
  JOB_CATEGORIES,
  WORK_TYPES,
} from '../../src/data/constants.ts';

const router = Router();

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function normalizeMobile(mobile: string): string {
  return mobile.replace(/\D/g, '').slice(-10);
}

function isValidMobile(mobile: string): boolean {
  return /^[6-9]\d{9}$/.test(mobile);
}

function getProfileForUser(userId: number, role: string) {
  if (role === 'worker') {
    return db.prepare('SELECT * FROM worker_profiles WHERE user_id = ?').get(userId) || null;
  }
  if (role === 'employer') {
    return db.prepare('SELECT * FROM employer_profiles WHERE user_id = ?').get(userId) || null;
  }
  return null;
}

router.get('/me', (req, res) => {
  if (!req.auth) {
    res.json({ user: null, profile: null, csrfToken: null });
    return;
  }
  const profile = getProfileForUser(req.auth.user.id, req.auth.user.role);
  res.json({
    user: req.auth.user,
    profile,
    csrfToken: req.auth.csrfToken,
  });
});

router.post('/register/worker', (req, res) => {
  try {
    const body = req.body || {};
    const fullName = String(body.full_name || '').trim();
    const email = String(body.email || '').trim().toLowerCase();
    const mobile = normalizeMobile(String(body.mobile || ''));
    const password = String(body.password || '');
    const state = String(body.state || 'Karnataka').trim();
    const district = String(body.district || '').trim();
    const city = String(body.city || '').trim();
    const area = String(body.area || '').trim();
    const skills = String(body.skills || '').trim();
    const experienceLabel = String(body.experience_label || 'Fresher').trim();
    const preferredCategory = String(body.preferred_category || '').trim();
    const preferredWorkType = String(body.preferred_work_type || 'Full-time').trim();
    const language = ['en', 'kn', 'hi'].includes(body.language) ? body.language : 'en';

    if (fullName.length < 2) {
      res.status(400).json({ error: 'Please enter your full name (at least 2 characters).' });
      return;
    }
    if (!isValidEmail(email)) {
      res.status(400).json({ error: 'Please enter a valid email address.' });
      return;
    }
    if (!isValidMobile(mobile)) {
      res.status(400).json({ error: 'Please enter a valid 10-digit Indian mobile number.' });
      return;
    }
    if (password.length < 6) {
      res.status(400).json({ error: 'Password must be at least 6 characters long.' });
      return;
    }
    if (!state || !city) {
      res.status(400).json({ error: 'Please select your state and city.' });
      return;
    }
    if (!skills) {
      res.status(400).json({ error: 'Please list at least one skill (e.g., Cooking, Driving, Carpentry).' });
      return;
    }
    if (!JOB_CATEGORIES.includes(preferredCategory as any)) {
      res.status(400).json({ error: 'Please select a valid preferred job category.' });
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

    const dup = db
      .prepare('SELECT id, email, mobile FROM users WHERE email = ? OR mobile = ?')
      .get(email, mobile) as { id: number; email: string; mobile: string } | undefined;

    if (dup) {
      if (dup.email === email) {
        res.status(409).json({ error: 'An account with this email address already exists.' });
        return;
      }
      res.status(409).json({ error: 'An account with this mobile number already exists.' });
      return;
    }

    const expYearsMap: Record<string, number> = {
      Fresher: 0,
      '1-2 years': 1,
      '2-5 years': 3,
      '5+ years': 6,
    };

    const now = new Date().toISOString();
    const passwordHash = hashPassword(password);

    const tx = db.transaction(() => {
      const userRes = db
        .prepare(
          `INSERT INTO users (email, mobile, password_hash, role, full_name, language, is_suspended, is_sample, created_at, updated_at)
           VALUES (?, ?, ?, 'worker', ?, ?, 0, 0, ?, ?)`
        )
        .run(email, mobile, passwordHash, fullName, language, now, now);

      const userId = Number(userRes.lastInsertRowid);

      db.prepare(
        `INSERT INTO worker_profiles (
          user_id, state, district, city, area, skills, experience_years, experience_label,
          preferred_category, preferred_work_type, bio, availability_status, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, '', 'Available', ?)`
      ).run(
        userId,
        state,
        district,
        city,
        area,
        skills,
        expYearsMap[experienceLabel] ?? 0,
        experienceLabel,
        preferredCategory,
        preferredWorkType,
        now
      );

      db.prepare(
        `INSERT INTO notifications (user_id, title, message, link, is_read, created_at)
         VALUES (?, ?, ?, ?, 0, ?)`
      ).run(
        userId,
        'Welcome to KaamConnect',
        'Your worker profile is active. Browse local jobs matching your skills and never pay any recruitment fee.',
        '/jobs',
        now
      );

      return userId;
    });

    const userId = tx();
    const { csrfToken, authToken } = createSession(req, res, userId);
    const user = db
      .prepare('SELECT id, email, mobile, role, full_name, language, is_suspended, created_at FROM users WHERE id = ?')
      .get(userId);
    const profile = getProfileForUser(userId, 'worker');

    res.status(201).json({ user, profile, csrfToken, authToken });
  } catch (err) {
    console.error('Worker registration error:', err);
    res.status(500).json({ error: 'Unable to complete registration. Please try again.' });
  }
});

router.post('/register/employer', (req, res) => {
  try {
    const body = req.body || {};
    const fullName = String(body.full_name || '').trim();
    const businessName = String(body.business_name || '').trim();
    const email = String(body.email || '').trim().toLowerCase();
    const mobile = normalizeMobile(String(body.mobile || ''));
    const password = String(body.password || '');
    const state = String(body.state || 'Karnataka').trim();
    const district = String(body.district || '').trim();
    const city = String(body.city || '').trim();
    const area = String(body.area || '').trim();
    const employerType = String(body.employer_type || 'Individual / Household').trim();
    const language = ['en', 'kn', 'hi'].includes(body.language) ? body.language : 'en';

    if (fullName.length < 2) {
      res.status(400).json({ error: 'Please enter the employer or contact person name.' });
      return;
    }
    if (!isValidEmail(email)) {
      res.status(400).json({ error: 'Please enter a valid email address.' });
      return;
    }
    if (!isValidMobile(mobile)) {
      res.status(400).json({ error: 'Please enter a valid 10-digit Indian mobile number.' });
      return;
    }
    if (password.length < 6) {
      res.status(400).json({ error: 'Password must be at least 6 characters long.' });
      return;
    }
    if (!state || !city) {
      res.status(400).json({ error: 'Please select your state and city.' });
      return;
    }
    if (!EMPLOYER_TYPES.includes(employerType as any)) {
      res.status(400).json({ error: 'Please select a valid employer type.' });
      return;
    }

    const dup = db
      .prepare('SELECT id, email, mobile FROM users WHERE email = ? OR mobile = ?')
      .get(email, mobile) as { id: number; email: string; mobile: string } | undefined;

    if (dup) {
      if (dup.email === email) {
        res.status(409).json({ error: 'An account with this email address already exists.' });
        return;
      }
      res.status(409).json({ error: 'An account with this mobile number already exists.' });
      return;
    }

    const now = new Date().toISOString();
    const passwordHash = hashPassword(password);

    const tx = db.transaction(() => {
      const userRes = db
        .prepare(
          `INSERT INTO users (email, mobile, password_hash, role, full_name, language, is_suspended, is_sample, created_at, updated_at)
           VALUES (?, ?, ?, 'employer', ?, ?, 0, 0, ?, ?)`
        )
        .run(email, mobile, passwordHash, fullName, language, now, now);

      const userId = Number(userRes.lastInsertRowid);

      db.prepare(
        `INSERT INTO employer_profiles (
          user_id, business_name, employer_type, state, district, city, area, description, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, '', ?)`
      ).run(userId, businessName, employerType, state, district, city, area, now);

      db.prepare(
        `INSERT INTO notifications (user_id, title, message, link, is_read, created_at)
         VALUES (?, ?, ?, ?, 0, ?)`
      ).run(
        userId,
        'Employer Account Ready',
        'Welcome to KaamConnect. You can now publish local job openings and review worker applications.',
        '/employer/dashboard',
        now
      );

      return userId;
    });

    const userId = tx();
    const { csrfToken, authToken } = createSession(req, res, userId);
    const user = db
      .prepare('SELECT id, email, mobile, role, full_name, language, is_suspended, created_at FROM users WHERE id = ?')
      .get(userId);
    const profile = getProfileForUser(userId, 'employer');

    res.status(201).json({ user, profile, csrfToken, authToken });
  } catch (err) {
    console.error('Employer registration error:', err);
    res.status(500).json({ error: 'Unable to complete registration. Please try again.' });
  }
});

router.post('/login', (req, res) => {
  try {
    const identifier = String(req.body?.identifier || '').trim();
    const password = String(req.body?.password || '');

    if (!identifier || !password) {
      res.status(400).json({ error: 'Please enter your email or mobile number and password.' });
      return;
    }

    const normalizedEmail = identifier.toLowerCase();
    const normalizedMobile = normalizeMobile(identifier);

    const row = db
      .prepare('SELECT * FROM users WHERE email = ? OR (mobile = ? AND length(?) = 10)')
      .get(normalizedEmail, normalizedMobile, normalizedMobile) as
      | {
          id: number;
          email: string;
          mobile: string;
          password_hash: string;
          role: string;
          full_name: string;
          language: string;
          is_suspended: number;
          created_at: string;
        }
      | undefined;

    if (!row || !verifyPassword(password, row.password_hash)) {
      res.status(401).json({ error: 'Invalid email/mobile or password.' });
      return;
    }

    if (row.is_suspended === 1) {
      res.status(403).json({
        error: 'This account has been suspended for violating platform safety guidelines. Contact support for assistance.',
      });
      return;
    }

    const { csrfToken, authToken } = createSession(req, res, row.id);
    const profile = getProfileForUser(row.id, row.role);

    res.json({
      user: {
        id: row.id,
        email: row.email,
        mobile: row.mobile,
        role: row.role,
        full_name: row.full_name,
        language: row.language,
        is_suspended: row.is_suspended,
        created_at: row.created_at,
      },
      profile,
      csrfToken,
      authToken,
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed due to a server error.' });
  }
});

router.post('/logout', (req, res) => {
  destroySession(req, res);
  res.json({ ok: true });
});

router.patch('/language', requireAuth, verifyCsrf, (req, res) => {
  const language = String(req.body?.language || '');
  if (!['en', 'kn', 'hi'].includes(language)) {
    res.status(400).json({ error: 'Unsupported language code.' });
    return;
  }
  const now = new Date().toISOString();
  db.prepare('UPDATE users SET language = ?, updated_at = ? WHERE id = ?').run(
    language,
    now,
    req.auth!.user.id
  );
  res.json({ ok: true, language });
});

router.patch('/password', requireAuth, verifyCsrf, (req, res) => {
  const currentPassword = String(req.body?.current_password || '');
  const newPassword = String(req.body?.new_password || '');

  if (newPassword.length < 6) {
    res.status(400).json({ error: 'New password must be at least 6 characters long.' });
    return;
  }

  const row = db
    .prepare('SELECT password_hash FROM users WHERE id = ?')
    .get(req.auth!.user.id) as { password_hash: string } | undefined;

  if (!row || !verifyPassword(currentPassword, row.password_hash)) {
    res.status(400).json({ error: 'Current password is incorrect.' });
    return;
  }

  const now = new Date().toISOString();
  db.prepare('UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?').run(
    hashPassword(newPassword),
    now,
    req.auth!.user.id
  );
  res.json({ ok: true });
});

export default router;
