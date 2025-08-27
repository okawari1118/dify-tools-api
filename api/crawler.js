// Vercel Serverless Function format
export default async function handler(req, res) {
  // CORS preflight request handling for browsers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // DifyからのPOSTリクエストを処理
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // ライブラリのインポート
  const axios = await import('axios');
  const cheerio = await import('cheerio');

  const { url, username, password } = req.body;

  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  try {
    const config = {};
    if (username && password) {
      config.auth = { username, password };
    }

    const { data: html } = await axios.default.get(url, config);
    const $ = cheerio.load(html);

    // 不要な要素を削除してからテキストを取得
    $('script, style, nav, header, footer, aside').remove();
    const text = $('body').text().replace(/\s\s+/g, ' ').trim();

    const links = new Set(); // 重複を避ける
    $('a').each((i, element) => {
      const href = $(element).attr('href');
      if (href) {
        try {
          const absoluteUrl = new URL(href, url).href;
          links.add(absoluteUrl);
        } catch (e) {
          // ignore invalid URLs
        }
      }
    });

    res.status(200).json({
      text: text.substring(0, 8000), // 長すぎるテキストをカット
      links: Array.from(links)
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to crawl the page', details: error.message });
  }
}