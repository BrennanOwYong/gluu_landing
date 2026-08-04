/**
 * Gluu waitlist -> Airtable proxy
 *
 * Deploy this as a Cloudflare Worker (free tier is plenty for a waitlist).
 * It exists so the Airtable API token never has to live in the browser.
 *
 * SETUP:
 * 1. Go to https://dash.cloudflare.com -> Workers & Pages -> Create -> Worker
 * 2. Paste this file in as the Worker's code
 * 3. Go to Settings -> Variables -> add these as *encrypted* environment variables:
 *      AIRTABLE_TOKEN   = your Personal Access Token (never put this in code)
 *      AIRTABLE_BASE_ID = appXXXXXXXXXXXXXX
 *      AIRTABLE_TABLE   = Waitlist
 * 4. Deploy. Copy the worker's URL (looks like https://gluu-waitlist.yourname.workers.dev)
 * 5. Put that URL into script.js where WAITLIST_ENDPOINT is defined
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

    const airtableRes = await fetch(
      `https://api.airtable.com/v0/${env.AIRTABLE_BASE_ID}/${encodeURIComponent(env.AIRTABLE_TABLE)}`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${env.AIRTABLE_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fields: {
            Email: email,
            Source: 'Landing Page',
          },
        }),
      }
    );

    if (!airtableRes.ok) {
      const errText = await airtableRes.text();
      return new Response(JSON.stringify({ error: 'Airtable write failed', detail: errText }), {
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
