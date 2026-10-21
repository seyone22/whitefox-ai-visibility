import http from 'http';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3000;

// Configurable Credentials
const CLIENT_PIN = (process.env.CLIENT_PIN || '2026').trim();
const INTERNAL_PIN = (process.env.INTERNAL_PIN || '9418').trim();
const SESSION_SECRET = (process.env.SESSION_SECRET || 'uprise-geo-auth-secret-key-2026').trim();

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon'
};

function signToken(role) {
  const hmac = crypto.createHmac('sha256', SESSION_SECRET).update(role).digest('hex');
  return `${role}.${hmac}`;
}

function verifyToken(token) {
  if (!token || typeof token !== 'string') return null;
  const [role, hmac] = token.split('.');
  if (!role || !hmac) return null;
  if (role !== 'client' && role !== 'internal') return null;
  const expectedHmac = crypto.createHmac('sha256', SESSION_SECRET).update(role).digest('hex');
  if (crypto.timingSafeEqual(Buffer.from(hmac), Buffer.from(expectedHmac))) {
    return role;
  }
  return null;
}

function parseCookies(req) {
  const list = {};
  const rc = req.headers.cookie;
  if (!rc) return list;
  rc.split(';').forEach(cookie => {
    const parts = cookie.split('=');
    const key = parts.shift().trim();
    const val = decodeURI(parts.join('='));
    list[key] = val;
  });
  return list;
}

function renderPinGateHtml(target = '/') {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>Private page</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    background-color: #FFFFFF;
    color: #111827;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    padding: 24px;
    -webkit-font-smoothing: antialiased;
  }
  .container {
    max-width: 440px;
    width: 100%;
    text-align: left;
  }
  h1 {
    font-size: 36px;
    font-weight: 700;
    letter-spacing: -0.025em;
    color: #111827;
    margin-bottom: 12px;
    line-height: 1.2;
  }
  p.subtitle {
    font-size: 16px;
    color: #4B5563;
    line-height: 1.5;
    margin-bottom: 32px;
  }
  label {
    display: block;
    font-size: 14px;
    font-weight: 600;
    color: #374151;
    margin-bottom: 8px;
  }
  .input-wrapper {
    position: relative;
    width: 100%;
    margin-bottom: 16px;
  }
  input[type="password"], input[type="text"] {
    width: 100%;
    background: #FFFFFF;
    border: 1px solid #D1D5DB;
    border-radius: 8px;
    padding: 12px 14px;
    font-size: 16px;
    color: #111827;
    outline: none;
    transition: border-color 0.15s ease, box-shadow 0.15s ease;
  }
  input:focus {
    border-color: #D92D20;
    box-shadow: 0 0 0 3px rgba(217, 45, 32, 0.2);
  }
  input.error {
    border-color: #EF4444;
    box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.15);
  }
  .btn-continue {
    width: 100%;
    background: #111827;
    color: #FFFFFF;
    border: none;
    border-radius: 8px;
    padding: 12px 16px;
    font-size: 15px;
    font-weight: 600;
    cursor: pointer;
    transition: background-color 0.15s ease;
  }
  .btn-continue:hover {
    background: #1F2937;
  }
  .btn-continue:active {
    background: #000000;
  }
  .error-text {
    color: #EF4444;
    font-size: 13px;
    margin-top: 8px;
    display: none;
  }
  .footer {
    margin-top: 40px;
    font-size: 13px;
    color: #9CA3AF;
  }
</style>
</head>
<body>
  <div class="container">
    <h1>Private page</h1>
    <p class="subtitle">This page is shared privately by Uprise Digital. Enter the access code you were sent.</p>
    
    <form id="accessForm" autocomplete="off">
      <label for="accessCode">Access code</label>
      <div class="input-wrapper">
        <input type="password" id="accessCode" name="accessCode" autofocus required autocomplete="off" />
        <div id="errorText" class="error-text"></div>
      </div>
      <button type="submit" class="btn-continue" id="submitBtn">Continue</button>
    </form>

    <div class="footer">Uprise Digital · Confidential</div>
  </div>

  <script>
    const form = document.getElementById('accessForm');
    const input = document.getElementById('accessCode');
    const errorText = document.getElementById('errorText');
    const submitBtn = document.getElementById('submitBtn');
    const targetUrl = ${JSON.stringify(target)};

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const pin = input.value.trim();
      if (!pin) return;

      submitBtn.disabled = true;
      submitBtn.textContent = 'Verifying...';
      input.classList.remove('error');
      errorText.style.display = 'none';

      try {
        const res = await fetch('/api/verify-pin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pin, target: targetUrl })
        });
        const data = await res.json();
        if (data.success) {
          submitBtn.textContent = 'Redirecting...';
          window.location.href = data.redirect || '/';
        } else {
          showError(data.error || 'Incorrect access code.');
        }
      } catch (err) {
        showError('Unable to connect. Please try again.');
      }
    });

    function showError(msg) {
      input.classList.add('error');
      errorText.textContent = msg;
      errorText.style.display = 'block';
      submitBtn.disabled = false;
      submitBtn.textContent = 'Continue';
      input.value = '';
      input.focus();
    }
  </script>
