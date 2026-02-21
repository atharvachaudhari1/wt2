const REQUIRED_ARKA_FIELDS = ['userName', 'userEmail', 'product', 'purpose', 'premiumType'];

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders() },
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders() });
    }

    if (url.pathname === '/api/health') {
      if (request.method !== 'GET') {
        return jsonResponse({ error: 'Method not allowed' }, 405);
      }
      try {
        await env.DB.prepare('SELECT 1').first();
        return jsonResponse({ status: 'ok', d1: 'connected' }, 200);
      } catch (e) {
        return jsonResponse({ status: 'error', d1: 'disconnected', message: String(e.message) }, 503);
      }
    }

    if (url.pathname === '/api/Arka-request') {
      if (request.method !== 'POST') {
        return jsonResponse({ error: 'Method not allowed' }, 405);
      }
      let body;
      try {
        body = await request.json();
      } catch (_) {
        return jsonResponse({ success: false, error: 'Invalid JSON body' }, 400);
      }
      const missing = REQUIRED_ARKA_FIELDS.filter((f) => body[f] == null || String(body[f]).trim() === '');
      if (missing.length) {
        return jsonResponse({ success: false, error: 'Missing required fields', missing }, 400);
      }
      const userName = String(body.userName).trim();
      const userEmail = String(body.userEmail).trim();
      const product = String(body.product).trim();
      const purpose = String(body.purpose).trim();
      const premiumType = String(body.premiumType).trim();
      const organisation = body.organisation != null ? String(body.organisation).trim() : null;
      const status = 'pending';
      const timestamp = body.timestamp != null ? String(body.timestamp) : new Date().toISOString();
      try {
        await env.DB.prepare(
          `INSERT INTO requests (userName, userEmail, product, purpose, organisation, premiumType, status, timestamp)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
        )
          .bind(userName, userEmail, product, purpose, organisation, premiumType, status, timestamp)
          .run();
        return jsonResponse({ success: true }, 201);
      } catch (e) {
        return jsonResponse({ success: false, error: 'Database error', message: String(e.message) }, 500);
      }
    }

    if (url.pathname === '/api/Arka-requests') {
      if (request.method !== 'GET') {
        return jsonResponse({ error: 'Method not allowed' }, 405);
      }
      try {
        const { results } = await env.DB.prepare('SELECT * FROM requests ORDER BY id DESC').all();
        return jsonResponse({ success: true, data: results }, 200);
      } catch (e) {
        return jsonResponse({ success: false, error: 'Database error', message: String(e.message) }, 500);
      }
    }

    if (url.pathname === '/api/login') {
      if (request.method !== 'POST') {
        return jsonResponse({ error: 'Method not allowed' }, 405);
      }
      let body;
      try {
        body = await request.json();
      } catch (_) {
        return jsonResponse({ success: false, message: 'Invalid JSON body' }, 400);
      }
      const email = body.email != null ? String(body.email).trim() : '';
      const password = body.password != null ? String(body.password) : '';
      if (!email || !password) {
        return jsonResponse({ success: false, message: 'Invalid credentials' }, 401);
      }
      try {
        const user = await env.DB.prepare('SELECT * FROM users WHERE email = ? AND password = ?')
          .bind(email, password)
          .first();
        if (!user) {
          return jsonResponse({ success: false, message: 'Invalid credentials' }, 401);
        }
        return jsonResponse({
          success: true,
          role: user.role,
          name: user.name,
          mentorEmail: user.mentorEmail || null
        }, 200);
      } catch (e) {
        return jsonResponse({ success: false, message: 'Database error: ' + String(e.message) }, 500);
      }
    }

    return new Response('Not Found', { status: 404, headers: { ...corsHeaders() } });
  },
};
