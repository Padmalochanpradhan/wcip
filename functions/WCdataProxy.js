const https = require('https');
const http  = require('http');

/*
  Lambda: WCdataProxy-prod
  Input:  { url: string }   — any public HTTPS/HTTP URL
  Output: the parsed JSON response from that URL

  Acts as a server-side proxy so the browser never hits
  external APIs directly (avoids CORS issues).
  Only call public, read-only URLs through this proxy.
*/

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json'
};

function fetchUrl(rawUrl) {
  return new Promise((resolve, reject) => {
    const parsed  = new URL(rawUrl);
    const client  = parsed.protocol === 'https:' ? https : http;
    const options = {
      hostname: parsed.hostname,
      path:     parsed.pathname + parsed.search,
      method:   'GET',
      headers:  { 'Accept': 'application/json', 'User-Agent': 'WCIP-DataProxy/1.0' }
    };

    const req = client.request(options, (res) => {
      let raw = '';
      res.on('data', chunk => { raw += chunk; });
      res.on('end', () => {
        try {
          resolve({ statusCode: res.statusCode, data: JSON.parse(raw) });
        } catch {
          resolve({ statusCode: res.statusCode, data: raw });
        }
      });
    });

    req.on('error', reject);
    req.setTimeout(25000, () => { req.destroy(); reject(new Error('Request timed out')); });
    req.end();
  });
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: CORS, body: '' };
  }

  let body;
  try {
    if (typeof event.body === 'string')                    body = JSON.parse(event.body);
    else if (event.body && typeof event.body === 'object') body = event.body;
    else                                                   body = event;
  } catch {
    return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Invalid JSON' }) };
  }

  const { url } = body;
  if (!url) {
    return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'url is required' }) };
  }

  // Safety: only allow HTTPS public endpoints
  if (!url.startsWith('https://')) {
    return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Only HTTPS URLs are allowed' }) };
  }

  try {
    const { statusCode, data } = await fetchUrl(url);

    if (statusCode !== 200) {
      return {
        statusCode: 502,
        headers: CORS,
        body: JSON.stringify({ error: `Upstream returned ${statusCode}`, detail: data })
      };
    }

    return {
      statusCode: 200,
      headers: CORS,
      body: JSON.stringify(data)
    };
  } catch (err) {
    console.error('WCdataProxy error:', err.message);
    return {
      statusCode: 500,
      headers: CORS,
      body: JSON.stringify({ error: err.message })
    };
  }
};
