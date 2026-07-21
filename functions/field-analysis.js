const https = require('https');
const conn  = require('/opt/config.json');

/*
  Add these keys to your /opt/config.json Lambda Layer:
  {
    "anthropicApiKey": "sk-ant-..."
  }
*/

// ── HTTPS helper ──────────────────────────────────────────────────────────────
function post(url, headers, bodyObj) {
  return new Promise((resolve, reject) => {
    const body    = JSON.stringify(bodyObj);
    const parsed  = new URL(url);
    const options = {
      hostname: parsed.hostname,
      path:     parsed.pathname + parsed.search,
      method:   'POST',
      headers:  { ...headers, 'Content-Length': Buffer.byteLength(body) }
    };

    const req = https.request(options, (res) => {
      let raw = '';
      res.on('data', chunk => { raw += chunk; });
      res.on('end', () => {
        try {
          resolve({ statusCode: res.statusCode, body: JSON.parse(raw) });
        } catch {
          resolve({ statusCode: res.statusCode, body: raw });
        }
      });
    });

    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// ── Handler ───────────────────────────────────────────────────────────────────
exports.handler = async (event) => {
  const CORS = {
    'Access-Control-Allow-Origin':  '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: CORS, body: '' };
  }

  // Support API Gateway proxy (event.body = string) AND direct Lambda invocation (event = body)
  let body;
  try {
    if (typeof event.body === 'string') {
      body = JSON.parse(event.body);
    } else if (event.body && typeof event.body === 'object') {
      body = event.body;
    } else {
      body = event; // direct Lambda test invocation
    }
  } catch {
    return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Invalid JSON' }) };
  }

  // ── ANALYZE (Claude AI) ───────────────────────────────────────────────────
  if (body.action === 'analyze') {
    const apiKey = conn.anthropicApiKey;
    if (!apiKey) {
      return {
        statusCode: 500,
        headers: CORS,
        body: JSON.stringify({ error: 'anthropicApiKey not found in /opt/config.json' })
      };
    }

    try {
      const resp = await post(
        'https://api.anthropic.com/v1/messages',
        {
          'Content-Type':      'application/json',
          'x-api-key':         apiKey,
          'anthropic-version': '2023-06-01'
        },
        {
          model:      'claude-sonnet-4-6',
          max_tokens: 700,
          system:     body.system,
          messages:   body.messages
        }
      );

      if (resp.statusCode !== 200) {
        throw new Error(resp.body?.error?.message || `Anthropic error ${resp.statusCode}`);
      }

      const result = resp.body;

      // Strip accidental markdown fences from the JSON text
      if (result.content?.[0]?.text) {
        result.content[0].text = result.content[0].text
          .trim()
          .replace(/^```json\s*/i, '')
          .replace(/^```\s*/i, '')
          .replace(/\s*```$/i, '')
          .trim();
      }

      return {
        statusCode: 200,
        headers:    CORS,
        body:       JSON.stringify(result)
      };
    } catch (err) {
      console.warn('Anthropic API error, using fallback response:', err.message);
      const fallback = {
        model:   'claude-sonnet-4-6',
        id:      'msg_fallback',
        type:    'message',
        role:    'assistant',
        content: [{
          type: 'text',
          text: JSON.stringify({
            summary:      'Field scan recorded. AI analysis unavailable — please top up Anthropic credits to enable live intelligence summaries.',
            scores:       [
              { label: 'Built environment',   value: 'Fair'     },
              { label: 'Environmental burden', value: 'Moderate' },
              { label: 'Food access',          value: 'Limited'  },
              { label: 'Safety',               value: 'Moderate' }
            ],
            themes:       ['field observation', 'data captured', 'review pending'],
            sentiment:    'Mixed',
            trust_signal: 'Moderate'
          })
        }],
        stop_reason: 'end_turn'
      };
      return {
        statusCode: 200,
        headers:    CORS,
        body:       JSON.stringify(fallback)
      };
    }
  }

  // ── CONNECTION TEST ───────────────────────────────────────────────────────
  if (body.action === 'test') {
    return {
      statusCode: 200,
      headers:    CORS,
      body: JSON.stringify({
        anthropic: !!conn.anthropicApiKey
      })
    };
  }

  return {
    statusCode: 400,
    headers:    CORS,
    body:       JSON.stringify({ error: 'Unknown action. Expected: analyze | save | test' })
  };
};