</body>
</html>`;
}

function renderForbiddenHtml() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>Private page</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    background-color: #FFFFFF;
    color: #111827;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    padding: 24px;
    -webkit-font-smoothing: antialiased;
  }
  .container {
    max-width: 440px;
    width: 100%;
    text-align: left;
  }
  h1 {
    font-size: 36px;
    font-weight: 700;
    letter-spacing: -0.025em;
    color: #111827;
    margin-bottom: 12px;
    line-height: 1.2;
  }
  p.subtitle {
    font-size: 16px;
    color: #4B5563;
    line-height: 1.5;
    margin-bottom: 24px;
  }
  .btn-continue {
    display: inline-block;
    text-align: center;
    background: #111827;
    color: #FFFFFF;
    text-decoration: none;
    border: none;
    border-radius: 8px;
    padding: 12px 16px;
    font-size: 15px;
    font-weight: 600;
    cursor: pointer;
    width: 100%;
    transition: background-color 0.15s ease;
    margin-bottom: 12px;
  }
  .btn-continue:hover { background: #1F2937; }
  .btn-secondary {
    display: inline-block;
    text-align: center;
    background: #F3F4F6;
    color: #374151;
    text-decoration: none;
    border: 1px solid #E5E7EB;
    border-radius: 8px;
    padding: 12px 16px;
    font-size: 14px;
    font-weight: 600;
    width: 100%;
  }
  .btn-secondary:hover { background: #E5E7EB; }
  .footer {
    margin-top: 40px;
    font-size: 13px;
    color: #9CA3AF;
  }
</style>
</head>
<body>
  <div class="container">
    <h1>Private page</h1>
    <p class="subtitle">This section is restricted to internal team members. Your access code does not have permission to view this page.</p>
    <a href="/" class="btn-continue">← Return to presentation</a>
    <a href="/logout" class="btn-secondary">Enter different access code</a>
    <div class="footer">Uprise Digital · Confidential</div>
  </div>
</body>
</html>`;
}

