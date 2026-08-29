const axios = require('axios');
const fs = require('fs');

module.exports = async (req, res) => {
  try {
    const OMNI_MOCK = process.env.OMNI_MOCK === 'true' || process.env.REACT_APP_DEMO === 'true';
    if (OMNI_MOCK) {
      // serve mock data from db file
      const db = JSON.parse(fs.readFileSync('./db/omniroute-db.json', 'utf8'));
      // Simple passthrough mock: route by id or return all
      if (req.method === 'GET') {
        const id = req.query && req.query.id;
        if (id) {
          const item = db.routes.find(r => String(r.id) === String(id));
          return res.status(200).json(item || {});
        }
        return res.status(200).json(db.routes);
      }

      if (req.method === 'POST') {
        // echo back with a new id
        const payload = req.body || {};
        payload.id = (db.routes.length ? db.routes[db.routes.length-1].id + 1 : 1);
        return res.status(201).json(payload);
      }
    }

    const OMNI_BASE = process.env.OMNI_BASE_URL;
    const OMNI_KEY = process.env.OMNIROUTE_API_KEY;

    if (!OMNI_BASE) return res.status(500).json({ error: 'Missing OMNI_BASE_URL or running in mock mode' });

    const url = `${OMNI_BASE}${req.url.replace(/^\/api\/omniroute/, '')}`; // map /api/omniroute/... -> OMNI_BASE/...

    const axiosConfig = {
      method: req.method,
      url,
      headers: {
        'Content-Type': 'application/json',
        ...(OMNI_KEY ? { Authorization: `Bearer ${OMNI_KEY}` } : {})
      },
      data: req.body
    };

    const r = await axios(axiosConfig);
    res.status(r.status).json(r.data);
  } catch (err) {
    console.error('OmniRoute proxy error', err?.response?.data || err.message);
    res.status(err.response?.status || 500).json({ error: err?.response?.data || 'proxy error' });
  }
};