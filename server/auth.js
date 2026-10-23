import { createHash, randomBytes, randomInt, timingSafeEqual } from 'node:crypto';
import bcrypt from 'bcryptjs';
import nodemailer from 'nodemailer';
import { getPool, query } from './db.js';
import { clearCookie, getCookie, safeReturnTo, sendJson, setCookie } from './http.js';

const SESSION_COOKIE = 'ministry_flow_session';
const SESSION_SECONDS = 7 * 24 * 60 * 60;
const RESET_SECONDS = 30 * 60;
const GOOGLE_STATE_COOKIE = 'ministry_flow_google_state';
let dummyPasswordHash;

const sha256 = (value) => createHash('sha256').update(value).digest('hex');

function publicUser(row) {
  return { id: row.id, email: row.email, role: row.role };
}

function appUrl() {
  const value = process.env.APP_URL;
  if (!value) throw new Error('APP_URL must be configured.');
  const url = new URL(value);
  if (url.protocol !== 'https:' && process.env.NODE_ENV === 'production') {
    throw new Error('APP_URL must use HTTPS in production.');
  }
  return url.origin;
}

export async function currentUser(req) {
  const token = getCookie(req, SESSION_COOKIE);
  if (!token) return null;
  const result = await query(
    `SELECT users.id, users.email, users.role
     FROM app_sessions sessions
     JOIN app_users users ON users.id = sessions.user_id
     WHERE sessions.token_hash = $1 AND sessions.expires_at > now()`,
    [sha256(token)]
  );
  return result.rows[0] ? publicUser(result.rows[0]) : null;
}

async function createSession(user, res) {
  const token = randomBytes(32).toString('base64url');
  await query(
    `INSERT INTO app_sessions (token_hash, user_id, expires_at)
     VALUES ($1, $2, now() + interval '7 days')`,
    [sha256(token), user.id]
  );
  setCookie(res, SESSION_COOKIE, token, { maxAge: SESSION_SECONDS });
}

async function checkLoginRateLimit(email, req, scope = 'login') {
  const forwarded = req.headers['x-forwarded-for'];
  const ip = typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : 'unknown';
  const bucket = sha256(`${scope}:${email}:${ip}`);
  const result = await query(
    `INSERT INTO auth_rate_limits (bucket, attempts, window_started_at)
     VALUES ($1, 1, now())
     ON CONFLICT (bucket) DO UPDATE SET
       attempts = CASE
         WHEN auth_rate_limits.window_started_at < now() - interval '15 minutes' THEN 1
         ELSE auth_rate_limits.attempts + 1
       END,
       window_started_at = CASE
         WHEN auth_rate_limits.window_started_at < now() - interval '15 minutes' THEN now()
         ELSE auth_rate_limits.window_started_at
       END
     RETURNING attempts`,
    [bucket]
  );
  return { bucket, attempts: result.rows[0].attempts };
}

export async function login(req, res, body) {
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const password = typeof body.password === 'string' ? body.password : '';
  if (!email || email.length > 320 || !password || password.length > 1024) {
    return sendJson(res, 400, { error: 'Enter a valid email and password.' });
  }

  const { bucket, attempts } = await checkLoginRateLimit(email, req);
  if (attempts > 10) {
    return sendJson(res, 429, { error: 'Too many sign-in attempts. Try again in 15 minutes.' });
  }

  const result = await query(
    'SELECT id, email, password_hash, role FROM app_users WHERE lower(email) = $1',
    [email]
  );
  const user = result.rows[0];
  if (!dummyPasswordHash) {
    dummyPasswordHash = bcrypt.hash(randomBytes(32).toString('hex'), 12);
  }
  const validPassword = user?.password_hash
    ? await bcrypt.compare(password, user.password_hash)
    : await bcrypt.compare(password, await dummyPasswordHash);
  if (!user || !validPassword) {
    return sendJson(res, 401, { error: 'Invalid email or password.' });
  }

  await query('DELETE FROM auth_rate_limits WHERE bucket = $1', [bucket]);
  await createSession(user, res);
  return sendJson(res, 200, { user: publicUser(user) });
}