const server = http.createServer((req, res) => {
  let reqPath = req.url.split('?')[0];
  const cookies = parseCookies(req);
  const role = verifyToken(cookies.uprise_auth || cookies.pulp_auth);

  // 1. Static Assets Allowed Without Authentication
  const isPublicAsset = reqPath === '/deck.css' || reqPath === '/deck.js' || reqPath === '/logo.svg' || reqPath === '/favicon.ico';
  if (isPublicAsset) {
    const assetPath = path.join(__dirname, reqPath);
    if (fs.existsSync(assetPath) && fs.statSync(assetPath).isFile()) {
      const ext = path.extname(assetPath).toLowerCase();
      res.writeHead(200, {
        'Content-Type': MIME[ext] || 'application/octet-stream',
        'Cache-Control': 'public, max-age=86400',
        'X-Robots-Tag': 'noindex, nofollow, noarchive'
      });
      fs.createReadStream(assetPath).pipe(res);
      return;
    }
  }

  // 2. Authentication API Endpoint
  if (req.method === 'POST' && reqPath === '/api/verify-pin') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const { pin, target } = JSON.parse(body || '{}');
        const trimmed = (pin || '').trim();

        if (trimmed === INTERNAL_PIN) {
          const token = signToken('internal');
          res.writeHead(200, {
            'Content-Type': 'application/json',
            'Set-Cookie': `uprise_auth=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000`,
            'X-Robots-Tag': 'noindex, nofollow, noarchive'
          });
          res.end(JSON.stringify({ success: true, role: 'internal', redirect: target || '/' }));
          return;
        }

        if (trimmed === CLIENT_PIN) {
          const token = signToken('client');
          res.writeHead(200, {
            'Content-Type': 'application/json',
            'Set-Cookie': `uprise_auth=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000`,
            'X-Robots-Tag': 'noindex, nofollow, noarchive'
          });
          res.end(JSON.stringify({ success: true, role: 'client', redirect: (target === '/technical' ? '/' : (target || '/')) }));
          return;
        }

        res.writeHead(401, {
          'Content-Type': 'application/json',
          'X-Robots-Tag': 'noindex, nofollow, noarchive'
        });
        res.end(JSON.stringify({ success: false, error: 'Incorrect access code.' }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'Invalid payload.' }));
      }
    });
    return;
  }

  // 3. Logout Endpoint
  if (reqPath === '/logout') {
    res.writeHead(302, {
      'Location': '/',
      'Set-Cookie': 'uprise_auth=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0',
      'X-Robots-Tag': 'noindex, nofollow, noarchive'
    });
    res.end();
    return;
  }

  // 4. Gatekeeper Challenge for Unauthenticated Requests
  if (!role) {
    res.writeHead(200, {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'X-Robots-Tag': 'noindex, nofollow, noarchive'
    });
    res.end(renderPinGateHtml(reqPath));
    return;
  }

  // 5. Route: Tier 2 Technical Dossier (/technical)
  if (reqPath === '/technical' || reqPath === '/technical.html') {
    if (role !== 'internal') {
      res.writeHead(403, {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'X-Robots-Tag': 'noindex, nofollow, noarchive'
      });
      res.end(renderForbiddenHtml());
      return;
    }

    const techFile = path.join(__dirname, 'technical.html');
    if (fs.existsSync(techFile)) {
      let html = fs.readFileSync(techFile, 'utf8');
      const switcherHtml = `
        <div style="position:fixed;top:16px;right:20px;z-index:9999;display:flex;gap:8px;align-items:center;">
          <a href="/" style="background:#0A0A0A;color:#FFFFFF;padding:8px 14px;border-radius:6px;font-size:12px;font-weight:600;text-decoration:none;box-shadow:0 2px 8px rgba(0,0,0,0.15);border:1px solid #374151;">← Client Deck</a>
          <a href="/logout" style="background:#FFFFFF;color:#6B7280;padding:8px 10px;border-radius:6px;font-size:12px;text-decoration:none;box-shadow:0 2px 8px rgba(0,0,0,0.08);border:1px solid #E5E7EB;">Lock</a>
        </div>
      </body>`;
      html = html.replace('</body>', switcherHtml);
      res.writeHead(200, {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'X-Robots-Tag': 'noindex, nofollow, noarchive'
      });
      res.end(html);
      return;
    }
  }

  // 6. Route: Tier 1 Client Presentation (/)
  if (reqPath === '/' || reqPath === '/index.html') {
    const indexFile = path.join(__dirname, 'index.html');
    if (fs.existsSync(indexFile)) {
      let html = fs.readFileSync(indexFile, 'utf8');
      
      // Inject technical switcher only for internal authenticated users
      if (role === 'internal') {
        const switcherHtml = `
          <div style="position:fixed;top:16px;right:20px;z-index:9999;display:flex;gap:8px;align-items:center;">
            <a href="/technical" style="background:#9A7B3E;color:#FFFFFF;padding:8px 14px;border-radius:6px;font-size:12px;font-weight:700;text-decoration:none;box-shadow:0 2px 8px rgba(0,0,0,0.2);border:1px solid #7A5F2B;">Technical Dossier →</a>
            <a href="/logout" style="background:#FFFFFF;color:#6B7280;padding:8px 10px;border-radius:6px;font-size:12px;text-decoration:none;box-shadow:0 2px 8px rgba(0,0,0,0.08);border:1px solid #E5E7EB;">Lock</a>
          </div>
        </body>`;
        html = html.replace('</body>', switcherHtml);
      }

      res.writeHead(200, {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'X-Robots-Tag': 'noindex, nofollow, noarchive'
      });
      res.end(html);
      return;
    }
  }

  // Fallback 404
  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not Found');
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Uprise Digital Platform running on http://0.0.0.0:${PORT}`);
});
