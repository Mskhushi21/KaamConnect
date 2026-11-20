import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import type { NextFunction, Request, Response } from 'express';
import { db } from './db.ts';
import type { Language, UserRole } from '../src/data/constants.ts';

const SESSION_COOKIE_NAME = 'kc_session';
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function getSessionSecret(): string {
  return process.env.SESSION_SECRET || 'kaamconnect-local-dev-secret-2026-key';
}

export interface AuthUser {
  id: number;
  email: string;
  mobile: string;
  role: UserRole;
  full_name: string;
  language: Language;
  is_suspended: number;
  created_at: string;
}

export interface AuthContext {
  user: AuthUser;
  sessionId: string;
  csrfToken: string;
}

declare global {
  namespace Express {
    interface Request {
      auth?: AuthContext;
    }
  }
}

export function hashPassword(password: string): string {
  return bcrypt.hashSync(password, 10);
}

export function verifyPassword(password: string, hash: string): boolean {
  return bcrypt.compareSync(password, hash);
}

function signSessionId(sessionId: string): string {
  const sig = crypto
    .createHmac('sha256', getSessionSecret())
    .update(sessionId)
    .digest('hex');
  return `${sessionId}.${sig}`;
}

function verifySignedSessionToken(rawToken: string | undefined): string | null {
  if (!rawToken || typeof rawToken !== 'string') return null;
  const dotIdx = rawToken.lastIndexOf('.');
  if (dotIdx <= 0) return null;
  const sessionId = rawToken.slice(0, dotIdx);
  const sig = rawToken.slice(dotIdx + 1);
  const expected = crypto
    .createHmac('sha256', getSessionSecret())
    .update(sessionId)
    .digest('hex');
  const sigBuf = Buffer.from(sig);
  const expBuf = Buffer.from(expected);
  if (sigBuf.length !== expBuf.length) return null;
  if (!crypto.timingSafeEqual(sigBuf, expBuf)) return null;
  return sessionId;
}

function isHttpsRequest(req: Request): boolean {
  const proto = req.headers['x-forwarded-proto'];
  if (typeof proto === 'string' && proto.split(',')[0].trim() === 'https') {
    return true;
  }
  const origin = req.headers.origin || req.headers.referer || '';
  if (typeof origin === 'string' && origin.startsWith('https://')) {
    return true;
  }
  return req.secure;
}

function extractRawToken(req: Request): string | undefined {
  const authHeader = req.headers.authorization;
  if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7).trim();
    if (token) return token;
  }
  return req.cookies?.[SESSION_COOKIE_NAME];
}

export function createSession(
  req: Request,
  res: Response,
  userId: number
): { sessionId: string; csrfToken: string; authToken: string } {
  const sessionId = crypto.randomBytes(24).toString('hex');
  const csrfToken = crypto.randomBytes(24).toString('hex');
  const now = new Date().toISOString();
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS).toISOString();

  // Clean up expired sessions periodically
  db.prepare('DELETE FROM sessions WHERE expires_at < ?').run(now);

  db.prepare(
    'INSERT INTO sessions (id, user_id, csrf_token, expires_at, created_at) VALUES (?, ?, ?, ?, ?)'
  ).run(sessionId, userId, csrfToken, expiresAt, now);

  const signed = signSessionId(sessionId);
  const https = isHttpsRequest(req);

  res.cookie(SESSION_COOKIE_NAME, signed, {
    httpOnly: true,
    sameSite: https ? 'none' : 'lax',
    secure: https,
    path: '/',
    maxAge: SESSION_TTL_MS,
  });

  return { sessionId, csrfToken, authToken: signed };
}

export function destroySession(req: Request, res: Response): void {
  const raw = extractRawToken(req);
  const sessionId = verifySignedSessionToken(raw);
  if (sessionId) {
    db.prepare('DELETE FROM sessions WHERE id = ?').run(sessionId);
  }
  const https = isHttpsRequest(req);
  res.clearCookie(SESSION_COOKIE_NAME, {
    httpOnly: true,
    sameSite: https ? 'none' : 'lax',
    secure: https,
    path: '/',
  });
}

export function attachAuth(req: Request, res: Response, next: NextFunction): void {
  const raw = extractRawToken(req);
  const sessionId = verifySignedSessionToken(raw);
  if (!sessionId) {
    return next();
  }

  const row = db
    .prepare(
      `SELECT s.id AS session_id, s.csrf_token, s.expires_at,
              u.id, u.email, u.mobile, u.role, u.full_name, u.language, u.is_suspended, u.created_at
       FROM sessions s
       JOIN users u ON u.id = s.user_id
       WHERE s.id = ?`
    )
    .get(sessionId) as
    | (AuthUser & { session_id: string; csrf_token: string; expires_at: string })
    | undefined;

  if (!row || row.expires_at < new Date().toISOString()) {
    if (row) {
      db.prepare('DELETE FROM sessions WHERE id = ?').run(sessionId);
    }
    return next();
  }

  if (row.is_suspended === 1) {
    db.prepare('DELETE FROM sessions WHERE id = ?').run(sessionId);
    destroySession(req, res);
    return next();
  }

  req.auth = {
    sessionId: row.session_id,
    csrfToken: row.csrf_token,
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
  };

  next();
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  if (!req.auth) {
    res.status(401).json({ error: 'Authentication required. Please log in.' });
    return;
  }
  next();
}

export function requireRole(...roles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.auth) {
      res.status(401).json({ error: 'Authentication required. Please log in.' });
      return;
    }
    if (!roles.includes(req.auth.user.role)) {
      res.status(403).json({ error: 'You do not have permission to access this resource.' });
      return;
    }
    next();
  };
}

export function verifyCsrf(req: Request, res: Response, next: NextFunction): void {
  const mutatingMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];
  if (!mutatingMethods.includes(req.method)) {
    return next();
  }
  if (!req.auth) {
    return next();
  }
  const headerToken = req.headers['x-csrf-token'];
  if (typeof headerToken !== 'string' || headerToken !== req.auth.csrfToken) {
    res.status(403).json({ error: 'Invalid or missing CSRF security token. Please refresh and try again.' });
    return;
  }
  next();
}