function normalizeEmail(value) {
  return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

function validEmail(email) {
  return email.length <= 320 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function emailDeliveryError() {
  const required = ['SMTP_HOST', 'SMTP_USER', 'SMTP_PASSWORD', 'SMTP_FROM'];
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length) {
    const error = new Error(`Email delivery is not configured. Missing: ${missing.join(', ')}`);
    error.status = 503;
    throw error;
  }
}

async function sendRegistrationCode(email, code) {
  const transport = mailTransport();
  await transport.sendMail({
    from: process.env.SMTP_FROM,
    to: email,
    subject: 'Verify your Ministry Flow account',
    text: `Your Ministry Flow verification code is ${code}. It expires in 10 minutes.`,
    html: `<p>Your Ministry Flow verification code is:</p><p style="font-size:24px;font-weight:bold;letter-spacing:6px">${code}</p><p>This code expires in 10 minutes.</p>`,
  });
}

export async function register(req, res, body) {
  const email = normalizeEmail(body.email);
  const password = typeof body.password === 'string' ? body.password : '';
  if (!validEmail(email) || password.length < 12 || password.length > 128) {
    return sendJson(res, 400, {
      error: 'Enter a valid email and a password between 12 and 128 characters.',
    });
  }

  const { attempts } = await checkLoginRateLimit(email, req, 'registration');
  if (attempts > 5) {
    return sendJson(res, 429, { error: 'Too many sign-up attempts. Try again in 15 minutes.' });
  }

  emailDeliveryError();
  const existingUser = await query('SELECT 1 FROM app_users WHERE lower(email) = $1', [email]);
  if (existingUser.rowCount) {
    return sendJson(res, 409, { error: 'An account with this email already exists. Please log in.' });
  }

  const code = String(randomInt(100000, 1000000));
  const [passwordHash, codeHash] = await Promise.all([
    bcrypt.hash(password, 12),
    bcrypt.hash(code, 12),
  ]);
  const pendingResult = await query(
    `INSERT INTO auth_pending_registrations
       (email, password_hash, code_hash, expires_at, attempts, last_sent_at)
     VALUES ($1, $2, $3, now() + interval '10 minutes', 0, now())
     ON CONFLICT (email) DO UPDATE SET
       password_hash = EXCLUDED.password_hash,
       code_hash = EXCLUDED.code_hash,
       expires_at = EXCLUDED.expires_at,
       attempts = 0,
       last_sent_at = now()
     WHERE auth_pending_registrations.last_sent_at <= now() - interval '60 seconds'
     RETURNING email`,
    [email, passwordHash, codeHash]
  );
  if (!pendingResult.rowCount) {
    return sendJson(res, 429, { error: 'A verification code was just sent. Please wait a minute before retrying.' });
  }

  try {
    await sendRegistrationCode(email, code);
  } catch (error) {
    await query(
      'DELETE FROM auth_pending_registrations WHERE email = $1 AND code_hash = $2',
      [email, codeHash]
    );
    throw error;
  }
  return sendJson(res, 200, { success: true });
}

export async function resendRegistrationCode(req, res, body) {
  const email = normalizeEmail(body.email);
  if (!validEmail(email)) {
    return sendJson(res, 400, { error: 'Enter a valid email address.' });
  }

  const { attempts } = await checkLoginRateLimit(email, req, 'registration');
  if (attempts > 5) {
    return sendJson(res, 429, { error: 'Too many sign-up attempts. Try again in 15 minutes.' });
  }
  emailDeliveryError();

  const userResult = await query('SELECT 1 FROM app_users WHERE lower(email) = $1', [email]);
  if (userResult.rowCount) return sendJson(res, 200, { success: true });

  const pending = await query(
    'SELECT 1 FROM auth_pending_registrations WHERE email = $1 AND expires_at > now()',
    [email]
  );
  if (!pending.rowCount) return sendJson(res, 200, { success: true });

  const code = String(randomInt(100000, 1000000));
  const codeHash = await bcrypt.hash(code, 12);
  const updated = await query(
    `UPDATE auth_pending_registrations
     SET code_hash = $2, expires_at = now() + interval '10 minutes',
         attempts = 0, last_sent_at = now()
     WHERE email = $1 AND expires_at > now()
       AND last_sent_at <= now() - interval '60 seconds'
     RETURNING email`,
    [email, codeHash]
  );
  if (!updated.rowCount) {
    return sendJson(res, 429, { error: 'A verification code was just sent. Please wait a minute before retrying.' });
  }

  try {
    await sendRegistrationCode(email, code);
  } catch (error) {
    await query(
      `DELETE FROM auth_pending_registrations
       WHERE email = $1 AND code_hash = $2`,
      [email, codeHash]
    );
    throw error;
  }
  return sendJson(res, 200, { success: true });
}

export async function verifyRegistration(req, res, body) {
  const email = normalizeEmail(body.email);
  const code = typeof body.code === 'string' ? body.code.trim() : '';
  if (!validEmail(email) || !/^\d{6}$/.test(code)) {
    return sendJson(res, 400, { error: 'Enter a valid email and six-digit verification code.' });
  }

  const client = await getPool().connect();
  let inTransaction = false;
  let user;
  try {
    await client.query('BEGIN');
    inTransaction = true;
    const pendingResult = await client.query(
      `SELECT password_hash, code_hash, expires_at, attempts
       FROM auth_pending_registrations
       WHERE email = $1
       FOR UPDATE`,
      [email]
    );
    const pending = pendingResult.rows[0];
    if (!pending || pending.expires_at <= new Date() || pending.attempts >= 5) {
      await client.query('ROLLBACK');
      inTransaction = false;
      return sendJson(res, 400, { error: 'This verification code is invalid or has expired.' });
    }

    if (!(await bcrypt.compare(code, pending.code_hash))) {
      await client.query(
        'UPDATE auth_pending_registrations SET attempts = attempts + 1 WHERE email = $1',
        [email]
      );
      await client.query('COMMIT');
      inTransaction = false;
      return sendJson(res, 400, { error: 'This verification code is invalid or has expired.' });
    }

    const userResult = await client.query(
      `INSERT INTO app_users (email, password_hash, role)
       VALUES ($1, $2, 'user')
       ON CONFLICT (lower(email)) DO NOTHING
       RETURNING id, email, role`,
      [email, pending.password_hash]
    );
    if (!userResult.rowCount) {
      await client.query('DELETE FROM auth_pending_registrations WHERE email = $1', [email]);
      await client.query('COMMIT');
      inTransaction = false;
      return sendJson(res, 409, { error: 'An account with this email already exists. Please log in.' });
    }

    user = userResult.rows[0];
    await client.query('DELETE FROM auth_pending_registrations WHERE email = $1', [email]);
    await client.query('COMMIT');
    inTransaction = false;
  } catch (error) {
    if (inTransaction) await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }

  await createSession(user, res);
  return sendJson(res, 200, { user: publicUser(user) });
}

export async function logout(req, res) {
  const token = getCookie(req, SESSION_COOKIE);
  if (token) await query('DELETE FROM app_sessions WHERE token_hash = $1', [sha256(token)]);
  clearCookie(res, SESSION_COOKIE);
  return sendJson(res, 200, { success: true });
}

function mailTransport() {
  emailDeliveryError();
  const port = Number(process.env.SMTP_PORT || 587);
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: process.env.SMTP_SECURE === 'true' || port === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD },
  });
}

