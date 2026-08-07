/**
 * Gluu waitlist -> Google Sheets proxy
 *
 * Deployed as a Cloudflare Worker. Forwards each waitlist signup to a
 * Google Apps Script Web App, which appends [Email, Date, Time] to the sheet.
 * Server-to-server (Worker -> Apps Script) avoids browser CORS issues that
 * Apps Script Web Apps have when called directly from client JS.
 *
 * SETUP:
 * 1. Go to https://dash.cloudflare.com -> Workers & Pages -> your "gluu-waitlist" worker
 * 2. Paste this file in as the Worker's code (replacing the old Airtable version)
 * 3. Go to Settings -> Variables -> add:
 *      SHEETS_WEBHOOK_URL = the Apps Script Web App URL from google-apps-script.gs setup
 *    (Plain env var is fine here — it's not a secret, just an unguessable URL.)
 * 4. Deploy. The public Worker URL (gluu-waitlist.shennylaurencia-work.workers.dev)
 *    stays the same, so script.js on the site doesn't need to change.
 */

export default {
  async fetch(request, env) {
    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*', // tighten to your real domain once live, e.g. 'https://gluuapp.io'
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    }

    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    let body;
    try {
      body = await request.json();
    } catch (e) {
      return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 });
    }

    const email = (body.email || '').trim();
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
      return new Response(JSON.stringify({ error: 'Invalid email' }), {
        status: 400,
        headers: { 'Access-Control-Allow-Origin': '*' },
      });
    }

    const sheetsRes = await fetch(env.SHEETS_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
      redirect: 'follow',
    });

    if (!sheetsRes.ok) {
      const errText = await sheetsRes.text();
      return new Response(JSON.stringify({ error: 'Sheets write failed', detail: errText }), {
        status: 502,
        headers: { 'Access-Control-Allow-Origin': '*' },
      });
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*', // tighten to your real domain once live
      },
    });
  },
};
