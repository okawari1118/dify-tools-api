// Vercel Serverless Function format
export default async function handler(req, res) {
  // CORS settings
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const axios = (await import('axios')).default;
  const http = axios.create({ timeout: 5000 }); // 5秒タイムアウト

  const checkLink = async (url) => {
    try {
      const response = await http.head(url, { headers: { 'User-Agent': 'dify-link-checker/1.0' } });
      return { url, status: response.status, statusText: response.statusText };
    } catch (error) {
      if (error.response) {
        return { url, status: error.response.status, statusText: error.response.statusText };
      } else {
        return { url, status: 'Error', statusText: error.code || 'Timeout or Network Error' };
      }
    }
  };

  const { links } = req.body;
  if (!links || !Array.isArray(links)) {
    return res.status(400).json({ error: 'An array of links is required' });
  }

  const results = await Promise.all(links.map(checkLink));
  const issues = results.filter(r => r.status < 200 || r.status >= 400);

  res.status(200).json({
    total_checked: results.length,
    issues_found: issues.length,
    issues: issues
  });
}