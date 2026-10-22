import {
  beginGoogleLogin,
  currentUser,
  finishGoogleLogin,
  login,
  logout,
  requestPasswordReset,
  resetPassword,
} from '../server/auth.js';
import { handleEntityRequest } from '../server/entities.js';
import { readJson, sendJson } from '../server/http.js';

export default async function handler(req, res) {
  try {
    const url = new URL(req.url, 'https://vercel.invalid');
    const segments = url.pathname.split('/').filter(Boolean).slice(1);

    if (segments[0] === 'auth') {
      const action = segments[1];
      if (action === 'google' && segments.length === 2 && req.method === 'GET') {
        try {
          return await beginGoogleLogin(req, res, url.searchParams.get('returnTo'));
        } catch (error) {
          if (error.status !== 503) throw error;
          res.statusCode = 302;
          res.setHeader('Location', '/login?error=google_not_configured');
          return res.end();
        }
      }
      if (action === 'google' && segments[2] === 'callback' && req.method === 'GET') {
        if (url.searchParams.has('error')) {
          res.statusCode = 302;
          res.setHeader('Location', '/login?error=google_failed');
          return res.end();
        }
        try {
          return await finishGoogleLogin(
            req,
            res,
            url.searchParams.get('code'),
            url.searchParams.get('state')
          );
        } catch (error) {
          console.error('Google sign-in failed:', error);
          res.statusCode = 302;
          res.setHeader('Location', `/login?error=${encodeURIComponent(error.status === 403 ? 'account_not_invited' : 'google_failed')}`);
          return res.end();
        }
      }

      if (action === 'me' && req.method === 'GET') {
        return sendJson(res, 200, { user: await currentUser(req) });
      }
      if (req.method !== 'POST') {
        return sendJson(res, 405, { error: 'Method not allowed.' }, { Allow: 'GET, POST' });
      }
      const body = await readJson(req);
      if (action === 'login') return await login(req, res, body);
      if (action === 'logout') return await logout(req, res);
      if (action === 'forgot-password') {
        return sendJson(res, 200, await requestPasswordReset(body));
      }
      if (action === 'reset-password') {
        return sendJson(res, 200, await resetPassword(body));
      }
      return sendJson(res, 404, { error: 'Authentication endpoint not found.' });
    }

    if (segments[0] === 'entities' && segments.length === 3 && req.method === 'POST') {
      const body = await readJson(req);
      const user = await currentUser(req);
      const result = await handleEntityRequest({
        entity: segments[1],
        operation: segments[2],
        body,
        user,
      });
      return sendJson(res, 200, result);
    }

    return sendJson(res, 404, { error: 'API endpoint not found.' });
  } catch (error) {
    const status = Number.isInteger(error?.status) ? error.status : 500;
    if (status >= 500) console.error('API request failed:', error);
    return sendJson(
      res,
      status,
      { error: status >= 500 ? 'The server could not complete the request.' : error.message }
    );
  }
}
