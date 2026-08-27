import { extractMediaForDownload } from '../server/mediaDownloadService';

export const config = {
  maxDuration: 60,
};

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    let url = '';
    if (req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
      url = body.url || '';
    } else {
      url = req.query?.url || '';
    }

    if (!url || typeof url !== 'string') {
      return res.status(400).json({ error: 'Missing or invalid url parameter' });
    }

    const result = await extractMediaForDownload(url);
    if (!result.success) {
      return res.status(422).json(result);
    }
    return res.json(result);
  } catch (err: any) {
    console.error('[Vercel API /api/download-detect Error]:', err);
    return res.status(500).json({ error: err?.message || 'Failed to extract download formats' });
  }
}