export async function requestPasswordReset(body) {
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  if (!email || email.length > 320) {
    const error = new Error('Enter a valid email address.');
    error.status = 400;
    throw error;
  }
  const transport = mailTransport();
  const userResult = await query(
    'SELECT id, email FROM app_users WHERE lower(email) = $1',
    [email]
  );
  if (!userResult.rowCount) return { success: true };

  const token = randomBytes(32).toString('base64url');
  const expiresAt = new Date(Date.now() + RESET_SECONDS * 1000);
  await query('DELETE FROM password_reset_tokens WHERE user_id = $1', [userResult.rows[0].id]);
  await query(
    `INSERT INTO password_reset_tokens (token_hash, user_id, expires_at)
     VALUES ($1, $2, $3)`,
    [sha256(token), userResult.rows[0].id, expiresAt]
  );
  const resetUrl = new URL('/reset-password', appUrl());
  resetUrl.searchParams.set('token', token);
  try {
    await transport.sendMail({
      from: process.env.SMTP_FROM,
      to: userResult.rows[0].email,
      subject: 'Reset your Ministry Flow password',
      text: `Use this link within 30 minutes to reset your password: ${resetUrl}`,
      html: `<p>Use this link within 30 minutes to reset your password:</p><p><a href="${resetUrl}">Reset password</a></p>`,
    });
  } catch (error) {
    await query('DELETE FROM password_reset_tokens WHERE token_hash = $1', [sha256(token)]);
    throw error;
  }
  return { success: true };
}

