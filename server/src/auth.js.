
import { Router } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';

const router = Router();
const COOKIE_NAME = 'afrolive_admin_session';
const SESSION_HOURS = 8;

function getDb(req) {
  return req.app.locals.db;
}

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function cookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_HOURS * 60 * 60 * 1000,
  };
}

function clearSessionCookie(res) {
  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  });
}

function checkOrigin(req, res, next) {
  const allowedOrigins = (process.env.CORS_ORIGINS || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  const origin = req.get('origin');

  if (!origin || !allowedOrigins.includes(origin)) {
    return res.status(403).json({ error: 'origin_not_allowed' });
  }

  next();
}

export async function requireAdmin(req, res, next) {
  const db = getDb(req);
  const token = req.cookies?.[COOKIE_NAME];

  if (!db || !token) {
    return res.status(401).json({ error: 'authentication_required' });
  }

  try {
    const result = await db.query(
      `SELECT u.id, u.email, u.role
       FROM admin_sessions s
       JOIN admin_users u ON u.id = s.admin_user_id
       WHERE s.token_hash = $1
         AND s.expires_at > NOW()
         AND u.is_active = TRUE
       LIMIT 1`,
      [hashToken(token)]
    );

    if (!result.rowCount) {
      clearSessionCookie(res);
      return res.status(401).json({ error: 'session_invalid' });
    }

    req.admin = result.rows[0];
    next();
  } catch (error) {
    next(error);
  }
}

router.post('/login', checkOrigin, async (req, res, next) => {
  const db = getDb(req);

  if (!db) {
    return res.status(503).json({ error: 'database_unavailable' });
  }

  const email = String(req.body?.email || '').trim().toLowerCase();
  const password = String(req.body?.password || '');

  if (
    email.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    !password ||
    password.length > 200
  ) {
    return res.status(400).json({ error: 'invalid_request' });
  }

  try {
    const result = await db.query(
      `SELECT id, email, password_hash, role, is_active,
              failed_login_attempts, locked_until
       FROM admin_users
       WHERE email = $1
       LIMIT 1`,
      [email]
    );

    const user = result.rows[0];

    if (!user) {
      return res.status(401).json({ error: 'invalid_credentials' });
    }

    if (
      !user.is_active ||
      (user.locked_until && new Date(user.locked_until) > new Date())
    ) {
      return res.status(401).json({ error: 'invalid_credentials' });
    }

    const passwordMatches = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatches) {
      await db.query(
        `UPDATE admin_users
         SET failed_login_attempts = failed_login_attempts + 1,
             locked_until = CASE
               WHEN failed_login_attempts + 1 >= 5
               THEN NOW() + INTERVAL '15 minutes'
               ELSE locked_until
             END,
             updated_at = NOW()
         WHERE id = $1`,
        [user.id]
      );

      return res.status(401).json({ error: 'invalid_credentials' });
    }

    await db.query(
      `UPDATE admin_users
       SET failed_login_attempts = 0,
           locked_until = NULL,
           last_login_at = NOW(),
           updated_at = NOW()
       WHERE id = $1`,
      [user.id]
    );

    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = hashToken(token);

    await db.query(
      `INSERT INTO admin_sessions
         (admin_user_id, token_hash, expires_at)
       VALUES ($1, $2, NOW() + INTERVAL '8 hours')`,
      [user.id, tokenHash]
    );

    res.cookie(COOKIE_NAME, token, cookieOptions());

    return res.json({
      authenticated: true,
      admin: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
});

router.get('/me', requireAdmin, (req, res) => {
  res.json({
    authenticated: true,
    admin: req.admin,
  });
});

router.post('/logout', checkOrigin, async (req, res, next) => {
  const db = getDb(req);
  const token = req.cookies?.[COOKIE_NAME];

  try {
    if (db && token) {
      await db.query(
        'DELETE FROM admin_sessions WHERE token_hash = $1',
        [hashToken(token)]
      );
    }

    clearSessionCookie(res);
    return res.json({ authenticated: false });
  } catch (error) {
    next(error);
  }
});

export default router;