export async function resetPassword(body) {
  const token = typeof body.resetToken === 'string' ? body.resetToken : '';
  const password = typeof body.newPassword === 'string' ? body.newPassword : '';
  if (token.length < 32 || token.length > 256) {
    const error = new Error('This password reset link is invalid or has expired.');
    error.status = 400;
    throw error;
  }
  if (password.length < 12 || password.length > 128) {
    const error = new Error('Use a password between 12 and 128 characters.');
    error.status = 400;
    throw error;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const result = await query(
    `WITH valid_token AS (
       DELETE FROM password_reset_tokens
       WHERE token_hash = $1 AND expires_at > now()
       RETURNING user_id
     )
     UPDATE app_users
     SET password_hash = $2, updated_at = now()
     FROM valid_token
     WHERE app_users.id = valid_token.user_id
     RETURNING app_users.id`,
    [sha256(token), passwordHash]
  );
  if (!result.rowCount) {
    const error = new Error('This password reset link is invalid or has expired.');
    error.status = 400;
    throw error;
  }
  return { success: true };
}

function googleConfig() {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    const error = new Error('Google sign-in is not configured. Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.');
    error.status = 503;
    throw error;
  }
  const origin = appUrl();
  return {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    redirectUri: `${origin}/api/auth/google/callback`,
  };
}

export async function beginGoogleLogin(req, res, returnTo) {
  const { clientId, redirectUri } = googleConfig();
  const state = randomBytes(32).toString('base64url');
  await query(
    `INSERT INTO google_oauth_states (state_hash, return_to, expires_at)
     VALUES ($1, $2, now() + interval '10 minutes')`,
    [sha256(state), safeReturnTo(returnTo)]
  );
  setCookie(res, GOOGLE_STATE_COOKIE, state, { maxAge: 600 });
  const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  url.searchParams.set('client_id', clientId);
  url.searchParams.set('redirect_uri', redirectUri);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('scope', 'openid email profile');
  url.searchParams.set('state', state);
  res.statusCode = 302;
  res.setHeader('Location', url.toString());
  res.end();
}

export async function finishGoogleLogin(req, res, code, state) {
  const storedState = getCookie(req, GOOGLE_STATE_COOKIE);
  clearCookie(res, GOOGLE_STATE_COOKIE);
  if (!storedState || !state || storedState.length !== state.length ||
      !timingSafeEqual(Buffer.from(storedState), Buffer.from(state))) {
    const error = new Error('Google sign-in could not be verified. Please try again.');
    error.status = 400;
    throw error;
  }

  const stateResult = await query(
    `DELETE FROM google_oauth_states
     WHERE state_hash = $1 AND expires_at > now()
     RETURNING return_to`,
    [sha256(state)]
  );
  if (!stateResult.rowCount) {
    const error = new Error('Google sign-in has expired. Please try again.');
    error.status = 400;
    throw error;
  }

  const { clientId, clientSecret, redirectUri } = googleConfig();
  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  });
  if (!tokenResponse.ok) {
    throw new Error('Google sign-in failed while exchanging the authorization code.');
  }
  const tokenData = await tokenResponse.json();
  const userResponse = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
    headers: { Authorization: `Bearer ${tokenData.access_token}` },
  });
  if (!userResponse.ok) throw new Error('Google sign-in could not retrieve the account profile.');
  const profile = await userResponse.json();
  if (!profile.email || profile.email_verified !== true || !profile.sub) {
    const error = new Error('Google did not provide a verified email address.');
    error.status = 401;
    throw error;
  }

  let userResult = await query(
    `SELECT id, email, role, google_sub
     FROM app_users WHERE lower(email) = $1`,
    [profile.email.toLowerCase()]
  );
  let user = userResult.rows[0];
  if (!user) {
    userResult = await query(
      `INSERT INTO app_users (email, google_sub, role)
       VALUES ($1, $2, 'user')
       ON CONFLICT (lower(email)) DO NOTHING
       RETURNING id, email, role, google_sub`,
      [profile.email.toLowerCase(), profile.sub]
    );
    user = userResult.rows[0];
    if (!user) {
      userResult = await query(
        `SELECT id, email, role, google_sub
         FROM app_users WHERE lower(email) = $1`,
        [profile.email.toLowerCase()]
      );
      user = userResult.rows[0];
    }
  }
  if (!user || (user.google_sub && user.google_sub !== profile.sub)) {
    const error = new Error('This Google account cannot be linked to the existing account.');
    error.status = 403;
    throw error;
  }
  if (!user.google_sub) {
    const linkedUser = await query(
      `UPDATE app_users
       SET google_sub = $1, updated_at = now()
       WHERE id = $2 AND (google_sub IS NULL OR google_sub = $1)
       RETURNING id, email, role, google_sub`,
      [profile.sub, user.id]
    );
    if (!linkedUser.rowCount) {
      const error = new Error('This Google account cannot be linked to the existing account.');
      error.status = 403;
      throw error;
    }
    user = linkedUser.rows[0];
  }
  await createSession(user, res);
  res.statusCode = 302;
  res.setHeader('Location', safeReturnTo(stateResult.rows[0].return_to));
  res.end();
}
